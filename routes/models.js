var router = require('express').Router();
const { isAuthenticated, isAdmin, renewToken } = require('../middleware/verify');

//Get the controller
const modelsController = require('../controllers/models');

//Setup - Bootstrap an initial set of Models for testing
router.get('/bootstrap', modelsController.bootstrapModels);

//Recall
router.get('/', modelsController.getModels);

//Create
router.post('/', [isAuthenticated, renewToken], modelsController.createModels);

//Update
router.patch('/', [isAuthenticated, renewToken], modelsController.updateModels);

//Delete
router.post('/delete', [isAuthenticated, renewToken], modelsController.deleteModels);

//export the router back to the index.js page
module.exports = router;