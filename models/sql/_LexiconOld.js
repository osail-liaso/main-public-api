const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../../config/sql');

class Lexicon extends Model {}

Lexicon.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  code: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    index: true
  },
  word: {
    type: DataTypes.JSON,
    allowNull: false,
    validate: {
      isObject(value) {
        if (typeof value !== 'object' || value === null || Array.isArray(value)) {
          throw new Error('word must be an object');
        }
      }
    }
  },
  keywords: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  },
  autoTranslated: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  validatedBy: {
    type: DataTypes.STRING
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
  tableName: 'lexicon',
  timestamps: false, // We'll handle timestamps manually
  indexes: [
    {
      fields: ['code']
    },
    {
      fields: ['keywords']
    }
  ]
});

// Hook to set momentCreated when a new account is created
Lexicon.beforeCreate((lexicon, options) => {
    const now = new Date();
    lexicon.momentCreated = now;
    lexicon.momentUpdated = now;
  });
  
// Hook to update the momentUpdated field
Lexicon.beforeUpdate((lexicon, options) => {
  lexicon.momentUpdated = new Date();
});


module.exports = Lexicon;