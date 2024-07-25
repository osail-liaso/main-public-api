require("dotenv").config();
const { Sequelize } = require("sequelize");

// Database keep-alive interval in milliseconds
const KEEP_ALIVE_INTERVAL = 5 * 60 * 1000; // e.g., 5 minutes

const config = {
  dialect: "mssql",
  host: process.env.SQL_SERVER,
  port: process.env.SQL_PORT || 1433,
  database: process.env.SQL_DATABASE,
  username: process.env.SQL_USER,
  password: process.env.SQL_PASSWORD,
  pool: {
    max: 20, // Adjust these values as needed
    min: 1,
    acquire: 30000,
    idle: 10000,
    validate: async (connection) => {
      try {
        await connection.authenticate(); // Check if the connection is valid
        return true; // The connection is valid
      } catch (err) {
        console.error("Invalid DB connection:", err);
        return false; // The connection is invalid
      }
    },
  },
  retry: {
    max: 3, // How many times a failing query is automatically retried
    match: [
      Sequelize.ConnectionError, // Retry on connectivity errors
      Sequelize.ConnectionRefusedError,
      Sequelize.ConnectionTimedOutError,
      Sequelize.TimeoutError,
    ],
  },
  dialectOptions: {
    options: {
      encrypt: process.env.SQL_ENCRYPT === "true",
      trustServerCertificate:
        process.env.SQL_TRUST_SERVER_CERTIFICATE === "true",
      enableArithAbort: true,
    },
  },
};

if (process.env.SQL_USE_WINDOWS_AUTH === "true") {
  config.dialectOptions.options.trustedConnection = true;
  delete config.username;
  delete config.password;
}

const sequelize = new Sequelize(config);

// Function to send a keep-alive query to the database
function keepAlive() {
  sequelize.query("SELECT 1").catch((err) => {
    console.error("Keep-alive query failed:", err);
  });
}

// Start the keep-alive interval
const keepAliveInterval = setInterval(keepAlive, KEEP_ALIVE_INTERVAL);

// Function to clear the keep-alive interval and close connections
function cleanup() {
  clearInterval(keepAliveInterval);
  sequelize
    .close()
    .then(() => {
      console.log("Database connections closed gracefully");
    })
    .catch((err) => {
      console.error("Error closing database connections:", err);
    });
}

// Handle application shutdown gracefully
process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);

async function initDb() {
  console.log("Initializing SQL DB Connection");
  try {
    await sequelize.authenticate();
    console.log(`Connected to SQL Database: ${process.env.SQL_DATABASE}`);
  } catch (err) {
    console.error("Database connection failed:", err);
    throw err;
  }
}

module.exports = {
  initDb,
  sequelize,
  cleanup,
};
