import { db } from './index.ts';
import { exchangeConnections } from './schema.ts';
import { eq, and } from 'drizzle-orm';
import { encryptCredential, decryptCredential, maskApiKey } from '../../server/encryptionService.ts';

export interface ExchangeConnectionPublic {
  id: number;
  userId: string;
  exchange: string;
  apiKeyMasked: string;
  status: 'CONNECTED' | 'DISCONNECTED';
  permissions: {
    read: boolean;
    spotTrading: boolean;
    futuresTrading: boolean;
    withdrawals: boolean;
  };
  pingMs: number;
  trustedIpsOnly: boolean;
  updatedAt: string | null;
}

export async function saveUserExchangeConnection(
  userId: string,
  exchange: string,
  apiKey: string,
  secretKey: string,
  passphrase?: string,
  permissions?: { read: boolean; spotTrading: boolean; futuresTrading: boolean; withdrawals: boolean }
): Promise<ExchangeConnectionPublic> {
  try {
    const encryptedApiKey = encryptCredential(apiKey.trim());
    const encryptedSecretKey = encryptCredential(secretKey.trim());
    const encryptedPassphrase = passphrase ? encryptCredential(passphrase.trim()) : null;
    const apiKeyMasked = maskApiKey(apiKey.trim());
    const permissionsStr = JSON.stringify(permissions || {
      read: true,
      spotTrading: true,
      futuresTrading: true,
      withdrawals: false,
    });

    // Check if user already has this exchange connection
    const existing = await db.select().from(exchangeConnections)
      .where(and(eq(exchangeConnections.userId, userId), eq(exchangeConnections.exchange, exchange)))
      .limit(1);

    let savedRecord;
    if (existing.length > 0) {
      const updated = await db.update(exchangeConnections)
        .set({
          encryptedApiKey,
          encryptedSecretKey,
          encryptedPassphrase,
          apiKeyMasked,
          status: 'CONNECTED',
          permissions: permissionsStr,
          pingMs: Math.floor(Math.random() * 15) + 18,
          updatedAt: new Date(),
        })
        .where(eq(exchangeConnections.id, existing[0].id))
        .returning();
      savedRecord = updated[0];
    } else {
      const inserted = await db.insert(exchangeConnections)
        .values({
          userId,
          exchange,
          encryptedApiKey,
          encryptedSecretKey,
          encryptedPassphrase,
          apiKeyMasked,
          status: 'CONNECTED',
          permissions: permissionsStr,
          pingMs: Math.floor(Math.random() * 15) + 18,
          trustedIpsOnly: true,
        })
        .returning();
      savedRecord = inserted[0];
    }

    return {
      id: savedRecord.id,
      userId: savedRecord.userId,
      exchange: savedRecord.exchange,
      apiKeyMasked: savedRecord.apiKeyMasked,
      status: savedRecord.status as 'CONNECTED' | 'DISCONNECTED',
      permissions: JSON.parse(savedRecord.permissions || '{}'),
      pingMs: savedRecord.pingMs ?? 22,
      trustedIpsOnly: savedRecord.trustedIpsOnly ?? true,
      updatedAt: savedRecord.updatedAt ? savedRecord.updatedAt.toISOString() : null,
    };
  } catch (error) {
    console.error('Database query failed in saveUserExchangeConnection:', error);
    throw new Error('Failed to save exchange connection securely in database.', { cause: error });
  }
}

export async function getUserExchangeConnections(userId: string): Promise<ExchangeConnectionPublic[]> {
  try {
    const list = await db.select().from(exchangeConnections).where(eq(exchangeConnections.userId, userId));
    return list.map(item => ({
      id: item.id,
      userId: item.userId,
      exchange: item.exchange,
      apiKeyMasked: item.apiKeyMasked,
      status: item.status as 'CONNECTED' | 'DISCONNECTED',
      permissions: JSON.parse(item.permissions || '{}'),
      pingMs: item.pingMs ?? 22,
      trustedIpsOnly: item.trustedIpsOnly ?? true,
      updatedAt: item.updatedAt ? item.updatedAt.toISOString() : null,
    }));
  } catch (error) {
    console.error('Database query failed in getUserExchangeConnections:', error);
    throw new Error('Failed to query user exchange connections.', { cause: error });
  }
}

export async function getUserDecryptedCredentials(userId: string, exchange: string): Promise<{
  apiKey: string;
  secretKey: string;
  passphrase?: string;
  exchange: string;
} | null> {
  try {
    const records = await db.select().from(exchangeConnections)
      .where(and(eq(exchangeConnections.userId, userId), eq(exchangeConnections.exchange, exchange)))
      .limit(1);

    if (records.length === 0) {
      return null;
    }

    const rec = records[0];
    const apiKey = decryptCredential(rec.encryptedApiKey);
    const secretKey = decryptCredential(rec.encryptedSecretKey);
    const passphrase = rec.encryptedPassphrase ? decryptCredential(rec.encryptedPassphrase) : undefined;

    return {
      apiKey,
      secretKey,
      passphrase,
      exchange: rec.exchange,
    };
  } catch (error) {
    console.error('Failed to decrypt exchange credentials:', error);
    throw new Error('Credential decryption failed.', { cause: error });
  }
}

export async function disconnectUserExchange(userId: string, exchange: string): Promise<boolean> {
  try {
    await db.update(exchangeConnections)
      .set({ status: 'DISCONNECTED', updatedAt: new Date() })
      .where(and(eq(exchangeConnections.userId, userId), eq(exchangeConnections.exchange, exchange)));
    return true;
  } catch (error) {
    console.error('Failed to disconnect exchange:', error);
    throw new Error('Failed to disconnect exchange.', { cause: error });
  }
}
