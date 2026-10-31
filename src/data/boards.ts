import type { BoardKind } from './types.ts'

/**
 * Positions in millimetres from the board's lower left corner.
 * docs/board-references.md lists the source and confidence of every number here and in scene/Boards.tsx.
 */
const DIGITAL_Y = 50.8
const ANALOG_Y = 2.54

const digitalX = [63.5, 60.96, 58.42, 55.88, 53.34, 50.8, 48.26, 45.72, 41.656, 39.116, 36.576, 34.036, 31.496, 28.956]

export const UNO_SIZE = { w: 6.86, h: 5.34 }
export const PI_SIZE = { w: 8.5, h: 5.6 }

export const UNO_PINS: Record<string, [number, number]> = {
  ...Object.fromEntries(digitalX.map((x, i) => [`D${i}`, [x, DIGITAL_Y]])),
  GND3: [26.416, DIGITAL_Y],
  AREF: [23.876, DIGITAL_Y],
  SDA: [21.336, DIGITAL_Y],
  SCL: [18.796, DIGITAL_Y],
  NC: [27.94, ANALOG_Y],
  IOREF: [30.48, ANALOG_Y],
  RESET: [33.02, ANALOG_Y],
  '3V3': [35.56, ANALOG_Y],
  '5V': [38.1, ANALOG_Y],
  GND1: [40.64, ANALOG_Y],
  GND2: [43.18, ANALOG_Y],
  VIN: [45.72, ANALOG_Y],
  A0: [50.8, ANALOG_Y],
  A1: [53.34, ANALOG_Y],
  A2: [55.88, ANALOG_Y],
  A3: [58.42, ANALOG_Y],
  A4: [60.96, ANALOG_Y],
  A5: [63.5, ANALOG_Y],
}

export const UNO_ANCHORS: Record<string, [number, number, number]> = {
  usb: [-6, 38.3, 0.55],
  jack: [-2.4, 7.6, 0.55],
  chip: [42.3, 15.9, 0.12],
  usbchip: [20, 34.7, 0.1],
  reset: [6.1, 49.8, 0.35],
  led: [28, 43, 0.12],
  digital: [42, DIGITAL_Y, 0.9],
  analog: [57, ANALOG_Y, 0.9],
  power: [37, ANALOG_Y, 0.9],
  icsp: [65, 28, 0.9],
  icsp1: [18.5, 46, 0.9],
  crystal: [20, 26.3, 0.35],
}

/** Physical header position to signal name on the Raspberry Pi's 40-pin header. */
export const PI_HEADER: string[] = [
  '3V3', '5V', 'GPIO2', '5V', 'GPIO3', 'GND', 'GPIO4', 'GPIO14', 'GND', 'GPIO15',
  'GPIO17', 'GPIO18', 'GPIO27', 'GND', 'GPIO22', 'GPIO23', '3V3', 'GPIO24', 'GPIO10', 'GND',
  'GPIO9', 'GPIO25', 'GPIO11', 'GPIO8', 'GND', 'GPIO7', 'ID_SD', 'ID_SC', 'GPIO5', 'GND',
  'GPIO6', 'GPIO12', 'GPIO13', 'GND', 'GPIO19', 'GPIO16', 'GPIO26', 'GPIO20', 'GND', 'GPIO21',
]

const PI_HEADER_X0 = 8.37
const PI_PITCH = 2.54

/** Pin 1 is the square pad on the Pi 5 drawing: the left end of the inner row. */
export function piPinMm(physical: number): [number, number] {
  const column = Math.floor((physical - 1) / 2)
  return [PI_HEADER_X0 + column * PI_PITCH, physical % 2 === 1 ? 51.23 : 53.77]
}

export const PI_ANCHORS: Record<string, [number, number, number]> = {
  usbc: [11.2, -2, 0.16],
  hdmi0: [25.8, -2, 0.17],
  hdmi1: [39.2, -2, 0.17],
  ethernet: [88.4, 10.2, 0.7],
  usb3: [88.2, 29.1, 0.8],
  usb2: [88.2, 47, 0.8],
  soc: [33.5, 22.7, 0.3],
  rp1: [58.7, 35, 0.12],
  ram: [33.5, 39, 0.12],
  csi: [49, 9, 0.3],
  gpio: [32.5, 52.5, 0.9],
  wifi: [12.6, 42.5, 0.25],
  sd: [-1.5, 28, -0.2],
  button: [1, 13.3, 0.15],
  pcie: [2.8, 30, 0.2],
  fan: [66.5, 52, 0.25],
  rtc: [19.5, 4.7, 0.2],
  uart: [33, 4, 0.2],
  led: [3, 17, 0.08],
}

export type PinTone = 'power' | 'ground' | 'signal' | 'bus'

export function pinTone(name: string): PinTone {
  if (name === 'GND' || name.startsWith('GND')) return 'ground'
  if (['5V', '3V3', 'VIN', 'IOREF', 'AREF'].includes(name)) return 'power'
  if (['GPIO2', 'GPIO3', 'SDA', 'SCL', 'A4', 'A5', 'GPIO14', 'GPIO15', 'D0', 'D1'].includes(name)) return 'bus'
  return 'signal'
}

export type BoardInfo = {
  kind: BoardKind
  name: string
  short: string
  specs: [string, string][]
}

export const BOARDS: Record<BoardKind, BoardInfo> = {
  uno: {
    kind: 'uno',
    name: 'Arduino Uno Rev3 SMD',
    short: 'Arduino Uno',
    specs: [
      ['Microcontroller', 'ATmega328P, 8-bit, 16 MHz'],
      ['Memory', '32 KB flash, 2 KB SRAM, 1 KB EEPROM'],
      ['Logic level', '5 V'],
      ['Digital pins', '14, six with PWM (~3, 5, 6, 9, 10, 11)'],
      ['Analog inputs', '6, 10-bit (0 to 1023)'],
      ['Current per pin', '20 mA maximum'],
      ['3.3 V pin', '50 mA maximum'],
      ['Power', 'USB-B, or the jack or VIN pin'],
      ['Size', '68.6 x 53.4 mm'],
    ],
  },
  pi: {
    kind: 'pi',
    name: 'Raspberry Pi 5',
    short: 'Raspberry Pi 5',
    specs: [
      ['Processor', 'BCM2712, four Cortex-A76 cores, 2.4 GHz'],
      ['Memory', '1, 2, 4, 8 or 16 GB LPDDR4X'],
      ['I/O controller', 'RP1 southbridge'],
      ['Logic level', '3.3 V, and the pins are not 5 V tolerant'],
      ['GPIO', 'Standard 40-pin header'],
      ['Network', 'Gigabit Ethernet, dual-band Wi-Fi, Bluetooth 5.0'],
      ['USB', 'Two USB 3.0, two USB 2.0'],
      ['Expansion', 'PCIe 2.0 x1, two 4-lane camera or display connectors'],
      ['Extras', 'Power button, real-time clock with battery connector'],
      ['Power', '5 V, 5 A over USB-C'],
      ['Size', '85 x 56 mm'],
    ],
  },
}

export const UNO_PIN_GROUPS: { title: string; pins: [string, string][] }[] = [
  {
    title: 'Digital',
    pins: [
      ['D0, D1', 'Serial RX and TX. Shared with USB, so leave them free while uploading.'],
      ['D2, D3', 'External interrupts. D3 also has PWM.'],
      ['D3, 5, 6, 9, 10, 11', 'PWM output, marked ~ on the board.'],
      ['D10 to D13', 'SPI bus: SS, MOSI, MISO, SCK.'],
      ['D13', 'Also drives the on-board L LED.'],
    ],
  },
  {
    title: 'Analog',
    pins: [
      ['A0 to A5', '10-bit analog inputs. They also work as digital pins.'],
      ['A4, A5', 'I²C bus: SDA and SCL, same signals as the pins beside AREF.'],
    ],
  },
  {
    title: 'Power',
    pins: [
      ['5V', 'Regulated 5 V output for small circuits.'],
      ['3V3', '3.3 V output, 50 mA at most.'],
      ['GND', 'Ground. Three pins, all joined.'],
      ['VIN', 'Raw input, the same supply as the jack.'],
      ['RESET', 'Pull low to restart the sketch.'],
    ],
  },
]
