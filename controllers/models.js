const modelDAL = require('../dal/modelsDal');
const ApiError = require('../error/ApiError');
const logger = require('../middleware/logger');
const uuidv4 = require('uuid').v4;

exports.bootstrapModels = async function (req, res, next) {
    try {
        let defaultModels = [];

        // Bootstrap a set of default models based on your configuration
        if (process.env.OPENAI_API_KEY) {
            defaultModels.push({
                uuid: uuidv4(),
                concurrentInstances: 20,
                provider: 'openAi',
                maxTokens: 128000,
                per1kInput: 0.01,
                per1kOutput: 0.03,
                model: "gpt-4-1106-preview",
                name: {en: "OpenAI GPT-4 Turbo (128k)", fr: "OpenAI GPT-4 Turbo (128k)"},
                publishStatus: 'unpublished',
                status: 'active',
                owners: [],
                editors: [],
                viewers: []
            });

            defaultModels.push({
                uuid: uuidv4(),
                concurrentInstances: 20,
                provider: 'openAi',
                maxTokens: 128000,
                per1kInput: 0.01,
                per1kOutput: 0.03,
                model: "gpt-4o",
                name: {en: "OpenAI GPT-4o", fr: "OpenAI GPT-4o"},
                publishStatus: 'unpublished',
                status: 'active',
                owners: [],
                editors: [],
                viewers: []
            });
        }

        if (process.env.ANTHROPIC_API_KEY) {
            defaultModels.push({
                uuid: uuidv4(),
                concurrentInstances: 5,
                provider: 'anthropic',
                maxTokens: 200000,
                per1kInput: 0.003,
                per1kOutput: 0.015,
                model: "claude-3-5-sonnet-20240620",
                name: {en: "Anthropic Claude Sonnet 3.5", fr: "Anthropic Claude Sonnet 3.5"},
                publishStatus: 'unpublished',
                status: 'active',
                owners: [],
                editors: [],
                viewers: []
            });
         }

        // ... (similar changes for other models)

        let newModels = [];
        for (const model of defaultModels) {
            const existingModel = await modelDAL.getModelByProviderAndName(model.provider, model.model);
            if (!existingModel) {
                newModels.push(model);
            }
        }

        let results = [];
        if (newModels.length > 0) {
            results = await modelDAL.createModels(newModels);
        }

        res.status(200).json({ message: "Bootstrapped a default list of models for you to edit or delete", payload: results });
    } catch (error) {
        console.error("Error in bootstrapModels:", error);
        next(ApiError.internal(`An error occurred while bootstrapping Models: ${error.message}`));
    }
};


exports.getModels = async function (req, res, next) {
    try {
        const models = await modelDAL.getActiveModels();
        res.status(200).json({ message: "Here are all the active Models", payload: models });
    } catch (error) {
        console.log(error)
        next(ApiError.internal("An error occurred while retrieving Models"));
    }
};

exports.createModels = async function (req, res, next) {
    try {
        var roles = req.tokenDecoded?.roles || [];
        const isAdmin = roles.includes('admin');
        if (!isAdmin) {
            throw ApiError.forbidden("You do not have permission to update this Model.");
        }

        var modelsData = req.body.models || req.query.models || [];
        if (!Array.isArray(modelsData)) {
            modelsData = [modelsData];
        }

        modelsData.forEach((model) => {
            if (req.tokenDecoded) {
                model.owners = [req.tokenDecoded.username];
                model.editors = [req.tokenDecoded.username];
                model.viewers = [req.tokenDecoded.username];
                model.createdBy = req.tokenDecoded.username;
            }
            if (!model.uuid) model.uuid = uuidv4();
        });

        var results = await modelDAL.createModels(modelsData);
        res.status(201).json({ message: "Created all the provided Models", payload: results });
    } catch (error) {
        console.log(error);
        next(error instanceof ApiError ? error : ApiError.internal("An error occurred while creating Models"));
    }
};

exports.updateModels = async function (req, res, next) {
    const modelsUpdates = req.body.models || [];
    const username = req.tokenDecoded?.username;
    const roles = req.tokenDecoded?.roles || [];
    const errors = [];
    const successes = [];

    if (!Array.isArray(modelsUpdates)) {
        return next(ApiError.badRequest("Models updates should be an array."));
    }

    for (const update of modelsUpdates) {
        try {
            let model = await modelDAL.getModelByUuid(update.uuid);

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

            const { _id, ...updateWithoutId } = update;
            await modelDAL.updateModel(update.uuid, updateWithoutId);
            successes.push(`Model with UUID ${update.uuid} updated successfully.`);
        } catch (error) {
            errors.push(`Failed to update Model with UUID ${update.uuid}. Error: ${error.message}`);
        }
    }

    if (errors.length > 0) {
        return res.status(207).json({
            message: "Completed with some errors.",
            errors: errors,
            successes: successes
        });
    }

    res.status(200).json({ message: "All Models updated successfully." });
};

exports.deleteModels = async function (req, res, next) {
    const modelUuids = req.body.modelUuids || [];
    const username = req.tokenDecoded?.username;
    const roles = req.tokenDecoded?.roles || [];
    const errors = [];

    if (!Array.isArray(modelUuids)) {
        return next(ApiError.badRequest("Model UUIDs should be an array."));
    }

    for (const uuid of modelUuids) {
        try {
            let model = await modelDAL.getModelByUuid(uuid);

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

            await modelDAL.softDeleteModel(uuid);
        } catch (error) {
            errors.push(`Failed to delete Model with UUID: ${uuid}. Error: ${error.message}`);
        }
    }

    if (errors.length > 0) {
        return res.status(207).json({
            message: "Completed with some errors.",
            errors: errors
        });
    }

    res.status(200).json({ message: "All Models deleted successfully." });
};