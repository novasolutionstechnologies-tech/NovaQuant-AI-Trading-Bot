import { db } from './index.ts';
import { trades, auditLogs } from './schema.ts';
import { eq, and, desc } from 'drizzle-orm';

export interface TradeRecord {
  id: string;
  userId: string;
  botId: string | null;
  symbol: string;
  direction: 'LONG' | 'SHORT';
  entryPrice: number;
  exitPrice: number | null;
  positionSize: number;
  pnl: number | null;
  pnlPercentage: number | null;
  status: 'ACTIVE' | 'CLOSED' | 'CANCELLED';
  result: 'WIN' | 'LOSS' | null;
  openedAt: string | null;
  closedAt: string | null;
  exchange: string;
  exitReason: string | null;
  mode: string;
  feedbackInsight: string | null;
}

export async function getUserTrades(userId: string, limit = 50): Promise<TradeRecord[]> {
  try {
    const list = await db.select().from(trades)
      .where(eq(trades.userId, userId))
      .orderBy(desc(trades.openedAt))
      .limit(limit);

    return list.map(t => ({
      id: t.id,
      userId: t.userId,
      botId: t.botId,
      symbol: t.symbol,
      direction: t.direction as 'LONG' | 'SHORT',
      entryPrice: t.entryPrice,
      exitPrice: t.exitPrice,
      positionSize: t.positionSize,
      pnl: t.pnl,
      pnlPercentage: t.pnlPercentage,
      status: t.status as 'ACTIVE' | 'CLOSED' | 'CANCELLED',
      result: t.result as 'WIN' | 'LOSS' | null,
      openedAt: t.openedAt ? t.openedAt.toISOString() : null,
      closedAt: t.closedAt ? t.closedAt.toISOString() : null,
      exchange: t.exchange,
      exitReason: t.exitReason,
      mode: t.mode || 'LIVE',
      feedbackInsight: t.feedbackInsight,
    }));
  } catch (error) {
    console.error('Database query failed in getUserTrades:', error);
    throw new Error('Failed to fetch user trades.', { cause: error });
  }
}

export async function recordTrade(userId: string, data: {
  id: string;
  botId?: string;
  symbol: string;
  direction: 'LONG' | 'SHORT';
  entryPrice: number;
  positionSize: number;
  exchange: string;
}): Promise<TradeRecord> {
  try {
    const inserted = await db.insert(trades)
      .values({
        id: data.id,
        userId,
        botId: data.botId || null,
        symbol: data.symbol,
        direction: data.direction,
        entryPrice: data.entryPrice,
        positionSize: data.positionSize,
        status: 'ACTIVE',
        exchange: data.exchange,
        mode: 'LIVE',
      })
      .returning();

    // Log in audit log
    await db.insert(auditLogs).values({
      userId,
      action: 'ORDER_PLACED',
      details: `LIVE ${data.direction} ${data.symbol} on ${data.exchange} at $${data.entryPrice.toLocaleString()}`,
    });

    const t = inserted[0];
    return {
      id: t.id,
      userId: t.userId,
      botId: t.botId,
      symbol: t.symbol,
      direction: t.direction as 'LONG' | 'SHORT',
      entryPrice: t.entryPrice,
      exitPrice: t.exitPrice,
      positionSize: t.positionSize,
      pnl: t.pnl,
      pnlPercentage: t.pnlPercentage,
      status: t.status as 'ACTIVE' | 'CLOSED' | 'CANCELLED',
      result: t.result as 'WIN' | 'LOSS' | null,
      openedAt: t.openedAt ? t.openedAt.toISOString() : null,
      closedAt: t.closedAt ? t.closedAt.toISOString() : null,
      exchange: t.exchange,
      exitReason: t.exitReason,
      mode: t.mode || 'LIVE',
      feedbackInsight: t.feedbackInsight,
    };
  } catch (error) {
    console.error('Database query failed in recordTrade:', error);
    throw new Error('Failed to record trade in database.', { cause: error });
  }
}

export async function closeTrade(userId: string, tradeId: string, exitPrice: number, exitReason: string): Promise<TradeRecord | null> {
  try {
    const existing = await db.select().from(trades)
      .where(and(eq(trades.userId, userId), eq(trades.id, tradeId)))
      .limit(1);

    if (existing.length === 0) return null;
    const t = existing[0];
    const diff = t.direction === 'LONG' ? exitPrice - t.entryPrice : t.entryPrice - exitPrice;
    const pnlPercentage = (diff / t.entryPrice) * 100;
    const pnl = (diff / t.entryPrice) * t.positionSize;
    const result = pnl >= 0 ? 'WIN' : 'LOSS';

    const updated = await db.update(trades)
      .set({
        exitPrice,
        pnl,
        pnlPercentage,
        status: 'CLOSED',
        result,
        exitReason,
        closedAt: new Date(),
      })
      .where(and(eq(trades.userId, userId), eq(trades.id, tradeId)))
      .returning();

    await db.insert(auditLogs).values({
      userId,
      action: 'ORDER_CLOSED',
      details: `LIVE ${t.symbol} closed at $${exitPrice.toLocaleString()} (${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)}, ${pnlPercentage.toFixed(2)}%)`,
    });

    const res = updated[0];
    return {
      id: res.id,
      userId: res.userId,
      botId: res.botId,
      symbol: res.symbol,
      direction: res.direction as 'LONG' | 'SHORT',
      entryPrice: res.entryPrice,
      exitPrice: res.exitPrice,
      positionSize: res.positionSize,
      pnl: res.pnl,
      pnlPercentage: res.pnlPercentage,
      status: res.status as 'ACTIVE' | 'CLOSED' | 'CANCELLED',
      result: res.result as 'WIN' | 'LOSS' | null,
      openedAt: res.openedAt ? res.openedAt.toISOString() : null,
      closedAt: res.closedAt ? res.closedAt.toISOString() : null,
      exchange: res.exchange,
      exitReason: res.exitReason,
      mode: res.mode || 'LIVE',
      feedbackInsight: res.feedbackInsight,
    };
  } catch (error) {
    console.error('Database query failed in closeTrade:', error);
    throw new Error('Failed to close trade in database.', { cause: error });
  }
}
