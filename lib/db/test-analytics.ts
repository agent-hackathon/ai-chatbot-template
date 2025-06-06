// Note: Importing for testing - normally these would be server-only
// Set environment for testing
Object.defineProperty(process.env, 'NODE_ENV', { value: 'test', writable: true });

import { queryDatabase } from '../ai/tools/query-database';
import { initializeAnalyticsDatabase } from './init-analytics';

// Test runner for the analytics database tool
export async function runAnalyticsTests() {
  console.log('🧪 Starting analytics database tests...');
  
  const results: Array<{
    test: string;
    passed: boolean;
    error?: string;
    duration?: number;
  }> = [];
  
  // Test 1: Initialize database
  try {
    console.log('🧪 Test 1: Initialize database');
    const start = Date.now();
    await initializeAnalyticsDatabase();
    const duration = Date.now() - start;
    results.push({ test: 'Initialize database', passed: true, duration });
    console.log('✅ Test 1 passed');
  } catch (error) {
    results.push({ 
      test: 'Initialize database', 
      passed: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    console.log('❌ Test 1 failed:', error);
  }
  
  // Test 2: Basic SELECT query
  try {
    console.log('🧪 Test 2: Basic SELECT query');
    const start = Date.now();
    const result = await queryDatabase.execute({
      query: 'SELECT COUNT(*) as user_count FROM analytics_users',
      queryType: 'analytics',
      description: 'Count total users'
    });
    const duration = Date.now() - start;
    
    if (result.success && result.data && result.data.length > 0) {
      results.push({ test: 'Basic SELECT query', passed: true, duration });
      console.log('✅ Test 2 passed - User count:', result.data[0]);
    } else {
      results.push({ test: 'Basic SELECT query', passed: false, error: 'No data returned' });
      console.log('❌ Test 2 failed - No data returned');
    }
  } catch (error) {
    results.push({ 
      test: 'Basic SELECT query', 
      passed: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    console.log('❌ Test 2 failed:', error);
  }
  
  // Test 3: Sales metrics query (predefined)
  try {
    console.log('🧪 Test 3: Sales metrics query');
    const start = Date.now();
    const result = await queryDatabase.execute({
      query: 'SELECT SUM(amount) as total_revenue FROM sales',
      queryType: 'analytics',
      description: 'Get total sales revenue'
    });
    const duration = Date.now() - start;
    
    if (result.success && result.data) {
      results.push({ test: 'Sales metrics query', passed: true, duration });
      console.log('✅ Test 3 passed - Sales data:', result.data[0]);
    } else {
      results.push({ test: 'Sales metrics query', passed: false, error: result.error });
      console.log('❌ Test 3 failed:', result.error);
    }
  } catch (error) {
    results.push({ 
      test: 'Sales metrics query', 
      passed: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    console.log('❌ Test 3 failed:', error);
  }
  
  // Test 4: Security validation - forbidden DROP
  try {
    console.log('🧪 Test 4: Security validation - forbidden DROP');
    const start = Date.now();
    const result = await queryDatabase.execute({
      query: 'DROP TABLE analytics_users',
      queryType: 'analytics',
      description: 'Attempt to drop table (should fail)'
    });
    const duration = Date.now() - start;
    
    if (!result.success && result.error?.includes('DROP')) {
      results.push({ test: 'Security validation - DROP blocked', passed: true, duration });
      console.log('✅ Test 4 passed - DROP operation blocked');
    } else {
      results.push({ test: 'Security validation - DROP blocked', passed: false, error: 'DROP was not blocked' });
      console.log('❌ Test 4 failed - DROP was not blocked');
    }
  } catch (error) {
    results.push({ 
      test: 'Security validation - DROP blocked', 
      passed: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    console.log('❌ Test 4 failed:', error);
  }
  
  // Test 5: Security validation - forbidden DELETE without WHERE
  try {
    console.log('🧪 Test 5: Security validation - DELETE without WHERE');
    const start = Date.now();
    const result = await queryDatabase.execute({
      query: 'DELETE FROM sales',
      queryType: 'analytics',
      description: 'Attempt DELETE without WHERE (should fail)'
    });
    const duration = Date.now() - start;
    
    if (!result.success && result.error?.includes('WHERE')) {
      results.push({ test: 'Security validation - DELETE without WHERE blocked', passed: true, duration });
      console.log('✅ Test 5 passed - DELETE without WHERE blocked');
    } else {
      results.push({ test: 'Security validation - DELETE without WHERE blocked', passed: false, error: 'DELETE without WHERE was not blocked' });
      console.log('❌ Test 5 failed - DELETE without WHERE was not blocked');
    }
  } catch (error) {
    results.push({ 
      test: 'Security validation - DELETE without WHERE blocked', 
      passed: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    console.log('❌ Test 5 failed:', error);
  }
  
  // Test 6: INSERT query
  try {
    console.log('🧪 Test 6: INSERT query');
    const start = Date.now();
    const result = await queryDatabase.execute({
      query: `INSERT INTO user_events (event_type, event_category, timestamp) VALUES ('test_event', 'test', NOW())`,
      queryType: 'insert',
      description: 'Insert test event'
    });
    const duration = Date.now() - start;
    
    if (result.success) {
      results.push({ test: 'INSERT query', passed: true, duration });
      console.log('✅ Test 6 passed - INSERT successful');
    } else {
      results.push({ test: 'INSERT query', passed: false, error: result.error });
      console.log('❌ Test 6 failed:', result.error);
    }
  } catch (error) {
    results.push({ 
      test: 'INSERT query', 
      passed: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    console.log('❌ Test 6 failed:', error);
  }
  
  // Test 7: Complex analytics query
  try {
    console.log('🧪 Test 7: Complex analytics query');
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
      queryType: 'analytics',
      description: 'Revenue by subscription tier'
    });
    const duration = Date.now() - start;
    
    if (result.success && result.data && result.data.length > 0) {
      results.push({ test: 'Complex analytics query', passed: true, duration });
      console.log('✅ Test 7 passed - Complex query data:', result.data);
    } else {
      results.push({ test: 'Complex analytics query', passed: false, error: result.error || 'No data returned' });
      console.log('❌ Test 7 failed:', result.error);
    }
  } catch (error) {
    results.push({ 
      test: 'Complex analytics query', 
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
  
  console.log('\n📊 Test Results Summary:');
  console.log(`✅ Passed: ${passed}/${total}`);
  console.log(`❌ Failed: ${total - passed}/${total}`);
  console.log(`⏱️  Average duration: ${Math.round(avgDuration)}ms`);
  
  if (passed === total) {
    console.log('🎉 All tests passed!');
  } else {
    console.log('⚠️  Some tests failed. Check errors above.');
    results.filter(r => !r.passed).forEach(r => {
      console.log(`   - ${r.test}: ${r.error}`);
    });
  }
  
  return {
    total,
    passed,
    failed: total - passed,
    results,
    avgDuration: Math.round(avgDuration)
  };
}