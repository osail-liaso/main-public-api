const Joi = require('joi');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

// Define the joi schema for the account
const AccountSchemaJoi = Joi.object({
  // User information
  uuid: Joi.string().guid({ version: ['uuidv4'] }).required(),
  username: Joi.string().required(),
  password: Joi.string().required(),
  salt: Joi.string().required(),

  email: Joi.string().email().allow(null).optional(),
  useCase: Joi.string().allow(null).optional(),
  notes: Joi.string().allow(null).optional(),
  preferredLng: Joi.string().allow(null).optional(),
  roles: Joi.array().items(Joi.string().valid('user', 'contributor', 'owner', 'admin')).required(),

  // Free characters to start
  characterReserve: Joi.number().default(Number(process.env.CHARACTERS_RESERVE_DEFAULT) || 0),
  charactersUsed: Joi.number().default(0),
  ownCharactersUsed: Joi.number().default(0),

  // BYOK
  openAiApiKey: Joi.string().allow(null).optional(),
  anthropicApiKey: Joi.string().allow(null).optional(),
  mistralApiKey: Joi.string().allow(null).optional(),
  groqApiKey: Joi.string().allow(null).optional(),
  azureOpenAiApiKey: Joi.string().allow(null).optional(),
  azureOpenAiApiEndpoint: Joi.string().allow(null).optional(),

  // Subscription
  subscriptionType: Joi.string().default('free'),
  subscriptionDate: Joi.date().allow(null).optional(),
  subscriptionStatus: Joi.string().valid('active', 'inactive').default('inactive'),

  // Subscription history
  subscriptionHistory: Joi.array().items(Joi.object()).optional(),
  status: Joi.string().valid('active', 'inactive', 'deleted').default('active'),

  // Account settings info
  momentFirstLogin: Joi.date().allow(null).optional(),
  momentLastLogin: Joi.date().allow(null).optional(),

  // Password Resets
  passwordResetRequired: Joi.boolean().allow(null).optional(),
  passwordResetRequested: Joi.boolean().allow(null).optional(),
  passwordResetToken: Joi.string().allow(null).optional(),
  momentPasswordResetTokenExpires: Joi.date().allow(null).optional(),

  // Time-based information
  momentCreated: Joi.date().default(() => new Date()),
  momentUpdated: Joi.date().optional(),
  momentDeleted: Joi.date().optional(),
}).prefs({ convert: true });

// Export the joi schema
module.exports = AccountSchemaJoi;