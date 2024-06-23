// localizedArrayField.js
const { DataTypes } = require('sequelize');

const localizedArrayField = (fieldName) => ({
  type: DataTypes.JSON,
  validate: {
    isValidLocalizedArrayField(value) {
      if (!Array.isArray(value)) {
        throw new Error(`${fieldName} must be an array`);
      }
      
      const isValid = value.every(item => {
        if (typeof item !== 'object' || item === null) {
          return false;
        }
        const hasEn = typeof item.en === 'string' && item.en.trim().length > 0;
        const hasFr = typeof item.fr === 'string' && item.fr.trim().length > 0;
        return hasEn || hasFr;
      });
      
      if (!isValid) {
        throw new Error(`Each item in ${fieldName} must have at least one of 'en' or 'fr' provided.`);
      }
    }
  },
  get() {
    const rawValue = this.getDataValue(fieldName);
    if (!Array.isArray(rawValue)) return [];
    return rawValue.map(item => ({
      en: item?.en?.trim() || '',
      fr: item?.fr?.trim() || ''
    }));
  },
  set(value) {
    if (!Array.isArray(value)) value = [];
    const trimmedValue = value.map(item => ({
      en: item?.en?.trim() || '',
      fr: item?.fr?.trim() || ''
    }));
    this.setDataValue(fieldName, trimmedValue);
  },
  defaultValue: []
});

module.exports = localizedArrayField;