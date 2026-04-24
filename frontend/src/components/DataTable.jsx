import React, { useState, useMemo } from 'react';
import {
  ArrowUpDown, ArrowUp, ArrowDown, Search, Filter, X, Download,
  CheckSquare, Square, Trash2, Eye, Edit2, ChevronDown
} from 'lucide-react';
import Pagination from './Pagination';
import EmptyState from './EmptyState';

function DataTable({
  data = [],
  columns = [],
  onRowClick,
  onEdit,
  onDelete,
  onView,
  onBulkDelete,
  loading = false,
  searchPlaceholder = 'Search...',
  emptyIcon,
  emptyTitle,
  emptyDescription,
  emptyAction,
  onEmptyAction,
  pageSize: defaultPageSize = 10,
  enableSearch = true,
  enableSort = true,
  enableFilter = true,
  enableBulkOps = true,
  enableExport = true,
  enablePagination = true,
  filterOptions = {},
  title = '',
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [filters, setFilters] = useState({});
  const [showFilters, setShowFilters] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);

  // Search
  const searchedData = useMemo(() => {
    if (!searchTerm) return data;
    const term = searchTerm.toLowerCase();
    return data.filter(item =>
      columns.some(col => {
        const val = col.accessor ? (typeof col.accessor === 'function' ? col.accessor(item) : item[col.accessor]) : '';
        return String(val || '').toLowerCase().includes(term);
      })
    );
  }, [data, searchTerm, columns]);

  // Filter
  const filteredData = useMemo(() => {
    let result = searchedData;
    for (const [key, value] of Object.entries(filters)) {
      if (value && value !== 'all') {
        result = result.filter(item => String(item[key]) === value);
      }
    }
    return result;
  }, [searchedData, filters]);

  // Sort
  const sortedData = useMemo(() => {
    if (!sortConfig.key) return filteredData;
    return [...filteredData].sort((a, b) => {
      const col = columns.find(c => (c.sortKey || c.accessor) === sortConfig.key);
      const aVal = col?.accessor ? (typeof col.accessor === 'function' ? col.accessor(a) : a[col.accessor]) : a[sortConfig.key];
      const bVal = col?.accessor ? (typeof col.accessor === 'function' ? col.accessor(b) : b[col.accessor]) : b[sortConfig.key];

      if (aVal == null) return 1;
      if (bVal == null) return -1;
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
      }
      const comparison = String(aVal).localeCompare(String(bVal));
      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });
  }, [filteredData, sortConfig, columns]);

  // Pagination
  const totalPages = Math.ceil(sortedData.length / pageSize);
  const paginatedData = enablePagination
    ? sortedData.slice((currentPage - 1) * pageSize, currentPage * pageSize)
    : sortedData;

  const handleSort = (key) => {
    if (!enableSort) return;
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === paginatedData.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginatedData.map(d => d.id)));
    }
  };

  const handleBulkDelete = () => {
    if (onBulkDelete && selectedIds.size > 0) {
      onBulkDelete([...selectedIds]);
      setSelectedIds(new Set());
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    setSelectedIds(new Set());
  };

  const handlePageSizeChange = (size) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  // Export CSV
  const exportCSV = () => {
    const headers = columns.filter(c => !c.noExport).map(c => c.header);
    const rows = sortedData.map(item =>
      columns.filter(c => !c.noExport).map(col => {
        const val = col.accessor ? (typeof col.accessor === 'function' ? col.accessor(item) : item[col.accessor]) : '';
        return `"${String(val || '').replace(/"/g, '""')}"`;
      })
    );
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title || 'export'}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export PDF (simple HTML-to-print)
  const exportPDF = () => {
    const headers = columns.filter(c => !c.noExport).map(c => c.header);
    const rows = sortedData.map(item =>
      columns.filter(c => !c.noExport).map(col => {
        const val = col.accessor ? (typeof col.accessor === 'function' ? col.accessor(item) : item[col.accessor]) : '';
        return String(val || '');
      })
    );
    const html = `<html><head><title>${title || 'Export'}</title>
      <style>body{font-family:sans-serif;padding:20px}table{border-collapse:collapse;width:100%}th,td{border:1px solid #ddd;padding:8px;text-align:left}th{background:#f5f5f5;font-weight:bold}tr:nth-child(even){background:#fafafa}h1{font-size:18px;margin-bottom:10px}</style>
    </head><body><h1>${title || 'Export'}</h1><p>Exported: ${new Date().toLocaleDateString()} | Total: ${sortedData.length} items</p>
    <table><thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
    <tbody>${rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></body></html>`;
    const w = window.open('', '_blank');
    w.document.write(html);
    w.document.close();
    w.print();
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="glass rounded-xl p-4 h-16 shimmer" />
        ))}
      </div>
    );
  }

  const hasActiveFilters = Object.values(filters).some(v => v && v !== 'all');

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-3 mb-4">
        {enableSearch && (
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full pl-12 pr-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-sky-500 text-sm"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
                <X size={16} />
              </button>
            )}
          </div>
        )}

        <div className="flex items-center gap-2">
          {enableFilter && Object.keys(filterOptions).length > 0 && (
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm transition-colors ${
                hasActiveFilters ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30' : 'bg-slate-800/50 text-slate-400 border border-slate-700 hover:text-white'
              }`}
            >
              <Filter size={16} />
              Filters
              {hasActiveFilters && <span className="w-2 h-2 bg-sky-400 rounded-full" />}
            </button>
          )}

          {enableBulkOps && selectedIds.size > 0 && (
            <button
              onClick={handleBulkDelete}
              className="flex items-center gap-2 px-3 py-2.5 bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl text-sm hover:bg-rose-500/30"
            >
              <Trash2 size={16} />
              Delete ({selectedIds.size})
            </button>
          )}

          {enableExport && sortedData.length > 0 && (
            <div className="relative group">
              <button className="flex items-center gap-2 px-3 py-2.5 bg-slate-800/50 text-slate-400 border border-slate-700 rounded-xl text-sm hover:text-white">
                <Download size={16} />
                Export
                <ChevronDown size={14} />
              </button>
              <div className="absolute right-0 top-full mt-1 bg-slate-800 border border-slate-700 rounded-xl shadow-xl overflow-hidden hidden group-hover:block z-10 min-w-[140px]">
                <button onClick={exportCSV} className="w-full px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-700 hover:text-white text-left">
                  Export CSV
                </button>
                <button onClick={exportPDF} className="w-full px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-700 hover:text-white text-left">
                  Export PDF
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && Object.keys(filterOptions).length > 0 && (
        <div className="glass rounded-xl p-4 mb-4 flex flex-wrap gap-4 items-end">
          {Object.entries(filterOptions).map(([key, options]) => (
            <div key={key} className="min-w-[150px]">
              <label className="block text-xs font-medium text-slate-400 mb-1 capitalize">{key.replace(/_/g, ' ')}</label>
              <select
                value={filters[key] || 'all'}
                onChange={(e) => { setFilters(prev => ({ ...prev, [key]: e.target.value })); setCurrentPage(1); }}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-600 text-white rounded-lg text-sm focus:outline-none focus:border-sky-500"
              >
                <option value="all">All</option>
                {options.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          ))}
          {hasActiveFilters && (
            <button
              onClick={() => { setFilters({}); setCurrentPage(1); }}
              className="flex items-center gap-1 px-3 py-2 text-sm text-slate-400 hover:text-white"
            >
              <X size={14} /> Clear
            </button>
          )}
        </div>
      )}

      {/* Table */}
      {sortedData.length === 0 ? (
        <EmptyState
          icon={emptyIcon}
          title={emptyTitle || (searchTerm || hasActiveFilters ? 'No matching results' : 'No items found')}
          description={emptyDescription || (searchTerm || hasActiveFilters ? 'Try adjusting your search or filters.' : 'Get started by creating your first item.')}
          actionLabel={!searchTerm && !hasActiveFilters ? emptyAction : undefined}
          onAction={onEmptyAction}
        />
      ) : (
        <>
          <div className="glass rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr className="border-b border-slate-700">
                    {enableBulkOps && (
                      <th className="w-10 px-3 py-3">
                        <button onClick={toggleSelectAll} className="text-slate-400 hover:text-white">
                          {selectedIds.size === paginatedData.length && paginatedData.length > 0
                            ? <CheckSquare size={18} className="text-sky-400" />
                            : <Square size={18} />
                          }
                        </button>
                      </th>
                    )}
                    {columns.map((col) => {
                      const sortKey = col.sortKey || (typeof col.accessor === 'string' ? col.accessor : null);
                      const isSorted = sortConfig.key === sortKey;
                      return (
                        <th
                          key={col.header}
                          className={`text-left px-4 py-3 text-sm font-medium text-slate-400 ${enableSort && sortKey ? 'cursor-pointer hover:text-white select-none' : ''} ${col.className || ''}`}
                          onClick={() => sortKey && handleSort(sortKey)}
                        >
                          <div className="flex items-center gap-1">
                            {col.header}
                            {enableSort && sortKey && (
                              isSorted
                                ? (sortConfig.direction === 'asc' ? <ArrowUp size={14} className="text-sky-400" /> : <ArrowDown size={14} className="text-sky-400" />)
                                : <ArrowUpDown size={14} className="opacity-30" />
                            )}
                          </div>
                        </th>
                      );
                    })}
                    {(onView || onEdit || onDelete) && (
                      <th className="text-right px-4 py-3 text-sm font-medium text-slate-400">Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.map((item) => (
                    <tr
                      key={item.id}
                      onClick={() => onRowClick?.(item)}
                      className={`border-b border-slate-700/50 hover:bg-slate-800/50 transition-colors ${onRowClick ? 'cursor-pointer' : ''} ${selectedIds.has(item.id) ? 'bg-sky-500/5' : ''}`}
                    >
                      {enableBulkOps && (
                        <td className="w-10 px-3 py-3" onClick={(e) => e.stopPropagation()}>
                          <button onClick={() => toggleSelect(item.id)} className="text-slate-400 hover:text-white">
                            {selectedIds.has(item.id)
                              ? <CheckSquare size={18} className="text-sky-400" />
                              : <Square size={18} />
                            }
                          </button>
                        </td>
                      )}
                      {columns.map((col) => (
                        <td key={col.header} className={`px-4 py-3 ${col.cellClassName || ''}`}>
                          {col.render
                            ? col.render(item)
                            : <span className="text-slate-300">{typeof col.accessor === 'function' ? col.accessor(item) : item[col.accessor]}</span>
                          }
                        </td>
                      ))}
                      {(onView || onEdit || onDelete) && (
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                            {onView && (
                              <button onClick={() => onView(item)} className="p-2 text-slate-400 hover:text-sky-400 hover:bg-slate-700 rounded-lg">
                                <Eye size={16} />
                              </button>
                            )}
                            {onEdit && (
                              <button onClick={() => onEdit(item)} className="p-2 text-slate-400 hover:text-amber-400 hover:bg-slate-700 rounded-lg">
                                <Edit2 size={16} />
                              </button>
                            )}
                            {onDelete && (
                              <button onClick={() => onDelete(item)} className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-700 rounded-lg">
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {enablePagination && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              totalItems={sortedData.length}
              itemsPerPage={pageSize}
              onItemsPerPageChange={handlePageSizeChange}
            />
          )}
        </>
      )}
    </div>
  );
}

export default DataTable;
