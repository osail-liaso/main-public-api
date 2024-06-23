const Model = require('../models/Model');
const ApiError = require('../error/ApiError');
const logger = require('../middleware/logger');
const uuidv4 = require('uuid').v4;

exports.bootstrapModels = async function (req, res, next) {
    try {
        let defaultModels = [];

        //Bootstrap a set of default modles based on your configuration
        
        if (process.env.OPENAI_API_KEY) defaultModels.push({  concurrentInstances: 20, provider: 'openAi', maxTokens: 128000, per1kInput: 0.01, per1kOutput: 0.03, model: "gpt-4-1106-preview", name: {en:"OpenAI GPT-4 Turbo (128k)", fr:"OpenAI GPT-4 Turbo (128k)"}  });
        if (process.env.OPENAI_API_KEY) defaultModels.push({ concurrentInstances: 20, provider: 'openAi', maxTokens: 128000, per1kInput: 0.01, per1kOutput: 0.03, model: "gpt-4o", name: {en:"OpenAI GPT-4o", fr:"OpenAI GPT-4o"}  });
        if (process.env.ANTHROPIC_API_KEY) {
            // defaultModels.push({ provider: 'anthropic', maxTokens: 100000, per1kInput: 0.00163, per1kOutput: 0.00551, model: "claude-instant-1.2", name: {en:"Claude 2.1 Instant", fr:"Claude 2.1 Instant"}  });
            // defaultModels.push({ provider: 'anthropic', maxTokens: 200000, per1kInput: 0.008, per1kOutput: 0.024, model: "claude-2.1", name: {en:"Claude 2.1", fr:"Claude 2.1"} });
            defaultModels.push({  concurrentInstances: 5, provider: 'anthropic', maxTokens: 200000, per1kInput: 0.008, per1kOutput: 0.024, model: "claude-3-5-sonnet-20240620", name: {en:"Claude 3.5 Sonnet", fr:"Claude 3.5 Sonnet"} });
            defaultModels.push({  concurrentInstances: 5, provider: 'anthropic', maxTokens: 200000, per1kInput: 0.008, per1kOutput: 0.024, model: "claude-3-opus-20240229", name: {en:"Claude 3 Opus", fr:"Claude 3 Opus"} });
            defaultModels.push({  concurrentInstances: 5, provider: 'anthropic', maxTokens: 200000, per1kInput: 0.008, per1kOutput: 0.024, model: "claude-3-sonnet-20240229", name: {en:"Claude 3 Sonnet", fr:"Claude 3 Sonnet"} });
            defaultModels.push({   concurrentInstances: 5, provider: 'anthropic', maxTokens: 200000, per1kInput: 0.008, per1kOutput: 0.024, model: "claude-3-haiku-20240307", name: {en:"Claude 3 Haiku", fr:"Claude 3 Haiku"} });
        }
        if (process.env.MISTRAL_API_KEY) defaultModels.push({  concurrentInstances: 10, provider: 'mistral', maxTokens: 128000, per1kInput: 0.07, per1kOutput: 0.03, model: "open-mixtral-8x7b", name: {en:"Mixtral 8x7B", fr:"Mixtral 8x7B"}  });
        if (process.env.MISTRAL_API_KEY) defaultModels.push({  concurrentInstances: 10, provider: 'mistral', maxTokens: 128000, per1kInput: 0.07, per1kOutput: 0.03, model: "open-mixtral-8x22b", name: {en:"Mixtral 8x22B", fr:"Mixtral 8x22B"}  });
        if (process.env.AZURE_OPENAI_KEY) defaultModels.push({  concurrentInstances: 10, provider: 'azureOpenAi', maxTokens: 128000, per1kInput: 0.04, per1kOutput: 0.08, model: "gpt-4", name: {en:"Azure GPT-4 (128k)", fr:"Azure GPT-4 (128k)"}  });

        // Prepare an array to hold models that do not exist in the collection
        let newModels = [];

        // Check each default model against the database
        for (const model of defaultModels) {
            // Check for an existing model with the same provider and English name
            const existingModel = await Model.findOne({
                provider: model.provider,
                model: model.model
            });

            // If the model does not exist, add it to the newModels array
            if (!existingModel) {
                newModels.push(model);
            }
        }

        // Insert new models that do not exist in the collection
        var results = [];
        if (newModels.length > 0) {
            results = await Model.insertMany(newModels, { runValidators: true });
        }

        res.status(200).json({ message: "Bootstrapped a default list of models for you to edit or delete", payload: results });
    } catch (error) {
        console.log(error); // It's good to log the actual error for debugging purposes
        next(ApiError.internal("An error occurred while bootstrapping Models"));
    }
};


exports.getModels = async function (req, res, next) {
    try {
        let baseQuery = { status: 'active' };
        const models = await Model.find(baseQuery);
        res.status(200).json({ message: "Here are all the active Models", payload: models });
    } catch (error) {
        next(ApiError.internal("An error occurred while retrieving Models"));
    }
};

exports.createModels = async function (req, res, next) {
    try {

        //Only admins create models, for now
        var roles = req.tokenDecoded?.roles || [];
        const isAdmin = roles.includes('admin');
        if (!isAdmin) {
            throw ApiError.forbidden("You do not have permission to update this Model.");
        }

        var modelsData = req.body.models || req.query.models || [];
        if (!Array.isArray(modelsData)) {
            modelsData = [modelsData];
        }

        // Set the person who created these Models, if applicable
        modelsData.forEach((model) => {
            if (req.tokenDecoded) {
                model.owners = [req.tokenDecoded.username];
                model.editors = [req.tokenDecoded.username];
                model.viewers = [req.tokenDecoded.username];
                model.createdBy = req.tokenDecoded.username;
            }
            //Assign a uuid if not assigned by the UI
            if (!model.uuid) model.uuid = uuidv4()
        });

        // Attempt to insert the new Models
        var results = await Model.insertMany(modelsData, { runValidators: true });
        res.status(201).json({ message: "Created all the provided Models", payload: results });
    } catch (error) {
        console.log(error)
        next(error instanceof ApiError ? error : ApiError.internal("An error occurred while creating Models"));
    }
};

exports.updateModels = async function (req, res, next) {
    const modelsUpdates = req.body.models || [];
    const username = req.tokenDecoded?.username;
    const roles = req.tokenDecoded?.roles || [];
    const errors = []; // Initialize an array to store errors
    const successes = []; // Initialize an array to store successful updates

    if (!Array.isArray(modelsUpdates)) {
        return next(ApiError.badRequest("Models updates should be an array."));
    }

    // Process each Model update
    for (const update of modelsUpdates) {
        try {
            let model = await Model.findOne({ uuid: update.uuid });

            if (!model) {
                errors.push(`Model with UUID ${update.uuid} not found.`);
                continue;
            }

            const isEditor = model.editors.includes(username);
            const isAdmin = roles.includes('admin');
            if (!isEditor && !isAdmin) {
                errors.push(`You do not have permission to update Model with UUID ${update.uuid}.`);
                continue;
            }

            // Remove the _id field from the update object
            const { _id, ...updateWithoutId } = update;

            // Perform the update
            await Model.updateOne({ uuid: update.uuid }, { $set: updateWithoutId }, { runValidators: true });
            successes.push(`Model with UUID ${update.uuid} updated successfully.`);
        } catch (error) {
            // Instead of throwing, push the error message to the errors array
            errors.push(`Failed to update Model with UUID ${update.uuid}. Error: ${error.message}`);
        }
    }

    // If there were errors, return a summary along with a 207 Multi-Status response
    if (errors.length > 0) {
        return res.status(207).json({
            message: "Completed with some errors.",
            errors: errors,
            successes: successes
        });
    }

    // If no errors occurred, return success message
    res.status(200).json({ message: "All Models updated successfully." });
};

exports.deleteModels = async function (req, res, next) {
    const modelUuids = req.body.modelUuids || [];
    const username = req.tokenDecoded?.username;
    const roles = req.tokenDecoded?.roles || [];
    const errors = []; // Initialize an array to store errors

    if (!Array.isArray(modelUuids)) {
        return next(ApiError.badRequest("Model UUIDs should be an array."));
    }

    // Process each Model UUID for deletion
    for (const uuid of modelUuids) {
        try {
            let model = await Model.findOne({ uuid: uuid });

            if (!model) {
                errors.push(`Model with UUID: ${uuid} does not exist.`);
                continue;
            }

            const isEditor = model.editors.includes(username);
            const isAdmin = roles.includes('admin');

            if (!isEditor && !isAdmin) {
                errors.push(`You do not have permission to delete Model with UUID: ${uuid}.`);
                continue;
            }

            // Soft delete the Model by setting its status to 'inactive'
            await Model.updateOne({ uuid: uuid }, { $set: { status: 'inactive' } });

            // Remove the uuid from the knowledgeSet's modelUuids
            await KnowledgeSet.updateMany(
                { modelUuids: uuid },
                { $pull: { modelUuids: uuid } }
            );
        } catch (error) {
            // Instead of throwing, push the error message to the errors array
            errors.push(`Failed to delete Model with UUID: ${uuid}. Error: ${error.message}`);
        }
    }

    // If there were errors, return a summary along with a 207 Multi-Status response
    if (errors.length > 0) {
        return res.status(207).json({
            message: "Completed with some errors.",
            errors: errors
        });
    }

    // If no errors occurred, return success message
    res.status(200).json({ message: "All Models deleted successfully." });
};

