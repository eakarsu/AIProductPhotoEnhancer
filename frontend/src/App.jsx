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
import PhotoAnalysis from './pages/PhotoAnalysis';
import BatchAnalysis from './pages/BatchAnalysis';
import Layout from './components/Layout';
import { authAPI } from './services/api';

// // === Batch 06 Gaps & Frontend Mounts ===
import CFAiPhotoEnhancementPipelinePage from './pages/CFAiPhotoEnhancementPipelinePage';
import CFComputerVisionProductSizingPage from './pages/CFComputerVisionProductSizingPage';
import CFReturnRiskPredictionPage from './pages/CFReturnRiskPredictionPage';
import CFMultiVariantGenerationPage from './pages/CFMultiVariantGenerationPage';
import CFCompetitiveVisualIntelligencePage from './pages/CFCompetitiveVisualIntelligencePage';
import GapAllTheAiPage from './pages/GapAllTheAiPage';
import GapNoAutoPage from './pages/GapNoAutoPage';
import GapNoCompetitorPage from './pages/GapNoCompetitorPage';
import GapNoIntegrationWithEPage from './pages/GapNoIntegrationWithEPage';
import GapNoBatchProcessingEndpointSinglePage from './pages/GapNoBatchProcessingEndpointSinglePage';
import GapNoIntegrationWithImageCdnDeliveryOptimizatioPage from './pages/GapNoIntegrationWithImageCdnDeliveryOptimizatioPage';
import GapLimitedAnalyticsPhotoPerformanceTrackingPage from './pages/GapLimitedAnalyticsPhotoPerformanceTrackingPage';
import GapNoNotificationsModuleGrep0Page from './pages/GapNoNotificationsModuleGrep0Page';
import GapNoAuditLoggingGrep0Page from './pages/GapNoAuditLoggingGrep0Page';
import GapNoWebhooksForImagePage from './pages/GapNoWebhooksForImagePage';
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
                        <Route path="/photo-analysis" element={<PhotoAnalysis />} />
                        <Route path="/batch-analysis" element={<BatchAnalysis />} />
                      
          {/* // === Batch 06 Gaps & Frontend Mounts === */}
          <Route path="/cf-ai-photo-enhancement-pipeline" element={<CFAiPhotoEnhancementPipelinePage />} />
          <Route path="/cf-computer-vision-product-sizing" element={<CFComputerVisionProductSizingPage />} />
          <Route path="/cf-return-risk-prediction" element={<CFReturnRiskPredictionPage />} />
          <Route path="/cf-multi-variant-generation" element={<CFMultiVariantGenerationPage />} />
          <Route path="/cf-competitive-visual-intelligence" element={<CFCompetitiveVisualIntelligencePage />} />
          <Route path="/gap-all-the-ai" element={<GapAllTheAiPage />} />
          <Route path="/gap-no-auto" element={<GapNoAutoPage />} />
          <Route path="/gap-no-competitor" element={<GapNoCompetitorPage />} />
          <Route path="/gap-no-integration-with-e" element={<GapNoIntegrationWithEPage />} />
          <Route path="/gap-no-batch-processing-endpoint-single" element={<GapNoBatchProcessingEndpointSinglePage />} />
          <Route path="/gap-no-integration-with-image-cdn-delivery-optimizatio" element={<GapNoIntegrationWithImageCdnDeliveryOptimizatioPage />} />
          <Route path="/gap-limited-analytics-photo-performance-tracking" element={<GapLimitedAnalyticsPhotoPerformanceTrackingPage />} />
          <Route path="/gap-no-notifications-module-grep-0" element={<GapNoNotificationsModuleGrep0Page />} />
          <Route path="/gap-no-audit-logging-grep-0" element={<GapNoAuditLoggingGrep0Page />} />
          <Route path="/gap-no-webhooks-for-image" element={<GapNoWebhooksForImagePage />} />
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
