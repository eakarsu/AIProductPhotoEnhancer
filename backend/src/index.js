import { authenticateToken as aiWorkspaceDependency1 } from "./middleware/auth.js";
import aiWorkspaceDependency2 from "./config/database.js";
import aiWorkspaceDependency3 from "../aiWorkspaceAdapters.cjs";
import aiWorkspaceDependency4 from "../aiWorkspace.cjs";
import { readFileSync as readAIWorkspaceFile } from 'node:fs';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

import { initializeDatabase } from './models/index.js';
import { apiRateLimit, authRateLimit } from './middleware/rateLimit.js';
import authRoutes from './routes/auth.js';
import profileRoutes from './routes/profile.js';
import productsRoutes from './routes/products.js';
import backgroundRemovalRoutes from './routes/backgroundRemoval.js';
import enhancementsRoutes from './routes/enhancements.js';
import lifestyleShotsRoutes from './routes/lifestyleShots.js';
import colorAnalysisRoutes from './routes/colorAnalysis.js';
import qualityAssessmentRoutes from './routes/qualityAssessment.js';
import uploadRoutes from './routes/upload.js';
import activityRoutes from './routes/activity.js';
import productDescriptionRoutes from './routes/productDescription.js';
import sizeReferenceRoutes from './routes/sizeReference.js';
import view360Routes from './routes/view360.js';
import sizeRecommenderRoutes from './routes/sizeRecommender.js';
import giftSuggesterRoutes from './routes/giftSuggester.js';
import returnPredictorRoutes from './routes/returnPredictor.js';
import photosRoutes from './routes/photos.js';
import customViewsRoutes from './routes/customViews.js';
import { authenticateToken } from './middleware/auth.js';
import governanceRouter from './governance/router.js';
import runtime from './governance/runtime.cjs';
import provider from './governance/providerGate.cjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../../.env') });
runtime.validateRuntime();

const app = express();
const PORT = process.env.BACKEND_PORT || 3001;

// Middleware
app.use(helmet());
const allowedOrigins=String(process.env.CORS_ORIGINS||process.env.CLIENT_URL||`http://localhost:${process.env.FRONTEND_PORT||3000}`).split(',').map(v=>v.trim()).filter(Boolean);
app.use(cors({origin:(origin,cb)=>!origin||allowedOrigins.includes(origin)?cb(null,true):cb(new Error('Origin not allowed by CORS')),credentials:true}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(provider.createProviderGate(['/api/ai','/api/gap','/api/cf','/api/background-removal','/api/enhancements','/api/lifestyle-shots']));

// Apply general rate limit to all API routes
app.use('/api', apiRateLimit);

// Serve uploaded files
app.use('/uploads', express.static(join(__dirname, '../uploads')));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Routes - auth with stricter rate limit
app.use('/api/auth', authRateLimit, authRoutes);
app.use('/api', authenticateToken);
app.use('/api/profile', profileRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/background-removal', backgroundRemovalRoutes);
app.use('/api/enhancements', enhancementsRoutes);
app.use('/api/lifestyle-shots', lifestyleShotsRoutes);
app.use('/api/color-analysis', colorAnalysisRoutes);
app.use('/api/quality-assessment', qualityAssessmentRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/product-descriptions', productDescriptionRoutes);
app.use('/api/size-reference', sizeReferenceRoutes);
app.use('/api/view-360', view360Routes);
app.use('/api/size-recommender', sizeRecommenderRoutes);
app.use('/api/gift-suggester', giftSuggesterRoutes);
app.use('/api/return-predictor', returnPredictorRoutes);
app.use('/api/photos', photosRoutes);
app.use('/api/custom-views', customViewsRoutes);
app.use('/api/governed-product-image-releases', governanceRouter);

// Error handling middleware

// Advisory AI reports only; native execution and approval routes stay unchanged.
const aiWorkspaceSupport = aiWorkspaceDependency3;
const aiWorkspaceFeatures = JSON.parse(readAIWorkspaceFile(new URL("../aiWorkspaceFeatures.json", import.meta.url), 'utf8'));
const aiWorkspaceDatabase = aiWorkspaceDependency2;
app.use('/api/report-workspace', aiWorkspaceDependency4.createAIWorkspaceRouter({
  pool: aiWorkspaceDatabase, authenticateToken: aiWorkspaceDependency1,
  aiRateLimiter: aiWorkspaceSupport.createWorkspaceLimiter(), features: aiWorkspaceFeatures,
}));
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

// Initialize database and start server
async function startServer() {
  try {
    if (process.env.ENABLE_LEGACY_SCHEMA_BOOTSTRAP === 'true') {
      await initializeDatabase();
      console.log('Legacy database initialization completed by explicit opt-in');
    }

    
    // === Custom Feature Mounts (batch_06) ===
    const featureMounts = [
      ['./routes/customFeat01_AiPhotoEnhancementPipeline.js', '/api/cf-ai-photo-enhancement-pipeline'],
      ['./routes/customFeat02_ComputerVisionProductSizing.js', '/api/cf-computer-vision-product-sizing'],
      ['./routes/customFeat03_ReturnRiskPrediction.js', '/api/cf-return-risk-prediction'],
      ['./routes/customFeat04_MultiVariantGeneration.js', '/api/cf-multi-variant-generation'],
      ['./routes/customFeat05_CompetitiveVisualIntelligence.js', '/api/cf-competitive-visual-intelligence'],
      ['./routes/gapFeat_all_the_ai.js', '/api/gap-all-the-ai'],
      ['./routes/gapFeat_no_auto.js', '/api/gap-no-auto'],
      ['./routes/gapFeat_no_competitor.js', '/api/gap-no-competitor'],
      ['./routes/gapFeat_no_integration_with_e.js', '/api/gap-no-integration-with-e'],
      ['./routes/gapFeat_no_batch_processing_endpoint_single.js', '/api/gap-no-batch-processing-endpoint-single'],
      ['./routes/gapFeat_no_integration_with_image_cdn_delivery_optimizatio.js', '/api/gap-no-integration-with-image-cdn-delivery-optimizatio'],
      ['./routes/gapFeat_limited_analytics_photo_performance_tracking.js', '/api/gap-limited-analytics-photo-performance-tracking'],
      ['./routes/gapFeat_no_notifications_module_grep_0.js', '/api/gap-no-notifications-module-grep-0'],
      ['./routes/gapFeat_no_audit_logging_grep_0.js', '/api/gap-no-audit-logging-grep-0'],
      ['./routes/gapFeat_no_webhooks_for_image.js', '/api/gap-no-webhooks-for-image'],
    ];
    for (const [modPath, mountPath] of featureMounts) {
      try {
        const mod = await import(modPath);
        app.use(mountPath, mod.default);
      } catch (err) {
        console.warn(`Could not mount ${mountPath}:`, err.message);
      }
    }

    // 404 handler (must be after all routes, including the dynamically loaded feature/gap routes)
    app.use((req, res) => {
      res.status(404).json({ error: 'Route not found' });
    });

    app.listen(PORT, () => {
      console.log(`\nBackend server running on http://localhost:${PORT}`);
      console.log(`API endpoints available at /api/*`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
