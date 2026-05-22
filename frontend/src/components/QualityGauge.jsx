import React, { useEffect, useState } from 'react';
import {
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';

// VIZ 2 — Enhancement quality gauge (0-100%) with sharpness/color/lighting breakdown.
export default function QualityGauge() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/custom-views/quality-gauge');
        const j = await res.json();
        if (!cancelled) setData(j);
      } catch (e) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (loading) return <div className="text-slate-400 p-6">Loading quality scores…</div>;
  if (error)   return <div className="text-red-400 p-6">Error: {error}</div>;

  const chartData = data.breakdown.map((d, i) => ({ ...d, idx: i }));

  return (
    <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-5">
      <h2 className="text-lg font-semibold text-white mb-1">Enhancement Quality Gauge</h2>
      <p className="text-sm text-slate-400 mb-4">
        Overall quality score and per-dimension breakdown.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-center">
        <div className="relative h-64">
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart
              innerRadius="55%"
              outerRadius="100%"
              data={[{ name: 'Overall', value: data.overall, fill: '#22c55e' }]}
              startAngle={90}
              endAngle={-270}
            >
              <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
              <RadialBar dataKey="value" cornerRadius={12} background={{ fill: '#1e293b' }} />
            </RadialBarChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <div className="text-4xl font-bold text-white">{data.overall}%</div>
            <div className="text-xs text-slate-400">Overall quality</div>
          </div>
        </div>

        <div className="lg:col-span-2 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart
              innerRadius="20%"
              outerRadius="100%"
              data={chartData}
              startAngle={180}
              endAngle={0}
            >
              <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
              <RadialBar dataKey="value" cornerRadius={8} background={{ fill: '#1e293b' }} label={{ position: 'insideStart', fill: '#fff', fontSize: 12 }} />
              <Tooltip
                contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 6 }}
                labelStyle={{ color: '#e2e8f0' }}
              />
              <Legend
                iconSize={10}
                verticalAlign="bottom"
                wrapperStyle={{ color: '#cbd5e1', fontSize: 12 }}
              />
            </RadialBarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mt-4">
        {data.breakdown.map((d) => (
          <div key={d.name} className="bg-slate-900/60 border border-slate-700 rounded-lg p-3">
            <div className="text-xs text-slate-400">{d.name}</div>
            <div className="text-2xl font-bold" style={{ color: d.fill }}>{d.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
