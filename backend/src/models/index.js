import pool from '../config/database.js';

// Initialize database tables
export async function initializeDatabase() {
  const client = await pool.connect();

  try {
    // Users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255),
        role VARCHAR(50) DEFAULT 'user',
        email_verified BOOLEAN DEFAULT false,
        verification_token VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Add new columns to users if they don't exist
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'user'`);
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false`);
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_token VARCHAR(255)`);

    // Password reset tokens table
    await client.query(`
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id SERIAL PRIMARY KEY,
        user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        token VARCHAR(255) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Products table
    await client.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        category VARCHAR(100),
        original_image VARCHAR(500),
        price DECIMAL(10, 2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Background Removals table
    await client.query(`
      CREATE TABLE IF NOT EXISTS background_removals (
        id SERIAL PRIMARY KEY,
        product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
        original_image VARCHAR(500),
        processed_image VARCHAR(500),
        ai_analysis JSONB,
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Enhancements table
    await client.query(`
      CREATE TABLE IF NOT EXISTS enhancements (
        id SERIAL PRIMARY KEY,
        product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
        original_image VARCHAR(500),
        enhanced_image VARCHAR(500),
        enhancement_type VARCHAR(100),
        ai_analysis JSONB,
        settings JSONB,
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Lifestyle Shots table
    await client.query(`
      CREATE TABLE IF NOT EXISTS lifestyle_shots (
        id SERIAL PRIMARY KEY,
        product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
        original_image VARCHAR(500),
        generated_concepts JSONB,
        target_audience VARCHAR(255),
        style VARCHAR(100),
        ai_analysis JSONB,
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Color Analysis table
    await client.query(`
      CREATE TABLE IF NOT EXISTS color_analyses (
        id SERIAL PRIMARY KEY,
        product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
        image_path VARCHAR(500),
        ai_analysis JSONB,
        dominant_colors JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Quality Assessments table
    await client.query(`
      CREATE TABLE IF NOT EXISTS quality_assessments (
        id SERIAL PRIMARY KEY,
        product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
        image_path VARCHAR(500),
        ai_analysis JSONB,
        overall_score INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Product Descriptions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS product_descriptions (
        id SERIAL PRIMARY KEY,
        product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
        ai_analysis JSONB,
        short_description TEXT,
        long_description TEXT,
        seo_keywords JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Size References table
    await client.query(`
      CREATE TABLE IF NOT EXISTS size_references (
        id SERIAL PRIMARY KEY,
        product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
        image_path VARCHAR(500),
        reference_object VARCHAR(255),
        ai_analysis JSONB,
        dimensions JSONB,
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 360 View Creator table
    await client.query(`
      CREATE TABLE IF NOT EXISTS view_360 (
        id SERIAL PRIMARY KEY,
        product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
        image_paths JSONB,
        ai_analysis JSONB,
        rotation_speed INTEGER DEFAULT 30,
        frame_count INTEGER DEFAULT 36,
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Size Recommender table
    await client.query(`
      CREATE TABLE IF NOT EXISTS size_recommendations (
        id SERIAL PRIMARY KEY,
        product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
        customer_measurements JSONB,
        ai_analysis JSONB,
        recommended_size VARCHAR(50),
        confidence_score INTEGER,
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Gift Suggester table
    await client.query(`
      CREATE TABLE IF NOT EXISTS gift_suggestions (
        id SERIAL PRIMARY KEY,
        product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
        recipient_profile JSONB,
        occasion VARCHAR(255),
        budget_range VARCHAR(100),
        ai_analysis JSONB,
        match_score INTEGER,
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Return Predictor table
    await client.query(`
      CREATE TABLE IF NOT EXISTS return_predictions (
        id SERIAL PRIMARY KEY,
        product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
        customer_history JSONB,
        ai_analysis JSONB,
        return_probability INTEGER,
        risk_factors JSONB,
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('Database tables initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  } finally {
    client.release();
  }
}

export default { initializeDatabase };
