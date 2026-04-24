import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package,
  Eraser,
  Sparkles,
  Camera,
  Palette,
  Award,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  FileText,
  Ruler,
  RotateCw,
  Users,
  Gift,
  RotateCcw
} from 'lucide-react';
import {
  productsAPI,
  backgroundRemovalAPI,
  enhancementsAPI,
  lifestyleShotsAPI,
  colorAnalysisAPI,
  qualityAssessmentAPI,
  activityAPI,
  productDescriptionsAPI,
  sizeReferenceAPI,
  view360API,
  sizeRecommenderAPI,
  giftSuggesterAPI,
  returnPredictorAPI
} from '../services/api';

const featureCards = [
  // Photo Tools
  {
    title: 'Products',
    description: 'Manage your product catalog',
    icon: Package,
    path: '/products',
    gradient: 'from-blue-500 to-cyan-500',
    category: 'core'
  },
  {
    title: 'Background Removal',
    description: 'AI-powered background removal',
    icon: Eraser,
    path: '/background-removal',
    gradient: 'from-pink-500 to-rose-500',
    category: 'photo'
  },
  {
    title: 'Enhancements',
    description: 'Enhance photos with AI',
    icon: Sparkles,
    path: '/enhancements',
    gradient: 'from-amber-500 to-orange-500',
    category: 'photo'
  },
  {
    title: 'Lifestyle Shots',
    description: 'Generate lifestyle concepts',
    icon: Camera,
    path: '/lifestyle-shots',
    gradient: 'from-violet-500 to-purple-500',
    category: 'photo'
  },
  {
    title: 'Color Analysis',
    description: 'Analyze product colors',
    icon: Palette,
    path: '/color-analysis',
    gradient: 'from-emerald-500 to-teal-500',
    category: 'photo'
  },
  {
    title: 'Quality Assessment',
    description: 'Check image quality',
    icon: Award,
    path: '/quality-assessment',
    gradient: 'from-sky-500 to-indigo-500',
    category: 'photo'
  },
  {
    title: 'Product Descriptions',
    description: 'AI-generated copy',
    icon: FileText,
    path: '/product-descriptions',
    gradient: 'from-rose-500 to-pink-500',
    category: 'photo'
  },
  {
    title: 'Size Reference',
    description: 'Add size comparisons',
    icon: Ruler,
    path: '/size-reference',
    gradient: 'from-teal-500 to-cyan-500',
    category: 'photo'
  },
  {
    title: '360 View Creator',
    description: 'Create 360 product views',
    icon: RotateCw,
    path: '/view-360',
    gradient: 'from-indigo-500 to-purple-500',
    category: 'photo'
  },
  // E-commerce Tools
  {
    title: 'Size Recommender',
    description: 'AI size suggestions',
    icon: Users,
    path: '/size-recommender',
    gradient: 'from-blue-500 to-indigo-500',
    category: 'ecommerce'
  },
  {
    title: 'Gift Suggester',
    description: 'Match products to gifts',
    icon: Gift,
    path: '/gift-suggester',
    gradient: 'from-rose-500 to-pink-500',
    category: 'ecommerce'
  },
  {
    title: 'Return Predictor',
    description: 'Predict return risks',
    icon: RotateCcw,
    path: '/return-predictor',
    gradient: 'from-orange-500 to-red-500',
    category: 'ecommerce'
  }
];

function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    products: 0,
    backgroundRemovals: 0,
    enhancements: 0,
    lifestyleShots: 0,
    colorAnalyses: 0,
    qualityAssessments: 0,
    productDescriptions: 0,
    sizeReferences: 0,
    view360s: 0,
    sizeRecommendations: 0,
    giftSuggestions: 0,
    returnPredictions: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activityLoading, setActivityLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    fetchRecentActivity();
  }, []);

  const fetchStats = async () => {
    try {
      const [
        products,
        bgRemovals,
        enhancements,
        lifestyle,
        colors,
        quality,
        descriptions,
        sizeRefs,
        views360,
        sizeRecs,
        gifts,
        returns
      ] = await Promise.all([
        productsAPI.getAll(),
        backgroundRemovalAPI.getAll(),
        enhancementsAPI.getAll(),
        lifestyleShotsAPI.getAll(),
        colorAnalysisAPI.getAll(),
        qualityAssessmentAPI.getAll(),
        productDescriptionsAPI.getAll(),
        sizeReferenceAPI.getAll(),
        view360API.getAll(),
        sizeRecommenderAPI.getAll(),
        giftSuggesterAPI.getAll(),
        returnPredictorAPI.getAll()
      ]);

      setStats({
        products: products.data.length,
        backgroundRemovals: bgRemovals.data.length,
        enhancements: enhancements.data.length,
        lifestyleShots: lifestyle.data.length,
        colorAnalyses: colors.data.length,
        qualityAssessments: quality.data.length,
        productDescriptions: descriptions.data.length,
        sizeReferences: sizeRefs.data.length,
        view360s: views360.data.length,
        sizeRecommendations: sizeRecs.data.length,
        giftSuggestions: gifts.data.length,
        returnPredictions: returns.data.length
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentActivity = async () => {
    try {
      const response = await activityAPI.getRecent(8);
      setRecentActivity(response.data);
    } catch (error) {
      console.error('Error fetching activity:', error);
    } finally {
      setActivityLoading(false);
    }
  };

  const handleCardClick = (path) => {
    navigate(path);
  };

  const getIconForType = (type) => {
    switch (type) {
      case 'background_removal': return Eraser;
      case 'enhancement': return Sparkles;
      case 'lifestyle_shot': return Camera;
      case 'color_analysis': return Palette;
      case 'quality_assessment': return Award;
      case 'size_reference': return Ruler;
      case 'view_360': return RotateCw;
      case 'size_recommendation': return Users;
      case 'gift_suggestion': return Gift;
      case 'return_prediction': return RotateCcw;
      default: return Package;
    }
  };

  const getColorForType = (type) => {
    switch (type) {
      case 'background_removal': return 'text-pink-400';
      case 'enhancement': return 'text-amber-400';
      case 'lifestyle_shot': return 'text-violet-400';
      case 'color_analysis': return 'text-emerald-400';
      case 'quality_assessment': return 'text-sky-400';
      case 'size_reference': return 'text-teal-400';
      case 'view_360': return 'text-indigo-400';
      case 'size_recommendation': return 'text-blue-400';
      case 'gift_suggestion': return 'text-rose-400';
      case 'return_prediction': return 'text-orange-400';
      default: return 'text-slate-400';
    }
  };

  const formatTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const photoTools = featureCards.filter(c => c.category === 'photo' || c.category === 'core');
  const ecommerceTools = featureCards.filter(c => c.category === 'ecommerce');

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">
          Welcome back, {user.name || 'User'}!
        </h1>
        <p className="text-slate-400">
          Manage and enhance your product photos with AI-powered tools
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
        {[
          { label: 'Products', value: stats.products, icon: Package, color: 'sky' },
          { label: 'BG Removals', value: stats.backgroundRemovals, icon: Eraser, color: 'pink' },
          { label: 'Enhancements', value: stats.enhancements, icon: Sparkles, color: 'amber' },
          { label: 'Lifestyle', value: stats.lifestyleShots, icon: Camera, color: 'violet' },
          { label: 'Colors', value: stats.colorAnalyses, icon: Palette, color: 'emerald' },
          { label: 'Quality', value: stats.qualityAssessments, icon: Award, color: 'indigo' },
          { label: 'Descriptions', value: stats.productDescriptions, icon: FileText, color: 'rose' },
          { label: 'Size Refs', value: stats.sizeReferences, icon: Ruler, color: 'teal' },
          { label: '360 Views', value: stats.view360s, icon: RotateCw, color: 'purple' },
          { label: 'Size Recs', value: stats.sizeRecommendations, icon: Users, color: 'blue' },
          { label: 'Gift Matches', value: stats.giftSuggestions, icon: Gift, color: 'pink' },
          { label: 'Return Preds', value: stats.returnPredictions, icon: RotateCcw, color: 'orange' }
        ].map((stat, index) => (
          <div key={index} className="glass rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <stat.icon className={`w-5 h-5 text-${stat.color}-400`} />
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-2xl font-bold text-white">
              {loading ? <span className="shimmer w-8 h-6 inline-block rounded" /> : stat.value}
            </p>
            <p className="text-xs text-slate-400">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Photo Tools */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-white mb-4">Photo Tools</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {photoTools.map((card, index) => {
            const Icon = card.icon;
            return (
              <div
                key={index}
                onClick={() => handleCardClick(card.path)}
                className="glass rounded-xl p-6 cursor-pointer card-hover group"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{card.title}</h3>
                <p className="text-sm text-slate-400">{card.description}</p>
                <div className="mt-4 flex items-center text-sm text-sky-400 group-hover:text-sky-300">
                  <span>Open</span>
                  <svg
                    className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* E-Commerce Tools */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-white mb-4">E-Commerce Tools</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {ecommerceTools.map((card, index) => {
            const Icon = card.icon;
            return (
              <div
                key={index}
                onClick={() => handleCardClick(card.path)}
                className="glass rounded-xl p-6 cursor-pointer card-hover group"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{card.title}</h3>
                <p className="text-sm text-slate-400">{card.description}</p>
                <div className="mt-4 flex items-center text-sm text-sky-400 group-hover:text-sky-300">
                  <span>Open</span>
                  <svg
                    className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="glass rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-sky-400" />
            Recent Activity
          </h2>
          {activityLoading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-12 shimmer rounded-lg" />
              ))}
            </div>
          ) : recentActivity.length === 0 ? (
            <p className="text-slate-400 text-center py-8">No recent activity</p>
          ) : (
            <div className="space-y-3">
              {recentActivity.map((activity, index) => {
                const Icon = getIconForType(activity.type);
                const colorClass = getColorForType(activity.type);
                return (
                  <div key={index} className="flex items-center justify-between py-2 border-b border-slate-700/50 last:border-0">
                    <div className="flex items-center gap-3">
                      {activity.status === 'completed' ? (
                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                      ) : activity.status === 'pending' ? (
                        <AlertCircle className="w-4 h-4 text-amber-400" />
                      ) : (
                        <Icon className={`w-4 h-4 ${colorClass}`} />
                      )}
                      <div>
                        <p className="text-sm text-white">{activity.action}</p>
                        <p className="text-xs text-slate-400">{activity.product_name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        activity.status === 'completed'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : activity.status === 'pending'
                          ? 'bg-amber-500/20 text-amber-400'
                          : 'bg-sky-500/20 text-sky-400'
                      }`}>
                        {activity.status || 'completed'}
                      </span>
                      <p className="text-xs text-slate-500 mt-1">
                        {formatTimeAgo(activity.created_at)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick Tips */}
        <div className="glass rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            AI Tips
          </h2>
          <div className="space-y-4">
            <div className="p-4 bg-sky-500/10 border border-sky-500/20 rounded-xl">
              <h3 className="text-sm font-medium text-sky-400 mb-1">Better Background Removal</h3>
              <p className="text-xs text-slate-400">
                Use images with clear contrast between the product and background for best results.
              </p>
            </div>
            <div className="p-4 bg-violet-500/10 border border-violet-500/20 rounded-xl">
              <h3 className="text-sm font-medium text-violet-400 mb-1">Lifestyle Shot Ideas</h3>
              <p className="text-xs text-slate-400">
                Specify your target audience and style preferences for more relevant concepts.
              </p>
            </div>
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
              <h3 className="text-sm font-medium text-emerald-400 mb-1">Size Recommendations</h3>
              <p className="text-xs text-slate-400">
                Provide accurate customer measurements for more precise size suggestions.
              </p>
            </div>
            <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl">
              <h3 className="text-sm font-medium text-rose-400 mb-1">Reduce Returns</h3>
              <p className="text-xs text-slate-400">
                Use the Return Predictor to identify high-risk orders and take preventive action.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
