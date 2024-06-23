var router = require('express').Router();
const bootstrapController = require('../controllers/_config/bootstrap');

//Sub Routes
router.get('/', bootstrapController.createDefaultSettings);

//export the router back to the index.js page
module.exports = router;