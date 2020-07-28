const squareSize = 20;
const playerSize = squareSize * 4/5;

let socket, maze, dir, pos, queuedDir;

function setup() {
    //Start the socket connection
    socket = io.connect('http://localhost:3000');

    //Create canvas
    const cv = createCanvas(800, 400);
    //Add id and make child of game-div to apply styling in style.css
    cv.id('main-game');
    cv.parent('game-div');
    //Use constant frame rate to keep num of updates the same for all users
    //(prevents one user from moving quicker due to more draw commands)
    frameRate(30);
    //TODO: calculate x and y in order to center canvas on window
    //cv.position(x, y);
    cv.background(0);

    maze = new Maze(squareSize);
    maze.drawWalls();
    maze.drawFood();

    socket.on('start', data => {
        console.log(data);
        // text(`${data.users} Users Online!`, 50, 50);
    });

    pos = createVector(30, 30);
    dir = createVector(1, 0);
    queuedDir = dir.copy();
}

function draw() {
    maze.drawEmpty();

    fill(Maze.PAC_COLOR);
    ellipse(pos.x, pos.y, playerSize, playerSize);

    //Update the direction if the character is centerd in a square
    //and if the queued direction isn't the same as the current direction
    //If the tile in the queued direction is a Wall, reset queuedDir to dir
    //(this just makes movement a little more difficult and closer to the original)
    if (isCenteredInSquare(pos.x, pos.y) && !queuedDir.equals(dir)) {
        if (nextTileInDirIsWall(pos, queuedDir)) {
            queuedDir = dir;
        } else {
            dir = queuedDir.copy();
        }
    }

    //Add dir to a copy of pos
    let newPos = pos.copy();
    newPos.add(dir);

    //If the character is centered, check the next tile in the direction of dir
    //If that tile is a wall, keep the character where it is, else move it by dir
    if (isCenteredInSquare(pos.x, pos.y)) {
        let currentTile = maze.getIndexByCoords(newPos.x, newPos.y);
        if (maze.getTileByIndex(currentTile.col + dir.x, currentTile.row + dir.y) == Maze.WALL) {
            newPos = pos;
        }
    }
    pos = newPos;

    //Check if pac runs into a food
    if (maze.getTile(pos.x, pos.y) == Maze.FOOD) {
        maze.eatFood(pos.x, pos.y, Maze.EMPTY);
    }
}

//Set queuedDir to a new vector in the direction indicated by the arrow keys
function keyPressed() {
    if (keyCode === LEFT_ARROW) {
        queuedDir = createVector(-1, 0);
    } else if (keyCode === RIGHT_ARROW) {
        queuedDir = createVector(1, 0);
    } else if (keyCode === UP_ARROW) {
        queuedDir = createVector(0, -1);
    } else if (keyCode === DOWN_ARROW) {
        queuedDir = createVector(0, 1);
    }
}

//Return whether the coords x, y are at the center position of a square
//Used to make sure character stays centered in all the squares as it moves
function isCenteredInSquare(x, y) {
    return (x % squareSize == squareSize / 2) && (y % squareSize == squareSize / 2);
}

//Return whether the next tile in direction dir is a Wall
function nextTileInDirIsWall(pos, dir) {
    let currentTile = maze.getIndexByCoords(pos.x, pos.y);
    return maze.getTileByIndex(currentTile.col + dir.x, currentTile.row + dir.y) == Maze.WALL;
}
