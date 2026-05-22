import React, { useEffect, useState } from 'react';

// NON-VIZ 2 — CRUD on enhancement presets (name + 4 slider values).
// Talks to /api/custom-views/presets (GET/POST/PUT/DELETE).
const BLANK = { name: '', sharpness: 50, brightness: 50, contrast: 50, saturation: 50 };

export default function PresetEditor() {
  const [presets, setPresets] = useState([]);
  const [draft, setDraft] = useState(BLANK);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [msg, setMsg] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/custom-views/presets');
      const j = await res.json();
      setPresets(j.presets || []);
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const reset = () => { setDraft(BLANK); setEditingId(null); };

  const save = async () => {
    if (!draft.name.trim()) { setError('Name is required'); return; }
    try {
      const url = editingId ? `/api/custom-views/presets/${editingId}` : '/api/custom-views/presets';
      const method = editingId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft),
      });
      const j = await res.json();
      if (!j.ok) throw new Error(j.error || 'save failed');
      setMsg(editingId ? `Updated "${j.preset.name}"` : `Created "${j.preset.name}"`);
      setTimeout(() => setMsg(null), 2200);
      reset();
      load();
    } catch (e) {
      setError(e.message);
    }
  };

  const edit = (p) => {
    setDraft({
      name: p.name,
      sharpness: p.sharpness,
      brightness: p.brightness,
      contrast: p.contrast,
      saturation: p.saturation,
    });
    setEditingId(p.id);
  };

  const remove = async (id) => {
    if (!confirm('Delete this preset?')) return;
    try {
      const res = await fetch(`/api/custom-views/presets/${id}`, { method: 'DELETE' });
      const j = await res.json();
      if (!j.ok) throw new Error(j.error || 'delete failed');
      if (editingId === id) reset();
      load();
    } catch (e) {
      setError(e.message);
    }
  };

  const slider = (key, label, color) => (
    <div className="mb-3">
      <div className="flex justify-between text-xs mb-1">
        <span className="text-slate-300 font-medium">{label}</span>
        <span className="font-mono" style={{ color }}>{draft[key]}</span>
      </div>
      <input
        type="range"
        min="0"
        max="100"
        value={draft[key]}
        onChange={(e) => setDraft({ ...draft, [key]: parseInt(e.target.value, 10) })}
        className="w-full accent-sky-500"
      />
    </div>
  );

  return (
    <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-5">
      <h2 className="text-lg font-semibold text-white mb-1">Enhancement Preset Editor</h2>
      <p className="text-sm text-slate-400 mb-4">
        Create and manage named presets used by the enhancement pipeline.
      </p>

      {error && <div className="bg-red-900/40 border border-red-700 text-red-200 text-sm rounded p-2 mb-3">{error}</div>}
      {msg   && <div className="bg-emerald-900/40 border border-emerald-700 text-emerald-200 text-sm rounded p-2 mb-3">{msg}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-slate-900/60 border border-slate-700 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-white mb-3">
            {editingId ? `Editing preset #${editingId}` : 'New preset'}
          </h3>
          <input
            type="text"
            placeholder="Preset name (e.g. Studio Bright)"
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            className="w-full bg-slate-800 border border-slate-700 text-white rounded px-3 py-2 mb-4 focus:outline-none focus:border-sky-500"
          />
          {slider('sharpness',  'Sharpness',  '#38bdf8')}
          {slider('brightness', 'Brightness', '#fbbf24')}
          {slider('contrast',   'Contrast',   '#a78bfa')}
          {slider('saturation', 'Saturation', '#34d399')}
          <div className="flex gap-2 mt-4">
            <button
              onClick={save}
              className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-lg font-medium"
            >
              {editingId ? 'Update preset' : 'Save preset'}
            </button>
            {editingId && (
              <button onClick={reset} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg">Cancel</button>
            )}
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-700 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-white mb-3">Saved presets</h3>
          {loading && <div className="text-slate-400 text-sm">Loading…</div>}
          {!loading && presets.length === 0 && <div className="text-slate-500 text-sm">No presets yet.</div>}
          <div className="space-y-2 max-h-96 overflow-auto">
            {presets.map((p) => (
              <div key={p.id} className="border border-slate-700 rounded-lg p-3 bg-slate-800/40">
                <div className="flex items-center justify-between gap-2">
                  <div className="font-medium text-white">{p.name}</div>
                  <div className="flex gap-2">
                    <button onClick={() => edit(p)}   className="text-xs px-2 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded">edit</button>
                    <button onClick={() => remove(p.id)} className="text-xs px-2 py-1 bg-red-700/70 hover:bg-red-700 text-white rounded">delete</button>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-2 mt-2 text-xs">
                  <Stat label="Sharp"  v={p.sharpness}  c="#38bdf8" />
                  <Stat label="Bright" v={p.brightness} c="#fbbf24" />
                  <Stat label="Cont"   v={p.contrast}   c="#a78bfa" />
                  <Stat label="Sat"    v={p.saturation} c="#34d399" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, v, c }) {
  return (
    <div className="bg-slate-900 rounded px-2 py-1">
      <div className="text-slate-500">{label}</div>
      <div className="font-mono" style={{ color: c }}>{v}</div>
    </div>
  );
}
