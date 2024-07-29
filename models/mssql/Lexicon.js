
/*
//Table Definitions


*/
 
const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../../config/sql');


let tableDef = `

-- Create the Lexicons table
CREATE TABLE dbo.Lexicon (
    id INT IDENTITY(1,1) PRIMARY KEY,
    uuid AS CAST(JSON_VALUE(data, '$.uuid') AS NVARCHAR(36)) PERSISTED NOT NULL,
    code AS CAST(JSON_VALUE(data, '$.code') AS NVARCHAR(255)) PERSISTED NOT NULL,
    status AS CAST(JSON_VALUE(data, '$.status') AS NVARCHAR(255)) PERSISTED NOT NULL,
    data NVARCHAR(MAX) CHECK (ISJSON(data) = 1),
    momentCreated DATETIME2 DEFAULT GETDATE(),
    momentUpdated DATETIME2 DEFAULT GETDATE()
);

CREATE UNIQUE NONCLUSTERED INDEX IX_Lexicons_UUID
ON dbo.Lexicon (uuid);
 
`;


class Lexicon extends Model {}

Lexicon.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  data: {
    type: DataTypes.JSON,
    allowNull: false,
    // validate: {
    //   isValidData(value) {

    //     // User information
    //     if (!value.uuid || !value.username || !value.password || !value.salt) {
    //       throw new Error('uuid, username, password, and salt are required');
    //     }

    //     if (!value.roles || !Array.isArray(value.roles) || value.roles.length === 0) {
    //       throw new Error('roles must be a non-empty array');
    //     }

    //     if (!['user', 'contributor', 'owner', 'admin'].some(role => value.roles.includes(role))) {
    //       throw new Error('Invalid role');
    //     }

    //     // Subscription status
    //     if (value.subscriptionStatus && !['active', 'inactive'].includes(value.subscriptionStatus)) {
    //       throw new Error('Invalid subscription status');
    //     }

    //     // Status
    //     if (value.status && !['active', 'inactive', 'deleted'].includes(value.status)) {
    //       throw new Error('Invalid status');
    //     }

    //     // Add more validations as needed
    //   }
    // },
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

      return  rawValue;
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
  modelName: 'Lexicon',
  tableName: 'Lexicon',
  timestamps: true,
  createdAt: 'momentCreated',
  updatedAt: 'momentUpdated'

});

// Hook to update the momentUpdated field
Lexicon.beforeUpdate((lexicon, options) => {
  lexicon.momentUpdated = new Date();
});

// Hook to set momentCreated when a new lexicon is created
Lexicon.beforeCreate((lexicon, options) => {
  const now = new Date();
  lexicon.momentCreated = now;
  lexicon.momentUpdated = now;
});

module.exports = {Lexicon, tableDef};