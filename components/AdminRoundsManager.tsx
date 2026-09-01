"use client";

import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Round = { id: string; name: string; event_date: string | null; venue: string | null };
type Draft = { name: string; event_date: string; venue: string };

const emptyDraft: Draft = { name: "", event_date: "", venue: "" };

export default function AdminRoundsManager({ initialRounds }: { initialRounds: Round[] }) {
  const [rounds, setRounds] = useState(initialRounds);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  function change(field: keyof Draft, value: string) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true); setMessage("");
    const supabase = createClient();
    const payload = { name: draft.name.trim(), event_date: draft.event_date || null, venue: draft.venue.trim() || null };
    if (!payload.name) { setMessage("Please enter a round name."); setSaving(false); return; }

    if (editingId) {
      const { data, error } = await supabase.from("rounds").update(payload).eq("id", editingId).select().single();
      if (error) setMessage(error.message);
      else { setRounds((items) => items.map((item) => item.id === editingId ? data : item)); setMessage("Round updated."); setEditingId(null); setDraft(emptyDraft); }
    } else {
      const { data, error } = await supabase.from("rounds").insert(payload).select().single();
      if (error) setMessage(error.message);
      else { setRounds((items) => [...items, data].sort((a,b) => (a.event_date || "").localeCompare(b.event_date || ""))); setMessage("Round added."); setDraft(emptyDraft); }
    }
    setSaving(false);
  }

  function edit(round: Round) {
    setEditingId(round.id);
    setDraft({ name: round.name || "", event_date: round.event_date ? String(round.event_date).slice(0,10) : "", venue: round.venue || "" });
    setMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function remove(round: Round) {
    if (!window.confirm(`Delete “${round.name}”? This cannot be undone.`)) return;
    setMessage("");
    const { error } = await createClient().from("rounds").delete().eq("id", round.id);
    if (error) { setMessage(error.message); return; }
    setRounds((items) => items.filter((item) => item.id !== round.id));
    if (editingId === round.id) { setEditingId(null); setDraft(emptyDraft); }
    setMessage("Round deleted.");
  }

  return <>
    <form className="card space grid" onSubmit={save}>
      <h2>{editingId ? "Edit Round" : "Add Round"}</h2>
      <input className="input" value={draft.name} onChange={(e) => change("name", e.target.value)} placeholder="Round name" required />
      <div className="grid two">
        <div><label className="small muted">Event date</label><input className="input" type="date" value={draft.event_date} onChange={(e) => change("event_date", e.target.value)} /></div>
        <div><label className="small muted">Venue</label><input className="input" value={draft.venue} onChange={(e) => change("venue", e.target.value)} placeholder="Venue" /></div>
      </div>
      <div className="actions">
        <button className="btn" disabled={saving}>{saving ? "Saving..." : editingId ? "Save Changes" : "Add Round"}</button>
        {editingId && <button type="button" className="btn secondary" onClick={() => { setEditingId(null); setDraft(emptyDraft); }}>Cancel</button>}
      </div>
      {message && <p className="notice">{message}</p>}
    </form>

    <div className="grid space">
      <h2>Existing Rounds</h2>
      {rounds.map((round) => <div className="card" key={round.id}>
        <div className="grid two">
          <div><b>{round.name}</b><p className="muted">{round.event_date || "No date"}{round.venue ? ` · ${round.venue}` : ""}</p></div>
          <div className="actions"><button className="btn secondary" onClick={() => edit(round)}>Edit</button><button className="btn" onClick={() => remove(round)}>Delete</button></div>
        </div>
      </div>)}
      {!rounds.length && <p className="notice">No rounds have been added yet.</p>}
    </div>
  </>;
}
