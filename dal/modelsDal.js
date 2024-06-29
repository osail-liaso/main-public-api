const Seq = require('../models/sql/AIModel');
const Mon = require('../models/mongo/documents/Model');
const { sequelize } = require('../config/sql');

const useSequelize = process.env.USE_SEQUELIZE === 'true';
const getModel = () => {
    console.log('useSequelize:', useSequelize);
    if (useSequelize) {
        if (!Seq) {
            throw new Error('Sequelize model is not defined');
        }
        return Seq;
    } else {
        if (!Mon) {
            throw new Error('Mongoose model is not defined');
        }
        return Mon;
    }
};


async function createModels(modelsData) {
    try {
      const Model = getModel();
  
      if (useSequelize) {
        // Ensure modelsData is always treated as an array
        let modelsArray = Array.isArray(modelsData) ? modelsData : [modelsData];
  
        return await sequelize.transaction(async (t) => {
          const createdModels = await Promise.all(
            modelsArray.map((item) =>
              Model.create({ data: item }, { transaction: t }) // No need to wrap item again
            )
          );
          console.log("createdModels", createdModels);
          return createdModels.map((model) => model.get({ plain: true }).data);
        });
      } else {
        // For MongoDB, keep the existing logic
        return await Model.insertMany(modelsData); // Use modelsData directly
      }
    } catch (error) {
      console.error("Error creating models:", error);
      throw error;
    }
  }

  
async function getModelByUuid(uuid) {
    const Model = getModel();
    if (useSequelize) {
        const model = await Model.findOne({
            where: sequelize.where(
                sequelize.fn('JSON_VALUE', sequelize.col('data'), '$.uuid'),
                uuid
            )
        });
        return model ? model.get({ plain: true }).data : null;
    } else {
        return await Model.findOne({ uuid }).lean();
    }
}

async function getModelByProviderAndName(provider, modelName) {
    const Model = getModel();
    if (useSequelize) {
        return await Model.findOne({
            where: sequelize.literal(`JSON_VALUE(data, '$.provider') = '${provider}' AND JSON_VALUE(data, '$.model') = '${modelName}'`),
            order: [['id', 'ASC']]
        });
    } else {
        return await Model.findOne({ 'provider': provider, 'model': modelName });
    }
}


async function getActiveModels() {
    const Model = getModel();
    if (useSequelize) {
        const models = await Model.findAll({
            where: sequelize.literal("JSON_VALUE(data, '$.status') = 'active'")
        });
        
        return models.map(model => model.data);
    } else {
        return await Model.find({ 'status': 'active' }).lean();
    }
}


async function updateModel(uuid, updateData) {
    const Model = getModel();
    if (useSequelize) {
        const model = await Model.findOne({
            where: sequelize.where(
                sequelize.fn('JSON_VALUE', sequelize.col('data'), '$.uuid'),
                uuid
            )
        });
        if (!model) return null;
        const currentData = model.get({ plain: true }).data;
        const updatedData = { ...currentData, ...updateData };
        await model.update({ data: updatedData });
        return model.get({ plain: true }).data;
    } else {
        return await Model.findOneAndUpdate({ uuid }, updateData, { new: true }).lean();
    }
}

async function softDeleteModel(uuid) {
    const Model = getModel();
    if (useSequelize) {
        await Model.update(
            { data: sequelize.fn('JSON_MODIFY', sequelize.col('data'), '$.status', 'inactive') },
            {
                where: sequelize.where(
                    sequelize.fn('JSON_VALUE', sequelize.col('data'), '$.uuid'),
                    uuid
                )
            }
        );
    } else {
        await Model.findOneAndUpdate({ uuid }, { status: 'inactive' });
    }
}

 
module.exports = {
    createModels,
    getModelByUuid,
    getModelByProviderAndName,
    getActiveModels,
    updateModel,
    softDeleteModel,
 };