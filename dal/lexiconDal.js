// lexiconDal.js

const Seq = require("../models/sql/Lexicon");
const Mon = require("../models/mongo/documents/Lexicon");
const { sequelize } = require("../config/sql");

const useSequelize = process.env.USE_SEQUELIZE === "true";
const getModel = () => {
  console.log("useSequelize:", useSequelize);
  if (useSequelize) {
    if (!Seq) {
      throw new Error("Sequelize model is not defined");
    }
    return Seq;
  } else {
    if (!Mon) {
      throw new Error("Mongoose model is not defined");
    }
    return Mon;
  }
};

async function getAllLexicon() {
  const Model = getModel();
  if (useSequelize) {
    const lexicons = await Model.findAll();
    return lexicons.map(lexicon => lexicon.get({ plain: true }).data);
  } else {
    return await Model.find({}).lean();
  }
}

async function updateLexicon(words) {
  const Model = getModel();
  if (useSequelize) {
    return await sequelize.transaction(async (t) => {
      const updates = await Promise.all(
        words.map(async (word) => {
          const [lexicon, created] = await Model.findOrCreate({
            where: sequelize.where(
              sequelize.fn("JSON_VALUE", sequelize.col("data"), "$.code"),
              word.code
            ),
            defaults: { data: word },
            transaction: t
          });
          if (!created) {
            await lexicon.update({ data: word }, { transaction: t });
          }
          return lexicon.get({ plain: true }).data;
        })
      );
      return updates;
    });
  } else {
    const updates = words.map((word) => ({
      updateOne: {
        filter: { code: word.code },
        update: { $set: word },
        upsert: true
      }
    }));
    await Model.bulkWrite(updates);
    return words;
  }
}

async function deleteLexicon(code) {
  const Model = getModel();
  if (useSequelize) {
    const deleted = await Model.destroy({
      where: sequelize.where(
        sequelize.fn("JSON_VALUE", sequelize.col("data"), "$.code"),
        code
      )
    });
    return deleted > 0;
  } else {
    const result = await Model.deleteOne({ code });
    return result.deletedCount > 0;
  }
}

module.exports = {
  getAllLexicon,
  updateLexicon,
  deleteLexicon
};