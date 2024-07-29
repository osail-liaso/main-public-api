// models/joi/Persona.js
const Joi = require('joi');

// Define the localized field schema
const localizedFieldSchema = Joi.object({
  en: Joi.string().trim().required(),
  fr: Joi.string().trim().required(),
}).or('en', 'fr'); // Ensure at least one language is provided
 
module.exports = localizedFieldSchema;