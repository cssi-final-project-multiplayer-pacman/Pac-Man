const ID_LENGTH = 5;

function joinGame() {
    let gameId = document.getElementById('game').value;
    let name = document.getElementById('name').value;

    if (name.length < 1) {
        name = generateName();
    }

    name = name.replace(' ', '');

    if (gameId.length == ID_LENGTH) {
        window.location.href = `/game/${gameId}?name=${name}`;
    } else if (gameId.length == 0) {
        let socket = io.connect('');
        var socketConnection = io.connect();
        socket.emit('GetAvailibleRooms');
        socket.on('AvailibleRooms', (data) => {
            let availible = data.availible;
            if (availible.length > 0) {
                let room = availible[Math.floor(Math.random() * availible.length)];
                gameId = room.id.replace('#', '');
            } else {
                gameId = makeid(ID_LENGTH);
            }

            window.location.href = `/game/${gameId}?name=${name}`;
        });
    } else {
        alert(`Invalid Game Id: ${gameId}`);
    }

}

function createGame() {
    let gameId = document.getElementById('game').value;
    if (gameId.length == 0) {
        gameId = makeid(ID_LENGTH);
    } else if (gameId.length != ID_LENGTH) {
        alert(`Game Id must be ${ID_LENGTH} characters long`);
    }
    let name = document.getElementById('name').value;
    name = name.replace(' ', '');

    window.location.href = `/game/${gameId}?name=${name}`;
}

//https://stackoverflow.com/questions/1349404/generate-random-string-characters-in-javascript
function makeid(length) {
   var result           = '';
   var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
   var charactersLength = characters.length;
   for ( var i = 0; i < length; i++ ) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
   }
   return result;
}
