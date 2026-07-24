import pool from '../config/database.js';
import { initializeDatabase } from '../models/index.js';
import bcrypt from 'bcryptjs';

function requireDemoPassword() {
  const password = process.env.DEMO_PASSWORD || process.env.SEED_DEMO_PASSWORD || process.env.DEMO_SEED_PASSWORD || '';
  if (password.length < 12 || password.length > 1024) throw new Error('DEMO_PASSWORD must contain 12-1024 characters');
  return password;
}

function mockAI(data) {
  return {
    success: true,
    data,
    rawResponse: JSON.stringify(data),
    model: 'seed-placeholder',
    usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }
  };
}

async function seed() {
  console.log('Starting database seeding...');

  try {
    await initializeDatabase();
    const client = await pool.connect();

    try {
      await client.query('TRUNCATE users, products, background_removals, enhancements, lifestyle_shots, color_analyses, quality_assessments, product_descriptions, size_references, view_360, size_recommendations, gift_suggestions, return_predictions RESTART IDENTITY CASCADE');
      // Also clean password_reset_tokens if it exists
      try { await client.query('TRUNCATE password_reset_tokens RESTART IDENTITY CASCADE'); } catch {}

      // Seed Users
      const hashedPassword = await bcrypt.hash(requireDemoPassword(), 10);
      const userResult = await client.query(`
        INSERT INTO users (email, password, name, role, email_verified) VALUES
        ($1, $2, 'Demo User', 'admin', true),
        ($3, $2, 'Admin User', 'admin', true),
        ($4, $2, 'Viewer User', 'user', false)
        RETURNING id
      `, ['demo@example.com', hashedPassword, 'admin@example.com', 'viewer@example.com']);
      const userId = userResult.rows[0].id;
      console.log('Users seeded');

      // Seed Products (17 products)
      const products = [
        { name: 'Premium Wireless Headphones', description: 'High-quality noise-cancelling headphones with 40hr battery', category: 'Electronics', image: '/uploads/headphones.jpg', price: 299.99 },
        { name: 'Leather Watch Band', description: 'Genuine Italian leather watch strap, 20mm width', category: 'Accessories', image: '/uploads/watchband.jpg', price: 49.99 },
        { name: 'Ceramic Coffee Mug', description: 'Handcrafted ceramic mug, 12oz capacity', category: 'Home & Kitchen', image: '/uploads/mug.jpg', price: 24.99 },
        { name: 'Running Sneakers', description: 'Lightweight athletic shoes with memory foam sole', category: 'Footwear', image: '/uploads/sneakers.jpg', price: 129.99 },
        { name: 'Organic Face Cream', description: 'Natural skincare moisturizer with vitamin E', category: 'Beauty', image: '/uploads/cream.jpg', price: 45.99 },
        { name: 'Bamboo Cutting Board', description: 'Eco-friendly kitchen board, antibacterial surface', category: 'Home & Kitchen', image: '/uploads/cuttingboard.jpg', price: 34.99 },
        { name: 'Vintage Sunglasses', description: 'Retro style UV400 protection, acetate frame', category: 'Accessories', image: '/uploads/sunglasses.jpg', price: 89.99 },
        { name: 'Yoga Mat', description: 'Non-slip exercise mat, 6mm thick, eco-friendly TPE', category: 'Fitness', image: '/uploads/yogamat.jpg', price: 39.99 },
        { name: 'Stainless Steel Water Bottle', description: 'Double-wall insulated, keeps drinks cold 24hrs', category: 'Sports', image: '/uploads/waterbottle.jpg', price: 29.99 },
        { name: 'Wireless Mouse', description: 'Ergonomic computer mouse with silent clicks', category: 'Electronics', image: '/uploads/mouse.jpg', price: 59.99 },
        { name: 'Canvas Tote Bag', description: 'Heavy-duty reusable shopping bag, organic cotton', category: 'Accessories', image: '/uploads/totebag.jpg', price: 19.99 },
        { name: 'Essential Oil Diffuser', description: 'Ultrasonic aromatherapy device with LED lights', category: 'Home', image: '/uploads/diffuser.jpg', price: 44.99 },
        { name: 'Mechanical Keyboard', description: 'Cherry MX Blue switches, per-key RGB', category: 'Electronics', image: '/uploads/keyboard.jpg', price: 149.99 },
        { name: 'Plant Pot Set', description: 'Set of 3 decorative ceramic planters with drainage', category: 'Home & Garden', image: '/uploads/plantpots.jpg', price: 54.99 },
        { name: 'Silk Scarf', description: 'Pure mulberry silk accessory, hand-rolled edges', category: 'Fashion', image: '/uploads/scarf.jpg', price: 79.99 },
        { name: 'Portable Charger', description: '10000mAh power bank, USB-C PD fast charging', category: 'Electronics', image: '/uploads/charger.jpg', price: 39.99 },
        { name: 'Artisan Candle', description: 'Hand-poured soy wax candle, 60hr burn time', category: 'Home', image: '/uploads/candle.jpg', price: 28.99 }
      ];

      for (const product of products) {
        await client.query(
          `INSERT INTO products (user_id, name, description, category, original_image, price) VALUES ($1, $2, $3, $4, $5, $6)`,
          [userId, product.name, product.description, product.category, product.image, product.price]
        );
      }
      console.log('Products seeded (17 items)');

      // Diverse data arrays
      const statuses = ['completed', 'completed', 'completed', 'completed', 'completed', 'completed', 'completed', 'completed', 'completed', 'completed', 'completed', 'completed', 'processing', 'processing', 'pending', 'pending', 'completed'];
      const enhTypes = ['brightness', 'color_correction', 'sharpening', 'auto_enhance', 'skin_smooth', 'HDR', 'vintage', 'vibrance', 'exposure', 'professional', 'brightness', 'color_correction', 'sharpening', 'auto_enhance', 'HDR', 'vintage', 'professional'];
      const audiences = ['Young professionals', 'Watch enthusiasts', 'Home lovers', 'Fitness enthusiasts', 'Beauty conscious', 'Home chefs', 'Fashion forward', 'Wellness seekers', 'Outdoor adventurers', 'Remote workers', 'Eco-conscious', 'Self-care advocates', 'Gamers', 'Plant parents', 'Fashion lovers', 'Travelers', 'Home decorators'];
      const styles = ['Modern minimalist', 'Classic elegance', 'Cozy comfort', 'Active lifestyle', 'Clean beauty', 'Culinary arts', 'Street style', 'Zen aesthetic', 'Adventure', 'Productivity', 'Sustainable', 'Wellness', 'Gaming setup', 'Botanical', 'Luxury', 'On-the-go', 'Cozy ambiance'];
      const refObjects = ['Credit card', 'Watch face', 'Apple', 'Foot outline', 'Hand', 'Kitchen knife', 'Face silhouette', 'Person standing', 'Can of soda', 'Hand span', 'Grocery items', 'Book', 'Keyboard layout', 'Small plant', 'Neck mannequin', 'Smartphone', 'Coffee cup'];
      const occasions = ['Birthday', 'Anniversary', 'Christmas', 'Birthday', "Mother's Day", 'Wedding', 'Birthday', 'Birthday', 'Birthday', "Father's Day", 'Christmas', 'Housewarming', 'Graduation', 'Housewarming', 'Birthday', 'Graduation', 'Christmas'];
      const budgets = ['$200-$500', '$25-$50', '$0-$25', '$100-$200', '$25-$50', '$25-$50', '$50-$100', '$25-$50', '$25-$50', '$50-$100', '$0-$25', '$25-$50', '$100-$200', '$50-$100', '$50-$100', '$25-$50', '$25-$50'];
      const qualities = [92, 78, 85, 88, 75, 82, 90, 70, 86, 80, 65, 77, 95, 83, 88, 72, 79];
      const matchScores = [92, 75, 88, 65, 90, 82, 78, 85, 70, 80, 95, 72, 88, 76, 84, 68, 91];
      const returnProbs = [8, 22, 5, 35, 12, 15, 45, 10, 18, 25, 3, 20, 55, 8, 30, 42, 7];
      const confScores = [92, 78, 85, 90, 75, 88, 82, 95, 70, 80, 87, 74, 93, 81, 86, 72, 89];
      const sizes = ['M', 'L', 'S', 'L', 'M', 'M', 'S', 'M', 'L', 'M', 'S', 'M', 'L', 'M', 'S', 'M', 'M'];
      const colorSets = [
        [{ hex: '#1A1A2E', name: 'Dark Navy', percentage: 45 }, { hex: '#C0C0C0', name: 'Silver', percentage: 35 }, { hex: '#E8E8E8', name: 'Light Gray', percentage: 20 }],
        [{ hex: '#8B4513', name: 'Saddle Brown', percentage: 55 }, { hex: '#D2B48C', name: 'Tan', percentage: 30 }, { hex: '#F5F5DC', name: 'Beige', percentage: 15 }],
        [{ hex: '#FFFFFF', name: 'White', percentage: 40 }, { hex: '#4A90D9', name: 'Steel Blue', percentage: 35 }, { hex: '#2C3E50', name: 'Dark Slate', percentage: 25 }],
        [{ hex: '#FF6B6B', name: 'Coral', percentage: 40 }, { hex: '#FFFFFF', name: 'White', percentage: 35 }, { hex: '#333333', name: 'Charcoal', percentage: 25 }],
        [{ hex: '#F0E68C', name: 'Khaki Gold', percentage: 50 }, { hex: '#FFFACD', name: 'Lemon Chiffon', percentage: 30 }, { hex: '#90EE90', name: 'Light Green', percentage: 20 }],
        [{ hex: '#DEB887', name: 'Burlywood', percentage: 60 }, { hex: '#8B7355', name: 'Dark Tan', percentage: 25 }, { hex: '#556B2F', name: 'Dark Olive', percentage: 15 }],
        [{ hex: '#000000', name: 'Black', percentage: 50 }, { hex: '#FFD700', name: 'Gold', percentage: 30 }, { hex: '#8B0000', name: 'Dark Red', percentage: 20 }],
        [{ hex: '#9370DB', name: 'Medium Purple', percentage: 45 }, { hex: '#E6E6FA', name: 'Lavender', percentage: 35 }, { hex: '#483D8B', name: 'Dark Slate Blue', percentage: 20 }],
        [{ hex: '#4682B4', name: 'Steel Blue', percentage: 50 }, { hex: '#C0C0C0', name: 'Silver', percentage: 30 }, { hex: '#000000', name: 'Black', percentage: 20 }],
        [{ hex: '#2F4F4F', name: 'Dark Slate', percentage: 45 }, { hex: '#696969', name: 'Dim Gray', percentage: 35 }, { hex: '#B0C4DE', name: 'Light Steel Blue', percentage: 20 }],
        [{ hex: '#F5F5DC', name: 'Natural Cotton', percentage: 65 }, { hex: '#8B7355', name: 'Dark Tan', percentage: 20 }, { hex: '#2F4F4F', name: 'Dark Slate', percentage: 15 }],
        [{ hex: '#DDA0DD', name: 'Plum', percentage: 35 }, { hex: '#FFFFFF', name: 'White', percentage: 40 }, { hex: '#808080', name: 'Gray', percentage: 25 }],
        [{ hex: '#000000', name: 'Black', percentage: 40 }, { hex: '#00FF00', name: 'Green', percentage: 35 }, { hex: '#FF0000', name: 'Red', percentage: 25 }],
        [{ hex: '#DEB887', name: 'Terra Cotta', percentage: 55 }, { hex: '#228B22', name: 'Forest Green', percentage: 30 }, { hex: '#F5F5DC', name: 'Cream', percentage: 15 }],
        [{ hex: '#FF69B4', name: 'Hot Pink', percentage: 40 }, { hex: '#FFC0CB', name: 'Pink', percentage: 35 }, { hex: '#FFFFF0', name: 'Ivory', percentage: 25 }],
        [{ hex: '#2F4F4F', name: 'Dark Slate', percentage: 50 }, { hex: '#FFFFFF', name: 'White', percentage: 30 }, { hex: '#4169E1', name: 'Royal Blue', percentage: 20 }],
        [{ hex: '#FFD700', name: 'Gold', percentage: 40 }, { hex: '#8B0000', name: 'Burgundy', percentage: 35 }, { hex: '#FFFFF0', name: 'Ivory', percentage: 25 }],
      ];

      for (let i = 0; i < products.length; i++) {
        const p = products[i];
        const pid = i + 1;
        const st = statuses[i];

        // 1. Background Removal
        const bgQ = [90, 85, 92, 78, 88, 80, 95, 72, 86, 83, 70, 91, 94, 77, 89, 75, 87][i];
        const bgData = mockAI({ analysis: { subject: p.name, background: ['Studio white', 'Natural outdoor', 'Gradient', 'Wood texture', 'Marble'][i % 5], edges: ['Clean', 'Soft', 'Sharp', 'Feathered', 'Defined'][i % 5], challenges: i % 3 === 0 ? ['Shadow overlap'] : [] }, recommendations: { method: ['AI removal', 'Manual mask', 'Chroma key', 'Edge detection', 'Deep learning'][i % 5], difficulty: ['easy', 'medium', 'easy', 'hard', 'medium'][i % 5], estimatedQuality: `${bgQ}%`, tips: ['Use edge detection', 'Adjust contrast'] }, suggestedBackgrounds: ['Transparent', 'White gradient', 'Lifestyle scene', 'Color solid'] });
        await client.query(
          `INSERT INTO background_removals (product_id, original_image, processed_image, ai_analysis, status) VALUES ($1, $2, $3, $4, $5)`,
          [pid, p.image, `/uploads/processed_${pid}.png`, JSON.stringify(bgData), st]
        );

        // 2. Enhancement
        const improv = [25, 18, 30, 15, 22, 28, 12, 35, 20, 24, 32, 16, 27, 19, 31, 14, 23][i];
        const enhData = mockAI({ currentState: { brightness: 60 + (i * 2 % 30), contrast: 55 + (i * 3 % 35), sharpness: 50 + (i * 2 % 40) }, recommendations: { suggestedSettings: { brightness: 80 + (i % 15), contrast: 75 + (i % 20), sharpness: 70 + (i % 25) }, expectedImprovement: `${improv}%` }, tips: ['Increase brightness', 'Boost contrast', 'Apply sharpening'] });
        await client.query(
          `INSERT INTO enhancements (product_id, original_image, enhanced_image, enhancement_type, ai_analysis, settings, status) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [pid, p.image, `/uploads/enhanced_${pid}.jpg`, enhTypes[i], JSON.stringify(enhData), JSON.stringify({}), st]
        );

        // 3. Lifestyle Shots
        const scenes = [
          [{ scene: 'Modern home office', mood: 'Professional', lighting: 'Natural daylight' }, { scene: 'Coffee shop counter', mood: 'Urban casual', lighting: 'Warm ambient' }],
          [{ scene: 'Luxury dressing table', mood: 'Elegant', lighting: 'Soft diffused' }, { scene: 'Outdoor cafe', mood: 'Relaxed', lighting: 'Golden hour' }],
          [{ scene: 'Cozy kitchen counter', mood: 'Homey', lighting: 'Morning light' }, { scene: 'Brunch setup', mood: 'Fresh', lighting: 'Bright natural' }],
        ][i % 3];
        const lsData = mockAI({ concepts: scenes, targetAudience: audiences[i], style: styles[i] });
        await client.query(
          `INSERT INTO lifestyle_shots (product_id, original_image, generated_concepts, target_audience, style, ai_analysis, status) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [pid, p.image, JSON.stringify(scenes), audiences[i], styles[i], JSON.stringify(lsData), st]
        );

        // 4. Color Analysis
        const caData = mockAI({ dominantColors: colorSets[i], colorHarmony: ['Monochromatic', 'Complementary', 'Analogous', 'Triadic', 'Split-Complementary'][i % 5], mood: ['Professional', 'Warm', 'Clean', 'Bold', 'Natural', 'Classic', 'Dramatic', 'Serene', 'Modern', 'Minimal', 'Organic', 'Soft', 'Energetic', 'Earthy', 'Romantic', 'Technical', 'Luxurious'][i] });
        await client.query(
          `INSERT INTO color_analyses (product_id, image_path, ai_analysis, dominant_colors) VALUES ($1, $2, $3, $4)`,
          [pid, p.image, JSON.stringify(caData), JSON.stringify(colorSets[i])]
        );

        // 5. Quality Assessment
        const qs = qualities[i];
        const qaData = mockAI({ overallScore: qs, categories: { lighting: qs + (i % 5) - 2, composition: qs - (i % 4) + 1, focus: qs + (i % 3), color: qs - (i % 6) + 3 }, issues: qs < 80 ? ['Could improve exposure', 'Minor noise detected'] : ['Minor white balance shift'], recommendations: qs < 80 ? ['Increase exposure by 0.5 stops', 'Apply noise reduction'] : ['Fine-tune white balance'] });
        await client.query(
          `INSERT INTO quality_assessments (product_id, image_path, ai_analysis, overall_score) VALUES ($1, $2, $3, $4)`,
          [pid, p.image, JSON.stringify(qaData), qs]
        );

        // 6. Product Description
        const pdData = mockAI({ shortDescription: `${p.name} - Premium quality ${p.category.toLowerCase()} product designed for discerning customers.`, longDescription: `Discover the ${p.name}. ${p.description}. Crafted with care and designed for everyday use, this product combines style and functionality. Perfect for those who appreciate quality craftsmanship and attention to detail.`, seoKeywords: [p.name.toLowerCase(), p.category.toLowerCase(), 'premium', 'quality', 'best seller', `${p.category.toLowerCase()} gift`] });
        await client.query(
          `INSERT INTO product_descriptions (product_id, ai_analysis, short_description, long_description, seo_keywords) VALUES ($1, $2, $3, $4, $5)`,
          [pid, JSON.stringify(pdData), pdData.data.shortDescription, pdData.data.longDescription, JSON.stringify(pdData.data.seoKeywords)]
        );

        // 7. Size Reference
        const dims = [
          { width: '18cm', height: '20cm', depth: '8cm' },
          { width: '22cm', height: '3cm', depth: '1cm' },
          { width: '9cm', height: '11cm', depth: '9cm' },
          { width: '30cm', height: '12cm', depth: '10cm' },
          { width: '6cm', height: '8cm', depth: '6cm' },
          { width: '40cm', height: '28cm', depth: '2cm' },
          { width: '14cm', height: '5cm', depth: '4cm' },
          { width: '183cm', height: '61cm', depth: '0.6cm' },
          { width: '7cm', height: '26cm', depth: '7cm' },
          { width: '12cm', height: '6cm', depth: '4cm' },
          { width: '45cm', height: '40cm', depth: '15cm' },
          { width: '15cm', height: '16cm', depth: '15cm' },
          { width: '44cm', height: '14cm', depth: '3cm' },
          { width: '12cm', height: '14cm', depth: '12cm' },
          { width: '80cm', height: '80cm', depth: '0.1cm' },
          { width: '7cm', height: '14cm', depth: '2cm' },
          { width: '8cm', height: '10cm', depth: '8cm' },
        ][i];
        const srData = mockAI({ productDimensions: dims, referenceObject: refObjects[i], scaleComparison: `Product is approximately ${['1.5x', '0.8x', '1.2x', '2x', '0.5x'][i % 5]} the size of ${refObjects[i]}` });
        await client.query(
          `INSERT INTO size_references (product_id, image_path, reference_object, ai_analysis, dimensions, status) VALUES ($1, $2, $3, $4, $5, $6)`,
          [pid, p.image, refObjects[i], JSON.stringify(srData), JSON.stringify(dims), st]
        );

        // 8. 360 View
        const fc = [36, 24, 36, 48, 24, 36, 30, 36, 24, 36, 18, 36, 48, 24, 36, 30, 36][i];
        const rs = [30, 24, 30, 15, 30, 24, 20, 30, 24, 30, 30, 24, 15, 30, 24, 20, 30][i];
        const v360Data = mockAI({ keyAngles: ['Front', 'Side 45', 'Side 90', 'Back', 'Top'], shootingTips: ['Use turntable', 'Consistent lighting', 'Fixed camera height', 'White background'], estimatedFrames: fc });
        await client.query(
          `INSERT INTO view_360 (product_id, image_paths, ai_analysis, rotation_speed, frame_count, status) VALUES ($1, $2, $3, $4, $5, $6)`,
          [pid, JSON.stringify([p.image]), JSON.stringify(v360Data), rs, fc, st]
        );

        // 9. Size Recommender
        const heights = ['162cm', '178cm', '170cm', '185cm', '165cm', '175cm', '158cm', '172cm', '180cm', '168cm', '155cm', '176cm', '183cm', '170cm', '160cm', '174cm', '169cm'];
        const weights = ['55kg', '80kg', '65kg', '90kg', '58kg', '72kg', '52kg', '68kg', '82kg', '62kg', '50kg', '76kg', '88kg', '66kg', '54kg', '70kg', '64kg'];
        const meas = { height: heights[i], weight: weights[i], chest: `${80 + i * 2}cm`, waist: `${65 + i * 2}cm` };
        const sizeData = mockAI({ recommendedSize: sizes[i], confidenceScore: confScores[i], sizeChart: { XS: '<155cm', S: '155-165cm', M: '165-178cm', L: '178-188cm', XL: '>188cm' }, fitNotes: ['Regular fit', 'Slim fit', 'Relaxed fit', 'True to size', 'Runs large'][i % 5] });
        await client.query(
          `INSERT INTO size_recommendations (product_id, customer_measurements, ai_analysis, recommended_size, confidence_score, status) VALUES ($1, $2, $3, $4, $5, $6)`,
          [pid, JSON.stringify(meas), JSON.stringify(sizeData), sizes[i], confScores[i], st]
        );

        // 10. Gift Suggester
        const ages = [25, 35, 28, 40, 55, 30, 22, 45, 32, 50, 20, 38, 18, 60, 27, 23, 42];
        const genders = ['female', 'male', 'non-binary', 'male', 'female', 'female', 'male', 'female', 'male', 'male', 'female', 'female', 'male', 'female', 'female', 'male', 'non-binary'];
        const recipient = { age: ages[i], gender: genders[i], interests: ['technology', 'fashion', 'cooking', 'sports', 'beauty', 'cooking', 'fashion', 'wellness', 'outdoors', 'gaming', 'sustainability', 'self-care', 'gaming', 'gardening', 'fashion', 'travel', 'home decor'][i] };
        const giftData = mockAI({ matchScore: matchScores[i], suitability: matchScores[i] >= 80 ? 'Excellent match' : matchScores[i] >= 60 ? 'Good match' : 'Fair match', reasoning: `${p.name} is a ${matchScores[i] >= 80 ? 'perfect' : 'thoughtful'} gift for ${occasions[i]}. ${p.description}.`, wrappingSuggestions: ['Gift box', 'Ribbon wrap', 'Gift bag'], personalizeOptions: ['Engraving', 'Gift card', 'Custom message'] });
        await client.query(
          `INSERT INTO gift_suggestions (product_id, recipient_profile, occasion, budget_range, ai_analysis, match_score, status) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [pid, JSON.stringify(recipient), occasions[i], budgets[i], JSON.stringify(giftData), matchScores[i], st]
        );

        // 11. Return Predictor
        const orders = [15, 8, 25, 3, 12, 20, 2, 18, 6, 10, 30, 5, 1, 22, 7, 4, 28];
        const retRates = [5, 12, 2, 25, 8, 6, 35, 4, 15, 10, 1, 14, 40, 3, 20, 30, 2];
        const accAges = [24, 6, 36, 2, 18, 12, 1, 30, 4, 8, 48, 3, 1, 42, 5, 2, 36];
        const history = { orders: orders[i], returns: Math.round(orders[i] * retRates[i] / 100), account_age: accAges[i], reviews_given: Math.max(0, Math.floor(orders[i] * 0.3)) };
        const riskFactors = returnProbs[i] > 30 ? ['Size uncertainty', 'First purchase in category', 'High return history'] : returnProbs[i] > 15 ? ['Size uncertainty', 'Limited product info'] : ['Standard risk'];
        const returnData = mockAI({ returnProbability: returnProbs[i], riskFactors, riskLevel: returnProbs[i] > 60 ? 'High' : returnProbs[i] > 30 ? 'Medium' : 'Low', suggestions: returnProbs[i] > 30 ? ['Include detailed size guide', 'Add more product photos', 'Offer virtual try-on'] : ['Standard packaging', 'Include care instructions'] });
        await client.query(
          `INSERT INTO return_predictions (product_id, customer_history, ai_analysis, return_probability, risk_factors, status) VALUES ($1, $2, $3, $4, $5, $6)`,
          [pid, JSON.stringify(history), JSON.stringify(returnData), returnProbs[i], JSON.stringify(riskFactors), st]
        );
      }
      console.log('All 11 AI features seeded for 17 products (17 items each)');

      console.log('\nDatabase seeding completed!');
      console.log('Login credentials:');
      console.log('Demo login users provisioned from the local environment.');
      console.log('Demo login users provisioned from the local environment.');
      console.log('Demo login users provisioned from the local environment.');

    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

seed();
