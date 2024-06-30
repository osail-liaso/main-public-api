const ApiError = require("../error/ApiError");

// Import the DAL functions
const {
  getAllLexicon,
  updateLexicon,
  deleteLexicon,
} = require('../dal/lexiconDal');

exports.getLexicon = async function (req, res, next) {
  try {
    const lexiconEntries = await getAllLexicon();
    
    if (lexiconEntries.length > 0) {
      res.status(200).json({ message: "Lexicon entries retrieved successfully", payload: lexiconEntries });
    } else {
      res.status(404).json({ message: "No lexicon entries found", payload: null });
    }
  } catch (error) {
    next(error);
  }
};

exports.updateLexicon = async function (req, res, next) {
  try {
    const { words } = req.body;

    if (!Array.isArray(words)) {
      throw ApiError.badRequest("Invalid input. 'words' must be an array.");
    }

    const isValidWord = (word) => {
      if (!word || typeof word !== 'object') return false;
      if (typeof word.code !== 'string' || word.code.trim() === '') return false;
      if (typeof word.word !== 'object' || word.word === null) return false;
      if (word.keywords && !Array.isArray(word.keywords)) return false;
      if (word.keywords && word.keywords.some(kw => typeof kw !== 'string')) return false;
      return true;
    };

    if (!words.every(isValidWord)) {
      throw ApiError.badRequest("Invalid input. Each 'word' must have a valid 'code', 'word' object, and an optional array of 'keywords'.");
    }

    const updatedLexicons = await updateLexicon(words);

    if (updatedLexicons.length > 0) {
      res.status(200).json({ message: "Lexicon updated successfully", payload: updatedLexicons });
    } else {
      res.status(404).json({ message: "No lexicon entries were updated", payload: null });
    }
  } catch (error) {
    next(error);
  }
};

exports.deleteLexicon = async function (req, res, next) {
  try {
    const { code } = req.params;
    
    if (!code) {
      throw ApiError.badRequest("Lexicon code is required for deletion.");
    }

    const deleteResult = await deleteLexicon(code);

    if (deleteResult) {
      res.status(200).json({ message: "Lexicon entry deleted successfully", payload: null });
    } else {
      res.status(404).json({ message: "Lexicon entry not found or could not be deleted", payload: null });
    }
  } catch (error) {
    next(error);
  }
};