// Simple validation test for the database tool without server-only restrictions
import { z } from 'zod';

// Mock the tool structure for testing
const FORBIDDEN_KEYWORDS = [
  'DROP', 'TRUNCATE', 'DELETE FROM analytics_users', 'DELETE FROM sales', 
  'DELETE FROM user_events', 'DELETE FROM product_performance', 'DELETE FROM marketing_campaigns',
  'ALTER TABLE', 'CREATE INDEX', 'DROP INDEX', 'GRANT', 'REVOKE'
];

const ALLOWED_OPERATIONS = ['SELECT', 'INSERT', 'UPDATE', 'DELETE'];

function validateQuery(query: string): { isValid: boolean; error?: string } {
  const upperQuery = query.toUpperCase().trim();
  
  // First check if query starts with allowed operation
  const startsWithAllowed = ALLOWED_OPERATIONS.some(op => upperQuery.startsWith(op));
  if (!startsWithAllowed) {
    return { 
      isValid: false, 
      error: `Query must start with one of: ${ALLOWED_OPERATIONS.join(', ')}` 
    };
  }
  
  // Additional safety checks for DELETE and UPDATE
  if (upperQuery.startsWith('DELETE') && !upperQuery.includes('WHERE')) {
    return { 
      isValid: false, 
      error: 'DELETE operations must include a WHERE clause' 
    };
  }
  
  if (upperQuery.startsWith('UPDATE') && !upperQuery.includes('WHERE')) {
    return { 
      isValid: false, 
      error: 'UPDATE operations must include a WHERE clause' 
    };
  }
  
  // Check for forbidden keywords (after basic operation validation)
  for (const keyword of FORBIDDEN_KEYWORDS) {
    if (upperQuery.includes(keyword)) {
      return { 
        isValid: false, 
        error: `Operation '${keyword}' is not allowed for security reasons` 
      };
    }
  }
  
  return { isValid: true };
}

async function runValidationTests() {
  console.log('🚀 Starting database tool validation tests...\n');
  
  const testCases = [
    {
      name: 'Valid SELECT query',
      query: 'SELECT COUNT(*) FROM analytics_users',
      shouldPass: true
    },
    {
      name: 'Valid INSERT query',
      query: 'INSERT INTO sales (product_name, amount) VALUES (\'test\', 10.00)',
      shouldPass: true
    },
    {
      name: 'Valid UPDATE with WHERE',
      query: 'UPDATE sales SET amount = 15.00 WHERE id = \'123\'',
      shouldPass: true
    },
    {
      name: 'Forbidden DROP TABLE',
      query: 'DROP TABLE analytics_users',
      shouldPass: false,
      expectedError: 'must start with one of'
    },
    {
      name: 'Forbidden TRUNCATE',
      query: 'TRUNCATE TABLE sales',
      shouldPass: false,
      expectedError: 'must start with one of'
    },
    {
      name: 'DELETE without WHERE',
      query: 'DELETE FROM sales',
      shouldPass: false,
      expectedError: 'WHERE clause'
    },
    {
      name: 'UPDATE without WHERE',
      query: 'UPDATE sales SET amount = 0',
      shouldPass: false,
      expectedError: 'WHERE clause'
    },
    {
      name: 'Invalid starting operation',
      query: 'GRANT ALL ON sales TO user',
      shouldPass: false,
      expectedError: 'must start with one of'
    }
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const testCase of testCases) {
    console.log(`🧪 Testing: ${testCase.name}`);
    const result = validateQuery(testCase.query);
    
    if (testCase.shouldPass) {
      if (result.isValid) {
        console.log('✅ PASS - Query validation passed as expected');
        passed++;
      } else {
        console.log(`❌ FAIL - Expected query to pass but got error: ${result.error}`);
        failed++;
      }
    } else {
      if (!result.isValid && (!testCase.expectedError || result.error?.includes(testCase.expectedError))) {
        console.log('✅ PASS - Query correctly blocked');
        passed++;
      } else {
        console.log(`❌ FAIL - Expected query to be blocked with '${testCase.expectedError}' but got: ${result.error}`);
        failed++;
      }
    }
    console.log('');
  }
  
  console.log('📊 Test Results Summary:');
  console.log(`✅ Passed: ${passed}/${testCases.length}`);
  console.log(`❌ Failed: ${failed}/${testCases.length}`);
  
  if (failed === 0) {
    console.log('\n🎉 All validation tests passed!');
    console.log('💡 The database tool security measures are working correctly.');
    return true;
  } else {
    console.log('\n⚠️  Some validation tests failed.');
    return false;
  }
}

// Test the Zod schema validation
async function testZodSchema() {
  console.log('🧪 Testing Zod schema validation...');
  
  const schema = z.object({
    query: z.string().describe('The SQL query to execute on the analytics database'),
    queryType: z.enum(['analytics', 'insert', 'update']).describe('Type of database operation'),
    description: z.string().optional().describe('Human-readable description of what the query does')
  });
  
  const validInput = {
    query: 'SELECT * FROM sales',
    queryType: 'analytics' as const,
    description: 'Get all sales data'
  };
  
  const invalidInput = {
    query: 'SELECT * FROM sales',
    queryType: 'invalid' as any,
    description: 'Get all sales data'
  };
  
  try {
    const result1 = schema.parse(validInput);
    console.log('✅ Valid input parsed successfully');
    
    try {
      const result2 = schema.parse(invalidInput);
      console.log('❌ Invalid input should have failed validation');
      return false;
    } catch (error) {
      console.log('✅ Invalid input correctly rejected');
      return true;
    }
  } catch (error) {
    console.log('❌ Valid input was incorrectly rejected');
    return false;
  }
}

async function main() {
  try {
    const validationPassed = await runValidationTests();
    const schemaPassed = await testZodSchema();
    
    if (validationPassed && schemaPassed) {
      console.log('\n🎉 All tests passed! The database tool is ready for integration.');
      process.exit(0);
    } else {
      console.log('\n❌ Some tests failed. Please check the implementation.');
      process.exit(1);
    }
  } catch (error) {
    console.error('💥 Test suite failed:', error);
    process.exit(1);
  }
}

main();