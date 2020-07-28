let mazeAscii = `###############
#             #
# # ## # ## # #
#             #
# # # ### # # #
#   #  #  #   #
### ## # ## ###
### #  #  # ###
#     ###     #
# ###     ### #
#   # ### #   #
##     #     ##
####       ####
###############
`;

class Maze {
    //Static states of the maze array
    static EMPTY = 0;
    static WALL = 1;
    static FOOD = 2;
    static CANDY = 3;

    //Static colors
    static WALL_COLOR = '#34495e';
    static PAC_COLOR = '#f1c40f';
    static EMPTY_COLOR = '#000000';
    static FOOD_COLOR = '#2ecc71';

    //Build the 2d maze array from the ascii maze representation
    /*Also build the walls, food, empty lists for more efficient rendering
      (i.e. only render the walls once,
            render food when one is eaten,
            continuously render empty squares)
    */
    constructor(squareSize) {
        
        this.squareSize = squareSize;
        this.maze = [];
        this.walls = [];
        this.food = [];
        this.empty = [];
        //TODO: Make candy list and implement functionality

        let rows = mazeAscii.split('\n');
        for (let y = 0; y < rows.length; y++) {

            let mazeRow = [];
            let chars = rows[y].split('');

            for (let x = 0; x < chars.length; x++) {

                if (chars[x] == '#') {
                    mazeRow.push(Maze.WALL);
                    this.walls.push(new Wall(y , x, squareSize));
                }
                //Not currently doing anything
                else if(chars[x] == '*') {
                    mazeRow.push(Maze.CANDY);
                }

                else {
                    mazeRow.push(Maze.FOOD);
                    this.food.push(new Food(y, x, squareSize));
                }

            }

            this.maze.push(mazeRow);
        }
    }

    drawWalls() {
        for (let w of this.walls) {
            w.draw();
        }
    }

    drawFood() {
        for (let f of this.food) {
            f.draw();
        }
    }

    drawEmpty() {
        for (let e of this.empty) {
            e.draw();
        }
    }

    //Returns index of tile at x, y
    //returns object with keys row, col
    getIndexByCoords(x, y) {
        return {row: Math.floor(y / this.squareSize),
                col: Math.floor(x / this.squareSize)};
    }

    //Returns the tile type of the tile at coordinate x, y
    getTile(x, y) {
        let indices = this.getIndexByCoords(x, y);
        return this.maze[ indices.row ][ indices.col ];
    }

    //Returns the tile indexed in maze by row and col
    getTileByIndex(col, row) {
        return this.maze[row][col];
    }

    eatFood(x, y) {
        let row = Math.floor(y / this.squareSize);
        let col = Math.floor(x / this.squareSize);

        let i = 0;
        for (; i < this.food.length; i++) {
            if (this.food[i].row == row && this.food[i].col == col) {
                break;
            }
        }

        this.food.splice(i, 1);
        this.empty.push(new Empty(row, col, this.squareSize));

        this.maze[ row ][ col ] = Maze.EMPTY;
    }
}

class Wall {
    constructor(row, col, size) {
        this.row = row;
        this.col = col;
        this.size = size;
    }

    draw() {
        noStroke();
        fill(Maze.WALL_COLOR);
        rect(this.col * this.size, this.row * this.size, this.size, this.size);
    }
}

class Food {
    constructor(row, col, size) {
        this.row = row;
        this.col = col;
        this.size = size;
    }

    draw() {
        //Draw background of food particle
        noStroke();
        fill(Maze.EMPTY_COLOR);
        rect(this.col * this.size, this.row * this.size, this.size, this.size);

        fill(Maze.FOOD_COLOR);
        ellipse(this.col * this.size + this.size/2, this.row * this.size + this.size/2, this.size/3);
    }
}

class Empty {
    constructor(row, col, size) {
        this.row = row;
        this.col = col;
        this.size = size;
    }

    draw() {
        noStroke();
        fill(Maze.EMPTY_COLOR);
        rect(this.col * this.size, this.row * this.size, this.size, this.size);
    }
}
