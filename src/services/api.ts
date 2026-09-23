import {
  MarketData,
  Candle,
  TechnicalAnalysisResult,
  AIConsensusResult,
  RiskCheckResult,
  ActiveTrade,
  ClosedTrade,
  AnalyticsPerformance,
  RiskSettings,
  TradeDirection,
  AIEngineDecision,
  UserProfile,
  ConnectionTestResult
} from '../types';

// Remote backend URL routing (supports standalone Cloud Run, custom server, or local AI Studio dev)
let customBackendUrl: string = '';

export function getApiBaseUrl(): string {
  if (customBackendUrl) return customBackendUrl.replace(/\/+$/, '');
  try {
    const saved = localStorage.getItem('novaquant_backend_url');
    if (saved && saved.trim()) {
      return saved.trim().replace(/\/+$/, '');
    }
  } catch {
    // ignore
  }
  const envUrl = (import.meta as any).env?.VITE_BACKEND_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim()) {
    return envUrl.trim().replace(/\/+$/, '');
  }
  return '';
}

export function setApiBaseUrl(url: string | null) {
  const sanitized = url ? url.trim().replace(/\/+$/, '') : '';
  customBackendUrl = sanitized;
  try {
    if (sanitized) {
      localStorage.setItem('novaquant_backend_url', sanitized);
    } else {
      localStorage.removeItem('novaquant_backend_url');
    }
    window.dispatchEvent(new CustomEvent('novaquant:backend_changed', { detail: { url: sanitized } }));
  } catch {
    // ignore
  }
}

export function apiUrl(path: string): string {
  const base = getApiBaseUrl();
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return base ? `${base}${cleanPath}` : cleanPath;
}

const nativeFetch = typeof window !== 'undefined' ? window.fetch.bind(window) : globalThis.fetch;

// Scoped fetch that automatically prepends getApiBaseUrl() for relative /api/ calls
const fetch = (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  if (typeof input === 'string' && input.startsWith('/api/')) {
    return nativeFetch(apiUrl(input), init);
  }
  return nativeFetch(input, init);
};

let currentAuthToken: string | null = null;
let currentUserId: string = 'usr_novaquant';

export function setAuthSession(token: string | null, userId?: string) {
  currentAuthToken = token;
  if (userId) currentUserId = userId;
  try {
    if (userId) localStorage.setItem('novaquant_active_user_id', userId);
    if (token) localStorage.setItem('novaquant_auth_token', token);
  } catch {
    // ignore
  }
}

export function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {};
  try {
    if (!currentAuthToken) {
      currentAuthToken = localStorage.getItem('novaquant_auth_token');
    }
    if (!currentUserId) {
      currentUserId = localStorage.getItem('novaquant_active_user_id') || 'usr_novaquant';
    }
  } catch {
    // ignore
  }
  if (currentAuthToken) {
    headers['Authorization'] = `Bearer ${currentAuthToken}`;
  }
  if (currentUserId) {
    headers['x-user-id'] = currentUserId;
  }
  return headers;
}

export async function fetchCurrentUser(): Promise<{
  user: UserProfile;
  token: string;
  availableUsers: UserProfile[];
}> {
  const res = await fetch('/api/auth/me', {
    headers: { ...getAuthHeaders() },
  });
  if (!res.ok) throw new Error('Failed to fetch user profile');
  const data = await res.json();
  if (data.token) {
    setAuthSession(data.token, data.user?.id);
  }
  return data;
}

export async function switchUser(userId: string): Promise<{
  success: boolean;
  user: UserProfile;
  token: string;
  message: string;
}> {
  const res = await fetch('/api/auth/switch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify({ userId }),
  });
  if (!res.ok) throw new Error('Failed to switch user');
  const data = await res.json();
  setAuthSession(data.token, data.user?.id);
  return data;
}

export function clearAuthSession() {
  currentAuthToken = null;
  currentUserId = '';
  try {
    localStorage.removeItem('novaquant_auth_token');
    localStorage.removeItem('novaquant_active_user_id');
  } catch {
    // ignore
  }
}

export async function loginWithGoogleApi(userData: {
  uid: string;
  email: string;
  displayName?: string;
  photoUrl?: string;
}): Promise<{ success: boolean; user: UserProfile; token: string; message: string }> {
  const res = await fetch('/api/auth/google', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify(userData),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to authenticate with Google');
  }
  const data = await res.json();
  setAuthSession(data.token, data.user?.id);
  return data;
}

export async function loginWithEmailApi(userData: {
  email: string;
  password?: string;
  name?: string;
  uid?: string;
}): Promise<{ success: boolean; user: UserProfile; token: string; message: string }> {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify(userData),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to log in');
  }
  const data = await res.json();
  setAuthSession(data.token, data.user?.id);
  return data;
}

export async function registerWithEmailApi(userData: {
  email: string;
  password?: string;
  name?: string;
  uid?: string;
}): Promise<{ success: boolean; user: UserProfile; token: string; message: string }> {
  const res = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify(userData),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to register account');
  }
  const data = await res.json();
  setAuthSession(data.token, data.user?.id);
  return data;
}

export async function fetchMarketData(symbol: string): Promise<MarketData> {
  const res = await fetch(`/api/market-data/${encodeURIComponent(symbol)}`);
  if (!res.ok) throw new Error('Failed to fetch market data');
  return res.json();
}

export async function fetchCandles(symbol: string): Promise<Candle[]> {
  const res = await fetch(`/api/candles/${encodeURIComponent(symbol)}`);
  if (!res.ok) throw new Error('Failed to fetch candles');
  return res.json();
}

export async function fetchTechnicalAnalysis(symbol: string): Promise<TechnicalAnalysisResult> {
  const res = await fetch(`/api/analysis/${encodeURIComponent(symbol)}`);
  if (!res.ok) throw new Error('Failed to fetch analysis');
  return res.json();
}

export async function runAIAnalysis(symbol: string): Promise<{
  symbol: string;
  technical: TechnicalAnalysisResult;
  openai: AIEngineDecision;
  gemini: AIEngineDecision;
}> {
  const res = await fetch('/api/ai/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ symbol }),
  });
  if (!res.ok) throw new Error('Failed to run AI analysis');
  return res.json();
}

export async function evaluateConsensus(payload: {
  openai_decision: TradeDirection;
  gemini_decision: TradeDirection;
  technical_decision: TradeDirection;
  openai_confidence?: number;
  gemini_confidence?: number;
  technical_confidence?: number;
}): Promise<AIConsensusResult> {
  const res = await fetch('/api/consensus', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to evaluate consensus');
  return res.json();
}

export async function checkRisk(payload: {
  symbol: string;
  direction: TradeDirection;
  entryPrice?: number;
  customStopLoss?: number;
  customTakeProfit?: number;
}): Promise<RiskCheckResult> {
  const res = await fetch('/api/risk/check', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to check risk');
  return res.json();
}

export async function openTrade(payload: {
  symbol: string;
  direction: TradeDirection;
  position_size: number;
  stop_loss: number;
  take_profit: number;
  exchange?: string;
  consensusScore?: number;
}): Promise<{ success: boolean; trade: ActiveTrade }> {
  const res = await fetch('/api/trades/open', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to open trade');
  }
  return res.json();
}

export interface BotSyncResponse {
  activeTrades: ActiveTrade[];
  tradeHistory: ClosedTrade[];
  analytics: AnalyticsPerformance;
  botStatus: import('../types').BotStatus;
  prices: Record<string, number>;
  marketData: MarketData;
  timestamp: number;
}

export async function syncBotState(symbol: string): Promise<BotSyncResponse> {
  const res = await fetch(`/api/bot/sync?symbol=${encodeURIComponent(symbol)}`);
  if (!res.ok) throw new Error('Failed to sync bot state');
  return res.json();
}

export async function fetchActiveTrades(): Promise<ActiveTrade[]> {
  const res = await fetch('/api/trades/active');
  if (!res.ok) throw new Error('Failed to fetch active trades');
  return res.json();
}

export async function fetchTradeHistory(): Promise<ClosedTrade[]> {
  const res = await fetch('/api/trades/history');
  if (!res.ok) throw new Error('Failed to fetch trade history');
  return res.json();
}

export async function closeActiveTrade(tradeId: string): Promise<{ success: boolean; trade: ClosedTrade }> {
  const res = await fetch(`/api/trades/${tradeId}/close`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to close trade');
  return res.json();
}

export async function fetchAnalytics(): Promise<AnalyticsPerformance> {
  const res = await fetch('/api/analytics/performance');
  if (!res.ok) throw new Error('Failed to fetch analytics');
  return res.json();
}

export async function fetchRiskSettings(): Promise<{ settings: RiskSettings; tradingMode: 'DEMO' | 'LIVE' }> {
  const res = await fetch('/api/settings/risk');
  if (!res.ok) throw new Error('Failed to fetch settings');
  return res.json();
}

export async function saveRiskSettings(payload: {
  settings: Partial<RiskSettings>;
  tradingMode?: 'DEMO' | 'LIVE';
}): Promise<any> {
  const res = await fetch('/api/settings/risk', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to save settings');
  return res.json();
}

export async function fetchBotStatus(): Promise<{ status: import('../types').BotStatus; timestamp: number }> {
  const res = await fetch('/api/bot/status');
  if (!res.ok) throw new Error('Failed to fetch bot status');
  return res.json();
}

export async function updateBotStatus(
  status: import('../types').BotStatus,
  action?: 'START' | 'STOP' | 'PAUSE' | 'RESUME'
): Promise<{ status: import('../types').BotStatus; message: string }> {
  const resolvedAction =
    action ||
    (status === 'RUNNING' ? 'START' : status === 'PAUSED' ? 'PAUSE' : 'STOP');

  const requestPayload = { status, action: resolvedAction };

  // 1. Primary Attempt: Standard POST /api/bot/status
  try {
    const res = await fetch('/api/bot/status', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(requestPayload),
    });

    if (res.ok) {
      const data = await res.json();
      return data;
    }

    // Try parsing server response
    let serverErrText = '';
    try {
      const errJson = await res.json();
      serverErrText = errJson.error || errJson.message;
    } catch {
      serverErrText = await res.text().catch(() => '');
    }
    console.warn(`[API] /api/bot/status returned ${res.status}:`, serverErrText);
  } catch (initialErr) {
    console.warn('[API] Initial fetch to /api/bot/status failed with network error:', initialErr);
  }

  // 2. Secondary Attempt: Direct dedicated route (/api/bot/stop, /api/bot/start, /api/bot/pause, /api/bot/resume)
  const endpointMap: Record<string, string> = {
    RUNNING: resolvedAction === 'RESUME' ? '/api/bot/resume' : '/api/bot/start',
    STOPPED: '/api/bot/stop',
    PAUSED: '/api/bot/pause',
  };
  const fallbackEndpoint = endpointMap[status] || '/api/bot/status';

  try {
    const fallbackRes = await fetch(fallbackEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(requestPayload),
    });

    if (fallbackRes.ok) {
      const data = await fallbackRes.json();
      return data;
    }

    let fallbackErrMsg = '';
    try {
      const errJson = await fallbackRes.json();
      fallbackErrMsg = errJson.error || errJson.message;
    } catch {
      fallbackErrMsg = await fallbackRes.text().catch(() => '');
    }

    throw new Error(fallbackErrMsg || `Failed to update bot status (HTTP ${fallbackRes.status})`);
  } catch (fallbackErr: any) {
    console.error(`[API ERROR] All bot status endpoints failed for target status "${status}":`, fallbackErr);
    throw new Error(fallbackErr?.message || 'Failed to update bot status');
  }
}

export async function fetchExchangeConnections(): Promise<import('../types').ExchangeConnectionsResponse> {
  const res = await fetch('/api/exchanges/connections', {
    headers: { ...getAuthHeaders() },
  });
  if (!res.ok) throw new Error('Failed to fetch exchange connections');
  return res.json();
}

export async function testExchangeConnection(payload: {
  exchange: import('../types').SupportedExchange;
  apiKey: string;
  secretKey: string;
  passphrase?: string;
}): Promise<ConnectionTestResult> {
  const res = await fetch('/api/exchanges/test-connection', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Connection test failed');
  }
  return data;
}

export async function connectExchange(payload: {
  exchange: import('../types').SupportedExchange;
  apiKey: string;
  secretKey: string;
  passphrase?: string;
  trustIPsOnly?: boolean;
  selectedMode?: 'SPOT' | 'FUTURES';
}): Promise<{
  success: boolean;
  message: string;
  exchange: string;
  status: string;
  pingMs: number;
  permissions?: { read: boolean; trade: boolean; withdrawal: boolean };
  balance?: import('../types').ExchangeAccountBalance;
  botCapital?: number;
}> {
  const res = await fetch('/api/exchanges/connect', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to connect exchange API');
  }
  return res.json();
}

export async function disconnectExchange(exchange: import('../types').SupportedExchange): Promise<{ success: boolean; message: string }> {
  const res = await fetch('/api/exchanges/disconnect', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify({ exchange }),
  });
  if (!res.ok) throw new Error('Failed to disconnect exchange');
  return res.json();
}

export async function fetchExchangeBalances(): Promise<import('../types').AllExchangeBalancesResponse> {
  const fallbackBalances: import('../types').AllExchangeBalancesResponse = {
    activeExchange: null,
    activeTradingMarket: 'SPOT',
    totalBotCapital: 0,
    balances: {
      Binance: { exchange: 'Binance', connected: false, lastSyncedAt: 0, spot: { capital: 0, botCapital: 0, available: 0, lockedInOrders: 0, currency: 'USDT' }, futures: { capital: 0, botCapital: 0, available: 0, lockedInOrders: 0, marginUsed: 0, unrealizedPnl: 0, currency: 'USDT' }, selectedMode: 'SPOT', activeBotCapital: 0 },
      Bybit: { exchange: 'Bybit', connected: false, lastSyncedAt: 0, spot: { capital: 0, botCapital: 0, available: 0, lockedInOrders: 0, currency: 'USDT' }, futures: { capital: 0, botCapital: 0, available: 0, lockedInOrders: 0, marginUsed: 0, unrealizedPnl: 0, currency: 'USDT' }, selectedMode: 'SPOT', activeBotCapital: 0 },
      Bitget: { exchange: 'Bitget', connected: false, lastSyncedAt: 0, spot: { capital: 0, botCapital: 0, available: 0, lockedInOrders: 0, currency: 'USDT' }, futures: { capital: 0, botCapital: 0, available: 0, lockedInOrders: 0, marginUsed: 0, unrealizedPnl: 0, currency: 'USDT' }, selectedMode: 'SPOT', activeBotCapital: 0 },
    },
    syncedAt: Date.now(),
  };

  try {
    const res = await fetch('/api/exchanges/balances', {
      headers: { ...getAuthHeaders() },
    });
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // Retry once after 600ms if server is warming up or temporarily restarting
    try {
      await new Promise((resolve) => setTimeout(resolve, 600));
      const retryRes = await fetch('/api/exchanges/balances', {
        headers: { ...getAuthHeaders() },
      });
      if (retryRes.ok) {
        return await retryRes.json();
      }
    } catch {
      // Return safe fallback on failure
      return fallbackBalances;
    }
  }
  return fallbackBalances;
}

export async function refreshExchangeBalances(exchange?: import('../types').SupportedExchange): Promise<{
  success: boolean;
  message: string;
  balance?: import('../types').ExchangeAccountBalance;
  balances?: Record<import('../types').SupportedExchange, import('../types').ExchangeAccountBalance>;
  activeBotCapital?: number;
}> {
  const res = await fetch('/api/exchanges/balances/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify({ exchange }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to refresh exchange balances');
  }
  return res.json();
}

export async function selectExchangeTradingMarket(
  exchange: import('../types').SupportedExchange,
  market: 'SPOT' | 'FUTURES'
): Promise<{ success: boolean; activeTradingMarket: 'SPOT' | 'FUTURES'; balance: import('../types').ExchangeAccountBalance }> {
  const res = await fetch('/api/exchanges/balances/select-market', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify({ exchange, market }),
  });
  if (!res.ok) throw new Error('Failed to select trading market');
  return res.json();
}


// ---------------------------------------------------------------------------------
// CAPITAL MANAGER CLIENT API
// ---------------------------------------------------------------------------------

const DEFAULT_CAPITAL_FALLBACK: import('../types').CapitalOverviewResponse = {
  totalConnectedCapital: 0,
  totalAvailableTradingCapital: 0,
  activeStrategyExchange: 'Binance',
  exchanges: {
    Binance: {
      exchange: 'Binance',
      connected: false,
      exchangeBalance: 0,
      availableBalance: 0,
      allocatedCapital: 0,
      usedCapital: 0,
      availableTradingCapital: 0,
      unrealizedPnL: 0,
      realizedPnL: 0,
      lastSyncTime: 0,
      capitalMode: 'AUTO_SYNC',
      configuredAllocation: 0,
      syncStatus: 'PENDING',
      syncError: null,
      isLiveTradingEnabled: false,
      permissions: { read: true, spotTrading: true, futuresTrading: true, withdrawals: false },
    },
    Bybit: {
      exchange: 'Bybit',
      connected: false,
      exchangeBalance: 0,
      availableBalance: 0,
      allocatedCapital: 0,
      usedCapital: 0,
      availableTradingCapital: 0,
      unrealizedPnL: 0,
      realizedPnL: 0,
      lastSyncTime: 0,
      capitalMode: 'AUTO_SYNC',
      configuredAllocation: 0,
      syncStatus: 'PENDING',
      syncError: null,
      isLiveTradingEnabled: false,
      permissions: { read: true, spotTrading: true, futuresTrading: true, withdrawals: false },
    },
    Bitget: {
      exchange: 'Bitget',
      connected: false,
      exchangeBalance: 0,
      availableBalance: 0,
      allocatedCapital: 0,
      usedCapital: 0,
      availableTradingCapital: 0,
      unrealizedPnL: 0,
      realizedPnL: 0,
      lastSyncTime: 0,
      capitalMode: 'AUTO_SYNC',
      configuredAllocation: 0,
      syncStatus: 'PENDING',
      syncError: null,
      isLiveTradingEnabled: false,
      permissions: { read: true, spotTrading: true, futuresTrading: true, withdrawals: false },
    },
  },
  liveReadiness: {
    isReady: false,
    checks: {
      exchangeConnected: false,
      balanceSuccessfullySynced: false,
      tradingPermissionEnabled: true,
      riskLimitsConfigured: true,
      userExplicitlyEnabledLiveTrading: false,
    },
    missingRequirements: ['Connect exchange API credentials to enable live balance.'],
  },
  syncedAt: Date.now(),
};

export async function fetchCapitalOverview(): Promise<import('../types').CapitalOverviewResponse> {
  const maxRetries = 3;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const res = await fetch('/api/capital/overview', {
        headers: { ...getAuthHeaders() },
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Allow retry on transient network glitch or cold start
    }
    if (attempt < maxRetries - 1) {
      await new Promise((resolve) => setTimeout(resolve, 400 * (attempt + 1)));
    }
  }
  return DEFAULT_CAPITAL_FALLBACK;
}

export async function syncCapital(exchange?: import('../types').SupportedExchange): Promise<import('../types').CapitalOverviewResponse> {
  const res = await fetch('/api/capital/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify({ exchange }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to sync exchange capital');
  }
  return res.json();
}

export async function updateCapitalMode(payload: {
  exchange?: import('../types').SupportedExchange;
  capitalMode: import('../types').CapitalMode;
  configuredAllocation?: number;
}): Promise<import('../types').CapitalOverviewResponse> {
  const res = await fetch('/api/capital/mode', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to update capital mode');
  }
  return res.json();
}

export async function selectStrategyExchange(
  exchange: import('../types').SupportedExchange
): Promise<import('../types').CapitalOverviewResponse> {
  const res = await fetch('/api/capital/select-exchange', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify({ exchange }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to select strategy exchange');
  }
  return res.json();
}

export async function setLiveTradingStatus(payload: {
  exchange: import('../types').SupportedExchange;
  enabled: boolean;
}): Promise<import('../types').CapitalOverviewResponse> {
  const res = await fetch('/api/capital/live-trading', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to set live trading status');
  }
  return res.json();
}

// ---------------------------------------------------------------------------------
// ORDER VALIDATION & STOP-LOSS PROTECTION APIS
// ---------------------------------------------------------------------------------

export async function validateOrderApi(orderParams: {
  symbol: string;
  direction: import('../types').TradeDirection;
  position_size?: number;
  stop_loss?: number;
  take_profit?: number;
  exchange?: string;
}): Promise<import('../types').OrderValidationResponse> {
  const res = await fetch('/api/orders/validate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify(orderParams),
  });
  const data = await res.json();
  if (!res.ok && !data.checks) {
    throw new Error(data.error || 'Order validation failed');
  }
  return data;
}

export async function updateTradeSlTpApi(
  tradeId: string,
  payload: { stop_loss: number; take_profit: number }
): Promise<{ success: boolean; trade: import('../types').ActiveTrade; message: string }> {
  const res = await fetch(`/api/trades/${tradeId}/update-sl-tp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to update Stop-Loss / Take-Profit');
  }
  return res.json();
}

export async function triggerEmergencyStopApi(closeAllPositions: boolean = false): Promise<{
  success: boolean;
  message: string;
  status: import('../types').BotStatus;
  closedTradesCount: number;
}> {
  const res = await fetch('/api/trades/emergency-stop', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify({ closeAllPositions }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to trigger emergency stop');
  }
  return res.json();
}

export async function resetEmergencyStopApi(): Promise<{
  success: boolean;
  message: string;
  status: import('../types').BotStatus;
}> {
  const res = await fetch('/api/trades/reset-emergency-stop', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to reset emergency stop');
  }
  return res.json();
}

// ---------------------------------------------------------------------------------
// TRANSACTION & AUDIT LOGS APIS
// ---------------------------------------------------------------------------------

export async function fetchAuditLogsApi(params?: {
  limit?: number;
  event?: string;
  search?: string;
}): Promise<{ logs: import('../types').AuditLogEntry[]; total: number }> {
  const query = new URLSearchParams();
  if (params?.limit) query.set('limit', String(params.limit));
  if (params?.event) query.set('event', params.event);
  if (params?.search) query.set('search', params.search);

  const res = await fetch(`/api/audit-logs?${query.toString()}`, {
    headers: { ...getAuthHeaders() },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to fetch audit logs');
  }
  return res.json();
}

export async function clearAuditLogsApi(): Promise<{ success: boolean; message: string }> {
  const res = await fetch('/api/audit-logs/clear', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to clear audit logs');
  }
  return res.json();
}

export interface OutboundIpInfo {
  outboundIp: string;
  configuredStaticIp: string | null;
  isStaticMatch: boolean;
  environment: 'cloud-run' | 'ai-studio-dev';
  isCloudRun: boolean;
  cloudRunService: string | null;
  cloudRunRevision: string | null;
  allTrustedIps: string[];
  exchanges: {
    binance: { reachable: boolean; status: number; latencyMs: number; name: string; error?: string };
    bybit: { reachable: boolean; status: number; latencyMs: number; name: string; error?: string };
    bitget: { reachable: boolean; status: number; latencyMs: number; name: string; error?: string };
  };
  whitelistingGuides: {
    binance: { exchange: string; step1: string; step2: string; step3: string; step4: string; step5: string; step6: string };
    bybit: { exchange: string; step1: string; step2: string; step3: string; step4: string; step5: string; step6: string };
    bitget: { exchange: string; step1: string; step2: string; step3: string; step4: string; step5: string; step6: string };
  };
  timestamp: number;
}

export async function fetchOutboundIpInfo(forceRefresh = false): Promise<OutboundIpInfo> {
  const res = await fetch(`/api/system/outbound-ip?refresh=${forceRefresh ? 'true' : 'false'}`, {
    headers: { ...getAuthHeaders() },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to fetch outbound static IP info');
  }
  return res.json();
}

export async function testRemoteBackendConnection(testUrl: string): Promise<{
  success: boolean;
  latencyMs: number;
  outboundIp?: string;
  isCloudRun?: boolean;
  service?: string;
  error?: string;
}> {
  const start = Date.now();
  const sanitized = testUrl.trim().replace(/\/+$/, '');
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    const res = await nativeFetch(`${sanitized}/api/system/cloud-run-config`, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    clearTimeout(timeout);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }
    const data = await res.json();
    const latencyMs = Date.now() - start;

    let outboundIp: string | undefined;
    try {
      const ipRes = await nativeFetch(`${sanitized}/api/system/outbound-ip`);
      if (ipRes.ok) {
        const ipData = await ipRes.json();
        outboundIp = ipData.outboundIp;
      }
    } catch {
      // ignore
    }

    return {
      success: true,
      latencyMs,
      outboundIp: outboundIp || data.configuredStaticIp,
      isCloudRun: !!data.isCloudRun,
      service: data.cloudRunService || data.service,
    };
  } catch (err: any) {
    return {
      success: false,
      latencyMs: Date.now() - start,
      error: err.message || 'Connection failed (CORS or network unreachable)',
    };
  }
}





