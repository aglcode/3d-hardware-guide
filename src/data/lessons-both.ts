import { changed, clamp, every, lineOf } from './sim-helpers.ts'
import type { Bench, Lesson, Vec2 } from './types.ts'

const BOTH_BOARDS: Bench['boards'] = [
  { kind: 'pi', pos: [-6, -1.5] },
  { kind: 'uno', pos: [6, -1.5] },
]
const BB_UNDER_UNO: Vec2 = [6, 5.2]
const USB_LINK: Bench['cables'] = [{ from: 'pi@usb3', to: 'uno@usb', color: '#3c4048' }]

const base = {
  board: 'both' as const,
  consoleTitle: 'Terminal',
}

const NETWORK_CAUTION = 'This has no password, so keep it on your home network and never forward the port to the internet.'

const helloPi = `import serial

uno = serial.Serial("/dev/ttyACM0", 9600, timeout=2)

while True:
    line = uno.readline().decode().strip()
    if line:
        print("The Uno says:", line)`

const helloUno = `void setup() {
  Serial.begin(9600);
}

void loop() {
  Serial.println("Hello from the Uno");
  delay(1000);
}`

const whyBoth: Lesson = {
  ...base,
  id: 'why-use-both',
  use: 'First look',
  title: 'Why use both',
  summary: 'The Uno looks after the hardware, and the Pi handles everything else.',
  overview:
    'Each board is good at what the other finds hard. The Uno runs one program with steady timing and has analog inputs. The Pi runs Linux, so it has networking, storage, cameras and Python, but no analog inputs and less predictable timing. A single USB cable joins them, powers the Uno and carries text both ways.',
  learn: [
    'Use the Uno for sensors, motors and anything timed',
    'Use the Pi for networks, files, cameras and heavy decisions',
    'USB is the safe way to connect them, because no 5 V signal reaches a GPIO pin',
  ],
  boot: ['Sketch uploaded to the Uno', 'pi@raspberrypi:~ $ python3 hello.py'],
  bench: { boards: BOTH_BOARDS, cables: USB_LINK },
  callouts: [
    { title: 'Linux and Python', body: 'The Pi runs full programs and stores files.', at: 'pi@soc', slot: 'tl' },
    { title: 'Wi-Fi', body: 'The Pi connects your project to the network.', at: 'pi@wifi', slot: 'bl' },
    { title: 'USB cable', body: 'Powers the Uno and carries text both ways.', at: 'pi@usb3', slot: 'tc' },
    { title: 'Steady timing', body: 'The Uno runs one program, with no system in the way.', at: 'uno@chip', slot: 'tr' },
    { title: 'Analog inputs', body: 'The Uno reads voltages, and the Pi has no such pins.', at: 'uno@analog', slot: 'br' },
  ],
  wiring: [
    { from: 'Pi USB port', to: 'Uno USB-B', why: 'The only connection you need to begin.', at: 'uno@usb' },
  ],
  specs: [
    ['Logic level', 'Uno 5 V, Pi 3.3 V'],
    ['Analog inputs', 'Uno 6, Pi none'],
    ['Programs', 'Uno one sketch, Pi many under Linux'],
    ['Networking', 'Uno none, Pi Ethernet and Wi-Fi'],
    ['Link', 'USB serial, /dev/ttyACM0 on the Pi'],
    ['Install', 'sudo apt install python3-serial'],
  ],
  code: [
    { name: 'hello.py', lang: 'python', source: helloPi },
    { name: 'hello.ino', lang: 'cpp', source: helloUno },
  ],
  tick: (ctx) => {
    if (every(ctx, 'p', 1)) ctx.print('The Uno says: Hello from the Uno')
    return {
      'uno.L': ctx.t % 1 < 0.1 ? 1 : 0,
      'pi.ACT': ctx.t % 1 < 0.1 ? 1 : 0,
      line: lineOf(helloPi, 'print('),
    }
  },
}

const bridgeUno = `const int KNOB = A0;

void setup() {
  pinMode(LED_BUILTIN, OUTPUT);
  Serial.begin(115200);
}

void loop() {
  Serial.println(analogRead(KNOB));
  if (Serial.available()) {
    char command = Serial.read();
    digitalWrite(LED_BUILTIN, command == '1');
  }
  delay(200);
}`

const bridgePi = `import serial

uno = serial.Serial("/dev/ttyACM0", 115200, timeout=1)

while True:
    line = uno.readline().decode().strip()
    if not line:
        continue
    reading = int(line)
    print("Knob:", reading)
    uno.write(b"1" if reading > 512 else b"0")`

const bridge: Lesson = {
  ...base,
  id: 'pi-and-uno',
  use: 'How they talk',
  title: 'Pi talks to Uno',
  summary: 'The Uno reads a knob, the Pi decides, and the answer comes back over USB.',
  overview:
    'Over one USB cable the boards exchange plain text. The Uno sends each knob reading as a line, the Python program reads it and decides, and one byte comes back to turn the LED on or off. Many robots are built this way, with the decisions on the Pi and the hardware on a microcontroller.',
  learn: [
    'The Uno shows up on the Pi as /dev/ttyACM0',
    'Both ends must use the same baud rate',
    'USB keeps the boards safe from the 5 V and 3.3 V mismatch',
  ],
  boot: ['Sketch uploaded to the Uno', 'pi@raspberrypi:~ $ python3 bridge.py'],
  bench: {
    boards: BOTH_BOARDS,
    breadboard: BB_UNDER_UNO,
    parts: [{ id: 'pot1', kind: 'pot', pins: { 1: 'h15', w: 'h17', 3: 'h19' } }],
    wires: [
      { from: 'uno.5V', to: 'bb.+t10', color: 'red' },
      { from: 'uno.GND1', to: 'bb.-t11', color: 'black' },
      { from: 'bb.j15', to: 'bb.+t15', color: 'red' },
      { from: 'bb.j17', to: 'uno.A0', color: 'green' },
      { from: 'bb.j19', to: 'bb.-t19', color: 'black' },
    ],
    cables: USB_LINK,
    nets: [
      ['uno.5V', 'pot1.1'],
      ['uno.A0', 'pot1.w'],
      ['uno.GND1', 'pot1.3'],
    ],
  },
  callouts: [
    { title: 'USB cable', body: 'Carries power and serial text.', at: 'pi@usb3', slot: 'tc' },
    { title: 'Raspberry Pi', body: 'Runs the Python decision-maker.', at: 'pi@soc', slot: 'tl' },
    { title: 'Uno', body: 'Reads the knob and drives the LED.', at: 'uno@chip', slot: 'tr' },
    { title: 'L LED', body: 'Lit when the Pi sends 1.', at: 'uno@led', slot: 'bl' },
    { title: 'Knob', body: 'Above 512, the Pi turns the LED on.', at: 'pot1', slot: 'br' },
  ],
  wiring: [
    { from: 'Pi USB port', to: 'Uno USB-B', why: 'Powers the Uno and carries the data.', at: 'uno@usb' },
    { from: 'Knob outer legs', to: 'Uno 5V and GND', why: 'Top and bottom of the divider.', at: 'uno.5V' },
    { from: 'Knob middle leg', to: 'A0', why: 'The value sent to the Pi.', at: 'uno.A0' },
  ],
  specs: [
    ['Link', 'USB serial, 115200 baud'],
    ['Port on the Pi', '/dev/ttyACM0'],
    ['Install', 'sudo apt install python3-serial'],
    ['Message', 'One number per line, one byte back'],
  ],
  code: [
    { name: 'bridge.py', lang: 'python', source: bridgePi },
    { name: 'knob.ino', lang: 'cpp', source: bridgeUno },
  ],
  inputs: [{ id: 'pot1', kind: 'slider', label: 'Knob position', min: 0, max: 1023, step: 1, initial: 300 }],
  tick: (ctx) => {
    const reading = Math.round(clamp(ctx.input('pot1'), 0, 1023))
    if (every(ctx, 'p', 0.5)) ctx.print(`Knob: ${reading}`)
    return {
      'uno.L': reading > 512 ? 1 : 0,
      'pi.ACT': ctx.t % 0.5 < 0.1 ? 1 : 0,
      line: lineOf(bridgePi, 'uno.write'),
    }
  },
}

const directPi = `# First add dtoverlay=uart0-pi5 to /boot/firmware/config.txt and reboot
import serial

uno = serial.Serial("/dev/ttyAMA0", 9600, timeout=2)
led_on = False

while True:
    line = uno.readline().decode(errors="ignore").strip()
    if line:
        print("Uno:", line)
        led_on = not led_on
        uno.write(b"1" if led_on else b"0")`

const directUno = `#include <SoftwareSerial.h>

const int RX_FROM_PI = 10;
const int TX_TO_PI = 11;
SoftwareSerial pi(RX_FROM_PI, TX_TO_PI);
unsigned long count = 0;

void setup() {
  pinMode(LED_BUILTIN, OUTPUT);
  pi.begin(9600);
}

void loop() {
  pi.println(count++);
  delay(1000);
  while (pi.available()) {
    digitalWrite(LED_BUILTIN, pi.read() == '1');
  }
}`

const direct: Lesson = {
  ...base,
  id: 'wire-them-directly',
  use: 'How they talk',
  title: 'Wire them directly',
  summary: 'Join the boards with jumper wires, with two resistors protecting the Pi.',
  overview:
    'USB is not the only route. Two signal wires and a shared ground make a direct serial link, known as UART. The catch is voltage: the Uno sends 5 V, and a Pi GPIO pin only takes 3.3 V. Two resistors form a divider that lowers the signal to about 3.3 V. The other direction needs no resistors, because the Uno reads anything above 3 V as HIGH.',
  learn: [
    'A divider takes 5 V down to 5 x 2k ÷ (1k + 2k) ≈ 3.3 V',
    'Both boards must share a ground, or the signals mean nothing',
    'On a Pi 5 use /dev/ttyAMA0, because /dev/serial0 points at the debug header',
    'SoftwareSerial keeps D0 and D1 free for USB uploads',
  ],
  caution:
    'A wrong wire here can permanently damage the Pi. Never connect an Uno output straight to a GPIO pin. Build the divider first, unplug both boards while wiring, and check it with a multimeter if you can. A level-shifter module is the safer choice for anything permanent.',
  boot: ['Sketch uploaded to the Uno', 'pi@raspberrypi:~ $ python3 direct.py'],
  bench: {
    boards: BOTH_BOARDS,
    breadboard: [0, 7.4],
    parts: [
      { id: 'r1', kind: 'resistor', ohms: 1000, pins: { a: 'h5', b: 'h10' } },
      { id: 'r2', kind: 'resistor', ohms: 2000, pins: { a: 'g10', b: 'g15' } },
    ],
    wires: [
      { from: 'uno.D11', to: 'bb.j5', color: 'yellow' },
      { from: 'pi.p10', to: 'bb.j10', color: 'green' },
      { from: 'bb.j15', to: 'bb.-t15', color: 'black' },
      { from: 'uno.GND1', to: 'bb.-t3', color: 'black' },
      { from: 'pi.p9', to: 'bb.-t4', color: 'black' },
      { from: 'pi.p8', to: 'uno.D10', color: 'blue' },
    ],
    cables: USB_LINK,
    nets: [
      ['uno.D11', 'r1.a'],
      ['r1.b', 'r2.a', 'pi.p10'],
      ['r2.b', 'uno.GND1', 'pi.p9'],
      ['pi.p8', 'uno.D10'],
    ],
    safeLinks: [['pi.p8', 'uno.D10']],
  },
  callouts: [
    { title: 'GPIO 15, pin 10', body: 'The Pi listens here, and sees about 3.3 V.', at: 'pi.p10', slot: 'tl' },
    { title: 'GPIO 14, pin 8', body: 'The Pi talks here, straight into D10.', at: 'pi.p8', slot: 'tc' },
    { title: 'D11', body: 'The Uno talks here, at 5 V.', at: 'uno.D11', slot: 'tr' },
    { title: '1 kΩ and 2 kΩ', body: 'The divider that protects the Pi.', at: 'r2', slot: 'bl' },
    { title: 'Shared ground', body: 'Both boards join on this rail.', at: 'bb.-t4', slot: 'br' },
  ],
  wiring: [
    { from: 'Uno D11, TX', to: '1 kΩ, then row 10', why: 'The top of the divider.', at: 'uno.D11' },
    { from: 'Row 10', to: 'Pi pin 10, GPIO 15, RX', why: 'The lowered signal, about 3.3 V.', at: 'pi.p10' },
    { from: 'Row 10', to: '2 kΩ, then ground rail', why: 'The bottom of the divider.', at: 'r2' },
    { from: 'Pi pin 8, GPIO 14, TX', to: 'Uno D10, RX', why: 'Safe direct: 3.3 V out, and the Uno reads 3 V or more as HIGH.', at: 'pi.p8' },
    { from: 'Uno GND and Pi pin 9', to: 'Ground rail', why: 'The shared reference for both signals.', at: 'pi.p9' },
    { from: 'Pi USB port', to: 'Uno USB-B', why: 'Power only in this lesson.', at: 'uno@usb' },
  ],
  specs: [
    ['Divider output', '5 V x 2 kΩ ÷ 3 kΩ ≈ 3.3 V'],
    ['Uno input HIGH', 'At least 0.6 x 5 V = 3.0 V'],
    ['Margin', 'Pi 3.3 V against the Uno’s 3.0 V: small, so keep wires short'],
    ['Baud rate', '9600, comfortable for SoftwareSerial'],
    ['Pi 5 setup', 'dtoverlay=uart0-pi5 in /boot/firmware/config.txt'],
    ['Pi 5 device', '/dev/ttyAMA0'],
    ['Serial settings', 'Turn the serial port on and the console off in raspi-config'],
  ],
  code: [
    { name: 'direct.py', lang: 'python', source: directPi },
    { name: 'direct.ino', lang: 'cpp', source: directUno },
  ],
  tick: (ctx) => {
    const count = Math.floor(ctx.t)
    if (changed(ctx, 'c', count) || ctx.t === 0) ctx.print(`Uno: ${count}`)
    return {
      'uno.L': count % 2 === 0 ? 1 : 0,
      'pi.ACT': ctx.t % 1 < 0.1 ? 1 : 0,
      line: lineOf(directPi, 'uno.write'),
    }
  },
}

const monitorPi = `from flask import Flask
import serial

app = Flask(__name__)
uno = serial.Serial("/dev/ttyACM0", 9600, timeout=2)

@app.route("/")
def home():
    uno.reset_input_buffer()
    uno.readline()  # the first line may be cut short
    celsius = uno.readline().decode().strip()
    return f"<h1>Room: {celsius} °C</h1>"

app.run(host="0.0.0.0", port=8000)`

const monitorUno = `void setup() {
  Serial.begin(9600);
}

void loop() {
  float volts = analogRead(A0) * 5.0 / 1023.0;
  float celsius = (volts - 0.5) * 100.0;
  Serial.println(celsius, 1);
  delay(500);
}`

const monitor: Lesson = {
  ...base,
  id: 'room-monitor',
  use: 'Projects',
  title: 'Room monitor',
  summary: 'The Uno reads the temperature, and the Pi serves it to your phone.',
  overview:
    'The Pi has no analog inputs, so it cannot read a TMP36 by itself. The Uno can, and it sends each reading over USB as a line of text. A small Flask server on the Pi reads the latest line whenever a page is requested, so any phone on your network can check the room. The same pattern works for any sensor the Uno can read.',
  learn: [
    'Each board does the part it is good at',
    'Skip the first line after clearing the buffer, because it may be incomplete',
    'Opening the serial port restarts the Uno, so the first reading takes a moment',
  ],
  caution: NETWORK_CAUTION,
  boot: ['Sketch uploaded to the Uno', 'pi@raspberrypi:~ $ python3 monitor.py', ' * Running on http://192.168.1.42:8000'],
  bench: {
    boards: BOTH_BOARDS,
    breadboard: BB_UNDER_UNO,
    parts: [{ id: 'tmp1', kind: 'tmp36', pins: { vs: 'g15', out: 'g16', gnd: 'g17' } }],
    modules: [{ id: 'phone1', kind: 'phone', pos: [-13.4, -1.5], text: 'Room\n\nOpen the page' }],
    wires: [
      { from: 'uno.5V', to: 'bb.+t10', color: 'red' },
      { from: 'uno.GND1', to: 'bb.-t11', color: 'black' },
      { from: 'bb.j15', to: 'bb.+t15', color: 'red' },
      { from: 'bb.j16', to: 'uno.A0', color: 'green' },
      { from: 'bb.j17', to: 'bb.-t17', color: 'black' },
    ],
    cables: USB_LINK,
    nets: [
      ['uno.5V', 'tmp1.vs'],
      ['uno.A0', 'tmp1.out'],
      ['uno.GND1', 'tmp1.gnd'],
    ],
  },
  callouts: [
    { title: 'Your phone', body: 'Opens the Pi’s address over Wi-Fi.', at: 'phone1.screen', slot: 'tl' },
    { title: 'Flask on the Pi', body: 'Answers with the latest reading.', at: 'pi@soc', slot: 'bl' },
    { title: 'USB cable', body: 'A new reading every half second.', at: 'pi@usb3', slot: 'tc' },
    { title: 'A0', body: 'The Uno measures the sensor here.', at: 'uno.A0', slot: 'tr' },
    { title: 'TMP36', body: '10 mV per degree, 0.5 V at 0 °C.', at: 'tmp1', slot: 'br' },
  ],
  wiring: [
    { from: 'TMP36 +Vs', to: 'Uno 5V, by the red rail', why: 'Sensor power.', at: 'tmp1.vs' },
    { from: 'TMP36 output', to: 'Uno A0', why: 'The temperature voltage.', at: 'uno.A0' },
    { from: 'TMP36 GND', to: 'Uno GND, by the blue rail', why: 'Ground.', at: 'tmp1.gnd' },
    { from: 'Pi USB port', to: 'Uno USB-B', why: 'Power and the readings.', at: 'uno@usb' },
    { from: 'Phone', to: 'Port 8000 over Wi-Fi', why: 'No wire at all.', at: 'pi@wifi' },
  ],
  specs: [
    ['Sensor', 'TMP36, −40 to 125 °C'],
    ['Conversion', '(volts − 0.5) x 100'],
    ['Link', 'USB serial, 9600 baud'],
    ['Address', 'http://<the Pi’s IP>:8000'],
    ['Install', 'sudo apt install python3-flask python3-serial'],
  ],
  code: [
    { name: 'monitor.py', lang: 'python', source: monitorPi },
    { name: 'monitor.ino', lang: 'cpp', source: monitorUno },
  ],
  inputs: [{ id: 'temp', kind: 'slider', label: 'Room temperature', min: -10, max: 45, step: 0.5, initial: 22, unit: '°C' }],
  tick: (ctx) => {
    const celsius = ctx.input('temp').toFixed(1)
    if (every(ctx, 'p', 2)) ctx.print('192.168.1.23 - "GET / HTTP/1.1" 200')
    return {
      phone1: `Room\n\n${celsius} °C`,
      'uno.L': ctx.t % 0.5 < 0.08 ? 1 : 0,
      'pi.ACT': ctx.t % 2 < 0.15 ? 1 : 0,
      line: lineOf(monitorPi, 'return f"'),
    }
  },
}

const servoPi = `from flask import Flask
from time import sleep
import serial

app = Flask(__name__)
uno = serial.Serial("/dev/ttyACM0", 9600, timeout=1)
sleep(2)  # opening the port restarts the Uno

PAGE = """<a href="/angle/0">Left</a>
<a href="/angle/90">Centre</a>
<a href="/angle/180">Right</a>"""

@app.route("/")
def home():
    return PAGE

@app.route("/angle/<int:angle>")
def set_angle(angle):
    uno.write(f"{angle}\\n".encode())
    return PAGE

app.run(host="0.0.0.0", port=8000)`

const servoUno = `#include <Servo.h>

Servo arm;

void setup() {
  arm.attach(9);
  Serial.begin(9600);
}

void loop() {
  if (Serial.available()) {
    int angle = Serial.parseInt();
    if (Serial.read() == '\\n') {
      arm.write(constrain(angle, 0, 180));
    }
  }
}`

const remoteServo: Lesson = {
  ...base,
  id: 'phone-servo',
  use: 'Projects',
  title: 'Phone-controlled servo',
  summary: 'Tap a link on your phone, and the Pi tells the Uno where to move the arm.',
  overview:
    'A tap on your phone travels the whole chain: Wi-Fi to the Pi, a Flask route in Python, a line of text over USB, then a pulse from the Uno to the servo. The Uno keeps generating steady pulses while the Pi handles the network, which is exactly why the two make a good pair. Swap the servo for a motor or a relay and the rest stays the same.',
  learn: [
    'Each link in the chain only needs to understand the next one',
    'Wait after opening the port, because the Uno restarts',
    'End each message with a newline so the Uno knows it is complete',
  ],
  caution: `${NETWORK_CAUTION} A stalled servo can also pull more than USB supplies, so for heavier loads give the servo its own 5 V supply and join the grounds.`,
  boot: ['Sketch uploaded to the Uno', 'pi@raspberrypi:~ $ python3 servo.py', ' * Running on http://192.168.1.42:8000'],
  bench: {
    boards: BOTH_BOARDS,
    breadboard: BB_UNDER_UNO,
    modules: [
      { id: 'phone1', kind: 'phone', pos: [-13.4, -1.5], text: 'Servo\n\nOpen the page' },
      { id: 'servo1', kind: 'servo', pos: [13, 4.6] },
    ],
    wires: [
      { from: 'uno.5V', to: 'bb.+t10', color: 'red' },
      { from: 'uno.GND1', to: 'bb.-t11', color: 'black' },
      { from: 'servo1.VCC', to: 'bb.+t25', color: 'red' },
      { from: 'servo1.GND', to: 'bb.-t26', color: 'black' },
      { from: 'servo1.SIG', to: 'uno.D9', color: 'orange' },
    ],
    cables: USB_LINK,
    nets: [
      ['uno.5V', 'servo1.VCC'],
      ['uno.GND1', 'servo1.GND'],
      ['uno.D9', 'servo1.SIG'],
    ],
  },
  callouts: [
    { title: 'Your phone', body: 'Each link asks for an angle.', at: 'phone1.screen', slot: 'tl' },
    { title: 'Flask on the Pi', body: 'Turns the request into a line of text.', at: 'pi@soc', slot: 'bl' },
    { title: 'USB cable', body: 'Carries the angle to the Uno.', at: 'pi@usb3', slot: 'tc' },
    { title: 'Pin ~9', body: 'Sends the position pulses.', at: 'uno.D9', slot: 'tr' },
    { title: 'Servo', body: 'Moves to whatever angle it is told.', at: 'servo1.horn', slot: 'br' },
  ],
  wiring: [
    { from: 'Servo red', to: 'Uno 5V, by the red rail', why: 'Motor power.', at: 'servo1.VCC' },
    { from: 'Servo brown', to: 'Uno GND, by the blue rail', why: 'Ground.', at: 'servo1.GND' },
    { from: 'Servo orange', to: 'Uno D9', why: 'The position signal.', at: 'uno.D9' },
    { from: 'Pi USB port', to: 'Uno USB-B', why: 'Power and the angle commands.', at: 'uno@usb' },
    { from: 'Phone', to: 'Port 8000 over Wi-Fi', why: 'No wire at all.', at: 'pi@wifi' },
  ],
  specs: [
    ['Servo', 'SG90 micro, 180° travel'],
    ['Message', 'The angle as text, ending in a newline'],
    ['Link', 'USB serial, 9600 baud'],
    ['Address', 'http://<the Pi’s IP>:8000'],
    ['Install', 'sudo apt install python3-flask python3-serial'],
  ],
  code: [
    { name: 'servo.py', lang: 'python', source: servoPi },
    { name: 'servo.ino', lang: 'cpp', source: servoUno },
  ],
  inputs: [{ id: 'angle', kind: 'slider', label: 'Angle from the phone', min: 0, max: 180, step: 1, initial: 90, unit: '°' }],
  tick: (ctx) => {
    const target = ctx.input('angle')
    if (changed(ctx, 'a', target)) ctx.print(`192.168.1.23 - "GET /angle/${target} HTTP/1.1" 200`)
    const current = ctx.mem.angle ?? 90
    const angle = current + clamp(target - current, -6, 6)
    ctx.mem.angle = angle
    return {
      servo1: angle,
      phone1: `Servo\n\n${target}°`,
      'uno.L': angle !== target ? 1 : 0,
      line: lineOf(servoPi, 'uno.write'),
    }
  },
}

const cameraPi = `from time import strftime
from picamera2 import Picamera2
import serial

uno = serial.Serial("/dev/ttyACM0", 9600, timeout=1)
camera = Picamera2()
camera.start()

while True:
    if uno.readline().decode().strip() == "NEAR":
        name = strftime("%H-%M-%S") + ".jpg"
        camera.capture_file(name)
        print("Saved", name)`

const cameraUno = `const int TRIG = 7;
const int ECHO = 6;
const int NEAR_CM = 30;
bool wasNear = false;

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
  bool near = cm > 0 && cm < NEAR_CM;

  if (near && !wasNear) {
    Serial.println("NEAR");
  }
  wasNear = near;
  delay(100);
}`

const camera: Lesson = {
  ...base,
  id: 'distance-camera',
  use: 'Projects',
  title: 'Distance-triggered camera',
  summary: 'The Uno watches the distance, and the Pi takes the photo.',
  overview:
    'The HC-SR04’s echo pin outputs 5 V, which makes it a poor match for a Pi GPIO pin. It is a perfect match for the Uno, which times the echo precisely. When something comes within 30 cm, the Uno sends one word over USB, and the Pi saves a photo to its card. A doorway counter or a bird feeder camera works the same way.',
  learn: [
    'Letting the Uno run the sensor keeps its 5 V signal away from the Pi',
    'Send a message only when the state changes, so you get one photo per visit',
    'The Pi 5 needs a Standard-Mini camera cable',
  ],
  caution: 'Power the Pi off before you plug in the camera cable.',
  boot: ['Sketch uploaded to the Uno', 'pi@raspberrypi:~ $ python3 trigger.py', 'Waiting for the Uno'],
  bench: {
    boards: BOTH_BOARDS,
    breadboard: BB_UNDER_UNO,
    parts: [{ id: 'sonar1', kind: 'hcsr04', pins: { VCC: 'j9', TRIG: 'j10', ECHO: 'j11', GND: 'j12' } }],
    modules: [
      { id: 'cam1', kind: 'camera', pos: [-5.35, 5] },
      { id: 'car1', kind: 'car', pos: [6, 10.6] },
    ],
    wires: [
      { from: 'uno.5V', to: 'bb.+t2', color: 'red' },
      { from: 'uno.GND1', to: 'bb.-t3', color: 'black' },
      { from: 'bb.h9', to: 'bb.+t9', color: 'red' },
      { from: 'bb.h10', to: 'uno.D7', color: 'blue' },
      { from: 'bb.h11', to: 'uno.D6', color: 'green' },
      { from: 'bb.h12', to: 'bb.-t13', color: 'black' },
    ],
    cables: [...(USB_LINK ?? []), { from: 'cam1.ribbon', to: 'pi@csi', color: '#e5c07a', ribbon: true }],
    nets: [
      ['uno.5V', 'sonar1.VCC'],
      ['uno.D7', 'sonar1.TRIG'],
      ['uno.D6', 'sonar1.ECHO'],
      ['uno.GND1', 'sonar1.GND'],
    ],
  },
  callouts: [
    { title: 'Camera module', body: 'Takes the photo when the Pi says so.', at: 'cam1.lens', slot: 'bl' },
    { title: 'Raspberry Pi', body: 'Listens for the word and saves the photo.', at: 'pi@soc', slot: 'tl' },
    { title: 'USB cable', body: 'Carries one word: NEAR.', at: 'pi@usb3', slot: 'tc' },
    { title: 'Pins 7 and 6', body: 'The Uno times the echo.', at: 'uno.D7', slot: 'tr' },
    { title: 'HC-SR04', body: 'Runs on 5 V, so it stays on the Uno.', at: 'sonar1', slot: 'br' },
  ],
  wiring: [
    { from: 'HC-SR04 VCC and GND', to: 'Uno 5V and GND', why: 'Sensor power, by the rails.', at: 'sonar1.VCC' },
    { from: 'HC-SR04 TRIG', to: 'Uno D7', why: 'Starts each measurement.', at: 'uno.D7' },
    { from: 'HC-SR04 ECHO', to: 'Uno D6', why: 'A 5 V pulse, safe here but not on the Pi.', at: 'uno.D6' },
    { from: 'Camera', to: 'CAM/DISP connector', why: 'Standard-Mini cable, metal contacts away from the flap.', at: 'pi@csi' },
    { from: 'Pi USB port', to: 'Uno USB-B', why: 'Power and the trigger message.', at: 'uno@usb' },
  ],
  specs: [
    ['Sensor', 'HC-SR04, 5 V, 2 cm to 4 m'],
    ['Trigger distance', 'Under 30 cm'],
    ['Message', 'NEAR, once per visit'],
    ['Camera', 'Camera Module 2 or 3'],
    ['Install', 'sudo apt install python3-serial. picamera2 is preinstalled'],
  ],
  code: [
    { name: 'trigger.py', lang: 'python', source: cameraPi },
    { name: 'trigger.ino', lang: 'cpp', source: cameraUno },
  ],
  inputs: [{ id: 'car1', kind: 'slider', label: 'Distance to car', min: 5, max: 100, step: 1, initial: 60, unit: 'cm' }],
  tick: (ctx) => {
    const near = ctx.input('car1') < 30
    if (changed(ctx, 'n', near ? 1 : 0) && near) {
      const secs = String(Math.floor(ctx.t) % 60).padStart(2, '0')
      ctx.print(`Saved 00-00-${secs}.jpg`)
      ctx.mem.flash = ctx.t + 0.25
    }
    const flashing = ctx.t < (ctx.mem.flash ?? 0)
    return {
      cam1: flashing ? 1 : 0,
      'uno.L': near ? 1 : 0,
      'pi.ACT': flashing ? 1 : 0,
      line: lineOf(cameraPi, flashing ? 'camera.capture_file' : 'uno.readline'),
    }
  },
}

export const BOTH_LESSONS: Lesson[] = [whyBoth, bridge, direct, monitor, remoteServo, camera]
