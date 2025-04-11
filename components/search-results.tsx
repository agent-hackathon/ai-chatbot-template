import React from 'react';

import { SearchResultCard } from '@/components/search-result-card';

interface SearchResult {
  title: string;
  snippet: string;
  url: string;
}

interface SearchResultsProps {
  results: SearchResult[];
  query: string;
}

export function SearchResults({ results, query }: SearchResultsProps) {
  if (!results || results.length === 0) {
    return null;
  }

  const hasError = results.length === 1 && results[0].title.includes('Error');

  return (
    <div className="my-4 border rounded-lg p-4 bg-slate-50 dark:bg-slate-900">
      <div className="mb-3">
        <h3 className="text-sm font-medium text-slate-700 dark:text-slate-200">
          {hasError 
            ? 'Search Error' 
            : `Search results for: "${query}"`}
        </h3>
      </div>
      <div className="space-y-2">
        {results.map((result, index) => (
          <SearchResultCard
            key={`${result.url || ''}-${index}`}
            title={result.title}
            snippet={result.snippet}
            url={result.url}
          />
        ))}
      </div>
    </div>
  );
} 