import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import { Wand2, Mail, Lock, Eye, EyeOff, Sparkles, Zap, User, ArrowLeft } from 'lucide-react';

function Login({ onLogin }) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegister) {
        const response = await authAPI.register(email, password, name);
        onLogin(response.data.token, response.data.user);
      } else {
        const response = await authAPI.login(email, password);
        onLogin(response.data.token, response.data.user);
      }
    } catch (err) {
      setError(err.response?.data?.error || `${isRegister ? 'Registration' : 'Login'} failed. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  const fillDemoCredentials = () => {
    setEmail(import.meta.env.VITE_DEMO_EMAIL || '');
    setPassword(import.meta.env.VITE_DEMO_PASSWORD || '');
    setIsRegister(false);
  };

  const toggleMode = () => {
    setIsRegister(!isRegister);
    setError('');
    setName('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-sky-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-4 bg-gradient-to-br from-sky-500 to-indigo-600 rounded-2xl mb-4 shadow-lg shadow-sky-500/25">
            <Wand2 className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold gradient-text mb-2">AI Photo Enhancer</h1>
          <p className="text-slate-400">Transform your product photos with AI</p>
        </div>

        {/* Login/Register Card */}
        <div className="glass rounded-2xl p-8 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">
              {isRegister ? 'Create Account' : 'Welcome Back'}
            </h2>
            {isRegister && (
              <button
                onClick={toggleMode}
                className="flex items-center gap-1 text-sm text-slate-400 hover:text-white"
              >
                <ArrowLeft size={16} />
                Back to Login
              </button>
            )}
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {isRegister && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all"
                    placeholder="John Doe"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-12 py-3 bg-slate-800/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all"
                  placeholder={isRegister ? 'Create a password' : 'Enter your password'}
                  required
                  minLength={isRegister ? 6 : undefined}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {isRegister && (
                <p className="text-xs text-slate-500 mt-1">Minimum 6 characters</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-sky-500 to-indigo-500 text-white font-semibold rounded-xl hover:from-sky-600 hover:to-indigo-600 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:ring-offset-slate-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {isRegister ? 'Creating account...' : 'Signing in...'}
                </>
              ) : (
                <>
                  <Zap size={20} />
                  {isRegister ? 'Create Account' : 'Sign In'}
                </>
              )}
            </button>
          </form>

          {/* Toggle & Demo */}
          <div className="mt-6 pt-6 border-t border-slate-700 space-y-4">
            {!isRegister && (
              <>
                <button
                  onClick={fillDemoCredentials}
                  className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  <Sparkles size={18} className="text-amber-400" />
                  Use Demo Credentials
                </button>
                <div className="text-center">
                  <Link to="/password-reset" className="text-sm text-slate-400 hover:text-sky-400">
                    Forgot your password?
                  </Link>
                </div>
              </>
            )}

            <p className="text-center text-sm text-slate-400">
              {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
              <button
                onClick={toggleMode}
                className="text-sky-400 hover:text-sky-300 font-medium"
              >
                {isRegister ? 'Sign in' : 'Create one'}
              </button>
            </p>
          </div>
        </div>

        {/* Features */}
        <div className="mt-8 grid grid-cols-3 gap-4 text-center">
          <div className="p-4 glass rounded-xl">
            <div className="w-10 h-10 mx-auto mb-2 bg-gradient-to-br from-pink-500 to-rose-500 rounded-lg flex items-center justify-center">
              <Sparkles size={20} className="text-white" />
            </div>
            <p className="text-xs text-slate-400">AI Enhancement</p>
          </div>
          <div className="p-4 glass rounded-xl">
            <div className="w-10 h-10 mx-auto mb-2 bg-gradient-to-br from-sky-500 to-cyan-500 rounded-lg flex items-center justify-center">
              <Wand2 size={20} className="text-white" />
            </div>
            <p className="text-xs text-slate-400">Auto Remove BG</p>
          </div>
          <div className="p-4 glass rounded-xl">
            <div className="w-10 h-10 mx-auto mb-2 bg-gradient-to-br from-violet-500 to-purple-500 rounded-lg flex items-center justify-center">
              <Zap size={20} className="text-white" />
            </div>
            <p className="text-xs text-slate-400">Instant Results</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
