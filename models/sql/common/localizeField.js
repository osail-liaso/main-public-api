const { DataTypes } = require('sequelize');

const localizedField = (fieldName) => ({
  type: DataTypes.JSON,
  validate: {
    isValidLocalizedField(value) {
      if (!value || typeof value !== 'object') {
        throw new Error(`${fieldName} must be an object`);
      }
      
      const hasEn = typeof value.en === 'string' && value.en.trim().length > 0;
      const hasFr = typeof value.fr === 'string' && value.fr.trim().length > 0;
      
      if (!hasEn && !hasFr) {
        throw new Error(`At least one of 'en' or 'fr' must be provided for ${fieldName}`);
      }
    }
  },
  get() {
    const rawValue = this.getDataValue(fieldName);
    return {
      en: rawValue?.en?.trim() || '',
      fr: rawValue?.fr?.trim() || ''
    };
  },
  set(value) {
    this.setDataValue(fieldName, {
      en: value?.en?.trim() || '',
      fr: value?.fr?.trim() || ''
    });
  }
});

module.exports = localizedField;