# Piano Learning Path

A personal piano practice site: one static page (`index.html`), no build step, used on a Mac, an iPad and an iPhone.

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

- Everything is in `index.html`: CSS in `<style>`, JS in one `<script>`.
- The curriculum is the `STAGES` array near the top of the script. Each item has `id`, `c` (T = technique, E = étude, R = repertoire, H = theory, S = sight-reading), `t` (title), optional `d` (practice tip) and optional `q` (IMSLP search query).
- **Never rename or reuse an item `id`**: saved progress is keyed by id. Add new ids instead.
- The pieces I keep up are in `MAINTAIN`. The daily plan is built by `todaysPlan()`.
- State shape: `{settings:{minutes,stage}, arps:{C:"solid"|"learning"|"none",...}, scales:{C:{maj,nat,harm,mel}}, checks:{id:true}, log:[{d,min,note,items,ts}], today, updatedAt}`.
- Saving: always to `localStorage` (`pianoPath.v1`). When the page runs as a claude.ai artifact it also syncs through `claude.use("db")`. Anywhere else (GitHub Pages, a local file), `window.claude` doesn't exist and the page quietly stays on localStorage, which is per device.

## Rules for changes

- Keep it a single static file with no framework and no build step.
- Design mobile-first (iPhone width ~390px), with tap targets of at least 40px, and test the iPad width too.
- Colours come only from the CSS tokens in `:root`, and both light and dark themes must stay readable.
- Audio (metronome, timer chime) starts only from a user tap (iOS requirement).
- Run `node --check` on the extracted script after edits.

## Deploy

GitHub Pages from the `main` branch root. After a change: commit, push, then reload on each device.

## Ideas backlog

- Export/import progress as JSON (to move progress between devices without a backend).
- Cross-device sync outside claude.ai (e.g. Supabase or Firebase free tier).
- Notation for short exercises with abcjs.
- A weekly review that reads the log and suggests what to change.
