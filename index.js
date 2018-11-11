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
const togglePlayer = () => { if(player) player.play(); };
setTimeout(() => {
  togglePlayer();
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
  playerServer.on('connection', ws => {
    ws.on('message', message => {
      togglePlayer();
      console.log('Toggling player');
      console.log(`Received message => ${message}`)
    })
    ws.send('Welcome!');
    console.log('Connection!');
  });

  return server;
};
