import { z } from 'zod';
import { tool } from 'ai';
import { 
  getSalesMetrics, 
  getTopProducts, 
  getUserGrowth,
  executeAnalyticsQuery,
  initializeAnalyticsDatabase,
} from '@/lib/db/analytics-queries';

// Safety checks for SQL queries
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

export const queryDatabase = tool({
  description: `Query the analytics database to get business insights, sales data, user metrics, and more. 
  This tool can handle queries about sales performance, user growth, product analytics, marketing campaigns, and user events.
  
  Available tables:
  - analytics_users: User information (id, email, firstName, lastName, signupDate, subscriptionTier)
  - sales: Sales transactions (id, userId, productName, amount, saleDate, region, salesRep)
  - user_events: User interaction events (id, userId, eventType, eventCategory, timestamp, page)
  - product_performance: Product metrics (productName, viewsCount, purchasesCount, totalRevenue, rating)
  - marketing_campaigns: Campaign performance (campaignName, budget, spend, impressions, clicks, conversions)
  
  Safety features: 
  - Only SELECT, INSERT, and UPDATE operations allowed
  - DELETE operations require WHERE clauses
  - No DDL operations (DROP, ALTER, etc.)
  - Results limited to 100 rows maximum`,
  
  parameters: z.object({
    query: z.string().describe('The SQL query to execute on the analytics database'),
    queryType: z.enum(['analytics', 'insert', 'update']).describe('Type of database operation'),
    description: z.string().optional().describe('Human-readable description of what the query does')
  }),
  
  execute: async ({ query, queryType, description }) => {
    try {
      // Initialize database if needed
      if (queryType === 'analytics' && query.toLowerCase().includes('initialize')) {
        const result = await initializeAnalyticsDatabase();
        return {
          success: true,
          message: 'Analytics database initialized with sample data',
          data: result
        };
      }
      
      // Validate query safety
      const validation = validateQuery(query);
      if (!validation.isValid) {
        return {
          success: false,
          error: `Query validation failed: ${validation.error}`,
          suggestion: 'Please modify your query to comply with safety requirements'
        };
      }
      
      // Handle predefined analytics queries
      if (queryType === 'analytics') {
        const lowerQuery = query.toLowerCase();
        
        // Sales metrics queries (only simple SUM/COUNT from sales table)
        if (lowerQuery.includes('sum(amount)') && lowerQuery.includes('from sales') && !lowerQuery.includes('join')) {
          const result = await getSalesMetrics();
          if (result.success) {
            return {
              success: true,
              message: 'Sales metrics retrieved successfully',
              data: result.data,
              query_executed: 'Predefined sales metrics query'
            };
          }
        }
        
        // Top products query
        if (lowerQuery.includes('top') && lowerQuery.includes('product')) {
          const limitMatch = query.match(/(\d+)/);
          const limit = limitMatch ? Number.parseInt(limitMatch[1]) : 10;
          const result = await getTopProducts(limit);
          if (result.success) {
            return {
              success: true,
              message: `Top ${limit} products by revenue`,
              data: result.data,
              query_executed: 'Predefined top products query'
            };
          }
        }
        
        // User growth query
        if (lowerQuery.includes('user') && (lowerQuery.includes('growth') || lowerQuery.includes('signup'))) {
          const result = await getUserGrowth();
          if (result.success) {
            return {
              success: true,
              message: 'User growth data retrieved',
              data: result.data,
              query_executed: 'Predefined user growth query'
            };
          }
        }
      }
      
      // Execute custom query
      const result = await executeAnalyticsQuery(query);
      
      if (result.success) {
        return {
          success: true,
          message: description || `Query executed successfully. Retrieved ${result.rowCount} rows.`,
          data: result.data,
          rowCount: result.rowCount,
          query_executed: query
        };
      } else {
        return {
          success: false,
          error: result.error,
          suggestion: 'Check your SQL syntax and table names. Available tables: analytics_users, sales, user_events, product_performance, marketing_campaigns'
        };
      }
      
    } catch (error) {
      console.error('Database query tool error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        suggestion: 'Please check your query syntax and try again'
      };
    }
  }
});