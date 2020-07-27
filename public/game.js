const squareSize = 20;
const playerSize = squareSize * 3/4;

let socket, maze, dir, pos;

function setup() {
    //Start the socket connection
    socket = io.connect('http://localhost:3000');

    //Create canvas
    const cv = createCanvas(800, 400);
    //Use constant frame rate to keep num of updates the same for all users
    //(prevents one user from moving quicker due to more draw commands)
    frameRate(10);
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
}

function draw() {
    maze.drawEmpty();

    fill(Maze.PAC_COLOR);
    ellipse(pos.x, pos.y, playerSize, playerSize);

    //Add dir to a copy of pos
    let newPos = pos.copy();
    newPos.add(dir);
    //Check if newPos collided with a wall, if so, don't move pos
    if(maze.getTile(newPos.x, newPos.y - playerSize/2) == Maze.WALL ||
        maze.getTile(newPos.x + playerSize/2, newPos.y) == Maze.WALL ||
        maze.getTile(newPos.x, newPos.y + playerSize/2) == Maze.WALL ||
        maze.getTile(newPos.x - playerSize/2, newPos.y) == Maze.WALL) {
            pacDir = createVector(0, 0);
    } else {
        pos = newPos;
    }

    //Check if pac runs into a food
    if(maze.getTile(pos.x, pos.y) == Maze.FOOD) {
        maze.eatFood(pos.x, pos.y, Maze.EMPTY);
    }
}

//Set dir to a new vector in the direction indicated by the arrow keys
function keyPressed() {
    if (keyCode === LEFT_ARROW) {
        dir = createVector(-1, 0);
    } else if (keyCode === RIGHT_ARROW) {
        dir = createVector(1, 0);
    } else if (keyCode === UP_ARROW) {
        dir = createVector(0, -1);
    } else if (keyCode === DOWN_ARROW) {
        dir = createVector(0, 1);
    }
}
