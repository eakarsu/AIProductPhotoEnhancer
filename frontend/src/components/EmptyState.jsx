import React from 'react';
import { Inbox, Plus } from 'lucide-react';

function EmptyState({ icon: Icon = Inbox, title = 'No items found', description = 'Get started by creating your first item.', actionLabel, onAction }) {
  return (
    <div className="glass rounded-xl p-12 text-center">
      <div className="inline-flex items-center justify-center p-4 bg-slate-700/50 rounded-2xl mb-4">
        <Icon className="w-10 h-10 text-slate-500" />
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-slate-400 mb-6 max-w-sm mx-auto">{description}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-sky-500 text-white rounded-xl hover:bg-sky-600 transition-colors font-medium"
        >
          <Plus size={18} />
          {actionLabel}
        </button>
      )}
    </div>
  );
}

export default EmptyState;
