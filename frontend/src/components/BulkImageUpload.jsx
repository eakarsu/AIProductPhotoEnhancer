import React, { useCallback, useRef, useState } from 'react';

// NON-VIZ 1 — Drag-and-drop multi-image upload with per-file progress bars and queue status.
// Uploads to /api/custom-views/bulk-upload (multer multi-file).
export default function BulkImageUpload() {
  const [items, setItems] = useState([]); // { id, file, progress, status, name, size }
  const [dragOver, setDragOver] = useState(false);
  const [serverQueue, setServerQueue] = useState([]);
  const inputRef = useRef(null);

  const addFiles = useCallback((fileList) => {
    const next = Array.from(fileList).map((f) => ({
      id: `${f.name}-${f.size}-${Math.random().toString(36).slice(2, 8)}`,
      file: f,
      progress: 0,
      status: 'pending',
      name: f.name,
      size: f.size,
    }));
    setItems((prev) => [...prev, ...next]);
  }, []);

  const onPick = (e) => {
    if (e.target.files?.length) addFiles(e.target.files);
    e.target.value = '';
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
  };

  const removeItem = (id) => setItems((prev) => prev.filter((i) => i.id !== id));
  const clearAll = () => { setItems([]); setServerQueue([]); };

  const uploadOne = (item) =>
    new Promise((resolve) => {
      const xhr = new XMLHttpRequest();
      const fd = new FormData();
      fd.append('images', item.file, item.name);
      xhr.open('POST', '/api/custom-views/bulk-upload');
      const token = localStorage.getItem('token');
      if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      xhr.upload.onprogress = (evt) => {
        if (evt.lengthComputable) {
          const pct = Math.round((evt.loaded / evt.total) * 100);
          setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, progress: pct, status: 'uploading' } : i)));
        }
      };
      xhr.onload = () => {
        let parsed = null;
        try { parsed = JSON.parse(xhr.responseText); } catch {}
        const ok = xhr.status >= 200 && xhr.status < 300 && parsed?.ok;
        setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, progress: 100, status: ok ? 'done' : 'error' } : i)));
        if (ok && parsed.queue) setServerQueue((prev) => [...prev, ...parsed.queue]);
        resolve();
      };
      xhr.onerror = () => {
        setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, status: 'error' } : i)));
        resolve();
      };
      xhr.send(fd);
    });

  const uploadAll = async () => {
    const pending = items.filter((i) => i.status === 'pending');
    for (const it of pending) {
      // eslint-disable-next-line no-await-in-loop
      await uploadOne(it);
    }
  };

  const fmt = (n) => (n < 1024 ? `${n} B` : n < 1024 * 1024 ? `${(n / 1024).toFixed(1)} KB` : `${(n / 1024 / 1024).toFixed(2)} MB`);
  const statusColor = (s) => ({
    pending:   'text-slate-400',
    uploading: 'text-sky-300',
    done:      'text-emerald-400',
    error:     'text-red-400',
    queued:    'text-amber-300',
  }[s] || 'text-slate-300');

  return (
    <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-5">
      <h2 className="text-lg font-semibold text-white mb-1">Bulk Image Upload</h2>
      <p className="text-sm text-slate-400 mb-4">
        Drag &amp; drop multiple product photos. Each file shows live progress and queue status.
      </p>

      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`cursor-pointer border-2 border-dashed rounded-xl p-8 text-center transition ${
          dragOver ? 'border-sky-400 bg-sky-500/10' : 'border-slate-600 hover:border-slate-500'
        }`}
      >
        <div className="text-4xl mb-2">⬆</div>
        <div className="text-slate-200 font-medium">Drop images here or click to browse</div>
        <div className="text-xs text-slate-500 mt-1">PNG / JPG up to 10MB each, max 20 files</div>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={onPick}
        />
      </div>

      <div className="flex gap-2 mt-4">
        <button
          onClick={uploadAll}
          disabled={!items.some((i) => i.status === 'pending')}
          className="px-4 py-2 bg-sky-500 hover:bg-sky-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium"
        >
          Upload All ({items.filter((i) => i.status === 'pending').length})
        </button>
        <button
          onClick={clearAll}
          disabled={!items.length}
          className="px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white rounded-lg"
        >
          Clear
        </button>
      </div>

      {items.length > 0 && (
        <div className="mt-4 space-y-2">
          {items.map((it) => (
            <div key={it.id} className="bg-slate-900/60 border border-slate-700 rounded-lg p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="text-sm text-white truncate">{it.name}</div>
                  <div className="text-xs text-slate-500">{fmt(it.size)}</div>
                </div>
                <span className={`text-xs font-semibold uppercase ${statusColor(it.status)}`}>{it.status}</span>
                <button
                  onClick={() => removeItem(it.id)}
                  className="text-xs text-slate-400 hover:text-red-400"
                >remove</button>
              </div>
              <div className="mt-2 h-2 bg-slate-800 rounded overflow-hidden">
                <div
                  className={`h-full transition-all duration-200 ${
                    it.status === 'error' ? 'bg-red-500' : it.status === 'done' ? 'bg-emerald-500' : 'bg-sky-500'
                  }`}
                  style={{ width: `${it.progress}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {serverQueue.length > 0 && (
        <div className="mt-5">
          <h3 className="text-sm font-semibold text-slate-200 mb-2">Enhancement Queue</h3>
          <div className="space-y-1">
            {serverQueue.map((q, i) => (
              <div key={`${q.name}-${i}`} className="flex items-center justify-between text-xs bg-slate-900/40 border border-slate-700 rounded px-3 py-1.5">
                <span className="text-slate-200 truncate">{q.name}</span>
                <span className={statusColor(q.status)}>{q.status} • ETA {q.etaSec}s</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
