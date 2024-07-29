//Import Required Libraries for this .js
const express = require("express");
const path = require('path');
const { app } = require("./config/app.js");

//Bring in custom error handling
const apiErrorHandler = require('./error/apiErrorHandler');

//Establish the Routes and Static Content
//Static Content
app.get('/assets/osail.webp', (req, res) => res.status(204));
app.use('/', express.static(path.join(__dirname, '/public')))
 
//Core Services
app.use('/healthcheck', require('./routes/healthcheck')); //Perform a basic healthcheck
app.use('/stats', require('./routes/stats')); // Load the stats from the server side

//Use Models
app.use('/accounts', require('./routes/accounts'));
app.use('/models', require('./routes/models'));
app.use('/lexicon', require('./routes/lexicon'));
app.use('/personas', require('./routes/personas'));
  

// const {transcribeFile} = require("./tools/deepgram.js")
// const {videoToAudio} = require("./tools/ffmpeg.js")
// const {downloadYouTubeVideo, extractVideoId, dl, downloadVideoWithVLC, headersToJson} = require("./tools/youtube.js")


// let url = 'https://www.youtube.com/watch?v=gWccaEqn9n0&t=2027s';
// let videoId = extractVideoId(url);
// dl();
// downloadYouTubeVideo(videoId).then((outputPath)=>{
//     console.log("outputPath", outputPath)
// })

// downloadVideoWithVLC(url, videoId);

//Convert headers to JSON
// let myAuthHeaders = headersToJson("./downloads/_authHeaders.txt");
// console.log("Cookie", myAuthHeaders.Cookie)

//  transcribeFile("sinek.mp3").then((results)=>{
//     console.log('deepgram results', results)

// });

//Establish a 404 Not Found Custom Response
app.use((req, res, next) => {
    const error = new Error('This site was not found. Perhaps you want to call login?');
    error.status = 404;
    next(error);
})

//Implement the API Error Handler to catch everything
app.use(apiErrorHandler);
