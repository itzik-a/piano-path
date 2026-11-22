# Plan: Study tab

A fifth tab for reading and harmony drills. Study runs only when I open it: no Today block and nothing in the Log.
Approved 2026-11-22.

## Decisions

- **Its own tab**, `#study`, with one page per drill (`#study/<id>`). The chord quiz moves here from Technique; Technique's chord section is Learn only (Letters or Staff).
- **Chord drills** keep the hand-made staff (`components/Staff.tsx`, Bravura glyph paths).
- **Reading passages** need rhythm, stems, beams, time signatures and two hands, so they use **abcjs** (MIT), loaded only when a passage is opened and cached for offline use after that. Its player can later serve ear training.
- **Reading = generated passages**, not real pieces: endless, in any key, and the app knows every chord, so the passage can be quizzed. Single-note reading is too easy, so there are no note flashcards.
- **Self-marking**: after revealing an answer, Got it / Missed; missed items come back more often. Stored in state `study` (optional in `normalize()`), synced like the rest.
- **Ear training is out for now** (see Later).

## Milestones

1. **Study tab and key signatures.** The tab, the drill list and per-drill pages; the chord quiz moved from Technique; a timed key-signature drill (name the key from a signature in treble or bass, or find the signature for a named key; a round is the 12 signatures; goal under 2 s, Path item s1h1).
2. **Chord recognition and self-marking.** Flashcards of single chords in any inversion with figures (I⁶, ii⁶₅, V⁴₃, vii°⁴₂), in one clef or split between the hands (bass in the left hand). Got it / Missed, weak items weighted, results synced. Key signatures record their misses too.
3. **Reading passages.** Generated 8-bar two-hand passages (3/4 or 4/4) in a chosen key, built on a real progression, at four levels: (1) melody over held chords, (2) waltz left hand, (3) broken chords and Alberti bass, (4) passing notes and secondary dominants. New passage on demand. Analysis mode: name each bar's chord, tap to check.
4. **Harmony drills.** Diminished 7ths (the three chords, their spellings, where each resolves; s2h1), secondary dominants (V/V, V7/iv, vii°7/V…), cadence types (authentic, plagal, half, deceptive).
5. **Analysis notes per piece** (s2h2, s3h1, s4h1). Bar range, key, Roman numerals and a note for each repertoire piece, synced with the piece.

## Later

- **Ear training**: tap a chord on the staff to hear it; chord quality, intervals and cadences by ear (abcjs synth or the Web Audio in `lib/audio.ts`).
