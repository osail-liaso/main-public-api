const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const spawn = require('child_process').spawn;

async function videoToAudio(inputFile, outputFile, bitrate = "192k") {
    return new Promise((resolve, reject) => {
        const args = [
            '-i', inputFile,             // Input file
            '-vn',                       // No video (audio only)
            '-ar', '44100',              // Audio sample rate
            '-ac', '2',                  // Set audio channels to 2 (stereo)
            '-b:a', bitrate,             // Audio bitrate (you can adjust this for compression)
            '-f', 'mp3',                 // Output format
            outputFile                   // Output file
        ];

        const ffmpeg = spawn(ffmpegPath, args);

        //The example shows onExit. Check to see if this is the correct syntax
        ffmpeg.on('exit', 
            (exitMessage)=>{
                console.log('exit', exitMessage)
                resolve(exitMessage);
            }
        );

        ffmpeg.on('close', (code) => {
            if (code === 0) {
                resolve(outputFile); // Resolve with the output file path if successful
            } else {
                reject(new Error(`FFmpeg exited with code ${code}`)); // Reject the Promise if FFmpeg failed
            }
        });

        ffmpeg.stderr.on('data', (data) => {
            console.error(`stderr: ${data}`);
        });

        ffmpeg.stdout.on('data', (data) => {
            console.log(`stdout: ${data}`);
        });
    });
}

module.exports = {
    videoToAudio
};