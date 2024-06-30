/*

CREATE TABLE dbo.Models (
    id INT IDENTITY(1,1) PRIMARY KEY,
     uuid AS CAST(JSON_VALUE(data, '$.uuid') AS NVARCHAR(36)) PERSISTED NOT NULL,
     model AS CAST(JSON_VALUE(data, '$.model') AS NVARCHAR(255)) PERSISTED NOT NULL,
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


-- Add check constraints to ensure required fields are present in JSON
ALTER TABLE dbo.Models
ADD CONSTRAINT CHK_Models_RequiredFields CHECK (
    JSON_VALUE(data, '$.uuid') IS NOT NULL
    AND JSON_QUERY(data, '$.name') IS NOT NULL
    AND JSON_VALUE(data, '$.provider') IS NOT NULL
    AND JSON_VALUE(data, '$.model') IS NOT NULL
);

-- Add check constraint for valid publish status
ALTER TABLE dbo.Models
ADD CONSTRAINT CHK_Models_ValidPublishStatus CHECK (
    JSON_VALUE(data, '$.publishStatus') IN ('unpublished', 'proposedForPublishing', 'published', 'suspended', NULL)
);

-- Add check constraint for valid status
ALTER TABLE dbo.Models
ADD CONSTRAINT CHK_Models_ValidStatus CHECK (
    JSON_VALUE(data, '$.status') IN ('active', 'inactive', NULL)
);
  



*/

const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../../config/sql');

class AIModel extends Model {}

AIModel.init({
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    data: {
      type: DataTypes.JSON,
      allowNull: false,
      validate: {
        isValidData(value) {
          // Your validation logic here
        }
      },
      get() {
        const rawValue = this.getDataValue('data');
        if (typeof rawValue === 'string') {
          try {
            return JSON.parse(rawValue);
          } catch (error) {
            console.error('Error parsing JSON:', error);
            return rawValue;
          }
        }
        return rawValue;
      },
      set(value) {
        this.setDataValue('data', value);

    }
    },
    momentCreated: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    momentUpdated: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    sequelize,
    modelName: 'AIModel',
    tableName: 'Models',
    timestamps: true,
    createdAt: 'momentCreated',
    updatedAt: 'momentUpdated'
  });


// Hook to update the momentUpdated field
AIModel.beforeUpdate((model, options) => {
  model.momentUpdated = new Date();
});

// Hook to set momentCreated and generate UUID when a new model is created
AIModel.beforeCreate((model, options) => {
  const now = new Date();
  model.momentCreated = now;
  model.momentUpdated = now;
  if (!model.data.uuid) {
    model.data.uuid = uuidv4();
  }
});

module.exports = AIModel;
