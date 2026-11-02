import { BOARDS } from './boards.ts'
import { UPLOAD, changed, clamp, every, lineOf } from './sim-helpers.ts'
import type { Bench, Lesson } from './types.ts'

const UNO_ALONE: Bench['boards'] = [{ kind: 'uno', pos: [0, 0] }]
const UNO_LEFT: Bench['boards'] = [{ kind: 'uno', pos: [-5.6, 0] }]
const BB_RIGHT: [number, number] = [4.2, 0]

const base = {
  board: 'uno' as const,
  boot: UPLOAD,
  consoleTitle: 'Serial monitor',
}

const tourCode = `void setup() {
  pinMode(LED_BUILTIN, OUTPUT);
  Serial.begin(9600);
  Serial.println("Hello from the Uno");
}

void loop() {
  digitalWrite(LED_BUILTIN, HIGH);
  delay(1000);
  digitalWrite(LED_BUILTIN, LOW);
  delay(1000);
}`

const tour: Lesson = {
  ...base,
  id: 'meet-the-uno',
  use: 'First look',
  title: 'Meet the Uno',
  summary: 'One chip, one program, and pins that switch real things on and off.',
  overview:
    'The Uno has no operating system. It runs one sketch from the moment it gets power, forever, and every pin does exactly what that sketch says. That makes it good at timing, sensors and motors, and poor at anything that needs a screen or the internet.',
  learn: [
    'The small square chip in the middle, the ATmega328P, runs your sketch',
    'Sockets along the edges connect to everything you build',
    'This sketch needs no wiring: pin 13 already has an LED',
  ],
  bench: { boards: UNO_ALONE },
  callouts: [
    { title: 'USB-B port', body: 'Power, uploads and the serial monitor.', at: 'uno@usb', slot: 'tl' },
    { title: 'Digital pins', body: 'On or off, 5 V or 0 V. Pin 13 also lights the L LED.', at: 'uno@digital', slot: 'tr' },
    { title: 'ATmega328P', body: 'The 16 MHz chip that runs your sketch.', at: 'uno@chip', slot: 'tc' },
    { title: 'Analog inputs', body: 'Read a voltage as a number from 0 to 1023.', at: 'uno@analog', slot: 'br' },
    { title: 'Power pins', body: '5 V, 3.3 V and ground for your circuits.', at: 'uno@power', slot: 'bc' },
    { title: 'Barrel jack', body: 'Arduino rates this input at 6 to 20 V.', at: 'uno@jack', slot: 'bl' },
  ],
  wiring: [
    { from: 'USB-B', to: 'Your computer', why: 'Powers the board and carries the upload.', at: 'uno@usb' },
    { from: 'D13', to: 'L LED, on the board', why: 'No wires needed. LED_BUILTIN is another name for 13.', at: 'uno@led' },
  ],
  specs: BOARDS.uno.specs,
  code: [{ name: 'hello.ino', lang: 'cpp', source: tourCode }],
  tick: (ctx) => {
    if (ctx.t === 0) ctx.print('Hello from the Uno')
    const on = ctx.t % 2 < 1
    return {
      'uno.L': on ? 1 : 0,
      line: on ? lineOf(tourCode, 'delay(1000)') : lineOf(tourCode, 'delay(1000)', 2),
    }
  },
}

const blinkCode = `const int LED = 13;

void setup() {
  pinMode(LED, OUTPUT);
  Serial.begin(9600);
}

void loop() {
  digitalWrite(LED, HIGH);
  Serial.println("on");
  delay(500);
  digitalWrite(LED, LOW);
  Serial.println("off");
  delay(500);
}`

const blink: Lesson = {
  ...base,
  id: 'blink-an-led',
  use: 'Lights and switches',
  title: 'Blink an LED',
  summary: 'Your first circuit: a pin, a resistor, an LED, and back to ground.',
  overview:
    'Current leaves pin 13, passes through the resistor and the LED, and returns through ground. The sketch only has to raise and lower that pin. The on-board L LED shares the pin, so it blinks along.',
  learn: [
    'Long LED leg goes towards the pin, short leg towards ground',
    'Every LED needs a resistor or it draws too much current',
    'A breadboard joins five holes in each row',
  ],
  bench: {
    boards: UNO_LEFT,
    breadboard: BB_RIGHT,
    parts: [
      { id: 'r1', kind: 'resistor', ohms: 220, pins: { a: 'c5', b: 'c10' } },
      { id: 'led1', kind: 'led', color: '#e0322b', pins: { a: 'd10', k: 'd11' } },
    ],
    wires: [
      { from: 'uno.D13', to: 'bb.a5', color: 'yellow' },
      { from: 'bb.a11', to: 'bb.-b11', color: 'black' },
      { from: 'uno.GND2', to: 'bb.-b2', color: 'black' },
    ],
    nets: [
      ['uno.D13', 'r1.a'],
      ['r1.b', 'led1.a'],
      ['led1.k', 'uno.GND2'],
    ],
  },
  callouts: [
    { title: 'Pin 13', body: 'The sketch switches this between 5 V and 0 V.', at: 'uno.D13', slot: 'tl' },
    { title: 'LED', body: 'Lights when current flows from long leg to short.', at: 'led1', slot: 'tr' },
    { title: '220 Ω resistor', body: 'Holds the current near 14 mA.', at: 'r1', slot: 'tc' },
    { title: 'Ground rail', body: 'The way back to the board.', at: 'bb.-b11', slot: 'br' },
    { title: 'GND pin', body: 'Every circuit returns here.', at: 'uno.GND2', slot: 'bl' },
  ],
  wiring: [
    { from: 'D13', to: 'Row 5', why: 'The signal enters the breadboard.', at: 'uno.D13' },
    { from: 'Row 5', to: '220 Ω, then row 10', why: 'Limits the current through the LED.', at: 'r1' },
    { from: 'Row 10', to: 'LED long leg', why: 'The anode, the positive side.', at: 'led1.a' },
    { from: 'LED short leg, row 11', to: 'Ground rail', why: 'The cathode returns current.', at: 'bb.a11' },
    { from: 'Ground rail', to: 'GND', why: 'Closes the loop.', at: 'uno.GND2' },
  ],
  specs: [
    ['LED', '5 mm red, about 2 V forward'],
    ['Resistor', '220 Ω (red, red, brown, gold)'],
    ['Current', '(5 − 2) ÷ 220 ≈ 14 mA'],
    ['Pin limit', '20 mA maximum'],
    ['Blink rate', '500 ms on, 500 ms off'],
  ],
  code: [{ name: 'blink.ino', lang: 'cpp', source: blinkCode }],
  tick: (ctx) => {
    const on = ctx.t % 1 < 0.5
    if (changed(ctx, 'on', on ? 1 : 0) || ctx.t === 0) ctx.print(on ? 'on' : 'off')
    return {
      led1: on ? 1 : 0,
      'uno.L': on ? 1 : 0,
      line: lineOf(blinkCode, 'delay(500)', on ? 1 : 2),
    }
  },
}

const buttonCode = `const int BUTTON = 2;
const int LED = 8;
bool wasPressed = false;

void setup() {
  pinMode(BUTTON, INPUT_PULLUP);
  pinMode(LED, OUTPUT);
  Serial.begin(9600);
}

void loop() {
  bool pressed = digitalRead(BUTTON) == LOW;
  digitalWrite(LED, pressed ? HIGH : LOW);
  if (pressed != wasPressed) {
    Serial.println(pressed ? "pressed" : "released");
    wasPressed = pressed;
  }
  delay(10);
}`

const button: Lesson = {
  ...base,
  id: 'push-button',
  use: 'Lights and switches',
  title: 'Read a push button',
  summary: 'Press the button on the board and the LED answers.',
  overview:
    'A pin set to INPUT_PULLUP is held at 5 V by a resistor inside the chip. The button connects the pin to ground, so pressed reads LOW and released reads HIGH. It looks backwards at first, and it saves you an extra resistor.',
  learn: [
    'INPUT_PULLUP means pressed reads LOW',
    'A tactile button joins the two rows it straddles',
    'Print only on a change, or the monitor floods',
  ],
  bench: {
    boards: UNO_LEFT,
    breadboard: BB_RIGHT,
    parts: [
      { id: 'btn1', kind: 'button', pins: { a: 'e8', a2: 'f8', b: 'e10', b2: 'f10' } },
      { id: 'r1', kind: 'resistor', ohms: 220, pins: { a: 'c15', b: 'c20' } },
      { id: 'led1', kind: 'led', color: '#2d9a55', pins: { a: 'd20', k: 'd21' } },
    ],
    wires: [
      { from: 'uno.D2', to: 'bb.a8', color: 'blue' },
      { from: 'bb.a10', to: 'bb.-b10', color: 'black' },
      { from: 'uno.D8', to: 'bb.a15', color: 'yellow' },
      { from: 'bb.a21', to: 'bb.-b21', color: 'black' },
      { from: 'uno.GND2', to: 'bb.-b2', color: 'black' },
    ],
    nets: [
      ['uno.D2', 'btn1.a'],
      ['btn1.b', 'uno.GND2', 'led1.k'],
      ['uno.D8', 'r1.a'],
      ['r1.b', 'led1.a'],
    ],
  },
  callouts: [
    { title: 'Pin 2', body: 'Reads the button, pulled up inside the chip.', at: 'uno.D2', slot: 'tl' },
    { title: 'Button', body: 'Click it here, or hold the control below.', at: 'btn1', slot: 'tr' },
    { title: 'Pin 8', body: 'Drives the LED.', at: 'uno.D8', slot: 'tc' },
    { title: 'LED', body: 'On for as long as the button is down.', at: 'led1', slot: 'br' },
    { title: 'Ground rail', body: 'Shared by the button and the LED.', at: 'bb.-b10', slot: 'bc' },
  ],
  wiring: [
    { from: 'D2', to: 'Button, row 8', why: 'Reads HIGH until the button joins it to ground.', at: 'uno.D2' },
    { from: 'Button, row 10', to: 'Ground rail', why: 'Pressing pulls pin 2 to 0 V.', at: 'bb.a10' },
    { from: 'D8', to: '220 Ω, then LED long leg', why: 'The output side.', at: 'uno.D8' },
    { from: 'LED short leg', to: 'Ground rail', why: 'The return path.', at: 'led1.k' },
    { from: 'Ground rail', to: 'GND', why: 'Shared ground.', at: 'uno.GND2' },
  ],
  specs: [
    ['Button', '6 mm tactile, normally open'],
    ['Internal pull-up', '20 to 50 kΩ'],
    ['Current when pressed', 'About 0.1 to 0.25 mA'],
    ['LED resistor', '220 Ω'],
  ],
  code: [{ name: 'button.ino', lang: 'cpp', source: buttonCode }],
  inputs: [{ id: 'btn1', kind: 'hold', label: 'Hold the button' }],
  tick: (ctx) => {
    const pressed = ctx.input('btn1') > 0
    if (changed(ctx, 'p', pressed ? 1 : 0)) ctx.print(pressed ? 'pressed' : 'released')
    return {
      led1: pressed ? 1 : 0,
      line: lineOf(buttonCode, pressed ? 'digitalWrite(LED' : 'digitalRead(BUTTON)'),
    }
  },
}

const dimmerCode = `const int KNOB = A0;
const int LED = 9;

void setup() {
  pinMode(LED, OUTPUT);
  Serial.begin(9600);
}

void loop() {
  int reading = analogRead(KNOB);
  int brightness = reading / 4;
  analogWrite(LED, brightness);
  Serial.println(reading);
  delay(100);
}`

const dimmer: Lesson = {
  ...base,
  id: 'dimmer-knob',
  use: 'Lights and switches',
  title: 'Fade with a knob',
  summary: 'An analog input in, a PWM output out, and a smooth dimmer between them.',
  overview:
    'The knob is a voltage divider, so its middle leg sits anywhere from 0 to 5 V. analogRead turns that into a number from 0 to 1023. A pin cannot output a real in-between voltage, so analogWrite flicks it on and off about 490 times a second and the on-time sets the brightness.',
  learn: [
    'analogRead gives 0 to 1023, analogWrite takes 0 to 255',
    'Only the pins marked ~ can do analogWrite',
    'Dividing by 4 maps one range onto the other',
  ],
  bench: {
    boards: UNO_LEFT,
    breadboard: BB_RIGHT,
    parts: [
      { id: 'pot1', kind: 'pot', pins: { 1: 'c5', w: 'c7', 3: 'c9' } },
      { id: 'r1', kind: 'resistor', ohms: 220, pins: { a: 'c15', b: 'c20' } },
      { id: 'led1', kind: 'led', color: '#e4b21c', pins: { a: 'd20', k: 'd21' } },
    ],
    wires: [
      { from: 'uno.5V', to: 'bb.+b1', color: 'red' },
      { from: 'uno.GND2', to: 'bb.-b2', color: 'black' },
      { from: 'bb.a5', to: 'bb.+b5', color: 'red' },
      { from: 'bb.a7', to: 'uno.A0', color: 'green' },
      { from: 'bb.a9', to: 'bb.-b9', color: 'black' },
      { from: 'uno.D9', to: 'bb.a15', color: 'yellow' },
      { from: 'bb.a21', to: 'bb.-b21', color: 'black' },
    ],
    nets: [
      ['uno.5V', 'pot1.1'],
      ['uno.A0', 'pot1.w'],
      ['uno.GND2', 'pot1.3', 'led1.k'],
      ['uno.D9', 'r1.a'],
      ['r1.b', 'led1.a'],
    ],
  },
  callouts: [
    { title: 'Pin ~9', body: 'A PWM pin, so it can fade.', at: 'uno.D9', slot: 'tl' },
    { title: 'Knob', body: 'Its middle leg moves between 0 and 5 V.', at: 'pot1', slot: 'tr' },
    { title: 'LED', body: 'Brightness follows the on-time of pin 9.', at: 'led1', slot: 'tc' },
    { title: 'A0', body: 'Measures the middle leg.', at: 'uno.A0', slot: 'bl' },
    { title: 'Rails', body: '5 V and ground across the knob.', at: 'bb.+b1', slot: 'br' },
  ],
  wiring: [
    { from: '5V', to: 'Red rail', why: 'Top of the divider.', at: 'uno.5V' },
    { from: 'GND', to: 'Blue rail', why: 'Bottom of the divider.', at: 'uno.GND2' },
    { from: 'Knob, outer legs', to: 'Rails', why: 'One leg to 5 V, the other to ground.', at: 'pot1.1' },
    { from: 'Knob, middle leg', to: 'A0', why: 'The voltage you are measuring.', at: 'uno.A0' },
    { from: 'D9', to: '220 Ω, then LED', why: 'PWM output.', at: 'uno.D9' },
  ],
  specs: [
    ['Knob', '10 kΩ linear potentiometer'],
    ['Analog input', '10-bit: 5 V ÷ 1024 ≈ 4.9 mV per step'],
    ['PWM on pin 9', 'About 490 Hz, 8-bit'],
    ['LED resistor', '220 Ω'],
  ],
  code: [{ name: 'dimmer.ino', lang: 'cpp', source: dimmerCode }],
  inputs: [{ id: 'pot1', kind: 'slider', label: 'Knob position', min: 0, max: 1023, step: 1, initial: 512 }],
  tick: (ctx) => {
    const reading = Math.round(ctx.input('pot1'))
    if (every(ctx, 'p', 0.5)) ctx.print(String(reading))
    return {
      led1: Math.floor(reading / 4) / 255,
      line: lineOf(dimmerCode, 'analogWrite(LED'),
    }
  },
}

const nightCode = `const int SENSOR = A0;
const int LED = 9;
const int DARK = 300;

void setup() {
  pinMode(LED, OUTPUT);
  Serial.begin(9600);
}

void loop() {
  int light = analogRead(SENSOR);
  Serial.println(light);
  if (light < DARK) {
    digitalWrite(LED, HIGH);
  } else {
    digitalWrite(LED, LOW);
  }
  delay(200);
}`

const nightLight: Lesson = {
  ...base,
  id: 'night-light',
  use: 'Sensing the world',
  title: 'Build a night light',
  summary: 'A light sensor and a threshold: the LED comes on when the room goes dark.',
  overview:
    'A light-dependent resistor drops its resistance as light falls on it. Paired with a fixed 10 kΩ resistor it forms a divider, and the voltage between the two rises with the light. The sketch compares the reading with a threshold you choose.',
  learn: [
    'A resistive sensor needs a divider to become a voltage',
    'Read your room before you pick a threshold',
    'The same pattern works for any if-this-then-that gadget',
  ],
  bench: {
    boards: UNO_LEFT,
    breadboard: BB_RIGHT,
    parts: [
      { id: 'ldr1', kind: 'ldr', pins: { a: 'c5', b: 'c8' } },
      { id: 'r2', kind: 'resistor', ohms: 10000, pins: { a: 'd8', b: 'd12' } },
      { id: 'r1', kind: 'resistor', ohms: 220, pins: { a: 'c18', b: 'c23' } },
      { id: 'led1', kind: 'led', color: '#e4b21c', pins: { a: 'd23', k: 'd24' } },
    ],
    wires: [
      { from: 'uno.5V', to: 'bb.+b1', color: 'red' },
      { from: 'uno.GND2', to: 'bb.-b2', color: 'black' },
      { from: 'bb.a5', to: 'bb.+b5', color: 'red' },
      { from: 'bb.a8', to: 'uno.A0', color: 'green' },
      { from: 'bb.a12', to: 'bb.-b13', color: 'black' },
      { from: 'uno.D9', to: 'bb.a18', color: 'yellow' },
      { from: 'bb.a24', to: 'bb.-b25', color: 'black' },
    ],
    nets: [
      ['uno.5V', 'ldr1.a'],
      ['ldr1.b', 'r2.a', 'uno.A0'],
      ['r2.b', 'uno.GND2', 'led1.k'],
      ['uno.D9', 'r1.a'],
      ['r1.b', 'led1.a'],
    ],
  },
  callouts: [
    { title: 'Light sensor', body: 'Lower resistance in brighter light.', at: 'ldr1', slot: 'tr' },
    { title: 'A0', body: 'Reads the point between sensor and resistor.', at: 'uno.A0', slot: 'bl' },
    { title: '10 kΩ resistor', body: 'The other half of the divider.', at: 'r2', slot: 'bc' },
    { title: 'LED', body: 'Comes on below the threshold.', at: 'led1', slot: 'br' },
    { title: 'Pin ~9', body: 'Switches the LED.', at: 'uno.D9', slot: 'tl' },
  ],
  wiring: [
    { from: '5V', to: 'Sensor, row 5', why: 'Top of the divider.', at: 'ldr1.a' },
    { from: 'Row 8', to: 'A0', why: 'The midpoint, where the voltage changes.', at: 'uno.A0' },
    { from: 'Row 8', to: '10 kΩ, then ground', why: 'Bottom of the divider.', at: 'r2' },
    { from: 'D9', to: '220 Ω, then LED', why: 'The output.', at: 'uno.D9' },
  ],
  specs: [
    ['Sensor', 'GL5528 or similar LDR'],
    ['Sensor resistance', 'About 10 kΩ in room light, over 1 MΩ in the dark'],
    ['Divider', 'Sensor on top, 10 kΩ below'],
    ['Threshold', '300 of 1023, tune it for your room'],
  ],
  code: [{ name: 'night_light.ino', lang: 'cpp', source: nightCode }],
  inputs: [{ id: 'light', kind: 'slider', label: 'Room light', min: 0, max: 1023, step: 1, initial: 700 }],
  tick: (ctx) => {
    const light = Math.round(ctx.input('light'))
    const dark = light < 300
    if (every(ctx, 'p', 0.5)) ctx.print(String(light))
    return {
      led1: dark ? 1 : 0,
      line: lineOf(nightCode, dark ? 'digitalWrite(LED, HIGH)' : 'digitalWrite(LED, LOW)'),
    }
  },
}

const parkingCode = `const int TRIG = 7;
const int ECHO = 6;
const int BUZZER = 8;

void setup() {
  pinMode(TRIG, OUTPUT);
  pinMode(ECHO, INPUT);
  Serial.begin(9600);
}

void loop() {
  digitalWrite(TRIG, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG, LOW);

  long echo = pulseIn(ECHO, HIGH, 30000);
  int cm = echo * 0.0343 / 2;
  Serial.println(cm);

  if (cm > 0 && cm < 50) {
    tone(BUZZER, 1000, 40);
    delay(cm * 8);
  } else {
    delay(200);
  }
}`

const parking: Lesson = {
  ...base,
  id: 'parking-sensor',
  use: 'Sensing the world',
  title: 'Parking sensor',
  summary: 'Time an ultrasonic echo and beep faster as the car gets closer.',
  overview:
    'The HC-SR04 sends a burst of 40 kHz sound when pin 7 pulses, then holds its echo pin high until the sound comes back. Sound travels 0.0343 cm per microsecond and makes the trip twice, so the sketch can turn that time into centimetres.',
  learn: [
    'Distance is echo time × 0.0343 ÷ 2',
    'pulseIn measures how long a pin stays high',
    'Under 50 cm the pause between beeps shrinks with the distance',
  ],
  bench: {
    boards: UNO_LEFT,
    breadboard: BB_RIGHT,
    parts: [
      { id: 'sonar1', kind: 'hcsr04', pins: { VCC: 'j9', TRIG: 'j10', ECHO: 'j11', GND: 'j12' } },
      { id: 'r1', kind: 'resistor', ohms: 100, pins: { a: 'c16', b: 'c22' } },
      { id: 'buzzer1', kind: 'buzzer', pins: { p: 'd22', n: 'd25' } },
    ],
    modules: [{ id: 'car1', kind: 'car', pos: [4.2, 5.4] }],
    wires: [
      { from: 'uno.5V', to: 'bb.+t2', color: 'red' },
      { from: 'uno.GND2', to: 'bb.-t3', color: 'black' },
      { from: 'bb.h9', to: 'bb.+t9', color: 'red' },
      { from: 'bb.h10', to: 'uno.D7', color: 'blue' },
      { from: 'bb.h11', to: 'uno.D6', color: 'green' },
      { from: 'bb.h12', to: 'bb.-t13', color: 'black' },
      { from: 'uno.D8', to: 'bb.a16', color: 'yellow' },
      { from: 'bb.a25', to: 'uno.GND3', color: 'black' },
    ],
    nets: [
      ['uno.5V', 'sonar1.VCC'],
      ['uno.D7', 'sonar1.TRIG'],
      ['uno.D6', 'sonar1.ECHO'],
      ['uno.GND2', 'sonar1.GND', 'buzzer1.n'],
      ['uno.D8', 'r1.a'],
      ['r1.b', 'buzzer1.p'],
    ],
  },
  callouts: [
    { title: 'HC-SR04', body: 'One side shouts, the other listens.', at: 'sonar1', slot: 'tr' },
    { title: 'Pins 7 and 6', body: 'Trigger out, echo in.', at: 'uno.D7', slot: 'tl' },
    { title: 'Buzzer', body: 'tone() makes the note on pin 8.', at: 'buzzer1', slot: 'bc' },
    { title: 'Toy car', body: 'Move it with the distance control.', at: 'car1', slot: 'br' },
  ],
  wiring: [
    { from: '5V', to: 'Red rail, then VCC', why: 'The sensor runs on 5 V.', at: 'sonar1.VCC' },
    { from: 'D7', to: 'TRIG', why: 'A 10 µs pulse starts a measurement.', at: 'uno.D7' },
    { from: 'D6', to: 'ECHO', why: 'Stays high for the round trip.', at: 'uno.D6' },
    { from: 'GND', to: 'Blue rail, then sensor GND', why: 'Shared ground.', at: 'sonar1.GND' },
    { from: 'D8', to: '100 Ω, then buzzer +', why: 'Keeps the pin current safe.', at: 'uno.D8' },
    { from: 'Buzzer −', to: 'GND', why: 'The second ground socket, beside AREF.', at: 'uno.GND3' },
  ],
  specs: [
    ['Sensor', 'HC-SR04, 5 V, 40 kHz'],
    ['Range', '2 cm to 4 m'],
    ['Speed of sound', '343 m/s at 20 °C'],
    ['Buzzer', 'Passive, driven by tone()'],
    ['Beep range', 'Below 50 cm'],
  ],
  code: [{ name: 'parking.ino', lang: 'cpp', source: parkingCode }],
  inputs: [{ id: 'car1', kind: 'slider', label: 'Distance to car', min: 5, max: 100, step: 1, initial: 60, unit: 'cm' }],
  tick: (ctx) => {
    const cm = Math.round(ctx.input('car1'))
    const near = cm < 50
    const gap = near ? 0.04 + (cm * 8) / 1000 : 0.2
    if (ctx.t >= (ctx.mem.next ?? 0)) {
      ctx.mem.next = ctx.t + Math.max(gap, 0.2)
      ctx.print(String(cm))
    }
    const phase = near ? ctx.t % gap : 1
    return {
      buzzer1: phase < 0.04 ? 1 : 0,
      line: lineOf(parkingCode, near ? 'tone(BUZZER' : 'delay(200)'),
    }
  },
}

const servoCode = `#include <Servo.h>

const int KNOB = A0;
Servo arm;

void setup() {
  arm.attach(9);
}

void loop() {
  int reading = analogRead(KNOB);
  int angle = map(reading, 0, 1023, 0, 180);
  arm.write(angle);
  delay(15);
}`

const servo: Lesson = {
  ...base,
  id: 'servo-knob',
  use: 'Making things move',
  title: 'Steer a servo',
  summary: 'Turn the knob and a servo arm follows it to the same angle.',
  overview:
    'A hobby servo has a motor, a gearbox and its own position sensor inside. You send one pulse every 20 ms, and the pulse width says which angle to hold. The Servo library takes care of the pulses, so you only name the angle.',
  learn: [
    'map() converts one range to another',
    'Servo signals are pulses, not voltages',
    'The servo has three wires: power, ground, signal',
  ],
  bench: {
    boards: UNO_LEFT,
    breadboard: BB_RIGHT,
    parts: [{ id: 'pot1', kind: 'pot', pins: { 1: 'h5', w: 'h7', 3: 'h9' } }],
    modules: [{ id: 'servo1', kind: 'servo', pos: [4.2, -5.6] }],
    wires: [
      { from: 'uno.5V', to: 'bb.+t1', color: 'red' },
      { from: 'uno.GND2', to: 'bb.-t2', color: 'black' },
      { from: 'bb.j5', to: 'bb.+t5', color: 'red' },
      { from: 'bb.j7', to: 'uno.A0', color: 'green' },
      { from: 'bb.j9', to: 'bb.-t9', color: 'black' },
      { from: 'servo1.VCC', to: 'bb.+t15', color: 'red' },
      { from: 'servo1.GND', to: 'bb.-t16', color: 'black' },
      { from: 'servo1.SIG', to: 'uno.D9', color: 'orange' },
    ],
    nets: [
      ['uno.5V', 'pot1.1', 'servo1.VCC'],
      ['uno.A0', 'pot1.w'],
      ['uno.GND2', 'pot1.3', 'servo1.GND'],
      ['uno.D9', 'servo1.SIG'],
    ],
  },
  callouts: [
    { title: 'Servo', body: 'Holds whatever angle it is told.', at: 'servo1.horn', slot: 'tr' },
    { title: 'Pin ~9', body: 'Sends one position pulse every 20 ms.', at: 'uno.D9', slot: 'tl' },
    { title: 'Knob', body: 'Sets the angle from 0 to 180°.', at: 'pot1', slot: 'br' },
    { title: 'A0', body: 'Reads the knob.', at: 'uno.A0', slot: 'bl' },
  ],
  wiring: [
    { from: 'Servo red', to: 'Red rail', why: 'Motor power from 5 V.', at: 'servo1.VCC' },
    { from: 'Servo brown', to: 'Blue rail', why: 'Ground.', at: 'servo1.GND' },
    { from: 'Servo orange', to: 'D9', why: 'The position signal.', at: 'uno.D9' },
    { from: 'Knob middle leg', to: 'A0', why: 'The angle you are asking for.', at: 'uno.A0' },
  ],
  specs: [
    ['Servo', 'SG90 micro, 180° travel'],
    ['Pulse', '1 to 2 ms, every 20 ms'],
    ['Stall current', 'Up to about 650 mA'],
    ['Library', 'Servo.h, included with the Arduino IDE'],
  ],
  code: [{ name: 'servo_knob.ino', lang: 'cpp', source: servoCode }],
  caution: 'A stalled servo can pull more than USB supplies. If the board resets when it moves, give the servo its own 5 V supply and join the grounds.',
  inputs: [{ id: 'pot1', kind: 'slider', label: 'Knob position', min: 0, max: 1023, step: 1, initial: 512 }],
  tick: (ctx) => {
    const target = (ctx.input('pot1') / 1023) * 180
    const current = ctx.mem.angle ?? 90
    const angle = current + clamp(target - current, -6, 6)
    ctx.mem.angle = angle
    return { servo1: angle, line: lineOf(servoCode, 'arm.write(angle)') }
  },
}

const motorCode = `const int MOTOR = 3;
const int SPEED = 180;

void setup() {
  pinMode(MOTOR, OUTPUT);
}

void loop() {
  analogWrite(MOTOR, SPEED);
  delay(2000);
  analogWrite(MOTOR, 0);
  delay(1000);
}`

const motor: Lesson = {
  ...base,
  id: 'dc-motor',
  use: 'Making things move',
  title: 'Drive a DC motor',
  summary: 'A pin cannot power a motor, so a transistor switches the current for it.',
  overview:
    'A small motor wants far more than the 20 mA a pin should give. A transistor lets the pin control a bigger current: a little into the base lets a lot flow from collector to emitter. The diode gives the motor somewhere safe to dump its energy when switched off, otherwise the voltage spike can kill the transistor.',
  learn: [
    'The base resistor limits the current the pin has to supply',
    'The stripe on the diode faces the 5 V side',
    'PWM on the base gives you speed control',
  ],
  caution: 'Do not connect a motor straight to a pin. Larger motors also need their own supply, with its ground joined to the Uno.',
  bench: {
    boards: UNO_LEFT,
    breadboard: BB_RIGHT,
    parts: [
      { id: 'r1', kind: 'resistor', ohms: 1000, pins: { a: 'b5', b: 'b11' } },
      { id: 'q1', kind: 'transistor', pins: { e: 'd10', b: 'd11', c: 'd12' } },
      { id: 'd1', kind: 'diode', pins: { a: 'c12', k: 'c16' } },
    ],
    modules: [{ id: 'motor1', kind: 'motor', pos: [4.2, 5.2] }],
    wires: [
      { from: 'uno.5V', to: 'bb.+b1', color: 'red' },
      { from: 'uno.GND2', to: 'bb.-b2', color: 'black' },
      { from: 'uno.D3', to: 'bb.a5', color: 'yellow' },
      { from: 'bb.a10', to: 'bb.-b10', color: 'black' },
      { from: 'bb.a16', to: 'bb.+b16', color: 'red' },
      { from: 'motor1.P', to: 'bb.b16', color: 'red' },
      { from: 'motor1.N', to: 'bb.b12', color: 'blue' },
    ],
    nets: [
      ['uno.D3', 'r1.a'],
      ['r1.b', 'q1.b'],
      ['q1.e', 'uno.GND2'],
      ['q1.c', 'd1.a', 'motor1.N'],
      ['d1.k', 'motor1.P', 'uno.5V'],
    ],
  },
  callouts: [
    { title: 'Pin ~3', body: 'A small PWM signal sets the speed.', at: 'uno.D3', slot: 'tl' },
    { title: 'NPN transistor', body: 'The pin controls, the 5 V rail supplies.', at: 'q1', slot: 'tr' },
    { title: 'Flyback diode', body: 'Absorbs the spike at switch-off.', at: 'd1', slot: 'tc' },
    { title: 'Motor', body: 'Runs from the rail, not from the pin.', at: 'motor1.wheel', slot: 'br' },
    { title: '1 kΩ resistor', body: 'Limits base current to about 4 mA.', at: 'r1', slot: 'bc' },
  ],
  wiring: [
    { from: 'D3', to: '1 kΩ, then base', why: 'The control signal.', at: 'uno.D3' },
    { from: 'Emitter', to: 'Ground rail', why: 'Current leaves here.', at: 'q1.e' },
    { from: 'Collector', to: 'Motor −', why: 'The transistor switches the motor’s low side.', at: 'q1.c' },
    { from: 'Motor +', to: 'Red rail', why: 'Motor power.', at: 'motor1.P' },
    { from: 'Diode', to: 'Across the motor', why: 'Stripe towards 5 V.', at: 'd1' },
  ],
  specs: [
    ['Transistor', 'PN2222, 600 mA maximum, flat side towards the viewer: E, B, C'],
    ['Base current', '(5 − 0.7) ÷ 1000 ≈ 4 mA'],
    ['Diode', '1N4001, stripe to 5 V'],
    ['Motor', 'Small 3 to 6 V hobby motor, under 200 mA'],
  ],
  code: [{ name: 'motor.ino', lang: 'cpp', source: motorCode }],
  tick: (ctx) => {
    const phase = ctx.t % 3
    const on = phase < 2
    if (changed(ctx, 's', on ? 1 : 0) || ctx.t === 0) ctx.print(on ? 'Running at 180 of 255' : 'Stopped')
    return {
      motor1: on ? 180 / 255 : 0,
      line: lineOf(motorCode, 'delay', on ? 1 : 2),
    }
  },
}

const oledCode = `#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

Adafruit_SSD1306 screen(128, 64, &Wire, -1);

void setup() {
  screen.begin(SSD1306_SWITCHCAPVCC, 0x3C);
  screen.setTextColor(SSD1306_WHITE);
  Serial.begin(9600);
}

void loop() {
  float volts = analogRead(A0) * 5.0 / 1023.0;
  float celsius = (volts - 0.5) * 100.0;

  screen.clearDisplay();
  screen.setTextSize(3);
  screen.setCursor(0, 20);
  screen.print(celsius, 1);
  screen.display();

  Serial.println(celsius, 1);
  delay(1000);
}`

const thermometer: Lesson = {
  ...base,
  id: 'oled-thermometer',
  use: 'Displays and buses',
  title: 'OLED thermometer',
  summary: 'Read an analog temperature sensor and show it on an I²C screen.',
  overview:
    'The TMP36 outputs 0.5 V at 0 °C and 10 mV more per degree, so the conversion is one line. The OLED uses I²C: only two signal wires, shared by every device on the bus, with each device answering to its own address.',
  learn: [
    'I²C uses SDA and SCL, on A4 and A5 on the Uno',
    'The screen only changes when you call display()',
    'Celsius is (volts − 0.5) × 100 for a TMP36',
  ],
  bench: {
    boards: UNO_LEFT,
    breadboard: BB_RIGHT,
    parts: [
      { id: 'tmp1', kind: 'tmp36', pins: { vs: 'd5', out: 'd6', gnd: 'd7' } },
      { id: 'oled1', kind: 'oled', pins: { GND: 'a15', VCC: 'a16', SCL: 'a17', SDA: 'a18' } },
    ],
    wires: [
      { from: 'uno.5V', to: 'bb.+b1', color: 'red' },
      { from: 'uno.GND2', to: 'bb.-b2', color: 'black' },
      { from: 'bb.+b3', to: 'bb.+t3', color: 'red' },
      { from: 'bb.-b4', to: 'bb.-t4', color: 'black' },
      { from: 'bb.a5', to: 'bb.+b5', color: 'red' },
      { from: 'bb.a6', to: 'uno.A0', color: 'green' },
      { from: 'bb.a7', to: 'bb.-b7', color: 'black' },
      { from: 'bb.c15', to: 'bb.-t15', color: 'black' },
      { from: 'bb.c16', to: 'bb.+t16', color: 'red' },
      { from: 'bb.c17', to: 'uno.A5', color: 'yellow' },
      { from: 'bb.c18', to: 'uno.A4', color: 'blue' },
    ],
    nets: [
      ['uno.5V', 'tmp1.vs', 'oled1.VCC'],
      ['uno.A0', 'tmp1.out'],
      ['uno.GND2', 'tmp1.gnd', 'oled1.GND'],
      ['uno.A5', 'oled1.SCL'],
      ['uno.A4', 'oled1.SDA'],
    ],
  },
  callouts: [
    { title: 'OLED screen', body: '128 x 64 pixels at I²C address 0x3C.', at: 'oled1', slot: 'tr' },
    { title: 'TMP36', body: '10 mV per degree, 0.5 V at 0 °C.', at: 'tmp1', slot: 'bc' },
    { title: 'A4 and A5', body: 'I²C data and clock.', at: 'uno.A4', slot: 'bl' },
    { title: 'A0', body: 'Reads the sensor.', at: 'uno.A0', slot: 'tl' },
    { title: 'Rail bridges', body: 'Carry power to the far side.', at: 'bb.+b3', slot: 'br' },
  ],
  wiring: [
    { from: 'TMP36 left leg', to: 'Red rail', why: 'Flat side towards you, left leg is +5 V.', at: 'tmp1.vs' },
    { from: 'TMP36 middle leg', to: 'A0', why: 'The temperature voltage.', at: 'uno.A0' },
    { from: 'TMP36 right leg', to: 'Blue rail', why: 'Ground.', at: 'tmp1.gnd' },
    { from: 'OLED SCL', to: 'A5', why: 'I²C clock.', at: 'uno.A5' },
    { from: 'OLED SDA', to: 'A4', why: 'I²C data.', at: 'uno.A4' },
  ],
  specs: [
    ['Sensor', 'TMP36, −40 to 125 °C'],
    ['Screen', 'SSD1306, 128 x 64, I²C'],
    ['Address', '0x3C on most modules'],
    ['Libraries', 'Adafruit SSD1306 and Adafruit GFX'],
    ['Pin order', 'Varies by module, check the labels on yours'],
  ],
  code: [{ name: 'thermometer.ino', lang: 'cpp', source: oledCode }],
  inputs: [{ id: 'temp', kind: 'slider', label: 'Temperature', min: -10, max: 50, step: 0.5, initial: 22, unit: '°C' }],
  tick: (ctx) => {
    const c = ctx.input('temp')
    const text = c.toFixed(1)
    if (every(ctx, 'p', 1)) ctx.print(text)
    return { oled1: `${text} C`, line: lineOf(oledCode, 'screen.display()') }
  },
}

/**
 * DFRobot's GravityTDS library turns the probe voltage into ppm with this cubic, corrects it to 25 °C by
 * 2% per degree, and halves it. The simulation runs it backwards to find the voltage for a chosen water.
 */
function tdsFromVoltage(volts: number, celsius: number): number {
  const ec = 133.42 * volts ** 3 - 255.86 * volts ** 2 + 857.39 * volts
  return (ec / (1 + 0.02 * (celsius - 25))) * 0.5
}

function voltageForTds(ppm: number, celsius: number): number {
  let low = 0
  let high = 2.3
  for (let i = 0; i < 40; i++) {
    const mid = (low + high) / 2
    if (tdsFromVoltage(mid, celsius) < ppm) low = mid
    else high = mid
  }
  return (low + high) / 2
}

const waterCode = `#include <OneWire.h>
#include <DallasTemperature.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <EEPROM.h>
#include <GravityTDS.h>

const int TDS_PIN = A1;
const int TEMP_PIN = 2;

OneWire oneWire(TEMP_PIN);
DallasTemperature probe(&oneWire);
GravityTDS tds;
Adafruit_SSD1306 screen(128, 64, &Wire, -1);

void setup() {
  Serial.begin(115200);
  probe.begin();
  tds.setPin(TDS_PIN);
  tds.setAref(5.0);
  tds.setAdcRange(1024);
  tds.begin();
  screen.begin(SSD1306_SWITCHCAPVCC, 0x3C);
  screen.setTextColor(SSD1306_WHITE);
}

void loop() {
  probe.requestTemperatures();
  float celsius = probe.getTempCByIndex(0);

  tds.setTemperature(celsius);
  tds.update();
  float ppm = tds.getTdsValue();

  screen.clearDisplay();
  screen.setTextSize(2);
  screen.setCursor(0, 10);
  screen.print(ppm, 0);
  screen.print(" ppm");
  screen.setCursor(0, 40);
  screen.print(celsius, 1);
  screen.print(" C");
  screen.display();

  Serial.print(ppm, 0);
  Serial.print(" ppm at ");
  Serial.print(celsius, 1);
  Serial.println(" C");
  delay(1000);
}`

const WATERS = [
  { label: 'Distilled', value: 5 },
  { label: 'Tap', value: 180 },
  { label: 'Salty', value: 750 },
]

const waterMeter: Lesson = {
  ...base,
  id: 'water-quality',
  use: 'Water and plants',
  title: 'Water quality meter',
  summary: 'Measure dissolved solids and temperature, and show both on a screen.',
  overview:
    'A TDS probe passes a small current between two metal pins in the water. Dissolved minerals and salts carry that current, so more of them gives a higher voltage. The reading also rises with temperature, so a waterproof temperature probe sits in the same glass and the sketch corrects the result to 25 °C. Growers use this to mix plant food, and fish keepers use it to watch their tanks.',
  learn: [
    'TDS means total dissolved solids, measured in parts per million',
    'Warm water conducts better, so the reading is corrected to 25 °C',
    'A DS18B20 needs a 4.7 kΩ pull-up resistor on its data wire',
    'A cheap probe gives an estimate, about ±10%, not a lab result',
  ],
  caution:
    'This is not a drinking water safety test. A TDS reading cannot detect bacteria, lead or most harmful chemicals. Keep the boards and the Uno away from the water, and only the probes in it.',
  bench: {
    boards: UNO_LEFT,
    breadboard: BB_RIGHT,
    parts: [
      { id: 'r1', kind: 'resistor', ohms: 4700, pins: { a: 'h8', b: 'h11' } },
      { id: 'oled1', kind: 'oled', pins: { GND: 'a15', VCC: 'a16', SCL: 'a17', SDA: 'a18' } },
    ],
    modules: [
      { id: 'tds1', kind: 'tds', pos: [6.6, -5.4] },
      { id: 'temp1', kind: 'ds18b20', pos: [1.2, -4] },
      { id: 'glass1', kind: 'glass', pos: [12.4, -1.5], holds: ['tds', 'temp'] },
    ],
    wires: [
      { from: 'uno.5V', to: 'bb.+b1', color: 'red' },
      { from: 'uno.GND2', to: 'bb.-b2', color: 'black' },
      { from: 'bb.+b3', to: 'bb.+t3', color: 'red' },
      { from: 'bb.-b4', to: 'bb.-t4', color: 'black' },
      { from: 'temp1.VCC', to: 'bb.+t5', color: 'red' },
      { from: 'temp1.GND', to: 'bb.-t7', color: 'black' },
      { from: 'temp1.DATA', to: 'bb.j8', color: 'yellow' },
      { from: 'bb.i8', to: 'uno.D2', color: 'yellow' },
      { from: 'bb.j11', to: 'bb.+t11', color: 'red' },
      { from: 'tds1.VCC', to: 'bb.+t20', color: 'red' },
      { from: 'tds1.GND', to: 'bb.-t21', color: 'black' },
      { from: 'tds1.A', to: 'uno.A1', color: 'blue' },
      { from: 'bb.c15', to: 'bb.-t15', color: 'black' },
      { from: 'bb.c16', to: 'bb.+t16', color: 'red' },
      { from: 'bb.c17', to: 'uno.A5', color: 'yellow' },
      { from: 'bb.c18', to: 'uno.A4', color: 'blue' },
    ],
    cables: [
      { from: 'tds1.probe', to: 'glass1.tds', color: '#1d1f23' },
      { from: 'temp1.cable', to: 'glass1.temp', color: '#1d1f23' },
    ],
    nets: [
      ['uno.5V', 'temp1.VCC', 'r1.b', 'tds1.VCC', 'oled1.VCC'],
      ['uno.D2', 'temp1.DATA', 'r1.a'],
      ['uno.GND2', 'temp1.GND', 'tds1.GND', 'oled1.GND'],
      ['uno.A1', 'tds1.A'],
      ['uno.A5', 'oled1.SCL'],
      ['uno.A4', 'oled1.SDA'],
    ],
  },
  callouts: [
    { title: 'TDS board', body: 'Turns the probe reading into a voltage for A1.', at: 'tds1', slot: 'tc' },
    { title: 'Glass of water', body: 'Only the probes go in the water.', at: 'glass1', slot: 'tr' },
    { title: 'DS18B20 probe', body: 'Waterproof thermometer on pin 2.', at: 'temp1', slot: 'tl' },
    { title: '4.7 kΩ pull-up', body: 'Holds the data wire high between messages.', at: 'r1', slot: 'mr' },
    { title: 'OLED screen', body: 'Shows ppm and temperature.', at: 'oled1', slot: 'br' },
  ],
  wiring: [
    { from: 'TDS board signal', to: 'A1', why: 'The voltage that rises with dissolved solids.', at: 'uno.A1' },
    { from: 'TDS board power', to: '5 V and GND rails', why: 'The board runs on 3.3 to 5.5 V.', at: 'tds1' },
    { from: 'DS18B20 yellow, data', to: 'D2, through row 8', why: 'The 1-Wire data line.', at: 'uno.D2' },
    { from: '4.7 kΩ', to: 'Row 8 to the 5 V rail', why: 'The pull-up the 1-Wire bus needs.', at: 'r1' },
    { from: 'DS18B20 red and black', to: '5 V and GND rails', why: 'Probe power, 3.0 to 5.5 V.', at: 'temp1' },
    { from: 'OLED SCL and SDA', to: 'A5 and A4', why: 'The I²C bus, as in the thermometer lesson.', at: 'oled1' },
  ],
  specs: [
    ['TDS sensor', 'DFRobot Gravity SEN0244, 0 to 1000 ppm, ±10% at 25 °C'],
    ['TDS output', '0 to 2.3 V into A1'],
    ['Temperature probe', 'DS18B20, ±0.5 °C from −10 to 85 °C'],
    ['Pull-up', '4.7 kΩ from data to 5 V'],
    ['Libraries', 'GravityTDS (from DFRobot), OneWire, DallasTemperature, Adafruit SSD1306 and GFX'],
    ['Sample readings', 'The distilled, tap and salty values here are examples, not standards'],
  ],
  code: [{ name: 'water.ino', lang: 'cpp', source: waterCode }],
  inputs: [
    { id: 'water', kind: 'choice', label: 'Water', options: WATERS, initial: 180 },
    { id: 'temp', kind: 'slider', label: 'Water temperature', min: 5, max: 35, step: 0.5, initial: 22, unit: '°C' },
  ],
  tick: (ctx) => {
    const celsius = ctx.input('temp')
    const volts = voltageForTds(ctx.input('water'), celsius)
    // What the Uno sees: a 10-bit reading of the voltage, then the library's formula.
    const reading = Math.round((volts / 5) * 1024)
    const ppm = Math.max(0, Math.round(tdsFromVoltage((reading / 1024) * 5, celsius)))
    const text = `${ppm} ppm at ${celsius.toFixed(1)} C`
    if (every(ctx, 'p', 1)) ctx.print(text)
    return { oled1: `${ppm} ppm\n${celsius.toFixed(1)} C`, line: lineOf(waterCode, 'screen.display()') }
  },
}

const phCode = `#include <EEPROM.h>
#include <DFRobot_PH.h>

const int PH_PIN = A1;
DFRobot_PH ph;
float temperature = 25.0;

void setup() {
  Serial.begin(115200);
  ph.begin();
}

void loop() {
  float millivolts = analogRead(PH_PIN) / 1024.0 * 5000.0;
  float value = ph.readPH(millivolts, temperature);
  Serial.print("pH ");
  Serial.println(value, 2);

  // Watches the serial monitor for ENTERPH, CALPH and EXITPH.
  ph.calibration(millivolts, temperature);
  delay(1000);
}`

/** A typical used probe: a little off at pH 7 and a little less sensitive than an ideal one. */
const PROBE_OFFSET_MV = 45
const PROBE_MV_PER_PH = 168
const LIBRARY_NEUTRAL_MV = 1500
const LIBRARY_ACID_MV = 2032.44

function probeMillivolts(pH: number): number {
  return 1500 + PROBE_OFFSET_MV + (7 - pH) * PROBE_MV_PER_PH
}

/** DFRobot_PH's two-point line through the stored pH 7 and pH 4 voltages. */
function libraryPh(mv: number, neutral: number, acid: number): number {
  const slope = (7 - 4) / ((neutral - 1500) / 3 - (acid - 1500) / 3)
  const intercept = 7 - (slope * (neutral - 1500)) / 3
  return (slope * (mv - 1500)) / 3 + intercept
}

const SOLUTIONS = [
  { label: 'pH 7 buffer', value: 7 },
  { label: 'pH 4 buffer', value: 4 },
  { label: 'Sample', value: -1 },
]

const phCalibration: Lesson = {
  ...base,
  boot: [...UPLOAD, 'Serial monitor at 115200 baud'],
  id: 'ph-calibration',
  use: 'Water and plants',
  title: 'Calibrate a pH probe',
  summary: 'Teach the Uno what pH 7 and pH 4 look like, then measure your own water.',
  overview:
    'A pH probe makes a small voltage that changes with acidity, but every probe is slightly different and drifts as it ages. Out of the box this one reads pH 7 buffer as about 6.75. Calibration fixes that: dip the probe in two buffer solutions of known pH, tell the library which is which, and it stores the probe’s real voltages in the Uno’s memory. Every reading after that uses your probe’s own line.',
  learn: [
    'Buffer solutions have a known, stable pH, which is what makes them useful for calibration',
    'Two points, pH 7 and pH 4, define the line from voltage to pH',
    'The library saves calibration in EEPROM, so it survives a restart',
    'Rinse the probe between solutions, and recalibrate every few weeks',
  ],
  caution:
    'Keep the probe tip wet in its storage solution, because a dried-out bulb can be ruined. The glass bulb breaks easily. This is not a drinking water safety test.',
  bench: {
    boards: UNO_LEFT,
    modules: [
      { id: 'ph1', kind: 'ph', pos: [3, -1.5] },
      { id: 'glass1', kind: 'glass', pos: [8.8, -1.5], holds: ['ph'] },
    ],
    wires: [
      { from: 'ph1.VCC', to: 'uno.5V', color: 'red' },
      { from: 'ph1.GND', to: 'uno.GND2', color: 'black' },
      { from: 'ph1.A', to: 'uno.A1', color: 'blue' },
    ],
    cables: [{ from: 'ph1.bnc', to: 'glass1.ph', color: '#1d1f23' }],
    nets: [
      ['uno.5V', 'ph1.VCC'],
      ['uno.GND2', 'ph1.GND'],
      ['uno.A1', 'ph1.A'],
    ],
  },
  callouts: [
    { title: 'pH board', body: 'Amplifies the probe’s tiny voltage for A1.', at: 'ph1', slot: 'tc' },
    { title: 'BNC connector', body: 'The probe’s cable twists on here.', at: 'ph1.bnc', slot: 'tl' },
    { title: 'pH probe', body: 'A glass bulb that reacts to acidity.', at: 'glass1', slot: 'tr' },
    { title: 'A1', body: 'Reads the voltage, 0 to 3 V.', at: 'uno.A1', slot: 'bl' },
  ],
  wiring: [
    { from: 'pH board signal', to: 'A1', why: 'The voltage that falls as pH rises.', at: 'uno.A1' },
    { from: 'pH board power', to: '5V and GND', why: 'The board runs on 3.3 to 5.5 V.', at: 'ph1' },
    { from: 'Probe', to: 'BNC connector', why: 'Push and twist to lock it.', at: 'ph1.bnc' },
  ],
  specs: [
    ['Sensor', 'DFRobot Gravity pH V2, SEN0161-V2'],
    ['Range', 'pH 0 to 14, ±0.1 at 25 °C'],
    ['Output', '0 to 3.0 V into A1'],
    ['Calibration', 'pH 7.0 and pH 4.0 buffer solutions'],
    ['Accepted voltages', 'pH 7: 1322 to 1678 mV. pH 4: 1854 to 2210 mV'],
    ['Library', 'DFRobot_PH'],
    ['Simulated probe', `${PROBE_OFFSET_MV} mV off at pH 7, ${PROBE_MV_PER_PH} mV per pH step`],
  ],
  code: [{ name: 'ph.ino', lang: 'cpp', source: phCode }],
  inputs: [
    { id: 'solution', kind: 'choice', label: 'Probe in', options: SOLUTIONS, initial: 7 },
    { id: 'sample', kind: 'slider', label: 'Sample pH', min: 3, max: 10, step: 0.1, initial: 6.4 },
    { id: 'enter', kind: 'hold', label: 'Send ENTERPH' },
    { id: 'cal', kind: 'hold', label: 'Send CALPH' },
    { id: 'exit', kind: 'hold', label: 'Send EXITPH' },
  ],
  tick: (ctx) => {
    const mem = ctx.mem
    if (mem.neutral === undefined) {
      mem.neutral = LIBRARY_NEUTRAL_MV
      mem.acid = LIBRARY_ACID_MV
    }
    const solution = ctx.input('solution')
    const truePh = solution < 0 ? ctx.input('sample') : solution
    const reading = Math.round((probeMillivolts(truePh) / 5000) * 1024)
    const mv = (reading / 1024) * 5000

    const pressed = (id: string) => changed(ctx, id, ctx.input(id)) && ctx.input(id) > 0
    if (pressed('enter')) {
      mem.calibrating = 1
      ctx.print('Calibration mode: dip the probe in pH 7 or pH 4 buffer, then send CALPH')
    }
    if (pressed('cal')) {
      if (!mem.calibrating) ctx.print('Send ENTERPH first')
      else if (mv > 1322 && mv < 1678) {
        mem.pendingNeutral = mv
        ctx.print(`pH 7 buffer recognised at ${mv.toFixed(0)} mV. Send EXITPH to save`)
      } else if (mv > 1854 && mv < 2210) {
        mem.pendingAcid = mv
        ctx.print(`pH 4 buffer recognised at ${mv.toFixed(0)} mV. Send EXITPH to save`)
      } else ctx.print(`${mv.toFixed(0)} mV is not a pH 7 or pH 4 buffer. Check the solution`)
    }
    if (pressed('exit')) {
      if (!mem.calibrating) ctx.print('Not in calibration mode')
      else {
        if (mem.pendingNeutral) mem.neutral = mem.pendingNeutral
        if (mem.pendingAcid) mem.acid = mem.pendingAcid
        ctx.print(mem.pendingNeutral || mem.pendingAcid ? 'Calibration saved to EEPROM' : 'Nothing calibrated, exiting')
        mem.calibrating = 0
        mem.pendingNeutral = 0
        mem.pendingAcid = 0
      }
    }

    if (every(ctx, 'p', 1) && !mem.calibrating) ctx.print(`pH ${libraryPh(mv, mem.neutral, mem.acid).toFixed(2)}`)
    return { line: lineOf(phCode, mem.calibrating ? 'ph.calibration(' : 'Serial.println(value') }
  },
}

export const UNO_LESSONS: Lesson[] = [tour, blink, button, dimmer, nightLight, parking, servo, motor, thermometer, waterMeter, phCalibration]
