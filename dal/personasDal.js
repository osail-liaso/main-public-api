const SequelizePersona = require('../models/sql/Persona');
const MongoosePersona = require('../models/mongo/documents/Persona');
const { sequelize } = require('../config/sql');

const useSequelize = process.env.USE_SEQUELIZE === 'true';
const getModel = () => {
    console.log('useSequelize:', useSequelize);
    if (useSequelize) {
        if (!SequelizePersona) {
            throw new Error('SequelizePersona model is not defined');
        }
        return SequelizePersona;
    } else {
        if (!MongoosePersona) {
            throw new Error('MongoosePersona model is not defined');
        }
        return MongoosePersona;
    }
};


async function createPersonas(personasData) {
    try {
      const Model = getModel();
  
      if (useSequelize) {
        // Ensure personasData is always treated as an array
        let personasArray = Array.isArray(personasData) ? personasData : [personasData];
  
        return await sequelize.transaction(async (t) => {
          const createdPersonas = await Promise.all(
            personasArray.map((item) =>
              Model.create({ data: item }, { transaction: t }) // No need to wrap item again
            )
          );
          console.log("createdPersonas", createdPersonas);
          return createdPersonas.map((model) => model.get({ plain: true }).data);
        });
      } else {
        // For MongoDB, keep the existing logic
        return await Model.insertMany(personasData); // Use personasData directly
      }
    } catch (error) {
      console.error("Error creating personas:", error);
      throw error;
    }
  }


// Read

async function getAllPersonas() {
    const Model = getModel();
    if (useSequelize) {
        const persona = await Model.findAll();
        return persona ;//? persona.get({ plain: true }).data : null;
    } else {
        return await Model.find({}).lean();
    }
}


async function getPersonaById(id) {
    const Model = getModel();
    if (useSequelize) {
        const persona = await Model.findByPk(id);
        return persona ? persona.get({ plain: true }).data : null;
    } else {
        return await Model.findById(id).lean();
    }
}

async function getPersonaByUsername(username) {
    const Model = getModel();
    if (useSequelize) {
        const persona = await Model.findOne({
            where: sequelize.where(
                sequelize.fn('JSON_VALUE', sequelize.col('data'), '$.username'),
                username
            )
        });
        return persona ? persona.get({ plain: true }).data : null;
    } else {
        return await Model.findOne({ username }).lean();
    }
}

// Update
async function updatePersona(id, updateData) {
    const Model = getModel();
    if (useSequelize) {
        const persona = await Model.findByPk(id);
        if (!persona) return null;
        const currentData = persona.get({ plain: true }).data;
        const updatedData = { ...currentData, ...updateData };
        await persona.update({ data: updatedData });
        return persona.get({ plain: true }).data;
    } else {
        return await Model.findByIdAndUpdate(id, updateData, { new: true }).lean();
    }
}

// Delete
async function deletePersona(id) {
    const Model = getModel();
    if (useSequelize) {
        const persona = await Model.findByPk(id);
        if (!persona) return false;
        await persona.destroy();
        return true;
    } else {
        const result = await Model.findByIdAndDelete(id);
        return !!result;
    }
}

module.exports = {
    createPersonas,
    getAllPersonas,
    getPersonaById,
    getPersonaByUsername,
    updatePersona,
    deletePersona
};