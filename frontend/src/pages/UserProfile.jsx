import React, { useState, useEffect } from 'react';
import { User, Mail, Lock, Shield, Save, Loader2, CheckCircle, AlertCircle, Trash2 } from 'lucide-react';
import { profileAPI, authAPI } from '../services/api';
import { useToast } from '../components/Toast';
import { useConfirm } from '../components/ConfirmDialog';

function UserProfile() {
  const toast = useToast();
  const confirm = useConfirm();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const [formData, setFormData] = useState({ name: '', email: '' });
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await profileAPI.get();
      setProfile(response.data);
      setFormData({ name: response.data.name || '', email: response.data.email });
    } catch (error) {
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const validateProfile = () => {
    const errs = {};
    if (!formData.name.trim()) errs.name = 'Name is required';
    if (!formData.email.trim()) errs.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errs.email = 'Invalid email format';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validatePassword = () => {
    const errs = {};
    if (!passwordData.currentPassword) errs.currentPassword = 'Current password is required';
    if (!passwordData.newPassword) errs.newPassword = 'New password is required';
    else if (passwordData.newPassword.length < 6) errs.newPassword = 'Must be at least 6 characters';
    if (passwordData.newPassword !== passwordData.confirmPassword) errs.confirmPassword = 'Passwords do not match';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!validateProfile()) return;
    setSaving(true);
    try {
      const response = await profileAPI.update(formData);
      setProfile(response.data);
      // Update localStorage
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      localStorage.setItem('user', JSON.stringify({ ...user, name: response.data.name, email: response.data.email }));
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!validatePassword()) return;
    setChangingPassword(true);
    try {
      await profileAPI.changePassword(passwordData.currentPassword, passwordData.newPassword);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      toast.success('Password changed successfully');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleResendVerification = async () => {
    try {
      await authAPI.resendVerification();
      toast.success('Verification email sent');
    } catch (error) {
      toast.error('Failed to resend verification');
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = await confirm({
      title: 'Delete Account',
      message: 'This will permanently delete your account and all associated data. This action cannot be undone.',
      confirmText: 'Delete Account',
      variant: 'danger'
    });
    if (!confirmed) return;

    const password = prompt('Enter your password to confirm:');
    if (!password) return;

    try {
      await profileAPI.deleteAccount(password);
      localStorage.clear();
      window.location.href = '/login';
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to delete account');
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="glass rounded-xl p-6 h-40 shimmer" />
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-sky-500 to-indigo-500 rounded-xl">
            <User className="w-6 h-6 text-white" />
          </div>
          Profile Settings
        </h1>
        <p className="text-slate-400 mt-1">Manage your account settings and preferences</p>
      </div>

      {/* Email Verification Banner */}
      {profile && !profile.email_verified && (
        <div className="glass rounded-xl p-4 mb-6 flex items-center justify-between border-amber-500/30 bg-amber-500/10">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-400" />
            <span className="text-amber-200 text-sm">Your email is not verified.</span>
          </div>
          <button onClick={handleResendVerification} className="text-sm text-amber-400 hover:text-amber-300 font-medium">
            Resend verification
          </button>
        </div>
      )}

      {/* Profile Info */}
      <div className="glass rounded-xl p-6 mb-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Mail className="w-5 h-5 text-sky-400" />
          Account Information
        </h2>
        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Full Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={`w-full px-4 py-3 bg-slate-800/50 border rounded-xl text-white focus:outline-none focus:border-sky-500 ${errors.name ? 'border-rose-500' : 'border-slate-600'}`}
              placeholder="Your name"
            />
            {errors.name && <p className="text-rose-400 text-xs mt-1">{errors.name}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Email Address</label>
            <div className="relative">
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={`w-full px-4 py-3 bg-slate-800/50 border rounded-xl text-white focus:outline-none focus:border-sky-500 ${errors.email ? 'border-rose-500' : 'border-slate-600'}`}
                placeholder="your@email.com"
              />
              {profile?.email_verified && (
                <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-400" />
              )}
            </div>
            {errors.email && <p className="text-rose-400 text-xs mt-1">{errors.email}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm text-slate-400">
            <div>
              <span className="text-slate-500">Role:</span>{' '}
              <span className="capitalize">{profile?.role || 'user'}</span>
            </div>
            <div>
              <span className="text-slate-500">Member since:</span>{' '}
              {profile && new Date(profile.created_at).toLocaleDateString()}
            </div>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-sky-500 to-indigo-500 text-white rounded-xl hover:from-sky-600 hover:to-indigo-600 transition-all disabled:opacity-50 font-medium"
          >
            {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>

      {/* Change Password */}
      <div className="glass rounded-xl p-6 mb-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Lock className="w-5 h-5 text-amber-400" />
          Change Password
        </h2>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Current Password</label>
            <input
              type="password"
              value={passwordData.currentPassword}
              onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
              className={`w-full px-4 py-3 bg-slate-800/50 border rounded-xl text-white focus:outline-none focus:border-sky-500 ${errors.currentPassword ? 'border-rose-500' : 'border-slate-600'}`}
              placeholder="Enter current password"
            />
            {errors.currentPassword && <p className="text-rose-400 text-xs mt-1">{errors.currentPassword}</p>}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">New Password</label>
              <input
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                className={`w-full px-4 py-3 bg-slate-800/50 border rounded-xl text-white focus:outline-none focus:border-sky-500 ${errors.newPassword ? 'border-rose-500' : 'border-slate-600'}`}
                placeholder="At least 6 characters"
              />
              {errors.newPassword && <p className="text-rose-400 text-xs mt-1">{errors.newPassword}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Confirm Password</label>
              <input
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                className={`w-full px-4 py-3 bg-slate-800/50 border rounded-xl text-white focus:outline-none focus:border-sky-500 ${errors.confirmPassword ? 'border-rose-500' : 'border-slate-600'}`}
                placeholder="Confirm new password"
              />
              {errors.confirmPassword && <p className="text-rose-400 text-xs mt-1">{errors.confirmPassword}</p>}
            </div>
          </div>
          <button
            type="submit"
            disabled={changingPassword}
            className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition-all disabled:opacity-50 font-medium"
          >
            {changingPassword ? <Loader2 size={18} className="animate-spin" /> : <Shield size={18} />}
            {changingPassword ? 'Changing...' : 'Change Password'}
          </button>
        </form>
      </div>

      {/* Danger Zone */}
      <div className="glass rounded-xl p-6 border-rose-500/20">
        <h2 className="text-lg font-semibold text-rose-400 mb-2 flex items-center gap-2">
          <Trash2 className="w-5 h-5" />
          Danger Zone
        </h2>
        <p className="text-slate-400 text-sm mb-4">
          Once you delete your account, there is no going back. All data will be permanently removed.
        </p>
        <button
          onClick={handleDeleteAccount}
          className="flex items-center gap-2 px-5 py-2.5 bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl hover:bg-rose-500/30 transition-all font-medium"
        >
          <Trash2 size={18} />
          Delete Account
        </button>
      </div>
    </div>
  );
}

export default UserProfile;
