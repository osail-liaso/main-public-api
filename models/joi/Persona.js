// models/joi/Persona.js
const Joi = require("joi");

const localizedFieldSchema = require("../common/localizedFieldSchema");

const SystemPromptSchemaJoi = Joi.object({
    uuid: Joi.string().guid({ version: ['uuidv4'] }).required() ,
    name: localizedFieldSchema.required(),
    originalFilename: Joi.string().allow(null).optional(),
    url: Joi.string().uri().allow(null).optional(),
    text: Joi.string().required(),
    html: Joi.string().required(),
    image: Joi.binary().allow(null).optional(), // Joi.binary() is used for Buffer data
    status: Joi.string().valid('active', 'inactive').default('active'),
  });

// Combine the schemas to create the Persona schema
const personaSchemaJoi = Joi.object({
  //Uuid
  uuid: Joi.string().guid({ version: ['uuidv4'] }).required(),
  
  //Administrative Fields
  createdBy: Joi.string().guid({ version: 'uuidv4' }).default('system'),
  publishedBy: Joi.string().guid({ version: 'uuidv4' }).allow(null), // Allow null if not published
  publishStatus: Joi.string().valid('unpublished', 'proposedForPublishing', 'published', 'suspended').default('unpublished'),
  owners: Joi.array().items(Joi.string().guid({ version: 'uuidv4' })).default([]),
  editors: Joi.array().items(Joi.string().guid({ version: 'uuidv4' })).default([]),
  viewers: Joi.array().items(Joi.string().guid({ version: 'uuidv4' })).default([]),
  ownerLink: Joi.string().uri().allow(null), // Allow null if there is no link
  editorLink: Joi.string().uri().allow(null), // Allow null if there is no link
  viewerLink: Joi.string().uri().allow(null), // Allow null if there is no link
  status: Joi.string().valid('active', 'inactive').default('active'),
  momentCreated: Joi.date().default(() => new Date()),
  momentUpdated: Joi.date().default(() => new Date()),

  //Standard fields
  name: localizedFieldSchema.required(),
  description: localizedFieldSchema.required(),
  url: Joi.string().uri().allow(null),
  systemPrompts: Joi.array().items(SystemPromptSchemaJoi),
  defaultUserPrompts: Joi.array().items(Joi.string()),
});

module.exports =  personaSchemaJoi ;

