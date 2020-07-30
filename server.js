const debug = true;
const minPlayersPerGame = 2;

//using "EXPRESS" to connect the server to the web page
var express = require('express');
var app = express();
var server = app.listen(process.env.PORT || 3000);  //Port: 3000 ==> URL: localhost:3000

var rooms = {};


app.use(express.static(__dirname + '/public'));

app.get('/game/*', function(req, res) {
    res.sendFile(__dirname + '/public/game.html');
});

app.get('/', function(req, res) {
    res.sendFile(__dirname + '/public/index.html');
});

//importing "SOCKET.IO" to the server
var socket = require('socket.io');
var io = socket(server);

//VERY useful cheatsheet: https://socket.io/docs/emit-cheatsheet/
io.sockets.on('connection', function (socket) {

    socket.on('JoinRoom', function(data) {

        socket.join(data.gameId);

        let room = rooms[data.gameId];

        if (room == undefined) {
            rooms[data.gameId] = new Room(data.gameId);
            room = rooms[data.gameId];
        }

        room.addUser({
            id: socket.id,
            name: data.name,
            score: 0
        });
        debugLog(`Room: ${room.id} (${room.numUsers()} Active Users)`);
        io.sockets.in(data.gameId).emit('UpdateSpectators', {users: room.users});

        if (room.numUsers() >= minPlayersPerGame) {
            //Give the users a chance to update their otherUsers arrays
            setTimeout(() => {
                let assignments = room.getCharacterAssignments();
                io.sockets.in(data.gameId).emit('StartGame', {assignments: assignments});
                io.sockets.in(data.gameId).emit('UpdateSpectators', {users: room.users, assignments: assignments});
            }, 1000);
        }

    });

    socket.on('GetAvailibleRooms', function() {

        let availibleRooms = [];

        for (let key in rooms) {
            let room = rooms[key];

            if (room.numUsers() < minPlayersPerGame) {
                availibleRooms.push(room);
            }
        }

        socket.emit('AvailibleRooms', {availible: availibleRooms});
    });

    socket.on('RoundOver', function(data) {

        let room = rooms[data.gameId];
        //Increase score of winner and pacman
        if(data.winner != null) {
            room.users[data.winner].score += 20;
        }
        room.users[data.id].score += data.foodEaten;

        io.sockets.in(data.gameId).emit('ResetGame');
        room.nextRound();

        io.sockets.in(data.gameId).emit('SyncPosition');

        //Give the users a chance to update their otherUsers arrays
        setTimeout(() => {
            let assignments = room.getCharacterAssignments();
            io.sockets.in(data.gameId).emit('StartGame', {assignments: assignments});
            io.sockets.in(data.gameId).emit('UpdateSpectators', {users: room.users, assignments: assignments});
        }, 1000);
    });

    socket.on('SpectateRoom', function(data) {

        socket.join(data.gameId);

    });

    socket.on('UpdatePosition', function(data) {

        socket.to(data.gameId).emit('UpdatePosition', data);
    });


    //When a user is disconnecting, alert all users in the room to remove the character.
    //Remove the user from the room's user array.
    //Delete the room from the rooms dictionary if there aren't any connected users.
    socket.on('disconnecting', () => {
        const usersRooms = Object.keys(socket.rooms);
        for (let roomName of usersRooms) {
            //All roomIds will start with a #
            if (roomName.startsWith('#')) {
                socket.to(roomName).emit('DeleteCharacter', {id: socket.id});

                let room = rooms[roomName];
                if (room) {
                    room.deleteUser(socket.id);

                    if (room.numUsers() == 0) {
                        delete rooms[roomName];
                        debugLog(`Deleting Room ${roomName} because there are no users`);
                    } else if (room.numUsers() < minPlayersPerGame) {
                        io.sockets.in(roomName).emit('ResetGame');
                    }
                }
            }
        }
        // the rooms array contains at least the socket ID
    });

    socket.on('disconnect', function () {

        socket.emit('disconnected');
        debugLog(`${socket.id} left`)

    });

});

//Print if in debug mode
function debugLog(str) {
    if (debug) {
        console.log(str);
    }
}

class Room {
    constructor(id) {
        this.id = id;
        this.users = {};
        this.pacIndex = 0;
    }

    addUser(user) {
        this.users[user.id] = user;
    }

    deleteUser(id) {
        delete this.users[id];
    }

    numUsers() {
        return Object.keys(this.users).length;
    }

    getCharacterAssignments() {

        let assignments = {};
        let roles = [];
        for (let i = 0; i < this.numUsers(); i++) {
            roles.push(i);
        }

        roles = roles.concat(roles.splice(0, this.pacIndex % this.numUsers()));

        let i = 0;
        for (let key in this.users) {
            assignments[key] = roles[i];
            i++;
        }

        return assignments;
    }

    nextRound(gameOverCallback) {
        this.pacIndex++;
    }
}
