import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });
config({ path: '.env.example' });

// Set environment for testing
process.env.NODE_ENV = 'test';

// Mock the database URL if not provided
if (!process.env.ANALYTICS_DB_POSTGRES_URL || process.env.ANALYTICS_DB_POSTGRES_URL === 'DATABASE_URL') {
  process.env.ANALYTICS_DB_POSTGRES_URL = process.env.POSTGRES_URL || process.env.DATABASE_URL;
}

async function main() {
  console.log('🚀 Starting database tool test suite...\n');
  
  // Basic validation tests that don't require database connection
  console.log('🧪 Running basic validation tests...');
  
  try {
    // Test 1: Import the query tool
    console.log('🧪 Test 1: Import queryDatabase tool');
    const { queryDatabase } = await import('../lib/ai/tools/query-database');
    
    if (queryDatabase && typeof queryDatabase.execute === 'function') {
      console.log('✅ Test 1 passed - queryDatabase imported successfully');
    } else {
      console.log('❌ Test 1 failed - queryDatabase not properly exported');
      process.exit(1);
    }
    
    // Test 2: Test query validation (security)
    console.log('🧪 Test 2: Security validation');
    const dangerousResult = await queryDatabase.execute({
      query: 'DROP TABLE analytics_users',
      queryType: 'analytics',
      description: 'Test dangerous query blocking'
    });
    
    if (!dangerousResult.success && dangerousResult.error?.includes('DROP')) {
      console.log('✅ Test 2 passed - Dangerous queries blocked');
    } else {
      console.log('❌ Test 2 failed - Dangerous queries not blocked');
      process.exit(1);
    }
    
    // Test 3: Test DELETE without WHERE validation
    console.log('🧪 Test 3: DELETE without WHERE validation');
    const deleteResult = await queryDatabase.execute({
      query: 'DELETE FROM sales',
      queryType: 'analytics',
      description: 'Test DELETE without WHERE blocking'
    });
    
    if (!deleteResult.success && deleteResult.error?.includes('WHERE')) {
      console.log('✅ Test 3 passed - DELETE without WHERE blocked');
    } else {
      console.log('❌ Test 3 failed - DELETE without WHERE not blocked');
      process.exit(1);
    }
    
    console.log('\n🎉 Basic validation tests passed!');
    console.log('\n📝 To run full database tests:');
    console.log('1. Set up your .env.local file with ANALYTICS_DB_POSTGRES_URL');
    console.log('2. Run: pnpm test:db-tool');
    console.log('\n💡 The database tool is ready for use in the chat interface.');
    
  } catch (error) {
    console.error('💥 Test failed:', error);
    process.exit(1);
  }
}

main();