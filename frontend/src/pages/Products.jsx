import React, { useState, useEffect } from 'react';
import {
  Package, Plus, Edit2, Trash2, Loader2, Save, Image as ImageIcon, Search, X,
  ArrowUpDown, ArrowUp, ArrowDown, Download, CheckSquare, Square, ChevronDown,
  Filter
} from 'lucide-react';
import { productsAPI } from '../services/api';
import Modal from '../components/Modal';
import ImageUpload from '../components/ImageUpload';
import ImagePreview from '../components/ImagePreview';
import Pagination from '../components/Pagination';
import EmptyState from '../components/EmptyState';
import { useToast } from '../components/Toast';
import { useConfirm } from '../components/ConfirmDialog';

function Products() {
  const toast = useToast();
  const confirm = useConfirm();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '', category: '', original_image: '' });
  const [saving, setSaving] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);

  // Sort
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  // Filter
  const [filterCategory, setFilterCategory] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  // Bulk
  const [selectedIds, setSelectedIds] = useState(new Set());

  useEffect(() => { fetchProducts(); }, []);

  const fetchProducts = async () => {
    try {
      const response = await productsAPI.getAll();
      setProducts(response.data);
    } catch (error) {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleRowClick = (product) => {
    setSelectedProduct(product);
    setIsDetailModalOpen(true);
  };

  const handleNewProduct = () => {
    setEditingProduct(null);
    setFormData({ name: '', description: '', category: '', original_image: '' });
    setFormErrors({});
    setIsFormModalOpen(true);
  };

  const handleEditProduct = (product, e) => {
    e?.stopPropagation();
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || '',
      category: product.category || '',
      original_image: product.original_image || ''
    });
    setFormErrors({});
    setIsFormModalOpen(true);
  };

  const handleDeleteProduct = async (product, e) => {
    e?.stopPropagation();
    const confirmed = await confirm({
      title: 'Delete Product',
      message: `Are you sure you want to delete "${product.name}"? This will also delete all related AI analyses.`,
      confirmText: 'Delete',
      variant: 'danger'
    });
    if (!confirmed) return;
    try {
      await productsAPI.delete(product.id);
      setProducts(products.filter(p => p.id !== product.id));
      if (selectedProduct?.id === product.id) setIsDetailModalOpen(false);
      toast.success('Product deleted');
    } catch (error) {
      toast.error('Failed to delete product');
    }
  };

  const handleBulkDelete = async () => {
    const confirmed = await confirm({
      title: 'Bulk Delete Products',
      message: `Are you sure you want to delete ${selectedIds.size} products and all their related data?`,
      confirmText: `Delete ${selectedIds.size} Products`,
      variant: 'danger'
    });
    if (!confirmed) return;
    try {
      await Promise.all([...selectedIds].map(id => productsAPI.delete(id)));
      setProducts(products.filter(p => !selectedIds.has(p.id)));
      setSelectedIds(new Set());
      toast.success(`${selectedIds.size} products deleted`);
    } catch (error) {
      toast.error('Failed to delete some products');
    }
  };

  const validateForm = () => {
    const errs = {};
    if (!formData.name.trim()) errs.name = 'Product name is required';
    else if (formData.name.length > 255) errs.name = 'Name must be under 255 characters';
    if (formData.description.length > 5000) errs.description = 'Description must be under 5000 characters';
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setSaving(true);
    try {
      if (editingProduct) {
        const response = await productsAPI.update(editingProduct.id, formData);
        setProducts(products.map(p => p.id === editingProduct.id ? response.data : p));
        if (selectedProduct?.id === editingProduct.id) setSelectedProduct(response.data);
        toast.success('Product updated');
      } else {
        const response = await productsAPI.create(formData);
        setProducts([response.data, ...products]);
        toast.success('Product created');
      }
      setIsFormModalOpen(false);
    } catch (error) {
      toast.error('Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = (url) => {
    setFormData({ ...formData, original_image: url });
  };

  // Search + Filter
  let filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  if (filterCategory !== 'all') {
    filteredProducts = filteredProducts.filter(p => p.category === filterCategory);
  }

  // Sort
  if (sortConfig.key) {
    filteredProducts = [...filteredProducts].sort((a, b) => {
      const aVal = a[sortConfig.key] || '';
      const bVal = b[sortConfig.key] || '';
      const cmp = String(aVal).localeCompare(String(bVal));
      return sortConfig.direction === 'asc' ? cmp : -cmp;
    });
  }

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / pageSize);
  const paginatedProducts = filteredProducts.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleSort = (key) => {
    setSortConfig(prev => ({ key, direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc' }));
  };

  const toggleSelect = (id, e) => {
    e.stopPropagation();
    setSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === paginatedProducts.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(paginatedProducts.map(p => p.id)));
  };

  const exportCSV = () => {
    const rows = [['Name', 'Category', 'Description', 'Price', 'Created']];
    filteredProducts.forEach(p => rows.push([p.name, p.category || '', p.description || '', p.price || '', new Date(p.created_at).toLocaleDateString()]));
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `products_${new Date().toISOString().slice(0,10)}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const categories = [...new Set(products.map(p => p.category).filter(Boolean))].sort();

  const hasActiveFilter = filterCategory !== 'all';

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl">
              <Package className="w-6 h-6 text-white" />
            </div>
            Products
          </h1>
          <p className="text-slate-400 mt-1">Manage your product catalog</p>
        </div>
        <button onClick={handleNewProduct}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-sky-500 to-indigo-500 text-white font-medium rounded-xl hover:from-sky-600 hover:to-indigo-600 transition-all">
          <Plus size={20} /> New Product
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input type="text" placeholder="Search products..." value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            className="w-full pl-12 pr-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-sky-500 text-sm" />
          {searchTerm && <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"><X size={16} /></button>}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm transition-colors ${hasActiveFilter ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30' : 'bg-slate-800/50 text-slate-400 border border-slate-700 hover:text-white'}`}>
            <Filter size={16} /> Filters {hasActiveFilter && <span className="w-2 h-2 bg-sky-400 rounded-full" />}
          </button>
          {selectedIds.size > 0 && (
            <button onClick={handleBulkDelete}
              className="flex items-center gap-2 px-3 py-2.5 bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl text-sm hover:bg-rose-500/30">
              <Trash2 size={16} /> Delete ({selectedIds.size})
            </button>
          )}
          {filteredProducts.length > 0 && (
            <button onClick={exportCSV}
              className="flex items-center gap-2 px-3 py-2.5 bg-slate-800/50 text-slate-400 border border-slate-700 rounded-xl text-sm hover:text-white">
              <Download size={16} /> CSV
            </button>
          )}
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="glass rounded-xl p-4 mb-4 flex flex-wrap gap-4 items-end">
          <div className="min-w-[150px]">
            <label className="block text-xs font-medium text-slate-400 mb-1">Category</label>
            <select value={filterCategory} onChange={(e) => { setFilterCategory(e.target.value); setCurrentPage(1); }}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-600 text-white rounded-lg text-sm focus:outline-none focus:border-sky-500">
              <option value="all">All Categories</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          {hasActiveFilter && <button onClick={() => { setFilterCategory('all'); setCurrentPage(1); }} className="flex items-center gap-1 px-3 py-2 text-sm text-slate-400 hover:text-white"><X size={14} /> Clear</button>}
        </div>
      )}

      {/* Sort buttons */}
      <div className="flex gap-2 mb-4 text-xs">
        {[{key:'name',label:'Name'},{key:'category',label:'Category'},{key:'created_at',label:'Date'}].map(s => (
          <button key={s.key} onClick={() => handleSort(s.key)}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg transition-colors ${sortConfig.key === s.key ? 'bg-sky-500/20 text-sky-400' : 'text-slate-500 hover:text-slate-300'}`}>
            {s.label}
            {sortConfig.key === s.key ? (sortConfig.direction === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />) : <ArrowUpDown size={12} className="opacity-30" />}
          </button>
        ))}
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="glass rounded-xl p-4 h-64 shimmer" />)}
        </div>
      ) : filteredProducts.length === 0 ? (
        <EmptyState icon={Package} title={searchTerm || hasActiveFilter ? 'No matching products' : 'No products yet'}
          description={searchTerm || hasActiveFilter ? 'Try adjusting your search or filters.' : 'Get started by creating your first product.'}
          actionLabel={!searchTerm && !hasActiveFilter ? 'New Product' : undefined} onAction={handleNewProduct} />
      ) : (
        <>
          {/* Select All */}
          <div className="flex items-center gap-3 mb-3">
            <button onClick={toggleSelectAll} className="text-slate-400 hover:text-white flex items-center gap-2 text-sm">
              {selectedIds.size === paginatedProducts.length && paginatedProducts.length > 0
                ? <CheckSquare size={18} className="text-sky-400" />
                : <Square size={18} />}
              {selectedIds.size > 0 ? `${selectedIds.size} selected` : 'Select all'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginatedProducts.map((product) => (
              <div key={product.id} onClick={() => handleRowClick(product)}
                className={`glass rounded-xl overflow-hidden cursor-pointer card-hover group ${selectedIds.has(product.id) ? 'ring-2 ring-sky-500/50' : ''}`}>
                <div className="h-40 bg-slate-800 relative">
                  {product.original_image ? (
                    <img src={product.original_image} alt={product.name} className="w-full h-full object-cover"
                      onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
                  ) : null}
                  <div className={`absolute inset-0 flex items-center justify-center ${product.original_image ? 'hidden' : 'flex'}`}>
                    <ImageIcon className="w-12 h-12 text-slate-600" />
                  </div>
                  <div className="absolute top-2 left-2" onClick={(e) => toggleSelect(product.id, e)}>
                    {selectedIds.has(product.id) ? <CheckSquare size={20} className="text-sky-400" /> : <Square size={20} className="text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" />}
                  </div>
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={(e) => handleEditProduct(product, e)} className="p-2 bg-slate-900/80 text-slate-400 hover:text-sky-400 rounded-lg"><Edit2 size={16} /></button>
                    <button onClick={(e) => { e.stopPropagation(); handleDeleteProduct(product, e); }} className="p-2 bg-slate-900/80 text-slate-400 hover:text-rose-400 rounded-lg"><Trash2 size={16} /></button>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-white truncate">{product.name}</h3>
                  <span className="inline-block px-2 py-1 mt-1 text-xs bg-slate-700 text-slate-300 rounded-full">{product.category || 'Uncategorized'}</span>
                  <p className="text-sm text-slate-400 line-clamp-2 mt-2">{product.description || 'No description'}</p>
                  <div className="flex items-center justify-between text-xs text-slate-500 mt-3">
                    <span>ID: {product.id}</span>
                    <span>{new Date(product.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={(p) => { setCurrentPage(p); setSelectedIds(new Set()); }}
            totalItems={filteredProducts.length} itemsPerPage={pageSize} onItemsPerPageChange={(s) => { setPageSize(s); setCurrentPage(1); }} />
        </>
      )}

      {/* Detail Modal */}
      <Modal isOpen={isDetailModalOpen} onClose={() => setIsDetailModalOpen(false)} title="Product Details" size="lg">
        {selectedProduct && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="w-full md:w-1/2">
                <ImagePreview src={selectedProduct.original_image} alt={selectedProduct.name} className="h-64 w-full" />
              </div>
              <div className="w-full md:w-1/2 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-semibold text-white">{selectedProduct.name}</h3>
                    <span className="inline-block px-3 py-1 mt-2 text-sm bg-sky-500/20 text-sky-400 rounded-full">{selectedProduct.category || 'Uncategorized'}</span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={(e) => { setIsDetailModalOpen(false); handleEditProduct(selectedProduct, e); }}
                      className="flex items-center gap-2 px-3 py-2 bg-sky-500/20 text-sky-400 rounded-lg hover:bg-sky-500/30">
                      <Edit2 size={16} /> Edit
                    </button>
                    <button onClick={(e) => handleDeleteProduct(selectedProduct, e)}
                      className="flex items-center gap-2 px-3 py-2 bg-rose-500/20 text-rose-400 rounded-lg hover:bg-rose-500/30">
                      <Trash2 size={16} /> Delete
                    </button>
                  </div>
                </div>
                <div><label className="text-sm text-slate-400">Description</label><p className="text-white mt-1">{selectedProduct.description || 'No description'}</p></div>
                {selectedProduct.price && <div><label className="text-sm text-slate-400">Price</label><p className="text-white mt-1">${selectedProduct.price}</p></div>}
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="text-sm text-slate-400">Created</label><p className="text-white mt-1">{new Date(selectedProduct.created_at).toLocaleString()}</p></div>
                  <div><label className="text-sm text-slate-400">Updated</label><p className="text-white mt-1">{new Date(selectedProduct.updated_at).toLocaleString()}</p></div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Form Modal */}
      <Modal isOpen={isFormModalOpen} onClose={() => setIsFormModalOpen(false)} title={editingProduct ? 'Edit Product' : 'New Product'} size="lg">
        <form onSubmit={handleSaveProduct} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Product Image</label>
              <ImageUpload onUpload={handleImageUpload} currentImage={formData.original_image} />
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Product Name *</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`w-full px-4 py-3 bg-slate-800/50 border rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-sky-500 ${formErrors.name ? 'border-rose-500' : 'border-slate-600'}`}
                  placeholder="Enter product name" required />
                {formErrors.name && <p className="text-rose-400 text-xs mt-1">{formErrors.name}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Category</label>
                <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:border-sky-500">
                  <option value="">Select category</option>
                  {['Electronics','Accessories','Home & Kitchen','Footwear','Beauty','Fitness','Fashion','Sports','Home & Garden','Home'].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
                <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className={`w-full px-4 py-3 bg-slate-800/50 border rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-sky-500 min-h-[100px] ${formErrors.description ? 'border-rose-500' : 'border-slate-600'}`}
                  placeholder="Enter product description" maxLength={5000} />
                <p className="text-xs text-slate-500 mt-1">{formData.description.length}/5000</p>
                {formErrors.description && <p className="text-rose-400 text-xs mt-1">{formErrors.description}</p>}
              </div>
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={() => setIsFormModalOpen(false)} className="flex-1 px-4 py-3 bg-slate-700 text-white rounded-xl hover:bg-slate-600 transition-colors">Cancel</button>
            <button type="submit" disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-sky-500 to-indigo-500 text-white rounded-xl hover:from-sky-600 hover:to-indigo-600 transition-all disabled:opacity-50">
              {saving ? <><Loader2 size={20} className="animate-spin" /> Saving...</> : <><Save size={20} /> {editingProduct ? 'Update' : 'Create'}</>}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default Products;
