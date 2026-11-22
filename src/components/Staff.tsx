/* Chords written on a staff (treble, bass, or a grand staff), as hand-drawn SVG with Bravura glyphs.
   Every row starts with the clef and key signature; each chord is a whole-note chord in its own bar,
   with the chord name above and the numeral below. Rows wrap to fit the width, like systems on a page. */
import { useLayoutEffect, useRef, useState } from "react";
import { GLYPHS, type Glyph } from "../lib/glyphs";
import { signaturePositions, type Clef, type KeySig, type StaffNote } from "../lib/notation";

export interface StaffColumn { above?: string; below?: string; notes: StaffNote[] }

const SP = 5;          // one staff step (half a space)
const STAFF_H = 40;    // bottom line to top line
const HEAD = GLYPHS.whole.w;
const ACC_COL = 11.5;  // width of one accidental column
const PAD = 9;         // space on each side of a chord inside its bar
const ACC_GLYPH: Record<string, Glyph> = {
  "♯": GLYPHS.sharp, "♭": GLYPHS.flat, "♮": GLYPHS.natural, "𝄪": GLYPHS.dsharp, "𝄫": GLYPHS.dflat,
};
const NAME_FS = 13, NUM_FS = 14;
const MIN_SCALE = 0.85, MAX_SCALE = 1.25;

/** "C♯m(maj7)" → ["C♯m", "(maj7)"]: long names break before their quality suffix, like the letter view. */
function nameLines(s: string): string[] {
  if (s.length <= 5) return [s];
  const i = s.slice(1).search(/maj|\(|\+|ø|°/) + 1;
  return i > 0 ? [s.slice(0, i), s.slice(i)] : [s];
}
const textW = (s: string, fs: number) => [...s].length * fs * 0.6;

interface Placed { pos: number; x: number; acc: { g: Glyph; x: number } | null }
interface Laid { width: number; staves: { heads: Placed[]; ledgers: number[]; span: [number, number] }[]; col: StaffColumn }

/** Lays out one chord: seconds side by side, accidentals in columns so they never touch. */
function layColumn(col: StaffColumn, staves: number): Laid {
  const per = Array.from({ length: staves }, (_, s) => col.notes.filter((n) => n.staff === s).sort((a, b) => a.pos - b.pos));
  // accidentals, top note first, each in the first column with nothing within a sixth
  const accCol = per.map((ns) => {
    const cols: number[][] = [];
    const out = new Map<StaffNote, number>();
    for (const n of [...ns].reverse()) {
      if (!n.acc) continue;
      let c = cols.findIndex((ps) => ps.every((p) => Math.abs(p - n.pos) >= 6));
      if (c < 0) { c = cols.length; cols.push([]); }
      cols[c].push(n.pos);
      out.set(n, c);
    }
    return { out, n: cols.length };
  });
  const accW = Math.max(0, ...accCol.map((a) => a.n * ACC_COL));
  const seconds = per.map((ns) => {
    const moved = ns.map(() => false);
    ns.forEach((n, i) => { if (i > 0 && n.pos - ns[i - 1].pos === 1 && !moved[i - 1]) moved[i] = true; });
    return moved;
  });
  const headsW = seconds.some((m) => m.some(Boolean)) ? HEAD * 2 - 0.5 : HEAD;
  const nameW = Math.max(0, ...nameLines(col.above ?? "").map((l) => textW(l, NAME_FS)));
  const width = Math.max(accW + headsW + PAD * 2, nameW + 8, textW(col.below ?? "", NUM_FS) + 8, 42);
  const headX = (width - accW - headsW) / 2 + accW;
  return {
    width, col,
    staves: per.map((ns, s) => {
      const heads = ns.map((n, i): Placed => {
        const c = accCol[s].out.get(n);
        const g = n.acc ? ACC_GLYPH[n.acc] : undefined;
        return {
          pos: n.pos,
          x: headX + (seconds[s][i] ? HEAD - 0.5 : 0),
          acc: g && c !== undefined ? { g, x: headX - 2 - c * ACC_COL - g.w } : null,
        };
      });
      const lo = Math.min(...ns.map((n) => n.pos)), hi = Math.max(...ns.map((n) => n.pos));
      const ledgers: number[] = [];
      for (let p = -2; p >= lo; p -= 2) ledgers.push(p);
      for (let p = 10; p <= hi; p += 2) ledgers.push(p);
      return { heads, ledgers, span: [headX - 4, headX + headsW + 4] as [number, number] };
    }),
  };
}

function useWidth() {
  const ref = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current!;
    setW(el.clientWidth);
    const ro = new ResizeObserver(() => setW(el.clientWidth));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, w] as const;
}

export function Staff({ clefs, sig, columns, label }: { clefs: Clef[]; sig: KeySig; columns: StaffColumn[]; label: string }) {
  const [ref, avail] = useWidth();
  const laid = columns.map((c) => layColumn(c, clefs.length));

  // clef + key signature at the start of every row
  const sigPos = clefs.map((c) => signaturePositions(sig, c));
  const sigGlyph = sig.acc === "♭" ? GLYPHS.flat : GLYPHS.sharp;
  const sigStart = 6 + GLYPHS.gClef.w + 6;
  const prefix = sigStart + sigPos[0].length * (sigGlyph.w + 1.5) + 8;

  // vertical space, from the highest and lowest notes of all chords so every row matches
  const range = (s: number) => {
    const ps = columns.flatMap((c) => c.notes.filter((n) => n.staff === s).map((n) => n.pos));
    return [Math.min(0, ...ps), Math.max(8, ...ps)];
  };
  const [, topHi] = range(0);
  const nameRows = Math.max(0, ...columns.map((c) => (c.above ? nameLines(c.above).length : 0)));
  const nameH = nameRows ? nameRows * (NAME_FS + 2) + 4 : 0;
  const staffTop = [nameH + Math.max(16, (topHi - 8) * SP + 18)];
  if (clefs.length === 2) {
    const [tLo] = range(0), [, bHi] = range(1);
    const gap = Math.max(30, Math.max(17, -tLo * SP + 8) + Math.max(0, (bHi - 8) * SP + 18));
    staffTop.push(staffTop[0] + STAFF_H + gap);
  }
  const last = staffTop.length - 1;
  const [lastLo] = range(last);
  const belowStaff = Math.max(clefs[last] === "treble" ? 17 : 8, -lastLo * SP + 8);
  const numTop = staffTop[last] + STAFF_H + belowStaff;
  const height = numTop + (columns.some((c) => c.below) ? NUM_FS + 8 : 0);

  // rows: as few as fit the width at a readable size, chords shared out evenly
  const fits = (rows: Laid[][]) => Math.max(...rows.map((r) => prefix + r.reduce((a, c) => a + c.width, 0)));
  let rows: Laid[][] = [laid];
  for (let r = 1; r <= laid.length; r++) {
    const per = Math.ceil(laid.length / r);
    rows = Array.from({ length: Math.ceil(laid.length / per) }, (_, i) => laid.slice(i * per, (i + 1) * per));
    if (!avail || fits(rows) * MIN_SCALE <= avail) break;
  }
  const rowW = fits(rows);
  const scale = avail ? Math.min(MAX_SCALE, avail / rowW) : 1;

  const yOf = (s: number, pos: number) => staffTop[s] + (8 - pos) * SP;
  const glyph = (g: Glyph, x: number, y: number, key: string) => <path key={key} d={g.d} transform={`translate(${x.toFixed(1)} ${y.toFixed(1)})`} />;

  return (
    <div ref={ref} className="staff" role="img" aria-label={label}>
      {avail > 0 && rows.map((row, ri) => {
        // justify: share the row's spare width out over its chords
        const spare = (rowW - fits([row])) / row.length;
        let x = prefix;
        const top = staffTop[0], bottom = staffTop[last] + STAFF_H;
        const isLast = ri === rows.length - 1;
        return (
          <svg key={ri} viewBox={`0 0 ${rowW.toFixed(1)} ${height.toFixed(1)}`} width={rowW * scale} height={height * scale} aria-hidden="true">
            {staffTop.map((t, s) => [0, 1, 2, 3, 4].map((l) => (
              <line key={`l${s}${l}`} className="staff-line" x1={0} x2={rowW} y1={t + l * 10} y2={t + l * 10} />
            )))}
            {clefs.length === 2 && <line className="staff-bar" x1={0.8} x2={0.8} y1={top} y2={bottom} />}
            <g className="staff-ink">
              {clefs.map((c, s) => c === "treble"
                ? glyph(GLYPHS.gClef, 6, yOf(s, 2), "c" + s)
                : glyph(GLYPHS.fClef, 6, yOf(s, 6), "c" + s))}
              {sigPos.flatMap((ps, s) => ps.map((p, i) => glyph(sigGlyph, sigStart + i * (sigGlyph.w + 1.5), yOf(s, p), `k${s}-${i}`)))}
              {row.map((c, ci) => {
                const w = c.width + spare, x0 = x, mid = (w - c.width) / 2;
                x += w;
                return (
                  <g key={ci}>
                    {c.staves.flatMap((st, s) => [
                      ...st.ledgers.map((p) => (
                        <line key={`g${s}${p}`} className="staff-ledger" x1={x0 + mid + st.span[0]} x2={x0 + mid + st.span[1]} y1={yOf(s, p)} y2={yOf(s, p)} />
                      )),
                      ...st.heads.flatMap((h, i) => [
                        glyph(GLYPHS.whole, x0 + mid + h.x, yOf(s, h.pos), `h${s}-${i}`),
                        h.acc && glyph(h.acc.g, x0 + mid + h.acc.x, yOf(s, h.pos), `a${s}-${i}`),
                      ]),
                    ])}
                    {c.col.above && nameLines(c.col.above).map((l, li) => (
                      <text key={"n" + li} className="staff-name" x={x0 + w / 2} y={NAME_FS + li * (NAME_FS + 2)} fontSize={NAME_FS}>{l}</text>
                    ))}
                    {c.col.below && <text className="staff-num" x={x0 + w / 2} y={numTop + NUM_FS} fontSize={NUM_FS}>{c.col.below}</text>}
                    {(ci < row.length - 1 || !isLast) && <line className="staff-bar" x1={x} x2={x} y1={top} y2={bottom} />}
                  </g>
                );
              })}
              {isLast && <>
                <line className="staff-bar" x1={rowW - 6} x2={rowW - 6} y1={top} y2={bottom} />
                <rect x={rowW - 3.5} y={top} width={3.5} height={bottom - top} />
              </>}
            </g>
          </svg>
        );
      })}
    </div>
  );
}
