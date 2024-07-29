 
const { DataTypes, Model } = require("sequelize");
const { sequelize } = require("../../config/sql");

const tableDef = `
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'dbo' AND TABLE_NAME = 'Models')
BEGIN
  -- SQL statements to create table, indexes, and constraints

CREATE TABLE dbo.Models (
  id INT IDENTITY(1,1) PRIMARY KEY,
  uuid AS CAST(JSON_VALUE(data, '$.uuid') AS NVARCHAR(36)) PERSISTED NOT NULL,
  model AS CAST(JSON_VALUE(data, '$.model') AS NVARCHAR(255)) PERSISTED NOT NULL,
  provider AS CAST(JSON_VALUE(data, '$.provider') AS NVARCHAR(255)) PERSISTED NOT NULL,
  status AS CAST(JSON_VALUE(data, '$.status') AS NVARCHAR(255)) PERSISTED NOT NULL,
  data NVARCHAR(MAX) CHECK (ISJSON(data) = 1),
  momentCreated DATETIME2 DEFAULT GETDATE(),
  momentUpdated DATETIME2 DEFAULT GETDATE()
);

-- Create unique indexes on computed columns
CREATE UNIQUE NONCLUSTERED INDEX IX_Models_UUID
ON dbo.Models (uuid);

CREATE UNIQUE NONCLUSTERED INDEX IX_Models_Model
ON dbo.Models (model);

END


`;

class AIModel extends Model {}

AIModel.init(
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
      defaultValue: DataTypes.NOW,
    },
    momentUpdated: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: "Model",
    tableName: "Models",
    timestamps: true,
    createdAt: "momentCreated",
    updatedAt: "momentUpdated",
  }
);

// Hook to update the momentUpdated field
AIModel.beforeUpdate((model, options) => {
  model.momentUpdated = new Date();
});

// Hook to set momentCreated and generate UUID when a new model is created
AIModel.beforeCreate((model, options) => {
  const now = new Date();
  model.momentCreated = now;
  model.momentUpdated = now;
});

module.exports = { AIModel, tableDef };
