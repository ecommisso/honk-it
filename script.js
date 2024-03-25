/*

you also need this code on the ESP32. 
change the code for whichever pin your button is on
note that some pins don't work when connected to web serial

-----

#define BUTTON 35
//this is the right button on the TTGO T1 Display

void setup() {
  Serial.begin(115200);
  pinMode(BUTTON, INPUT);
}

void loop() {
  Serial.print(digitalRead(BUTTON));
  delay(100);
}

*/


let gameInterval;
let gameRunning = false;

//when the user clicks anywhere on the page
document.addEventListener('click', async () => {
  // Prompt user to select any serial port.
  var port = await navigator.serial.requestPort();
  // be sure to set the baudRate to match the ESP32 code
  await port.open({ baudRate: 9600 });

  let decoder = new TextDecoderStream(); //readable stream that decodes bytes into text
  inputDone = port.readable.pipeTo(decoder.writable); //connects the serial port to the text decoder stream
  inputStream = decoder.readable; //gets the readable stream from the TextDecoderStream object

  reader = inputStream.getReader(); //creates a reader object for the input stream to read data asynchronously.
  
  reader.read().then(({ done }) => {
    if (!done) {
        // make the start button active and title appear once serial connection established
        document.getElementById('start-button').removeAttribute('disabled');
        document.getElementById('title').style.display = 'block';
    }
  }).catch(error => {
    console.error('Error reading from serial port:', error);
  });
  
  readLoop();

});

var inputButton = false;
var potAnalog = 0;
var potVoltage = 0;
var prevButtonState = -1;
var prevAnalog = -1;
var score = 0;

// load audio elements
const bopAudio = document.getElementById("button-audio");
const twistAudio = document.getElementById("potentiometer-audio");
const loseAudio = document.getElementById("lose-audio");

function incrementScore() {
    score++;
    updateScoreDisplay();
}

function updateScoreDisplay() {
    document.getElementById('current-score').textContent = score;
}

function updateFinalScoreDisplay() {
    document.getElementById('final-score').textContent = score;
}

function resetScore() {
    score = 0;
    updateScoreDisplay();
    updateFinalScoreDisplay();
}


// once button detected as pressed
function handleButtonPress() {
    console.log("Button pressed!");

    // if the current command is "HONK IT", restart the game loop
    if (document.getElementById('command-display').textContent === "HONK IT") {
        setTimeout(() => {
            incrementScore();
            gameLoop();
        }, 100); // small delay between actions
    }
    else{
        console.log("Wrong action - You lose!");
        endGame();
    }
}

// once potentiometer detected as turned
function handleAnalogChange() {
    console.log("Analog reading changed!");

    // if the current command is "TWIST IT", restart the game loop
    if (document.getElementById('command-display').textContent === "TWIST IT") {
        setTimeout(() => {
            incrementScore();
            gameLoop();
        }, 100); // small delay between actions
    }
    else{
        console.log("Wrong action - You lose!");
        endGame();
    }
}


function parseInputString(inputString) {
    // Input from esp32 formatted as "Button State: 1, Analog: 4095, Voltage: 3.30"
    // split the input string by comma and trim whitespace
    const parts = inputString.split(",").map(part => part.trim());
  
    if (parts.length === 3) {
      const buttonState = parseInt(parts[0].split(":")[1]);
      const analog = parseInt(parts[1].split(":")[1]);
      const voltage = parseFloat(parts[2].split(":")[1]);
  
      // check if all values are valid numbers
      if (!isNaN(buttonState) && !isNaN(analog) && !isNaN(voltage)) {
        // return an object with parsed values
        return {
          buttonState: buttonState,
          analog: analog,
          voltage: voltage
        };
      }
    }
    return null; // return null if parsing fails
}


// start or restart the game based on user hitting any key on keyboard 
document.addEventListener('keydown', function(event) {
    if (!gameRunning) {
        // if the game is not running, start the game
        setTimeout(() => {
            startGame();
        }, 400); // set delay before game starts so don't immediately go to lose!!
    } else if (document.getElementById('lose-screen').style.display === 'block') {
        // if the lose screen is displayed and the game is running, restart the game
        restartGame();
    }
});


// game logic

function startGame() {
    if (!gameRunning) {
        gameRunning = true;
        document.getElementById('start-screen').style.display = 'none';
        document.getElementById('game-screen').style.display = 'block';
        document.getElementById('lose-screen').style.display = 'none';
        resetScore();
        gameLoop();
    }
}

function restartGame() {
    gameRunning = true;
    document.getElementById('start-screen').style.display = 'none';
    document.getElementById('game-screen').style.display = 'block';
    document.getElementById('lose-screen').style.display = 'none';
    resetScore();
    gameLoop();
}

function endGame() {
    gameRunning = false;

    document.getElementById('start-screen').style.display = 'none';
    document.getElementById('game-screen').style.display = 'none';
    document.getElementById('lose-screen').style.display = 'block';
    updateFinalScoreDisplay();
   
    loseAudio.play();
}


let timeout;

function gameLoop() {
    // clear any existing timeout
    clearTimeout(timeout);

    generateCommand();

    timeout = setTimeout(() => {
        endGame();
    }, 3000);
    
    // console.log("Timeout: ")
    // console.log(timeout)
        
    async function readLoop() {
        while (true) {
            const { value, done } = await reader.read();
            if (done) {
                console.log("Closing connection");
                reader.releaseLock();
                break;
            }
            console.log(value);
            if (value) {
                const parsedValues = parseInputString(value);
                if (parsedValues) {
                    inputButton = parsedValues.buttonState;
                    potAnalog = parsedValues.analog;
                    potVoltage = parsedValues.voltage;
                }

                // check for button state change
                if (inputButton !== prevButtonState && inputButton === 0) {
                    console.log("Button pressed!");
                    handleButtonPress();
                }
                
                // check for analog change
                if (Math.abs(potAnalog - prevAnalog) >= 400) {
                    console.log("Analog reading changed!");
                    handleAnalogChange();
                }

                // update previous button state and analog reading
                prevButtonState = inputButton;
                prevAnalog = potAnalog;
            }
        }
    }
    
    readLoop();
}

function generateCommand() {
    const commandDisplay = document.getElementById('command-display');
    const command = Math.random() < 0.5 ? 'HONK IT' : 'TWIST IT';
    
    commandDisplay.textContent = command;
    commandDisplay.className = 'text'; //applies style to command text

    if (command === 'HONK IT') {
        bopAudio.play();
    } else {
        twistAudio.play();
    }
}












