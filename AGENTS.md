# AGENTS.md

Guidance for AI coding agents (Claude Code, Codex, Cursor, etc.) working in this repository.

## Project status

`3d-hardware-guides` is **Circuit Lab**: interactive 3D lessons for the Arduino Uno Rev3 SMD and Raspberry Pi 5,
built with `three`, `@react-three/fiber` and `@react-three/drei`. See `README.md` for the lesson format.
Lessons are data in `src/data/`, and all models are procedural geometry in `src/scene/`, so there are
no asset files. Board geometry is sourced in `docs/board-references.md`; keep that table current when
moving parts. The Run button simulates programs in the browser; it does not compile anything.

After changing a lesson, run `npm run check:circuits`. It checks the drawn wiring, not the pin numbers
inside the code, so compare those by hand.

The design direction is the design skill's `framed-sheet` app style (seed 952807987). The tokens are
in `src/index.css`. The hidden browser pane stops `requestAnimationFrame`, so check the 3D stage with
the skill's `inspect.mjs` or another headless Chrome run instead.

## Stack

| Area | Choice | Notes |
| --- | --- | --- |
| Build | Vite 8 (Rolldown) | `vite.config.ts` |
| UI | React 19 | Entry: `index.html` → `src/main.tsx` → `src/App.tsx`, rendered in `<StrictMode>` |
| Language | TypeScript ~6.0 | Project references: `tsconfig.app.json` (src) + `tsconfig.node.json` (vite config) |
| Styling | Tailwind CSS v4 via `@tailwindcss/vite` | Imported in `src/index.css`, tokens in `@theme inline` |
| 3D | three, @react-three/fiber, @react-three/drei | `src/scene/`, lazy-loaded from `src/App.tsx` |
| Compiler | React Compiler (`babel-plugin-react-compiler` via `@rolldown/plugin-babel`) | Auto-memoizes components |
| Lint | ESLint 10 flat config | `eslint.config.js` — JS/TS recommended, react-hooks, react-refresh |
| Runtime | Node 22+ | Required by the taste skill scripts; the app itself works on current LTS |

Package manager is **npm** (`package-lock.json` is committed). Don't introduce yarn/pnpm lockfiles.

## Commands

```bash
npm install        # or `npm ci` for a clean install from the lockfile
npm run dev        # Vite dev server with HMR
npm run build      # tsc -b (type-check) && vite build → dist/
npm run lint       # eslint .
npm run preview    # serve the production build locally
npm run check:circuits  # verify every lesson's wiring and run its simulation
npm run video:render    # re-render the intro video (see README.md)
```

There is no test runner yet. Before calling a change done, **`npm run build`, `npm run lint` and
`npm run check:circuits` must all pass** — `build` is also the type-check, since `tsc -b` runs first.

## Code conventions

- **Function components + hooks only.** Default-export the page-level component; named exports for
  shared components are fine.
- **Don't hand-memoize.** The React Compiler handles memoization, so avoid adding `useMemo`,
  `useCallback` and `React.memo` for performance. Write plain components and follow the Rules of
  React (pure render, no mutating props/state, hooks at top level) — the compiler bails out on code
  that breaks them.
- **react-refresh rule:** a `.tsx` file that exports components should export *only* components.
  Put constants, helpers and types in separate `.ts` files so HMR keeps working.
- **TypeScript is strict about leftovers:** `noUnusedLocals`, `noUnusedParameters`,
  `noFallthroughCasesInSwitch`. Remove unused code rather than prefixing with `_` to silence it.
- **`verbatimModuleSyntax` is on:** import types with `import type { Foo } from './foo'`.
- **`erasableSyntaxOnly` is on:** no `enum`, no `namespace`, no constructor parameter properties.
  Use union types / `as const` objects instead of enums.
- **Imports may include the extension** (`allowImportingTsExtensions`), matching the existing
  `import App from './App.tsx'`. Keep whichever style a file already uses.
- **Static assets:** import from `src/assets/` when the bundler should hash them; put files that need
  a stable URL (favicon, the `icons.svg` sprite, large 3D models/textures you'll fetch at runtime) in
  `public/` and reference them by absolute path (`/icons.svg#id`).
- **Styling:** prefer Tailwind utilities once it's imported. Keep design tokens as CSS custom
  properties (the starter already uses `:root` variables with a `prefers-color-scheme: dark` block —
  keep supporting both themes).

## Project structure

```
.
├── index.html              # Vite HTML entry (title, favicon, #root)
├── public/                 # Served as-is at /
├── src/
│   ├── main.tsx            # createRoot + StrictMode
│   ├── App.tsx             # The app shell and lesson state
│   ├── index.css           # Tailwind import and design tokens
│   ├── components/         # Panels around the bench
│   ├── data/               # Lessons, board pin maps, types
│   ├── lib/                # Geometry, circuit checker, run state, highlighter
│   └── scene/              # The 3D bench
├── scripts/check-circuits.mjs              # Verifies every lesson's wiring
├── .agents/skills/design-taste-frontend/   # Design skill (see below)
├── .claude/web-design-guidelines/          # UI review skill (see below)
└── skills-lock.json        # Pins the installed skill source + hash
```

## Bundled skills

Two skills ship with the repo. Use them for UI work.

### `design-taste-frontend` (`.agents/skills/design-taste-frontend/`)

Art-direction skill for public-facing pages and app screens. **Read its `SKILL.md` in full before
designing or restyling any page**; for dashboard/admin/tool-style screens, read
`references/app-screens.md` instead of the page run.

Its scripts are run from the repo root and write working files to `.taste-skill/`:

```bash
node .agents/skills/design-taste-frontend/scripts/draw.mjs ...      # deal a design direction
node .agents/skills/design-taste-frontend/scripts/lint.mjs src      # source-level house-rule check
node .agents/skills/design-taste-frontend/scripts/inspect.mjs <url> # real-browser check + screenshots
```

They need Node 22+ and a local Chrome/Edge/Chromium; `assets.mjs` also needs network access.
Its house rules include no violet, no gradients and no eyebrow labels.

The skill is pinned in `skills-lock.json`. Don't edit files under `.agents/skills/` — update the skill
through its source instead.

### `web-design-guidelines` (`.claude/web-design-guidelines/`)

UI review against Vercel's Web Interface Guidelines (accessibility, UX). It fetches the latest rules
at review time and reports findings as `file:line`. Use it when asked to review or audit UI.

## Gotchas

- **The intro video shows the real interface.** After a visible UI change, or a change to the lesson counts or
  groups, re-make it with the steps in `README.md`. Remotion is a dev dependency only: `src/video/` must never
  be imported from the app.
- **Tailwind v4 is configured in CSS** (`@theme`, `@custom-variant`, etc.) — there is no
  `tailwind.config.js`; don't create one unless a plugin specifically requires it.
- **Node 22 for the skill scripts.** The default Node here is 20; run them with
  `C:\nvm\v22.21.1\node.exe` rather than switching versions.
- **The React Compiler slows dev/build slightly.** That's expected; don't remove it to speed things up
  without asking.
- **ESLint only lints `**/*.{ts,tsx}`.** The `.mjs` scripts inside the skill folder aren't covered and
  shouldn't be.
- **3D assets get large fast.** Prefer compressed glTF/GLB (Draco/Meshopt) and KTX2 textures, keep
  them in `public/`, and lazy-load heavy scenes (`React.lazy` + `Suspense`) so the first paint isn't
  blocked on a model download.

## Working agreements

- Keep changes scoped to the task; don't reformat or restyle unrelated files.
- Don't add dependencies without saying why in your summary.
- Don't commit `dist/`, `node_modules/`, or `.env*.local` files (already gitignored).