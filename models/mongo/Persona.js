// models/Persona.js

const mongoose = require("mongoose");
const PersonaSchema = new mongoose.Schema(
  {},
  {
    strict: false,
    collection: "personas",
    timestamps: { createdAt: "momentCreated", updatedAt: "momentUpdated" },
  }
);

//Add unique indexes
PersonaSchema.index({ uuid: 1 }, { unique: true });
const Persona = mongoose.model("Persona", PersonaSchema);
module.exports = Persona;
