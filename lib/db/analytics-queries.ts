// Skip server-only for testing if needed
if (process.env.NODE_ENV !== 'test') {
  require('server-only');
}

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { and, gte, lte, desc, asc, count, sum, avg } from 'drizzle-orm';
import { 
  analyticsUsers, 
  sales, 
  userEvents, 
  productPerformance, 
  marketingCampaigns,
} from './analytics-schema';

// Initialize analytics database connection
const getAnalyticsDb = () => {
  const dbUrl = process.env.ANALYTICS_DB_POSTGRES_URL;
  if (!dbUrl) {
    throw new Error('ANALYTICS_DB_POSTGRES_URL environment variable is not set');
  }
  const client = postgres(dbUrl);
  return drizzle(client);
};

// Initialize database tables (create if not exist)
export async function initializeAnalyticsDatabase() {
  const db = getAnalyticsDb();
  
  try {
    // Create tables with sample data
    await createSampleData();
    return { success: true, message: 'Analytics database initialized successfully' };
  } catch (error) {
    console.error('Failed to initialize analytics database:', error);
    throw error;
  }
}

// Create sample data for demonstration
export async function createSampleData() {
  const db = getAnalyticsDb();
  
  try {
    // Check if data already exists
    const existingUsers = await db.select().from(analyticsUsers).limit(1);
    if (existingUsers.length > 0) {
      return { message: 'Sample data already exists' };
    }

    // Insert sample users
    const users = await db.insert(analyticsUsers).values([
      {
        email: 'john.doe@example.com',
        firstName: 'John',
        lastName: 'Doe',
        signupDate: new Date('2024-01-15'),
        lastLoginDate: new Date('2024-12-01'),
        subscriptionTier: 'pro'
      },
      {
        email: 'jane.smith@example.com',
        firstName: 'Jane',
        lastName: 'Smith',
        signupDate: new Date('2024-02-20'),
        lastLoginDate: new Date('2024-11-28'),
        subscriptionTier: 'enterprise'
      },
      {
        email: 'bob.wilson@example.com',
        firstName: 'Bob',
        lastName: 'Wilson',
        signupDate: new Date('2024-03-10'),
        lastLoginDate: new Date('2024-11-25'),
        subscriptionTier: 'free'
      }
    ]).returning();

    // Insert sample sales
    await db.insert(sales).values([
      {
        userId: users[0].id,
        productName: 'Pro Subscription',
        productCategory: 'Subscription',
        amount: '29.99',
        saleDate: new Date('2024-11-01'),
        paymentMethod: 'credit_card',
        region: 'North America',
        salesRep: 'Alice Johnson'
      },
      {
        userId: users[1].id,
        productName: 'Enterprise License',
        productCategory: 'License',
        amount: '199.99',
        saleDate: new Date('2024-11-15'),
        paymentMethod: 'bank_transfer',
        region: 'Europe',
        salesRep: 'Michael Brown'
      },
      {
        userId: users[0].id,
        productName: 'Add-on Feature',
        productCategory: 'Feature',
        amount: '9.99',
        saleDate: new Date('2024-11-20'),
        paymentMethod: 'credit_card',
        region: 'North America',
        salesRep: 'Alice Johnson'
      }
    ]);

    // Insert sample events
    await db.insert(userEvents).values([
      {
        userId: users[0].id,
        eventType: 'page_view',
        eventCategory: 'navigation',
        eventData: '{"page": "/dashboard", "duration": 45}',
        timestamp: new Date('2024-11-30'),
        sessionId: 'sess_123',
        page: '/dashboard'
      },
      {
        userId: users[1].id,
        eventType: 'feature_usage',
        eventCategory: 'interaction',
        eventData: '{"feature": "advanced_analytics", "usage_time": 120}',
        timestamp: new Date('2024-11-29'),
        sessionId: 'sess_456',
        page: '/analytics'
      }
    ]);

    // Insert sample product performance
    await db.insert(productPerformance).values([
      {
        productName: 'Pro Subscription',
        category: 'Subscription',
        viewsCount: 1250,
        purchasesCount: 45,
        totalRevenue: '1349.55',
        rating: '4.7',
        reviewsCount: 23
      },
      {
        productName: 'Enterprise License',
        category: 'License',
        viewsCount: 450,
        purchasesCount: 12,
        totalRevenue: '2399.88',
        rating: '4.9',
        reviewsCount: 8
      }
    ]);

    // Insert sample marketing campaigns
    await db.insert(marketingCampaigns).values([
      {
        campaignName: 'Black Friday Sale',
        campaignType: 'promotion',
        startDate: new Date('2024-11-24'),
        endDate: new Date('2024-11-30'),
        budget: '5000.00',
        spend: '4200.00',
        impressions: 25000,
        clicks: 1200,
        conversions: 85,
        revenue: '8500.00'
      },
      {
        campaignName: 'Q4 Lead Generation',
        campaignType: 'lead_gen',
        startDate: new Date('2024-10-01'),
        endDate: new Date('2024-12-31'),
        budget: '10000.00',
        spend: '7500.00',
        impressions: 50000,
        clicks: 2100,
        conversions: 145,
        revenue: '14500.00'
      }
    ]);

    return { message: 'Sample data created successfully' };
  } catch (error) {
    console.error('Failed to create sample data:', error);
    throw error;
  }
}

// Safe query execution with row limits
export async function executeAnalyticsQuery(query: string, params: any[] = []) {
  const dbUrl = process.env.ANALYTICS_DB_POSTGRES_URL;
  if (!dbUrl) {
    throw new Error('ANALYTICS_DB_POSTGRES_URL environment variable is not set');
  }
  
  const client = postgres(dbUrl);
  const MAX_ROWS = 100;
  
  try {
    // Add LIMIT to queries if not present
    const limitedQuery = query.includes('LIMIT') ? query : `${query} LIMIT ${MAX_ROWS}`;
    
    const result = await client.unsafe(limitedQuery);
    await client.end();
    
    // Convert RowList to array for consistency
    const dataArray = Array.from(result);
    
    return {
      success: true,
      data: dataArray,
      rowCount: dataArray.length
    };
  } catch (error) {
    await client.end();
    console.error('Failed to execute analytics query:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

// Predefined safe queries for common analytics needs
export async function getSalesMetrics(startDate?: Date, endDate?: Date) {
  const dbUrl = process.env.ANALYTICS_DB_POSTGRES_URL;
  if (!dbUrl) {
    throw new Error('ANALYTICS_DB_POSTGRES_URL environment variable is not set');
  }
  
  const client = postgres(dbUrl);
  
  try {
    let query = `
      SELECT 
        COUNT(id) as total_sales,
        SUM(amount) as total_revenue,
        AVG(amount) as avg_sale_amount
      FROM sales
    `;

    if (startDate && endDate) {
      query += ` WHERE sale_date >= '${startDate.toISOString()}' AND sale_date <= '${endDate.toISOString()}'`;
    }

    const result = await client.unsafe(query);
    await client.end();
    
    // Convert RowList to array for consistency
    const dataArray = Array.from(result);
    
    return { success: true, data: dataArray[0] };
  } catch (error) {
    await client.end();
    console.error('Failed to get sales metrics:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function getTopProducts(limit = 10) {
  const dbUrl = process.env.ANALYTICS_DB_POSTGRES_URL;
  if (!dbUrl) {
    throw new Error('ANALYTICS_DB_POSTGRES_URL environment variable is not set');
  }
  
  const client = postgres(dbUrl);
  
  try {
    const result = await client.unsafe(`
      SELECT * FROM product_performance 
      ORDER BY total_revenue DESC 
      LIMIT ${Math.min(limit, 50)}
    `);
    await client.end();

    // Convert RowList to array for consistency
    const dataArray = Array.from(result);

    return { success: true, data: dataArray };
  } catch (error) {
    await client.end();
    console.error('Failed to get top products:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function getUserGrowth() {
  const dbUrl = process.env.ANALYTICS_DB_POSTGRES_URL;
  if (!dbUrl) {
    throw new Error('ANALYTICS_DB_POSTGRES_URL environment variable is not set');
  }
  
  const client = postgres(dbUrl);
  
  try {
    const result = await client.unsafe(`
      SELECT 
        DATE_TRUNC('month', signup_date) as signup_month,
        COUNT(id) as user_count
      FROM analytics_users
      GROUP BY DATE_TRUNC('month', signup_date)
      ORDER BY signup_month ASC
      LIMIT 24
    `);
    await client.end();

    // Convert RowList to array for consistency
    const dataArray = Array.from(result);

    return { success: true, data: dataArray };
  } catch (error) {
    await client.end();
    console.error('Failed to get user growth:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}