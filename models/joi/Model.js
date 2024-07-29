const Joi = require("joi");
const localizedFieldSchema = require("./common/localizedFields");
const { v4: uuidv4 } = require('uuid');


const mediaTypeSchema = (inputDefault, outputDefault) => Joi.object({
    input: Joi.boolean().default(inputDefault),
    output: Joi.boolean().default(outputDefault),
  });

const ModelSchemaJoi = Joi.object({
  //Uuid, present in all items
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

  // Schema info
  name: localizedFieldSchema.required(),
  model: Joi.string().required(),
  provider: Joi.string().required(),
  contextLimit: Joi.number().required(),
  maxOutput: Joi.number().required(),
  concurrentInstances: Joi.number().required(),

  costPer1mOutput: Joi.number().optional(),
  costPer1mInput: Joi.number().optional(),

  // Media types with input and output
  text: mediaTypeSchema(true, true).default(),
  image: mediaTypeSchema(false, false).default(),
  video: mediaTypeSchema(false, false).default(),
  audio: mediaTypeSchema(false, false).default(),

  // Optional, needed for Azure OpenAI for example
  apiKey: Joi.string().allow(null).optional(),
  apiEndpoint: Joi.string().allow(null).optional(),

  
  // Timestamps are handled by Mongoose, no need to include in Joi schema
}).prefs({ convert: true });;

module.exports = ModelSchemaJoi;
