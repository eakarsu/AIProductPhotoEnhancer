import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './components/Toast';
import { ConfirmProvider } from './components/ConfirmDialog';
import ErrorBoundary from './components/ErrorBoundary';
import Login from './pages/Login';
import PasswordReset from './pages/PasswordReset';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import BackgroundRemoval from './pages/BackgroundRemoval';
import Enhancements from './pages/Enhancements';
import LifestyleShots from './pages/LifestyleShots';
import ColorAnalysis from './pages/ColorAnalysis';
import QualityAssessment from './pages/QualityAssessment';
import ProductDescriptions from './pages/ProductDescriptions';
import SizeReference from './pages/SizeReference';
import View360 from './pages/View360';
import SizeRecommender from './pages/SizeRecommender';
import GiftSuggester from './pages/GiftSuggester';
import ReturnPredictor from './pages/ReturnPredictor';
import UserProfile from './pages/UserProfile';
import Layout from './components/Layout';
import { authAPI } from './services/api';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsAuthenticated(!!token);
    setLoading(false);
  }, []);

  const handleLogin = (token, user) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    setIsAuthenticated(true);
  };

  const handleLogout = async () => {
    try {
      await authAPI.logout();
    } catch {
      // Ignore errors on logout
    }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sky-500"></div>
      </div>
    );
  }

  return (
    <ToastProvider>
      <ConfirmProvider>
        <Router>
          <Routes>
            <Route
              path="/login"
              element={
                isAuthenticated ? (
                  <Navigate to="/dashboard" replace />
                ) : (
                  <Login onLogin={handleLogin} />
                )
              }
            />
            <Route path="/password-reset" element={<PasswordReset />} />
            <Route
              path="/*"
              element={
                isAuthenticated ? (
                  <Layout onLogout={handleLogout}>
                    <ErrorBoundary>
                      <Routes>
                        <Route path="/" element={<Navigate to="/dashboard" replace />} />
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/products" element={<Products />} />
                        <Route path="/background-removal" element={<BackgroundRemoval />} />
                        <Route path="/enhancements" element={<Enhancements />} />
                        <Route path="/lifestyle-shots" element={<LifestyleShots />} />
                        <Route path="/color-analysis" element={<ColorAnalysis />} />
                        <Route path="/quality-assessment" element={<QualityAssessment />} />
                        <Route path="/product-descriptions" element={<ProductDescriptions />} />
                        <Route path="/size-reference" element={<SizeReference />} />
                        <Route path="/view-360" element={<View360 />} />
                        <Route path="/size-recommender" element={<SizeRecommender />} />
                        <Route path="/gift-suggester" element={<GiftSuggester />} />
                        <Route path="/return-predictor" element={<ReturnPredictor />} />
                        <Route path="/profile" element={<UserProfile />} />
                      </Routes>
                    </ErrorBoundary>
                  </Layout>
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />
          </Routes>
        </Router>
      </ConfirmProvider>
    </ToastProvider>
  );
}

export default App;
