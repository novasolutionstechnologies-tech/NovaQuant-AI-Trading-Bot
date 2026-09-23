import React, { useState, useEffect } from 'react';
import {
  Wallet,
  RefreshCw,
  ShieldCheck,
  ArrowUpRight,
  Lock,
  Coins,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Layers,
  Activity,
  Zap,
  Sliders,
  Clock,
  ArrowRight
} from 'lucide-react';
import { SupportedExchange, ExchangeAccountBalance, AllExchangeBalancesResponse } from '../types';
import { NavTab } from '../components/Sidebar';
import { fetchExchangeBalances, refreshExchangeBalances, selectExchangeTradingMarket } from '../services/api';

interface AssetsPageProps {
  onNavigate?: (tab: NavTab) => void;
}

const initialBalances: AllExchangeBalancesResponse = {
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

export const AssetsPage: React.FC<AssetsPageProps> = ({ onNavigate }) => {
  const [balanceData, setBalanceData] = useState<AllExchangeBalancesResponse>(initialBalances);
  const [selectedExchange, setSelectedExchange] = useState<SupportedExchange>('Binance');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [actionMessage, setActionMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const loadBalances = async () => {
    try {
      setIsLoading(true);
      const data = await fetchExchangeBalances();
      if (data && data.balances) {
        setBalanceData(data);
        if (data.activeExchange) {
          setSelectedExchange(data.activeExchange);
        }
      }
    } catch {
      // Safe fallback already provided
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBalances();
  }, []);

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      setActionMessage(null);
      const res = await refreshExchangeBalances(selectedExchange);
      if (res.balance) {
        setBalanceData((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            balances: {
              ...prev.balances,
              [selectedExchange]: res.balance!,
            },
            totalBotCapital: res.activeBotCapital ?? prev.totalBotCapital,
            syncedAt: Date.now(),
          };
        });
      } else {
        await loadBalances();
      }
      setActionMessage({ text: `Real balance for ${selectedExchange} synchronized successfully.`, type: 'success' });
    } catch (err: any) {
      setActionMessage({ text: err.message || 'Failed to refresh balance from exchange', type: 'error' });
    } finally {
      setIsRefreshing(false);
      setTimeout(() => setActionMessage(null), 5000);
    }
  };

  const handleSelectMarketMode = async (market: 'SPOT' | 'FUTURES') => {
    try {
      const res = await selectExchangeTradingMarket(selectedExchange, market);
      if (res.success) {
        setBalanceData((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            activeTradingMarket: res.activeTradingMarket,
            balances: {
              ...prev.balances,
              [selectedExchange]: res.balance,
            },
            totalBotCapital: res.balance.activeBotCapital,
          };
        });
        setActionMessage({
          text: `Active Bot Capital updated to ${market} Available Balance (${res.balance.activeBotCapital.toFixed(2)} USDT).`,
          type: 'success',
        });
        setTimeout(() => setActionMessage(null), 4000);
      }
    } catch (err: any) {
      setActionMessage({ text: err.message || 'Failed to switch trading market', type: 'error' });
    }
  };

  const activeBalance = balanceData?.balances?.[selectedExchange];
  const isConnected = activeBalance?.connected ?? false;
  const currentActiveMarket = balanceData?.activeTradingMarket || 'SPOT';

  return (
    <div id="novaquant-assets-page" className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#044a43] pb-5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-[#f3ebd7] flex items-center gap-2.5">
              <Wallet className="w-6 h-6 text-[#bf9b42]" />
              NovaQuant Assets & Real Balance Allocation
            </h1>
            <span
              className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border ${
                isConnected
                  ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40'
                  : 'bg-amber-950/50 text-amber-300 border-amber-500/30'
              }`}
            >
              {isConnected ? 'Real API Synchronized' : 'Awaiting Connection'}
            </span>
          </div>
          <p className="text-xs text-[#a2b5af] mt-1">
            Zero-custody real trading balance synchronization with Binance, Bybit, and Bitget.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            id="refresh-real-balances-btn"
            onClick={handleRefresh}
            disabled={isRefreshing || !isConnected}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-[#f3ebd7] bg-[#022824] hover:bg-[#033631] border border-[#bf9b42]/40 hover:border-[#bf9b42] rounded-lg transition-all shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#bf9b42] ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Querying Exchange API...' : 'Synchronize Balance'}</span>
          </button>

          {onNavigate && (
            <button
              id="navigate-api-connect-btn"
              onClick={() => onNavigate('apiconnect')}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#021f1c] bg-[#bf9b42] hover:bg-[#d4ac4d] rounded-lg transition-all shadow-sm"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Manage API Keys
            </button>
          )}
        </div>
      </div>

      {/* Action Notification */}
      {actionMessage && (
        <div
          className={`p-3.5 rounded-lg border text-xs flex items-center justify-between ${
            actionMessage.type === 'success'
              ? 'bg-emerald-950/50 border-emerald-500/50 text-emerald-200'
              : 'bg-rose-950/50 border-rose-500/50 text-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {actionMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{actionMessage.text}</span>
          </div>
          <button onClick={() => setActionMessage(null)} className="text-gray-400 hover:text-white ml-3">
            ✕
          </button>
        </div>
      )}


      {/* Exchange Switcher Tabs */}
      <div className="flex items-center gap-2 border-b border-[#044a43] pb-3 overflow-x-auto">
        {(['Binance', 'Bybit', 'Bitget'] as SupportedExchange[]).map((ex) => {
          const exBalance = balanceData?.balances?.[ex];
          const exConnected = exBalance?.connected ?? false;
          const isSelected = selectedExchange === ex;

          return (
            <button
              key={ex}
              id={`tab-exchange-${ex.toLowerCase()}`}
              onClick={() => setSelectedExchange(ex)}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                isSelected
                  ? 'bg-[#033631] text-[#bf9b42] border border-[#bf9b42]/60 shadow-sm'
                  : 'bg-[#022824]/60 text-[#a2b5af] hover:text-[#f3ebd7] hover:bg-[#022824] border border-transparent'
              }`}
            >
              <span>{ex}</span>
              <span
                className={`w-2 h-2 rounded-full ${
                  exConnected ? 'bg-emerald-400 animate-pulse' : 'bg-gray-500'
                }`}
              />
              {exConnected && exBalance && (
                <span className="text-[10px] font-mono text-emerald-300 ml-1">
                  {(exBalance.selectedMode === 'SPOT'
                    ? exBalance.spot.available
                    : exBalance.futures.available
                  ).toFixed(2)}{' '}
                  USDT
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Main Content Area */}
      {!isConnected ? (
        /* Not Connected State */
        <div className="bg-[#022824]/90 border border-[#044a43] rounded-xl p-8 text-center space-y-4">
          <div className="w-14 h-14 mx-auto rounded-full bg-[#033631] border border-[#bf9b42]/40 flex items-center justify-center">
            <Coins className="w-7 h-7 text-[#bf9b42]" />
          </div>
          <div className="max-w-md mx-auto space-y-2">
            <h3 className="text-base font-bold text-[#f3ebd7]">
              {selectedExchange} is not connected yet
            </h3>
            <p className="text-xs text-[#a2b5af] leading-relaxed">
              Connect your {selectedExchange} read and trading API keys. NovaQuant will automatically query your real available Spot and Futures balances and assign them directly to Bot Capital without requiring manual capital inputs.
            </p>
          </div>
          {onNavigate && (
            <button
              onClick={() => onNavigate('apiconnect')}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-[#021f1c] bg-[#bf9b42] hover:bg-[#d4ac4d] rounded-lg transition-all shadow-md"
            >
              <span>Connect {selectedExchange} API</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      ) : (
        /* Connected State with Real Balances */
        <div className="space-y-6">
          {/* Top Synchronization Summary Pill */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-[#021f1c] border border-[#044a43] px-4 py-2.5 rounded-lg text-xs">
            <div className="flex items-center gap-2 text-[#a2b5af]">
              <Clock className="w-3.5 h-3.5 text-[#bf9b42]" />
              <span>
                Last exchange query:{' '}
                <strong className="text-[#f3ebd7]">
                  {activeBalance?.lastSyncedAt
                    ? new Date(activeBalance.lastSyncedAt).toLocaleTimeString()
                    : 'Just now'}
                </strong>
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[11px] text-[#a2b5af]">
                Active Trading Engine:
              </span>
              <span className="px-2 py-0.5 text-xs font-bold font-mono rounded bg-[#033631] text-[#bf9b42] border border-[#bf9b42]/30">
                {activeBalance?.selectedMode} ({activeBalance?.activeBotCapital.toFixed(2)} USDT)
              </span>
            </div>
          </div>

          {/* Core Bot Capital Highlight Cards (Binance / Bybit / Bitget Requirement) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 1. Capital (Total) */}
            <div className="bg-[#022824] border border-[#044a43] rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between text-[#8ea49e] text-xs">
                <span>Capital</span>
                <Coins className="w-4 h-4 text-[#bf9b42]" />
              </div>
              <div className="mt-2 text-2xl font-bold font-mono text-[#f3ebd7]">
                {(
                  (activeBalance?.spot.capital || 0) + (activeBalance?.futures.capital || 0)
                ).toFixed(2)}{' '}
                <span className="text-xs font-sans text-[#bf9b42]">USDT</span>
              </div>
              <p className="text-[11px] text-[#8ea49e] mt-1">
                Spot ({activeBalance?.spot.capital.toFixed(2)}) + Futures ({activeBalance?.futures.capital.toFixed(2)})
              </p>
            </div>

            {/* 2. Bot Capital (Automatically set to Available Exchange Trading Balance) */}
            <div className="bg-[#033631] border-2 border-[#bf9b42] rounded-xl p-5 shadow-md relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-[#bf9b42] text-[#021f1c] text-[9px] font-extrabold px-2 py-0.5 rounded-bl uppercase tracking-wider">
                Automated
              </div>
              <div className="flex items-center justify-between text-[#bf9b42] text-xs font-semibold">
                <span>Bot Capital</span>
                <Zap className="w-4 h-4 text-[#bf9b42]" />
              </div>
              <div className="mt-2 text-2xl font-bold font-mono text-[#f3ebd7]">
                {activeBalance?.activeBotCapital.toFixed(2)}{' '}
                <span className="text-xs font-sans text-[#bf9b42]">USDT</span>
              </div>
              <p className="text-[11px] text-emerald-300/90 mt-1 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span>Auto-set = Available {activeBalance?.selectedMode} Balance</span>
              </p>
            </div>

            {/* 3. Available (Trading Balance) */}
            <div className="bg-[#022824] border border-[#044a43] rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between text-[#8ea49e] text-xs">
                <span>Available</span>
                <Activity className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="mt-2 text-2xl font-bold font-mono text-emerald-400">
                {activeBalance?.activeBotCapital.toFixed(2)}{' '}
                <span className="text-xs font-sans text-[#bf9b42]">USDT</span>
              </div>
              <p className="text-[11px] text-[#8ea49e] mt-1">
                Real available trading balance on {selectedExchange}
              </p>
            </div>
          </div>

          {/* Granular Section: SPOT vs FUTURES Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* SPOT TRADING ACCOUNT */}
            <div
              className={`bg-[#022824] border rounded-xl p-6 transition-all ${
                activeBalance?.selectedMode === 'SPOT'
                  ? 'border-[#bf9b42]/60 shadow-lg ring-1 ring-[#bf9b42]/30'
                  : 'border-[#044a43]'
              }`}
            >
              <div className="flex items-center justify-between pb-4 border-b border-[#044a43]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#033631] border border-[#bf9b42]/30 flex items-center justify-center">
                    <Coins className="w-4 h-4 text-[#bf9b42]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#f3ebd7]">
                      SPOT TRADING ACCOUNT
                    </h3>
                    <span className="text-[11px] text-[#8ea49e]">
                      Instant asset ownership & spot pairs
                    </span>
                  </div>
                </div>

                {activeBalance?.selectedMode === 'SPOT' ? (
                  <span className="px-2.5 py-1 rounded text-xs font-bold bg-[#bf9b42]/20 text-[#bf9b42] border border-[#bf9b42]/40">
                    Active Bot Market
                  </span>
                ) : (
                  <button
                    onClick={() => handleSelectMarketMode('SPOT')}
                    className="px-2.5 py-1 text-xs font-semibold text-[#f3ebd7] hover:text-[#bf9b42] bg-[#033631] hover:bg-[#044a43] border border-[#044a43] rounded transition-all"
                  >
                    Set as Active Bot Market
                  </button>
                )}
              </div>

              {/* Spot Metrics */}
              <div className="grid grid-cols-3 gap-3 my-5">
                <div className="bg-[#021f1c] p-3 rounded-lg border border-[#044a43]">
                  <span className="text-[10px] uppercase font-semibold text-[#8ea49e]">
                    Capital
                  </span>
                  <div className="text-lg font-bold font-mono text-[#f3ebd7] mt-0.5">
                    {activeBalance?.spot.capital.toFixed(2)}{' '}
                    <span className="text-[10px] text-[#bf9b42]">USDT</span>
                  </div>
                </div>

                <div className="bg-[#033631]/80 p-3 rounded-lg border border-[#bf9b42]/40">
                  <span className="text-[10px] uppercase font-semibold text-[#bf9b42]">
                    Bot Capital
                  </span>
                  <div className="text-lg font-bold font-mono text-[#f3ebd7] mt-0.5">
                    {activeBalance?.spot.botCapital.toFixed(2)}{' '}
                    <span className="text-[10px] text-[#bf9b42]">USDT</span>
                  </div>
                </div>

                <div className="bg-[#021f1c] p-3 rounded-lg border border-[#044a43]">
                  <span className="text-[10px] uppercase font-semibold text-emerald-400">
                    Available
                  </span>
                  <div className="text-lg font-bold font-mono text-emerald-400 mt-0.5">
                    {activeBalance?.spot.available.toFixed(2)}{' '}
                    <span className="text-[10px] text-[#bf9b42]">USDT</span>
                  </div>
                </div>
              </div>

              {/* Spot Breakdown Details */}
              <div className="space-y-2 text-xs bg-[#021f1c]/60 p-3.5 rounded-lg border border-[#044a43]/70">
                <div className="flex items-center justify-between text-[#8ea49e]">
                  <span>Free Spot USDT:</span>
                  <span className="font-mono text-[#f3ebd7]">
                    {activeBalance?.spot.available.toFixed(2)} USDT
                  </span>
                </div>
                <div className="flex items-center justify-between text-[#8ea49e]">
                  <span className="flex items-center gap-1">
                    <Lock className="w-3 h-3 text-amber-400" />
                    Locked in Open Limit Orders:
                  </span>
                  <span className="font-mono text-amber-300">
                    {activeBalance?.spot.lockedInOrders.toFixed(2)} USDT
                  </span>
                </div>
                <div className="flex items-center justify-between text-[#8ea49e] pt-1 border-t border-[#044a43]">
                  <span>Total Spot USDT Capital:</span>
                  <span className="font-mono font-bold text-[#f3ebd7]">
                    {activeBalance?.spot.capital.toFixed(2)} USDT
                  </span>
                </div>
              </div>
            </div>

            {/* FUTURES TRADING ACCOUNT */}
            <div
              className={`bg-[#022824] border rounded-xl p-6 transition-all ${
                activeBalance?.selectedMode === 'FUTURES'
                  ? 'border-[#bf9b42]/60 shadow-lg ring-1 ring-[#bf9b42]/30'
                  : 'border-[#044a43]'
              }`}
            >
              <div className="flex items-center justify-between pb-4 border-b border-[#044a43]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#033631] border border-[#bf9b42]/30 flex items-center justify-center">
                    <Layers className="w-4 h-4 text-[#bf9b42]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#f3ebd7]">
                      FUTURES TRADING ACCOUNT (USDT-M)
                    </h3>
                    <span className="text-[11px] text-[#8ea49e]">
                      Perpetual contracts with margin leverage
                    </span>
                  </div>
                </div>

                {activeBalance?.selectedMode === 'FUTURES' ? (
                  <span className="px-2.5 py-1 rounded text-xs font-bold bg-[#bf9b42]/20 text-[#bf9b42] border border-[#bf9b42]/40">
                    Active Bot Market
                  </span>
                ) : (
                  <button
                    onClick={() => handleSelectMarketMode('FUTURES')}
                    className="px-2.5 py-1 text-xs font-semibold text-[#f3ebd7] hover:text-[#bf9b42] bg-[#033631] hover:bg-[#044a43] border border-[#044a43] rounded transition-all"
                  >
                    Set as Active Bot Market
                  </button>
                )}
              </div>

              {/* Futures Metrics */}
              <div className="grid grid-cols-3 gap-3 my-5">
                <div className="bg-[#021f1c] p-3 rounded-lg border border-[#044a43]">
                  <span className="text-[10px] uppercase font-semibold text-[#8ea49e]">
                    Capital
                  </span>
                  <div className="text-lg font-bold font-mono text-[#f3ebd7] mt-0.5">
                    {activeBalance?.futures.capital.toFixed(2)}{' '}
                    <span className="text-[10px] text-[#bf9b42]">USDT</span>
                  </div>
                </div>

                <div className="bg-[#033631]/80 p-3 rounded-lg border border-[#bf9b42]/40">
                  <span className="text-[10px] uppercase font-semibold text-[#bf9b42]">
                    Bot Capital
                  </span>
                  <div className="text-lg font-bold font-mono text-[#f3ebd7] mt-0.5">
                    {activeBalance?.futures.botCapital.toFixed(2)}{' '}
                    <span className="text-[10px] text-[#bf9b42]">USDT</span>
                  </div>
                </div>

                <div className="bg-[#021f1c] p-3 rounded-lg border border-[#044a43]">
                  <span className="text-[10px] uppercase font-semibold text-emerald-400">
                    Available
                  </span>
                  <div className="text-lg font-bold font-mono text-emerald-400 mt-0.5">
                    {activeBalance?.futures.available.toFixed(2)}{' '}
                    <span className="text-[10px] text-[#bf9b42]">USDT</span>
                  </div>
                </div>
              </div>

              {/* Futures Breakdown Details */}
              <div className="space-y-2 text-xs bg-[#021f1c]/60 p-3.5 rounded-lg border border-[#044a43]/70">
                <div className="flex items-center justify-between text-[#8ea49e]">
                  <span>Available Futures Margin:</span>
                  <span className="font-mono text-emerald-400 font-semibold">
                    {activeBalance?.futures.available.toFixed(2)} USDT
                  </span>
                </div>
                <div className="flex items-center justify-between text-[#8ea49e]">
                  <span className="flex items-center gap-1">
                    <Lock className="w-3 h-3 text-amber-400" />
                    Margin in Open Positions:
                  </span>
                  <span className="font-mono text-amber-300">
                    {(activeBalance?.futures.marginUsed || 0).toFixed(2)} USDT
                  </span>
                </div>
                <div className="flex items-center justify-between text-[#8ea49e]">
                  <span>Locked in Open Orders:</span>
                  <span className="font-mono text-[#f3ebd7]">
                    {(activeBalance?.futures.lockedInOrders || 0).toFixed(2)} USDT
                  </span>
                </div>
                <div className="flex items-center justify-between text-[#8ea49e]">
                  <span>Unrealized P&L:</span>
                  <span
                    className={`font-mono ${
                      (activeBalance?.futures.unrealizedPnl || 0) >= 0
                        ? 'text-emerald-400'
                        : 'text-rose-400'
                    }`}
                  >
                    {(activeBalance?.futures.unrealizedPnl || 0) >= 0 ? '+' : ''}
                    {(activeBalance?.futures.unrealizedPnl || 0).toFixed(2)} USDT
                  </span>
                </div>
                <div className="flex items-center justify-between text-[#8ea49e] pt-1 border-t border-[#044a43]">
                  <span>Total Futures Margin Capital:</span>
                  <span className="font-mono font-bold text-[#f3ebd7]">
                    {activeBalance?.futures.capital.toFixed(2)} USDT
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Safety Notice Callout */}
          <div className="bg-[#021f1c] border border-[#044a43] rounded-lg p-4 text-xs space-y-1.5 text-[#a2b5af]">
            <div className="flex items-center gap-2 text-[#bf9b42] font-semibold">
              <ShieldCheck className="w-4 h-4" />
              <span>Available Trading Balance Safety Logic</span>
            </div>
            <p>
              NovaQuant strictly uses the <strong className="text-[#f3ebd7]">AVAILABLE trading balance</strong>, not simply the total wallet balance. Funds that are locked in open orders, used as margin, committed in open positions, or otherwise unavailable for trading are strictly accounted for and deducted.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
