const Seq = require("../models/sql/Account");
const Mon = require("../models/mongo/documents/Account");
const { sequelize } = require("../config/sql");

const useSequelize = process.env.USE_SEQUELIZE === "true";
const getModel = () => {
  console.log("useSequelize:", useSequelize);
  if (useSequelize) {
    if (!Seq) {
      throw new Error("Sequelize model is not defined");
    }
    return Seq;
  } else {
    if (!Mon) {
      throw new Error("Mongoose model is not defined");
    }
    return Mon;
  }
};

async function createAccounts(accountsData) {
    try {
      const Model = getModel();
  
      if (useSequelize) {
        // Ensure accountsData is always treated as an array
        let accountsArray = Array.isArray(accountsData) ? accountsData : [accountsData];
  
        return await sequelize.transaction(async (t) => {
          const createdAccounts = await Promise.all(
            accountsArray.map((item) =>
              Model.create({ data: item }, { transaction: t }) // No need to wrap item again
            )
          );
          console.log("createdAccounts", createdAccounts);
          return createdAccounts.map((model) => model.get({ plain: true }).data);
        });
      } else {
        // For MongoDB, keep the existing logic
        return await Model.insertMany(accountsData); // Use accountsData directly
      }
    } catch (error) {
      console.error("Error creating accounts:", error);
      throw error;
    }
  }
  
// Read - Admin only
async function getAllAccounts() {
  const Model = getModel();
  if (useSequelize) {
    const account = await Model.findAll();
    return account; //? account.get({ plain: true }).data : null;
  } else {
    return await Model.find({}).lean();
  }
}

//
async function getAccountById(id) {
  const Model = getModel();
  if (useSequelize) {
    const account = await Model.findByPk(id);
    return account ? account.get({ plain: true }).data : null;
  } else {
    return await Model.findById(id).lean();
  }
}

async function getAccountByUsername(username) {
  const Model = getModel();
  if (useSequelize) {
    const account = await Model.findOne({
      where: sequelize.where(
        sequelize.fn("JSON_VALUE", sequelize.col("data"), "$.username"),
        username
      ),
    });
    return account ? account.get({ plain: true }).data : null;
  } else {
    return await Model.findOne({ username }).lean();
  }
}

// Update
async function updateAccount(id, updateData) {
  const Model = getModel();
  if (useSequelize) {
    const account = await Model.findByPk(id);
    if (!account) return null;
    const currentData = account.get({ plain: true }).data;
    const updatedData = { ...currentData, ...updateData };
    await account.update({ data: updatedData });
    return account.get({ plain: true }).data;
  } else {
    return await Model.findByIdAndUpdate(id, updateData, { new: true }).lean();
  }
}

// Delete
async function deleteAccount(id) {
  const Model = getModel();
  if (useSequelize) {
    const account = await Model.findByPk(id);
    if (!account) return false;
    await account.destroy();
    return true;
  } else {
    const result = await Model.findByIdAndDelete(id);
    return !!result;
  }
}

module.exports = {
  createAccounts,
  getAllAccounts,
  getAccountById,
  getAccountByUsername,
  updateAccount,
  deleteAccount,
};
