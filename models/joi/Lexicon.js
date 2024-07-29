const Joi = require('joi');

const LexiconSchemaJoi = Joi.object({

  //Uuid, present in all items
  uuid: Joi.string().guid({ version: ['uuidv4'] }).required(),

  //Models
  code: Joi.string().required(),
  word: Joi.object().pattern(Joi.string(), Joi.string().required()).required(),
  keywords: Joi.array().items(Joi.string()),
  autoTranslated: Joi.boolean().default(false),
  validatedBy: Joi.string().allow(null).optional(),
  status: Joi.string().valid('active', 'inactive').required().default('active'),

});

module.exports = LexiconSchemaJoi;