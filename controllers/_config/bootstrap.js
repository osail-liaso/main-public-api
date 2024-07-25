const { v4: uuidv4 } = require("uuid");
const bcrypt = require("bcrypt");
const { createJWT } = require("../../middleware/verify");
const { createAccounts } = require("../../dal/accountsDal");
const { createPersonas } = require("../../dal/personasDal");
const { createModels, getModelByProviderAndName } = require("../../dal/modelsDal");




// Import the DAL functions
const {
  performDatabaseOperation,
  createTableIfNotExists,
} = require("../../dal/common/commonDal");

// Call this function when your app starts to ensure the table is created
//IF USING SEQUELIZE
try {
  const accountTableDef = require("../../models/sql/Account").tableDef;
  (async () => {
    await createTableIfNotExists(accountTableDef, "Accounts");
  })();
} catch (error) {
  console.error("Sequelize model tableDef not found:", error);
}

//Create the methods array. Use whichever method you prefer in your app
function createMethodsArray(data, criteria) {
  let sequelizeModel, sequelizeTableDef, mongoDbModel;

  //IF USING SEQUELIZE
  try {
    const sequelizeAccount = require("../../models/sql/Account");
    sequelizeModel = sequelizeAccount.Account;
    sequelizeTableDef = sequelizeAccount.tableDef;
  } catch (error) {
    console.error("Sequelize model could not be loaded:", error);
    sequelizeModel = null;
    sequelizeTableDef = null;
  }

  //IF USING MONGODB
  try {
    mongoDbModel = require("../../models/mongo/documents/Account");
  } catch (error) {
    console.error("MongoDB model could not be loaded:", error);
    mongoDbModel = null;
  }

  return [
    //IF USING SEQUELIZE
    {
      name: "Account",
      method: "sequelize",
      model: sequelizeModel,
      tableDef: sequelizeTableDef,
      data: data,
      criteria: criteria,
    },
    //IF USING MONGODB
    {
      name: "Account",
      method: "mongoDb",
      model: mongoDbModel,
      data: data,
      criteria: criteria,
    },
  ];
}



// Accepts a new account and saves it to the database
exports.createAdminAccount = async function (req, res, next) {
  try {
    //Create Admin Password
    //Password
    let plainPassword = "strongAdminPassword" + uuidv4();
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(plainPassword, salt);

    const newAccounts = [{
      uuid: uuidv4(),
      username: "osailAdmin",
      email: "test@email.com",
      useCase: "administrator",
      notes: "default administrator account",
      preferredLng: "en",
      roles: ["admin", "user"],
      status: "active",
      subscriptionStatus: "active",
      password: hashedPassword,
      salt,
    }];

    const methods = createMethodsArray(newAccounts, null);
    const createdAccounts = await performDatabaseOperation({
      operation: "create",
      methods,
    });

    if (createdAccounts.length) {
      const newToken = createJWT(createdAccounts[0], req.fullUrl);
      res.header("auth-token", newToken.token);
      res.header("auth-token-decoded", JSON.stringify(newToken.tokenDecoded));
    }

    res.status(201).send({
      message:
        "Bootstrap initiated to create an admin account. Record this password, it is the last time it will be shown",
      payload: { username: newAccounts[0].username, password: plainPassword },
    });
  } catch (error) {
    console.error("Bootstrap error:", error);
    res.status(500).json({ message: "failure", payload: error.message });
  }
};

// Accepts a new account and saves it to the database
exports.createDefaultPersonas = async function (req, res, next) {
  try {
    const defaultPersonas = [{
      uuid: uuidv4(),
      name: { en: "Default Persona", fr: "" },
      description: {
        en: "A simple Default Persona with no starting prompt",
        fr: "",
      },
      systemPrompts: ["you are a duck"],
      userPrompts: ["make a sound"],
      status: "active",
      publishStatus: "unpublished",
    }];

    const createdPersonas = await createPersonas(defaultPersonas, 'osailAdmin');

    res.status(201).send({
      message:
        "Bootstrap initiated to create an admin account. Record this password, it is the last time it will be shown",
      payload: { personas: createdPersonas },
    });
  } catch (error) {
    console.error("Bootstrap error:", error);
    res.status(500).json({ message: "failure", payload: error });
  }
};

// Accepts a new account and saves it to the database
exports.createDefaultModels = async function (req, res, next) {
  try {
    let defaultModels = [];

    // Bootstrap a set of default models based on your configuration
    if (process.env.OPENAI_API_KEY) {
      defaultModels.push({
        uuid: uuidv4(),
        concurrentInstances: 20,
        provider: "openAi",
        maxTokens: 128000,
        per1kInput: 0.01,
        per1kOutput: 0.03,
        model: "gpt-4-1106-preview",
        name: {
          en: "OpenAI GPT-4 Turbo (128k)",
          fr: "OpenAI GPT-4 Turbo (128k)",
        },
        publishStatus: "unpublished",
        status: "active",
        owners: [],
        editors: [],
        viewers: [],
      });

      defaultModels.push({
        uuid: uuidv4(),
        concurrentInstances: 20,
        provider: "openAi",
        maxTokens: 128000,
        per1kInput: 0.01,
        per1kOutput: 0.03,
        model: "gpt-4o",
        name: { en: "OpenAI GPT-4o", fr: "OpenAI GPT-4o" },
        publishStatus: "unpublished",
        status: "active",
        owners: [],
        editors: [],
        viewers: [],
      });
    }

    if (process.env.ANTHROPIC_API_KEY) {
      defaultModels.push({
        uuid: uuidv4(),
        concurrentInstances: 5,
        provider: "anthropic",
        maxTokens: 200000,
        per1kInput: 0.003,
        per1kOutput: 0.015,
        model: "claude-3-5-sonnet-20240620",
        name: {
          en: "Anthropic Claude Sonnet 3.5",
          fr: "Anthropic Claude Sonnet 3.5",
        },
        publishStatus: "unpublished",
        status: "active",
        owners: [],
        editors: [],
        viewers: [],
      });
    }

    // ... (similar changes for other models)

    let newModels = [];
    for (const model of defaultModels) {
      const existingModel = await getModelByProviderAndName(
        model.provider,
        model.model
      );
      if (!existingModel) {
        newModels.push(model);
      }
    }

    let results = [];
    if (newModels.length > 0) {
      results = await createModels(newModels);
    }

    res
      .status(200)
      .json({
        message:
          "Bootstrapped a default list of models for you to edit or delete",
        payload: results,
      });
  } catch (error) {
    console.error("Error in bootstrapModels:", error);
    next(
      ApiError.internal(
        `An error occurred while bootstrapping Models: ${error.message}`
      )
    );
  }
};
