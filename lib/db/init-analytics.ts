// Skip server-only for testing if needed
if (process.env.NODE_ENV !== 'test') {
  require('server-only');
}

// Remove unused import
import postgres from 'postgres';

// Initialize analytics database with tables and sample data
export async function initializeAnalyticsDatabase() {
  console.log('🔧 Initializing analytics database...');
  
  const dbUrl = process.env.ANALYTICS_DB_POSTGRES_URL;
  if (!dbUrl) {
    throw new Error('ANALYTICS_DB_POSTGRES_URL environment variable is not set');
  }
  
  const client = postgres(dbUrl);
  
  try {
    console.log('🔧 Creating analytics_users table...');
    await client`
      CREATE TABLE IF NOT EXISTS analytics_users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) NOT NULL,
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        signup_date TIMESTAMP NOT NULL DEFAULT NOW(),
        last_login_date TIMESTAMP,
        is_active BOOLEAN NOT NULL DEFAULT true,
        subscription_tier VARCHAR(20) DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'enterprise'))
      )
    `;
    
    console.log('🔧 Creating sales table...');
    await client`
      CREATE TABLE IF NOT EXISTS sales (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES analytics_users(id),
        product_name VARCHAR(255) NOT NULL,
        product_category VARCHAR(100),
        amount DECIMAL(10,2) NOT NULL,
        currency VARCHAR(3) NOT NULL DEFAULT 'USD',
        sale_date TIMESTAMP NOT NULL DEFAULT NOW(),
        payment_method VARCHAR(50),
        region VARCHAR(100),
        sales_rep VARCHAR(100)
      )
    `;
    
    console.log('🔧 Creating user_events table...');
    await client`
      CREATE TABLE IF NOT EXISTS user_events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES analytics_users(id),
        event_type VARCHAR(100) NOT NULL,
        event_category VARCHAR(100),
        event_data TEXT,
        timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
        session_id VARCHAR(100),
        user_agent TEXT,
        ip_address VARCHAR(45),
        page VARCHAR(255)
      )
    `;
    
    console.log('🔧 Creating product_performance table...');
    await client`
      CREATE TABLE IF NOT EXISTS product_performance (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        product_name VARCHAR(255) NOT NULL,
        category VARCHAR(100),
        views_count INTEGER NOT NULL DEFAULT 0,
        purchases_count INTEGER NOT NULL DEFAULT 0,
        total_revenue DECIMAL(12,2) NOT NULL DEFAULT 0,
        last_updated TIMESTAMP NOT NULL DEFAULT NOW(),
        rating DECIMAL(3,2),
        reviews_count INTEGER NOT NULL DEFAULT 0
      )
    `;
    
    console.log('🔧 Creating marketing_campaigns table...');
    await client`
      CREATE TABLE IF NOT EXISTS marketing_campaigns (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        campaign_name VARCHAR(255) NOT NULL,
        campaign_type VARCHAR(100),
        start_date TIMESTAMP NOT NULL,
        end_date TIMESTAMP,
        budget DECIMAL(10,2),
        spend DECIMAL(10,2) DEFAULT 0,
        impressions INTEGER DEFAULT 0,
        clicks INTEGER DEFAULT 0,
        conversions INTEGER DEFAULT 0,
        revenue DECIMAL(10,2) DEFAULT 0,
        is_active BOOLEAN NOT NULL DEFAULT true
      )
    `;
    
    // Check if sample data already exists
    const existingUsersResult = await client`SELECT COUNT(*) as count FROM analytics_users`;
    const userCount = Number.parseInt(existingUsersResult[0].count);
    
    if (userCount === 0) {
      console.log('🔧 Inserting sample data...');
      
      // Insert sample users
      const usersResult = await client`
        INSERT INTO analytics_users (email, first_name, last_name, signup_date, last_login_date, subscription_tier)
        VALUES 
          ('john.doe@example.com', 'John', 'Doe', '2024-01-15', '2024-12-01', 'pro'),
          ('jane.smith@example.com', 'Jane', 'Smith', '2024-02-20', '2024-11-28', 'enterprise'),
          ('bob.wilson@example.com', 'Bob', 'Wilson', '2024-03-10', '2024-11-25', 'free'),
          ('sarah.johnson@example.com', 'Sarah', 'Johnson', '2024-04-05', '2024-11-30', 'pro'),
          ('mike.brown@example.com', 'Mike', 'Brown', '2024-05-12', '2024-11-29', 'free')
        RETURNING id
      `;
      
      const userIds = usersResult.map(row => row.id);
      
      // Insert sample sales
      await client`
        INSERT INTO sales (user_id, product_name, product_category, amount, sale_date, payment_method, region, sales_rep)
        VALUES 
          (${userIds[0]}, 'Pro Subscription', 'Subscription', 29.99, '2024-11-01', 'credit_card', 'North America', 'Alice Johnson'),
          (${userIds[1]}, 'Enterprise License', 'License', 199.99, '2024-11-15', 'bank_transfer', 'Europe', 'Michael Brown'),
          (${userIds[0]}, 'Add-on Feature', 'Feature', 9.99, '2024-11-20', 'credit_card', 'North America', 'Alice Johnson'),
          (${userIds[2]}, 'Pro Subscription', 'Subscription', 29.99, '2024-10-15', 'credit_card', 'Asia', 'Lisa Chen'),
          (${userIds[3]}, 'Pro Subscription', 'Subscription', 29.99, '2024-10-28', 'paypal', 'North America', 'Alice Johnson'),
          (${userIds[1]}, 'Premium Support', 'Service', 49.99, '2024-11-22', 'bank_transfer', 'Europe', 'Michael Brown')
      `;
      
      // Insert sample events
      await client`
        INSERT INTO user_events (user_id, event_type, event_category, event_data, timestamp, session_id, page)
        VALUES 
          (${userIds[0]}, 'page_view', 'navigation', '{"page": "/dashboard", "duration": 45}', '2024-11-30', 'sess_123', '/dashboard'),
          (${userIds[1]}, 'feature_usage', 'interaction', '{"feature": "advanced_analytics", "usage_time": 120}', '2024-11-29', 'sess_456', '/analytics'),
          (${userIds[2]}, 'signup', 'conversion', '{"source": "google_ads", "campaign": "q4_promo"}', '2024-11-25', 'sess_789', '/signup'),
          (${userIds[3]}, 'purchase', 'conversion', '{"product": "pro_subscription", "amount": 29.99}', '2024-11-28', 'sess_012', '/checkout'),
          (${userIds[0]}, 'login', 'authentication', '{"method": "email", "success": true}', '2024-12-01', 'sess_345', '/login')
      `;
      
      // Insert sample product performance
      await client`
        INSERT INTO product_performance (product_name, category, views_count, purchases_count, total_revenue, rating, reviews_count)
        VALUES 
          ('Pro Subscription', 'Subscription', 1250, 45, 1349.55, 4.7, 23),
          ('Enterprise License', 'License', 450, 12, 2399.88, 4.9, 8),
          ('Add-on Feature', 'Feature', 890, 32, 319.68, 4.2, 15),
          ('Premium Support', 'Service', 340, 18, 899.82, 4.8, 12),
          ('Basic Plan', 'Subscription', 2100, 156, 0, 4.1, 45)
      `;
      
      // Insert sample marketing campaigns
      await client`
        INSERT INTO marketing_campaigns (campaign_name, campaign_type, start_date, end_date, budget, spend, impressions, clicks, conversions, revenue)
        VALUES 
          ('Black Friday Sale', 'promotion', '2024-11-24', '2024-11-30', 5000.00, 4200.00, 25000, 1200, 85, 8500.00),
          ('Q4 Lead Generation', 'lead_gen', '2024-10-01', '2024-12-31', 10000.00, 7500.00, 50000, 2100, 145, 14500.00),
          ('Product Launch', 'awareness', '2024-11-01', '2024-11-15', 3000.00, 2800.00, 18000, 890, 45, 4500.00),
          ('Holiday Special', 'promotion', '2024-12-01', '2024-12-25', 4000.00, 1200.00, 12000, 650, 32, 3200.00)
      `;
      
      console.log('✅ Sample data inserted successfully');
    } else {
      console.log('✅ Sample data already exists, skipping insertion');
    }
    
    console.log('✅ Analytics database initialized successfully');
    await client.end();
    
    return {
      success: true,
      message: 'Analytics database initialized with sample data',
      tables: ['analytics_users', 'sales', 'user_events', 'product_performance', 'marketing_campaigns'],
      sampleDataCreated: userCount === 0
    };
    
  } catch (error) {
    console.error('❌ Failed to initialize analytics database:', error);
    await client.end();
    throw error;
  }
}