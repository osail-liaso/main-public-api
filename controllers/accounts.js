const uuidv4 = require("uuid").v4;
const ApiError = require("../error/ApiError");
const bcrypt = require("bcrypt");
const { createJWT } = require("../middleware/verify");

//Import the schemas and the validator function
//The validator is used to enforce the JSON structure, not the schemas.
const { validateAgainstSchema } = require("../models/joi/common/validate");

//Bring in the schemas to be used
const AccountSchemaJoi = require("../models/joi/Account");
const tableDef = require("../models/sql/Account").tableDef;
const SchemaSql = require("../models/sql/Account").Account;
const SchemaMongo = require("../models/mongo/Account").Account;

//Bring in DAL functions
const {
  createTableIfNotExists,
  createMethodsArray,
  performDatabaseOperation,
} = require("../dal/common/commonDal");

//DECIDE WHICH DATABASE METHODS AND SCHEMAS YOU'RE USING
//Remove one of the other, depending on your DB preferences
//Or keep them both for simultaneous sync of 2 separate DBs
const schemas = []
if(process.env.SQL_SERVER) schemas.push(
  {
    method: "sequelize",
    model: SchemaSql,
    tableDef: tableDef,
    name: "AccountSequelize",
  });

  //If there is a MongoDB connection string 
  if(process.env.MONGODB) schemas.push(
    {
    method: "mongoDb",
    model: SchemaMongo,
    name: "AccountMongoDb",
  });

// Call this function when your app starts to ensure the table is created
//IF USING SEQUELIZE CREATE THE DATABASE TABLE PRIOR TO ANY DATABASE OPERATIONS
(async () => {
  if (tableDef && process.env.SQL_SERVER) {
    try {
      await createTableIfNotExists(tableDef, "Accounts");
    } catch (error) {
      console.error("Failed to create table from model:", error);
    }
  }
})();

//###############################
//Controller Endpoints Below
//###############################

// Accepts a new account and saves it to the database
exports.bootstrapAdminAccount = async function (req, res, next) {
  try {
    //Create Admin Password
    let plainPassword = "strongAdminPassword" + uuidv4();
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(plainPassword, salt);

    //Make a new admin account
    const newAccount = {
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
    };

    //Create and save the content
    //Step 1 Validate and complete the json using Joi schema
    let validatedJson = validateAgainstSchema(AccountSchemaJoi, newAccount);
    if (!validatedJson.error) {
      //Step 2 Then create the methods array to save to the applicable DBs
      //Step 3 Then perform the database operations
      performDatabaseOperation({
        operation: "create",
        methods: createMethodsArray([validatedJson.value], null, schemas),
      })
        .then((createdAccounts) => {
          console.log("Created Account(s)", createdAccounts);
          const newToken = createJWT(newAccount, req.fullUrl);
          res.header("auth-token", newToken.token);
          res.header(
            "auth-token-decoded",
            JSON.stringify(newToken.tokenDecoded)
          );

          res.status(201).send({
            message:
              "Bootstrap initiated to create an admin account. Record this password, it is the last time it will be shown",
            payload: { username: newAccount.username, password: plainPassword },
          });
        })
        .catch((err) => {
          res.status(400).json({ message: "Query error", payload: err });
        });
    } else {
      res
        .status(400)
        .json({ message: "Validation error", payload: validatedJson.error });
    }
  } catch (error) {
    console.error("Bootstrap error:", error);
    res.status(500).json({ message: "failure", payload: error.message });
  }
};

//Controller Methods / Endpoints
exports.createNewAccount = async function (req, res, next) {
  const { username, password, password2, email, useCase, notes, preferredLng } =
    req.body;

  if (!username) {
    return res.status(400).json({ message: "noUsername", payload: null });
  }

  const existingAccount = await getAccountByUsername(username);
  if (existingAccount) {
    return res.status(400).json({ message: "userExists", payload: null });
  }

  if (!password || password.length < 8 || password !== password2) {
    return res
      .status(400)
      .json({ message: "passwordsDontMatch", payload: null });
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const newAccount = {
    uuid: uuidv4(),
    username,
    email,
    useCase,
    notes,
    preferredLng: preferredLng || "en",
    roles: ["user"],
    status: "active",
    salt,
    password: hashedPassword,
    momentCreated: new Date(),
  };

  try {
    //Create and save the content
    //Step 1 Validate and complete the json using Joi schema
    let validatedJson = validateAgainstSchema(AccountSchemaJoi, newAccount);

    //Step 2 Then create the methods array to save to the applicable DBs
    const methods = createMethodsArray(validatedJson, null, schemas);

    //Step 3 Then perform the database operations
    const createdAccount = await performDatabaseOperation({
      operation: "create",
      methods,
    });

    //Step 4 Ensure success
    if (createdAccount) {
      const newToken = createJWT(
        {
          uuid: newAccount.uuid,
          username: newAccount.username,
          roles: newAccount.roles,
          status: newAccount.status,
        },
        req.fullUrl
      );
      res.header("auth-token", newToken.token);
      res.header("auth-token-decoded", JSON.stringify(newToken.tokenDecoded));
      res.status(200).json({
        message: "success",
        payload: {
          token: newToken.token,
          tokenDecoded: newToken.tokenDecoded,
        },
      });
    } else {
      res
        .status(500)
        .json({ message: "Failed to create account.", payload: null });
    }
  } catch (error) {
    res.status(500).json({ message: "failure", payload: null });
  }
};

exports.login = async function (req, res, next) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      throw ApiError.badRequest("Username and password are required.");
    }

    const methods = createMethodsArray(null, { username: username });
    // console.log('Methods', methods)
    const accounts = await performDatabaseOperation({
      operation: "readOne",
      methods,
    });

    console.log("Accounts", accounts);
    let account = accounts[0];

    if (!account) {
      throw ApiError.notFound("Account not found.");
    }

    const passwordMatch = await bcrypt.compare(password, account.password);
    if (!passwordMatch) {
      throw ApiError.unauthorized("Incorrect password.");
    }

    const tokenInfo = {
      uuid: account.uuid,
      username: account.username,
      roles: account.roles,
      status: account.status,
    };
    const newToken = createJWT(tokenInfo, "login");
    res.header("auth-token", newToken.token);
    res.header("auth-token-decoded", JSON.stringify(newToken.tokenDecoded));
    res
      .status(200)
      .json({ message: "Login successful", token: newToken.token });
  } catch (error) {
    next(error);
  }
};

exports.getAccounts = async function (req, res, next) {};

exports.accountOwn = async function (req, res, next) {};

exports.accountOwnUpdate = async function (req, res, next) {};

exports.accountOwnDelete = async function (req, res, next) {};

// ... (keep other functions like accountOwnDataDownload, accountOwnDataUpload, accountOwnDataDelete as they are)

exports.allAccountInfo = async function (req, res, next) {};

exports.deleteAccounts = async function (req, res, next) {};
