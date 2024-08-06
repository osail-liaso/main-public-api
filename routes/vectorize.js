var router = require('express').Router();
const { isAuthenticated, isAdmin, renewToken } = require('../middleware/verify');

//Import the controller(s)
const vectorizeController = require('../controllers/vectorize');

//Admins only, get the full list of accounts
router.post('/', [],  vectorizeController.vectorize);

//export the router back to the index.js page
module.exports = router;