import { useParams } from 'react-router-dom';
import { useSelector } from '@legendapp/state/react';
import { worldStore } from '../store/worldStore';
import { useCharacters } from '../hooks/useWorldStore';
import { S } from '../lib/utils';
import { Field, Sel, Section } from '../components/ui';
import { EVENT_TYPES, POWER_TIERS, DIFFICULTY, ARC_STAGES } from '../lib/constants';
import { useAnimateIn } from '../hooks/useAnimateIn';

export default function EventPage() {
   const { id } = useParams();
   const characters = useCharacters();

  const event = useSelector(() => (worldStore.events.get() as any[]).find((e: any) => e.id === id)?.get());
  const eventIdx = useSelector(() => worldStore.events.get().findIndex((e: any) => e.id === id));

  if (!event) return <div style={{ padding: "40px" }}>Event not found.</div>;

const up = (f: string, v: any) => (worldStore.events[eventIdx] as any)[f].set(v);
   const toggleChar = (cid: string) => {
     const cur = event.characters || [];
     up("characters", cur.includes(cid) ? cur.filter((x: string) => x !== cid) : [...cur, cid]);
   };
   const upAttr = (cid: string, f: string, v: any) => {
     const cIdx = worldStore.characters.get().findIndex((c: any) => c.id === cid);
     if (cIdx >= 0) {
       const attr = (worldStore.characters[cIdx].attributes as any)?.[event.id]?.get() || {};
       (worldStore.characters[cIdx].attributes as any)[event.id].set({ ...attr, [f]: v });
     }
   };
   const getAttr = (cid: string) => (worldStore.characters.get().find((c: any) => c.id === cid)?.attributes as any)?.[event.id]?.get() || {};

  const ref = useAnimateIn();

  return (
    <div ref={ref}>
      <input value={event.title} onChange={e => up("title", e.target.value)}
        style={{ ...S.input, fontSize: 22, borderBottom: "none", padding: 0, marginBottom: 16 }} />
      <div style={{ display: "grid", gridTemplateColumns: "56px auto 1fr 1fr", gap: "0 24px", marginBottom: 16, alignItems: "end" }}>
        <div>
          <label style={S.label}>Time</label>
          <input type="number" value={event.time} onChange={e => up("time", +e.target.value)} style={{ ...S.input, width: 52 }} />
        </div>
        <div>
          <label style={S.label}>Type</label>
          <select value={event.type} onChange={e => up("type", e.target.value)} style={S.select}>
            {EVENT_TYPES.map(o => <option key={o}>{o}</option>)}
          </select>
        </div>
        <Field label="Chapter" value={event.chapter || ""} onChange={v => up("chapter", v)} placeholder="3 or Prologue" />
        <Field label="Date / Period" value={event.date || ""} onChange={v => up("date", v)} placeholder="March 1842" />
      </div>
      <Field label="Setting / location" value={event.setting || ""} onChange={v => up("setting", v)} placeholder="Where and what it feels like here…" />
      <Field label="What happens" value={event.description || ""} onChange={v => up("description", v)} multi rows={3} />
      <Field label="Consequence / after-effects" value={event.consequence || ""} onChange={v => up("consequence", v)} multi rows={2} />

      <Section title="Characters present">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
          {characters.map((c: any) => (
            <button key={c.id} onClick={() => toggleChar(c.id)} style={{
              ...S.pill, color: event.characters?.includes(c.id) ? c.color : "#aaa",
              borderColor: event.characters?.includes(c.id) ? c.color : "#ccc",
            }}>{c.name}</button>
          ))}
          {!characters.length && <span style={S.dim}>Add characters first.</span>}
        </div>
        {(event.characters || []).map((cid: string) => {
          const c = characters.find((x: any) => x.id === cid);
          if (!c) return null;
          const a = getAttr(cid);
          return (
            <div key={cid} style={{ marginBottom: 28, paddingLeft: 14, borderLeft: `2px solid ${c.color}60` }}>
              <p style={{ ...S.dim, marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: c.color, display: "inline-block" }} />
                {c.name}
              </p>
              <div style={S.grid3}>
                <Sel label="Power tier" value={a.power || ""} onChange={v => upAttr(cid, "power", v)} opts={POWER_TIERS} />
                <Sel label="Difficulty faced" value={a.difficulty || ""} onChange={v => upAttr(cid, "difficulty", v)} opts={DIFFICULTY} />
                <Sel label="Arc stage" value={a.arcStage || ""} onChange={v => upAttr(cid, "arcStage", v)} opts={ARC_STAGES} />
                <Field label="Emotional state" value={a.emotionalState || ""} onChange={v => upAttr(cid, "emotionalState", v)} placeholder="Grief, resolute…" />
                <Field label="Physical state" value={a.physicalState || ""} onChange={v => upAttr(cid, "physicalState", v)} placeholder="Injured, peak…" />
                <Field label="Scene motive" value={a.sceneMotive || ""} onChange={v => upAttr(cid, "sceneMotive", v)} placeholder="What they want right now" />
              </div>
              <div style={S.grid2}>
                <Field label="Knowledge held" value={a.knowledge || ""} onChange={v => upAttr(cid, "knowledge", v)} placeholder="What they know here…" />
                <Field label="Active beliefs" value={a.beliefs || ""} onChange={v => upAttr(cid, "beliefs", v)} placeholder="Truths they hold now…" />
                <Field label="Secret in this scene" value={a.secret || ""} onChange={v => upAttr(cid, "secret", v)} placeholder="What they're hiding here…" />
                <Field label="Trauma surfacing" value={a.traumaActive || ""} onChange={v => upAttr(cid, "traumaActive", v)} placeholder="Which wound is active?" />
              </div>
              <div style={S.grid2}>
                <Field label="Before this event" value={a.arcBefore || ""} onChange={v => upAttr(cid, "arcBefore", v)} placeholder="Who they are walking in…" />
                <Field label="After this event" value={a.arcAfter || ""} onChange={v => upAttr(cid, "arcAfter", v)} placeholder="How this changes them…" />
              </div>
              <Field label="AI narrator note" value={a.notes || ""} onChange={v => upAttr(cid, "notes", v)} multi rows={2}
                placeholder="Private instruction. Subtext, what they can't say, how to betray the wound without naming it." />
            </div>
          );
        })}
      </Section>
    </div>
  );
}