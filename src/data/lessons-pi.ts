import { BOARDS } from './boards.ts'
import { changed, clamp, every, lineOf } from './sim-helpers.ts'
import type { Bench, Lesson, Vec2 } from './types.ts'

const PI_RIGHT: Bench['boards'] = [{ kind: 'pi', pos: [5.4, 0] }]
const BB_LEFT: Vec2 = [-5.4, 0]

const base = {
  board: 'pi' as const,
  consoleTitle: 'Terminal',
}

const THREE_V3 = 'GPIO pins run at 3.3 V and have no protection. Never connect 5 V to one, it can destroy the Pi for good.'

const tourCode = `# Run these in a terminal on the Pi
pinout                     # draws the board and its header
vcgencmd measure_temp      # the chip's temperature
hostname -I                # the Pi's address on your network
free -h                    # how much memory is in use`

const tour: Lesson = {
  ...base,
  id: 'meet-the-pi',
  use: 'Start here',
  title: 'Meet the Raspberry Pi',
  summary: 'A whole Linux computer on a card, with pins that reach the real world.',
  overview:
    'Unlike the Uno, the Pi runs a full operating system from a microSD card. It can browse the web, serve files and run several programs at once, and its 40-pin header also lets those programs control electronics. It needs a clean shutdown and takes a while to boot, so it is a computer first and a controller second.',
  learn: [
    'The microSD card underneath holds the whole system',
    'Power goes in over USB-C, not through the USB-A ports',
    'The 40-pin header is where the electronics connect',
  ],
  boot: ['pi@raspberrypi:~ $ pinout'],
  bench: { boards: [{ kind: 'pi', pos: [0, 0] }] },
  callouts: [
    { title: 'GPIO header', body: '40 pins for electronics, at 3.3 V.', at: 'pi@gpio', slot: 'tc' },
    { title: 'USB and Ethernet', body: 'Blue USB ports are the fast ones, the big port is gigabit.', at: 'pi@usb2', slot: 'tr' },
    { title: 'Power button', body: 'New on the Pi 5. Press it for a clean shutdown.', at: 'pi@button', slot: 'br' },
    { title: 'Micro-HDMI', body: 'Two ports for two monitors.', at: 'pi@hdmi0', slot: 'bc' },
    { title: 'USB-C power', body: '5 V at 5 A. A 3 A supply limits the USB ports.', at: 'pi@usbc', slot: 'bl' },
    { title: 'microSD slot', body: 'Underneath. It holds the operating system.', at: 'pi@sd', slot: 'tl' },
  ],
  wiring: [
    { from: 'USB-C', to: '5 V, 5 A supply', why: 'With less, USB devices are limited to 600 mA.', at: 'pi@usbc' },
    { from: 'microSD', to: 'Raspberry Pi OS', why: 'Flash it with Raspberry Pi Imager.', at: 'pi@sd' },
  ],
  specs: BOARDS.pi.specs,
  code: [{ name: 'first-look.sh', lang: 'bash', source: tourCode }],
  tick: (ctx) => {
    if (ctx.t === 0) {
      ctx.print('Raspberry Pi 5, 40-pin header')
      ctx.print('temp=46.2°C')
      ctx.print('192.168.1.42')
    }
    return { 'pi.ACT': Math.sin(ctx.t * 9) > 0.4 ? 1 : 0, line: lineOf(tourCode, 'free -h') }
  },
}

const desktopCode = `# On another computer: write the card with Raspberry Pi Imager,
# put it in the Pi, connect everything, then plug in the power last.

# Once the desktop appears, open a terminal and update:
sudo apt update
sudo apt full-upgrade -y
sudo reboot`

const BOOT_STEPS: [number, string][] = [
  [0, 'Booting...'],
  [1.5, 'Starting Raspberry Pi OS\n\nLoading kernel\nMounting microSD'],
  [3.5, 'Raspberry Pi OS\n\nFiles    Browser    Terminal\n\nReady.'],
]

const desktop: Lesson = {
  ...base,
  id: 'desktop-computer',
  use: 'As a computer',
  title: 'Set up a desktop',
  summary: 'A monitor, a keyboard, a card and a power supply make a small PC.',
  overview:
    'The simplest use of a Pi is as an everyday computer for browsing, documents and learning to code. Write the system to the card first, connect the screen and keyboard, and plug in power last so the Pi boots with everything already attached.',
  learn: [
    'Use the micro-HDMI port nearest the USB-C port first',
    'The Pi starts by itself the first time it gets power, so plug it in last',
    'Shut down with the power button or the menu, never by pulling the plug',
  ],
  boot: ['Power connected'],
  bench: {
    boards: [{ kind: 'pi', pos: [6.5, 3] }],
    modules: [
      { id: 'monitor1', kind: 'monitor', pos: [-4.5, -3.5] },
      { id: 'keyboard1', kind: 'keyboard', pos: [13.5, 6.2] },
      { id: 'psu1', kind: 'psu', pos: [3, 8.2] },
    ],
    cables: [
      { from: 'pi@hdmi0', to: 'monitor1.in', color: '#26282c' },
      { from: 'pi@usb3', to: 'keyboard1.usb', color: '#d9dadb' },
      { from: 'pi@usbc', to: 'psu1.out', color: '#f0f0ee' },
    ],
  },
  callouts: [
    { title: 'Monitor', body: 'Any HDMI screen, with a micro-HDMI cable.', at: 'monitor1.screen', slot: 'tl' },
    { title: 'Keyboard', body: 'Any USB or Bluetooth keyboard.', at: 'keyboard1.keys', slot: 'bl' },
    { title: 'Power supply', body: 'Plug in last. The Pi starts straight away.', at: 'psu1.body', slot: 'br' },
    { title: 'HDMI 0', body: 'The port nearest USB-C.', at: 'pi@hdmi0', slot: 'bc' },
    { title: 'microSD', body: 'Written beforehand with Raspberry Pi Imager.', at: 'pi@sd', slot: 'tr' },
  ],
  wiring: [
    { from: 'Micro-HDMI 0', to: 'Monitor', why: 'The primary display.', at: 'pi@hdmi0' },
    { from: 'USB port', to: 'Keyboard and mouse', why: 'Either the black or the blue ports.', at: 'pi@usb3' },
    { from: 'USB-C', to: '5 V, 5 A supply', why: 'Last, because it starts the Pi.', at: 'pi@usbc' },
  ],
  specs: [
    ['Card', '16 GB or larger, class A1'],
    ['Supply', '5 V, 5 A USB-C, the official 27 W supply'],
    ['First boot', 'Roughly one minute'],
    ['Imager', 'raspberrypi.com/software'],
  ],
  code: [{ name: 'first-boot.sh', lang: 'bash', source: desktopCode }],
  tick: (ctx) => {
    let screen = ''
    for (const [at, text] of BOOT_STEPS) if (ctx.t >= at) screen = text
    if (changed(ctx, 'stage', screen.length)) ctx.print(screen.split('\n')[0])
    return {
      monitor1: screen,
      'pi.ACT': ctx.t < 3.5 ? (Math.sin(ctx.t * 14) > 0 ? 1 : 0) : 0,
      line: lineOf(desktopCode, ctx.t < 3.5 ? '# Once the desktop' : 'sudo apt update'),
    }
  },
}

const blinkCode = `from gpiozero import LED
from time import sleep

led = LED(17)

while True:
    led.on()
    print("on")
    sleep(0.5)
    led.off()
    print("off")
    sleep(0.5)`

const blink: Lesson = {
  ...base,
  id: 'gpio-blink',
  use: 'Electronics with Python',
  title: 'Blink from Python',
  summary: 'The same LED circuit as on an Arduino, now driven by a Python program.',
  overview:
    'gpiozero is the friendly way to use the header. LED(17) means GPIO 17, the signal name, which lives on physical pin 11. Mixing up those two numbering systems is the most common beginner mistake. Here the signal is 3.3 V, so a 330 Ω resistor still gives a bright LED.',
  learn: [
    'GPIO numbers are signal names, not positions on the header',
    'Pin 1 is at the end of the header furthest from the USB ports, on the inner row',
    'The program runs under Linux, so its timing is only approximate',
  ],
  caution: THREE_V3,
  boot: ['pi@raspberrypi:~ $ python3 blink.py'],
  bench: {
    boards: PI_RIGHT,
    breadboard: BB_LEFT,
    parts: [
      { id: 'r1', kind: 'resistor', ohms: 330, pins: { a: 'h20', b: 'h25' } },
      { id: 'led1', kind: 'led', color: '#e0322b', pins: { a: 'g25', k: 'g26' } },
    ],
    wires: [
      { from: 'pi.p11', to: 'bb.j20', color: 'yellow' },
      { from: 'bb.j26', to: 'bb.-t26', color: 'black' },
      { from: 'pi.p9', to: 'bb.-t20', color: 'black' },
    ],
    nets: [
      ['pi.p11', 'r1.a'],
      ['r1.b', 'led1.a'],
      ['led1.k', 'pi.p9'],
    ],
  },
  callouts: [
    { title: 'GPIO 17', body: 'Physical pin 11, sixth along the inner row.', at: 'pi.p11', slot: 'tr' },
    { title: 'GND', body: 'Physical pin 9, right beside it.', at: 'pi.p9', slot: 'tc' },
    { title: 'LED', body: 'Long leg towards the resistor.', at: 'led1', slot: 'tl' },
    { title: '330 Ω resistor', body: 'About 4 mA, safe for a GPIO pin.', at: 'r1', slot: 'bl' },
  ],
  wiring: [
    { from: 'Pin 11, GPIO 17', to: 'Row 20', why: 'The signal.', at: 'pi.p11' },
    { from: 'Row 20', to: '330 Ω, then row 25', why: 'Limits the current.', at: 'r1' },
    { from: 'LED short leg, row 26', to: 'Ground rail', why: 'The return path.', at: 'led1.k' },
    { from: 'Pin 9, GND', to: 'Ground rail', why: 'Back to the Pi.', at: 'pi.p9' },
  ],
  specs: [
    ['Signal', '3.3 V, GPIO 17'],
    ['Resistor', '330 Ω'],
    ['Current', '(3.3 − 2) ÷ 330 ≈ 4 mA'],
        ['Library', 'gpiozero, preinstalled on Raspberry Pi OS'],
  ],
  code: [{ name: 'blink.py', lang: 'python', source: blinkCode }],
  tick: (ctx) => {
    const on = ctx.t % 1 < 0.5
    if (changed(ctx, 'on', on ? 1 : 0) || ctx.t === 0) ctx.print(on ? 'on' : 'off')
    return { led1: on ? 1 : 0, line: lineOf(blinkCode, 'sleep(0.5)', on ? 1 : 2) }
  },
}

const buttonCode = `from gpiozero import LED, Button
from signal import pause

led = LED(17)
button = Button(22)

button.when_pressed = led.on
button.when_released = led.off

pause()`

const button: Lesson = {
  ...base,
  id: 'gpio-button',
  use: 'Electronics with Python',
  title: 'React to a button',
  summary: 'Tell Python what to do when the button changes, then let it wait.',
  overview:
    'Instead of checking the button in a loop, you hand gpiozero two functions, one for pressed and one for released, then pause. This event style suits the Pi well, since it leaves the processor free for everything else it is doing.',
  learn: [
    'Button() turns on the pull-up inside the chip for you',
    'Pass led.on without brackets: you are naming it, not calling it',
    'pause() keeps the program alive to receive events',
  ],
  caution: THREE_V3,
  boot: ['pi@raspberrypi:~ $ python3 button.py'],
  bench: {
    boards: PI_RIGHT,
    breadboard: BB_LEFT,
    parts: [
      { id: 'btn1', kind: 'button', pins: { a: 'e8', a2: 'f8', b: 'e10', b2: 'f10' } },
      { id: 'r1', kind: 'resistor', ohms: 330, pins: { a: 'h18', b: 'h23' } },
      { id: 'led1', kind: 'led', color: '#2d9a55', pins: { a: 'g23', k: 'g24' } },
    ],
    wires: [
      { from: 'pi.p15', to: 'bb.j8', color: 'blue' },
      { from: 'bb.j10', to: 'bb.-t10', color: 'black' },
      { from: 'pi.p11', to: 'bb.j18', color: 'yellow' },
      { from: 'bb.j24', to: 'bb.-t25', color: 'black' },
      { from: 'pi.p9', to: 'bb.-t20', color: 'black' },
    ],
    nets: [
      ['pi.p15', 'btn1.a'],
      ['btn1.b', 'led1.k', 'pi.p9'],
      ['pi.p11', 'r1.a'],
      ['r1.b', 'led1.a'],
    ],
  },
  callouts: [
    { title: 'Button', body: 'Click it, or hold the control below.', at: 'btn1', slot: 'bl' },
    { title: 'GPIO 22', body: 'Physical pin 15, pulled up to 3.3 V.', at: 'pi.p15', slot: 'tr' },
    { title: 'GPIO 17', body: 'Physical pin 11, drives the LED.', at: 'pi.p11', slot: 'tc' },
    { title: 'LED', body: 'Follows the button.', at: 'led1', slot: 'tl' },
  ],
  wiring: [
    { from: 'Pin 15, GPIO 22', to: 'Button, row 8', why: 'The input.', at: 'pi.p15' },
    { from: 'Button, row 10', to: 'Ground rail', why: 'Pressing pulls the input low.', at: 'bb.j10' },
    { from: 'Pin 11, GPIO 17', to: '330 Ω, then LED', why: 'The output.', at: 'pi.p11' },
    { from: 'Pin 9, GND', to: 'Ground rail', why: 'Shared ground.', at: 'pi.p9' },
  ],
  specs: [
    ['Input', 'GPIO 22, internal pull-up'],
    ['Output', 'GPIO 17, about 4 mA'],
    ['Debounce', 'Optional: Button(22, bounce_time=0.05)'],
  ],
  code: [{ name: 'button.py', lang: 'python', source: buttonCode }],
  inputs: [{ id: 'btn1', kind: 'hold', label: 'Hold the button' }],
  tick: (ctx) => {
    const pressed = ctx.input('btn1') > 0
    if (changed(ctx, 'p', pressed ? 1 : 0)) ctx.print(pressed ? 'when_pressed: led.on' : 'when_released: led.off')
    return { led1: pressed ? 1 : 0, line: lineOf(buttonCode, pressed ? 'when_pressed' : 'pause()') }
  },
}

const loggerCode = `import csv, time
import board
import adafruit_bme280.basic as bme280

sensor = bme280.Adafruit_BME280_I2C(board.I2C(), address=0x76)

with open("weather.csv", "a", newline="") as f:
    log = csv.writer(f)
    while True:
        row = [time.strftime("%H:%M:%S"),
               round(sensor.temperature, 1),
               round(sensor.humidity, 1),
               round(sensor.pressure, 1)]
        log.writerow(row)
        f.flush()
        print(row)
        time.sleep(2)`

const logger: Lesson = {
  ...base,
  id: 'weather-logger',
  use: 'Electronics with Python',
  title: 'Weather data logger',
  summary: 'Read temperature, humidity and pressure, and keep every reading in a file.',
  overview:
    'This is where a Pi beats a microcontroller: the same program that reads the sensor can write a file, plot a graph or upload it. The BME280 talks I²C over two wires, and it must run at 3.3 V from the Pi. Turn I²C on first with sudo raspi-config, under Interface Options.',
  learn: [
    'i2cdetect -y 1 lists every device on the bus',
    'GPIO 2 and 3 are the Pi’s I²C pins',
    'Use the 3.3 V pin for the sensor, not 5 V',
  ],
  caution: THREE_V3,
  boot: ['pi@raspberrypi:~ $ python3 logger.py'],
  bench: {
    boards: PI_RIGHT,
    breadboard: BB_LEFT,
    parts: [{ id: 'bme1', kind: 'bme280', pins: { VIN: 'j18', GND: 'j19', SCL: 'j20', SDA: 'j21' } }],
    wires: [
      { from: 'pi.p1', to: 'bb.h18', color: 'red' },
      { from: 'pi.p9', to: 'bb.h19', color: 'black' },
      { from: 'pi.p5', to: 'bb.h20', color: 'yellow' },
      { from: 'pi.p3', to: 'bb.h21', color: 'blue' },
    ],
    nets: [
      ['pi.p1', 'bme1.VIN'],
      ['pi.p9', 'bme1.GND'],
      ['pi.p5', 'bme1.SCL'],
      ['pi.p3', 'bme1.SDA'],
    ],
  },
  callouts: [
    { title: 'BME280', body: 'Temperature, humidity and pressure.', at: 'bme1', slot: 'tl' },
    { title: 'SDA and SCL', body: 'GPIO 2 and 3, physical pins 3 and 5.', at: 'pi.p3', slot: 'tr' },
    { title: '3.3 V', body: 'Physical pin 1, at the corner of the header.', at: 'pi.p1', slot: 'tc' },
    { title: 'microSD', body: 'The log file lands on the card.', at: 'pi@sd', slot: 'br' },
  ],
  wiring: [
    { from: 'Pin 1, 3V3', to: 'VIN', why: 'Sensor power.', at: 'pi.p1' },
    { from: 'Pin 9, GND', to: 'GND', why: 'Ground.', at: 'pi.p9' },
    { from: 'Pin 5, GPIO 3', to: 'SCL', why: 'I²C clock.', at: 'pi.p5' },
    { from: 'Pin 3, GPIO 2', to: 'SDA', why: 'I²C data.', at: 'pi.p3' },
  ],
  specs: [
    ['Sensor', 'Bosch BME280'],
    ['Address', '0x76 or 0x77, check with i2cdetect'],
    ['Temperature', '±1 °C'],
    ['Humidity', '±3 %'],
    ['Install', 'pip install adafruit-circuitpython-bme280, in a virtual environment'],
    ['Pin order', 'Varies by module, check the labels on yours'],
  ],
  code: [{ name: 'logger.py', lang: 'python', source: loggerCode }],
  inputs: [{ id: 'temp', kind: 'slider', label: 'Temperature', min: -10, max: 45, step: 0.5, initial: 21.5, unit: '°C' }],
  tick: (ctx) => {
    if (every(ctx, 'log', 2)) {
      const secs = Math.floor(ctx.t)
      const stamp = `00:00:${String(secs % 60).padStart(2, '0')}`
      const temp = ctx.input('temp').toFixed(1)
      const humidity = (48 + Math.sin(ctx.t / 5) * 2).toFixed(1)
      const pressure = (1013 + Math.sin(ctx.t / 9)).toFixed(1)
      ctx.print(`['${stamp}', ${temp}, ${humidity}, ${pressure}]`)
    }
    return { 'pi.ACT': ctx.t % 2 < 0.15 ? 1 : 0, line: lineOf(loggerCode, 'time.sleep(2)') }
  },
}

const webCode = `from flask import Flask, redirect
from gpiozero import LED

app = Flask(__name__)
lamp = LED(17)

PAGE = """<h1>Lamp is {state}</h1>
<a href="/toggle">Switch it</a>"""

@app.route("/")
def home():
    return PAGE.format(state="on" if lamp.is_lit else "off")

@app.route("/toggle")
def toggle():
    lamp.toggle()
    return redirect("/")

app.run(host="0.0.0.0", port=8000)`

const web: Lesson = {
  ...base,
  id: 'web-switch',
  use: 'Connected projects',
  title: 'Web light switch',
  summary: 'Run a small web server, then switch a real lamp from your phone.',
  overview:
    'Because the Pi is a networked computer, Flask can serve a page in about twenty lines. Any phone on the same Wi-Fi opens the Pi’s address, taps the link, and the Python function behind it flips the pin. Almost every home automation idea starts from this pattern.',
  learn: [
    'host="0.0.0.0" makes the server reachable from other devices',
    'Find the address with hostname -I',
    'A URL can call a function, and that function can move hardware',
  ],
  caution: 'This has no password, so keep it on your home network and never forward the port to the internet.',
  boot: ['pi@raspberrypi:~ $ python3 switch.py', ' * Running on http://192.168.1.42:8000'],
  bench: {
    boards: PI_RIGHT,
    breadboard: BB_LEFT,
    parts: [
      { id: 'r1', kind: 'resistor', ohms: 330, pins: { a: 'h20', b: 'h25' } },
      { id: 'led1', kind: 'led', color: '#e4b21c', pins: { a: 'g25', k: 'g26' } },
    ],
    modules: [{ id: 'phone1', kind: 'phone', pos: [-12.4, 0] }],
    wires: [
      { from: 'pi.p11', to: 'bb.j20', color: 'yellow' },
      { from: 'bb.j26', to: 'bb.-t26', color: 'black' },
      { from: 'pi.p9', to: 'bb.-t20', color: 'black' },
    ],
    nets: [
      ['pi.p11', 'r1.a'],
      ['r1.b', 'led1.a'],
      ['led1.k', 'pi.p9'],
    ],
  },
  callouts: [
    { title: 'Your phone', body: 'Tap its screen, it loads /toggle.', at: 'phone1.screen', slot: 'bl' },
    { title: 'Wi-Fi', body: 'Phone and Pi on the same network.', at: 'pi@wifi', slot: 'tr' },
    { title: 'GPIO 17', body: 'The Python function flips this pin.', at: 'pi.p11', slot: 'tc' },
    { title: 'Lamp', body: 'An LED today, a relay module later.', at: 'led1', slot: 'tl' },
  ],
  wiring: [
    { from: 'Pin 11, GPIO 17', to: '330 Ω, then LED', why: 'The lamp output.', at: 'pi.p11' },
    { from: 'LED short leg', to: 'Ground rail', why: 'The return path.', at: 'led1.k' },
    { from: 'Pin 9, GND', to: 'Ground rail', why: 'Back to the Pi.', at: 'pi.p9' },
    { from: 'Phone', to: 'Port 8000 over Wi-Fi', why: 'No wire at all.', at: 'pi@wifi' },
  ],
  specs: [
    ['Server', 'Flask development server'],
    ['Address', 'http://<the Pi’s IP>:8000'],
    ['Install', 'sudo apt install python3-flask'],
    ['Lamp', 'LED and 330 Ω on GPIO 17'],
  ],
  code: [{ name: 'switch.py', lang: 'python', source: webCode }],
  inputs: [{ id: 'phone1', kind: 'toggle', label: 'Tap on the phone', on: 'Lamp on', off: 'Lamp off' }],
  tick: (ctx) => {
    const on = ctx.input('phone1') > 0
    if (changed(ctx, 'on', on ? 1 : 0)) {
      ctx.print('192.168.1.23 - "GET /toggle HTTP/1.1" 302')
      ctx.print('192.168.1.23 - "GET / HTTP/1.1" 200')
    }
    return {
      led1: on ? 1 : 0,
      phone1: `Lamp is ${on ? 'on' : 'off'}\n\nSwitch it`,
      'pi.ACT': on ? 1 : 0,
      line: lineOf(webCode, on ? 'lamp.toggle()' : 'app.run'),
    }
  },
}

const cameraCode = `from gpiozero import MotionSensor
from picamera2 import Picamera2
from time import strftime, sleep

pir = MotionSensor(4)
camera = Picamera2()
camera.start()

while True:
    pir.wait_for_motion()
    name = strftime("%H-%M-%S") + ".jpg"
    camera.capture_file(name)
    print("Saved", name)
    pir.wait_for_no_motion()
    sleep(1)`

const camera: Lesson = {
  ...base,
  id: 'motion-camera',
  use: 'Connected projects',
  title: 'Motion camera',
  summary: 'A motion sensor wakes the camera and every photo lands on the card.',
  overview:
    'The PIR sensor raises its output when something warm moves, and the camera connects through a ribbon cable to the CSI socket. A wildlife camera, a door watcher and a security system are all this same program with a different ending: mail the photo, or run it through a vision model.',
  learn: [
    'The Pi 5 needs a Standard-Mini camera cable, not the one for older Pis',
    'A PIR takes up to a minute to settle after power-on',
    'This PIR runs from 5 V but outputs 3.3 V, safe for a GPIO pin',
  ],
  caution: 'Power the Pi off before you plug in the cable. Check that your PIR outputs 3.3 V: most HC-SR501 modules do.',
  boot: ['pi@raspberrypi:~ $ python3 camera.py', 'Waiting for motion'],
  bench: {
    boards: [{ kind: 'pi', pos: [5.4, 0] }],
    modules: [
      { id: 'pir1', kind: 'pir', pos: [-2.5, -1.5] },
      { id: 'cam1', kind: 'camera', pos: [6.05, 6.6] },
    ],
    wires: [
      { from: 'pir1.VCC', to: 'pi.p2', color: 'red' },
      { from: 'pir1.OUT', to: 'pi.p7', color: 'yellow' },
      { from: 'pir1.GND', to: 'pi.p6', color: 'black' },
    ],
    cables: [{ from: 'cam1.ribbon', to: 'pi@csi', color: '#e5c07a', ribbon: true }],
    nets: [
      ['pir1.VCC', 'pi.p2'],
      ['pir1.OUT', 'pi.p7'],
      ['pir1.GND', 'pi.p6'],
    ],
  },
  callouts: [
    { title: 'PIR sensor', body: 'Sees warm things moving.', at: 'pir1.dome', slot: 'tl' },
    { title: 'Camera module', body: 'Joined by a Standard-Mini cable.', at: 'cam1.lens', slot: 'bl' },
    { title: 'CAM/DISP connectors', body: 'Two, between HDMI and Ethernet. Either works.', at: 'pi@csi', slot: 'br' },
    { title: 'GPIO 4', body: 'Physical pin 7, the PIR’s output.', at: 'pi.p7', slot: 'tr' },
  ],
  wiring: [
    { from: 'PIR VCC', to: 'Pin 2, 5V', why: 'The PIR needs 5 V to run.', at: 'pi.p2' },
    { from: 'PIR OUT', to: 'Pin 7, GPIO 4', why: 'A 3.3 V high when it sees motion.', at: 'pi.p7' },
    { from: 'PIR GND', to: 'Pin 6, GND', why: 'Ground.', at: 'pi.p6' },
    { from: 'Standard-Mini cable', to: 'CAM/DISP connector', why: 'Metal contacts face away from the flap.', at: 'pi@csi' },
  ],
  specs: [
    ['Sensor', 'HC-SR501 PIR, 5 V supply, 3.3 V output'],
    ['Detection range', 'Up to about 7 m'],
    ['Camera', 'Camera Module 2 or 3'],
    ['Library', 'picamera2, preinstalled on Raspberry Pi OS'],
  ],
  code: [{ name: 'camera.py', lang: 'python', source: cameraCode }],
  inputs: [{ id: 'motion', kind: 'hold', label: 'Wave in front of the sensor' }],
  tick: (ctx) => {
    const moving = ctx.input('motion') > 0
    if (changed(ctx, 'm', moving ? 1 : 0) && moving) {
      const secs = String(Math.floor(ctx.t) % 60).padStart(2, '0')
      ctx.print(`Saved 00-00-${secs}.jpg`)
      ctx.mem.flash = ctx.t + 0.2
    }
    return {
      cam1: ctx.t < (ctx.mem.flash ?? 0) ? 1 : 0,
      'pi.ACT': moving ? 1 : 0,
      line: lineOf(cameraCode, moving ? 'pir.wait_for_no_motion' : 'pir.wait_for_motion'),
    }
  },
}

const serverCode = `# Find the drive, then mount it at /mnt/share
lsblk
sudo mkdir -p /mnt/share
sudo mount /dev/sda1 /mnt/share

# Install Samba, the Windows-style file sharing server
sudo apt install -y samba
sudo smbpasswd -a pi

# Add this to /etc/samba/smb.conf:
#   [share]
#   path = /mnt/share
#   read only = no

sudo systemctl restart smbd`

const SERVER_STEPS: [number, string][] = [
  [0.2, 'sda      1.8T  disk'],
  [1.2, 'sda1 mounted at /mnt/share'],
  [2.2, 'Setting up samba'],
  [3.6, 'New SMB password set for pi'],
  [4.4, 'smbd restarted'],
  [5, 'Open \\\\raspberrypi\\share from any computer at home'],
]

const server: Lesson = {
  ...base,
  id: 'file-server',
  use: 'Servers and networks',
  title: 'Home file server',
  summary: 'A USB drive and an Ethernet cable make a quiet, always-on network drive.',
  overview:
    'A Pi draws far less power than a desktop PC, so it is cheap to leave on all day. With a drive on a blue USB 3 port and a wired connection, it serves files to every computer at home. The same setup also runs Pi-hole to block ads across the network, a Home Assistant hub, or a VPN back into your house.',
  learn: [
    'Use the blue USB 3 ports for drives, and a 5 A supply so they get enough power',
    'Wired Ethernet is faster and steadier than Wi-Fi here',
    'You can run all of this without a monitor, over SSH',
  ],
  boot: ['pi@raspberrypi:~ $ ssh session open'],
  bench: {
    boards: [{ kind: 'pi', pos: [-1.5, 0] }],
    modules: [
      { id: 'router1', kind: 'router', pos: [8.5, 3.6], rot: Math.PI / 2 },
      { id: 'ssd1', kind: 'ssd', pos: [8, -3.2] },
    ],
    cables: [
      { from: 'pi@ethernet', to: 'router1.lan', color: '#2f70bb' },
      { from: 'pi@usb3', to: 'ssd1.usb', color: '#26282c' },
    ],
  },
  callouts: [
    { title: 'Router', body: 'Connects the Pi to your home network.', at: 'router1.body', slot: 'br' },
    { title: 'USB drive', body: 'Holds the shared files.', at: 'ssd1.body', slot: 'tr' },
    { title: 'USB 3 port', body: 'The blue ones, 5 Gbit/s each.', at: 'pi@usb3', slot: 'bc' },
    { title: 'Ethernet', body: 'Gigabit, and steadier than Wi-Fi.', at: 'pi@ethernet', slot: 'tc' },
    { title: 'Headless', body: 'Enable SSH in Imager, no screen needed.', at: 'pi@soc', slot: 'tl' },
  ],
  wiring: [
    { from: 'Ethernet port', to: 'Router', why: 'Gives the Pi a steady address.', at: 'pi@ethernet' },
    { from: 'Blue USB 3 port', to: 'USB drive', why: 'The fastest storage connection.', at: 'pi@usb3' },
  ],
  specs: [
    ['Network limit', 'Gigabit Ethernet: at most 125 MB/s before overhead'],
        ['Software', 'Samba, in Raspberry Pi OS'],
    ['Also runs', 'Pi-hole, Home Assistant, WireGuard, Nextcloud'],
  ],
  code: [{ name: 'share.sh', lang: 'bash', source: serverCode }],
  tick: (ctx) => {
    let last = 0
    SERVER_STEPS.forEach(([at, text], i) => {
      if (ctx.t >= at) {
        last = i
        if ((ctx.mem.printed ?? -1) < i) {
          ctx.mem.printed = i
          ctx.print(text)
        }
      }
    })
    const snippets = ['lsblk', 'sudo mount', 'sudo apt install', 'sudo smbpasswd', 'systemctl restart', 'systemctl restart']
    return {
      ssd1: ctx.t > 1 ? (Math.sin(ctx.t * 13) > 0 ? 1 : 0) : 0,
      'pi.ACT': Math.sin(ctx.t * 11) > 0.2 ? 1 : 0,
      line: lineOf(serverCode, snippets[last]),
    }
  },
}

const mediaCode = `# Install Kodi from the Raspberry Pi OS repository
sudo apt update
sudo apt install -y kodi

# Start it, full screen on the first HDMI port
kodi`

const MEDIA_SCREEN = 'Kodi\n\nMovies\nTV shows\nMusic\n\nNow playing: home video'

const media: Lesson = {
  ...base,
  id: 'media-player',
  use: 'Servers and networks',
  title: 'Living-room media player',
  summary: 'Hardware 4K video decoding turns the Pi into a tiny media centre.',
  overview:
    'The Pi 5 has a 4Kp60 HEVC hardware decoder, so it plays films without working hard. Connect it to a TV, install Kodi, and point it at your files or at the file server from the last lesson. Swap the software for Batocera and the same setup is a retro games console.',
  learn: [
    'Connect the TV to HDMI 0, the port nearest USB-C',
    'A wired connection avoids stutter on large files',
    'Many TVs let their remote control Kodi through HDMI',
  ],
  boot: ['pi@raspberrypi:~ $ kodi'],
  bench: {
    boards: [{ kind: 'pi', pos: [8.5, 0] }],
    modules: [
      { id: 'monitor1', kind: 'monitor', pos: [-4.5, -2.5] },
      { id: 'psu1', kind: 'psu', pos: [5.5, 6] },
      { id: 'router1', kind: 'router', pos: [15, 3] },
    ],
    cables: [
      { from: 'pi@hdmi0', to: 'monitor1.in', color: '#26282c' },
      { from: 'pi@usbc', to: 'psu1.out', color: '#f0f0ee' },
      { from: 'pi@ethernet', to: 'router1.lan', color: '#2f70bb' },
    ],
  },
  callouts: [
    { title: 'TV', body: 'Any HDMI set, 4K supported.', at: 'monitor1.screen', slot: 'tl' },
    { title: 'HDMI 0', body: 'The micro-HDMI port nearest USB-C.', at: 'pi@hdmi0', slot: 'bc' },
    { title: 'Network', body: 'Plays files from your file server.', at: 'router1.body', slot: 'tr' },
    { title: 'Video decoder', body: 'Inside the BCM2712, handles 4Kp60 HEVC.', at: 'pi@soc', slot: 'br' },
  ],
  wiring: [
    { from: 'Micro-HDMI 0', to: 'TV', why: 'Picture and sound on one cable.', at: 'pi@hdmi0' },
    { from: 'Ethernet', to: 'Router', why: 'Streams large files without stutter.', at: 'pi@ethernet' },
    { from: 'USB-C', to: '5 V, 5 A supply', why: 'Power.', at: 'pi@usbc' },
  ],
  specs: [
    ['Video', '4Kp60 HEVC decoder'],
    ['Audio', 'Over HDMI. The Pi 5 has no headphone jack'],
    ['Software', 'Kodi, or LibreELEC for a dedicated system'],
    ['Games', 'Batocera with a USB gamepad'],
  ],
  code: [{ name: 'kodi.sh', lang: 'bash', source: mediaCode }],
  tick: (ctx) => {
    const ready = ctx.t > 1.5
    if (changed(ctx, 'r', ready ? 1 : 0)) ctx.print('Kodi started on HDMI 0')
    return {
      monitor1: ready ? MEDIA_SCREEN : 'Starting Kodi',
      'pi.ACT': Math.sin(ctx.t * 7) > 0.5 ? 1 : 0,
      line: lineOf(mediaCode, 'kodi', ready ? 2 : 1),
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
  use: 'Pi and Arduino together',
  title: 'Pi talks to Uno',
  summary: 'The Uno handles the pins, the Pi does the thinking, and USB joins them.',
  overview:
    'Each board covers the other’s weakness. The Uno has analog inputs and exact timing, while the Pi has networking, storage and Python. Over one USB cable they exchange plain text: the Uno sends knob readings, and the Pi replies when to light the LED. Many robots are built this way.',
  learn: [
    'The Uno shows up on the Pi as /dev/ttyACM0',
    'Both ends must use the same baud rate',
    'USB keeps the boards safe from the 5 V and 3.3 V mismatch',
  ],
  boot: ['Sketch uploaded to the Uno', 'pi@raspberrypi:~ $ python3 bridge.py'],
  bench: {
    boards: [
      { kind: 'pi', pos: [-6, -1.5] },
      { kind: 'uno', pos: [6, -1.5] },
    ],
    breadboard: [6, 5.2],
    parts: [{ id: 'pot1', kind: 'pot', pins: { 1: 'h15', w: 'h17', 3: 'h19' } }],
    wires: [
      { from: 'uno.5V', to: 'bb.+t10', color: 'red' },
      { from: 'uno.GND1', to: 'bb.-t11', color: 'black' },
      { from: 'bb.j15', to: 'bb.+t15', color: 'red' },
      { from: 'bb.j17', to: 'uno.A0', color: 'green' },
      { from: 'bb.j19', to: 'bb.-t19', color: 'black' },
    ],
    cables: [{ from: 'pi@usb3', to: 'uno@usb', color: '#3c4048' }],
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

export const PI_LESSONS: Lesson[] = [tour, desktop, blink, button, logger, web, camera, server, media, bridge]
