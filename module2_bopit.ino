#define BUTTON_PIN 25 // GIOP21 pin connected to button
#define POTENTIOMETER_PIN 13 //GPIO36 analog pin connected to potentiometer

// /*
//  * This ESP32 code is created by esp32io.com
//  *
//  * This ESP32 code is released in the public domain
//  *
//  * For more detail (instruction and wiring diagram), visit https://esp32io.com/tutorials/esp32-potentiometer
//  */

float floatMap(float x, float in_min, float in_max, float out_min, float out_max) {
  return (x - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
}

// the setup routine runs once when you press reset:
void setup() {
  // initialize serial communication at 9600 bits per second:
  Serial.begin(9600);
    // initialize the pushbutton pin as an pull-up input
  // the pull-up input pin will be HIGH when the switch is open and LOW when the switch is closed.
  pinMode(BUTTON_PIN, INPUT_PULLUP);
}

// the loop routine runs over and over again forever:
void loop() {
    // read the state of the switch/button:
  int buttonState = digitalRead(BUTTON_PIN);

  // read the input on analog pin GPIO36:
  int analogValue = analogRead(POTENTIOMETER_PIN );
  // Rescale to potentiometer's voltage (from 0V to 3.3V):
  float voltage = floatMap(analogValue, 0, 4095, 0, 3.3);


  // print out the button's state
  Serial.print("Button State: ");
  Serial.print(buttonState);

  // print out the value you read:
  Serial.print(", Analog: ");
  Serial.print(analogValue);
  Serial.print(", Voltage: ");
  Serial.println(voltage);

  delay(100);
}
