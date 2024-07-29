var router = require('express').Router();
const { isAuthenticated, isAdmin, renewToken } = require('../middleware/verify');

//Import the controller(s)
const accountsController = require('../controllers/accounts');

//Admins only, get the full list of accounts
router.get('/', [isAuthenticated, isAdmin],  accountsController.getAccounts);

//Bootstrap the first account. Only works if there is no osailAdmin, otherwise returns an error
router.get('/bootstrap',   accountsController.bootstrapAdminAccount);

//Login
router.post('/',  accountsController.createNewAccount);
router.post('/login', accountsController.login);

//User Functions
// //Manage Accounts
// router.get('/own',  [isAuthenticated, renewToken], accountsController.accountOwn); //Returns account info
// router.post('/own/update',  [isAuthenticated], accountsController.accountOwnUpdate); //Deletes account
// router.post('/own/delete',  [isAuthenticated], accountsController.accountOwnDelete); //Deletes account

// //Manage Data
// router.post('/own/data/download',  [isAuthenticated, renewToken], accountsController.accountOwnDataDownload);
// router.post('/own/data/upload',  [isAuthenticated, renewToken], accountsController.accountOwnDataUpload);
// router.post('/own/data/delete',  [isAuthenticated, renewToken], accountsController.accountOwnDataDelete);

//export the router back to the index.js page
module.exports = router;