"use strict";

const execFile = require('child_process').execFile;
const path = require("path");
const connect = require("connect");
const serveStatic = require("serve-static");
const serveStaticFile = require("connect-static-file");
const compression = require("compression");
const app = connect();

const omxplayer_process;
const playaudio = (file) => {
  if(omxplayer_process) {
    omxplayer_process.kill('9');
    omxplayer_process = null;
  }
  omxplayer_process = execFile('omxplayer', ['-o','local',file], (error, stdout, stderr) => {
    if (error) {
        console.error('stderr', stderr);
        throw error;
    }
    console.log('stdout', stdout);
    omxplayer_process = null;
  });
}

setInterval(() => {
  playaudio('audio/example.mp3');
}, 10000);

const PORT = 9000;
const DIRECTORY = "public";
const FILE = "index.html";
const HOST = "0.0.0.0";

exports.start = function(options, _onStarted) {
  options = options || {};

  let port = options.port || process.env.PORT || PORT;
  let directory = options.directory || DIRECTORY;
  let directories = options.directories || [directory];
  let file = options.file || FILE;
  let host = options.host || HOST;
  let onStarted = _onStarted || function() {};

  app.use(compression());

  // First, check the file system
  directories.forEach(directory =>
    app.use(serveStatic(directory, { extensions: ["html"] }))
  );

  // Then, serve the fallback file
  app.use(serveStaticFile(path.join(directory, file)));

  const server = app.listen(port, host, err =>
    onStarted(err, server.address())
  );

  return server;
};
