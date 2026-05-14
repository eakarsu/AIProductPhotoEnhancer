import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Eraser,
  Sparkles,
  Camera,
  Palette,
  Award,
  FileText,
  LogOut,
  Menu,
  X,
  Wand2,
  Ruler,
  RotateCw,
  Users,
  Gift,
  RotateCcw,
  User,
  Settings,
  Eye,
  Layers
} from 'lucide-react';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/products', label: 'Products', icon: Package },
  { type: 'divider', label: 'Vision AI' },
  { path: '/photo-analysis', label: 'Photo Analysis AI', icon: Eye },
  { path: '/batch-analysis', label: 'Batch Analysis', icon: Layers },
  { type: 'divider', label: 'Photo Tools' },
  { path: '/background-removal', label: 'Background Removal', icon: Eraser },
  { path: '/enhancements', label: 'Enhancements', icon: Sparkles },
  { path: '/lifestyle-shots', label: 'Lifestyle Shots', icon: Camera },
  { path: '/color-analysis', label: 'Color Analysis', icon: Palette },
  { path: '/quality-assessment', label: 'Quality Assessment', icon: Award },
  { path: '/product-descriptions', label: 'Descriptions', icon: FileText },
  { path: '/size-reference', label: 'Size Reference', icon: Ruler },
  { path: '/view-360', label: '360 View Creator', icon: RotateCw },
  { type: 'divider', label: 'E-Commerce Tools' },
  { path: '/size-recommender', label: 'Size Recommender', icon: Users },
  { path: '/gift-suggester', label: 'Gift Suggester', icon: Gift },
  { path: '/return-predictor', label: 'Return Predictor', icon: RotateCcw },
];

function Layout({ children, onLogout }) {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-sm border-b border-slate-700">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <Wand2 className="w-6 h-6 text-sky-400" />
            <span className="font-bold text-white">Photo Enhancer</span>
          </div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 text-slate-400 hover:text-white"
          >
            {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-40 h-full w-64 bg-slate-900/95 backdrop-blur-sm border-r border-slate-700 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-slate-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-sky-500 to-indigo-500 rounded-xl">
                <Wand2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-white text-lg">AI Photo</h1>
                <p className="text-xs text-slate-400">Enhancer Pro</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navItems.map((item, index) => {
              if (item.type === 'divider') {
                return (
                  <div key={index} className="pt-4 pb-2">
                    <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      {item.label}
                    </p>
                  </div>
                );
              }

              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-sky-500/20 to-indigo-500/20 text-white border border-sky-500/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Icon size={20} className={isActive ? 'text-sky-400' : ''} />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* User section */}
          <div className="p-4 border-t border-slate-700">
            <Link
              to="/profile"
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 mb-3 p-2 rounded-xl transition-colors ${
                location.pathname === '/profile' ? 'bg-sky-500/10' : 'hover:bg-slate-800'
              }`}
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-500 to-indigo-500 flex items-center justify-center">
                <span className="text-white font-semibold">
                  {user.name?.charAt(0) || user.email?.charAt(0) || 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium truncate">{user.name || 'User'}</p>
                <p className="text-xs text-slate-400 truncate">{user.email}</p>
              </div>
              <Settings size={16} className="text-slate-500" />
            </Link>
            <button
              onClick={onLogout}
              className="flex items-center gap-2 w-full px-4 py-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <LogOut size={18} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <main className="lg:ml-64 pt-16 lg:pt-0 min-h-screen">
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}

export default Layout;
