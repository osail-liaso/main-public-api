//For Admins, use this to generate a JWT signing secret if you dont have one already
// const crypto = require('crypto');
// const secret = crypto.randomBytes(64).toString('hex');
// console.log('signing secret', secret)

//Establish local environment variables
const dotenv = require("dotenv").config();

//Create the app object
const express = require("express");
const app = express();
const path = require("path");
const http = require("http");
const url = require("url");

//Handles both WSS and Socket.IO depending on the Client's request
const { createRealTimeServers } = require("./realTime");

//Process JSON and urlencoded parameters
app.use(express.json({ extended: true, limit: "100mb" }));
app.use(express.urlencoded({ extended: true, limit: "100mb" })); //The largest incoming payload

//Select the default port
const port = process.env.PORT || 3000;

//Implement basic protocols with Helmet and CORS
const helmet = require("helmet");
app.use(helmet()); //You may need to set parameters such as contentSecurityPolicy: false,

//If you wish, you can implement CORS restrictions
const cors = require("cors");
var devCorsOptions = {
  origin: '*', //restrict to only use this domain for requests
  exposedHeaders: [
    "Content-Length",
    "Content-Type",
    "auth-token",
    "auth-token-decoded",
  ],
  allowedHeaders: ["auth-token", "auth-token-decoded"], // Allow custom headers if needed
  credentials: true, // Allow credentials (cookies, authorization headers, etc.)
  optionsSuccessStatus: 200, // For legacy browser support
  methods: "GET, POST, PUT, DELETE", //allowable methods
};

var prodCorsOptions = {
  origin: ["https://osail-liaso.com"], //restrict to only use this domain for requests
  exposedHeaders: [
    "Content-Length",
    "Content-Type",
    "auth-token",
    "auth-token-decoded",
  ],
  allowedHeaders: ["auth-token", "auth-token-decoded"], // Allow custom headers if needed
  credentials: true, // Allow credentials (cookies, authorization headers, etc.)
  optionsSuccessStatus: 200, // For legacy browser support
  methods: "GET, POST, PUT, DELETE", //allowable methods
};

let corsOptions = null;
//Implement context-specific CORS responses
if (process.env.NODE_ENV == "DEV") {
  corsOptions = devCorsOptions; // Use development CORS options
} else if (process.env.NODE_ENV == "PROD") {
  corsOptions = prodCorsOptions; // Use production CORS options
}

app.use(cors(corsOptions));

//Bring in the logger
const expressLogger = require("../middleware/expressLogger");
app.use(expressLogger);

//Create HTTP Server
const server = http.createServer(app);
server.listen(port, () =>
  console.log(`OSAIL- Node.js service listening at http://localhost:${port}`)
);

//Establish both websocket and Socket.IO servers
createRealTimeServers(server, corsOptions);

app.use((req, res, next) => {
  req.fullUrl = req.protocol + "://" + req.get("host") + req.originalUrl;
  next();
});

//Connect to the Database (Mongoose for MongoDB and Azure CosmosDB)
//MongoDB or CosmosDB connector using Mongoose ODM
if (process.env.DATASTORE == "MONGODB" || process.env.DATASTORE == "COSMODB") {
  const initDb = require("./mongoose").initDb;
  initDb(function (err) {
    if (err) throw err;
  });
}

//Connect to the Database (Mongoose for MongoDB and Azure CosmosDB)
//MongoDB or CosmosDB connector using Mongoose ODM
if (process.env.DATASTORE == "SQLDB") {
  const initDb = require("./sql").initDb;
  initDb(function (err) {
    if (err) throw err;
  });
}

//Export the app for use on the index.js page
module.exports = { app };
