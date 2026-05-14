import React, { useState, useEffect } from 'react';
import { Layers, Sparkles, Loader2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { productsAPI, photosAPI } from '../services/api';
import { useToast } from '../components/Toast';

export default function BatchAnalysis() {
  const toast = useToast();
  const [products, setProducts] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [fetchingProducts, setFetchingProducts] = useState(true);

  useEffect(() => {
    productsAPI.getAll().then(r => {
      const list = Array.isArray(r.data) ? r.data : (r.data?.data || []);
      setProducts(list.filter(p => p.original_image));
    }).catch(() => toast.error('Failed to load products')).finally(() => setFetchingProducts(false));
  }, []);

  const toggle = (id) => {
    setSelectedIds(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const handleBatchAnalyze = async () => {
    if (selectedIds.size === 0) return;
    setLoading(true);
    setResults(null);
    try {
      const res = await photosAPI.batchAnalyze([...selectedIds]);
      setResults(res.data);
      toast.success(`Analyzed ${res.data.total} products`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Batch analysis failed');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-emerald-400';
    if (score >= 60) return 'text-amber-400';
    return 'text-rose-400';
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl">
              <Layers className="w-6 h-6 text-white" />
            </div>
            Batch Photo Analysis
          </h1>
          <p className="text-slate-400 mt-1">Analyze multiple product photos at once with AI vision</p>
        </div>
        <button
          onClick={handleBatchAnalyze}
          disabled={selectedIds.size === 0 || loading}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-blue-600 text-white font-medium rounded-xl hover:opacity-90 transition-all disabled:opacity-50">
          {loading ? <><Loader2 size={20} className="animate-spin" /> Analyzing...</> : <><Sparkles size={20} /> Analyze {selectedIds.size > 0 ? `(${selectedIds.size})` : ''}</>}
        </button>
      </div>

      <div className="glass rounded-xl p-4 mb-4">
        <p className="text-sm text-slate-400">Select up to 10 products with images to batch analyze. Only products with uploaded images are shown.</p>
        <div className="flex gap-3 mt-2">
          <button onClick={() => setSelectedIds(new Set(products.slice(0, 10).map(p => p.id)))}
            className="text-xs text-sky-400 hover:text-sky-300">Select All (max 10)</button>
          <button onClick={() => setSelectedIds(new Set())} className="text-xs text-slate-500 hover:text-slate-300">Clear</button>
        </div>
      </div>

      {fetchingProducts ? (
        <div className="text-center text-slate-400 py-12">Loading products...</div>
      ) : products.length === 0 ? (
        <div className="text-center text-slate-400 py-12">No products with images found. Upload images to products first.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {products.map(product => {
            const isSelected = selectedIds.has(product.id);
            const result = results?.batch_results?.find(r => r.product_id === product.id);
            return (
              <div key={product.id}
                onClick={() => toggle(product.id)}
                className={`glass rounded-xl overflow-hidden cursor-pointer transition-all ${isSelected ? 'ring-2 ring-indigo-500/60' : 'hover:ring-1 hover:ring-slate-600'}`}>
                <div className="relative h-40 bg-slate-800">
                  <img src={product.original_image} alt={product.name} className="w-full h-full object-cover" />
                  <div className={`absolute top-2 left-2 w-6 h-6 rounded-full border-2 flex items-center justify-center ${isSelected ? 'bg-indigo-500 border-indigo-500' : 'bg-slate-900/70 border-slate-500'}`}>
                    {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
                  </div>
                  {result && !result.error && (
                    <div className="absolute top-2 right-2 w-8 h-8 rounded-full bg-slate-900/80 flex items-center justify-center">
                      <CheckCircle size={16} className="text-emerald-400" />
                    </div>
                  )}
                  {result?.error && (
                    <div className="absolute top-2 right-2 w-8 h-8 rounded-full bg-slate-900/80 flex items-center justify-center">
                      <XCircle size={16} className="text-rose-400" />
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <h3 className="text-white font-medium text-sm truncate">{product.name}</h3>
                  <span className="text-xs text-slate-400">{product.category || 'Uncategorized'}</span>

                  {result && !result.error && result.analysis && (
                    <div className="mt-2 space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-500">Quality Score</span>
                        <span className={`text-sm font-bold ${getScoreColor(result.analysis.quality_score || 0)}`}>
                          {result.analysis.quality_score || 0}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-500">E-comm Ready</span>
                        {result.analysis.ecommerce_ready ? (
                          <CheckCircle size={14} className="text-emerald-400" />
                        ) : (
                          <AlertCircle size={14} className="text-amber-400" />
                        )}
                      </div>
                      {result.analysis.detected_product && (
                        <p className="text-xs text-slate-400 truncate">{result.analysis.detected_product}</p>
                      )}
                      {result.analysis.top_improvement && (
                        <p className="text-xs text-amber-400 truncate">{result.analysis.top_improvement}</p>
                      )}
                    </div>
                  )}
                  {result?.error && <p className="text-xs text-rose-400 mt-1">{result.error}</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {results && (
        <div className="glass rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Batch Results Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-slate-800/50 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold text-white">{results.total}</div>
              <div className="text-xs text-slate-500 mt-1">Analyzed</div>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold text-emerald-400">
                {results.batch_results.filter(r => !r.error && r.analysis?.ecommerce_ready).length}
              </div>
              <div className="text-xs text-slate-500 mt-1">E-comm Ready</div>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold text-amber-400">
                {results.batch_results.filter(r => !r.error && !r.analysis?.ecommerce_ready).length}
              </div>
              <div className="text-xs text-slate-500 mt-1">Need Work</div>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold text-rose-400">
                {results.batch_results.filter(r => r.error).length}
              </div>
              <div className="text-xs text-slate-500 mt-1">Errors</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
