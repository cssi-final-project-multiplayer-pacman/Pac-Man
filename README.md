# Multiplayer Pacman

Multiplayer Pacman is a creatively named final project for Google CSSI 2020. The project is written using NodeJS, p5.js, and socket.io.

## Installation

Use the package manager [npm](https://www.npmjs.com/get-npm) to install Multiplayer Pacman.

```bash
npm install
```

## Running

Use node to run Multiplayer Pacman via:
```bash
node server.js
```

## Technical Description

#### server.js


#### public/game.js


#### public/maze.js
###### Maze class
The Maze class is used to create and manage each tile associated with the maze all of the characters roam through.
###### Wall Class
The Wall class is used to denote the position of a wall in the maze. The Maze class contains a list of Wall objects that is only rendered once to improve efficiency.
###### Food Class
The Food class is used to denote the position of food particles in the maze.
###### Empty Class
The Empty class is used to denote the position of empty tiles in the maze. The list of Empty objects in maze is used to prevent trails from following characters.

## Known Bugs
- Because characters only emit UpdatePosition if they are actively moving, new connected users won't be able to see already connected users that are stationary until the already connected user moves (As of commit 39a4c0c)

## License
[MIT](https://choosealicense.com/licenses/mit/)
