 


 
exports.getPersonas = async function (req, res, next) {
  
      res.status(200).json({ message: "Here are all the active personas", payload: null });
    
};

exports.createPersonas = async function (req, res, next) {
  
    res.status(200).json({ message: "Persona created", payload: null });
  
};

exports.updatePersonas = async function (req, res, next) {
 
    res.status(200).json({ message: "Updated personas", payload: null });
}

exports.deletePersonas = async function (req, res, next) {
  
    res.status(200).json({ message: "Deleted personas", results: null });
 };

exports.addLink = async function (req, res, next) {
  
    res.status(201).json({
      message: "Link Added to persona",
      payload: null
    });
  
};

exports.linkDetails = async function (req, res, next) {
  // try {
  //   const personaLink = req.body.personaLink || req.query.personaLink || "";
  //   const persona = await getLinkDetails(personaLink);

  //   if (persona) {
  //     res.status(201).json({
  //       message: "Here is the persona",
  //       payload: persona
  //     });
  //   } else {
  //     res.status(404).json({ message: "Persona not found" });
  //   }
  // } catch (error) {
  //   next(error);
  // }
};

exports.acceptLink = async function (req, res, next) {
  // try {
  //   const personaLink = req.body.personaLink || req.query.personaLink || "";
  //   const username = req.tokenDecoded?.username;

  //   if (!username) {
  //     throw ApiError.badRequest("Username not found in token");
  //   }

  //   await acceptLink(personaLink, username);

  //   res.status(201).json({
  //     message: "Persona link accepted"
  //   });
  // } catch (error) {
  //   next(error);
  // }
};

exports.publishPersonas = [
  // async function (req, res, next) {
  //   try {
  //     const { publishStatus, personaUuids } = req.body;
  //     const username = req.tokenDecoded?.username;
  //     const roles = req.tokenDecoded?.roles || [];

  //     const result = await publishPersonas(publishStatus, personaUuids, username, roles);

  //     res.status(200).json({
  //       message: "Publish status updated",
  //       modifiedCount: result.modifiedCount
  //     });
  //   } catch (error) {
  //     next(error);
  //   }
  // }
];