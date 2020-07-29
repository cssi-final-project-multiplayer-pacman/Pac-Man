/* global p5, Clickable, HSB, createCanvas, createInput, frameRate,
color, colorMode, stroke, strokeWeight, mouseIsPressed, textStyle, BOLD, NORMAL,
fill, text, background, textFont, width, height, setup, draw */
/* global p5, mouseIsPressed, fill, Color, color, rect,
noStroke, textAlign, CENTER, textSize, text, mouseX, mouseY */

let joinAsPac, joinAsGhost;
let buttonWidth, buttonHeight;
let usernameInput, pinInput;
let buttonPressed;

//TODO: create an array to store existing games
let existingGames = [];

setup = function() {
  createCanvas(600, 400);
  colorMode(HSB, 360, 100, 100);
  stroke(100);
  fill(100);

  joinAsPac = new Clickable(width / 2 - 150, 400);
  joinAsGhost = new Clickable(width / 2 - 150, 500);

  usernameInput = createInput('Your username', "text");
  usernameInput.position(width / 2- 50, 170);
  //usernameInput.size(150);

  pinInput = createInput('Game PIN', "text");
  pinInput.position(width / 2 - 50, 230);
  //pinInput.size(150);

  buttonPressed = false;
};

draw = function() {
  background(0);
  displayMaze();
  displayText();
  displayButtons();

  if (usernameInput.value() == "" || usernameInput.value() == "Your username") {
    fill(360, 100, 100);
    textFont("sans-serif", 12);
    text("Please enter a valid username!", width/2, 350);
  } else if (buttonPressed) {
    fill(360, 100, 100);
    textFont("sans-serif", 12);
    text("Welcome " + usernameInput.value() + "!", width/2, 350);
    exitMainMenu(pinInput.value());
  }

};

function displayMaze() {

}

function displayText() {
  fill(0, 0, 100);
  textFont("sans-serif", 30);
  textStyle(BOLD);
  text("Welcome to Pac-Man", width / 2, 100);

  textFont("sans-serif", 12);
  textStyle(NORMAL);
  text("Enter Username:", width / 2, 150);
  text("Enter Game PIN: (optional)", width / 2, 210);

}

function displayButtons() {
  joinAsPac.resize(150, 50);
  joinAsGhost.resize(150, 50);

  joinAsPac.locate(width * 0.3 - 150 / 2, 280);
  joinAsGhost.locate(width * 0.7 - 150 / 2, 280);

  joinAsPac.text = "Join as Pac-Man!";
  joinAsGhost.text = "Join as Ghost!";

  joinAsPac.draw();
  joinAsGhost.draw();

  stroke(2);
  fill(100);
  textFont("sans-serif", 12);
  text("- OR -", width * 0.5, 280 + 25);
}


function exitMainMenu(gamePin) {
  for (let game of existingGames) {
    if (gamePin == game) {
      //TODO: join existing game is Game PIN matches
      console.log("joining existing game");
    }
  }
  //TODO: join random game if Game PIN does not match
  console.log("joining random game");
}

//Determines if the mouse was pressed on the previous frame
var cl_mouseWasPressed = false;
//Last hovered button
var cl_lastHovered = null;
//Last pressed button
var cl_lastClicked = null;
//All created buttons
var cl_clickables = [];

//This function is what makes the magic happen and should be ran after
//each draw cycle.
p5.prototype.runGUI = function () {
	for (let i = 0; i < cl_clickables.length; ++i) {
		if (cl_lastHovered != cl_clickables[i])
			cl_clickables[i].onOutside();
	}
	if (cl_lastHovered != null) {
		if (cl_lastClicked != cl_lastHovered) {
			cl_lastHovered.onHover();
		}
	}
	if (!cl_mouseWasPressed && cl_lastClicked != null) {
		cl_lastClicked.onPress();
	}
	if (cl_mouseWasPressed && !mouseIsPressed && cl_lastClicked != null) {
		if (cl_lastClicked == cl_lastHovered) {
			cl_lastClicked.onRelease();
		}
		cl_lastClicked = null;
	}
	cl_lastHovered = null;
	cl_mouseWasPressed = mouseIsPressed;
}

p5.prototype.registerMethod('post', p5.prototype.runGUI);

//This function is used to get the bounding size of a
//string of text for use in the 'textScaled' property
function getTextBounds(m, font, size) {
	let txt = document.createElement("span");
	document.body.appendChild(txt);

	txt.style.font = font;
	txt.style.fontSize = size + "px";
	txt.style.height = 'auto';
	txt.style.width = 'auto';
	txt.style.position = 'absolute';
	txt.style.whiteSpace = 'no-wrap';
	txt.innerHTML = m;

	let width = Math.ceil(txt.clientWidth);
	let height = Math.ceil(txt.clientHeight);
	document.body.removeChild(txt);
	return [width, height];
}

//Button Class
function Clickable() {
	this.x = 0;			//X position of the clickable
	this.y = 0;			//Y position of the clickable
	this.width = 100;		//Width of the clickable
	this.height = 50;		//Height of the clickable
	this.color = "#FFFFFF";		//Background color of the clickable
	this.cornerRadius = 10;		//Corner radius of the clickable
	this.strokeWeight = 2;		//Stroke width of the clickable
	this.stroke = "#000000";	//Border color of the clickable
	this.text = "Press Me";		//Text of the clickable
	this.textColor = "#000000";	//Color for the text shown
	this.textSize = 12;		//Size for the text shown
	this.textFont = "sans-serif";	//Font for the text shown
	this.textScaled = false;     //Scale the text with the size of the clickable

	this.updateTextSize = function () {
		if (this.textScaled) {
			for (let i = this.height; i > 0; i--) {
				if (getTextBounds(this.text, this.textFont, i)[0] <= this.width && getTextBounds(this.text, this.textFont, i)[1] <= this.height) {
					this.textSize = i / 2;
					break;
				}
			}
		}
	}
	this.updateTextSize();

	this.onHover = function () {
    this.textColor = color(0, 0, 100); //white
	}

	this.onOutside = function () {
    this.color = color(210, 20, 100); //blue
    this.textColor = color(0, 0, 0); //black
	}

	this.onPress = function () {
    this.color = color(0, 0, 100); //white
    this.textColor = color(0, 0, 0); //black
    buttonPressed = true;
	}

	this.onRelease = function () {
		this.color = color(210, 20, 100); //blue
	}

	this.locate = function (x, y) {
		this.x = x;
		this.y = y;
	}

	this.resize = function (w, h) {
		this.width = w;
		this.height = h;
		this.updateTextSize();
	}

	this.draw = function () {

		fill(this.color);
		stroke(this.stroke);
		strokeWeight(this.strokeWeight);
		rect(this.x, this.y, this.width, this.height, this.cornerRadius);
		fill(this.textColor);
		noStroke();
		textAlign(CENTER, CENTER);
		textSize(this.textSize);
		textFont(this.textFont);
		text(this.text, this.x + this.width / 2, this.y + this.height / 2);
		if (mouseX >= this.x && mouseY >= this.y
			&& mouseX < this.x + this.width && mouseY < this.y + this.height) {
			cl_lastHovered = this;
			if (mouseIsPressed && !cl_mouseWasPressed)
				cl_lastClicked = this;
		}
	}

	cl_clickables.push(this);
}
