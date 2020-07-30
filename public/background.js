const scale = 0.7;

let maze;

function setup() {
    let dimension = createMaze();

    const cv = createCanvas(dimension.width, dimension.height);
    cv.id('background');

    maze.drawWalls();
}

function windowResized() {
    let dimension = createMaze();
    resizeCanvas(width, height);

    maze.drawWalls();
}

function createMaze() {
    let tempMaze = new Maze(1);
    let squareSize = Math.min((windowWidth*scale) / tempMaze.getCols(), (windowHeight*scale) / tempMaze.getRows());

    maze = new Maze(squareSize);

    width = maze.getCols() * squareSize;
    height = maze.getRows() * squareSize;

    return {width: width, height: height};
}
