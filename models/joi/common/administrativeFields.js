// models/joi/Persona.js
const Joi = require('joi');
const { v4: uuidv4 } = require('uuid');

// Define the administrative fields schema
//This is not a Joi object in this instance because it is being included in the other schemas with a ... spread operator, which causes an error
const administrativeFieldsSchema = Joi.object({
    publishStatus: Joi.string().valid('unpublished', 'proposedForPublishing', 'published', 'suspended').default('unpublished'),
    publishedBy: Joi.string().guid({ version: 'uuidv4' }).allow(null), // Allow null if not published
    owners: Joi.array().items(Joi.string().guid({ version: 'uuidv4' })).default([]),
    editors: Joi.array().items(Joi.string().guid({ version: 'uuidv4' })).default([]),
    viewers: Joi.array().items(Joi.string().guid({ version: 'uuidv4' })).default([]),
    ownerLink: Joi.string().uri().allow(null), // Allow null if there is no link
    editorLink: Joi.string().uri().allow(null), // Allow null if there is no link
    viewerLink: Joi.string().uri().allow(null), // Allow null if there is no link
    createdBy: Joi.string().guid({ version: 'uuidv4' }).default('system'),
    status: Joi.string().valid('active', 'inactive').default('active'),
});
 
module.exports = administrativeFieldsSchema;