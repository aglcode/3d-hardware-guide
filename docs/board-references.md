# Board references

Where the 3D models' numbers come from, and how far to trust each one.

## Sources

| Short name | Document |
| --- | --- |
| Pi 5 drawing | [Raspberry Pi 5 mechanical drawing](https://datasheets.raspberrypi.com/rpi5/raspberry-pi-5-mechanical-drawing.pdf) |
| Pi 5 brief | [Raspberry Pi 5 product brief](https://datasheets.raspberrypi.com/rpi5/raspberry-pi-5-product-brief.pdf) |
| Pi docs | [raspberrypi/documentation](https://github.com/raspberrypi/documentation) on GitHub: `power-supplies`, `power-button`, `gpio-on-raspberry-pi`, `accessories/camera/install` |
| Uno SMD pinout | [Arduino Uno Rev3 SMD full pinout](https://docs.arduino.cc/resources/pinouts/A000073-full-pinout.pdf) |
| Uno datasheet | [Arduino Uno R3 datasheet](https://docs.arduino.cc/resources/datasheets/A000066-datasheet.pdf), for the parts list only |
| Photos | The two product photos supplied for this project, used for colour and part appearance only |

The Pi 5 drawing itself says its dimensions are approximate and for reference only, and that not all
components are shown.

## How each value was obtained

**Dimensioned** means the number is printed on the source. **Scaled** means it was measured from a drawn
part on the source using the drawing's own scale, good to about 1 mm. **From photo** means placed or
shaped by eye. **Standard** means a fixed electrical standard.

### Raspberry Pi 5

| Item | Value (mm, from lower-left corner) | Status |
| --- | --- | --- |
| Board | 85 x 56 | Dimensioned |
| Mounting holes | x 3.5 and 61.5, y 3.5 and 52.5 | Dimensioned |
| GPIO header centre | x 32.5 (3.5 + 29) | Dimensioned |
| GPIO header row positions | y 51.23 and 53.77, x from 8.37 | Standard 2.54 pitch about that centre, y scaled |
| USB-C, HDMI 0, HDMI 1 centres | x 11.2, 25.8, 39.2 | Dimensioned |
| Ethernet, USB 3, USB 2 centres | y 10.2, 29.1, 47 | Dimensioned for position. Which stack is USB 3 is from photo |
| Port overhang | 3 past the board edge | Dimensioned |
| Connector heights | USB-C 3.2, micro-HDMI 3.4 | Dimensioned |
| USB and Ethernet heights | 16 and 13.7 | Scaled from side view |
| SoC shield, RAM, RP1, Wi-Fi can, PMIC | See `src/scene/Boards.tsx` | Scaled |
| CAM/DISP connectors, PoE header, PCIe, microSD | See `src/scene/Boards.tsx` | Scaled |
| FAN, RTC battery and UART connectors | See `src/scene/Boards.tsx` | Scaled for position, identified from photo |
| Power button | y 13.3 at the left edge | y dimensioned, identifying this mark as the button is an inference |
| Status LEDs | Near the power button | From photo, approximate |
| Small passives, solder details | Not modelled | Not shown on source |

### Arduino Uno Rev3 SMD

Arduino's pinout is an illustration, not a dimensioned drawing, so everything scaled from it is less
certain than the Pi 5 values. The header and mounting hole values were written first from the standard
Uno layout, then compared with the pinout: all four mounting holes and the nine header pins sampled
(D0, D7, D8, SCL, the digital GND, NC, VIN, A0 and A5) landed within about 0.3 mm. The other pins follow
from the 2.54 mm pitch. The Uno datasheet's outline page could not be rendered here and was not used for
measurements.

| Item | Value (mm, from corner by the USB end, power-header side) | Status |
| --- | --- | --- |
| Board | 68.6 x 53.4 | Scaled, agrees with the standard Uno outline |
| Header pins | See `UNO_PINS` in `src/data/boards.ts` | Standard layout, sampled against the pinout |
| Mounting holes | (14, 2.54), (15.3, 50.8), (66.1, 7.6), (66.1, 35.6) | Standard layout, checked against the pinout |
| USB-B, jack, reset, regulator, capacitors, crystal | See `src/scene/Boards.tsx` | Scaled |
| ATmega328P, ATmega16U2, both ICSP headers | See `src/scene/Boards.tsx` | Scaled |
| L, TX, RX and ON LEDs | (28, 43), (28, 36.6), (28, 33.9), (58.5, 36.6) | Scaled, identified from the pinout's labelled leader lines |
| PCB colour, part finish | Blue, silver | From photo |

The Arduino and Raspberry Pi logos are left off the models on purpose.

## Not verified

Nothing has been measured on a physical board. To check a model properly, compare it with a real board
using calipers.
