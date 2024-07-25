// commonDal.js
const { v4: uuidv4 } = require("uuid");
let sequelize;
let mongoose;

async function createTableIfNotExists(tableDef, tableName = null) {
  sequelize = sequelize || require("../../config/sql").sequelize;

  try {
    await sequelize.query(tableDef, { raw: true });
    console.log(`Table ${tableName} checked and created if not existing.`);
  } catch (error) {
    console.error(`Error creating table ${tableName}:`, error);
    throw error;
  }
}

async function performDatabaseOperation(params) {
  let { operation, methods } = params;
  let sequelizeTransaction;
  let mongoSession;

  // Check for the PRIMARYDB environment variable outside the map function
  const primaryDbMethod = process.env.PRIMARYDB || null;
  if (!primaryDbMethod)
    console.error(
      "Primary DB Method (PRIMARYDB) missing in environment variables. Must be mongoDb or sequelize."
    );

  try {
    // Dynamically require Sequelize if a Sequelize method is provided
    if (methods.some((method) => method.method === "sequelize")) {
      sequelize = sequelize || require("../../config/sql").sequelize;
      if (["create", "update", "delete"].includes(operation)) {
        sequelizeTransaction = await sequelize.transaction();
      }
    }

    // Dynamically require Mongoose if a MongoDB method is provided
    if (methods.some((method) => method.method === "mongoDb")) {
      mongoose = mongoose || require("mongoose");
      if (["create", "update", "delete"].includes(operation)) {
        mongoSession = await mongoose.startSession();
        mongoSession.startTransaction();
      }
    }

    // Start a new transaction for Sequelize if needed
    if (["create", "update", "delete"].includes(operation)) {
      sequelizeTransaction = await sequelize.transaction();
    }

    // Start a new session for MongoDB if needed
    if (["create", "update", "delete"].includes(operation)) {
      mongoSession = await mongoose.startSession();
      mongoSession.startTransaction();
    }

    // Execute the specified operations on the provided models
    const operationPromises = methods.map(async (method) => {
      if (!method.model) {
        throw new Error(`Model not defined for method: ${method.method}`);
      }

      if ((operation === "readOne" || operation === "readMany") && primaryDbMethod !== method.method) {
        return Promise.resolve(null); // Skip non-primary database read operations
      }

      switch (operation) {
        case "create":
          if (method.method === "sequelize") {
            //For sequelize, turn the objects array into data:objects array
            let localData = method.data.map((row) => {
              return { data: row };
            });

            //Create all the inserts in the transaction
            //Because of the schema validation, bulkCreate does not work here, so creates are added as transactions and committed at the end
            const createPromises = localData.map((data) =>
              method.model.create(data, { transaction: sequelizeTransaction })
            );

            // Await all the create promises
            const results = await Promise.all(createPromises);
            return results;
          } else if (method.method === "mongoDb") {
            return method.model.insertMany(method.data, {
              session: mongoSession,
            });
          }
          break;
        case "readOne":
          // Implement read logic for Sequelize or MongoDB
          if (method.method === "sequelize") {
            return method.model.findOne({ where: method.criteria });
          } else if (method.method === "mongoDb") {
            return method.model.findOne(method.criteria);
          }
          break;
        case "readMany":
          // Implement read logic for Sequelize or MongoDB
          if (method.method === "sequelize") {
            return method.model.findAll({ where: method.criteria });
          } else if (method.method === "mongoDb") {
            return method.model.find(method.criteria);
          }
          break;

        case "update":
          // Implement update logic for Sequelize or MongoDB
          if (method.method === "sequelize") {
            return method.model.update(method.data, {
              where: method.criteria,
              transaction: sequelizeTransaction,
            });
          } else if (method.method === "mongoDb") {
            return method.model.updateMany(
              method.criteria,
              { $set: method.data },
              { session: mongoSession }
            );
          }
          break;
        case "delete":
          // Execute delete logic for Sequelize or MongoDB
          if (method.method === "sequelize") {
            return method.model.destroy({
              where: method.criteria,
              transaction: sequelizeTransaction,
            });
          } else if (method.method === "mongoDb") {
            return method.model.deleteMany(method.criteria, {
              session: mongoSession,
            });
          }
          break;
        default:
          throw new Error(`Unsupported operation: ${operation}`);
      }
    });

    // Wait for all operation promises to resolve
    const operationResults = await Promise.all(operationPromises);

    // Commit the transactions if they exist
    if (sequelizeTransaction) {
      await sequelizeTransaction.commit();
    }
    if (mongoSession) {
      await mongoSession.commitTransaction();
    }

    // Return the results of the primary database operation
    // console.log('operationResults', operationResults)
    // const primaryResult = operationResults.find(
    //   (result) => result.method === process.env.PRIMARYDB
    // );

    const nonNullResults = operationResults.filter((result) => result !== null);

    // Flatten the array of results if necessary
    if (primaryDbMethod == "sequelize") {
      const flattenedResults = extractDataFromSequelizeInstances(nonNullResults)
      return flattenedResults;
    }

    if (primaryDbMethod == "mongoDb") {
      const flattenedResults = nonNullResults.flatMap((result) =>
        Array.isArray(result) ? result : [result]
      );
      return flattenedResults;
    }


  } catch (error) {
    // Rollback the transactions if they exist
    if (sequelizeTransaction) {
      await sequelizeTransaction.rollback();
    }
    if (mongoSession) {
      await mongoSession.abortTransaction();
    }
    console.error(`Error performing ${operation}:`, error);
    throw error;
  } finally {
    // End the MongoDB session
    if (mongoSession) {
      mongoSession.endSession();
    }
  }
}

function extractDataFromSequelizeInstances(results) {
  return results.map(instance => {
    // Check if instance is a Sequelize model instance with dataValues
    if (instance && instance.dataValues && 'data' in instance.dataValues) {
      // Parse the JSON string into an object if it's not already parsed
      const data = instance.dataValues.data;
      return typeof data === 'string' ? JSON.parse(data) : data;
    }
    return null; // Return null if the expected properties are not found
  }).filter(item => item !== null); // Filter out null values from the result
}

module.exports = {
  performDatabaseOperation,
  createTableIfNotExists,
};
