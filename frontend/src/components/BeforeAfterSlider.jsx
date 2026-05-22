import React, { useEffect, useRef, useState } from 'react';

// VIZ 1 — Interactive before/after slider for product photo enhancement.
// Backed by /api/custom-views/before-after which returns Unsplash placeholder pairs.
export default function BeforeAfterSlider() {
  const [pairs, setPairs] = useState([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [pos, setPos] = useState(50);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const containerRef = useRef(null);
  const dragging = useRef(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/custom-views/before-after');
        const data = await res.json();
        if (!cancelled) setPairs(data.pairs || []);
      } catch (e) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const onMove = (clientX) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
    setPos((x / rect.width) * 100);
  };

  const onMouseDown = () => { dragging.current = true; };
  const onMouseUp   = () => { dragging.current = false; };
  const onMouseMove = (e) => { if (dragging.current) onMove(e.clientX); };
  const onTouchMove = (e) => { if (e.touches[0]) onMove(e.touches[0].clientX); };

  useEffect(() => {
    window.addEventListener('mouseup', onMouseUp);
    return () => window.removeEventListener('mouseup', onMouseUp);
  }, []);

  if (loading) return <div className="text-slate-400 p-6">Loading sample pairs…</div>;
  if (error)   return <div className="text-red-400 p-6">Error: {error}</div>;
  if (!pairs.length) return <div className="text-slate-400 p-6">No pairs available.</div>;

  const pair = pairs[activeIdx];

  // SVG placeholder fallback (solid-color) used if Unsplash fails to load.
  const fallback = (label, color) =>
    `data:image/svg+xml;utf8,${encodeURIComponent(
      `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 600 400'>
        <rect width='600' height='400' fill='${color}'/>
        <text x='300' y='210' text-anchor='middle' fill='#fff' font-family='Arial' font-size='40' font-weight='bold'>${label}</text>
      </svg>`
    )}`;

  return (
    <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-5">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-lg font-semibold text-white">Before / After Slider</h2>
          <p className="text-sm text-slate-400">{pair.title}</p>
        </div>
        <div className="flex gap-2">
          {pairs.map((p, i) => (
            <button
              key={p.id}
              onClick={() => { setActiveIdx(i); setPos(50); }}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                i === activeIdx
                  ? 'bg-sky-500 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              {`Pair ${i + 1}`}
            </button>
          ))}
        </div>
      </div>

      <div
        ref={containerRef}
        className="relative w-full select-none overflow-hidden rounded-lg border border-slate-600"
        style={{ aspectRatio: '3 / 2', cursor: 'ew-resize' }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onTouchStart={onMouseDown}
        onTouchMove={onTouchMove}
        onTouchEnd={onMouseUp}
      >
        <img
          src={pair.after}
          onError={(e) => { e.currentTarget.src = fallback('AFTER', '#16a34a'); }}
          alt="after"
          className="absolute inset-0 w-full h-full object-cover"
          draggable={false}
        />
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ width: `${pos}%` }}
        >
          <img
            src={pair.before}
            onError={(e) => { e.currentTarget.src = fallback('BEFORE', '#475569'); }}
            alt="before"
            className="absolute inset-0 h-full object-cover"
            style={{ width: `${100 / (pos / 100 || 0.0001)}%`, maxWidth: 'none' }}
            draggable={false}
          />
        </div>
        <div
          className="absolute top-0 bottom-0 bg-white"
          style={{ left: `calc(${pos}% - 1px)`, width: 2 }}
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white shadow-lg flex items-center justify-center text-slate-900 font-bold"
          style={{ left: `calc(${pos}% - 18px)` }}
        >
          ⇆
        </div>
        <span className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded">BEFORE</span>
        <span className="absolute top-2 right-2 bg-emerald-600/80 text-white text-xs px-2 py-0.5 rounded">AFTER</span>
      </div>

      <div className="mt-3 text-xs text-slate-400">
        Improvement score:&nbsp;
        <span className="text-emerald-400 font-semibold">+{Math.round(pair.improvement * 100)}%</span>
        &nbsp;• drag handle to compare
      </div>
    </div>
  );
}
