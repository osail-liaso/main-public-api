const Seq = require("../models/sql/Account");
const Mon = require("../models/mongo/documents/Account");

const { sequelize } = require("../config/sql");

const PRIMARYDB = process.env.PRIMARYDB; // 'MONGODB' or 'SEQUELIZE'

async function createAccounts(accountsData) {
  try {
    // Ensure accountsData is always treated as an array
    let accountsArray = Array.isArray(accountsData) ? accountsData : [accountsData];

    // Initialize an array to hold promises for the write operations
    let writePromises = [];

    // Write to MongoDB if the model is defined
    if (Mon) {
      const mongoPromise = Mon.insertMany(accountsArray);
      writePromises.push(mongoPromise);
    }

    // Write to Sequelize if the model is defined
    if (Seq) {
      const sequelizePromise = sequelize.transaction(async (t) => {
        return Promise.all(
          accountsArray.map((item) =>
            Seq.create({ data: item }, { transaction: t })
          )
        );
      });
      writePromises.push(sequelizePromise);
    }

    // Wait for all write promises to resolve
    const writeResults = await Promise.all(writePromises);

    // Decide which database results to return based on the PRIMARYDB environment variable
    if (PRIMARYDB === 'SEQUELIZE' && Seq) {
      // Assuming sequelizeResults are already in the desired format
      return writeResults.find(result => Array.isArray(result)).map((model) => model.get({ plain: true }));
    } else if (PRIMARYDB === 'MONGODB' && Mon) {
      // Assuming mongoResults are already in the desired format
      return writeResults.find(result => Array.isArray(result));
    } else {
      // If PRIMARYDB is not set or the primary database model is not defined, default to the available database
      return writeResults[0];
    }
  } catch (error) {
    console.error("Error creating accounts:", error);
    throw error;
  }
}

module.exports = {
    createAccounts,
    // ... other exported functions
  };
