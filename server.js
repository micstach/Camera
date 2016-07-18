var port = process.env.PORT || 80;

var express = require('express');
var http = require('http');
var websocket = require('websocket');

var app = express() ;


app.set('views', __dirname + '/views');  
app.set('view engine', 'ejs');  

app.use(express.static(__dirname));

app.get('/', function(req, res){
  var wsUrl = 'ws://192.168.0.109';
  if (process.env.PORT) {
    wsUrl = 'wss://videochat-micstach.herokuapp.com';
  }
  res.render('index', {webSocketUrl: wsUrl});
});

var httpServer = http.createServer(app) ;
httpServer.listen(port);

var webSocketClients = [];

var webSocketServer = new websocket.server({
    httpServer: httpServer,
    maxReceivedFrameSize: 0x1000000
});

webSocketServer.on('request', function(request) {
    console.log((new Date()) + ' Connection from origin ' + request.origin + '.');

    // accept connection - you should check 'request.origin' to make sure that
    // client is connecting from your website
    // (http://en.wikipedia.org/wiki/Same_origin_policy)
    var connection = request.accept(null, request.origin); 
    console.log(JSON.stringify(connection.remoteAddress));
    // we need to know client index to remove them on 'close' event
    var index = webSocketClients.push(connection) - 1;

    console.log((new Date()) + ' Connection accepted.');

    // user sent some message
    connection.on('message', function(message) {
      var clientIdx = webSocketClients.indexOf(connection) ;

      for (var i=0; i<webSocketClients.length; i++) {
        if (connection !== webSocketClients[i]) {
          var messageData = JSON.parse(message.utf8Data);

          if (messageData.video){
            webSocketClients[i].sendUTF(JSON.stringify({id: clientIdx, video: messageData.video})) ;
          }

          if (messageData.audio) {
            webSocketClients[i].sendUTF(JSON.stringify({id: clientIdx, audio: messageData.audio})) ;
          }
        }
      }
    });

    connection.on('close', function() {

      var clientIdx = webSocketClients.indexOf(connection) ;
      for (var i=0; i<webSocketClients.length; i++) {
        if (connection !== webSocketClients[i]) {
          webSocketClients[i].sendUTF(JSON.stringify({id: clientIdx, video: ""})) ;
        }
      }

      webSocketClients.splice(clientIdx, 1);
    });

});