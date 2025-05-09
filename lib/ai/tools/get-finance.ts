// lib/ai/tools/get-finance.ts
import { tool } from 'ai';
import { z } from 'zod';

export const getFinance = tool({
  description: 'Get financial data about stocks, cryptocurrencies, or market overview',
  parameters: z.object({
    symbol: z.string().optional().describe('Stock or cryptocurrency symbol (e.g., AAPL, BTC-USD)'),
    dataType: z.enum(['quote', 'overview', 'news', 'market-heatmap'])
      .describe('Type of data to retrieve: quote (latest price), overview (company info), news, or market-heatmap'),
  }),
  execute: async ({ symbol, dataType }) => {
    // Handle market heatmap widget request
    if (dataType === 'market-heatmap') {
      return {
        widgetType: 'market-heatmap'
      };
    }
    
    // Original Alpha Vantage API logic for other data types
    const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
    
    if (!apiKey && ['quote', 'overview', 'news'].includes(dataType)) {
      throw new Error('ALPHA_VANTAGE_API_KEY is not set in environment variables');
    }

    try {
      switch (dataType) {
        case 'quote':
          return await getStockQuote(symbol, apiKey);
        case 'overview':
          return await getCompanyOverview(symbol, apiKey);
        case 'news':
          return await getCompanyNews(symbol, apiKey);
        default:
          throw new Error(`Unsupported data type: ${dataType}`);
      }
    } catch (error) {
      console.error('Error fetching financial data:', error);
      return {
        error: 'Failed to fetch financial data',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },
});

async function getStockQuote(symbol: string, apiKey: string) {
  const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${encodeURIComponent(symbol)}&apikey=${apiKey}`;
  
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`API request failed with status ${response.status}`);
  }
  
  const data = await response.json();
  
  // Check if we got a valid response
  if (data['Error Message']) {
    throw new Error(data['Error Message']);
  }
  
  if (!data['Global Quote'] || Object.keys(data['Global Quote']).length === 0) {
    throw new Error(`No data found for symbol: ${symbol}`);
  }
  
  // Format the response for better readability
  const quote = data['Global Quote'];
  return {
    symbol: quote['01. symbol'],
    price: Number.parseFloat(quote['05. price']),
    change: Number.parseFloat(quote['09. change']),
    changePercent: quote['10. change percent'],
    lastTradeDay: quote['07. latest trading day'],
    volume: Number.parseInt(quote['06. volume'], 10),
  };
}

async function getCompanyOverview(symbol: string, apiKey: string) {
  const url = `https://www.alphavantage.co/query?function=OVERVIEW&symbol=${encodeURIComponent(symbol)}&apikey=${apiKey}`;
  
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`API request failed with status ${response.status}`);
  }
  
  const data = await response.json();
  
  // Check if we got a valid response (empty object means no data found)
  if (Object.keys(data).length === 0) {
    throw new Error(`No company overview found for symbol: ${symbol}`);
  }
  
  // Return a subset of the most useful fields
  return {
    symbol: data.Symbol,
    name: data.Name,
    description: data.Description,
    exchange: data.Exchange,
    industry: data.Industry,
    sector: data.Sector,
    marketCap: data.MarketCapitalization,
    peRatio: data.PERatio,
    dividendYield: data.DividendYield,
    weekHigh52: data['52WeekHigh'],
    weekLow52: data['52WeekLow'],
  };
}

async function getCompanyNews(symbol: string, apiKey: string) {
  // Alpha Vantage does not have a direct news endpoint for specific symbols
  // We'll use the NEWS_SENTIMENT endpoint which returns news related to tickers
  const url = `https://www.alphavantage.co/query?function=NEWS_SENTIMENT&tickers=${encodeURIComponent(symbol)}&apikey=${apiKey}`;
  
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`API request failed with status ${response.status}`);
  }
  
  const data = await response.json();
  
  // Check if we got a valid response
  if (data['Error Message']) {
    throw new Error(data['Error Message']);
  }
  
  if (!data.feed || data.feed.length === 0) {
    throw new Error(`No news found for symbol: ${symbol}`);
  }
  
  // Return the first 5 news items or fewer if less are available
  return {
    symbol,
    news: data.feed.slice(0, 5).map((item: any) => ({
      title: item.title,
      summary: item.summary,
      url: item.url,
      timePublished: item.time_published,
      source: item.source,
    })),
  };
}