/* Small stroke icons, 24px grid, drawn in currentColor. */
import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement>;
const base = (p: P) => ({
  width: 22, height: 22, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor",
  strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const,
  "aria-hidden": true, ...p,
});

export const IconToday = (p: P) => (
  <svg {...base(p)}><circle cx="12" cy="12" r="4" /><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" /></svg>
);
export const IconPath = (p: P) => (
  <svg {...base(p)}><circle cx="6" cy="19" r="2.2" /><circle cx="18" cy="5" r="2.2" /><path d="M8.2 19H15a3.5 3.5 0 0 0 0-7H9a3.5 3.5 0 0 1 0-7h6.8" /></svg>
);
export const IconKeys = (p: P) => (
  <svg {...base(p)}><rect x="3" y="4" width="18" height="16" rx="2.5" /><path d="M9 4v16M15 4v16" /><path d="M7.5 4v8.5h3V4M13.5 4v8.5h3V4" fill="currentColor" stroke="none" /></svg>
);
export const IconLog = (p: P) => (
  <svg {...base(p)}><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></svg>
);
export const IconPlay = (p: P) => (
  <svg {...base({ strokeWidth: 0, fill: "currentColor", ...p })}><path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5Z" /></svg>
);
export const IconPause = (p: P) => (
  <svg {...base({ strokeWidth: 0, fill: "currentColor", ...p })}><rect x="6" y="5" width="4" height="14" rx="1.2" /><rect x="14" y="5" width="4" height="14" rx="1.2" /></svg>
);
export const IconCheck = (p: P) => (
  <svg {...base({ strokeWidth: 2.6, ...p })}><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
);
export const IconChevron = (p: P) => (
  <svg {...base(p)}><path d="M6 9l6 6 6-6" /></svg>
);
export const IconPlus = (p: P) => (
  <svg {...base({ strokeWidth: 2.2, ...p })}><path d="M12 5v14M5 12h14" /></svg>
);
export const IconMinus = (p: P) => (
  <svg {...base({ strokeWidth: 2.2, ...p })}><path d="M5 12h14" /></svg>
);
export const IconExternal = (p: P) => (
  <svg {...base({ width: 14, height: 14, strokeWidth: 2, ...p })}><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" /></svg>
);
export const IconTrash = (p: P) => (
  <svg {...base({ width: 18, height: 18, ...p })}><path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-12M9 7V4h6v3" /></svg>
);
export const IconMetronome = (p: P) => (
  <svg {...base(p)}><path d="M9 3h6l4 18H5L9 3Z" /><path d="M12 15l5-8" /><path d="M7.5 15h9" /></svg>
);
