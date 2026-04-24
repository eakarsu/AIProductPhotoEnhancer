import React, { useState, useEffect } from 'react';
import { Camera, Plus, Loader2, Sparkles, RefreshCw, Save, Edit2, Trash2 } from 'lucide-react';
import { lifestyleShotsAPI, productsAPI } from '../services/api';
import Modal from '../components/Modal';
import AIResultDisplay from '../components/AIResultDisplay';
import ImagePreview from '../components/ImagePreview';
import DataTable from '../components/DataTable';
import { useToast } from '../components/Toast';
import { useConfirm } from '../components/ConfirmDialog';

const styleOptions = [
  'Modern minimalist', 'Classic elegance', 'Cozy comfort', 'Active lifestyle',
  'Clean beauty', 'Culinary arts', 'Street style', 'Zen aesthetic',
  'Adventure', 'Productivity', 'Sustainable', 'Wellness', 'Gaming setup', 'Botanical', 'Luxury'
];

const audienceOptions = [
  'Young professionals', 'Fitness enthusiasts', 'Home lovers', 'Beauty conscious',
  'Outdoor adventurers', 'Remote workers', 'Eco-conscious', 'Fashion lovers',
  'Gamers', 'Plant parents', 'General consumers'
];

function LifestyleShots() {
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
  const [formData, setFormData] = useState({ product_id: '', target_audience: '', style: '', product_description: '' });
  const [editFormData, setEditFormData] = useState({ status: '', target_audience: '', style: '' });
  const [saving, setSaving] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  const loadSampleData = () => {
    setFormData({
      product_id: products.length > 0 ? products[0].id : '',
      target_audience: 'Young professionals',
      style: 'Modern minimalist',
      product_description: 'A sleek wireless Bluetooth speaker with a minimalist cylindrical design in matte black. It features 360-degree sound, waterproof rating, and 12-hour battery life.'
    });
  };

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [itemsRes, productsRes] = await Promise.all([lifestyleShotsAPI.getAll(), productsAPI.getAll()]);
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
      const response = await lifestyleShotsAPI.getOne(item.id);
      setSelectedItem(response.data);
      setIsDetailModalOpen(true);
    } catch (error) {
      toast.error('Failed to load details');
    }
  };

  const handleEditItem = (item) => {
    setEditingItem(item);
    setEditFormData({
      status: item.status || 'pending',
      target_audience: item.target_audience || '',
      style: item.style || ''
    });
    setIsEditModalOpen(true);
  };

  const handleDeleteItem = async (item) => {
    const confirmed = await confirm({
      title: 'Delete Lifestyle Shot',
      message: `Are you sure you want to delete this lifestyle shot for "${item.product_name}"?`,
      confirmText: 'Delete',
      variant: 'danger'
    });
    if (!confirmed) return;
    try {
      await lifestyleShotsAPI.delete(item.id);
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
      await Promise.all(ids.map(id => lifestyleShotsAPI.delete(id)));
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
      const response = await lifestyleShotsAPI.create(formData);
      setIsFormModalOpen(false);
      setSelectedItem(response.data);
      setIsDetailModalOpen(true);
      await fetchData();
      toast.success('Lifestyle shot created');
    } catch (error) {
      toast.error('Failed to create lifestyle shot');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateItem = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const response = await lifestyleShotsAPI.update(editingItem.id, editFormData);
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

  const handleRegenerate = async () => {
    if (!selectedItem) return;
    setRegenerating(true);
    try {
      const response = await lifestyleShotsAPI.regenerate(selectedItem.id, {
        target_audience: selectedItem.target_audience,
        style: selectedItem.style
      });
      setSelectedItem({
        ...selectedItem,
        ai_analysis: response.data.ai_analysis,
        generated_concepts: response.data.generated_concepts
      });
      setItems(items.map(i =>
        i.id === selectedItem.id ? {
          ...i,
          ai_analysis: response.data.ai_analysis,
          generated_concepts: response.data.generated_concepts
        } : i
      ));
      toast.success('Concepts regenerated');
    } catch (error) {
      toast.error('Failed to regenerate concepts');
    } finally {
      setRegenerating(false);
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

  const getConceptCount = (item) => {
    try {
      const concepts = typeof item.generated_concepts === 'string'
        ? JSON.parse(item.generated_concepts)
        : item.generated_concepts;
      return Array.isArray(concepts) ? concepts.length : 0;
    } catch { return 0; }
  };

  const columns = [
    { header: 'Product', accessor: 'product_name', sortKey: 'product_name', render: (item) => <span className="font-medium text-white">{item.product_name}</span> },
    { header: 'Audience', accessor: 'target_audience', sortKey: 'target_audience', render: (item) => <span className="text-slate-300">{item.target_audience || 'General'}</span> },
    { header: 'Style', accessor: 'style', sortKey: 'style', render: (item) => <span className="px-2 py-1 bg-violet-500/20 text-violet-400 rounded-full text-xs font-medium">{item.style || 'Modern'}</span> },
    {
      header: 'Concepts', sortKey: 'concepts',
      accessor: (item) => getConceptCount(item),
      render: (item) => <span className="text-emerald-400">{getConceptCount(item)} concepts</span>
    },
    {
      header: 'Status', accessor: 'status', sortKey: 'status',
      render: (item) => <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>{item.status}</span>
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
            <div className="p-2 bg-gradient-to-br from-violet-500 to-purple-500 rounded-xl">
              <Camera className="w-6 h-6 text-white" />
            </div>
            Lifestyle Shots
          </h1>
          <p className="text-slate-400 mt-1">Generate creative lifestyle shot concepts with AI</p>
        </div>
        <button onClick={() => { setFormData({ product_id: '', target_audience: '', style: '', product_description: '' }); setFormErrors({}); setIsFormModalOpen(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-500 to-purple-500 text-white font-medium rounded-xl hover:from-violet-600 hover:to-purple-600 transition-all">
          <Plus size={20} /> Generate Concepts
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
        searchPlaceholder="Search by product or style..."
        emptyIcon={Camera}
        emptyTitle="No lifestyle shots found"
        emptyDescription="Create your first AI lifestyle shot concepts."
        emptyAction="Generate Concepts"
        onEmptyAction={() => setIsFormModalOpen(true)}
        filterOptions={filterOptions}
        title="Lifestyle Shots"
      />

      {/* Detail Modal */}
      <Modal isOpen={isDetailModalOpen} onClose={() => setIsDetailModalOpen(false)} title="Lifestyle Shot Concepts" size="xl">
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
                    <div className="flex gap-2 mt-2">
                      <span className="px-3 py-1 bg-violet-500/20 text-violet-400 rounded-full text-sm">{selectedItem.style || 'Modern'}</span>
                      <span className="px-3 py-1 bg-sky-500/20 text-sky-400 rounded-full text-sm">{selectedItem.target_audience || 'General'}</span>
                      <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(selectedItem.status)}`}>{selectedItem.status}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { setIsDetailModalOpen(false); handleEditItem(selectedItem); }}
                      className="flex items-center gap-2 px-3 py-2 bg-amber-500/20 text-amber-400 rounded-lg hover:bg-amber-500/30">
                      <Edit2 size={16} /> Edit
                    </button>
                    <button onClick={handleRegenerate} disabled={regenerating}
                      className="flex items-center gap-2 px-3 py-2 bg-violet-500/20 text-violet-400 rounded-lg hover:bg-violet-500/30 disabled:opacity-50">
                      {regenerating ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />} Regenerate
                    </button>
                    <button onClick={() => handleDeleteItem(selectedItem)}
                      className="flex items-center gap-2 px-3 py-2 bg-rose-500/20 text-rose-400 rounded-lg hover:bg-rose-500/30">
                      <Trash2 size={16} /> Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <AIResultDisplay
              data={typeof selectedItem.ai_analysis === 'string' ? JSON.parse(selectedItem.ai_analysis) : selectedItem.ai_analysis}
              title="Lifestyle Shot Concepts"
            />
          </div>
        )}
      </Modal>

      {/* Create Form Modal */}
      <Modal isOpen={isFormModalOpen} onClose={() => setIsFormModalOpen(false)} title="Generate Lifestyle Concepts" size="md">
        <form onSubmit={handleSaveItem} className="space-y-4">
          <button type="button" onClick={loadSampleData}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-700/50 border border-dashed border-slate-500 text-slate-300 rounded-xl hover:bg-slate-700 hover:border-slate-400 transition-all text-sm">
            <Camera size={16} /> Load Sample Data
          </button>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Select Product *</label>
            <select value={formData.product_id} onChange={(e) => setFormData({ ...formData, product_id: e.target.value })}
              className={`w-full px-4 py-3 bg-slate-800/50 border rounded-xl text-white focus:outline-none focus:border-violet-500 ${formErrors.product_id ? 'border-rose-500' : 'border-slate-600'}`} required>
              <option value="">Choose a product</option>
              {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.category || 'No category'})</option>)}
            </select>
            {formErrors.product_id && <p className="text-rose-400 text-xs mt-1">{formErrors.product_id}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Target Audience</label>
            <select value={formData.target_audience} onChange={(e) => setFormData({ ...formData, target_audience: e.target.value })}
              className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:border-violet-500">
              <option value="">Select target audience</option>
              {audienceOptions.map(audience => <option key={audience} value={audience}>{audience}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Style Preference</label>
            <select value={formData.style} onChange={(e) => setFormData({ ...formData, style: e.target.value })}
              className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:border-violet-500">
              <option value="">Select style</option>
              {styleOptions.map(style => <option key={style} value={style}>{style}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Product Description (Optional)</label>
            <textarea value={formData.product_description} onChange={(e) => setFormData({ ...formData, product_description: e.target.value })}
              className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-violet-500 min-h-[100px]"
              placeholder="Add more details about the product..." maxLength={2000} />
            <p className="text-xs text-slate-500 mt-1">{formData.product_description.length}/2000</p>
          </div>
          <div className="p-4 bg-violet-500/10 border border-violet-500/20 rounded-xl">
            <div className="flex items-center gap-2 text-violet-400 mb-2"><Sparkles size={16} /><span className="font-medium">AI Lifestyle Concepts</span></div>
            <p className="text-sm text-slate-400">Our AI will generate creative lifestyle shot concepts tailored to your target audience and style.</p>
          </div>
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={() => setIsFormModalOpen(false)} className="flex-1 px-4 py-3 bg-slate-700 text-white rounded-xl hover:bg-slate-600 transition-colors">Cancel</button>
            <button type="submit" disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-violet-500 to-purple-500 text-white rounded-xl hover:from-violet-600 hover:to-purple-600 transition-all disabled:opacity-50">
              {saving ? <><Loader2 size={20} className="animate-spin" /> Generating...</> : <><Camera size={20} /> Generate Concepts</>}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Lifestyle Shot" size="md">
        {editingItem && (
          <form onSubmit={handleUpdateItem} className="space-y-4">
            <div><label className="block text-sm font-medium text-slate-300 mb-2">Product</label><p className="text-white">{editingItem.product_name}</p></div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Status</label>
              <select value={editFormData.status} onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:border-violet-500">
                <option value="pending">Pending</option><option value="processing">Processing</option><option value="completed">Completed</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Target Audience</label>
              <select value={editFormData.target_audience} onChange={(e) => setEditFormData({ ...editFormData, target_audience: e.target.value })}
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:border-violet-500">
                {audienceOptions.map(audience => <option key={audience} value={audience}>{audience}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Style</label>
              <select value={editFormData.style} onChange={(e) => setEditFormData({ ...editFormData, style: e.target.value })}
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:border-violet-500">
                {styleOptions.map(style => <option key={style} value={style}>{style}</option>)}
              </select>
            </div>
            <div className="flex gap-3 pt-4">
              <button type="button" onClick={() => setIsEditModalOpen(false)} className="flex-1 px-4 py-3 bg-slate-700 text-white rounded-xl hover:bg-slate-600 transition-colors">Cancel</button>
              <button type="submit" disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-violet-500 to-purple-500 text-white rounded-xl hover:from-violet-600 hover:to-purple-600 transition-all disabled:opacity-50">
                {saving ? <><Loader2 size={20} className="animate-spin" /> Saving...</> : <><Save size={20} /> Update</>}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}

export default LifestyleShots;
