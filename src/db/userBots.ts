import { db } from './index.ts';
import { userBots } from './schema.ts';
import { eq, and } from 'drizzle-orm';

export interface UserBotRecord {
  id: string;
  userId: string;
  name: string;
  exchange: string;
  strategy: string;
  pair: string;
  capital: number;
  maxDrawdown: number;
  status: 'RUNNING' | 'PAUSED' | 'STOPPED';
  createdAt: string | null;
  updatedAt: string | null;
}

export async function getUserBots(userId: string): Promise<UserBotRecord[]> {
  try {
    const list = await db.select().from(userBots).where(eq(userBots.userId, userId));
    return list.map(b => ({
      id: b.id,
      userId: b.userId,
      name: b.name,
      exchange: b.exchange,
      strategy: b.strategy,
      pair: b.pair,
      capital: b.capital,
      maxDrawdown: b.maxDrawdown,
      status: b.status as 'RUNNING' | 'PAUSED' | 'STOPPED',
      createdAt: b.createdAt ? b.createdAt.toISOString() : null,
      updatedAt: b.updatedAt ? b.updatedAt.toISOString() : null,
    }));
  } catch (error) {
    console.error('Database query failed in getUserBots:', error);
    throw new Error('Failed to fetch user bots.', { cause: error });
  }
}

export async function upsertUserBot(
  userId: string,
  botData: {
    id: string;
    name: string;
    exchange: string;
    strategy: string;
    pair: string;
    capital: number; // Strictly locked to exchange balance
    maxDrawdown?: number;
    status?: 'RUNNING' | 'PAUSED' | 'STOPPED';
  }
): Promise<UserBotRecord> {
  try {
    const existing = await db.select().from(userBots)
      .where(and(eq(userBots.userId, userId), eq(userBots.id, botData.id)))
      .limit(1);

    let saved;
    if (existing.length > 0) {
      const updated = await db.update(userBots)
        .set({
          name: botData.name,
          exchange: botData.exchange,
          strategy: botData.strategy,
          pair: botData.pair,
          capital: botData.capital,
          maxDrawdown: botData.maxDrawdown ?? 5.0,
          status: botData.status ?? 'RUNNING',
          updatedAt: new Date(),
        })
        .where(eq(userBots.id, botData.id))
        .returning();
      saved = updated[0];
    } else {
      const inserted = await db.insert(userBots)
        .values({
          id: botData.id,
          userId,
          name: botData.name,
          exchange: botData.exchange,
          strategy: botData.strategy,
          pair: botData.pair,
          capital: botData.capital,
          maxDrawdown: botData.maxDrawdown ?? 5.0,
          status: botData.status ?? 'RUNNING',
        })
        .returning();
      saved = inserted[0];
    }

    return {
      id: saved.id,
      userId: saved.userId,
      name: saved.name,
      exchange: saved.exchange,
      strategy: saved.strategy,
      pair: saved.pair,
      capital: saved.capital,
      maxDrawdown: saved.maxDrawdown,
      status: saved.status as 'RUNNING' | 'PAUSED' | 'STOPPED',
      createdAt: saved.createdAt ? saved.createdAt.toISOString() : null,
      updatedAt: saved.updatedAt ? saved.updatedAt.toISOString() : null,
    };
  } catch (error) {
    console.error('Database query failed in upsertUserBot:', error);
    throw new Error('Failed to save user bot.', { cause: error });
  }
}

export async function setBotStatus(
  userId: string,
  botId: string,
  status: 'RUNNING' | 'PAUSED' | 'STOPPED'
): Promise<UserBotRecord | null> {
  try {
    const updated = await db.update(userBots)
      .set({ status, updatedAt: new Date() })
      .where(and(eq(userBots.userId, userId), eq(userBots.id, botId)))
      .returning();

    if (updated.length === 0) return null;
    const saved = updated[0];
    return {
      id: saved.id,
      userId: saved.userId,
      name: saved.name,
      exchange: saved.exchange,
      strategy: saved.strategy,
      pair: saved.pair,
      capital: saved.capital,
      maxDrawdown: saved.maxDrawdown,
      status: saved.status as 'RUNNING' | 'PAUSED' | 'STOPPED',
      createdAt: saved.createdAt ? saved.createdAt.toISOString() : null,
      updatedAt: saved.updatedAt ? saved.updatedAt.toISOString() : null,
    };
  } catch (error) {
    console.error('Database query failed in setBotStatus:', error);
    throw new Error('Failed to update bot status.', { cause: error });
  }
}
