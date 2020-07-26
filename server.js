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
app.use(express.static('public'));

//importing "SOCKET.IO" to the server
var socket = require('socket.io');
var io = socket(server);
io.sockets.on('connection', newConnection);

function newConnection(socket) {
  //check terminal or CMD for the id of every client in the server
  console.log("new connection = " + socket.id);

  //TODO: logging down information from client to the server
  socket.on('mouse', mouseMsg);

  function mouseMsg(data) {
    //TODO: server sending out the information from client and broadcasting it
    socket.broadcast.emit('mouse', data);
    //another possibility - sending information back to original server too
    //io.sockets.emit('mouse', data);

    console.log(data);
  }

}
