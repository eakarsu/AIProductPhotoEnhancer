import React, { useState, useEffect } from 'react';
import { FileText, Plus, Loader2, Sparkles, RefreshCw, Trash2, Copy, Check } from 'lucide-react';
import { productDescriptionsAPI, productsAPI } from '../services/api';
import Modal from '../components/Modal';
import AIResultDisplay from '../components/AIResultDisplay';
import DataTable from '../components/DataTable';
import { useToast } from '../components/Toast';
import { useConfirm } from '../components/ConfirmDialog';

function ProductDescriptions() {
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
  const [copiedField, setCopiedField] = useState(null);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [itemsRes, productsRes] = await Promise.all([productDescriptionsAPI.getAll(), productsAPI.getAll()]);
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
      const response = await productDescriptionsAPI.getOne(item.id);
      setSelectedItem(response.data);
      setIsDetailModalOpen(true);
    } catch (error) {
      toast.error('Failed to load details');
    }
  };

  const handleDeleteItem = async (item) => {
    const confirmed = await confirm({ title: 'Delete Description', message: `Delete the description for "${item.product_name}"?`, confirmText: 'Delete', variant: 'danger' });
    if (!confirmed) return;
    try {
      await productDescriptionsAPI.delete(item.id);
      setItems(items.filter(i => i.id !== item.id));
      if (selectedItem?.id === item.id) setIsDetailModalOpen(false);
      toast.success('Deleted successfully');
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  const handleBulkDelete = async (ids) => {
    const confirmed = await confirm({ title: 'Bulk Delete', message: `Delete ${ids.length} descriptions?`, confirmText: `Delete ${ids.length}`, variant: 'danger' });
    if (!confirmed) return;
    try {
      await Promise.all(ids.map(id => productDescriptionsAPI.delete(id)));
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
      const response = await productDescriptionsAPI.create(formData);
      setIsFormModalOpen(false);
      setSelectedItem(response.data);
      setIsDetailModalOpen(true);
      await fetchData();
      toast.success('Description generated');
    } catch (error) {
      toast.error('Failed to generate description');
    } finally {
      setSaving(false);
    }
  };

  const handleRegenerate = async () => {
    if (!selectedItem) return;
    setAnalyzing(true);
    try {
      const response = await productDescriptionsAPI.regenerate(selectedItem.id, {});
      setSelectedItem({ ...selectedItem, ...response.data });
      setItems(items.map(i => i.id === selectedItem.id ? { ...i, ...response.data } : i));
      toast.success('Description regenerated');
    } catch (error) {
      toast.error('Failed to regenerate');
    } finally {
      setAnalyzing(false);
    }
  };

  const copyToClipboard = async (text, field) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      toast.success('Copied to clipboard');
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  const columns = [
    { header: 'Product', accessor: 'product_name', sortKey: 'product_name', render: (item) => <span className="font-medium text-white">{item.product_name}</span> },
    { header: 'Category', accessor: 'category', sortKey: 'category', render: (item) => <span className="text-slate-400">{item.category || 'N/A'}</span> },
    { header: 'Short Description', accessor: 'short_description', render: (item) => <span className="text-slate-300 text-sm line-clamp-1">{item.short_description || 'N/A'}</span> },
    {
      header: 'Keywords', noExport: true,
      render: (item) => {
        const kw = typeof item.seo_keywords === 'string' ? JSON.parse(item.seo_keywords) : item.seo_keywords;
        return (
          <div className="flex flex-wrap gap-1">
            {(kw || []).slice(0, 3).map((k, i) => <span key={i} className="px-2 py-0.5 bg-rose-500/20 text-rose-400 rounded-full text-xs">{k}</span>)}
            {(kw || []).length > 3 && <span className="text-xs text-slate-500">+{kw.length - 3}</span>}
          </div>
        );
      }
    },
    { header: 'Created', accessor: 'created_at', sortKey: 'created_at', render: (item) => <span className="text-slate-400 text-sm">{new Date(item.created_at).toLocaleDateString()}</span> },
  ];

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-rose-500 to-pink-500 rounded-xl"><FileText className="w-6 h-6 text-white" /></div>
            Product Descriptions
          </h1>
          <p className="text-slate-400 mt-1">AI-generated product copy and SEO keywords</p>
        </div>
        <button onClick={() => { setFormData({ product_id: '', image_description: '' }); setFormErrors({}); setIsFormModalOpen(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-rose-500 to-pink-500 text-white font-medium rounded-xl hover:from-rose-600 hover:to-pink-600 transition-all">
          <Plus size={20} /> Generate New
        </button>
      </div>

      <DataTable data={items} columns={columns} loading={loading} onRowClick={handleRowClick} onView={handleRowClick}
        onDelete={handleDeleteItem} onBulkDelete={handleBulkDelete} searchPlaceholder="Search descriptions..."
        emptyIcon={FileText} emptyTitle="No descriptions found" emptyDescription="Generate your first AI product description."
        emptyAction="Generate New" onEmptyAction={() => setIsFormModalOpen(true)} title="Product Descriptions" />

      {/* Detail Modal */}
      <Modal isOpen={isDetailModalOpen} onClose={() => setIsDetailModalOpen(false)} title="Product Description Details" size="xl">
        {selectedItem && (
          <div className="space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-semibold text-white">{selectedItem.product_name}</h3>
                <span className="text-sm text-slate-400">{selectedItem.category}</span>
              </div>
              <div className="flex gap-2">
                <button onClick={handleRegenerate} disabled={analyzing}
                  className="flex items-center gap-2 px-3 py-2 bg-rose-500/20 text-rose-400 rounded-lg hover:bg-rose-500/30 disabled:opacity-50">
                  {analyzing ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />} Regenerate
                </button>
                <button onClick={() => handleDeleteItem(selectedItem)}
                  className="flex items-center gap-2 px-3 py-2 bg-rose-500/20 text-rose-400 rounded-lg hover:bg-rose-500/30">
                  <Trash2 size={16} /> Delete
                </button>
              </div>
            </div>

            {/* Copyable fields */}
            {[
              { label: 'Short Description', value: selectedItem.short_description, field: 'short' },
              { label: 'Long Description', value: selectedItem.long_description, field: 'long' },
            ].map(({ label, value, field }) => value && (
              <div key={field} className="glass rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-slate-400">{label}</label>
                  <button onClick={() => copyToClipboard(value, field)} className="flex items-center gap-1 text-xs text-slate-400 hover:text-white">
                    {copiedField === field ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                    {copiedField === field ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <p className="text-white text-sm whitespace-pre-wrap">{value}</p>
              </div>
            ))}

            {selectedItem.seo_keywords && (
              <div className="glass rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-slate-400">SEO Keywords</label>
                  <button onClick={() => copyToClipboard((typeof selectedItem.seo_keywords === 'string' ? JSON.parse(selectedItem.seo_keywords) : selectedItem.seo_keywords).join(', '), 'kw')}
                    className="flex items-center gap-1 text-xs text-slate-400 hover:text-white">
                    {copiedField === 'kw' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                    {copiedField === 'kw' ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(typeof selectedItem.seo_keywords === 'string' ? JSON.parse(selectedItem.seo_keywords) : selectedItem.seo_keywords || []).map((kw, i) =>
                    <span key={i} className="px-3 py-1 bg-rose-500/20 text-rose-400 rounded-full text-sm">{kw}</span>
                  )}
                </div>
              </div>
            )}

            <AIResultDisplay data={typeof selectedItem.ai_analysis === 'string' ? JSON.parse(selectedItem.ai_analysis) : selectedItem.ai_analysis} title="AI Analysis" />
          </div>
        )}
      </Modal>

      {/* Create Form Modal */}
      <Modal isOpen={isFormModalOpen} onClose={() => setIsFormModalOpen(false)} title="Generate Product Description" size="md">
        <form onSubmit={handleSaveItem} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Select Product *</label>
            <select value={formData.product_id} onChange={(e) => setFormData({ ...formData, product_id: e.target.value })}
              className={`w-full px-4 py-3 bg-slate-800/50 border rounded-xl text-white focus:outline-none focus:border-rose-500 ${formErrors.product_id ? 'border-rose-500' : 'border-slate-600'}`} required>
              <option value="">Choose a product</option>
              {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.category || 'No category'})</option>)}
            </select>
            {formErrors.product_id && <p className="text-rose-400 text-xs mt-1">{formErrors.product_id}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Additional Context (Optional)</label>
            <textarea value={formData.image_description} onChange={(e) => setFormData({ ...formData, image_description: e.target.value })}
              className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-rose-500 min-h-[100px]"
              placeholder="Add any additional context about the product..." maxLength={2000} />
            <p className="text-xs text-slate-500 mt-1">{formData.image_description.length}/2000</p>
          </div>
          <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl">
            <div className="flex items-center gap-2 text-rose-400 mb-2"><Sparkles size={16} /><span className="font-medium">AI Generation</span></div>
            <p className="text-sm text-slate-400">AI will generate a short description, detailed description, and SEO keywords.</p>
          </div>
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={() => setIsFormModalOpen(false)} className="flex-1 px-4 py-3 bg-slate-700 text-white rounded-xl hover:bg-slate-600 transition-colors">Cancel</button>
            <button type="submit" disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-xl hover:from-rose-600 hover:to-pink-600 transition-all disabled:opacity-50">
              {saving ? <><Loader2 size={20} className="animate-spin" /> Generating...</> : <><Sparkles size={20} /> Generate</>}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default ProductDescriptions;
