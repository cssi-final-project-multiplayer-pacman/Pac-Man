const squareSize = 20;
const playerSize = squareSize * 4/5;

let socket, maze, sessionId, pac, otherUsers;

function setup() {
    //Start the socket connection
    socket = io.connect('http://localhost:3000');

    //Capture client id to avoid rendering itself
    var socketConnection = io.connect();
    socket.on('connect', function() {
        sessionId = socket.id;
        pac.setId(sessionId);

        socket.emit('JoinRoom', {gameId: 'temp-game-id'});
    });

    //Create canvas
    const cv = createCanvas(400, 400);
    //Add id and make child of game-div to apply styling in style.css
    cv.id('main-game');
    cv.parent('game-div');
    //Use constant frame rate to keep num of updates the same for all users
    //(prevents one user from moving quicker due to more draw commands)
    frameRate(30);
    cv.background(0);

    otherUsers = {};
    maze = new Maze(squareSize);
    maze.drawWalls();
    maze.drawFood();

    socket.on('UpdatePosition', data => {
        //Only render other characters if they have a valid id
        if (data.id != -1) {
            //Lookup character that sent the update using the id it sent
            let char = otherUsers[data.id];

            //Updating or add the character that sent the update
            if (char != undefined) {
                char.pos = createVector(data.x, data.y);
                char.dir = createVector(data.dirX, data.dirY);
            } else {
                let pos = createVector(data.x, data.y);
                let dir = createVector(data.dirX, data.dirY);
                otherUsers[data.id] = new Character(pos, dir, maze);
            }
        }
    });

    pac = new Character(createVector(30, 30), createVector(1, 0), maze);
}

function draw() {
    maze.drawEmpty();
    maze.drawFood();

    pac.move((id, pos, dir) => {
        socket.emit('UpdatePosition', {gameId: 'temp-game-id', id: id, x: pos.x, y: pos.y, dirX: dir.x, dirY: dir.y});
    });

    pac.draw();

    for (let key in otherUsers) {
        let char = otherUsers[key];

        //Passing an empty callback, because this character shouldn't update
        //the position of another character
        char.move(() => {});

        char.draw();
    }
}

//Set desiredDir of character in the direction indicated by the arrow keys
function keyPressed() {
    if (keyCode === LEFT_ARROW) {
        pac.setDesiredDir(createVector(-1, 0));
    } else if (keyCode === RIGHT_ARROW) {
        pac.setDesiredDir(createVector(1, 0));
    } else if (keyCode === UP_ARROW) {
        pac.setDesiredDir(createVector(0, -1));
    } else if (keyCode === DOWN_ARROW) {
        pac.setDesiredDir(createVector(0, 1));
    }
}

class Character {

    //Create a new Character by passing the initial position, direction, and maze object
    constructor(pos, dir, maze) {
        this.id = -1; //Default id, will not get added to otherUsers if id == -1
        this.pos = pos;
        this.dir = dir;
        this.queuedDir = dir.copy();
        this.maze = maze;
    }

    //Set the desired direction for this Character
    //The direction may or may not change based on factors calculated in 'move'
    setDesiredDir(desiredDir) {
        this.queuedDir = desiredDir;
    }

    //Move the character if is appropriate to do so (center of tile, not going into a wall, etc)
    //Calls updatePositionCallback(id, pos, dir) at the center of every tile
    //also handles eating food
    move(updatePositionCallback) {
        //Update the direction if the character is centerd in a square
        //and if the queued direction isn't the same as the current direction
        //If the tile in the queued direction is a Wall, reset queuedDir to dir
        //(this just makes movement a little more difficult and closer to the original)
        if (this.isCenteredInSquare(this.pos.x, this.pos.y) && !this.queuedDir.equals(this.dir)) {
            if (this.nextTileInDirIsWall(this.pos, this.queuedDir)) {
                this.queuedDir = this.dir;
            } else {
                this.dir = this.queuedDir.copy();
                //Sync immediately when the direction changes
                updatePositionCallback(this.id, this.pos, this.dir);
            }
        }

        //Add dir to a copy of pos
        let newPos = this.pos.copy();
        newPos.add(this.dir);

        //If the character is centered, check the next tile in the direction of dir
        //If that tile is a wall, keep the character where it is, else move it by dir
        if (this.isCenteredInSquare(this.pos.x, this.pos.y)) {
            let currentTile = this.maze.getIndexByCoords(newPos.x, newPos.y);
            if (this.maze.getTileByIndex(currentTile.col + this.dir.x, currentTile.row + this.dir.y) == Maze.WALL) {
                newPos = this.pos;
            }

            //Only sync if the character is actually moving
            //(i.e. not staying still against a wall)
            if (newPos != this.pos) {
                updatePositionCallback(this.id, newPos, this.dir);
            }
        }
        this.pos = newPos;

        //Check if character runs into a food
        if (this.maze.getTile(this.pos.x, this.pos.y) == Maze.FOOD) {
            this.maze.eatFood(this.pos.x, this.pos.y, Maze.EMPTY);
        }
    }

    draw() {
        fill(Maze.PAC_COLOR);
        ellipse(this.pos.x, this.pos.y, playerSize, playerSize);
    }

    //Stores the sessionId associated with this Character
    //This is necessary to update the correct character on UpdatePosition
    setId(id) {
        this.id = id;
    }

    //Return whether the coords x, y are at the center position of a square
    //Used to make sure character stays centered in all the squares as it moves
    isCenteredInSquare(x, y) {
        return (x % squareSize == squareSize / 2) && (y % squareSize == squareSize / 2);
    }

    //Return whether the next tile in direction dir is a Wall
    nextTileInDirIsWall(pos, dir) {
        let currentTile = this.maze.getIndexByCoords(pos.x, pos.y);
        return this.maze.getTileByIndex(currentTile.col + dir.x, currentTile.row + dir.y) == Maze.WALL;
    }
}
