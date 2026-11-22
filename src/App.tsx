import { useEffect, useState, type ComponentType, type SVGProps } from "react";
import { Today } from "./views/Today";
import { Path } from "./views/Path";
import { Technique } from "./views/Technique";
import { Log } from "./views/Log";
import { Study } from "./views/Study";
import { Metronome } from "./components/Metronome";
import { SyncPill, SyncSheet } from "./components/SyncSheet";
import { IconKeys, IconLog, IconPath, IconStudy, IconToday } from "./components/Icons";

type View = "today" | "path" | "technique" | "study" | "log";
const TABS: { id: View; label: string; Icon: ComponentType<SVGProps<SVGSVGElement>> }[] = [
  { id: "today", label: "Today", Icon: IconToday },
  { id: "path", label: "Path", Icon: IconPath },
  { id: "technique", label: "Technique", Icon: IconKeys },
  { id: "study", label: "Study", Icon: IconStudy },
  { id: "log", label: "Log", Icon: IconLog },
];

/** "#study/keys" → view "study", sub "keys" */
const readHash = (): { view: View; sub: string } => {
  const [h, sub = ""] = location.hash.slice(1).split("/");
  return TABS.some((t) => t.id === h) ? { view: h as View, sub } : { view: "today", sub: "" };
};

export function App() {
  const [{ view, sub }, setRoute] = useState(readHash);
  const [syncOpen, setSyncOpen] = useState(false);

  useEffect(() => {
    const on = () => { setRoute(readHash()); window.scrollTo(0, 0); };
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);

  const go = (v: string) => { location.hash = "#" + v; };

  return (
    <>
      <header className="topbar">
        <div className="wrap topbar-inner">
          <a className="brand" href="#today" aria-label="Piano Path, today">
            <img src="./icon.svg" alt="" width={28} height={28} />
            <span>Piano Path</span>
          </a>
          <nav className="tabs-top" aria-label="Sections">
            {TABS.map((t) => (
              <a key={t.id} href={`#${t.id}`} aria-current={view === t.id ? "page" : undefined}>{t.label}</a>
            ))}
          </nav>
          <SyncPill onOpen={() => setSyncOpen(true)} />
        </div>
      </header>

      <main className="wrap main" key={view + "/" + sub}>
        {view === "today" && <Today />}
        {view === "path" && <Path go={go} />}
        {view === "technique" && <Technique />}
        {view === "study" && <Study sub={sub} />}
        {view === "log" && <Log />}
      </main>

      <Metronome />
      {syncOpen && <SyncSheet onClose={() => setSyncOpen(false)} />}

      <nav className="tabbar" aria-label="Sections">
        {TABS.map(({ id, label, Icon }) => (
          <a key={id} href={`#${id}`} aria-current={view === id ? "page" : undefined}>
            <Icon />
            <span>{label}</span>
          </a>
        ))}
      </nav>
    </>
  );
}
