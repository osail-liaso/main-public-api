require('dotenv').config() //load the env variables from the .env file
var mongoose = require('mongoose');

let _db;// validate if the db has already been initiated and if so, exit
var url = process.env.MONGODB; //Connection string is set through system variables

//Mongoose Options
var options = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
};

function initDb(callback) {
    //Prevent multiple accidential connections
    if (_db) {
        console.warn("Trying to init DB again!");
        return callback(null, _db);
    }

    //Connect
    mongoose.connect(url, options).then((connection)=>{
        _db = connection;
        console.log(`Connected to ${process.env.DATASTORE} with the Mongoose ODM Plugin`);
    }).catch((error)=>{
        console.log(error)
    });

    
};

//Expoert out initDb and Mongoose for later reuse
module.exports = {
    initDb,
    mongoose,
};
