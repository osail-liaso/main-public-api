const fs = require("fs");
const ytdl = require("ytdl-core");
const path = require("path");
const spawn = require('child_process').spawn;


const urls = [
    'https://www.youtube.com/watch?v=33mjGmfy7PA&list=RD33mjGmfy7PA&start_radio=1',
    'https://youtu.be/33mjGmfy7PA?si=CwoPsjQvQVOLeGq4',
    '<iframe width="560" height="315" src="https://www.youtube.com/embed/33mjGmfy7PA?si=waqDRL9SYQZwPt_N" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>'
  ];
  
  urls.forEach(url => {
    const videoID = extractVideoId(url);
    if (videoID) {
      console.log(`Extracted video ID: ${videoID}`);
    } else {
      console.log('No video ID found.');
    }
  });

  function extractVideoId(url) {
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
    const match = url.match(regex);
    return match ? match[1] : null;
  }

  async function downloadYouTubeVideo(videoId, downloadPath = './downloads') {
    try {
      const url = `https://www.youtube.com/watch?v=${videoId}`;
      const outputPath = path.join(downloadPath, `${videoId}.mp4`);
  
      // Ensure the download directory exists
      if (!fs.existsSync(downloadPath)) {
        fs.mkdirSync(downloadPath, { recursive: true });
      }
  
      // Download the video and save it to the file
      return new Promise((resolve, reject) => {
        const videoStream = ytdl(url, { quality: 'highest' });
        const fileStream = fs.createWriteStream(outputPath);
  
        videoStream.pipe(fileStream);
  
        fileStream.on('finish', () => {
          resolve(outputPath);
        });
  
        videoStream.on('error', (error) => {
          reject(error);
        });
  
        fileStream.on('error', (error) => {
          fs.unlink(outputPath, (err) => { // Attempt to delete the file if an error occurred
            if (err) console.error(`Error deleting file: ${err.message}`);
          });
          reject(error);
        });
      });
    } catch (error) {
      console.error(`Error downloading video: ${error.message}`);
      throw error;
    }
  }

  async function dl()
  {
    const ytdl = require("@distube/ytdl-core");
// TypeScript: import ytdl from '@distube/ytdl-core'; with --esModuleInterop
// TypeScript: import * as ytdl from '@distube/ytdl-core'; with --allowSyntheticDefaultImports
// TypeScript: import ytdl = require('@distube/ytdl-core'); with neither of the above

// Download a video
ytdl("http://www.youtube.com/watch?v=aqz-KE-bpKQ").pipe(require("fs").createWriteStream("./downloads/video.mp4"));

// Get video info
ytdl.getBasicInfo("http://www.youtube.com/watch?v=aqz-KE-bpKQ").then(info => {
  console.log(info.title);
});

// Get video info with download formats
ytdl.getInfo("http://www.youtube.com/watch?v=aqz-KE-bpKQ").then(info => {
  console.log(info.formats);
});
  }


  function downloadVideoWithVLC(youtubeUrl, videoId, outputFilePath = './downloads/') {
    return new Promise((resolve, reject) => {
      // Use 'cvlc' for headless VLC or 'vlc' if you want the GUI
      const vlcCommand = 'vlc'; // or 'vlc' on some systems
      const args = [
        youtubeUrl,
        '--sout', `#transcode{vcodec=mp4,acodec=mp3,ab=128,channels=2,samplerate=44100}:file{dst=${outputFilePath + videoId}}`,
        'vlc://quit' // Automatically close VLC after the conversion
      ];
  
      const vlcProcess = spawn(vlcCommand, args);
  
      vlcProcess.on('error', (error) => {
        reject(error);
      });
  
      vlcProcess.on('exit', (code) => {
        if (code === 0) {
          resolve(outputFilePath);
        } else {
          reject(new Error(`VLC exited with code ${code}`));
        }
      });
    });
  }


  function headersToJson(path) {
    // Read the contents of the file synchronously
    const input = fs.readFileSync(path, 'utf8');
    const lines = input.split('\n');
    const result = {};
  
    for (let i = 0; i < lines.length; i += 2) {
      const key = lines[i].replace(/:/g, '').trim();
      const value = lines[i + 1] ? lines[i + 1].trim() : null;
      result[key] = value;
    }
  
    // Write the JSON object to a file
    fs.writeFileSync('./downloads/_authHeaders.json', JSON.stringify(result, null, 2), 'utf8');

    return result;
  }
  

module.exports = {
  downloadYouTubeVideo,
  downloadVideoWithVLC,
  dl,
  extractVideoId,
  headersToJson

};
