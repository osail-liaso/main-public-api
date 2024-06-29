var router = require('express').Router();
const bootstrapController = require('../controllers/_config/bootstrap');
const modelsController = require('../controllers/models');

//Sub Routes
router.get('/admin', bootstrapController.createAdminAccount);
router.get('/personas', bootstrapController.createDefaultPersonas);
router.get('/models', modelsController.bootstrapModels);

//export the router back to the index.js page
module.exports = router;