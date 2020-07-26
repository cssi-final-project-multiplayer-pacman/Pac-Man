var socket;

function setup() {
  createCanvas(400, 600);
  background(51);
  //TODO: importing "SOCKET.IO" for client
  socket = io.connect('http://localhost:3000');
  //TODO: to mirror image from client a to client b, c, d, etc.
  socket.on('mouse', newDrawing);
}

function newDrawing(data) {
  noStroke();
  fill(255, 0, 100);
  ellipse(data.x, data.y, 60, 60);
}

function mouseDragged() {
  console.log('Sending: ' + mouseX + ',' + mouseY);

  var data = {
    x: mouseX,
    y: mouseY
  }

  socket.emit('mouse', data);

  noStroke();
  fill(255);
  ellipse(mouseX, mouseY, 60, 60);
}

function draw() {

}
