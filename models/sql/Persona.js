/*
// Table Definition
CREATE TABLE Personas (
    id INT IDENTITY(1,1) PRIMARY KEY,
    data NVARCHAR(MAX) CHECK (ISJSON(data) = 1),
    momentCreated DATETIME2 DEFAULT GETDATE(),
    momentUpdated DATETIME2 DEFAULT GETDATE()
)
*/

const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../../config/sql');
const localizedField = require('./localizedField');
const localizedArrayField = require('./localizedArrayField');
const administrativeFields = require('./administrativeFields');

class Persona extends Model {}

Persona.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  data: {
    type: DataTypes.JSON,
    allowNull: false,
    validate: {
      isValidPersonaData(value) {
        // Validate administrative fields
        Object.entries(administrativeFields).forEach(([field, config]) => {
          if (config.validate) {
            Object.entries(config.validate).forEach(([validatorName, validatorFunction]) => {
              if (typeof validatorFunction === 'function') {
                validatorFunction(value[field]);
              }
            });
          }
        });

        // Validate required fields
        const requiredFields = ['name', 'description', 'avatarUrl'];
        requiredFields.forEach(field => {
          if (!value[field]) {
            throw new Error(`${field} is required`);
          }
        });

        // Validate localized fields
        const localizedFields = ['name', 'description', 'purpose', 'backstory'];
        localizedFields.forEach(field => {
          if (value[field]) {
            localizedField(field).validate.isValidLocalizedField.call(this, value[field]);
          }
        });

        // Validate localized array fields
        const localizedArrayFields = ['traits', 'interests'];
        localizedArrayFields.forEach(field => {
          if (value[field]) {
            localizedArrayField(field).validate.isValidLocalizedArrayField.call(this, value[field]);
          }
        });

        // Validate avatarUrl
        if (value.avatarUrl && typeof value.avatarUrl !== 'string') {
          throw new Error('avatarUrl must be a string');
        }

        // Validate age
        if (value.age && !Number.isInteger(value.age)) {
          throw new Error('age must be an integer');
        }

        // Validate other fields as needed
      }
    },
    get() {
      const rawValue = this.getDataValue('data');
      return {
        // Administrative fields
        ...Object.fromEntries(
          Object.entries(administrativeFields).map(([field, config]) => [field, rawValue[field] ?? config.defaultValue])
        ),
        // Localized fields
        name: localizedField('name').get.call({ getDataValue: () => rawValue.name }),
        description: localizedField('description').get.call({ getDataValue: () => rawValue.description }),
        purpose: localizedField('purpose').get.call({ getDataValue: () => rawValue.purpose }),
        backstory: localizedField('backstory').get.call({ getDataValue: () => rawValue.backstory }),
        // Localized array fields
        traits: localizedArrayField('traits').get.call({ getDataValue: () => rawValue.traits }),
        interests: localizedArrayField('interests').get.call({ getDataValue: () => rawValue.interests }),
        // Other fields
        avatarUrl: rawValue.avatarUrl,
        age: rawValue.age,
        // Add any other fields specific to Persona
        momentDeleted: rawValue.momentDeleted
      };
    },
    set(value) {
      // Set administrative fields
      Object.keys(administrativeFields).forEach(field => {
        if (value[field] === undefined && administrativeFields[field].defaultValue !== undefined) {
          value[field] = typeof administrativeFields[field].defaultValue === 'function' 
            ? administrativeFields[field].defaultValue()
            : administrativeFields[field].defaultValue;
        }
      });

      // Set localized fields
      ['name', 'description', 'purpose', 'backstory'].forEach(field => {
        if (value[field]) {
          value[field] = localizedField(field).set.call({ setDataValue: (_, v) => v }, value[field]);
        }
      });

      // Set localized array fields
      ['traits', 'interests'].forEach(field => {
        if (value[field]) {
          value[field] = localizedArrayField(field).set.call({ setDataValue: (_, v) => v }, value[field]);
        }
      });

      // Set other fields
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
  modelName: 'Persona',
  tableName: 'Personas',
  timestamps: false,
  hooks: {
    beforeCreate: (persona) => {
      persona.momentCreated = new Date();
      persona.momentUpdated = new Date();
    },
    beforeUpdate: (persona) => {
      persona.momentUpdated = new Date();
    }
  }
});

module.exports = Persona;