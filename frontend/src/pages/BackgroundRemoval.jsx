import React, { useState, useEffect } from 'react';
import { Eraser, Plus, Loader2, Sparkles, RefreshCw, Save, Edit2, Trash2 } from 'lucide-react';
import { backgroundRemovalAPI, productsAPI } from '../services/api';
import Modal from '../components/Modal';
import AIResultDisplay from '../components/AIResultDisplay';
import ImagePreview from '../components/ImagePreview';
import DataTable from '../components/DataTable';
import { useToast } from '../components/Toast';
import { useConfirm } from '../components/ConfirmDialog';

function BackgroundRemoval() {
  const toast = useToast();
  const confirm = useConfirm();
  const [items, setItems] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({ product_id: '', image_description: '' });
  const [editFormData, setEditFormData] = useState({ status: '' });
  const [saving, setSaving] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  const loadSampleData = () => {
    setFormData({
      product_id: products.length > 0 ? products[0].id : '',
      image_description: 'A stainless steel water bottle photographed on a wooden table with a blurred kitchen background.'
    });
  };

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [itemsRes, productsRes] = await Promise.all([backgroundRemovalAPI.getAll(), productsAPI.getAll()]);
      setItems(Array.isArray(itemsRes.data) ? itemsRes.data : (itemsRes.data?.data || []));
      setProducts(Array.isArray(productsRes.data) ? productsRes.data : (productsRes.data?.data || []));
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleRowClick = async (item) => {
    try {
      const response = await backgroundRemovalAPI.getOne(item.id);
      setSelectedItem(response.data);
      setIsDetailModalOpen(true);
    } catch (error) {
      toast.error('Failed to load details');
    }
  };

  const handleEditItem = (item) => {
    setEditingItem(item);
    setEditFormData({ status: item.status || 'pending' });
    setIsEditModalOpen(true);
  };

  const handleDeleteItem = async (item) => {
    const confirmed = await confirm({
      title: 'Delete Background Removal',
      message: `Are you sure you want to delete this background removal for "${item.product_name}"?`,
      confirmText: 'Delete',
      variant: 'danger'
    });
    if (!confirmed) return;
    try {
      await backgroundRemovalAPI.delete(item.id);
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
      await Promise.all(ids.map(id => backgroundRemovalAPI.delete(id)));
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
      const response = await backgroundRemovalAPI.create(formData);
      setIsFormModalOpen(false);
      setSelectedItem(response.data);
      setIsDetailModalOpen(true);
      await fetchData();
      toast.success('Background removal created');
    } catch (error) {
      toast.error('Failed to create background removal');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateItem = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const response = await backgroundRemovalAPI.update(editingItem.id, editFormData);
      setItems(items.map(i => i.id === editingItem.id ? { ...i, ...response.data } : i));
      if (selectedItem?.id === editingItem.id) setSelectedItem({ ...selectedItem, ...response.data });
      setIsEditModalOpen(false);
      toast.success('Updated successfully');
    } catch (error) {
      toast.error('Failed to update');
    } finally {
      setSaving(false);
    }
  };

  const handleReanalyze = async () => {
    if (!selectedItem) return;
    setAnalyzing(true);
    try {
      const response = await backgroundRemovalAPI.analyze(selectedItem.id, { image_description: selectedItem.product_description });
      setSelectedItem({ ...selectedItem, ai_analysis: response.data.ai_analysis });
      setItems(items.map(i => i.id === selectedItem.id ? { ...i, ai_analysis: response.data.ai_analysis } : i));
      toast.success('Re-analysis complete');
    } catch (error) {
      toast.error('Failed to re-analyze');
    } finally {
      setAnalyzing(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-emerald-500/20 text-emerald-400';
      case 'processing': return 'bg-sky-500/20 text-sky-400';
      case 'pending': return 'bg-amber-500/20 text-amber-400';
      default: return 'bg-slate-500/20 text-slate-400';
    }
  };

  const columns = [
    { header: 'Product', accessor: 'product_name', sortKey: 'product_name', render: (item) => <span className="font-medium text-white">{item.product_name}</span> },
    { header: 'Category', accessor: 'category', sortKey: 'category', render: (item) => <span className="text-slate-400">{item.category || 'N/A'}</span> },
    {
      header: 'Status', accessor: 'status', sortKey: 'status',
      render: (item) => <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>{item.status}</span>
    },
    {
      header: 'Quality', sortKey: 'quality', noExport: false,
      accessor: (item) => {
        const a = typeof item.ai_analysis === 'string' ? JSON.parse(item.ai_analysis) : item.ai_analysis;
        return a?.data?.recommendations?.estimatedQuality || a?.data?.analysis?.quality || 'N/A';
      },
      render: (item) => {
        const a = typeof item.ai_analysis === 'string' ? JSON.parse(item.ai_analysis) : item.ai_analysis;
        const q = a?.data?.recommendations?.estimatedQuality || a?.data?.analysis?.quality || 'N/A';
        return <span className="text-slate-300">{q}</span>;
      }
    },
    {
      header: 'Created', accessor: 'created_at', sortKey: 'created_at',
      render: (item) => <span className="text-slate-400 text-sm">{new Date(item.created_at).toLocaleDateString()}</span>
    },
  ];

  const filterOptions = {
    status: [
      { value: 'completed', label: 'Completed' },
      { value: 'processing', label: 'Processing' },
      { value: 'pending', label: 'Pending' },
    ]
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-pink-500 to-rose-500 rounded-xl">
              <Eraser className="w-6 h-6 text-white" />
            </div>
            Background Removal
          </h1>
          <p className="text-slate-400 mt-1">AI-powered background removal for product photos</p>
        </div>
        <button onClick={() => { setFormData({ product_id: '', image_description: '' }); setFormErrors({}); setIsFormModalOpen(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-500 to-rose-500 text-white font-medium rounded-xl hover:from-pink-600 hover:to-rose-600 transition-all">
          <Plus size={20} /> New Removal
        </button>
      </div>

      <DataTable
        data={items}
        columns={columns}
        loading={loading}
        onRowClick={handleRowClick}
        onView={handleRowClick}
        onEdit={handleEditItem}
        onDelete={handleDeleteItem}
        onBulkDelete={handleBulkDelete}
        searchPlaceholder="Search by product name..."
        emptyIcon={Eraser}
        emptyTitle="No background removals found"
        emptyDescription="Create your first AI background removal analysis."
        emptyAction="New Removal"
        onEmptyAction={() => setIsFormModalOpen(true)}
        filterOptions={filterOptions}
        title="Background Removals"
      />

      {/* Detail Modal */}
      <Modal isOpen={isDetailModalOpen} onClose={() => setIsDetailModalOpen(false)} title="Background Removal Details" size="xl">
        {selectedItem && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="w-full md:w-1/3">
                <ImagePreview src={selectedItem.original_image} alt={selectedItem.product_name} className="h-48 w-full" />
              </div>
              <div className="w-full md:w-2/3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-semibold text-white">{selectedItem.product_name}</h3>
                    <span className={`inline-block px-3 py-1 mt-2 text-sm rounded-full ${getStatusColor(selectedItem.status)}`}>{selectedItem.status}</span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { setIsDetailModalOpen(false); handleEditItem(selectedItem); }}
                      className="flex items-center gap-2 px-3 py-2 bg-amber-500/20 text-amber-400 rounded-lg hover:bg-amber-500/30">
                      <Edit2 size={16} /> Edit
                    </button>
                    <button onClick={handleReanalyze} disabled={analyzing}
                      className="flex items-center gap-2 px-3 py-2 bg-sky-500/20 text-sky-400 rounded-lg hover:bg-sky-500/30 disabled:opacity-50">
                      {analyzing ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />} Re-analyze
                    </button>
                    <button onClick={() => handleDeleteItem(selectedItem)}
                      className="flex items-center gap-2 px-3 py-2 bg-rose-500/20 text-rose-400 rounded-lg hover:bg-rose-500/30">
                      <Trash2 size={16} /> Delete
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div><label className="text-sm text-slate-400">Category</label><p className="text-white mt-1">{selectedItem.category || 'N/A'}</p></div>
                  <div><label className="text-sm text-slate-400">Created</label><p className="text-white mt-1">{new Date(selectedItem.created_at).toLocaleString()}</p></div>
                </div>
              </div>
            </div>
            <AIResultDisplay data={typeof selectedItem.ai_analysis === 'string' ? JSON.parse(selectedItem.ai_analysis) : selectedItem.ai_analysis} title="Background Removal Analysis" />
          </div>
        )}
      </Modal>

      {/* Create Form Modal */}
      <Modal isOpen={isFormModalOpen} onClose={() => setIsFormModalOpen(false)} title="New Background Removal" size="md">
        <form onSubmit={handleSaveItem} className="space-y-4">
          <button type="button" onClick={loadSampleData}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-700/50 border border-dashed border-slate-500 text-slate-300 rounded-xl hover:bg-slate-700 hover:border-slate-400 transition-all text-sm">
            <Sparkles size={16} /> Load Sample Data
          </button>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Select Product *</label>
            <select value={formData.product_id} onChange={(e) => setFormData({ ...formData, product_id: e.target.value })}
              className={`w-full px-4 py-3 bg-slate-800/50 border rounded-xl text-white focus:outline-none focus:border-pink-500 ${formErrors.product_id ? 'border-rose-500' : 'border-slate-600'}`} required>
              <option value="">Choose a product</option>
              {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.category || 'No category'})</option>)}
            </select>
            {formErrors.product_id && <p className="text-rose-400 text-xs mt-1">{formErrors.product_id}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Image Description (Optional)</label>
            <textarea value={formData.image_description} onChange={(e) => setFormData({ ...formData, image_description: e.target.value })}
              className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-pink-500 min-h-[100px]"
              placeholder="Describe the image for better AI analysis..." maxLength={2000} />
            <p className="text-xs text-slate-500 mt-1">{formData.image_description.length}/2000</p>
          </div>
          <div className="p-4 bg-pink-500/10 border border-pink-500/20 rounded-xl">
            <div className="flex items-center gap-2 text-pink-400 mb-2"><Sparkles size={16} /><span className="font-medium">AI Analysis</span></div>
            <p className="text-sm text-slate-400">Our AI will analyze the image and provide recommendations for optimal background removal.</p>
          </div>
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={() => setIsFormModalOpen(false)} className="flex-1 px-4 py-3 bg-slate-700 text-white rounded-xl hover:bg-slate-600 transition-colors">Cancel</button>
            <button type="submit" disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl hover:from-pink-600 hover:to-rose-600 transition-all disabled:opacity-50">
              {saving ? <><Loader2 size={20} className="animate-spin" /> Processing...</> : <><Sparkles size={20} /> Analyze & Remove</>}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Background Removal" size="md">
        {editingItem && (
          <form onSubmit={handleUpdateItem} className="space-y-4">
            <div><label className="block text-sm font-medium text-slate-300 mb-2">Product</label><p className="text-white">{editingItem.product_name}</p></div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Status</label>
              <select value={editFormData.status} onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:border-pink-500">
                <option value="pending">Pending</option><option value="processing">Processing</option><option value="completed">Completed</option>
              </select>
            </div>
            <div className="flex gap-3 pt-4">
              <button type="button" onClick={() => setIsEditModalOpen(false)} className="flex-1 px-4 py-3 bg-slate-700 text-white rounded-xl hover:bg-slate-600 transition-colors">Cancel</button>
              <button type="submit" disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl hover:from-amber-600 hover:to-orange-600 transition-all disabled:opacity-50">
                {saving ? <><Loader2 size={20} className="animate-spin" /> Saving...</> : <><Save size={20} /> Update</>}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}

export default BackgroundRemoval;
