const { DataTypes, Model } = require("sequelize");
const { sequelize } = require("../../config/sql");
const tableDef = `
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'dbo' AND TABLE_NAME = 'Accounts')
BEGIN
  -- SQL statements to create table, indexes, and constraints

-- Create the Accounts table
CREATE TABLE dbo.Accounts (
    id INT IDENTITY(1,1) PRIMARY KEY,
    uuid AS CAST(JSON_VALUE(data, '$.uuid') AS NVARCHAR(36)) PERSISTED NOT NULL,
    username AS CAST(JSON_VALUE(data, '$.username') AS NVARCHAR(255)) PERSISTED NOT NULL,
    password AS CAST(JSON_VALUE(data, '$.password') AS NVARCHAR(255)) PERSISTED NOT NULL,
    salt AS CAST(JSON_VALUE(data, '$.salt') AS NVARCHAR(255)) PERSISTED NOT NULL,
    status AS CAST(JSON_VALUE(data, '$.status') AS NVARCHAR(255)) PERSISTED NOT NULL,
    data NVARCHAR(MAX) CHECK (ISJSON(data) = 1),
    momentCreated DATETIME2 DEFAULT GETDATE(),
    momentUpdated DATETIME2 DEFAULT GETDATE()
);

-- Create unique indexes on computed columns
CREATE UNIQUE NONCLUSTERED INDEX IX_Accounts_Username
ON dbo.Accounts (username);

CREATE UNIQUE NONCLUSTERED INDEX IX_Accounts_UUID
ON dbo.Accounts (uuid);
 
END
`;
class Account extends Model {}

Account.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    data: {
      type: DataTypes.JSON,
      allowNull: false,
      get() {
        const rawValue = this.getDataValue("data");

        if (typeof rawValue === "string") {
          try {
            return JSON.parse(rawValue);
          } catch (error) {
            console.error("Error parsing JSON:", error);
            return rawValue;
          }
        }

        return rawValue;
      },
      set(value) {
        this.setDataValue("data", value);
      },
    },

    momentCreated: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    momentUpdated: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  },
  {
    sequelize,
    modelName: "Account",
    tableName: "Accounts",
    timestamps: true,
    createdAt: "momentCreated",
    updatedAt: "momentUpdated",
  }
);

// Hook to update the momentUpdated field
Account.beforeUpdate((account, options) => {
  account.momentUpdated = new Date();
});

// Hook to set momentCreated when a new account is created
Account.beforeCreate((account, options) => {
  const now = new Date();
  account.momentCreated = now;
  account.momentUpdated = now;
});

module.exports = { Account, tableDef };
