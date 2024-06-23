require("dotenv").config();
const { Sequelize } = require("sequelize");

const config = {
  dialect: "mssql",
  host: process.env.SQL_SERVER,
  port: process.env.SQL_PORT || 1433,
  database: process.env.SQL_DATABASE,
  username: process.env.SQL_USER,
  password: process.env.SQL_PASSWORD,
  dialectOptions: {
    options: {
      encrypt: process.env.SQL_ENCRYPT === "true",
      trustServerCertificate:
        process.env.SQL_TRUST_SERVER_CERTIFICATE === "true",
      enableArithAbort: true,
    },
  },
};

let  sequelize = new Sequelize(config);

// If using Windows Authentication for on-prem SQL Server
if (process.env.SQL_USE_WINDOWS_AUTH === "true") {
  config.dialectOptions.options.trustedConnection = true;
  delete config.username;
  delete config.password;
}

  function initDb(callback) {
    console.log("Initialized SQL DB Connection");
}

async function testConnection() {
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
  testConnection,
};
