var gameId, name;

const squareSize = 20;
const playerSize = squareSize * 4/5;
const fps = 30;

let width, height;
let socket, maze, sessionId, pac, otherUsers, running, countdownTimer;

function setup() {
    gameId = `#${ getURLPath()[1].split('?')[0] }`;
    name = getURLParams().name;

    //Start the socket connection
    socket = io.connect('http://localhost:3000');

    //Capture client id to avoid rendering itself
    var socketConnection = io.connect();

    socket.on('connect', function() { connect() });
    socket.on('UpdatePosition', data => { updatePosition(data) });
    socket.on('DeleteCharacter', data => { deleteCharacter(data) });
    socket.on('StartGame', data => { startGame(data) });
    socket.on('ResetGame', () => { resetGame() });
    socket.on('SyncPosition', () => { emitPosition(); });

    //Create a new maze
    maze = new Maze(squareSize);

    width = maze.getCols() * squareSize;
    height = maze.getRows() * squareSize;

    //Create canvas
    const cv = createCanvas(width, height);

    //Add id and make child of game-div to apply styling in style.css
    cv.id('main-game');
    cv.parent('game-div');

    //Use constant frame rate to keep num of updates the same for all users
    //(prevents one user from moving quicker due to more draw commands)
    frameRate(fps);
    cv.background(0);

    //Reset Game
    resetGame();
}

function draw() {
    if (running) {
        if (countdownTimer > 0) {
            maze.drawAll();
            emitPosition();
            drawCharacters();
            alertText(`Starting Game In ${Math.ceil(countdownTimer / fps)}`);
            countdownTimer--;
        } else if (countdownTimer == 0) {
            //Redraw entire maze
            maze.drawAll();
            countdownTimer--;
        } else {
            gameTick();
        }
    } else {
        drawCharacters();
        alertText('Waiting For Players...');
    }
}

function emitPosition() {
    socket.emit('UpdatePosition', {gameId: gameId, id: pac.id, x: pac.pos.x, y: pac.pos.y, dirX: pac.dir.x, dirY: pac.dir.y});
}

function alertText(txt) {
    fill('#ecf0f1');

    textSize(24);
    textAlign(CENTER, CENTER);
    text(txt, width/2, height/2);
}

function resetGame() {
    //By default, the game is not running
    running = false;
    otherUsers = {};

    //Create a new maze
    maze = new Maze(squareSize);

    //Position user over a random food particle
    let options = maze.food;
    let pos = options[Math.floor(Math.random() * options.length)];
    pac = new Character(createVector(pos.col * squareSize + squareSize/2,
                                    pos.row * squareSize + squareSize/2),
                        createVector(1, 0), maze);
    pac.setId(socket.id);

    //Display the map
    maze.drawAll();
}

function startGame(data) {

    countdownTimer = fps * 5;
    // countdownTimer = 10;
    running = true;

    updateRoles(data.assignments);
}

function updateRoles(assignments) {
    // console.log(assignments);
    pac.setRole(assignments[pac.id]);

    for (let key in otherUsers) {
        let char = otherUsers[key];
        char.setRole(assignments[char.id]);
    }
}

function deleteCharacter(data) {

    //Remove the disconnected character from the otherUsers dictionary
    delete otherUsers[data.id];
}

function updatePosition(data) {

    //Only render other characters if they have a valid id
    if (data.id != -1 && data.id != undefined) {
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
            otherUsers[data.id].setId(data.id);
        }
    }
}

function connect() {

    sessionId = socket.id;
    pac.setId(sessionId);

    socket.emit('JoinRoom', {gameId: gameId, name: name});
    //Update Position when joining room to update everyone's otherUsers list
    emitPosition();
}

//Run a single game frame
function gameTick() {
    maze.drawEmpty();
    maze.drawFood();

    pac.move((id, pos, dir) => {
        emitPosition();
    });

    for (let key in otherUsers) {
        let char = otherUsers[key];
        //Passing an empty callback, because this character shouldn't update
        //the position of another user's character
        char.move(() => {});
    }

    //Only pacman will run the collision detection
    if (pac.role == 0) {
        let collidedWith = pac.checkCollision(otherUsers);
        if (collidedWith != null) {
            socket.emit('RoundOver', {gameId: gameId, id: pac.id, winner: collidedWith.id, foodEaten: maze.empty.length });
        }
    }

    //Check win (all food is gone)
    if (maze.food.length == 0) {
        socket.emit('RoundOver', {gameId: gameId, id: pac.id, winner: null, foodEaten: maze.empty.length });
    }

    drawCharacters();
}

function drawCharacters() {

    pac.draw();

    for (let key in otherUsers) {
        let char = otherUsers[key];
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
        this.queuedDir = null;
        this.maze = maze;
        this.role = 0;
    }

    setRole(role) {

        this.role = role;
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
        //and if the queued direction isn't null, and isn't the same as the current direction
        //If the tile in the queued direction is a Wall, reset queuedDir to dir
        //(this just makes movement a little more difficult and closer to the original)
        if (this.isCenteredInSquare(this.pos.x, this.pos.y) && this.queuedDir != null &&!this.queuedDir.equals(this.dir)) {
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
        //if role == 0, meaning this character is pacman
        if (this.role == 0) {
            if (this.maze.getTile(this.pos.x, this.pos.y) == Maze.FOOD) {
                this.maze.eatFood(this.pos.x, this.pos.y, Maze.EMPTY);
            }
        }
    }

    //Returns the other character that this collided with
    checkCollision(otherUsers) {
        for (let key in otherUsers) {
            let other = otherUsers[key];

            let userIndex = maze.getIndexByCoords(this.pos.x, this.pos.y);
            let otherIndex = maze.getIndexByCoords(other.pos.x, other.pos.y);

            if (userIndex.row == otherIndex.row && userIndex.col == otherIndex.col) {
                    return other;
            }
        }

        return null;
    }

    draw() {

        fill(Maze.ROLES[this.role]);
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
