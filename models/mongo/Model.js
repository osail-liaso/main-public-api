const mongoose = require("mongoose");

const ModelSchema = new mongoose.Schema(
  {},
  {
    strict: false,
    collection: "models",
    timestamps: { createdAt: "momentCreated", updatedAt: "momentUpdated" },
  }
);

ModelSchema.index({ uuid: 1 }, { unique: true });


const Model = mongoose.model("Model", ModelSchema);
module.exports = {Model};
