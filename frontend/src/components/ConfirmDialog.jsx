import React, { useState, useCallback, createContext, useContext } from 'react';
import { AlertTriangle, Trash2, Info } from 'lucide-react';

const ConfirmContext = createContext(null);

export function ConfirmProvider({ children }) {
  const [dialog, setDialog] = useState(null);

  const confirm = useCallback((options) => {
    return new Promise((resolve) => {
      setDialog({
        title: options.title || 'Confirm Action',
        message: options.message || 'Are you sure?',
        confirmText: options.confirmText || 'Confirm',
        cancelText: options.cancelText || 'Cancel',
        variant: options.variant || 'danger', // danger, warning, info
        onConfirm: () => { setDialog(null); resolve(true); },
        onCancel: () => { setDialog(null); resolve(false); },
      });
    });
  }, []);

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {dialog && <ConfirmDialogUI dialog={dialog} />}
    </ConfirmContext.Provider>
  );
}

function ConfirmDialogUI({ dialog }) {
  const variantConfig = {
    danger: {
      icon: <Trash2 className="w-6 h-6 text-rose-400" />,
      iconBg: 'bg-rose-500/20',
      btnClass: 'bg-rose-500 hover:bg-rose-600',
    },
    warning: {
      icon: <AlertTriangle className="w-6 h-6 text-amber-400" />,
      iconBg: 'bg-amber-500/20',
      btnClass: 'bg-amber-500 hover:bg-amber-600',
    },
    info: {
      icon: <Info className="w-6 h-6 text-sky-400" />,
      iconBg: 'bg-sky-500/20',
      btnClass: 'bg-sky-500 hover:bg-sky-600',
    },
  };

  const config = variantConfig[dialog.variant] || variantConfig.danger;

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={dialog.onCancel} />
      <div className="relative bg-slate-800 border border-slate-700 rounded-2xl p-6 max-w-md w-full shadow-2xl animate-scale-in">
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-xl ${config.iconBg}`}>
            {config.icon}
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white">{dialog.title}</h3>
            <p className="text-sm text-slate-400 mt-1">{dialog.message}</p>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button
            onClick={dialog.onCancel}
            className="flex-1 px-4 py-2.5 bg-slate-700 text-white rounded-xl hover:bg-slate-600 transition-colors font-medium"
          >
            {dialog.cancelText}
          </button>
          <button
            onClick={dialog.onConfirm}
            className={`flex-1 px-4 py-2.5 text-white rounded-xl transition-colors font-medium ${config.btnClass}`}
          >
            {dialog.confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

export function useConfirm() {
  const context = useContext(ConfirmContext);
  if (!context) throw new Error('useConfirm must be used within a ConfirmProvider');
  return context;
}

export default ConfirmProvider;
