import React, { useState, useEffect } from 'react';
import { Award, Plus, Loader2, Sparkles, RefreshCw, Trash2, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { qualityAssessmentAPI, productsAPI } from '../services/api';
import Modal from '../components/Modal';
import AIResultDisplay from '../components/AIResultDisplay';
import ImagePreview from '../components/ImagePreview';
import DataTable from '../components/DataTable';
import { useToast } from '../components/Toast';
import { useConfirm } from '../components/ConfirmDialog';

function QualityAssessment() {
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
  const [assessing, setAssessing] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  const loadSampleData = () => {
    setFormData({
      product_id: products.length > 0 ? products[0].id : '',
      image_description: 'A professional product photo of a ceramic coffee mug on a white background. The image has good lighting from the left side, sharp focus on the mug handle, and a subtle reflection beneath. Resolution is 2400x2400px.'
    });
  };

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [itemsRes, productsRes] = await Promise.all([qualityAssessmentAPI.getAll(), productsAPI.getAll()]);
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
      const response = await qualityAssessmentAPI.getOne(item.id);
      setSelectedItem(response.data);
      setIsDetailModalOpen(true);
    } catch (error) {
      toast.error('Failed to load details');
    }
  };

  const handleDeleteItem = async (item) => {
    const confirmed = await confirm({
      title: 'Delete Quality Assessment',
      message: `Are you sure you want to delete this assessment for "${item.product_name}"?`,
      confirmText: 'Delete',
      variant: 'danger'
    });
    if (!confirmed) return;
    try {
      await qualityAssessmentAPI.delete(item.id);
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
      await Promise.all(ids.map(id => qualityAssessmentAPI.delete(id)));
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
      const response = await qualityAssessmentAPI.create(formData);
      setIsFormModalOpen(false);
      setSelectedItem(response.data);
      setIsDetailModalOpen(true);
      await fetchData();
      toast.success('Quality assessment created');
    } catch (error) {
      toast.error('Failed to create assessment');
    } finally {
      setSaving(false);
    }
  };

  const handleReassess = async () => {
    if (!selectedItem) return;
    setAssessing(true);
    try {
      const response = await qualityAssessmentAPI.assess(selectedItem.id, { image_description: selectedItem.product_description });
      setSelectedItem({ ...selectedItem, ai_analysis: response.data.ai_analysis, overall_score: response.data.overall_score });
      setItems(items.map(i => i.id === selectedItem.id ? { ...i, ai_analysis: response.data.ai_analysis, overall_score: response.data.overall_score } : i));
      toast.success('Re-assessment complete');
    } catch (error) {
      toast.error('Failed to re-assess');
    } finally {
      setAssessing(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return { bg: 'bg-emerald-500', text: 'text-emerald-400', bgLight: 'bg-emerald-500/20' };
    if (score >= 60) return { bg: 'bg-amber-500', text: 'text-amber-400', bgLight: 'bg-amber-500/20' };
    return { bg: 'bg-rose-500', text: 'text-rose-400', bgLight: 'bg-rose-500/20' };
  };

  const getScoreIcon = (score) => {
    if (score >= 80) return TrendingUp;
    if (score >= 60) return Minus;
    return TrendingDown;
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
      header: 'Overall Score', accessor: 'overall_score', sortKey: 'overall_score',
      render: (item) => {
        const score = item.overall_score || 0;
        const colors = getScoreColor(score);
        return (
          <div className="flex items-center gap-2">
            <div className={`w-10 h-10 rounded-full ${colors.bgLight} flex items-center justify-center`}>
              <span className={`text-sm font-bold ${colors.text}`}>{score}</span>
            </div>
            <div className="flex-1 hidden sm:block">
              <div className="w-full max-w-[80px] h-1.5 bg-slate-700 rounded-full overflow-hidden">
                <div className={`h-full ${colors.bg} rounded-full`} style={{ width: `${score}%` }} />
              </div>
            </div>
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
            <div className="p-2 bg-gradient-to-br from-sky-500 to-indigo-500 rounded-xl">
              <Award className="w-6 h-6 text-white" />
            </div>
            Quality Assessment
          </h1>
          <p className="text-slate-400 mt-1">AI-powered image quality evaluation for e-commerce</p>
        </div>
        <button onClick={() => { setFormData({ product_id: '', image_description: '' }); setFormErrors({}); setIsFormModalOpen(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-sky-500 to-indigo-500 text-white font-medium rounded-xl hover:from-sky-600 hover:to-indigo-600 transition-all">
          <Plus size={20} /> Assess Quality
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
        emptyIcon={Award}
        emptyTitle="No quality assessments found"
        emptyDescription="Create your first AI quality assessment."
        emptyAction="Assess Quality"
        onEmptyAction={() => setIsFormModalOpen(true)}
        filterOptions={filterOptions}
        title="Quality Assessments"
      />

      {/* Detail Modal */}
      <Modal isOpen={isDetailModalOpen} onClose={() => setIsDetailModalOpen(false)} title="Quality Assessment Details" size="xl">
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
                    <button onClick={handleReassess} disabled={assessing}
                      className="flex items-center gap-2 px-3 py-2 bg-sky-500/20 text-sky-400 rounded-lg hover:bg-sky-500/30 disabled:opacity-50">
                      {assessing ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />} Re-assess
                    </button>
                    <button onClick={() => handleDeleteItem(selectedItem)}
                      className="flex items-center gap-2 px-3 py-2 bg-rose-500/20 text-rose-400 rounded-lg hover:bg-rose-500/30">
                      <Trash2 size={16} /> Delete
                    </button>
                  </div>
                </div>
                {(() => {
                  const score = selectedItem.overall_score || 0;
                  const colors = getScoreColor(score);
                  const ScoreIcon = getScoreIcon(score);
                  return (
                    <div className={`mt-4 p-6 ${colors.bgLight} border border-slate-700 rounded-xl`}>
                      <div className="flex items-center gap-6">
                        <div className={`relative w-24 h-24 rounded-full ${colors.bgLight} flex items-center justify-center border-4 ${colors.bg.replace('bg-', 'border-')}`}>
                          <span className={`text-3xl font-bold ${colors.text}`}>{score}</span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <ScoreIcon size={24} className={colors.text} />
                            <span className={`text-xl font-semibold ${colors.text}`}>
                              {score >= 80 ? 'Excellent Quality' : score >= 60 ? 'Good Quality' : 'Needs Improvement'}
                            </span>
                          </div>
                          <p className="text-slate-400 text-sm">
                            {score >= 80 ? 'This image meets e-commerce quality standards and is ready for publishing.' : score >= 60 ? 'This image is acceptable but could benefit from some improvements.' : 'This image needs significant improvements before publishing.'}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })()}
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div><label className="text-sm text-slate-400">Category</label><p className="text-white mt-1">{selectedItem.category || 'N/A'}</p></div>
                  <div><label className="text-sm text-slate-400">Created</label><p className="text-white mt-1">{new Date(selectedItem.created_at).toLocaleString()}</p></div>
                </div>
              </div>
            </div>
            <AIResultDisplay data={typeof selectedItem.ai_analysis === 'string' ? JSON.parse(selectedItem.ai_analysis) : selectedItem.ai_analysis} title="Quality Assessment" />
          </div>
        )}
      </Modal>

      {/* Create Form Modal */}
      <Modal isOpen={isFormModalOpen} onClose={() => setIsFormModalOpen(false)} title="New Quality Assessment" size="md">
        <form onSubmit={handleSaveItem} className="space-y-4">
          <button type="button" onClick={loadSampleData}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-700/50 border border-dashed border-slate-500 text-slate-300 rounded-xl hover:bg-slate-700 hover:border-slate-400 transition-all text-sm">
            <Sparkles size={16} /> Load Sample Data
          </button>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Select Product *</label>
            <select value={formData.product_id} onChange={(e) => setFormData({ ...formData, product_id: e.target.value })}
              className={`w-full px-4 py-3 bg-slate-800/50 border rounded-xl text-white focus:outline-none focus:border-sky-500 ${formErrors.product_id ? 'border-rose-500' : 'border-slate-600'}`} required>
              <option value="">Choose a product</option>
              {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.category || 'No category'})</option>)}
            </select>
            {formErrors.product_id && <p className="text-rose-400 text-xs mt-1">{formErrors.product_id}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Image Description (Optional)</label>
            <textarea value={formData.image_description} onChange={(e) => setFormData({ ...formData, image_description: e.target.value })}
              className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-sky-500 min-h-[100px]"
              placeholder="Describe the image quality characteristics..." maxLength={2000} />
            <p className="text-xs text-slate-500 mt-1">{formData.image_description.length}/2000</p>
          </div>
          <div className="p-4 bg-sky-500/10 border border-sky-500/20 rounded-xl">
            <div className="flex items-center gap-2 text-sky-400 mb-2"><Sparkles size={16} /><span className="font-medium">AI Quality Expert</span></div>
            <p className="text-sm text-slate-400">Our AI will evaluate composition, lighting, focus, and e-commerce readiness.</p>
          </div>
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={() => setIsFormModalOpen(false)} className="flex-1 px-4 py-3 bg-slate-700 text-white rounded-xl hover:bg-slate-600 transition-colors">Cancel</button>
            <button type="submit" disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-sky-500 to-indigo-500 text-white rounded-xl hover:from-sky-600 hover:to-indigo-600 transition-all disabled:opacity-50">
              {saving ? <><Loader2 size={20} className="animate-spin" /> Assessing...</> : <><Award size={20} /> Assess Quality</>}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default QualityAssessment;
