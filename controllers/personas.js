const ApiError = require("../error/ApiError");
const {
  getPersonas,
  createPersonas,
  updatePersonas,
  deletePersonas,
  addLink,
  getLinkDetails,
  acceptLink,
  publishPersonas
} = require('../dal/personasDal');

exports.getPersonas = async function (req, res, next) {
  try {
    const viewAll = req.body.viewAll || req.query.viewAll || false;
    const username = req?.tokenDecoded?.username || null;
    const userUuid = req.tokenDecoded?.uuid;
    const roles = req?.tokenDecoded?.roles || [];

    const personas = await getPersonas(viewAll, username, userUuid, roles);

    if (personas.length > 0) {
      res.status(200).json({ message: "Here are all the active personas", payload: personas });
    } else {
      res.status(404).json({ message: "No active personas found", payload: [] });
    }
  } catch (error) {
    next(error);
  }
};

exports.createPersonas = async function (req, res, next) {
  try {
    let personas = req.body.personas || req.query.personas || [];
    if (!Array.isArray(personas)) personas = [personas];

    const username = req.tokenDecoded?.username;
    const userUuid = req.tokenDecoded?.uuid;
    const results = await createPersonas(personas, username, userUuid);

    res.status(201).json({ message: "Created all the identified personas", payload: results });
  } catch (error) {
    next(error);
  }
};

exports.updatePersonas = async function (req, res, next) {
  try {
    let personas = req.body.personas || req.query.personas || [];
    if (!Array.isArray(personas)) personas = [personas];
    
    const username = req.tokenDecoded?.username;
    const userUuid = req.tokenDecoded?.username;
    const roles = req.tokenDecoded?.roles || [];

    const updatedPersonas = await updatePersonas(personas, username, userUuid, roles);

    res.status(201).json({ message: "Here are your updated personas", payload: updatedPersonas });
  } catch (error) {
    next(error);
  }
};

exports.deletePersonas = async function (req, res, next) {
  try {
    const personas = req.body.personas || req.query.personas || [];
    const username = req.tokenDecoded?.username;
    const roles = req.tokenDecoded?.roles || [];

    const results = await deletePersonas(personas, username, roles);

    res.status(201).json({ message: "Processed personas", results: results });
  } catch (error) {
    next(error);
  }
};

exports.addLink = async function (req, res, next) {
  try {
    const username = req.tokenDecoded?.username;
    const { personaUuid, personaLink, linkType } = req.body;

    if (!username) {
      throw ApiError.badRequest("Username not found in token");
    }

    const updatedPersona = await addLink(username, personaUuid, personaLink, linkType);

    res.status(201).json({
      message: "Link Added to persona",
      payload: updatedPersona
    });
  } catch (error) {
    next(error);
  }
};

exports.linkDetails = async function (req, res, next) {
  try {
    const personaLink = req.body.personaLink || req.query.personaLink || "";
    const persona = await getLinkDetails(personaLink);

    if (persona) {
      res.status(201).json({
        message: "Here is the persona",
        payload: persona
      });
    } else {
      res.status(404).json({ message: "Persona not found" });
    }
  } catch (error) {
    next(error);
  }
};

exports.acceptLink = async function (req, res, next) {
  try {
    const personaLink = req.body.personaLink || req.query.personaLink || "";
    const username = req.tokenDecoded?.username;

    if (!username) {
      throw ApiError.badRequest("Username not found in token");
    }

    await acceptLink(personaLink, username);

    res.status(201).json({
      message: "Persona link accepted"
    });
  } catch (error) {
    next(error);
  }
};

exports.publishPersonas = [
  async function (req, res, next) {
    try {
      const { publishStatus, personaUuids } = req.body;
      const username = req.tokenDecoded?.username;
      const roles = req.tokenDecoded?.roles || [];

      const result = await publishPersonas(publishStatus, personaUuids, username, roles);

      res.status(200).json({
        message: "Publish status updated",
        modifiedCount: result.modifiedCount
      });
    } catch (error) {
      next(error);
    }
  }
];