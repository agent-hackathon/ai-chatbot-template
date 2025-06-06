// Skip server-only for testing if needed
if (process.env.NODE_ENV !== 'test') {
  require('server-only');
}

import { 
  pgTable, 
  varchar, 
  timestamp, 
  uuid, 
  integer, 
  decimal,
  text,
  boolean
} from 'drizzle-orm/pg-core';
import type { InferSelectModel } from 'drizzle-orm';

// Analytics Users table (separate from main app users)
export const analyticsUsers = pgTable('analytics_users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull(),
  firstName: varchar('first_name', { length: 100 }),
  lastName: varchar('last_name', { length: 100 }),
  signupDate: timestamp('signup_date').notNull().defaultNow(),
  lastLoginDate: timestamp('last_login_date'),
  isActive: boolean('is_active').notNull().default(true),
  subscriptionTier: varchar('subscription_tier', { enum: ['free', 'pro', 'enterprise'] }).default('free'),
});

export type AnalyticsUser = InferSelectModel<typeof analyticsUsers>;

// Sales table
export const sales = pgTable('sales', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => analyticsUsers.id),
  productName: varchar('product_name', { length: 255 }).notNull(),
  productCategory: varchar('product_category', { length: 100 }),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).notNull().default('USD'),
  saleDate: timestamp('sale_date').notNull().defaultNow(),
  paymentMethod: varchar('payment_method', { length: 50 }),
  region: varchar('region', { length: 100 }),
  salesRep: varchar('sales_rep', { length: 100 }),
});

export type Sale = InferSelectModel<typeof sales>;

// User Events table (for tracking user interactions)
export const userEvents = pgTable('user_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => analyticsUsers.id),
  eventType: varchar('event_type', { length: 100 }).notNull(),
  eventCategory: varchar('event_category', { length: 100 }),
  eventData: text('event_data'), // JSON data
  timestamp: timestamp('timestamp').notNull().defaultNow(),
  sessionId: varchar('session_id', { length: 100 }),
  userAgent: text('user_agent'),
  ipAddress: varchar('ip_address', { length: 45 }),
  page: varchar('page', { length: 255 }),
});

export type UserEvent = InferSelectModel<typeof userEvents>;

// Product Performance table
export const productPerformance = pgTable('product_performance', {
  id: uuid('id').primaryKey().defaultRandom(),
  productName: varchar('product_name', { length: 255 }).notNull(),
  category: varchar('category', { length: 100 }),
  viewsCount: integer('views_count').notNull().default(0),
  purchasesCount: integer('purchases_count').notNull().default(0),
  totalRevenue: decimal('total_revenue', { precision: 12, scale: 2 }).notNull().default('0'),
  lastUpdated: timestamp('last_updated').notNull().defaultNow(),
  rating: decimal('rating', { precision: 3, scale: 2 }),
  reviewsCount: integer('reviews_count').notNull().default(0),
});

export type ProductPerformance = InferSelectModel<typeof productPerformance>;

// Marketing Campaigns table
export const marketingCampaigns = pgTable('marketing_campaigns', {
  id: uuid('id').primaryKey().defaultRandom(),
  campaignName: varchar('campaign_name', { length: 255 }).notNull(),
  campaignType: varchar('campaign_type', { length: 100 }),
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date'),
  budget: decimal('budget', { precision: 10, scale: 2 }),
  spend: decimal('spend', { precision: 10, scale: 2 }).default('0'),
  impressions: integer('impressions').default(0),
  clicks: integer('clicks').default(0),
  conversions: integer('conversions').default(0),
  revenue: decimal('revenue', { precision: 10, scale: 2 }).default('0'),
  isActive: boolean('is_active').notNull().default(true),
});

export type MarketingCampaign = InferSelectModel<typeof marketingCampaigns>;