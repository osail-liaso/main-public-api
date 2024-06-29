
const mongoose = require('mongoose');
const { Schema } = mongoose;

const administrativeFields = require('../common/administrativeFields');
const localizedField = require('../common/localizedField');

const ModelSchema = new Schema({
    organizationUuid: {type:String}, //if applicable

    //Textual name and description
    name: localizedField('name'),
    concurrentInstances:{type:Number},
    provider: {type:String},
    maxTokens: {type:Number},
    per1kOutput: {type:Number},
    per1kInput: {type:Number},
    model: {type:String},

    //Optional, needed for Azure OpenAI for example
    apiKey: {type:String},
    apiEndpoint: {type:String},

    ...administrativeFields
}, {
    collection: 'models',
    timestamps: { createdAt: 'momentCreated', updatedAt: 'momentUpdated' } // Use custom field names for timestamps
});

const Model = mongoose.model('Model', ModelSchema);
module.exports = Model;
