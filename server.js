const debug = false;

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

//using 'Mongoose' to connect to the mongodb to store active games
var mongoose = require('mongoose');
//using "EXPRESS" to connect the server to the web page
var express = require('express');
var app = express();
var server = app.listen(process.env.PORT || 3000);  //Port: 3000 ==> URL: localhost:3000

const Game = require('./gameSchema');

//useNewUrlParser and unseUnifiedTopology avoids deprecated warning
db = mongoose.connect(`mongodb+srv://code:${process.env.MONGO_PW}@gcpcluster0.vmilr.gcp.mongodb.net/pacman?retryWrites=true&w=majority`, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// When successfully connected
mongoose.connection.on('connected', function () {
  debugLog('Mongoose default connection open');
});

// If the connection throws an error
mongoose.connection.on('error',function (err) {
  debugLog('Mongoose default connection error: ' + err);
});

// When the connection is disconnected
mongoose.connection.on('disconnected', function () {
  debugLog('Mongoose default connection disconnected');
});

app.use(express.static(__dirname + '/public'));
app.get('/', function(req, res) {
  res.sendFile(__dirname + '/index.html');
});

//importing "SOCKET.IO" to the server
var socket = require('socket.io');
var io = socket(server);

//TEMPORARY list of current players
var online = [];

//VERY useful cheatsheet: https://socket.io/docs/emit-cheatsheet/
io.sockets.on('connection', function (socket) {

    //check terminal or CMD for the id of every client in the server
    debugLog("new connection = " + socket.id);

    //TEMPORARYily immediately push new connections to online list
    online.push(socket.id);

    if(online.length >= 2) {
        socket.broadcast.emit('start', { users: online.length });
    }

    socket.on('JoinRoom', function(data) {
        //TODO send room dynamically from url client-side
        socket.join(data.gameId);

        Game.findOne({roomId: data.gameId}, (err, game) => {
            handleError(err);
            //game not found in db, so create it
            if (game != null) {
                let newUser = {id: socket.id, score: 0};
                Game.updateOne(
                    { _id: game._id },
                    { $push: { users: newUser } },
                    (err, result) => {
                        handleError(err);
                        // debugLog(result);
                    }
                );
            } else {
                const newGame = new Game({
                    _id: new mongoose.Types.ObjectId(),
                    roomId: data.gameId,
                    users: [{
                        id: socket.id,
                        score: 0
                    }],
                    pacmanIndex: 0
                });
                newGame.save().then(result => {
                    // debugLog(result);
                }).catch(err => handleError(err));
            }

            getNumOfUsers(data.gameId).then((value) => {
                // 2 IS FOR TESTING, 4 IN PRODUCTION
                if (value >= 2) {
                    io.sockets.in(data.gameId).emit('StartGame', {id: socket.id});
                }
            });
        });
    });

    socket.on('UpdatePosition', function(data) {

        socket.to(data.gameId).emit('UpdatePosition', data);
    });


    //When a user is disconnecting, alert all users in the room to remove the character.
    //Remove the user from the room's user array in its mongodb document.
    //Delete the room's mongodb document if there are no more users connected.
    socket.on('disconnecting', () => {
        const rooms = Object.keys(socket.rooms);
        for (let room of rooms) {
            //All roomIds will start with a #
            if (room.startsWith('#')) {
                socket.to(room).emit('DeleteCharacter', {id: socket.id});
                //Remove the disconnecting user from the room's users array
                Game.updateOne(
                    { roomId: room },
                    { $pull: {"users": {id: socket.id} } },
                    (err, result) => {
                        handleError(err);
                        debugLog(`Removing ${socket.id} from ${room}`);

                        //Delete room if there are no more users connected
                        getNumOfUsers(room).then((value) => {
                            if (value == 0) {
                                Game.deleteOne(
                                    { roomId: room },
                                    (err) => {
                                        handleError(err);

                                        debugLog(`Deleting ${room} because there are no users`);
                                    }
                                )
                            }
                        });
                    }
                );
            }
        }
        // the rooms array contains at least the socket ID
    });

    socket.on('disconnect', function () {

        const index = online.indexOf(socket.id);
        online.splice(index, 1);

        socket.emit('disconnected');
        debugLog(`${socket.id} left`)

    });

});

//Get the current number of users in a room specified by roomId
//Returns a Promise because .aggregate.exec is asynchronous
async function getNumOfUsers(roomId) {
    return new Promise((resolve, reject) => {
        Game.aggregate()
                   .match( { roomId: roomId } )
                   .project( { users: { $size:"$users" } } )
                   .exec((err, res) => {
                       if (err) {
                           reject(err);
                       }
                       if (res && res[0]) {
                           resolve(res[0].users);
                       } else {
                           resolve(0);
                       }
                   });
    });
}

//Print an error if there is one
function handleError(err) {
    if (err) {
        debugLog(err);
        return;
    }
}

//Print if in debug mode
function debugLog(str) {
    if (debug) {
        console.log(str);
    }
}
