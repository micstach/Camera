var express = require('express');
var http = require('http');
var websocket = require('websocket');

var app = express() ;

app.use(express.static(__dirname + '/'));

var port = process.env.PORT || 80;

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

    // we need to know client index to remove them on 'close' event
    var index = webSocketClients.push(connection) - 1;

    console.log((new Date()) + ' Connection accepted.');

    // user sent some message
    connection.on('message', function(message) {
      connection.sendUTF(message.utf8Data) ;
    });

    connection.on('close', function(connection) {
      console.log('WebSocket connection closed: '+JSON.stringify(connection));
    });

});