// components/finance.tsx
'use client';

import cx from 'classnames';
import { useState } from 'react';

interface StockQuote {
  symbol: string;
  price: number;
  change: number;
  changePercent: string;
  lastTradeDay: string;
  volume: number;
}

interface CompanyOverview {
  symbol: string;
  name: string;
  description: string;
  exchange: string;
  industry: string;
  sector: string;
  marketCap: string;
  peRatio: string;
  dividendYield: string;
  weekHigh52: string;
  weekLow52: string;
}

interface CompanyNews {
  symbol: string;
  news: Array<{
    title: string;
    summary: string;
    url: string;
    timePublished: string;
    source: string;
  }>;
}

type FinanceData = StockQuote | CompanyOverview | CompanyNews;

export function Finance({ financeData }: { financeData?: FinanceData }) {
  // Default data for loading state
  const defaultData: StockQuote = {
    symbol: 'AAPL',
    price: 175.04,
    change: 0.89,
    changePercent: '0.51%',
    lastTradeDay: '2024-10-10',
    volume: 42000000
  };
  
  const data = financeData || defaultData;
  
  // Determine what type of data we're dealing with
  const isQuote = 'price' in data && 'change' in data;
  const isOverview = 'description' in data && 'industry' in data;
  const isNews = 'news' in data;
  
  // Format numbers for display
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };
  
  // Format large numbers (like market cap, volume)
  const formatLargeNumber = (num: string | number) => {
    const n = typeof num === 'string' ? parseFloat(num) : num;
    if (isNaN(n)) return 'N/A';
    
    if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
    if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
    if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
    return `$${formatNumber(n)}`;
  };
  
  // Format date
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };
  
  // Determine if change is positive, negative, or neutral
  const changeColor = (change: number) => {
    if (change > 0) return 'text-green-500';
    if (change < 0) return 'text-red-500';
    return 'text-zinc-400';
  };

  if (isQuote) {
    const quote = data as StockQuote;
    const isPositive = quote.change >= 0;
    
    return (
      <div className="flex flex-col gap-3 rounded-2xl p-4 bg-zinc-900 text-white max-w-[500px] border border-zinc-800">
        <div className="flex justify-between items-center">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-semibold">{quote.symbol}</span>
            <span className="text-zinc-400 text-sm">Stock Quote</span>
          </div>
          <div className="text-xs text-zinc-400">{formatDate(quote.lastTradeDay)}</div>
        </div>
        
        <div className="flex flex-row justify-between items-baseline">
          <div className="text-3xl font-bold">${quote.price.toFixed(2)}</div>
          <div className={cx("flex items-center gap-1", changeColor(quote.change))}>
            <div className="font-medium">
              {isPositive ? '+' : ''}{quote.change.toFixed(2)}
            </div>
            <div className="text-sm">
              ({isPositive ? '+' : ''}{quote.changePercent})
            </div>
          </div>
        </div>
        
        <div className="pt-2 border-t border-zinc-800 flex justify-between text-sm">
          <div className="flex flex-col">
            <span className="text-zinc-400">Volume</span>
            <span>{formatLargeNumber(quote.volume)}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className={cx("size-3 rounded-full", isPositive ? "bg-green-500" : "bg-red-500")}></span>
            <span className="text-zinc-400">{isPositive ? 'Bullish' : 'Bearish'}</span>
          </div>
        </div>
      </div>
    );
  }
  
  if (isOverview) {
    const overview = data as CompanyOverview;
    
    return (
      <div className="flex flex-col gap-4 rounded-2xl p-4 bg-zinc-900 text-white max-w-[500px] border border-zinc-800">
        <div className="flex justify-between items-baseline">
          <div className="flex flex-col">
            <div className="text-lg font-semibold">{overview.name}</div>
            <div className="text-sm text-zinc-400">{overview.symbol} • {overview.exchange}</div>
          </div>
        </div>
        
        <p className="text-sm text-zinc-300 line-clamp-3">{overview.description}</p>
        
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm pt-2 border-t border-zinc-800">
          <div className="flex justify-between">
            <span className="text-zinc-400">Sector</span>
            <span>{overview.sector}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-400">Industry</span>
            <span>{overview.industry}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-400">Market Cap</span>
            <span>{formatLargeNumber(overview.marketCap)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-400">P/E Ratio</span>
            <span>{overview.peRatio}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-400">52-Week High</span>
            <span>${overview.weekHigh52}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-400">52-Week Low</span>
            <span>${overview.weekLow52}</span>
          </div>
        </div>
      </div>
    );
  }
  
  if (isNews) {
    const newsData = data as CompanyNews;
    
    return (
      <div className="flex flex-col gap-4 rounded-2xl p-4 bg-zinc-900 text-white max-w-[500px] border border-zinc-800">
        <div className="flex justify-between items-baseline">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-semibold">{newsData.symbol}</span>
            <span className="text-zinc-400 text-sm">Recent News</span>
          </div>
        </div>
        
        <div className="flex flex-col gap-3">
          {newsData.news.map((item, index) => (
            <div key={index} className="border-t border-zinc-800 pt-2">
              <div className="text-sm font-medium">{item.title}</div>
              <div className="text-xs text-zinc-400 mt-1 flex justify-between">
                <span>{item.source}</span>
                <span>{formatDate(item.timePublished)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  // Fallback for loading state
  return (
    <div className="flex flex-col gap-4 rounded-2xl p-4 skeleton-bg max-w-[500px]">
      <div className="skeleton-div h-6 w-24 rounded"></div>
      <div className="skeleton-div h-8 w-32 rounded"></div>
      <div className="skeleton-div h-4 w-full rounded"></div>
      <div className="skeleton-div h-4 w-3/4 rounded"></div>
    </div>
  );
}