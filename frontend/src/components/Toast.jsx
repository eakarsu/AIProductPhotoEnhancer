import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

let toastIdCounter = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = ++toastIdCounter;
    setToasts(prev => [...prev, { id, message, type, duration }]);
    if (duration > 0) {
      setTimeout(() => removeToast(id), duration);
    }
    return id;
  }, [removeToast]);

  const toast = useCallback({
    success: (msg, duration) => addToast(msg, 'success', duration),
    error: (msg, duration) => addToast(msg, 'error', duration || 6000),
    warning: (msg, duration) => addToast(msg, 'warning', duration),
    info: (msg, duration) => addToast(msg, 'info', duration),
  }, [addToast]);

  // Make toast callable directly too
  const toastFn = Object.assign(
    (msg, type, duration) => addToast(msg, type, duration),
    toast
  );

  return (
    <ToastContext.Provider value={toastFn}>
      {children}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map(t => (
          <ToastItem key={t.id} toast={t} onClose={() => removeToast(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onClose }) {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (toast.duration > 0) {
      const timer = setTimeout(() => setIsExiting(true), toast.duration - 300);
      return () => clearTimeout(timer);
    }
  }, [toast.duration]);

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />,
    error: <XCircle className="w-5 h-5 text-rose-400 shrink-0" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />,
    info: <Info className="w-5 h-5 text-sky-400 shrink-0" />,
  };

  const bgColors = {
    success: 'bg-emerald-500/10 border-emerald-500/30',
    error: 'bg-rose-500/10 border-rose-500/30',
    warning: 'bg-amber-500/10 border-amber-500/30',
    info: 'bg-sky-500/10 border-sky-500/30',
  };

  return (
    <div
      className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border backdrop-blur-sm shadow-lg transition-all duration-300 ${bgColors[toast.type]} ${
        isExiting ? 'opacity-0 translate-x-4' : 'opacity-100 translate-x-0 animate-slide-in'
      }`}
    >
      {icons[toast.type]}
      <p className="text-sm text-white flex-1">{toast.message}</p>
      <button
        onClick={onClose}
        className="text-slate-400 hover:text-white shrink-0"
      >
        <X size={16} />
      </button>
    </div>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within a ToastProvider');
  return context;
}

export default ToastProvider;
