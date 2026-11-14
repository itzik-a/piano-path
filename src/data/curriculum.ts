/* The curriculum. NEVER rename or reuse an item `id`: saved progress is keyed by it. */

export type Category = "T" | "E" | "R" | "H" | "S";

export interface Item {
  id: string;
  c: Category;
  /** title */
  t: string;
  /** practice tip */
  d?: string;
  /** IMSLP search query */
  q?: string;
}

export interface Stage {
  n: number;
  name: string;
  span: string;
  focus: string;
  criteria: string[];
  items: Item[];
}

export interface KeyInfo {
  /** major key, e.g. "F#" */
  k: string;
  /** relative minor, display form */
  m: string;
}

export const KEYS: KeyInfo[] = [
  { k: "C", m: "A" }, { k: "G", m: "E" }, { k: "D", m: "B" }, { k: "A", m: "F♯" },
  { k: "E", m: "C♯" }, { k: "B", m: "G♯" }, { k: "F#", m: "D♯" }, { k: "Db", m: "B♭" },
  { k: "Ab", m: "F" }, { k: "Eb", m: "C" }, { k: "Bb", m: "G" }, { k: "F", m: "D" },
];

export const NEW_ARP_ORDER = ["F", "F#", "Db", "Ab", "Eb", "Bb"];

export const pretty = (k: string) => k.replace("#", "♯").replace(/^([A-G])b$/, "$1♭");
export const imslp = (q: string) => "https://imslp.org/index.php?search=" + encodeURIComponent(q);

export const CAT: Record<Category, string> = {
  T: "Technique", E: "Études", R: "Repertoire", H: "Theory", S: "Sight-reading",
};

export const STAGES: Stage[] = [
  {
    n: 1, name: "Consolidate and widen", span: "about 3 months",
    focus: "Finish the easier keys of the Russian arpeggio cycle, add harmonic and melodic minor, and take your first Chopin preludes alongside the two waltzes.",
    criteria: ["Russian arpeggios solid in 8 keys", "Harmonic minor in all keys at 95", "E minor Prelude played start to finish with pedal", "One Burgmüller étude at tempo"],
    items: [
      { id: "s1t1", c: "T", t: "Russian arpeggios in F major / D minor", d: "White-key start with the same shapes as C. Hands separately and slowly first." },
      { id: "s1t2", c: "T", t: "Russian arpeggios in F♯ major / D♯ minor", d: "An all-black triad. Keep the wrist level and let the arm carry the hand over the thumb." },
      { id: "s1t3", c: "T", t: "Harmonic minor, all 12 keys, 80 then 95", d: "You already have the natural minors: raise the 7th." },
      { id: "s1t4", c: "T", t: "Melodic minor, all 12 keys, at 80", d: "Raised 6th and 7th going up, natural minor coming down." },
      { id: "s1t5", c: "T", t: "Chromatic scale, hands together, 2 octaves", d: "Fingering 1-3 on black-and-white pairs, 1-2 on E–F and B–C." },
      { id: "s1e1", c: "E", t: "Burgmüller Op. 100 No. 2, Arabesque", d: "Even right-hand groups over a light left-hand staccato.", q: "Burgmüller 25 Etudes Op.100" },
      { id: "s1e2", c: "E", t: "Burgmüller Op. 100 No. 15, Ballade", d: "Left-hand melody with right-hand repeated chords.", q: "Burgmüller 25 Etudes Op.100" },
      { id: "s1r1", c: "R", t: "Chopin Prelude in E minor, Op. 28 No. 4", d: "Practise the left-hand chords alone and listen for the one note that moves each time.", q: "Chopin Preludes Op.28" },
      { id: "s1r2", c: "R", t: "Chopin Prelude in B minor, Op. 28 No. 6", d: "Melody in the left hand, in the same key as your Op. 69 No. 2 waltz.", q: "Chopin Preludes Op.28" },
      { id: "s1r3", c: "R", t: "Bach Little Prelude in C major, BWV 939", d: "A first step into Baroque touch and finger independence.", q: "Bach Little Preludes BWV 939" },
      { id: "s1r4", c: "R", t: "Schumann Album for the Young Op. 68 No. 10, The Happy Farmer", d: "Sing the left-hand tune over a soft right hand.", q: "Schumann Album für die Jugend Op.68" },
      { id: "s1h1", c: "H", t: "Key signatures and the circle of fifths by heart", d: "Say the signature for any key in under two seconds." },
      { id: "s1h2", c: "H", t: "Primary chords I, IV, V and V7 in every major key", d: "Then find them in both of your waltzes." },
      { id: "s1s1", c: "S", t: "Sight-read 5 minutes a day", d: "Choose music a level below what you play, and keep going without stopping." },
    ],
  },
  {
    n: 2, name: "First nocturne", span: "3 to 4 months",
    focus: "Your first nocturne and mazurka, Bach with two clear voices, and scales pushed to 110.",
    criteria: ["Russian arpeggios solid in 10 keys", "All scales at 110", "C♯ minor Nocturne performable", "A Bach piece with both voices clearly shaped"],
    items: [
      { id: "s2t1", c: "T", t: "Russian arpeggios in D♭ major / B♭ minor", d: "Thumbs on white keys only where the fingering allows; check each hand's fingering before speeding up." },
      { id: "s2t2", c: "T", t: "Russian arpeggios in A♭ major / F minor" },
      { id: "s2t3", c: "T", t: "All scales hands together at 110" },
      { id: "s2t4", c: "T", t: "Scales in contrary motion, all keys" },
      { id: "s2t5", c: "T", t: "Scales in thirds and sixths: C, G, D, A" },
      { id: "s2e1", c: "E", t: "Burgmüller Op. 100 No. 18, Inquiétude", q: "Burgmüller 25 Etudes Op.100" },
      { id: "s2e2", c: "E", t: "Burgmüller Op. 100 No. 25, La chevaleresque", q: "Burgmüller 25 Etudes Op.100" },
      { id: "s2r1", c: "R", t: "Chopin Nocturne in C♯ minor, B. 49 (Lento con gran espressione)", d: "Learn the left hand first. Leave the right-hand runs for last and practise them slowly in rhythm groups.", q: "Chopin Nocturne C-sharp minor B.49" },
      { id: "s2r2", c: "R", t: "Chopin Mazurka in A minor, Op. 68 No. 2", d: "Feel the accent on beat 2 or 3, which sets the mazurka apart from the waltz.", q: "Chopin Mazurkas Op.68" },
      { id: "s2r3", c: "R", t: "Bach Little Prelude in D minor, BWV 926", q: "Bach Prelude BWV 926" },
      { id: "s2r4", c: "R", t: "Schumann Op. 68 No. 12, Knecht Ruprecht", q: "Schumann Album für die Jugend Op.68" },
      { id: "s2r5", c: "R", t: "Grieg Lyric Pieces Op. 12 No. 1, Arietta", q: "Grieg Lyric Pieces Op.12" },
      { id: "s2h1", c: "H", t: "Diminished 7th chords and how they resolve" },
      { id: "s2h2", c: "H", t: "Harmonic analysis of the B minor Waltz, Op. 69 No. 2", d: "Mark each chord in your score with a Roman numeral." },
      { id: "s2s1", c: "S", t: "Sight-read four-part chorales or hymns" },
    ],
  },
  {
    n: 3, name: "Wider style", span: "4 to 6 months",
    focus: "Complete the 12-key arpeggio cycle, take on two-part inventions, and add Grieg and Mendelssohn to your Chopin.",
    criteria: ["Russian arpeggios in all 12 keys", "All scales at 120", "C♯ minor Waltz at a flowing tempo", "Two Inventions memorised"],
    items: [
      { id: "s3t1", c: "T", t: "Russian arpeggios in E♭ major / C minor" },
      { id: "s3t2", c: "T", t: "Russian arpeggios in B♭ major / G minor", d: "This completes the cycle of 12 keys." },
      { id: "s3t3", c: "T", t: "All scales at 120, harmonic and melodic minor included" },
      { id: "s3t4", c: "T", t: "Chromatic scale in contrary motion and a minor third apart" },
      { id: "s3e1", c: "E", t: "Czerny Op. 849, selected études", q: "Czerny Op.849" },
      { id: "s3e2", c: "E", t: "Heller Op. 47, selected études", q: "Heller 25 Etudes Op.47" },
      { id: "s3r1", c: "R", t: "Chopin Waltz in C♯ minor, Op. 64 No. 2", q: "Chopin Waltzes Op.64" },
      { id: "s3r2", c: "R", t: "Chopin Nocturne in E♭ major, Op. 9 No. 2", q: "Chopin Nocturnes Op.9" },
      { id: "s3r3", c: "R", t: "Bach Two-Part Invention No. 1 in C major, BWV 772", q: "Bach Inventions BWV 772" },
      { id: "s3r4", c: "R", t: "Bach Two-Part Invention No. 8 in F major, BWV 779", q: "Bach Inventions BWV 772" },
      { id: "s3r5", c: "R", t: "Grieg Lyric Pieces Op. 12 No. 2, Waltz", q: "Grieg Lyric Pieces Op.12" },
      { id: "s3r6", c: "R", t: "Mendelssohn Song Without Words Op. 30 No. 3", q: "Mendelssohn Lieder ohne Worte Op.30" },
      { id: "s3h1", c: "H", t: "Modulation: find every key change in the C♯ minor Waltz" },
      { id: "s3s1", c: "S", t: "Sight-read song accompaniments and easy chamber parts" },
    ],
  },
  {
    n: 4, name: "Toward advanced", span: "6 months and more",
    focus: "The Minute Waltz, a Bach prelude and fugue, Schubert and Debussy, with technique in every key.",
    criteria: ["All scales at 132", "A prelude and fugue performed", "Two contrasting Chopin pieces from this stage performed"],
    items: [
      { id: "s4t1", c: "T", t: "All scales at 132, and in thirds and sixths in every key" },
      { id: "s4t2", c: "T", t: "Dominant 7th and diminished 7th arpeggios, all keys, 4 octaves" },
      { id: "s4t3", c: "T", t: "Double-third scale in C major, hands separately" },
      { id: "s4e1", c: "E", t: "Czerny Op. 299, selected études", q: "Czerny Op.299" },
      { id: "s4r1", c: "R", t: "Chopin Waltz in D♭ major, Op. 64 No. 1 (Minute)", q: "Chopin Waltzes Op.64" },
      { id: "s4r2", c: "R", t: "Chopin Nocturne in E minor, Op. 72 No. 1", q: "Chopin Nocturne Op.72 No.1" },
      { id: "s4r3", c: "R", t: "Chopin Mazurka in B♭ major, Op. 7 No. 1", q: "Chopin Mazurkas Op.7" },
      { id: "s4r4", c: "R", t: "Bach Prelude and Fugue in C major, WTC I, BWV 846", q: "Bach Well-Tempered Clavier Book 1" },
      { id: "s4r5", c: "R", t: "Schubert Impromptu in A♭ major, Op. 142 No. 2 (D. 935)", q: "Schubert Impromptus D.935" },
      { id: "s4r6", c: "R", t: "Debussy, Rêverie", q: "Debussy Rêverie" },
      { id: "s4h1", c: "H", t: "Form: binary, ternary and rondo; map each piece you play" },
      { id: "s4s1", c: "S", t: "Sight-read Stage 2 pieces fluently" },
    ],
  },
];

export const MAINTAIN = [
  { t: "Chopin Waltz in A minor, B. 150", d: "Play it through once, then fix one spot." },
  { t: "Chopin Waltz in B minor, Op. 69 No. 2", d: "Play it through once, then fix one spot." },
];
