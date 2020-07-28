console.log("my socket server is running!")

/*
var express = require('express');
var app = express();
var serv = require('http').Server(app);

app.get('/', function(req, res) {
  res.sendFile(__dirname + '/client/index.html');
});
app.use('/client',express.static(__dirname + '/client'));

serv.listen(2000);
*/


//using "EXPRESS" to connect the server to the web page
var express = require('express');
var app = express();
var server = app.listen(3000);  //Port: 3000 ==> URL: localhost:3000

//connecting client information (from sketch.js) to the server and reflecting onto web page
app.use(express.static(__dirname + '/public'));

//importing "SOCKET.IO" to the server
var socket = require('socket.io');
var io = socket(server);

//TEMPORARY list of current players
var online = [];

//VERY useful cheatsheet: https://socket.io/docs/emit-cheatsheet/
io.sockets.on('connection', function (socket) {

    //check terminal or CMD for the id of every client in the server
    console.log("new connection = " + socket.id);

    //TEMPORARYily immediately push new connections to online list
    online.push(socket.id);

    if(online.length >= 2) {
        socket.broadcast.emit('start', { users: online.length });
    }

    socket.on('JoinRoom', function(data) {
        //TODO send room dynamically from url client-side
        socket.join(data.gameId);
    });

    socket.on('DelPlayer', function(data) {



    });

    socket.on('UpdatePosition', function(data) {

        socket.to(data.gameId).emit('UpdatePosition', data);
    });

    socket.on('disconnect', function () {

        const index = online.indexOf(socket.id);
        online.splice(index, 1);

        socket.emit('disconnected');
        console.log(`${socket.id} left`)

    });

});
