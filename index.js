"use strict";

const path = require("path");
const websocket = require("websocket");
const omx = require('node-omxplayer');
const connect = require("connect");
const serveStatic = require("serve-static");
const serveStaticFile = require("connect-static-file");
const compression = require("compression");
const app = connect();

let player = omx('./audio/example.mp3','local',true,null,true);
setTimeout(() => {
  player.pause();
}, 10000);

const PORT = 4200;
const DIRECTORY = "";
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
  
  const playerServer = new websocket.server({ httpServer: server, port: 4201 });
  playerServer.on('request', (request) => {
    var connection = request.accept('echo-protocol', request.origin);
    console.log('Connection created at : ', new Date());
    
    // Listening message receiving event by client
    connection.on('message', (message) => {
      let m = message.utf8Data;
      let playing = player.playing;
      if(m == 'play' && !playing) {
        player.play();
      }
      else if (m == 'pause' && playing) {
        player.pause();
      }
      console.log('Received Message: ' + m);

      // Sending response to client's message
      connection.sendUTF(player.playing ? 'playing' : 'paused');
    });
    
    connection.on('close', (reasonCode, description) => {
      console.log('Peer ' + connection.remoteAddress + ' disconnected at : ', new Date());
    });
  });

  return server;
};
