const { DataTypes, Model } = require("sequelize");
const { sequelize } = require("../../config/sql");

let tableDef = `

-- Create the Personas table
CREATE TABLE dbo.Personas (
    id INT IDENTITY(1,1) PRIMARY KEY,
    uuid AS CAST(JSON_VALUE(data, '$.uuid') AS NVARCHAR(36)) PERSISTED NOT NULL,
    data NVARCHAR(MAX) CHECK (ISJSON(data) = 1),
    owners AS CAST(JSON_QUERY(data, '$.owners') AS NVARCHAR(MAX)) PERSISTED,
    editors AS CAST(JSON_QUERY(data, '$.editors') AS NVARCHAR(MAX)) PERSISTED,
    viewers AS CAST(JSON_QUERY(data, '$.viewers') AS NVARCHAR(MAX)) PERSISTED,
    status AS CAST(JSON_VALUE(data, '$.status') AS NVARCHAR(36)) PERSISTED NOT NULL,
    publishStatus AS CAST(JSON_VALUE(data, '$.publishStatus') AS NVARCHAR(36)) PERSISTED NOT NULL,
    publishedBy AS CAST(JSON_VALUE(data, '$.publishedBy') AS NVARCHAR(36)) PERSISTED NOT NULL,
    createdBy AS CAST(JSON_VALUE(data, '$.createdBy') AS NVARCHAR(36)) PERSISTED NOT NULL,
    momentCreated DATETIME2 DEFAULT GETDATE(),
    momentUpdated DATETIME2 DEFAULT GETDATE()
);

-- Create unique indexes on computed columns
CREATE UNIQUE NONCLUSTERED INDEX IX_Personas_UUID
ON dbo.Personas (uuid);

`;

class Persona extends Model {}

Persona.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    data: {
      type: DataTypes.JSON,
      allowNull: false,
      // validate: {
      //   isValidData(value) {
      //     // User information
      //     if (
      //       !value.uuid ||
      //       !value.name ||
      //       !value.description ||
      //       !value.status
      //     ) {
      //       throw new Error("uuid, name, description, and status are required");
      //     }

      //     // Status
      //     if (
      //       value.status &&
      //       !["active", "inactive", "deleted"].includes(value.status)
      //     ) {
      //       throw new Error("Invalid status");
      //     }

      //     // Add more validations as needed
      //   },
      // },
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
    modelName: "Persona",
    tableName: "Personas",
    timestamps: true,
    createdAt: "momentCreated",
    updatedAt: "momentUpdated",
  }
);

// Hook to update the momentUpdated field
Persona.beforeUpdate((Persona, options) => {
  Persona.momentUpdated = new Date();
});

// Hook to set momentCreated when a new Persona is created
Persona.beforeCreate((Persona, options) => {
  const now = new Date();
  Persona.momentCreated = now;
  Persona.momentUpdated = now;
});

module.exports = { Persona, tableDef };
