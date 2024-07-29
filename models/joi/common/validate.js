// models/joi/Persona.js
const Joi = require("joi");

// Define the validatePersona function
function validateAgainstSchema(schema, input) {
  let { error, value } = schema.validate(input, {
    abortEarly: false, // Include all errors, not just the first one
    allowUnknown: false, // Disallow properties that are not specified in the schema
    stripUnknown: true, // Remove unknown properties
  });

  if (error) {
    // If validation fails, return an object with the error
    return { error };
  } else {

    //Keep things tidy
    value = sortObjectKeysAlphabetically(value)
    // If validation succeeds, return an object with the validated value
    return { value };
  }
}

function sortObjectKeysAlphabetically(obj) {
    return Object.keys(obj).sort().reduce((sortedObj, key) => {
      sortedObj[key] = obj[key];
      return sortedObj;
    }, {});
  }

module.exports = { validateAgainstSchema };

//Usage
/*
    const { validateSchema } = require('./models/joi/common');
    const { PersonaSchema } = require('./models/joi/schemas/Persona');

    // Sample persona input
    const personaInput = {
    // ... your persona data here
    };

    // Validate the persona
    const { error, value } = validateSchema(PersonaSchema, personaInput);

    if (error) {
    console.error('Validation failed:', error.details);
    // Handle the validation error appropriately
    } else {
    console.log('Validated Persona:', value);
    // Proceed with the validated persona
    }
*/
