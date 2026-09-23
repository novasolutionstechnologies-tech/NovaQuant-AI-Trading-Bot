import { pgTable, text, timestamp, boolean, integer, doublePrecision, serial } from 'drizzle-orm/pg-core';

// Users table (keyed by Firebase Auth UID)
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  email: text('email').notNull(),
  displayName: text('display_name'),
  photoUrl: text('photo_url'),
  createdAt: timestamp('created_at').defaultNow(),
});

// User exchange connections with encrypted credentials
export const exchangeConnections = pgTable('exchange_connections', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull(),
  exchange: text('exchange').notNull(), // 'Binance' | 'Bybit' | 'Bitget'
  encryptedApiKey: text('encrypted_api_key').notNull(),
  encryptedSecretKey: text('encrypted_secret_key').notNull(),
  encryptedPassphrase: text('encrypted_passphrase'),
  apiKeyMasked: text('api_key_masked').notNull(),
  status: text('status').notNull().default('DISCONNECTED'), // 'CONNECTED' | 'DISCONNECTED'
  permissions: text('permissions').default('{"read":true,"spotTrading":true,"futuresTrading":true,"withdrawals":false}'),
  pingMs: integer('ping_ms').default(25),
  trustedIpsOnly: boolean('trusted_ips_only').default(true),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// User trading bots (where bot capital strictly equals exchange balance)
export const userBots = pgTable('user_bots', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  name: text('name').notNull(),
  exchange: text('exchange').notNull(),
  strategy: text('strategy').notNull(),
  pair: text('pair').notNull(),
  capital: doublePrecision('capital').notNull(), // Locked equal to real exchange available balance
  maxDrawdown: doublePrecision('max_drawdown').notNull().default(5.0),
  status: text('status').notNull().default('STOPPED'), // 'RUNNING' | 'PAUSED' | 'STOPPED'
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Production Trades
export const trades = pgTable('trades', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  botId: text('bot_id'),
  symbol: text('symbol').notNull(),
  direction: text('direction').notNull(), // 'LONG' | 'SHORT'
  entryPrice: doublePrecision('entry_price').notNull(),
  exitPrice: doublePrecision('exit_price'),
  positionSize: doublePrecision('position_size').notNull(),
  pnl: doublePrecision('pnl').default(0.0),
  pnlPercentage: doublePrecision('pnl_percentage').default(0.0),
  status: text('status').notNull().default('ACTIVE'), // 'ACTIVE' | 'CLOSED' | 'CANCELLED'
  result: text('result'), // 'WIN' | 'LOSS'
  openedAt: timestamp('opened_at').defaultNow(),
  closedAt: timestamp('closed_at'),
  exchange: text('exchange').notNull(),
  exitReason: text('exit_reason'),
  mode: text('mode').default('LIVE'),
  feedbackInsight: text('feedback_insight'),
});

// Audit and execution logs
export const auditLogs = pgTable('audit_logs', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull(),
  action: text('action').notNull(),
  details: text('details').notNull(),
  timestamp: timestamp('timestamp').defaultNow(),
});
