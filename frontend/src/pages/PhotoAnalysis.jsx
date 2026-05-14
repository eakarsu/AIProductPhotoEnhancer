import React, { useState, useEffect } from 'react';
import { Eye, Sparkles, Loader2, Image as ImageIcon, RefreshCw, Tag, FileText, Layers } from 'lucide-react';
import { productsAPI, photosAPI } from '../services/api';
import { useToast } from '../components/Toast';

function ScoreBadge({ score, label }) {
  const color = score >= 80 ? 'text-emerald-400' : score >= 60 ? 'text-amber-400' : 'text-rose-400';
  const bg = score >= 80 ? 'bg-emerald-500/20' : score >= 60 ? 'bg-amber-500/20' : 'bg-rose-500/20';
  return (
    <div className={`flex flex-col items-center p-3 ${bg} rounded-xl`}>
      <span className={`text-2xl font-bold ${color}`}>{score}</span>
      <span className="text-xs text-slate-400 mt-1">{label}</span>
    </div>
  );
}

function Section({ title, items, color = 'text-slate-300' }) {
  if (!items || items.length === 0) return null;
  return (
    <div>
      <h4 className="text-sm font-semibold text-slate-400 mb-2">{title}</h4>
      <ul className="space-y-1">
        {items.map((item, i) => (
          <li key={i} className={`text-sm ${color} flex items-start gap-2`}>
            <span className="mt-0.5 text-slate-500">•</span>{item}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function PhotoAnalysis() {
  const toast = useToast();
  const [products, setProducts] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [altText, setAltText] = useState(null);
  const [bgAnalysis, setBgAnalysis] = useState(null);
  const [description, setDescription] = useState(null);
  const [activeTab, setActiveTab] = useState('analyze');
  const [loadingTab, setLoadingTab] = useState(false);

  useEffect(() => {
    productsAPI.getAll().then(r => {
      const list = Array.isArray(r.data) ? r.data : (r.data?.data || []);
      setProducts(list);
      if (list.length > 0) setSelectedId(String(list[0].id));
    }).catch(() => toast.error('Failed to load products'));
  }, []);

  const selectedProduct = products.find(p => String(p.id) === selectedId);

  const handleAnalyze = async () => {
    if (!selectedId) return;
    setLoading(true);
    setAnalysis(null);
    try {
      const res = await photosAPI.analyze(selectedId);
      setAnalysis(res.data);
      toast.success('Vision analysis complete');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  const handleTabAction = async (tab) => {
    if (!selectedId) return;
    setActiveTab(tab);
    setLoadingTab(true);
    try {
      if (tab === 'alttext') {
        const res = await photosAPI.generateAltText(selectedId);
        setAltText(res.data.alt_text_data);
      } else if (tab === 'background') {
        const res = await photosAPI.backgroundAnalysis(selectedId);
        setBgAnalysis(res.data.analysis);
      } else if (tab === 'description') {
        const res = await photosAPI.generateDescription(selectedId);
        setDescription(res.data.description);
      }
      toast.success('Complete');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed');
    } finally {
      setLoadingTab(false);
    }
  };

  const tabs = [
    { id: 'analyze', label: 'Vision Analysis', icon: Eye },
    { id: 'alttext', label: 'Alt Text', icon: Tag },
    { id: 'background', label: 'Background', icon: Layers },
    { id: 'description', label: 'Description', icon: FileText },
  ];

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl">
              <Eye className="w-6 h-6 text-white" />
            </div>
            Photo Vision Analysis
          </h1>
          <p className="text-slate-400 mt-1">Real AI vision analysis of your actual product images</p>
        </div>
      </div>

      {/* Product Selector */}
      <div className="glass rounded-xl p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-300 mb-2">Select Product</label>
            <select value={selectedId} onChange={(e) => { setSelectedId(e.target.value); setAnalysis(null); setAltText(null); setBgAnalysis(null); setDescription(null); }}
              className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:border-violet-500">
              <option value="">Choose a product...</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.name} {p.original_image ? '' : '(no image)'}</option>
              ))}
            </select>
          </div>
          {selectedProduct?.original_image && (
            <div className="w-20 h-20 rounded-xl overflow-hidden bg-slate-800 flex-shrink-0">
              <img src={selectedProduct.original_image} alt={selectedProduct.name} className="w-full h-full object-cover" />
            </div>
          )}
        </div>
        {selectedProduct && !selectedProduct.original_image && (
          <p className="text-amber-400 text-sm mt-2">This product has no image. Upload one first in the Products page.</p>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${activeTab === tab.id ? 'bg-violet-500/20 text-violet-400 border border-violet-500/30' : 'bg-slate-800/50 text-slate-400 border border-slate-700 hover:text-white'}`}>
              <Icon size={16} /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'analyze' && (
        <div className="space-y-4">
          <button onClick={handleAnalyze} disabled={!selectedId || !selectedProduct?.original_image || loading}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-500 to-purple-600 text-white font-medium rounded-xl hover:opacity-90 transition-all disabled:opacity-50">
            {loading ? <><Loader2 size={20} className="animate-spin" /> Analyzing...</> : <><Sparkles size={20} /> Run Vision Analysis</>}
          </button>

          {analysis?.analysis && (
            <div className="glass rounded-xl p-6 space-y-6">
              <div className="flex flex-col md:flex-row gap-6">
                {selectedProduct?.original_image && (
                  <div className="w-full md:w-1/3">
                    <img src={selectedProduct.original_image} alt={selectedProduct.name} className="w-full h-48 object-contain bg-slate-900 rounded-xl" />
                  </div>
                )}
                <div className="flex-1 space-y-4">
                  <h3 className="text-lg font-semibold text-white">{analysis.product_name}</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <ScoreBadge score={analysis.analysis.composition_score || 0} label="Composition" />
                    <ScoreBadge score={analysis.analysis.ecommerce_readiness_score || 0} label="E-comm Ready" />
                  </div>
                  {analysis.analysis.background_quality && (
                    <div><span className="text-xs text-slate-500 uppercase">Background</span><p className="text-slate-300 text-sm mt-1">{analysis.analysis.background_quality}</p></div>
                  )}
                  {analysis.analysis.lighting_assessment && (
                    <div><span className="text-xs text-slate-500 uppercase">Lighting</span><p className="text-slate-300 text-sm mt-1">{analysis.analysis.lighting_assessment}</p></div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Section title="Detected Products" items={analysis.analysis.detected_products} />
                <Section title="Enhancement Suggestions" items={analysis.analysis.enhancement_suggestions} color="text-amber-300" />
                <Section title="Strengths" items={analysis.analysis.strengths} color="text-emerald-300" />
                <Section title="Issues" items={analysis.analysis.issues} color="text-rose-300" />
              </div>

              {analysis.analysis.detected_colors?.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-slate-400 mb-2">Detected Colors</h4>
                  <div className="flex gap-2 flex-wrap">
                    {analysis.analysis.detected_colors.map((color, i) => (
                      <div key={i} className="flex items-center gap-2 px-3 py-1 bg-slate-800 rounded-full text-xs text-slate-300">
                        {color.startsWith('#') && <div className="w-3 h-3 rounded-full border border-slate-600" style={{ background: color }} />}
                        {color}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === 'alttext' && (
        <div className="space-y-4">
          <button onClick={() => handleTabAction('alttext')} disabled={!selectedId || !selectedProduct?.original_image || loadingTab}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-sky-500 to-blue-600 text-white font-medium rounded-xl hover:opacity-90 disabled:opacity-50">
            {loadingTab ? <><Loader2 size={20} className="animate-spin" /> Generating...</> : <><Tag size={20} /> Generate Alt Text</>}
          </button>

          {altText?.alt_texts?.length > 0 && (
            <div className="glass rounded-xl p-6 space-y-4">
              <h3 className="font-semibold text-white">SEO Alt Text Variants</h3>
              {altText.alt_texts.map((at, i) => (
                <div key={i} className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs text-slate-500 uppercase">{at.use_case || `Variant ${i + 1}`}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${at.seo_score >= 80 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                      SEO: {at.seo_score}
                    </span>
                  </div>
                  <p className="text-white text-sm font-medium">{at.text}</p>
                  {at.keywords?.length > 0 && (
                    <div className="flex gap-1 flex-wrap mt-2">
                      {at.keywords.map((kw, j) => <span key={j} className="text-xs px-2 py-0.5 bg-slate-700 text-slate-400 rounded-full">{kw}</span>)}
                    </div>
                  )}
                  <button onClick={() => navigator.clipboard.writeText(at.text)} className="text-xs text-slate-500 hover:text-slate-300 mt-2">Copy</button>
                </div>
              ))}
              {altText.seo_tips?.length > 0 && <Section title="SEO Tips" items={altText.seo_tips} color="text-sky-300" />}
            </div>
          )}
        </div>
      )}

      {activeTab === 'background' && (
        <div className="space-y-4">
          <button onClick={() => handleTabAction('background')} disabled={!selectedId || !selectedProduct?.original_image || loadingTab}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-medium rounded-xl hover:opacity-90 disabled:opacity-50">
            {loadingTab ? <><Loader2 size={20} className="animate-spin" /> Analyzing...</> : <><Layers size={20} /> Analyze Background</>}
          </button>

          {bgAnalysis && (
            <div className="glass rounded-xl p-6 space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-slate-800/50 rounded-xl p-3 text-center">
                  <div className="text-sm font-semibold text-white">{bgAnalysis.background_type?.replace(/_/g, ' ')}</div>
                  <div className="text-xs text-slate-500 mt-1">Type</div>
                </div>
                <div className="bg-slate-800/50 rounded-xl p-3 text-center">
                  <div className={`text-sm font-semibold ${bgAnalysis.removal_difficulty === 'easy' ? 'text-emerald-400' : bgAnalysis.removal_difficulty === 'medium' ? 'text-amber-400' : 'text-rose-400'}`}>{bgAnalysis.removal_difficulty}</div>
                  <div className="text-xs text-slate-500 mt-1">Removal Difficulty</div>
                </div>
                <div className="bg-slate-800/50 rounded-xl p-3 text-center">
                  <div className="text-sm font-semibold text-white">{bgAnalysis.edge_complexity}</div>
                  <div className="text-xs text-slate-500 mt-1">Edge Complexity</div>
                </div>
                <div className="bg-slate-800/50 rounded-xl p-3 text-center">
                  <div className="text-sm font-semibold text-emerald-400">{bgAnalysis.estimated_quality_after}%</div>
                  <div className="text-xs text-slate-500 mt-1">Quality After</div>
                </div>
              </div>
              {bgAnalysis.removal_method && <div><span className="text-xs text-slate-500 uppercase">Recommended Method</span><p className="text-slate-300 text-sm mt-1">{bgAnalysis.removal_method}</p></div>}
              {bgAnalysis.suggested_backgrounds?.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-slate-400 mb-2">Suggested Replacement Backgrounds</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {bgAnalysis.suggested_backgrounds.map((bg, i) => (
                      <div key={i} className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                        <div className="font-medium text-white text-sm">{bg.name}</div>
                        <p className="text-slate-400 text-xs mt-1">{bg.description}</p>
                        {bg.use_case && <span className="text-xs text-sky-400">{bg.use_case}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <Section title="Removal Tips" items={bgAnalysis.removal_tips} color="text-amber-300" />
            </div>
          )}
        </div>
      )}

      {activeTab === 'description' && (
        <div className="space-y-4">
          <button onClick={() => handleTabAction('description')} disabled={!selectedId || !selectedProduct?.original_image || loadingTab}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-medium rounded-xl hover:opacity-90 disabled:opacity-50">
            {loadingTab ? <><Loader2 size={20} className="animate-spin" /> Generating...</> : <><FileText size={20} /> Generate Description</>}
          </button>

          {description && (
            <div className="glass rounded-xl p-6 space-y-4">
              {description.headline && <div className="text-xl font-bold text-white">{description.headline}</div>}
              {description.tagline && <div className="text-slate-400 italic">{description.tagline}</div>}
              {description.short_description && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                  <div className="text-xs text-emerald-400 font-semibold mb-1">SHORT DESCRIPTION</div>
                  <p className="text-white text-sm">{description.short_description}</p>
                </div>
              )}
              {description.long_description && (
                <div>
                  <div className="text-xs text-slate-500 uppercase mb-2">Full Description</div>
                  <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-line">{description.long_description}</p>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Section title="Key Features" items={description.key_features} color="text-sky-300" />
                <Section title="Visual Attributes" items={description.visual_attributes} />
                <Section title="Use Cases" items={description.use_cases} />
              </div>
              {description.seo_keywords?.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-slate-400 mb-2">SEO Keywords</h4>
                  <div className="flex gap-2 flex-wrap">
                    {description.seo_keywords.map((kw, i) => <span key={i} className="text-xs px-2 py-1 bg-slate-700 text-slate-300 rounded-full">{kw}</span>)}
                  </div>
                </div>
              )}
              {description.call_to_action && (
                <div className="p-3 bg-sky-500/10 border border-sky-500/20 rounded-xl">
                  <div className="text-xs text-sky-400 font-semibold mb-1">CALL TO ACTION</div>
                  <p className="text-white font-medium">{description.call_to_action}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
