# Piano Learning Path

A personal piano practice web app (React, built with Vite, hosted on GitHub Pages), used on a Mac, an iPad and an iPhone.

## About me (the pianist)

- Level: late beginner / early intermediate.
- Repertoire I play: Chopin Waltz in A minor, B. 150; Chopin Waltz in B minor, Op. 69 No. 2.
- Scales: all major scales and their relative natural minors, hands together, at 95 bpm.
- Not yet learned: harmonic and melodic minor.
- Russian arpeggio set (11 forms per key): solid in C, G, D, A, E, B. Still to learn: F, F#, Db, Ab, Eb, Bb.
- Practice time: about 45 minutes a day (adjust here if this changes).
- Taste: mainly Chopin and Romantic repertoire, with Bach for finger independence.

When suggesting repertoire, use real pieces with correct catalogue numbers (Op., B., BWV, D.), and keep each stage a realistic step up from the one before.

## How the site is built

Vite + React 19 + TypeScript. Node 22 (`.nvmrc`; on this Mac use `nvm use`). `npm run dev` for a local server (also reachable from the iPad/iPhone on the same Wi-Fi), `npm run build` to typecheck and build into `dist/`.

- `src/data/curriculum.ts`: `KEYS`, `STAGES`, `MAINTAIN`. Each stage item has `id`, `c` (T = technique, E = étude, R = repertoire, H = theory, S = sight-reading), `t` (title), optional `d` (practice tip) and optional `q` (IMSLP search query).
- **Never rename or reuse an item `id`**: saved progress is keyed by id. Add new ids instead.
- `src/state/store.ts`: the single app state, `useAppState()` hook, `update(fn)` for changes, `replaceState()` for sync. `src/state/actions.ts`: every state change goes through here.
- State shape (unchanged from v1): `{settings:{minutes,stage}, arps:{C:"solid"|"learning"|"none",...}, scales:{C:{maj,nat,harm,mel}}, checks:{id:true}, log:[{d,min,note,items,ts}], today, updatedAt}`.
- Saving: `localStorage` key `pianoPath.v1` (per device). Cross-device sync via Firebase is the next step. Metronome tempo and beats are kept separately in `pianoPath.metronome`.
- `src/lib/plan.ts`: `todaysPlan()` builds the daily plan. `src/lib/timer.ts`: block timer (memory only). `src/lib/audio.ts`: Web Audio click and chime.
- `src/views/`: Today, Path, Technique, Log. `src/components/`: Metronome, icons, small UI pieces. Routing is the URL hash (`#today`, `#path`, `#technique`, `#log`).
- Styling: plain CSS in `src/styles.css` with design tokens in `:root`.

## Rules for changes

- Design mobile-first (iPhone width ~390px), with tap targets of at least 40px, and check the iPad width too. Below 768px there is a bottom tab bar; above it, a top segmented nav.
- Colours come only from the CSS tokens in `:root`, and both light and dark themes must stay readable.
- Audio (metronome, timer chime) starts only from a user tap (iOS requirement).
- Run `npm run build` after edits; it must pass with no type errors.

## Deploy

GitHub Actions (`.github/workflows/deploy.yml`) builds and publishes to GitHub Pages on every push to `main`. Repo setting: Pages source = GitHub Actions. After a push, wait for the action, then reload on each device.

## Ideas backlog

- Export/import progress as JSON (to move progress between devices without a backend).
- Cross-device sync with Firebase (Firestore + Google sign-in, offline cache; merge `log` by `ts` and union `checks`).
- Notation for short exercises with abcjs.
- A weekly review that reads the log and suggests what to change.
