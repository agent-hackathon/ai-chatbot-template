declare module 'duck-duck-scrape' {
  export enum SafeSearchType {
    OFF = 0,
    MODERATE = 1,
    STRICT = 2
  }

  export interface SearchResult {
    title: string;
    description: string;
    url: string;
  }

  export interface SearchResponse {
    noResults: boolean;
    results: SearchResult[];
  }

  export interface NewsResult {
    title: string;
    snippet: string;
    url: string;
    source: string;
    date: string;
    thumbnail?: string;
  }

  export interface NewsSearchResults {
    results: NewsResult[];
  }

  export interface NewsSearchOptions {
    safeSearch?: SafeSearchType;
  }

  export interface NeedleOptions {
    // HTTP request options
  }

  export function search(query: string, options?: { safeSearch?: SafeSearchType }): Promise<SearchResponse>;
  
  export function searchNews(
    query: string, 
    options?: NewsSearchOptions, 
    needleOptions?: NeedleOptions
  ): Promise<NewsSearchResults>;
} 