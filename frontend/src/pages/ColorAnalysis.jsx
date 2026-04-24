import React, { useState, useEffect } from 'react';
import { Palette, Plus, Loader2, Sparkles, RefreshCw, Trash2, Droplet } from 'lucide-react';
import { colorAnalysisAPI, productsAPI } from '../services/api';
import Modal from '../components/Modal';
import AIResultDisplay from '../components/AIResultDisplay';
import ImagePreview from '../components/ImagePreview';
import DataTable from '../components/DataTable';
import { useToast } from '../components/Toast';
import { useConfirm } from '../components/ConfirmDialog';

function ColorAnalysis() {
  const toast = useToast();
  const confirm = useConfirm();
  const [items, setItems] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [formData, setFormData] = useState({ product_id: '', image_description: '' });
  const [saving, setSaving] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  const loadSampleData = () => {
    setFormData({
      product_id: products.length > 0 ? products[0].id : '',
      image_description: 'A vibrant sunset-orange running shoe with teal blue accents, white midsole, and neon yellow laces. The shoe is photographed on a light gray background with soft shadows.'
    });
  };

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [itemsRes, productsRes] = await Promise.all([colorAnalysisAPI.getAll(), productsAPI.getAll()]);
      setItems(itemsRes.data);
      setProducts(productsRes.data);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleRowClick = async (item) => {
    try {
      const response = await colorAnalysisAPI.getOne(item.id);
      setSelectedItem(response.data);
      setIsDetailModalOpen(true);
    } catch (error) {
      toast.error('Failed to load details');
    }
  };

  const handleDeleteItem = async (item) => {
    const confirmed = await confirm({
      title: 'Delete Color Analysis',
      message: `Are you sure you want to delete this color analysis for "${item.product_name}"?`,
      confirmText: 'Delete',
      variant: 'danger'
    });
    if (!confirmed) return;
    try {
      await colorAnalysisAPI.delete(item.id);
      setItems(items.filter(i => i.id !== item.id));
      if (selectedItem?.id === item.id) setIsDetailModalOpen(false);
      toast.success('Deleted successfully');
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  const handleBulkDelete = async (ids) => {
    const confirmed = await confirm({
      title: 'Bulk Delete',
      message: `Are you sure you want to delete ${ids.length} items?`,
      confirmText: `Delete ${ids.length} Items`,
      variant: 'danger'
    });
    if (!confirmed) return;
    try {
      await Promise.all(ids.map(id => colorAnalysisAPI.delete(id)));
      setItems(items.filter(i => !ids.includes(i.id)));
      toast.success(`${ids.length} items deleted`);
    } catch (error) {
      toast.error('Failed to delete some items');
    }
  };

  const validateForm = () => {
    const errs = {};
    if (!formData.product_id) errs.product_id = 'Product is required';
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSaveItem = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setSaving(true);
    try {
      const response = await colorAnalysisAPI.create(formData);
      setIsFormModalOpen(false);
      setSelectedItem(response.data);
      setIsDetailModalOpen(true);
      await fetchData();
      toast.success('Color analysis created');
    } catch (error) {
      toast.error('Failed to create color analysis');
    } finally {
      setSaving(false);
    }
  };

  const handleReanalyze = async () => {
    if (!selectedItem) return;
    setAnalyzing(true);
    try {
      const response = await colorAnalysisAPI.analyze(selectedItem.id, { image_description: selectedItem.product_description });
      setSelectedItem({ ...selectedItem, ai_analysis: response.data.ai_analysis, dominant_colors: response.data.dominant_colors });
      setItems(items.map(i => i.id === selectedItem.id ? { ...i, ai_analysis: response.data.ai_analysis, dominant_colors: response.data.dominant_colors } : i));
      toast.success('Re-analysis complete');
    } catch (error) {
      toast.error('Failed to re-analyze');
    } finally {
      setAnalyzing(false);
    }
  };

  const getDominantColors = (item) => {
    try {
      const colors = typeof item.dominant_colors === 'string' ? JSON.parse(item.dominant_colors) : item.dominant_colors;
      return Array.isArray(colors) ? colors.slice(0, 5) : [];
    } catch { return []; }
  };

  const columns = [
    {
      header: 'Product', accessor: 'product_name', sortKey: 'product_name',
      render: (item) => <span className="font-medium text-white">{item.product_name}</span>
    },
    {
      header: 'Category', accessor: 'category', sortKey: 'category',
      render: (item) => <span className="text-slate-400">{item.category || 'N/A'}</span>
    },
    {
      header: 'Colors', accessor: 'dominant_colors', sortKey: null,
      render: (item) => {
        const colors = getDominantColors(item);
        if (colors.length === 0) return <span className="text-slate-500 text-sm">No colors</span>;
        return (
          <div className="flex items-center gap-1.5">
            {colors.slice(0, 3).map((color, i) => (
              <div key={i} className="flex items-center gap-1" title={`${color.name}: ${color.hex}`}>
                <div className="w-5 h-5 rounded-full border border-slate-600 shrink-0" style={{ backgroundColor: color.hex || '#333' }} />
                <span className="text-xs text-slate-400 hidden lg:inline">{color.hex}</span>
              </div>
            ))}
            {colors.length > 3 && <span className="text-xs text-slate-500">+{colors.length - 3}</span>}
          </div>
        );
      }
    },
    {
      header: 'Created', accessor: 'created_at', sortKey: 'created_at',
      render: (item) => <span className="text-slate-400 text-sm">{new Date(item.created_at).toLocaleDateString()}</span>
    },
  ];

  const filterOptions = {};

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl">
              <Palette className="w-6 h-6 text-white" />
            </div>
            Color Analysis
          </h1>
          <p className="text-slate-400 mt-1">Analyze and extract colors from product images</p>
        </div>
        <button onClick={() => { setFormData({ product_id: '', image_description: '' }); setFormErrors({}); setIsFormModalOpen(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-medium rounded-xl hover:from-emerald-600 hover:to-teal-600 transition-all">
          <Plus size={20} /> Analyze Colors
        </button>
      </div>

      <DataTable
        data={items}
        columns={columns}
        loading={loading}
        onRowClick={handleRowClick}
        onView={handleRowClick}
        onDelete={handleDeleteItem}
        onBulkDelete={handleBulkDelete}
        searchPlaceholder="Search by product name..."
        emptyIcon={Palette}
        emptyTitle="No color analyses found"
        emptyDescription="Create your first AI color analysis."
        emptyAction="Analyze Colors"
        onEmptyAction={() => setIsFormModalOpen(true)}
        filterOptions={filterOptions}
        title="Color Analyses"
      />

      {/* Detail Modal */}
      <Modal isOpen={isDetailModalOpen} onClose={() => setIsDetailModalOpen(false)} title="Color Analysis Details" size="xl">
        {selectedItem && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="w-full md:w-1/3">
                <ImagePreview src={selectedItem.image_path} alt={selectedItem.product_name} className="h-48 w-full" />
              </div>
              <div className="w-full md:w-2/3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-semibold text-white">{selectedItem.product_name}</h3>
                    <span className="text-slate-400">{selectedItem.category || 'Uncategorized'}</span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={handleReanalyze} disabled={analyzing}
                      className="flex items-center gap-2 px-3 py-2 bg-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/30 disabled:opacity-50">
                      {analyzing ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />} Re-analyze
                    </button>
                    <button onClick={() => handleDeleteItem(selectedItem)}
                      className="flex items-center gap-2 px-3 py-2 bg-rose-500/20 text-rose-400 rounded-lg hover:bg-rose-500/30">
                      <Trash2 size={16} /> Delete
                    </button>
                  </div>
                </div>
                {(() => {
                  const colors = getDominantColors(selectedItem);
                  if (colors.length > 0) {
                    return (
                      <div className="mt-4 p-4 bg-slate-800/50 rounded-xl">
                        <h4 className="text-sm font-medium text-slate-300 mb-3">Extracted Palette</h4>
                        <div className="flex gap-3 flex-wrap">
                          {colors.map((color, i) => (
                            <div key={i} className="text-center">
                              <div className="w-16 h-16 rounded-xl border-2 border-slate-600 mb-2" style={{ backgroundColor: color.hex }} />
                              <p className="text-xs text-white font-medium">{color.name}</p>
                              <p className="text-xs text-slate-400">{color.hex}</p>
                              <p className="text-xs text-emerald-400">{color.percentage}%</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div><label className="text-sm text-slate-400">Category</label><p className="text-white mt-1">{selectedItem.category || 'N/A'}</p></div>
                  <div><label className="text-sm text-slate-400">Created</label><p className="text-white mt-1">{new Date(selectedItem.created_at).toLocaleString()}</p></div>
                </div>
              </div>
            </div>
            <AIResultDisplay data={typeof selectedItem.ai_analysis === 'string' ? JSON.parse(selectedItem.ai_analysis) : selectedItem.ai_analysis} title="Color Analysis" />
          </div>
        )}
      </Modal>

      {/* Create Form Modal */}
      <Modal isOpen={isFormModalOpen} onClose={() => setIsFormModalOpen(false)} title="New Color Analysis" size="md">
        <form onSubmit={handleSaveItem} className="space-y-4">
          <button type="button" onClick={loadSampleData}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-700/50 border border-dashed border-slate-500 text-slate-300 rounded-xl hover:bg-slate-700 hover:border-slate-400 transition-all text-sm">
            <Sparkles size={16} /> Load Sample Data
          </button>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Select Product *</label>
            <select value={formData.product_id} onChange={(e) => setFormData({ ...formData, product_id: e.target.value })}
              className={`w-full px-4 py-3 bg-slate-800/50 border rounded-xl text-white focus:outline-none focus:border-emerald-500 ${formErrors.product_id ? 'border-rose-500' : 'border-slate-600'}`} required>
              <option value="">Choose a product</option>
              {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.category || 'No category'})</option>)}
            </select>
            {formErrors.product_id && <p className="text-rose-400 text-xs mt-1">{formErrors.product_id}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Image Description (Optional)</label>
            <textarea value={formData.image_description} onChange={(e) => setFormData({ ...formData, image_description: e.target.value })}
              className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 min-h-[100px]"
              placeholder="Describe the colors in the image..." maxLength={2000} />
            <p className="text-xs text-slate-500 mt-1">{formData.image_description.length}/2000</p>
          </div>
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
            <div className="flex items-center gap-2 text-emerald-400 mb-2"><Sparkles size={16} /><span className="font-medium">AI Color Expert</span></div>
            <p className="text-sm text-slate-400">Our AI will analyze colors, identify harmonies, and suggest complementary palettes.</p>
          </div>
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={() => setIsFormModalOpen(false)} className="flex-1 px-4 py-3 bg-slate-700 text-white rounded-xl hover:bg-slate-600 transition-colors">Cancel</button>
            <button type="submit" disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:from-emerald-600 hover:to-teal-600 transition-all disabled:opacity-50">
              {saving ? <><Loader2 size={20} className="animate-spin" /> Analyzing...</> : <><Palette size={20} /> Analyze Colors</>}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default ColorAnalysis;
