let playerList;

function attachListener() {
    let url = window.location.href;
    gameId = `#${ url.substring( url.lastIndexOf('/') + 1 ).split('?')[0] }`;
    playerList = {};

    //Start the socket connection
    socket = io.connect('http://localhost:3000');

    //Capture client id to avoid rendering itself
    var socketConnection = io.connect();
    socket.on('connect', () => {});
    socket.on('DeleteCharacter', data => {

        delete playerList[data.id];

        updateHTMLList();
    });
    socket.on('UpdateSpectators', (data) => {

        let users = data.users;
        for (let key in users) {
            if (!(key in playerList)) {
                let user = users[key];
                let userEl = new User(user.id, user.name, user.score);
                playerList[key] = userEl;
            } else {
                let updatedUser = users[key];
                let user = playerList[key];
                user.id = updatedUser.id;
                user.name = updatedUser.name;
                user.score = updatedUser.score;
            }
        }

        if (data.assignments) {
            let assignments = data.assignments;

            for (let playerKey in playerList) {
                let player = playerList[playerKey];
                player.setRole(assignments[playerKey]);
            }
        }

        updateHTMLList();

    });

    socket.emit('SpectateRoom', {gameId: gameId});
}

function updateHTMLList() {
    let htmlPlayerList = document.getElementById('player-list');
    htmlPlayerList.innerHTML = '';

    for (let player in playerList) {
        let user = playerList[player];
        htmlPlayerList.appendChild(user.toHTML());
    }
}

class User {
    constructor(id, name, score) {
        this.id = id;
        this.name = name;
        this.score = score;
        this.role = 0;
    }

    setRole(role) {
        this.role = role;
    }

    toHTML() {
        let wrapper = document.createElement("DIV");
        wrapper.classList.add("player");
        let detailsWrapper = document.createElement("DIV");
        detailsWrapper.classList.add("details-wrapper");
        let title = document.createElement("H3");
        title.innerText = this.name;
        let score = document.createElement("P");
        score.innerText = `Score: ${this.score}`;
        let roleWrapper = document.createElement("SPAN");
        roleWrapper.classList.add("role-wrapper")
        let role = document.createElement("SPAN");
        role.classList.add("role-icon");
        // role.classList.add("role-icon" + this.role);
        role.style.backgroundColor = Maze.ROLES[this.role];

        roleWrapper.appendChild(role);
        detailsWrapper.appendChild(title);
        detailsWrapper.appendChild(score);

        wrapper.appendChild(roleWrapper);
        wrapper.appendChild(detailsWrapper);

        return wrapper;
    }
}
