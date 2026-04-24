import React, { useState, useEffect } from 'react';
import { Gift, Plus, Loader2, Sparkles, RefreshCw, Save, Edit2, Trash2, Heart } from 'lucide-react';
import { giftSuggesterAPI, productsAPI } from '../services/api';
import Modal from '../components/Modal';
import AIResultDisplay from '../components/AIResultDisplay';
import DataTable from '../components/DataTable';
import { useToast } from '../components/Toast';
import { useConfirm } from '../components/ConfirmDialog';

const occasions = ['Birthday', 'Anniversary', 'Christmas', "Mother's Day", "Father's Day", 'Wedding', 'Graduation', 'Housewarming', "Valentine's Day"];
const budgetRanges = ['$0-$25', '$25-$50', '$50-$100', '$100-$200', '$200-$500', '$500+'];

function GiftSuggester() {
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
  const [formData, setFormData] = useState({
    product_id: '', occasion: '', budget_range: '',
    recipient_profile: { age: '', gender: '', interests: '' }
  });
  const [editFormData, setEditFormData] = useState({ status: '', occasion: '', budget_range: '' });
  const [saving, setSaving] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [itemsRes, productsRes] = await Promise.all([giftSuggesterAPI.getAll(), productsAPI.getAll()]);
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
      const response = await giftSuggesterAPI.getOne(item.id);
      setSelectedItem(response.data);
      setIsDetailModalOpen(true);
    } catch (error) {
      toast.error('Failed to load details');
    }
  };

  const handleEditItem = (item) => {
    setEditingItem(item);
    setEditFormData({ status: item.status || 'pending', occasion: item.occasion || '', budget_range: item.budget_range || '' });
    setIsEditModalOpen(true);
  };

  const handleDeleteItem = async (item) => {
    const confirmed = await confirm({ title: 'Delete Gift Suggestion', message: `Delete gift suggestion for "${item.product_name}"?`, confirmText: 'Delete', variant: 'danger' });
    if (!confirmed) return;
    try {
      await giftSuggesterAPI.delete(item.id);
      setItems(items.filter(i => i.id !== item.id));
      if (selectedItem?.id === item.id) setIsDetailModalOpen(false);
      toast.success('Deleted successfully');
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  const handleBulkDelete = async (ids) => {
    const confirmed = await confirm({ title: 'Bulk Delete', message: `Delete ${ids.length} gift suggestions?`, confirmText: `Delete ${ids.length}`, variant: 'danger' });
    if (!confirmed) return;
    try {
      await Promise.all(ids.map(id => giftSuggesterAPI.delete(id)));
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
      const response = await giftSuggesterAPI.create(formData);
      setIsFormModalOpen(false);
      setSelectedItem(response.data);
      setIsDetailModalOpen(true);
      await fetchData();
      toast.success('Gift suggestion created');
    } catch (error) {
      toast.error('Failed to create gift suggestion');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateItem = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const response = await giftSuggesterAPI.update(editingItem.id, editFormData);
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
      const response = await giftSuggesterAPI.analyze(selectedItem.id, {});
      setSelectedItem({ ...selectedItem, ai_analysis: response.data.ai_analysis, match_score: response.data.match_score });
      setItems(items.map(i => i.id === selectedItem.id ? { ...i, ai_analysis: response.data.ai_analysis, match_score: response.data.match_score } : i));
      toast.success('Re-analysis complete');
    } catch (error) {
      toast.error('Failed to re-analyze');
    } finally {
      setAnalyzing(false);
    }
  };

  const getStatusColor = (s) => {
    switch (s) { case 'completed': return 'bg-emerald-500/20 text-emerald-400'; case 'processing': return 'bg-sky-500/20 text-sky-400'; case 'pending': return 'bg-amber-500/20 text-amber-400'; default: return 'bg-slate-500/20 text-slate-400'; }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-emerald-400';
    if (score >= 60) return 'text-amber-400';
    return 'text-rose-400';
  };

  const columns = [
    { header: 'Product', accessor: 'product_name', sortKey: 'product_name', render: (item) => <span className="font-medium text-white">{item.product_name}</span> },
    { header: 'Occasion', accessor: 'occasion', sortKey: 'occasion', render: (item) => <span className="px-2 py-1 bg-rose-500/20 text-rose-400 rounded-full text-xs">{item.occasion || 'N/A'}</span> },
    { header: 'Budget', accessor: 'budget_range', sortKey: 'budget_range', render: (item) => <span className="text-slate-300">{item.budget_range || 'N/A'}</span> },
    {
      header: 'Match Score', sortKey: 'match_score', accessor: (item) => item.match_score || 0,
      render: (item) => (
        <div className="flex items-center gap-1">
          <Heart size={14} className={getScoreColor(item.match_score || 0)} />
          <span className={`font-medium ${getScoreColor(item.match_score || 0)}`}>{item.match_score || 'N/A'}%</span>
        </div>
      )
    },
    { header: 'Status', accessor: 'status', sortKey: 'status', render: (item) => <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>{item.status}</span> },
    { header: 'Created', accessor: 'created_at', sortKey: 'created_at', render: (item) => <span className="text-slate-400 text-sm">{new Date(item.created_at).toLocaleDateString()}</span> },
  ];

  const filterOptions = {
    status: [{ value: 'completed', label: 'Completed' }, { value: 'processing', label: 'Processing' }, { value: 'pending', label: 'Pending' }],
    occasion: occasions.map(o => ({ value: o, label: o }))
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-rose-500 to-pink-500 rounded-xl"><Gift className="w-6 h-6 text-white" /></div>
            Gift Suggester
          </h1>
          <p className="text-slate-400 mt-1">Match products to gift occasions with AI</p>
        </div>
        <button onClick={() => { setFormData({ product_id: '', occasion: '', budget_range: '', recipient_profile: { age: '', gender: '', interests: '' } }); setFormErrors({}); setIsFormModalOpen(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-rose-500 to-pink-500 text-white font-medium rounded-xl hover:from-rose-600 hover:to-pink-600 transition-all">
          <Plus size={20} /> New Gift Match
        </button>
      </div>

      <DataTable data={items} columns={columns} loading={loading} onRowClick={handleRowClick} onView={handleRowClick}
        onEdit={handleEditItem} onDelete={handleDeleteItem} onBulkDelete={handleBulkDelete} searchPlaceholder="Search gift suggestions..."
        emptyIcon={Gift} emptyTitle="No gift suggestions found" emptyDescription="Create your first AI gift match analysis."
        emptyAction="New Gift Match" onEmptyAction={() => setIsFormModalOpen(true)} filterOptions={filterOptions} title="Gift Suggestions" />

      {/* Detail Modal */}
      <Modal isOpen={isDetailModalOpen} onClose={() => setIsDetailModalOpen(false)} title="Gift Suggestion Details" size="xl">
        {selectedItem && (
          <div className="space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-semibold text-white">{selectedItem.product_name}</h3>
                <div className="flex gap-2 mt-2">
                  <span className={`px-3 py-1 text-sm rounded-full ${getStatusColor(selectedItem.status)}`}>{selectedItem.status}</span>
                  {selectedItem.occasion && <span className="px-3 py-1 text-sm bg-rose-500/20 text-rose-400 rounded-full">{selectedItem.occasion}</span>}
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setIsDetailModalOpen(false); handleEditItem(selectedItem); }}
                  className="flex items-center gap-2 px-3 py-2 bg-amber-500/20 text-amber-400 rounded-lg hover:bg-amber-500/30"><Edit2 size={16} /> Edit</button>
                <button onClick={handleReanalyze} disabled={analyzing}
                  className="flex items-center gap-2 px-3 py-2 bg-sky-500/20 text-sky-400 rounded-lg hover:bg-sky-500/30 disabled:opacity-50">
                  {analyzing ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />} Re-analyze
                </button>
                <button onClick={() => handleDeleteItem(selectedItem)}
                  className="flex items-center gap-2 px-3 py-2 bg-rose-500/20 text-rose-400 rounded-lg hover:bg-rose-500/30"><Trash2 size={16} /> Delete</button>
              </div>
            </div>
            {/* Score display */}
            <div className="flex items-center gap-4 p-4 glass rounded-xl">
              <div className={`text-4xl font-bold ${getScoreColor(selectedItem.match_score || 0)}`}>
                <Heart size={32} className="inline mr-2" />{selectedItem.match_score || 0}%
              </div>
              <div>
                <p className="text-white font-medium">Match Score</p>
                <p className="text-slate-400 text-sm">Budget: {selectedItem.budget_range || 'N/A'}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div><label className="text-sm text-slate-400">Category</label><p className="text-white mt-1">{selectedItem.category || 'N/A'}</p></div>
              <div><label className="text-sm text-slate-400">Occasion</label><p className="text-white mt-1">{selectedItem.occasion || 'N/A'}</p></div>
              <div><label className="text-sm text-slate-400">Budget</label><p className="text-white mt-1">{selectedItem.budget_range || 'N/A'}</p></div>
              <div><label className="text-sm text-slate-400">Created</label><p className="text-white mt-1">{new Date(selectedItem.created_at).toLocaleString()}</p></div>
            </div>
            <AIResultDisplay data={typeof selectedItem.ai_analysis === 'string' ? JSON.parse(selectedItem.ai_analysis) : selectedItem.ai_analysis} title="Gift Match Analysis" />
          </div>
        )}
      </Modal>

      {/* Create Form Modal */}
      <Modal isOpen={isFormModalOpen} onClose={() => setIsFormModalOpen(false)} title="New Gift Match" size="md">
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
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Occasion</label>
              <select value={formData.occasion} onChange={(e) => setFormData({ ...formData, occasion: e.target.value })}
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:border-rose-500">
                <option value="">Select occasion</option>
                {occasions.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Budget Range</label>
              <select value={formData.budget_range} onChange={(e) => setFormData({ ...formData, budget_range: e.target.value })}
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:border-rose-500">
                <option value="">Select budget</option>
                {budgetRanges.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Recipient Profile</label>
            <div className="grid grid-cols-2 gap-3">
              <input type="number" placeholder="Age" value={formData.recipient_profile.age}
                onChange={(e) => setFormData({ ...formData, recipient_profile: { ...formData.recipient_profile, age: e.target.value } })}
                className="px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:border-rose-500" />
              <select value={formData.recipient_profile.gender}
                onChange={(e) => setFormData({ ...formData, recipient_profile: { ...formData.recipient_profile, gender: e.target.value } })}
                className="px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:border-rose-500">
                <option value="">Gender</option>
                <option value="male">Male</option><option value="female">Female</option>
                <option value="non-binary">Non-binary</option><option value="other">Other</option>
              </select>
            </div>
            <textarea placeholder="Interests (e.g., cooking, fitness, technology)" value={formData.recipient_profile.interests}
              onChange={(e) => setFormData({ ...formData, recipient_profile: { ...formData.recipient_profile, interests: e.target.value } })}
              className="w-full mt-3 px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-rose-500 min-h-[60px]" maxLength={500} />
          </div>
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={() => setIsFormModalOpen(false)} className="flex-1 px-4 py-3 bg-slate-700 text-white rounded-xl hover:bg-slate-600 transition-colors">Cancel</button>
            <button type="submit" disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-xl hover:from-rose-600 hover:to-pink-600 transition-all disabled:opacity-50">
              {saving ? <><Loader2 size={20} className="animate-spin" /> Analyzing...</> : <><Sparkles size={20} /> Analyze Gift Match</>}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Gift Suggestion" size="md">
        {editingItem && (
          <form onSubmit={handleUpdateItem} className="space-y-4">
            <div><label className="block text-sm font-medium text-slate-300 mb-2">Product</label><p className="text-white">{editingItem.product_name}</p></div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Status</label>
              <select value={editFormData.status} onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:border-rose-500">
                <option value="pending">Pending</option><option value="processing">Processing</option><option value="completed">Completed</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Occasion</label>
                <select value={editFormData.occasion} onChange={(e) => setEditFormData({ ...editFormData, occasion: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:border-rose-500">
                  {occasions.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Budget Range</label>
                <select value={editFormData.budget_range} onChange={(e) => setEditFormData({ ...editFormData, budget_range: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:border-rose-500">
                  {budgetRanges.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
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

export default GiftSuggester;
