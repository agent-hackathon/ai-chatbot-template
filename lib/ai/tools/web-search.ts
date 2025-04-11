import { tool } from 'ai';
import { z } from 'zod';
import { 
  search, 
  searchNews, 
  SafeSearchType, 
  NewsResult as DDGNewsResult,
  SearchResult as DDGSearchResult
} from 'duck-duck-scrape';

interface SearchResponse {
  noResults: boolean;
  results: DDGSearchResult[];
}

export const webSearch = tool({
  description: 'Search the web for information',
  parameters: z.object({
    query: z.string().describe('The search query to look up on the web'),
  }),
  execute: async ({ query }) => {
    try {
      // Check if query is about news or current events
      const isNewsQuery = /news|latest|recent|update|today|yesterday|this week|this month|current/i.test(query);
      
      if (isNewsQuery) {
        // Use news search for news-related queries
        const newsResults = await searchNews(query, {
          safeSearch: SafeSearchType.STRICT
        });

        if (!newsResults.results.length) {
          return {
            results: [
              {
                title: "No news results found",
                snippet: "No news results were found for your query. Please try a different search term.",
                url: ""
              }
            ],
            query
          };
        }

        return {
          results: newsResults.results.slice(0, 5).map((result: DDGNewsResult) => {
            // Format the date if available
            let formattedDate = '';
            if (result.date) {
              try {
                const date = new Date(result.date);
                // Check if date is valid and not the epoch start (which indicates a parsing failure)
                if (!isNaN(date.getTime()) && date.getFullYear() > 1970) {
                  formattedDate = ` (${date.toLocaleDateString()})`;
                }
              } catch (e) {
                // Ignore date formatting errors
              }
            }
            
            // Format the source if available
            const sourcePrefix = result.source ? `${result.source}${formattedDate} - ` : '';
            
            return {
              title: result.title || 'No title available',
              snippet: `${sourcePrefix}${result.snippet || 'No description available'}`,
              url: result.url || ''
            };
          }),
          query
        };
      } else {
        // Use regular search for non-news queries
        const searchResults = await search(query, {
          safeSearch: SafeSearchType.STRICT
        }) as SearchResponse;

        if (searchResults.noResults) {
          return {
            results: [
              {
                title: "No results found",
                snippet: "No search results were found for your query. Please try a different search term.",
                url: ""
              }
            ],
            query
          };
        }

        return {
          results: searchResults.results.slice(0, 5).map(result => ({
            title: result.title || 'No title available',
            snippet: result.description || 'No description available',
            url: result.url || ''
          })),
          query
        };
      }
    } catch (error) {
      console.error('Web search error:', error);
      
      return {
        results: [
          {
            title: "Error performing web search",
            snippet: "The search API encountered an error. Please try again with a different query or contact support if the issue persists.",
            url: ""
          }
        ],
        query,
        error: 'Failed to perform web search'
      };
    }
  },
}); 