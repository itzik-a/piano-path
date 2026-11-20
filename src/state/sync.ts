/* Cross-device sync through one private GitHub Gist.

   - The token (classic, `gist` scope only) is pasted once per device and kept
     in localStorage. It is never in the code or the repo.
   - Each sync: read the gist, merge with local, write back if anything changed.
   - Merge: the practice log is combined from both sides (by `ts`, minus
     deleted entries); everything else comes from whichever copy was edited last.
   - Runs on start, after a local change (2 s after the first, then at most once a minute while editing), when the app comes back into view,
     when the network returns, and every 2 minutes while visible. */
import { useSyncExternalStore } from "react";
import { getState, normalize, onLocalChange, replaceState, type AppState, type LogEntry } from "./store";

const CFG_KEY = "pianoPath.gist";
const FILE = "piano-path.json";
const DESC = "Piano Path sync data (written by the app)";
const API = "https://api.github.com";

export const TOKEN_URL =
  "https://github.com/settings/tokens/new?scopes=gist&description=" + encodeURIComponent("Piano Path sync");

interface Cfg { token: string; gistId?: string }

export interface SyncStatus {
  kind: "off" | "busy" | "pending" | "ok" | "error" | "offline";
  text: string;
  last?: number;
  gistId?: string;
}

/* ---------- status store ---------- */
let cfg: Cfg | null = loadCfg();
let status: SyncStatus = cfg ? { kind: "busy", text: "Connecting…" } : { kind: "off", text: "On this device" };
const listeners = new Set<() => void>();

function setStatus(s: Partial<SyncStatus>) {
  status = { ...status, ...s, gistId: cfg?.gistId };
  listeners.forEach((l) => l());
}
export function useSyncStatus() {
  return useSyncExternalStore((l) => { listeners.add(l); return () => { listeners.delete(l); }; }, () => status);
}

function loadCfg(): Cfg | null {
  try {
    const c = JSON.parse(localStorage.getItem(CFG_KEY) || "null");
    return c && typeof c.token === "string" ? c : null;
  } catch { return null; }
}
function saveCfg() {
  if (cfg) localStorage.setItem(CFG_KEY, JSON.stringify(cfg));
  else localStorage.removeItem(CFG_KEY);
}

/* ---------- GitHub API ---------- */
class HttpError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

/** One API call. A 304 (gist unchanged since our ETag) is returned, not thrown. */
async function ghFetch(path: string, init: RequestInit = {}, extra: Record<string, string> = {}): Promise<Response> {
  const res = await fetch(API + path, {
    ...init,
    cache: "no-store", // the API sends max-age=60; we always want the latest copy
    headers: {
      Authorization: `Bearer ${cfg!.token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...extra,
    },
  });
  if (!res.ok && res.status !== 304) throw new HttpError(res.status, `GitHub ${res.status}`);
  return res;
}

async function gh<T>(path: string, init: RequestInit = {}): Promise<T> {
  return (await ghFetch(path, init)).json() as Promise<T>;
}

interface GistFile { content?: string; truncated?: boolean; raw_url?: string }
interface Gist { id: string; files: Record<string, GistFile | undefined> }

async function findOrCreateGist(): Promise<string> {
  for (let page = 1; page <= 10; page++) {
    const list = await gh<Gist[]>(`/gists?per_page=100&page=${page}`);
    const hit = list.find((g) => g.files[FILE]);
    if (hit) return hit.id;
    if (list.length < 100) break;
  }
  const g = await gh<Gist>("/gists", {
    method: "POST",
    body: JSON.stringify({ description: DESC, public: false, files: { [FILE]: { content: serialize(getState()) } } }),
  });
  return g.id;
}

/** The gist as last read or written: its ETag and our file's text. Reads send the ETag
    (If-None-Match); GitHub answers 304 when nothing changed, and a 304 doesn't count
    toward the hourly API limit, so polling an unchanged gist is free. */
let lastRead: { gistId: string; etag: string; text: string } | null = null;

async function readRemote(): Promise<AppState | null> {
  const gistId = cfg!.gistId!;
  const known = lastRead?.gistId === gistId ? lastRead : null;
  const res = await ghFetch(`/gists/${gistId}`, {}, known ? { "If-None-Match": known.etag } : {});
  let text: string;
  if (res.status === 304 && known) {
    text = known.text;
  } else {
    const g = (await res.json()) as Gist;
    const f = g.files[FILE];
    if (!f) { lastRead = null; return null; }
    text = f.content ?? "";
    if (f.truncated && f.raw_url) text = await (await fetch(f.raw_url, { cache: "no-store" })).text();
    const etag = res.headers.get("etag");
    lastRead = etag ? { gistId, etag, text } : null;
  }
  try { return normalize(JSON.parse(text)); } catch { return null; }
}

async function writeRemote(s: AppState) {
  const gistId = cfg!.gistId!;
  const text = serialize(s);
  const res = await ghFetch(`/gists/${gistId}`, { method: "PATCH", body: JSON.stringify({ files: { [FILE]: { content: text } } }) });
  // The reply carries the new version's ETag: the next read is a free 304 unless another device wrote since.
  const etag = res.headers.get("etag");
  lastRead = etag ? { gistId, etag, text } : null;
}

/* ---------- merge ---------- */
/** JSON with sorted keys, so equal states always compare (and diff) equal. */
function serialize(v: unknown): string {
  const sort = (x: unknown): unknown =>
    Array.isArray(x) ? x.map(sort)
      : x && typeof x === "object"
        ? Object.fromEntries(Object.keys(x).sort().map((k) => [k, sort((x as Record<string, unknown>)[k])]))
        : x;
  return JSON.stringify(sort(v), null, 1);
}

export function merge(a: AppState, b: AppState): AppState {
  const [newer, older] = a.updatedAt >= b.updatedAt ? [a, b] : [b, a];
  const deleted = new Set([...older.logDeleted, ...newer.logDeleted]);
  const byTs = new Map<number, LogEntry>();
  for (const e of [...older.log, ...newer.log]) if (!deleted.has(e.ts)) byTs.set(e.ts, e);
  return {
    ...structuredClone(newer),
    log: [...byTs.values()].sort((x, y) => x.ts - y.ts).slice(-1500),
    logDeleted: [...deleted].sort((x, y) => x - y).slice(-500),
    updatedAt: Math.max(a.updatedAt, b.updatedAt),
  };
}

/* ---------- sync loop ---------- */
let chain: Promise<void> = Promise.resolve();
let dirty = false;
let debounce: ReturnType<typeof setTimeout> | undefined;
/** Writes to the gist are batched: at most one per PUSH_GAP_MS while editing (leaving the app or "Sync now" sends right away). */
const PUSH_GAP_MS = 60_000;
let lastPush = 0;

/** Run one sync after any sync already in progress. */
export function syncNow(): Promise<void> {
  chain = chain.then(doSync, doSync);
  return chain;
}

async function doSync() {
  if (!cfg) return;
  if (!navigator.onLine) { setStatus({ kind: "offline", text: "Offline · saved here" }); return; }
  setStatus({ kind: "busy", text: "Syncing…" });
  const wasDirty = dirty;
  dirty = false;
  try {
    if (!cfg.gistId) { cfg.gistId = await findOrCreateGist(); saveCfg(); }
    let remote: AppState | null;
    try {
      remote = await readRemote();
    } catch (e) {
      if (e instanceof HttpError && e.status === 404) { // gist was deleted: start a new one
        cfg.gistId = undefined; saveCfg();
        cfg.gistId = await findOrCreateGist(); saveCfg();
        remote = await readRemote();
      } else throw e;
    }
    const local = getState();
    const merged = remote ? merge(local, remote) : local;
    if (serialize(merged) !== serialize(local)) replaceState(merged);
    if (!remote || serialize(merged) !== serialize(remote)) { await writeRemote(merged); lastPush = Date.now(); }
    setStatus({ kind: "ok", text: "Synced", last: Date.now() });
  } catch (e) {
    if (wasDirty) dirty = true; // keep the change queued for the next try
    if (e instanceof HttpError && e.status === 401) {
      setStatus({ kind: "error", text: "Sync token rejected" });
    } else if (e instanceof HttpError && (e.status === 403 || e.status === 429)) {
      setStatus({ kind: "error", text: "GitHub limit hit · retrying later" });
    } else if (e instanceof HttpError) {
      setStatus({ kind: "error", text: `Sync failed (${e.status})` });
    } else {
      setStatus({ kind: "offline", text: "Can't reach GitHub · saved here" });
    }
  }
}

function schedule(ms: number) {
  clearTimeout(debounce);
  debounce = setTimeout(() => { void syncNow(); }, ms);
}

let started = false;
export function startSync() {
  if (started) return;
  started = true;

  onLocalChange(() => {
    if (!cfg) return;
    dirty = true;
    // First change syncs after 2 s; while editing, at most one write a minute (each write counts toward GitHub's limit).
    setStatus({ kind: "pending", text: "Saved here · syncing soon" });
    schedule(Math.max(2000, lastPush + PUSH_GAP_MS - Date.now()));
  });

  document.addEventListener("visibilitychange", () => {
    if (!cfg) return;
    if (document.visibilityState === "hidden") {
      if (dirty) { clearTimeout(debounce); void syncNow(); }
    } else if (dirty || !status.last || Date.now() - status.last > 10_000) {
      void syncNow();
    }
  });
  window.addEventListener("online", () => { if (cfg) void syncNow(); });
  setInterval(() => {
    if (cfg && document.visibilityState === "visible" && status.kind !== "busy") void syncNow();
  }, 120_000);

  if (cfg) void syncNow();
}

/** Connect this device with a token. Resolves when the first sync is done. */
export async function connect(token: string) {
  cfg = { token: token.trim() };
  saveCfg();
  await syncNow();
  if (status.kind === "error" && status.text === "Sync token rejected") {
    disconnect();
    throw new Error("GitHub didn't accept that token. Check it was copied in full and has the gist scope.");
  }
}

export function disconnect() {
  cfg = null;
  saveCfg();
  clearTimeout(debounce);
  dirty = false;
  setStatus({ kind: "off", text: "On this device", last: undefined });
}
