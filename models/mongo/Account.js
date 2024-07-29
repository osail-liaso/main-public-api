var mongoose = require("mongoose");

const AccountSchema = new mongoose.Schema({}, { 
  strict: false,
  collection: "accounts",
  timestamps: { createdAt: 'momentCreated', updatedAt: 'momentUpdated' }
});

AccountSchema.index({ uuid: 1 }, { unique: true });

const Account = mongoose.model("Account", AccountSchema);
module.exports = {Account};
