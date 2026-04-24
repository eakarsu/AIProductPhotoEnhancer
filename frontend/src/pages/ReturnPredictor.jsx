import React, { useState, useEffect } from 'react';
import { RotateCcw, Plus, Loader2, Sparkles, RefreshCw, Save, Edit2, Trash2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { returnPredictorAPI, productsAPI } from '../services/api';
import Modal from '../components/Modal';
import AIResultDisplay from '../components/AIResultDisplay';
import DataTable from '../components/DataTable';
import { useToast } from '../components/Toast';
import { useConfirm } from '../components/ConfirmDialog';

function ReturnPredictor() {
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
    product_id: '',
    customer_history: { previous_orders: '', return_rate: '', account_age: '', reviews_given: '' }
  });
  const [editFormData, setEditFormData] = useState({ status: '' });
  const [saving, setSaving] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [itemsRes, productsRes] = await Promise.all([returnPredictorAPI.getAll(), productsAPI.getAll()]);
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
      const response = await returnPredictorAPI.getOne(item.id);
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
    const confirmed = await confirm({ title: 'Delete Prediction', message: `Delete return prediction for "${item.product_name}"?`, confirmText: 'Delete', variant: 'danger' });
    if (!confirmed) return;
    try {
      await returnPredictorAPI.delete(item.id);
      setItems(items.filter(i => i.id !== item.id));
      if (selectedItem?.id === item.id) setIsDetailModalOpen(false);
      toast.success('Deleted successfully');
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  const handleBulkDelete = async (ids) => {
    const confirmed = await confirm({ title: 'Bulk Delete', message: `Delete ${ids.length} predictions?`, confirmText: `Delete ${ids.length}`, variant: 'danger' });
    if (!confirmed) return;
    try {
      await Promise.all(ids.map(id => returnPredictorAPI.delete(id)));
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
      const response = await returnPredictorAPI.create(formData);
      setIsFormModalOpen(false);
      setSelectedItem(response.data);
      setIsDetailModalOpen(true);
      await fetchData();
      toast.success('Return prediction created');
    } catch (error) {
      toast.error('Failed to create prediction');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateItem = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const response = await returnPredictorAPI.update(editingItem.id, editFormData);
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
      const response = await returnPredictorAPI.analyze(selectedItem.id, {});
      setSelectedItem({ ...selectedItem, ai_analysis: response.data.ai_analysis, return_probability: response.data.return_probability });
      setItems(items.map(i => i.id === selectedItem.id ? { ...i, ai_analysis: response.data.ai_analysis, return_probability: response.data.return_probability } : i));
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

  const getRiskLevel = (prob) => {
    if (prob > 60) return { label: 'High', color: 'text-rose-400', bg: 'bg-rose-500/20', icon: AlertTriangle };
    if (prob > 30) return { label: 'Medium', color: 'text-amber-400', bg: 'bg-amber-500/20', icon: AlertTriangle };
    return { label: 'Low', color: 'text-emerald-400', bg: 'bg-emerald-500/20', icon: ShieldCheck };
  };

  const columns = [
    { header: 'Product', accessor: 'product_name', sortKey: 'product_name', render: (item) => <span className="font-medium text-white">{item.product_name}</span> },
    { header: 'Category', accessor: 'category', sortKey: 'category', render: (item) => <span className="text-slate-400">{item.category || 'N/A'}</span> },
    {
      header: 'Return Risk', sortKey: 'return_probability', accessor: (item) => item.return_probability || 0,
      render: (item) => {
        const prob = item.return_probability || 0;
        const risk = getRiskLevel(prob);
        return <span className={`font-medium ${risk.color}`}>{prob}%</span>;
      }
    },
    {
      header: 'Risk Level', noExport: false,
      accessor: (item) => getRiskLevel(item.return_probability || 0).label,
      render: (item) => {
        const risk = getRiskLevel(item.return_probability || 0);
        const Icon = risk.icon;
        return (
          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${risk.bg} ${risk.color}`}>
            <Icon size={12} /> {risk.label}
          </span>
        );
      }
    },
    { header: 'Status', accessor: 'status', sortKey: 'status', render: (item) => <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>{item.status}</span> },
    { header: 'Created', accessor: 'created_at', sortKey: 'created_at', render: (item) => <span className="text-slate-400 text-sm">{new Date(item.created_at).toLocaleDateString()}</span> },
  ];

  const filterOptions = {
    status: [{ value: 'completed', label: 'Completed' }, { value: 'processing', label: 'Processing' }, { value: 'pending', label: 'Pending' }]
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl"><RotateCcw className="w-6 h-6 text-white" /></div>
            Return Predictor
          </h1>
          <p className="text-slate-400 mt-1">Predict return risks with AI analysis</p>
        </div>
        <button onClick={() => { setFormData({ product_id: '', customer_history: { previous_orders: '', return_rate: '', account_age: '', reviews_given: '' } }); setFormErrors({}); setIsFormModalOpen(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white font-medium rounded-xl hover:from-orange-600 hover:to-red-600 transition-all">
          <Plus size={20} /> New Prediction
        </button>
      </div>

      <DataTable data={items} columns={columns} loading={loading} onRowClick={handleRowClick} onView={handleRowClick}
        onEdit={handleEditItem} onDelete={handleDeleteItem} onBulkDelete={handleBulkDelete} searchPlaceholder="Search predictions..."
        emptyIcon={RotateCcw} emptyTitle="No return predictions found" emptyDescription="Create your first AI return risk prediction."
        emptyAction="New Prediction" onEmptyAction={() => setIsFormModalOpen(true)} filterOptions={filterOptions} title="Return Predictions" />

      {/* Detail Modal */}
      <Modal isOpen={isDetailModalOpen} onClose={() => setIsDetailModalOpen(false)} title="Return Prediction Details" size="xl">
        {selectedItem && (() => {
          const risk = getRiskLevel(selectedItem.return_probability || 0);
          const RiskIcon = risk.icon;
          return (
            <div className="space-y-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-white">{selectedItem.product_name}</h3>
                  <span className={`inline-block px-3 py-1 mt-2 text-sm rounded-full ${getStatusColor(selectedItem.status)}`}>{selectedItem.status}</span>
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
              {/* Risk display */}
              <div className={`flex items-center gap-4 p-4 glass rounded-xl ${risk.bg}`}>
                <RiskIcon size={40} className={risk.color} />
                <div>
                  <div className={`text-4xl font-bold ${risk.color}`}>{selectedItem.return_probability || 0}%</div>
                  <p className={`font-medium ${risk.color}`}>{risk.label} Risk</p>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div><label className="text-sm text-slate-400">Category</label><p className="text-white mt-1">{selectedItem.category || 'N/A'}</p></div>
                <div><label className="text-sm text-slate-400">Created</label><p className="text-white mt-1">{new Date(selectedItem.created_at).toLocaleString()}</p></div>
                {selectedItem.risk_factors && (
                  <div><label className="text-sm text-slate-400">Risk Factors</label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {(typeof selectedItem.risk_factors === 'string' ? JSON.parse(selectedItem.risk_factors) : selectedItem.risk_factors || []).map((f, i) =>
                        <span key={i} className="px-2 py-0.5 bg-orange-500/20 text-orange-400 rounded-full text-xs">{f}</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <AIResultDisplay data={typeof selectedItem.ai_analysis === 'string' ? JSON.parse(selectedItem.ai_analysis) : selectedItem.ai_analysis} title="Return Risk Analysis" />
            </div>
          );
        })()}
      </Modal>

      {/* Create Form Modal */}
      <Modal isOpen={isFormModalOpen} onClose={() => setIsFormModalOpen(false)} title="New Return Prediction" size="md">
        <form onSubmit={handleSaveItem} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Select Product *</label>
            <select value={formData.product_id} onChange={(e) => setFormData({ ...formData, product_id: e.target.value })}
              className={`w-full px-4 py-3 bg-slate-800/50 border rounded-xl text-white focus:outline-none focus:border-orange-500 ${formErrors.product_id ? 'border-rose-500' : 'border-slate-600'}`} required>
              <option value="">Choose a product</option>
              {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.category || 'No category'})</option>)}
            </select>
            {formErrors.product_id && <p className="text-rose-400 text-xs mt-1">{formErrors.product_id}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Customer History</label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Previous Orders</label>
                <input type="number" placeholder="e.g., 10" value={formData.customer_history.previous_orders}
                  onChange={(e) => setFormData({ ...formData, customer_history: { ...formData.customer_history, previous_orders: e.target.value } })}
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:border-orange-500" min="0" />
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Return Rate (%)</label>
                <input type="number" placeholder="e.g., 5" value={formData.customer_history.return_rate}
                  onChange={(e) => setFormData({ ...formData, customer_history: { ...formData.customer_history, return_rate: e.target.value } })}
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:border-orange-500" min="0" max="100" />
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Account Age (months)</label>
                <input type="number" placeholder="e.g., 12" value={formData.customer_history.account_age}
                  onChange={(e) => setFormData({ ...formData, customer_history: { ...formData.customer_history, account_age: e.target.value } })}
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:border-orange-500" min="0" />
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Reviews Given</label>
                <input type="number" placeholder="e.g., 3" value={formData.customer_history.reviews_given}
                  onChange={(e) => setFormData({ ...formData, customer_history: { ...formData.customer_history, reviews_given: e.target.value } })}
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:border-orange-500" min="0" />
              </div>
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={() => setIsFormModalOpen(false)} className="flex-1 px-4 py-3 bg-slate-700 text-white rounded-xl hover:bg-slate-600 transition-colors">Cancel</button>
            <button type="submit" disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl hover:from-orange-600 hover:to-red-600 transition-all disabled:opacity-50">
              {saving ? <><Loader2 size={20} className="animate-spin" /> Predicting...</> : <><Sparkles size={20} /> Predict Return Risk</>}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Return Prediction" size="md">
        {editingItem && (
          <form onSubmit={handleUpdateItem} className="space-y-4">
            <div><label className="block text-sm font-medium text-slate-300 mb-2">Product</label><p className="text-white">{editingItem.product_name}</p></div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Status</label>
              <select value={editFormData.status} onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:border-orange-500">
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

export default ReturnPredictor;
