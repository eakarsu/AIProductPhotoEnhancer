import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Lock, Mail, ArrowLeft, Wand2, CheckCircle, Loader2 } from 'lucide-react';
import { authAPI } from '../services/api';

function PasswordReset() {
  const [step, setStep] = useState('request'); // request, token, success
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleRequestReset = async (e) => {
    e.preventDefault();
    setError('');
    if (!email.trim()) { setError('Email is required'); return; }
    setLoading(true);
    try {
      const response = await authAPI.requestPasswordReset(email);
      setMessage(response.data.message);
      // For demo: auto-fill token if returned
      if (response.data.resetToken) {
        setToken(response.data.resetToken);
      }
      setStep('token');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmReset = async (e) => {
    e.preventDefault();
    setError('');
    if (!token.trim()) { setError('Reset token is required'); return; }
    if (newPassword.length < 6) { setError('Password must be at least 6 characters'); return; }
    if (newPassword !== confirmPassword) { setError('Passwords do not match'); return; }
    setLoading(true);
    try {
      await authAPI.confirmPasswordReset(token, newPassword);
      setStep('success');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-sky-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-4 bg-gradient-to-br from-sky-500 to-indigo-600 rounded-2xl mb-4">
            <Wand2 className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Reset Password</h1>
          <p className="text-slate-400">
            {step === 'request' && "Enter your email to receive a reset link"}
            {step === 'token' && "Enter the reset token and your new password"}
            {step === 'success' && "Your password has been reset"}
          </p>
        </div>

        <div className="glass rounded-2xl p-8">
          {error && (
            <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
              {error}
            </div>
          )}

          {step === 'request' && (
            <form onSubmit={handleRequestReset} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-sky-500"
                    placeholder="you@example.com"
                    required
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-sky-500 to-indigo-500 text-white font-semibold rounded-xl hover:from-sky-600 hover:to-indigo-600 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 size={20} className="animate-spin" /> : <Mail size={20} />}
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>
          )}

          {step === 'token' && (
            <form onSubmit={handleConfirmReset} className="space-y-5">
              {message && (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-sm">
                  {message}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Reset Token</label>
                <input
                  type="text"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-sky-500 font-mono text-sm"
                  placeholder="Paste reset token here"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">New Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-sky-500"
                    placeholder="At least 6 characters"
                    required
                    minLength={6}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-sky-500"
                    placeholder="Confirm new password"
                    required
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-sky-500 to-indigo-500 text-white font-semibold rounded-xl hover:from-sky-600 hover:to-indigo-600 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 size={20} className="animate-spin" /> : <Lock size={20} />}
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>
          )}

          {step === 'success' && (
            <div className="text-center py-4">
              <CheckCircle className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
              <p className="text-white font-medium mb-2">Password Reset Successful</p>
              <p className="text-slate-400 text-sm mb-6">You can now sign in with your new password.</p>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-sky-500 to-indigo-500 text-white font-semibold rounded-xl hover:from-sky-600 hover:to-indigo-600"
              >
                Go to Login
              </Link>
            </div>
          )}

          <div className="mt-6 pt-6 border-t border-slate-700 text-center">
            <Link to="/login" className="text-sm text-slate-400 hover:text-sky-400 flex items-center justify-center gap-1">
              <ArrowLeft size={16} />
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PasswordReset;
