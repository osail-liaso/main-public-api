// commonDal.js
const { v4: uuidv4 } = require("uuid");
let sequelize = require("../../config/sql").sequelize;
let mongoose = require("mongoose"); // Make sure mongoose is required at the top

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

function createMethodsArray(data, criteria, schemas, queryLiteral = null) {
  return schemas
    .map((schema) => {
      let model = schema.model;
      let tableDef = schema.tableDef;

      console.log("schema", schema);

      // Check if the model and table definition are valid based on the method type
      if (schema.method === "sequelize" && (!model || !tableDef)) {
        console.error("Invalid Sequelize model or table definition.");
        model = null;
        tableDef = null;
      } else if (schema.method === "mongoDb" && !model) {
        console.error("Invalid MongoDB model.");
        model = null;
      } else if (schema.method !== "sequelize" && schema.method !== "mongoDb") {
        console.error(`Unsupported database method: ${schema.method}`);
        model = null;
        tableDef = null;
      }

      // Return the method configuration object
      return {
        name: schema.name || model?.modelName || "UnknownModel",
        method: schema.method,
        model: model,
        tableDef: tableDef,
        data: data,
        criteria: criteria,
        queryLiteral:queryLiteral //An override query if the method requires a specific custom query
      };
    })
    .filter((method) => method.model !== null); // Filter out methods with null models
}

async function performDatabaseOperation(params) {
  let { operation, methods } = params;
  let sequelizeTransaction;
  let mongoSession;
  let rolledBack = false;
  // Check for the PRIMARYDB environment variable
  const primaryDbMethod = process.env.PRIMARYDB || null;
  if (!primaryDbMethod) {
    console.error(
      "Primary DB Method (PRIMARYDB) missing in environment variables. Must be mongoDb or sequelize."
    );
  }

  try {
    // Start Sequelize transaction if needed
    if (methods.some((method) => method.method === "sequelize")) {
      sequelizeTransaction = await sequelize.transaction();
    }

    // Start MongoDB session if needed
    if (methods.some((method) => method.method === "mongoDb")) {
      mongoSession = await mongoose.startSession();
      await mongoSession.startTransaction();
    }

    // Execute the specified operations on the provided models
    const operationPromises = methods.map(async (method) => {
      if (!method.model) {
        throw new Error(`Model not defined for method: ${method.method}`);
      }

      if (
        (operation === "readOne" || operation === "readMany") &&
        primaryDbMethod !== method.method
      ) {
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
    // Wait for all operation promises to resolve

    // Wait for all operation promises to resolve or reject
    const operationResults = await Promise.allSettled(operationPromises);
    console.log("operationResults", operationResults)

    // Check for any rejected promises (i.e., errors during operations)
    const hasError = operationResults.some(
      (result) => result.status === "rejected"
    );
    if (hasError) {
      
      // Rollback the transactions if they exist
      if (sequelizeTransaction) {
        await sequelizeTransaction.rollback();
        rolledBack = true;
      }
      if (mongoSession) {
        await mongoSession.abortTransaction();
        rolledBack = true;
      }

      // Aggregate all errors and throw them
      const errors = operationResults
        .filter((result) => result.status === "rejected")
        .map((result) => result.reason);

      console.log(errors);
      throw new Error(
        `Errors occurred during database operations: ${errors
          .map((e) => e.message)
          .join(", ")}`
      );
    }

    // Commit the transactions if they exist and all operations were successful
    if (sequelizeTransaction) {
      await sequelizeTransaction.commit();
    }
    if (mongoSession) {
      await mongoSession.commitTransaction();
    }

    // Parse the returned of the sequelize
    if (primaryDbMethod == "sequelize") {
      //Get the promiseAll results
      return extractDataFromSequelizeInstances(operationResults);
       
    }

    if (primaryDbMethod == "mongoDb") {
      // const flattenedResults = operationResults.flatMap((result) =>
      //   Array.isArray(result) ? result : [result]
      // );
      return extractDataFromMongoDbResults(operationResults);
    }
  } catch (error) {
    console.log("Error", error);
    // Rollback the transactions if they exist
    if (sequelizeTransaction && !rolledBack) {
      await sequelizeTransaction.rollback();
    }
    if (mongoSession && !rolledBack) {
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
  // Flatten the nested arrays and filter out non-fulfilled promises or null values
  const fulfilledValues = results
    .filter(result => result.status === 'fulfilled' && result.value !== null)
    .flatMap(result => result.value);

  // Extract and parse the data property from each Sequelize model instance
  return fulfilledValues.map(instance => {
    // If instance is a Sequelize model instance with dataValues
    if (instance && instance.dataValues) {
      // Check if the 'data' property is a string and parse it if necessary
      const data = instance.dataValues.data;
      if (typeof data === 'string') {
        try {
          return JSON.parse(data);
        } catch (error) {
          console.error('Error parsing JSON from data:', error);
          return null;
        }
      } else {
        // If 'data' is already an object, return it as is
        return data;
      }
    }
    // If instance is not a Sequelize model instance, return null
    return null;
  }).filter(item => item !== null); // Filter out null values from the result
}

function extractDataFromMongoDbResults(results) {
  // Use flatMap to iterate over the results and extract the value arrays
  // from fulfilled promises, then flatten them into a single array
  const extractedData = results.flatMap(result => {
    if (result.status === 'fulfilled' && Array.isArray(result.value)) {
      // Return the array of documents directly
      return result.value;
    }
    // If the result is not fulfilled or doesn't contain an array, return an empty array
    return [];
  });

  return extractedData;
}


module.exports = {
  performDatabaseOperation,
  createTableIfNotExists,
  createMethodsArray,
};
