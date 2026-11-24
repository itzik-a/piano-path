/* Sync settings: connect this device to the gist, see status, disconnect. */
import { useEffect, useRef, useState, type FormEvent } from "react";
import { TOKEN_URL, connect, disconnect, syncNow, useSyncStatus } from "../state/sync";
import { IconExternal } from "./Icons";
import { ThemePicker } from "./ThemePicker";

function ago(t?: number) {
  if (!t) return "not yet";
  const s = Math.round((Date.now() - t) / 1000);
  if (s < 10) return "just now";
  if (s < 60) return `${s} s ago`;
  if (s < 3600) return `${Math.round(s / 60)} min ago`;
  return new Date(t).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

export function SyncPill({ onOpen }: { onOpen: () => void }) {
  const s = useSyncStatus();
  const dot = s.kind === "ok" ? "ok" : s.kind === "busy" ? "busy" : s.kind === "pending" ? "pending" : s.kind === "error" ? "err" : "";
  return (
    <button type="button" className="sync" onClick={onOpen} aria-label={`Sync: ${s.text}. Open sync settings`}>
      <span className={`dot ${dot}`} />
      <span role="status">{s.text}</span>
    </button>
  );
}

export function SyncSheet({ onClose }: { onClose: () => void }) {
  const s = useSyncStatus();
  const [token, setToken] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const ref = useRef<HTMLDialogElement>(null);
  const [, tick] = useState(0);

  useEffect(() => {
    ref.current?.showModal();
    const iv = setInterval(() => tick((n) => n + 1), 10_000); // keep "x min ago" fresh
    return () => clearInterval(iv);
  }, []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!token.trim()) return;
    setBusy(true); setErr("");
    try { await connect(token); setToken(""); }
    catch (x) { setErr((x as Error).message); }
    finally { setBusy(false); }
  }

  const connected = s.kind !== "off";

  return (
    <dialog ref={ref} className="sheet" onClose={onClose} onClick={(e) => { if (e.target === ref.current) ref.current.close(); }}>
      <div className="sheet-body">
        <div className="sheet-grip" aria-hidden="true" />
        <div className="card-head">
          <h2>Sync across devices</h2>
          <button type="button" className="btn ghost sm" onClick={() => ref.current?.close()}>Done</button>
        </div>

        {connected ? (
          <>
            <div className={`sync-state ${s.kind}`}>
              <span className={`dot ${s.kind === "ok" ? "ok" : s.kind === "busy" ? "busy" : s.kind === "pending" ? "pending" : s.kind === "error" ? "err" : ""}`} />
              <div>
                <b>{s.text}</b>
                <span className="muted small">Last synced {ago(s.last)}</span>
              </div>
            </div>
            {s.kind === "error" && s.text === "Sync token rejected" && (
              <p className="small">The token may have expired or been revoked. Disconnect, then connect again with a new token.</p>
            )}
            <p className="muted small">
              Your progress is saved to a private gist on your GitHub account. It syncs when you open the app, a couple of
              seconds after each change, and whenever you come back to it.
            </p>
            <div className="sheet-actions">
              <button type="button" className="btn primary" disabled={s.kind === "busy"} onClick={() => void syncNow()}>Sync now</button>
              {s.gistId && (
                <a className="btn ghost" href={`https://gist.github.com/${s.gistId}`} target="_blank" rel="noopener">
                  View the gist <IconExternal />
                </a>
              )}
              <button
                type="button" className="btn ghost danger"
                onClick={() => { if (confirm("Stop syncing on this device? Progress stays here and in the gist.")) disconnect(); }}
              >
                Disconnect this device
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="muted small">
              Progress is saved only on this device for now. Connect each device once with the same GitHub token to keep
              them in step through a private gist.
            </p>
            <ol className="steps">
              <li>
                <b>Create a token on GitHub</b>
                <span className="muted small">
                  The link opens the form with only the <code>gist</code> permission ticked. Choose an expiration (No expiration
                  or 1 year is easiest), press <i>Generate token</i>, and copy it. Use the same token on every device, so keep it
                  in your password manager.
                </span>
                <a className="link" href={TOKEN_URL} target="_blank" rel="noopener">Open GitHub token page <IconExternal /></a>
              </li>
              <li>
                <b>Paste it here</b>
                <form className="token-form" onSubmit={submit}>
                  <input
                    type="password" autoComplete="off" autoCapitalize="off" spellCheck={false}
                    placeholder="ghp_…" aria-label="GitHub token" value={token} onChange={(e) => setToken(e.target.value)}
                  />
                  <button className="btn primary" type="submit" disabled={busy || !token.trim()}>{busy ? "Connecting…" : "Connect"}</button>
                </form>
                {err && <p className="form-error" role="alert">{err}</p>}
              </li>
            </ol>
            <p className="muted small">
              The token stays on this device only and can do nothing except read and write your gists.
            </p>
          </>
        )}
        <div className="theme-block">
          <h3>Appearance</h3>
          <ThemePicker />
          <p className="muted small">System follows this device's light or dark setting. Each device keeps its own choice.</p>
        </div>
      </div>
    </dialog>
  );
}
