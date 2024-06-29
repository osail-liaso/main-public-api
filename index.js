//Import Required Libraries for this .js
const express = require("express");
const path = require('path');
const { app } = require("./config/app.js");

//Bring in custom error handling
const apiErrorHandler = require('./error/apiErrorHandler');

//Establish the Routes and Static Content
//Static Content
app.get('/favicon.ico', (req, res) => res.status(204));
app.use('/', express.static(path.join(__dirname, '/public')))
 
//Core Services
app.use('/healthcheck', require('./routes/healthcheck')); //Perform a basic healthcheck
app.use('/stats', require('./routes/stats')); // Load the stats from the server side
app.use('/bootstrap', require('./routes/bootstrap')); // Create the admin acccount to begin onboarding other accounts

//Use Models
app.use('/accounts', require('./routes/accounts'));
app.use('/models', require('./routes/models'));
// app.use('/lexicon', require('./routes/lexicon'));
// app.use('/personas', require('./routes/personas'));
  
//Establish a 404 Not Found Custom Response
app.use((req, res, next) => {
    const error = new Error('This site was not found. Perhaps you want to call login?');
    error.status = 404;
    next(error);
})

//Implement the API Error Handler to catch everything
app.use(apiErrorHandler);
