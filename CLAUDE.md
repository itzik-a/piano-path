# Piano Learning Path

A personal piano practice web app (React, built with Vite, hosted on GitHub Pages), used on a Mac, an iPad and an iPhone.

## About me (the pianist)

- Level: late beginner / early intermediate.
- Repertoire I play: Chopin Waltz in A minor, B. 150. Still learning: Chopin Waltz in B minor, Op. 69 No. 2 (stage item `s1r0`; it joins Keep up once checked).
- Scales: all major scales and their relative natural minors, hands together, at 95 bpm.
- Not yet learned: harmonic and melodic minor.
- Russian arpeggio set (11 forms per key): solid in C, G, D, A, E, B. Still to learn: F, F#, Db, Ab, Eb, Bb.
- Chords: learning the diatonic triads and 7th chords of every major key and its relative minor in all inversions, plus cadences (own rotation, one a day: a major key, then its relative minor the next day).
- Practice is item based, not timed: a daily set of items to tick, no minutes.
- Taste: mainly Chopin and Romantic repertoire, with Bach for finger independence.

When suggesting repertoire, use real pieces with correct catalogue numbers (Op., B., BWV, D.), and keep each stage a realistic step up from the one before.

## How the site is built

Vite + React 19 + TypeScript. Node 22 (`.nvmrc`). On this Mac `npm start` runs `nvm use` and then the dev server; `npm run dev` alone runs the local server (also reachable from the iPad/iPhone on the same Wi-Fi), `npm run build` to typecheck and build into `dist/`.

- `src/data/curriculum.ts`: `KEYS`, `STAGES`, `MAINTAIN`. Each stage item has `id`, `c` (T = technique, E = étude, R = repertoire, H = theory), `t` (title), optional `d` (practice tip), optional `q` (exact IMSLP page title, e.g. "Preludes, Op.28 (Chopin, Frédéric)"; IMSLP search URLs land on a bot check, so link pages, not searches). Sight-reading was dropped (Today block and the stage items `s1s1`–`s4s1`; don't reuse those ids). Repertoire items can have `keep` (the title shown in Keep up once finished).
- Pieces: each repertoire item has a learning step (`PIECE_STEPS` in `curriculum.ts`, 5 steps) and an optional "working on bars" note, in state `pieces`. Reaching the last step checks the item; going back un-checks it. Today's New piece tip follows the step. Keep up rotates (one a day) through `MAINTAIN` plus every checked repertoire item (`maintained()`).
- **Never rename or reuse an item `id`**: saved progress is keyed by id. Add new ids instead.
- `src/state/store.ts`: the single app state, `useAppState()` hook, `update(fn)` for changes, `replaceState()` for sync. `src/state/actions.ts`: every state change goes through here.
- State shape: `{settings:{minutes,stage}, arps:{C:"solid"|"learning"|"none",...}, scales:{C:{maj,nat,harm,mel}}, checks:{id:true}, fingerings:{"A:3":"..."}, pieces:{id:{step,bars?}}, log:[{d,n?,note,items,ts,auto?}] (old entries have `min` instead of `n`), logDeleted:[ts], today, rot, updatedAt}`. New fields must be optional in `normalize()` so older saved copies still load.
- Saving: always `localStorage` key `pianoPath.v1` first. Metronome tempo and beats are kept separately in `pianoPath.metronome` (not synced).
- Sync (`src/state/sync.ts`): one private GitHub Gist with file `piano-path.json`, found by filename or created on first connect. The token (classic, `gist` scope) is pasted per device in the sync sheet and kept in `localStorage` key `pianoPath.gist`; never put it in code. Merge rule: `log` is the union by `ts` minus `logDeleted`; everything else comes from the copy with the newer `updatedAt`. Syncs on start, 2 s after a local change, on return to the app, on reconnect, and every 2 min while visible.
- `src/lib/arpeggios.ts`: the 11 Russian arpeggio forms as intervals; notes are spelled by letter + semitones (correct ♯/♭/𝄫), with `enharmonic()` for unusual spellings. `arpFingering()` gives each form one octave of notes with standard RH/LH fingering from rules (thumbs on white keys, or on the key note when it's white or every note is black; triads use 4 beside the crossing across a third, 3 across a fourth; 7ths 1234 / 1432 from the thumb). `DEFAULT_FINGERINGS` (the ones I supplied) and any saved state `fingerings` ("RH : LH") override the rules; fingerings are no longer editable in the UI. `ArpForms` has two tabs (choice kept in `localStorage` `pianoPath.arpTab`): Forms, one line per form ("F♯ Minor  F♯ A C♯ F♯") to see the progression, and Fingering, the notes with RH/LH under them via `components/Fingering.tsx` (shared with the scales). Shown on Technique (key picker) and in Today's arpeggio block.
- `src/lib/plan.ts`: `todaysPlan()` builds the daily plan. `HIDDEN_BLOCKS` hides blocks from Today without deleting them (currently the étude). Scales and arpeggios each run their own rotation (`rotationKeys()`): today's key (one a day each) is the least-ticked key in circle-of-fifths order, so a key not ticked today comes first tomorrow. Ticks live in state `rot` (`n`: count per key per rotation; `day`: the latest day's ticks, folded into `n` on the next day's first tick). Each key row on Today has its own tick; the Scales row lists major + natural/harmonic/melodic relative minor with notes (`keyScales()` in `arpeggios.ts`, melodic shown ascending), each with standard one-octave RH/LH fingering aligned under the notes (`SCALE_FINGERINGS`, fixed, not editable), the Arpeggios row opens the 11 forms (hands separately for keys not yet solid).
- Logging is automatic: every tick on Today (block or key) rewrites that day's single `auto` log entry (`autoLog()` in `actions.ts`) with the items ticked and their count `n` (each key in a rotation block, plus each other block). Its `ts` is the date at 00:00 UTC, so all devices update the same entry through sync; if that ts was deleted, it moves to ts+1. There is no Log-this-session button; the Log tab form (date + note, required) is for practice outside the plan and counts as one item. The Log's streak, 14-day chart and stats count items (`itemCount()` in `Log.tsx`, which also counts old entries from their text).
- `src/lib/chords.ts`: diatonic triads and 7ths stacked from `keyScales()` notes (minor = harmonic minor's raised 7th only in V and vii°, so III stays major), `invert()`, standard chord fingerings, and two cadences per mode voiced by nearest voice leading from a chosen starting position. `src/components/ChordView.tsx` shows them (major/minor × triads/7ths/cadences × inversion), on Technique (key picker) and in Today's Chords block. Chords are a third rotation (`rot` key `chord`, one item a day via `chordRotation()` in `plan.ts`) over `CHORD_ITEMS` in `curriculum.ts`: 24 items, ids `"C:maj"` / `"C:min"`, in the order C major, A minor, G major, E minor, …; Today shows only that mode (`ChordView` `only` prop), Technique keeps the major/minor toggle. Old saved chord counts and ticks keyed by plain key (`"C"`) are split into both items in `normalize()`. The block id is `chord`.
- Practice is item based, not timed: Today is ticks only (no minutes, no bpm), and blocks have no minutes. `settings.minutes` stays in saved state but is unused.
- On phones (≤600px) a Today block's (and key row's) content below the title spans the full width instead of indenting past the tick (`.block-more`, `.key-row-more`).
- `src/lib/audio.ts`: Web Audio click and chime (the block timer was removed).
- `src/views/`: Today, Path, Technique, Log. `src/components/`: Metronome, icons, small UI pieces. Routing is the URL hash (`#today`, `#path`, `#technique`, `#log`).
- Styling: plain CSS in `src/styles.css` with design tokens in `:root`.
- PWA: `public/manifest.webmanifest`, PNG icons in `public/icons/` (iOS needs the 180px PNG as apple-touch-icon), and `public/sw.js` (registered in production only). The service worker caches the page and the files it links on install, uses network first for the page and cache first for hashed assets, and never touches the GitHub API. If you add a file that must work offline and isn't linked from `index.html`, it is cached the first time it loads. On iOS the Home Screen app has its own storage, separate from Safari, so each install connects sync once.

## Rules for changes

- Design mobile-first (iPhone width ~390px), with tap targets of at least 40px, and check the iPad width too. Below 768px there is a bottom tab bar; above it, a top segmented nav.
- Colours come only from the CSS tokens in `:root`, and both light and dark themes must stay readable.
- Audio (metronome) starts only from a user tap (iOS requirement).
- Run `npm run build` after edits; it must pass with no type errors.

## Deploy

GitHub Actions (`.github/workflows/deploy.yml`) builds and publishes to GitHub Pages on every push to `main`. Repo setting: Pages source = GitHub Actions. After a push, wait for the action, then reload on each device.

## Ideas backlog

- Export/import progress as JSON (to move progress between devices without a backend).
- Live sync with Firebase (Firestore) if gist sync ever feels too slow; only `src/state/sync.ts` would change.
- Notation for short exercises with abcjs.
- A weekly review that reads the log and suggests what to change.
