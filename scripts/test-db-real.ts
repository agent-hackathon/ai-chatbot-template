import { config } from 'dotenv';

// Load environment variables
config({ path: '.env' });

// Override NODE_ENV for this test
process.env.NODE_ENV = 'test';

async function runRealDatabaseTests() {
  console.log('🚀 Starting real database tests...\n');
  
  if (!process.env.ANALYTICS_DB_POSTGRES_URL) {
    console.error('❌ ANALYTICS_DB_POSTGRES_URL environment variable not set');
    process.exit(1);
  }
  
  console.log('📡 Using database:', process.env.ANALYTICS_DB_POSTGRES_URL.split('@')[1]?.split('/')[0] || 'unknown');
  
  const results: Array<{
    test: string;
    passed: boolean;
    error?: string;
    duration?: number;
  }> = [];
  
  try {
    // Import after setting environment
    const { queryDatabase } = await import('../lib/ai/tools/query-database');
    const { initializeAnalyticsDatabase } = await import('../lib/db/init-analytics');
    
    // Test 1: Initialize database
    console.log('🧪 Test 1: Initialize analytics database');
    try {
      const start = Date.now();
      const initResult = await initializeAnalyticsDatabase();
      const duration = Date.now() - start;
      
      if (initResult.success) {
        results.push({ test: 'Initialize database', passed: true, duration });
        console.log('✅ Test 1 passed - Database initialized');
        console.log(`   Tables: ${initResult.tables?.join(', ')}`);
        console.log(`   Sample data: ${initResult.sampleDataCreated ? 'created' : 'already exists'}`);
      } else {
        results.push({ test: 'Initialize database', passed: false, error: 'Init failed' });
        console.log('❌ Test 1 failed - Database initialization failed');
      }
    } catch (error) {
      results.push({ 
        test: 'Initialize database', 
        passed: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      console.log('❌ Test 1 failed:', error);
    }
    
    // Test 2: Basic SELECT query
    console.log('\n🧪 Test 2: Basic SELECT query');
    try {
      const start = Date.now();
      const result = await queryDatabase.execute({
        query: 'SELECT COUNT(*) as user_count FROM analytics_users',
        queryType: 'analytics' as const,
        description: 'Count total users'
      });
      const duration = Date.now() - start;
      
      if (result.success && result.data && result.data.length > 0) {
        results.push({ test: 'Basic SELECT query', passed: true, duration });
        console.log('✅ Test 2 passed - User count:', result.data[0]);
      } else {
        results.push({ test: 'Basic SELECT query', passed: false, error: result.error || 'No data returned' });
        console.log('❌ Test 2 failed:', result.error);
      }
    } catch (error) {
      results.push({ 
        test: 'Basic SELECT query', 
        passed: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      console.log('❌ Test 2 failed:', error);
    }
    
    // Test 3: Sales analytics query
    console.log('\n🧪 Test 3: Sales analytics query');
    try {
      const start = Date.now();
      const result = await queryDatabase.execute({
        query: 'SELECT SUM(amount) as total_revenue, COUNT(*) as total_sales FROM sales',
        queryType: 'analytics' as const,
        description: 'Get sales metrics'
      });
      const duration = Date.now() - start;
      
      if (result.success && result.data && (Array.isArray(result.data) ? result.data.length > 0 : result.data)) {
        results.push({ test: 'Sales analytics query', passed: true, duration });
        console.log('✅ Test 3 passed - Sales data:', Array.isArray(result.data) ? result.data[0] : result.data);
      } else {
        results.push({ test: 'Sales analytics query', passed: false, error: result.error || 'No data returned' });
        console.log('❌ Test 3 failed:', result.error);
      }
    } catch (error) {
      results.push({ 
        test: 'Sales analytics query', 
        passed: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      console.log('❌ Test 3 failed:', error);
    }
    
    // Test 4: Complex JOIN query
    console.log('\n🧪 Test 4: Complex JOIN query');
    try {
      const start = Date.now();
      const result = await queryDatabase.execute({
        query: `
          SELECT 
            au.subscription_tier,
            COUNT(s.id) as sales_count,
            COALESCE(SUM(s.amount), 0) as total_revenue
          FROM analytics_users au
          LEFT JOIN sales s ON au.id = s.user_id
          GROUP BY au.subscription_tier
          ORDER BY total_revenue DESC
        `,
        queryType: 'analytics' as const,
        description: 'Revenue by subscription tier'
      });
      const duration = Date.now() - start;
      
      if (result.success && result.data && Array.isArray(result.data) && result.data.length > 0) {
        results.push({ test: 'Complex JOIN query', passed: true, duration });
        console.log('✅ Test 4 passed - Revenue by tier:');
        result.data.forEach((row: any) => {
          console.log(`   ${row.subscription_tier}: ${row.sales_count} sales, $${row.total_revenue} revenue`);
        });
      } else {
        results.push({ test: 'Complex JOIN query', passed: false, error: result.error || 'No data returned' });
        console.log('❌ Test 4 failed:', result.error);
        console.log('   Debug - result:', { success: result.success, hasData: !!result.data, isArray: Array.isArray(result.data), dataLength: result.data?.length, actualData: result.data });
      }
    } catch (error) {
      results.push({ 
        test: 'Complex JOIN query', 
        passed: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      console.log('❌ Test 4 failed:', error);
    }
    
    // Test 5: INSERT test event
    console.log('\n🧪 Test 5: INSERT test data');
    try {
      const start = Date.now();
      const result = await queryDatabase.execute({
        query: `INSERT INTO user_events (event_type, event_category, event_data, timestamp) VALUES ('test_event', 'testing', '{"source": "automated_test"}', NOW())`,
        queryType: 'insert' as const,
        description: 'Insert test event'
      });
      const duration = Date.now() - start;
      
      if (result.success) {
        results.push({ test: 'INSERT test data', passed: true, duration });
        console.log('✅ Test 5 passed - Test event inserted');
      } else {
        results.push({ test: 'INSERT test data', passed: false, error: result.error || 'Insert failed' });
        console.log('❌ Test 5 failed:', result.error);
      }
    } catch (error) {
      results.push({ 
        test: 'INSERT test data', 
        passed: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      console.log('❌ Test 5 failed:', error);
    }
    
    // Test 6: Security - Dangerous query blocking
    console.log('\n🧪 Test 6: Security - Block dangerous queries');
    try {
      const start = Date.now();
      const result = await queryDatabase.execute({
        query: 'DROP TABLE analytics_users',
        queryType: 'analytics' as const,
        description: 'Attempt dangerous operation (should fail)'
      });
      const duration = Date.now() - start;
      
      if (!result.success && result.error?.includes('must start with one of')) {
        results.push({ test: 'Security - Block dangerous queries', passed: true, duration });
        console.log('✅ Test 6 passed - Dangerous query blocked');
      } else {
        results.push({ test: 'Security - Block dangerous queries', passed: false, error: 'Dangerous query was not blocked' });
        console.log('❌ Test 6 failed - Dangerous query was not blocked');
      }
    } catch (error) {
      results.push({ 
        test: 'Security - Block dangerous queries', 
        passed: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      console.log('❌ Test 6 failed:', error);
    }
    
    // Test 7: Product performance query
    console.log('\n🧪 Test 7: Product performance analytics');
    try {
      const start = Date.now();
      const result = await queryDatabase.execute({
        query: 'SELECT product_name, total_revenue, purchases_count, rating FROM product_performance ORDER BY total_revenue DESC LIMIT 3',
        queryType: 'analytics' as const,
        description: 'Top products by revenue'
      });
      const duration = Date.now() - start;
      
      if (result.success && result.data && result.data.length > 0) {
        results.push({ test: 'Product performance analytics', passed: true, duration });
        console.log('✅ Test 7 passed - Top products:');
        result.data.forEach((row: any, index: number) => {
          console.log(`   ${index + 1}. ${row.product_name}: $${row.total_revenue} (${row.purchases_count} sales, ${row.rating}★)`);
        });
      } else {
        results.push({ test: 'Product performance analytics', passed: false, error: result.error || 'No data returned' });
        console.log('❌ Test 7 failed:', result.error);
      }
    } catch (error) {
      results.push({ 
        test: 'Product performance analytics', 
        passed: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      console.log('❌ Test 7 failed:', error);
    }
    
    // Summary
    const passed = results.filter(r => r.passed).length;
    const total = results.length;
    const avgDuration = results
      .filter(r => r.duration)
      .reduce((sum, r) => sum + (r.duration || 0), 0) / results.filter(r => r.duration).length;
    
    console.log('\n📊 Real Database Test Results:');
    console.log(`✅ Passed: ${passed}/${total}`);
    console.log(`❌ Failed: ${total - passed}/${total}`);
    console.log(`⏱️  Average duration: ${Math.round(avgDuration)}ms`);
    
    if (passed === total) {
      console.log('\n🎉 All database tests passed! The analytics database tool is fully operational.');
      console.log('💡 You can now use the chatbot to query your analytics data with natural language.');
      return true;
    } else {
      console.log('\n⚠️  Some tests failed. Check the errors above.');
      results.filter(r => !r.passed).forEach(r => {
        console.log(`   - ${r.test}: ${r.error}`);
      });
      return false;
    }
    
  } catch (error) {
    console.error('💥 Test suite failed to initialize:', error);
    return false;
  }
}

async function main() {
  try {
    const success = await runRealDatabaseTests();
    process.exit(success ? 0 : 1);
  } catch (error) {
    console.error('💥 Test suite crashed:', error);
    process.exit(1);
  }
}

main();