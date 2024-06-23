var router = require('express').Router();
const { isAuthenticated, isAdmin, renewToken } = require('../middleware/verify');

//Get the controller
const cleanController = require('../controllers/clean');

//Do the clean
router.post('/', [isAuthenticated, isAdmin, renewToken], cleanController.cleanCollectionsByKeyword);

//export the router back to the index.js page
module.exports = router;