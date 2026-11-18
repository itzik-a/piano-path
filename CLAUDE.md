# Piano Learning Path

A personal piano practice web app (React, built with Vite, hosted on GitHub Pages), used on a Mac, an iPad and an iPhone.

## About me (the pianist)

- Level: late beginner / early intermediate.
- Repertoire I play: Chopin Waltz in A minor, B. 150. Still learning: Chopin Waltz in B minor, Op. 69 No. 2 (stage item `s1r0`; it joins Keep up once checked).
- Scales: all major scales and their relative natural minors, hands together, at 95 bpm.
- Not yet learned: harmonic and melodic minor.
- Russian arpeggio set (11 forms per key): solid in C, G, D, A, E, B. Still to learn: F, F#, Db, Ab, Eb, Bb.
- Practice time: about 45 minutes a day (adjust here if this changes).
- Taste: mainly Chopin and Romantic repertoire, with Bach for finger independence.

When suggesting repertoire, use real pieces with correct catalogue numbers (Op., B., BWV, D.), and keep each stage a realistic step up from the one before.

## How the site is built

Vite + React 19 + TypeScript. Node 22 (`.nvmrc`). On this Mac `npm start` runs `nvm use` and then the dev server; `npm run dev` alone runs the local server (also reachable from the iPad/iPhone on the same Wi-Fi), `npm run build` to typecheck and build into `dist/`.

- `src/data/curriculum.ts`: `KEYS`, `STAGES`, `MAINTAIN`. Each stage item has `id`, `c` (T = technique, E = étude, R = repertoire, H = theory, S = sight-reading), `t` (title), optional `d` (practice tip), optional `q` (exact IMSLP page title, e.g. "Preludes, Op.28 (Chopin, Frédéric)"; IMSLP search URLs land on a bot check, so link pages, not searches) and optional `links` (free sheet-music links, used on sight-reading items and shown in Today's sight-reading block). Repertoire items can have `keep` (the title shown in Keep up once finished).
- Pieces: each repertoire item has a learning step (`PIECE_STEPS` in `curriculum.ts`, 5 steps) and an optional "working on bars" note, in state `pieces`. Reaching the last step checks the item; going back un-checks it. Today's New piece tip follows the step. Keep up rotates (one a day) through `MAINTAIN` plus every checked repertoire item (`maintained()`).
- **Never rename or reuse an item `id`**: saved progress is keyed by id. Add new ids instead.
- `src/state/store.ts`: the single app state, `useAppState()` hook, `update(fn)` for changes, `replaceState()` for sync. `src/state/actions.ts`: every state change goes through here.
- State shape: `{settings:{minutes,stage}, arps:{C:"solid"|"learning"|"none",...}, scales:{C:{maj,nat,harm,mel}}, checks:{id:true}, fingerings:{"A:3":"..."}, pieces:{id:{step,bars?}}, log:[{d,min,note,items,ts}], logDeleted:[ts], today, rot, updatedAt}`. New fields must be optional in `normalize()` so older saved copies still load.
- Saving: always `localStorage` key `pianoPath.v1` first. Metronome tempo and beats are kept separately in `pianoPath.metronome` (not synced).
- Sync (`src/state/sync.ts`): one private GitHub Gist with file `piano-path.json`, found by filename or created on first connect. The token (classic, `gist` scope) is pasted per device in the sync sheet and kept in `localStorage` key `pianoPath.gist`; never put it in code. Merge rule: `log` is the union by `ts` minus `logDeleted`; everything else comes from the copy with the newer `updatedAt`. Syncs on start, 2 s after a local change, on return to the app, on reconnect, and every 2 min while visible.
- `src/lib/arpeggios.ts`: the 11 Russian arpeggio forms as intervals; notes are spelled by letter + semitones (correct ♯/♭/𝄫), with `enharmonic()` for unusual spellings. `DEFAULT_FINGERINGS` holds the ones I supplied; my edits are in state `fingerings` ("RH : LH", ascending) and override them. Shown on Technique (key picker) and in Today's arpeggio block.
- `src/lib/plan.ts`: `todaysPlan()` builds the daily plan. `HIDDEN_BLOCKS` hides blocks from Today without deleting them (currently the étude; its minutes go to the new piece). Scales and arpeggios each run their own rotation (`rotationKeys()`): today's two keys are the least-ticked keys in circle-of-fifths order, so a key not ticked today comes first tomorrow. Ticks live in state `rot` (`n`: count per key per rotation; `day`: the latest day's ticks, folded into `n` on the next day's first tick). Each key row on Today has its own tick; the Scales row lists major + natural/harmonic/melodic relative minor with notes (`keyScales()` in `arpeggios.ts`, melodic shown ascending), each with standard one-octave RH/LH fingering aligned under the notes (`SCALE_FINGERINGS`, fixed, not editable), the Arpeggios row opens the 11 forms (hands separately for keys not yet solid).
- Logging is automatic: every tick on Today (block or key) rewrites that day's single `auto` log entry (`autoLog()` in `actions.ts`) with the items ticked and their minutes (a rotation block counts its share per key). Its `ts` is the date at 00:00 UTC, so all devices update the same entry through sync; if that ts was deleted, it moves to ts+1. There is no Log-this-session button; the Log tab form is for practice outside the plan.
- `src/lib/timer.ts`: block timer (memory only); not shown on Today for now (the per-block minutes, play/pause buttons and the 30/45/60/90 length picker were removed from the UI; `settings.minutes` stays at its saved value). `src/lib/audio.ts`: Web Audio click and chime.
- `src/views/`: Today, Path, Technique, Log. `src/components/`: Metronome, icons, small UI pieces. Routing is the URL hash (`#today`, `#path`, `#technique`, `#log`).
- Styling: plain CSS in `src/styles.css` with design tokens in `:root`.
- PWA: `public/manifest.webmanifest`, PNG icons in `public/icons/` (iOS needs the 180px PNG as apple-touch-icon), and `public/sw.js` (registered in production only). The service worker caches the page and the files it links on install, uses network first for the page and cache first for hashed assets, and never touches the GitHub API. If you add a file that must work offline and isn't linked from `index.html`, it is cached the first time it loads. On iOS the Home Screen app has its own storage, separate from Safari, so each install connects sync once.

## Rules for changes

- Design mobile-first (iPhone width ~390px), with tap targets of at least 40px, and check the iPad width too. Below 768px there is a bottom tab bar; above it, a top segmented nav.
- Colours come only from the CSS tokens in `:root`, and both light and dark themes must stay readable.
- Audio (metronome, timer chime) starts only from a user tap (iOS requirement).
- Run `npm run build` after edits; it must pass with no type errors.

## Deploy

GitHub Actions (`.github/workflows/deploy.yml`) builds and publishes to GitHub Pages on every push to `main`. Repo setting: Pages source = GitHub Actions. After a push, wait for the action, then reload on each device.

## Ideas backlog

- Export/import progress as JSON (to move progress between devices without a backend).
- Live sync with Firebase (Firestore) if gist sync ever feels too slow; only `src/state/sync.ts` would change.
- Notation for short exercises with abcjs.
- A weekly review that reads the log and suggests what to change.
