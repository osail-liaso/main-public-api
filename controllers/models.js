const uuidv4 = require("uuid").v4;
const ApiError = require("../error/ApiError");
const logger = require("../middleware/logger");

const { defaultModels } = require("../assets/defaultModels");

//Import the schemas and the validator function
//The validator is used to enforce the JSON structure, not the schemas.
const { validateAgainstSchema } = require("../models/joi/common/validate");

//Bring in the schemas
const ModelSchemaJoi = require("../models/joi/Model");
const tableDef = require("../models/sql/Model").tableDef;
const SchemaSql = require("../models/sql/Model").AIModel;
const SchemaMongo = require("../models/mongo/Model").Model;

//Bring in DAL functions
const {
  createTableIfNotExists,
  createMethodsArray,
  performDatabaseOperation,
} = require("../dal/common/commonDal");

const schemas = [];
if (process.env.SQL_SERVER)
  schemas.push({
    method: "sequelize",
    model: SchemaSql,
    tableDef: tableDef,
    name: "ModelSequelize",
  });

//If there is a MongoDB connection string
if (process.env.MONGODB)
  schemas.push({
    method: "mongoDb",
    model: SchemaMongo,
    name: "ModelMongoDb",
  });

// Call this function when your app starts to ensure the table is created
//IF USING SEQUELIZE CREATE THE DATABASE TABLE PRIOR TO ANY DATABASE OPERATIONS
(async () => {
  if (tableDef && process.env.SQL_SERVER) {
    try {
      await createTableIfNotExists(tableDef, "Models");
    } catch (error) {
      console.error("Failed to create table from model:", error);
    }
  }
})();

//###############################
//Controller Endpoints Below
//###############################

exports.bootstrapModels = async function (req, res, next) {
  try {
    let validationErrors = [];
    let bootstrapModels = [];

    //Pickup the models for which there is an API Key present in the .env
    //Validate they are all matching the schema definition, or capture the errors
    defaultModels.forEach((model) => {
      let validatedJson = null;
      let thisModel = null;
      if (
        (model.provider == "openAi" && process.env.OPENAI_API_KEY) ||
        (model.provider == "anthropic" && process.env.ANTHROPIC_API_KEY) ||
        (model.provider == "mistral" && process.env.MISTRAL_API_KEY) ||
        (model.provider == "groq" && process.env.GROQ_API_KEY)
      )
        thisModel = model;

      //Validate the model against the schema
      if (thisModel) {
        thisModel.uuid = uuidv4(); //Assign a uuid
        validatedJson = validateAgainstSchema(ModelSchemaJoi, thisModel);
        if (!validatedJson.error) {
          console.log(validatedJson.value);
          bootstrapModels.push(validatedJson.value);
        } else {
          console.log(validatedJson.error);
          validationErrors.push(validatedJson.error);
        }
      }
    });

    //Create the models into the database
    performDatabaseOperation({
      operation: "create",
      methods: createMethodsArray(bootstrapModels, null, schemas),
    })
      .then((results) => {
        console.log("Created Models(s)", results);
        res.status(201).send({
          message: "Bootstrap initiated to create models.",
          payload: { success: results, error: validationErrors },
        });
      })
      .catch((err) => {
        res
          .status(400)
          .json({ message: "Error bootstrapping models", payload: err });
      });
  } catch (error) {
    console.error("Error in Bootstrap Models:", error);
    next(
      ApiError.internal(
        `An error occurred while bootstrapping Models: ${error.message}`
      )
    );
  }
};

exports.getModels = async function (req, res, next) {
  //Create the models into the database
  let results = await performDatabaseOperation({
    operation: "readMany",
    methods: createMethodsArray(null, { status: "active" }, schemas),
  });

  res
    .status(200)
    .json({ message: "Models returned successfully.", payload: results });
};

exports.createModels = async function (req, res, next) {
  res.status(200).json({ message: "Models created successfully." });
};

exports.updateModels = async function (req, res, next) {
  res.status(200).json({ message: "Selected models updated successfully." });
};

exports.deleteModels = async function (req, res, next) {
  res.status(200).json({ message: "Selected models deleted successfully." });
};
