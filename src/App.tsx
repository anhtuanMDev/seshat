import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { worldStore } from './store/worldStore';
import { useWorldTitle, useEvents, useCharacters } from './hooks/useWorldStore';
import { S, mkChar, mkEvent } from './lib/utils';
import { SideItem } from './components/ui';
import { buildExport } from './lib/export';
import { useEffect, useRef, useState } from 'react';
import { animate } from 'animejs/animation';

export default function App() {
  const title = useWorldTitle();
  const events = useEvents();
  const characters = useCharacters();
  const navigate = useNavigate();
  const location = useLocation();

  const addChar = () => {
    const c = mkChar(`Character ${characters.length + 1}`, "#c0392b");
    worldStore.characters.push(c);
    navigate(`/characters/${c.id}`);
  };
  const delChar = (id: string) => {
    worldStore.characters.set((prev: any[]) => prev.filter((c: any) => c.id !== id));
    worldStore.events.set((prev: any[]) => prev.map((e: any) => ({ ...e, characters: (e.characters || []).filter((x: string) => x !== id) })));
  };
  const addEvent = () => {
    const maxT = events.reduce((m: number, e: any) => Math.max(m, e.time), 0);
    const e = { ...mkEvent(), time: maxT + 1 };
    worldStore.events.push(e);
    navigate(`/events/${e.id}`);
  };
  const delEvent = (id: string) => {
    worldStore.events.set((prev: any[]) => prev.filter((e: any) => e.id !== id));
  };

  const selEvent = (location.pathname.startsWith('/events/') && location.pathname.split('/')[2]) || null;
  const selChar = (location.pathname.startsWith('/characters/') && location.pathname.split('/')[2]) || null;

  const sortedEvt = [...events].sort((a, b) => a.time - b.time);

  const worldCount = (worldStore.nations.get()?.length || 0) + (worldStore.techniques.get()?.length || 0) + (worldStore.ingredients.get()?.length || 0) + (worldStore.monsters.get()?.length || 0) + (worldStore.treasures.get()?.length || 0);

  const [showExport, setShowExport] = useState(false);
  const text = buildExport({ title, synopsis: worldStore.synopsis.get(), setting: worldStore.setting.get(), themes: worldStore.themes.get(), rules: worldStore.rules.get(), nations: worldStore.nations.get(), techniques: worldStore.techniques.get(), ingredients: worldStore.ingredients.get(), monsters: worldStore.monsters.get(), treasures: worldStore.treasures.get(), events, characters });

  const mainRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (mainRef.current) {
animate(mainRef.current, {
         opacity: [0, 1],
         translateY: [6, 0],
         duration: 220,
         easing: 'easeOutQuad',
       });
    }
  }, [location.pathname]);

  return (
    <div style={S.app}>
      <div style={S.top}>
        <span style={S.logo}>Seshat</span>
        <input value={title} onChange={e => worldStore.title.set(e.target.value)}
          style={{ ...S.input, width: 240, textAlign: "center", borderBottom: "none", fontSize: 13, color: "#555", letterSpacing: 1 }} />
        <button onClick={() => setShowExport(true)} style={{ ...S.ghost, letterSpacing: 2 }}>Export for AI</button>
        <button onClick={() => navigate("/fight")} style={{ ...S.ghost, letterSpacing: 2, color: location.pathname === "/fight" ? "#c0392b" : "#444", borderBottom: location.pathname === "/fight" ? "1px solid #c0392b" : "none" }}>⚔ Fight</button>
      </div>

      <div style={S.row}>
        <div style={S.side}>
          <div style={{ padding: "0 24px 10px" }}><button onClick={() => navigate("/")} style={{ ...S.ghost, fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: location.pathname === "/" && !selChar && !selEvent ? "#1a1a1a" : "#444" }}>{worldCount > 0 ? `World (${worldCount})` : "World"}</button></div>
          <div style={{ height: 1, background: "#e0ddd8", margin: "4px 0 10px" }} />
          <div style={{ padding: "0 24px 8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <button onClick={() => navigate("/")} style={{ ...S.ghost, fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: location.pathname.startsWith("/events") || location.pathname === "/"? "#1a1a1a" : "#444" }}>Timeline</button>
            <button onClick={addEvent} style={{ ...S.ghost, fontSize: 16 }}>+</button>
          </div>
          {sortedEvt.map((e: any) => {
            const tag = [e.chapter && `Ch.${e.chapter}`, e.date].filter(Boolean).join(" · ");
            return (
              <SideItem key={e.id} label={e.title}
                sub={`T${e.time}${tag ? ` · ${tag}` : ""}${e.type ? ` · ${e.type}` : ""}`}
                active={selEvent === e.id}
                onClick={() => navigate(`/events/${e.id}`)}
                onDelete={() => delEvent(e.id)} />
            );
          })}
          <div style={{ height: 1, background: "#e0ddd8", margin: "12px 0 10px" }} />
          <div style={{ padding: "0 24px 8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <button onClick={() => navigate("/")} style={{ ...S.ghost, fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: location.pathname.startsWith("/characters") || location.pathname === "/"? "#1a1a1a" : "#444" }}>Characters</button>
            <button onClick={addChar} style={{ ...S.ghost, fontSize: 16 }}>+</button>
          </div>
          {characters.map((c: any) => (
            <SideItem key={c.id} label={c.name}
              sub={[c.role, c.archetype].filter(Boolean).join(" · ") || undefined}
              color={c.color}
              active={selChar === c.id}
              onClick={() => navigate(`/characters/${c.id}`)}
              onDelete={() => delChar(c.id)} />
          ))}
        </div>

        <div style={S.main} ref={mainRef}>
          <Outlet />
        </div>
      </div>

      {showExport && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(250,249,247,0.94)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ width: "min(700px,92vw)", display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={S.h2}>Export for AI</span>
              <div style={{ display: "flex", gap: 20 }}>
                <button onClick={() => { navigator.clipboard.writeText(text); }} style={{ ...S.ghost }}>Copy all</button>
                <button onClick={() => setShowExport(false)} style={S.ghost}>Close</button>
              </div>
            </div>
            <p style={S.dim}>Paste into your AI's system prompt. Full psychology, conditions, skills, equipment, achievements, losses, relationships, world entities, and behavioral guidance.</p>
            <textarea readOnly value={text} style={{
              ...S.textarea, borderBottom: "none", background: "#f0ede8", padding: 20, borderRadius: 4,
              height: 460, resize: "none", fontFamily: "monospace", fontSize: 12, lineHeight: 1.7,
            }} />
          </div>
        </div>
      )}
    </div>
  );
}