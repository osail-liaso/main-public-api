var mongoose = require('mongoose');

const LexiconSchema = new mongoose.Schema({}, { 
    strict: false,
    collection: "lexicon",
    timestamps: { createdAt: 'momentCreated', updatedAt: 'momentUpdated' }
  });
  

  LexiconSchema.index({ uuid: 1 }, { unique: true });

module.exports = mongoose.model('Lexicon', LexiconSchema);