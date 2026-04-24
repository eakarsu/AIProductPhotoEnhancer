import React, { useState } from 'react';
import {
  Sparkles,
  ChevronDown,
  ChevronUp,
  Brain,
  Zap,
  Target,
  Lightbulb,
  Palette,
  CheckCircle,
  AlertCircle,
  Star,
  TrendingUp
} from 'lucide-react';

function AIResultDisplay({ data, title = "AI Analysis Results" }) {
  const [expandedSections, setExpandedSections] = useState({});

  const toggleSection = (key) => {
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const renderValue = (value, key, depth = 0) => {
    if (value === null || value === undefined) {
      return <span className="text-slate-500 italic">N/A</span>;
    }

    if (typeof value === 'boolean') {
      return value ? (
        <span className="flex items-center gap-1 text-emerald-400">
          <CheckCircle size={14} /> Yes
        </span>
      ) : (
        <span className="flex items-center gap-1 text-rose-400">
          <AlertCircle size={14} /> No
        </span>
      );
    }

    if (typeof value === 'number') {
      // Check if it looks like a score or percentage
      if (key?.toLowerCase().includes('score') || key?.toLowerCase().includes('percentage') || value <= 100) {
        const color = value >= 80 ? 'emerald' : value >= 60 ? 'amber' : 'rose';
        return (
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden max-w-[100px]">
              <div
                className={`h-full bg-${color}-500 rounded-full transition-all duration-500`}
                style={{ width: `${Math.min(value, 100)}%` }}
              />
            </div>
            <span className={`text-${color}-400 font-semibold`}>{value}%</span>
          </div>
        );
      }
      return <span className="text-sky-400 font-mono">{value}</span>;
    }

    if (typeof value === 'string') {
      // Check for hex colors
      if (value.match(/^#[0-9A-Fa-f]{6}$/)) {
        return (
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded-md border border-slate-600"
              style={{ backgroundColor: value }}
            />
            <span className="text-slate-300 font-mono text-sm">{value}</span>
          </div>
        );
      }
      // Long text gets special treatment
      if (value.length > 100) {
        return <p className="text-slate-300 text-sm leading-relaxed">{value}</p>;
      }
      return <span className="text-slate-300">{value}</span>;
    }

    if (Array.isArray(value)) {
      if (value.length === 0) {
        return <span className="text-slate-500 italic">Empty</span>;
      }

      // Check if array of simple values
      if (typeof value[0] !== 'object') {
        return (
          <div className="flex flex-wrap gap-2">
            {value.map((item, i) => (
              <span
                key={i}
                className="px-2 py-1 bg-slate-700/50 border border-slate-600 rounded-md text-sm text-slate-300"
              >
                {String(item)}
              </span>
            ))}
          </div>
        );
      }

      // Array of objects - render as cards
      return (
        <div className="space-y-3 mt-2">
          {value.map((item, i) => (
            <div key={i} className="p-3 bg-slate-800/50 border border-slate-700 rounded-lg">
              {renderValue(item, null, depth + 1)}
            </div>
          ))}
        </div>
      );
    }

    if (typeof value === 'object') {
      const entries = Object.entries(value);
      const isExpanded = expandedSections[key] !== false;

      return (
        <div className={depth > 0 ? '' : 'mt-2'}>
          {depth === 0 && key && (
            <button
              onClick={() => toggleSection(key)}
              className="flex items-center gap-2 w-full text-left mb-2 hover:text-sky-400 transition-colors"
            >
              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              <span className="font-medium">{formatKey(key)}</span>
            </button>
          )}
          {isExpanded && (
            <div className={`space-y-3 ${depth > 0 ? '' : 'pl-4 border-l-2 border-slate-700'}`}>
              {entries.map(([k, v]) => (
                <div key={k}>
                  <div className="flex items-start gap-2">
                    <span className="text-slate-400 text-sm font-medium min-w-[120px]">
                      {formatKey(k)}:
                    </span>
                    <div className="flex-1">
                      {renderValue(v, k, depth + 1)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    return <span className="text-slate-300">{String(value)}</span>;
  };

  const formatKey = (key) => {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/_/g, ' ')
      .replace(/^\w/, c => c.toUpperCase())
      .trim();
  };

  const getIcon = (key) => {
    const keyLower = key?.toLowerCase() || '';
    if (keyLower.includes('analysis') || keyLower.includes('assessment')) return Brain;
    if (keyLower.includes('recommendation') || keyLower.includes('suggestion')) return Lightbulb;
    if (keyLower.includes('color') || keyLower.includes('palette')) return Palette;
    if (keyLower.includes('score') || keyLower.includes('quality')) return Star;
    if (keyLower.includes('improvement') || keyLower.includes('enhance')) return TrendingUp;
    if (keyLower.includes('concept') || keyLower.includes('idea')) return Target;
    return Zap;
  };

  if (!data) {
    return (
      <div className="ai-result rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-slate-700 rounded-lg">
            <Brain className="w-5 h-5 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-white">No AI Analysis Available</h3>
        </div>
        <p className="text-slate-400">Run AI analysis to see results here.</p>
      </div>
    );
  }

  const displayData = data.data || data;

  return (
    <div className="ai-result rounded-xl overflow-hidden">
      {/* Header */}
      <div className="ai-result-header px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-lg">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">{title}</h3>
            {data.model && (
              <p className="text-sm text-white/70">Model: {data.model}</p>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {Object.entries(displayData).map(([key, value]) => {
          if (key === 'text' && typeof value === 'string') {
            return (
              <div key={key} className="p-4 bg-slate-800/50 rounded-lg">
                <p className="text-slate-300 leading-relaxed">{value}</p>
              </div>
            );
          }

          const Icon = getIcon(key);
          return (
            <div key={key} className="border-b border-slate-700/50 pb-4 last:border-0 last:pb-0">
              <div className="flex items-center gap-2 mb-3">
                <Icon className="w-4 h-4 text-sky-400" />
                <h4 className="text-white font-medium">{formatKey(key)}</h4>
              </div>
              <div className="pl-6">
                {renderValue(value, key, 0)}
              </div>
            </div>
          );
        })}

        {/* Usage info */}
        {data.usage && (
          <div className="mt-4 pt-4 border-t border-slate-700/50">
            <div className="flex items-center gap-4 text-xs text-slate-500">
              <span>Tokens: {data.usage.total_tokens || 'N/A'}</span>
              {data.usage.prompt_tokens && (
                <span>Prompt: {data.usage.prompt_tokens}</span>
              )}
              {data.usage.completion_tokens && (
                <span>Completion: {data.usage.completion_tokens}</span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AIResultDisplay;
