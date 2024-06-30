var router = require('express').Router();
const { isAuthenticated, isAdmin, renewToken } = require('../middleware/verify');

//Get the controller
const statsController = require('../controllers/_config/stats');
// router.get('/parse', [checkAndAssignToken], filesController.parseFiles);

router.get('/', [], statsController.getStats);

//export the router back to the index.js page
module.exports = router;