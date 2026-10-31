# Benchtop

Interactive 3D guides to Arduino and Raspberry Pi. Each lesson puts the real board and circuit on a
bench you can orbit, labels the parts, and runs a simulation of the code so you can watch the hardware
respond and follow along line by line.

## Lessons

**Arduino Uno Rev3 SMD** (9): Meet the Uno · Blink an LED · Read a push button · Fade with a knob ·
Build a night light · Parking sensor · Steer a servo · Drive a DC motor · OLED thermometer

**Raspberry Pi 5** (10): Meet the Raspberry Pi · Set up a desktop · Blink from Python ·
React to a button · Weather data logger · Web light switch · Motion camera · Home file server ·
Living-room media player · Pi talks to Uno

The Run button simulates the program in the browser. It does not compile code or talk to a real board.

## Run it

```bash
npm install
npm run dev
```

```bash
npm run build            # type-check and production build
npm run lint             # ESLint
npm run check:circuits   # verify every lesson's wiring
```

## Add a lesson

A lesson is data, in `src/data/lessons-uno.ts` or `src/data/lessons-pi.ts`:

- `bench`: boards, a breadboard, parts in named holes (`d10`, `-b4`), wires between references
  (`uno.D13`, `pi.p11`, `bb.a5`), and `nets`, the connections the circuit must have.
- `callouts`, `wiring`, `specs`, `code`: what the panels show.
- `inputs` and `tick`: the simulation. `tick` runs every frame and returns values for the parts by id,
  plus the code `line` to highlight. Use `lineOf(source, snippet)` so that line stays correct when the
  code changes.

`npm run check:circuits` then fails the lesson if a hole or pin does not exist, two things share a
socket, a supply is shorted, 5 V reaches a Pi GPIO pin, a leg is left floating, a declared connection
is missing, or the simulation throws. It checks the wiring you drew, not whether the code and the
wiring agree, so check the pin numbers in the code by eye.

New parts go in `src/scene/Parts.tsx` (on a breadboard) or `src/scene/Modules.tsx` (stand-alone). Parts
are modelled in code in centimetres, so there are no asset files to download. The sources behind the
board models are in [docs/board-references.md](docs/board-references.md).

## Layout

```
src/data/        Lessons, board pin maps and specs, shared types
src/lib/         Bench geometry, circuit checker, run state, code highlighter
src/scene/       The 3D bench: boards, parts, wires, camera, callouts
src/components/  Panels around the bench
scripts/         check-circuits.mjs
```

The idea of a 3D lesson bench with labelled parts comes from
[Learn ESP32](https://learn-esp32.vercel.app/) by Dilum Sanjaya. All code, models and copy here are
original.
