import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

function Pagination({ currentPage, totalPages, onPageChange, totalItems, itemsPerPage, onItemsPerPageChange }) {
  if (totalPages <= 1 && !onItemsPerPageChange) return null;

  const pages = [];
  const maxVisible = 5;
  let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
  let end = Math.min(totalPages, start + maxVisible - 1);
  if (end - start + 1 < maxVisible) {
    start = Math.max(1, end - maxVisible + 1);
  }

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4 px-2">
      <div className="flex items-center gap-3 text-sm text-slate-400">
        <span>Showing {startItem}-{endItem} of {totalItems}</span>
        {onItemsPerPageChange && (
          <select
            value={itemsPerPage}
            onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
            className="bg-slate-800 border border-slate-600 text-white rounded-lg px-2 py-1 text-sm focus:outline-none focus:border-sky-500"
          >
            {[10, 15, 25, 50].map(n => (
              <option key={n} value={n}>{n} per page</option>
            ))}
          </select>
        )}
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronsLeft size={16} />
        </button>
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft size={16} />
        </button>

        {start > 1 && <span className="px-2 text-slate-500">...</span>}

        {pages.map(page => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`min-w-[36px] h-9 rounded-lg text-sm font-medium transition-colors ${
              page === currentPage
                ? 'bg-sky-500 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            {page}
          </button>
        ))}

        {end < totalPages && <span className="px-2 text-slate-500">...</span>}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight size={16} />
        </button>
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronsRight size={16} />
        </button>
      </div>
    </div>
  );
}

export default Pagination;
