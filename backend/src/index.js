import express from 'express';
import cors from 'cors';
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

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../../.env') });

const app = express();
const PORT = process.env.BACKEND_PORT || 3001;

// Middleware
app.use(cors({
  origin: [`http://localhost:${process.env.FRONTEND_PORT || 3000}`],
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

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

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Initialize database and start server
async function startServer() {
  try {
    await initializeDatabase();
    console.log('Database initialized');

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
