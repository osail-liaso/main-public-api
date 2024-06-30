const Seq = require("../models/sql/Persona");
const Mon = require("../models/mongo/documents/Persona");
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

async function getPersonas(viewAll, username, userUuid, roles) {
  try {
    const Model = getModel();

    if (useSequelize) {
      let whereConditions;

      if (roles.includes("admin") && viewAll) {
        whereConditions = sequelize.literal(
          "JSON_VALUE(data, '$.status') = 'active'"
        );
      } else if (userUuid) {
        whereConditions = sequelize.and(
          sequelize.literal("JSON_VALUE(data, '$.status') = 'active'"),
          sequelize.or(
            sequelize.literal(
              `JSON_VALUE(data, '$.owners') LIKE '%${userUuid}%'`
            ),
            sequelize.literal(
              `JSON_VALUE(data, '$.editors') LIKE '%${userUuid}%'`
            ),
            sequelize.literal(
              `JSON_VALUE(data, '$.viewers') LIKE '%${userUuid}%'`
            ),
            sequelize.literal(
              "JSON_VALUE(data, '$.publishStatus') = 'published'"
            )
          )
        );
      } else {
        whereConditions = sequelize.and(
          sequelize.literal("JSON_VALUE(data, '$.status') = 'active'"),
          sequelize.literal("JSON_VALUE(data, '$.publishStatus') = 'published'")
        );
      }

      const personas = await Model.findAll({
        attributes: ["id", "data", "momentCreated", "momentUpdated"], // specify the attributes you need
        where: whereConditions,
      });

      return personas.map((persona) => {
        const data = persona.data; // parse the JSON string
        return {
          ...data,
          isOwner: userUuid ? data.owners.includes(userUuid) : false,
          isEditor: userUuid ? data.editors.includes(userUuid) : false,
          isViewer: userUuid ? data.viewers.includes(userUuid) : false,
          isAdmin: roles.includes("admin"),
        };
      });
    }
    else{
        console.log('MongoDB')
    }

  } catch (error) {
    console.log(error);
  }
}

async function createPersonas(personas, username, userUuid) {
  const Model = getModel();

  personas.forEach((persona) => {
    if (userUuid) {
      persona.owners = [userUuid];
      persona.editors = [userUuid];
      persona.viewers = [userUuid];
      persona.createdBy = userUuid;
    }
  });

  if (useSequelize) {
    return await sequelize.transaction(async (t) => {
      const createdPersonas = await Promise.all(
        personas.map((item) => Model.create({ data: item }, { transaction: t }))
      );
      return createdPersonas.map((model) => model.get({ plain: true }).data);
    });
  } else {
    //MongoDb
    console.log("MongoDB")


  }
}

// async function updatePersonas(personas, username, roles) {
//   const Model = getModel();
//   const isAdmin = roles.includes('admin');
//   const updatedPersonas = [];

//   for (let persona of personas) {
//     const { _id, ...updateData } = persona;
//     let updateParams, result;

//     if (useSequelize) {
//       updateParams = isAdmin ? { id: _id } : {
//         id: _id,
//         [sequelize.Op.or]: [
//           sequelize.where(sequelize.fn('JSON_VALUE', sequelize.col('data'), '$.owners'), username),
//           sequelize.where(sequelize.fn('JSON_VALUE', sequelize.col('data'), '$.editors'), username)
//         ]
//       };

//       const [updatedCount, updatedPersonas] = await Model.update(
//         { data: sequelize.fn('JSON_MODIFY', sequelize.col('data'), 'append $', JSON.stringify(updateData)) },
//         { where: updateParams, returning: true }
//       );
//       result = updatedPersonas[0];
//     } else {
//       updateParams = isAdmin ? { _id } : {
//         _id,
//         $or: [
//           { owners: username },
//           { editors: username },
//         ]
//       };
//       result = await Model.findOneAndUpdate(updateParams, updateData, { new: true });
//     }

//     if (result) {
//       updatedPersonas.push(useSequelize ? result.get({ plain: true }).data : result);
//     }
//   }

//   return updatedPersonas;
// }

// async function deletePersonas(personas, username, roles) {
//   const Model = getModel();
//   const isAdmin = roles.includes('admin');
//   const results = [];

//   for (let persona of personas) {
//     let deleteParams, result;

//     if (useSequelize) {
//       deleteParams = isAdmin ? { id: persona.id } : {
//         id: persona.id,
//         [sequelize.Op.or]: [
//           sequelize.where(sequelize.fn('JSON_VALUE', sequelize.col('data'), '$.editors'), username),
//           sequelize.where(sequelize.fn('JSON_VALUE', sequelize.col('data'), '$.owners'), username)
//         ]
//       };
//       result = await Model.update(
//         { data: sequelize.fn('JSON_MODIFY', sequelize.col('data'), '$.status', '"inactive"') },
//         { where: deleteParams }
//       );
//     } else {
//       deleteParams = isAdmin ? { uuid: persona.uuid } : {
//         uuid: persona.uuid,
//         $or: [
//           { editors: username },
//           { owners: username },
//         ]
//       };
//       result = await Model.findOneAndUpdate(deleteParams, { $set: { status: 'inactive' } }, { new: true });
//     }

//     if (!result) {
//       results.push({ uuid: persona.uuid, status: "failed", reason: "Permission denied or persona not found." });
//     } else {
//       results.push({ uuid: persona.uuid, status: "success", payload: result });
//     }
//   }

//   return results;
// }

// async function addLink(username, personaUuid, personaLink, linkType) {
//   const Model = getModel();
//   const update = {};

//   if (linkType === 'editorLink') {
//     update.editorLink = personaLink;
//   } else if (linkType === 'viewerLink') {
//     update.viewerLink = personaLink;
//   } else {
//     throw new Error("Invalid linkType");
//   }

//   let query, result;

//   if (useSequelize) {
//     query = {
//       id: personaUuid,
//       [sequelize.Op.or]: [
//         sequelize.where(sequelize.fn('JSON_VALUE', sequelize.col('data'), '$.editors'), username),
//         sequelize.where(sequelize.fn('JSON_VALUE', sequelize.col('data'), '$.owners'), username)
//       ]
//     };
//     result = await Model.update(
//       { data: sequelize.fn('JSON_MODIFY', sequelize.col('data'), `$.${linkType}`, `"${personaLink}"`) },
//       { where: query }
//     );
//   } else {
//     query = {
//       uuid: personaUuid,
//       $or: [
//         { editors: username },
//         { owners: username }
//       ]
//     };
//     result = await Model.updateOne(query, { $set: update });
//   }

//   if (useSequelize ? result[0] === 0 : result.nModified === 0) {
//     throw new Error("Unable to update. Ensure you have the right permissions.");
//   }

//   return result;
// }

// async function getLinkDetails(personaLink) {
//   const Model = getModel();
//   let persona;

//   if (useSequelize) {
//     persona = await Model.findOne({
//       where: {
//         [sequelize.Op.or]: [
//           sequelize.where(sequelize.fn('JSON_VALUE', sequelize.col('data'), '$.editorLink'), personaLink),
//           sequelize.where(sequelize.fn('JSON_VALUE', sequelize.col('data'), '$.viewerLink'), personaLink)
//         ]
//       }
//     });
//     if (persona) {
//       persona = persona.get({ plain: true }).data;
//     }
//   } else {
//     persona = await Model.findOne({ $or: [{ editorLink: personaLink }, { viewerLink: personaLink }] })
//       .select('name description url editorLink viewerLink').lean();
//   }

//   if (persona) {
//     persona.isEditor = persona.editorLink === personaLink;
//     persona.isViewer = persona.viewerLink === personaLink;
//     delete persona.editorLink;
//     delete persona.viewerLink;
//   }

//   return persona;
// }

// async function acceptLink(personaLink, username) {
//   const Model = getModel();
//   let persona, result;

//   if (useSequelize) {
//     persona = await Model.findOne({
//       where: {
//         [sequelize.Op.or]: [
//           sequelize.where(sequelize.fn('JSON_VALUE', sequelize.col('data'), '$.editorLink'), personaLink),
//           sequelize.where(sequelize.fn('JSON_VALUE', sequelize.col('data'), '$.viewerLink'), personaLink)
//         ]
//       }
//     });
//     if (!persona) {
//       throw new Error("Persona not found");
//     }
//     const personaData = persona.get({ plain: true }).data;
//     const updateField = personaData.editorLink === personaLink ? 'editors' : 'viewers';
//     result = await Model.update(
//       { data: sequelize.fn('JSON_MODIFY', sequelize.col('data'), `$.${updateField}`, sequelize.fn('JSON_QUERY', sequelize.col('data'), `$.${updateField}`).concat(`"${username}"`)) },
//       { where: { id: persona.id } }
//     );
//   } else {
//     persona = await Model.findOne({ $or: [{ editorLink: personaLink }, { viewerLink: personaLink }] })
//       .select('editorLink viewerLink');
//     if (!persona) {
//       throw new Error("Persona not found");
//     }
//     const update = persona.editorLink === personaLink
//       ? { $addToSet: { editors: username } }
//       : { $addToSet: { viewers: username } };
//     result = await Model.updateOne({ _id: persona._id }, update);
//   }

//   if (useSequelize ? result[0] === 0 : result.nModified === 0) {
//     throw new Error("Unable to update. The link may have already been accepted.");
//   }
// }

// async function publishPersonas(publishStatus, personaUuids, username, roles) {
//   const Model = getModel();
//   const isAdmin = roles.includes('admin');

//   if (!isAdmin && (publishStatus === 'published' || publishStatus === 'suspended')) {
//     throw new Error("No permission to publish or suspend these personas");
//   }

//   let filter, update, result;

//   if (useSequelize) {
//     filter = {
//       id: { [sequelize.Op.in]: personaUuids },
//     };
//     if (!isAdmin) {
//       filter[sequelize.Op.or] = [
//         sequelize.where(sequelize.fn('JSON_VALUE', sequelize.col('data'), '$.owners'), username),
//         sequelize.where(sequelize.fn('JSON_VALUE', sequelize.col('data'), '$.editors'), username)
//       ]
//     }
//     update = {
//       data: sequelize.fn('JSON_MODIFY', sequelize.col('data'), '$.publishStatus', `"${publishStatus}"`, '$.publishedBy', `"${username}"`)
//     };
//     result = await Model.update(update, { where: filter });
//   } else {
//     filter = { uuid: { $in: personaUuids } };
//     if (!isAdmin) {
//       filter.$or = [
//         { owners: username },
//         { editors: username }
//       ];
//     }
//     update = { $set: { publishStatus: publishStatus, publishedBy: username } };
//     result = await Model.updateMany(filter, update);
//   }

//   return { modifiedCount: useSequelize ? result[0] : result.nModified };
// }

module.exports = {
  getPersonas,
  createPersonas,
  //   updatePersonas,
  //   deletePersonas,
  //   addLink,
  //   getLinkDetails,
  //   acceptLink,
  //   publishPersonas
};
