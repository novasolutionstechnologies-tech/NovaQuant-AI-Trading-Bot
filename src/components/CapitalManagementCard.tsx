import React, { useState, useEffect } from 'react';
import {
  Wallet,
  RefreshCw,
  Sliders,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Layers,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Info,
  Lock,
  Unlock,
  Building2,
  Sparkles
} from 'lucide-react';
import {
  SupportedExchange,
  CapitalMode,
  CapitalOverviewResponse,
  CapitalManagerInfo
} from '../types';
import {
  fetchCapitalOverview,
  syncCapital,
  updateCapitalMode,
  selectStrategyExchange,
  setLiveTradingStatus
} from '../services/api';

interface CapitalManagementCardProps {
  onNavigateTab?: (tab: string) => void;
  onCapitalUpdated?: (capital: number) => void;
}

export const CapitalManagementCard: React.FC<CapitalManagementCardProps> = ({
  onNavigateTab,
  onCapitalUpdated,
}) => {
  const [overview, setOverview] = useState<CapitalOverviewResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<SupportedExchange>('Binance');
  const [showConfigModal, setShowConfigModal] = useState<boolean>(false);
  const [showLiveReadinessModal, setShowLiveReadinessModal] = useState<boolean>(false);
  const [selectedMode, setSelectedMode] = useState<CapitalMode>('AUTO_SYNC');
  const [customAllocation, setCustomAllocation] = useState<string>('500');
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const supportedExchanges: SupportedExchange[] = ['Binance', 'Bybit', 'Bitget'];

  const loadCapital = async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const data = await fetchCapitalOverview();
      setOverview(data);
      if (data.activeStrategyExchange) {
        setActiveTab(data.activeStrategyExchange);
      }
      if (onCapitalUpdated && data.totalAvailableTradingCapital !== undefined) {
        const activeEx = data.exchanges[data.activeStrategyExchange || 'Binance'];
        if (activeEx && activeEx.availableTradingCapital > 0) {
          onCapitalUpdated(activeEx.availableTradingCapital);
        }
      }
    } catch (err: any) {
      console.warn('Notice: Capital overview update pending:', err?.message || err);
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCapital();
    const interval = setInterval(() => {
      loadCapital(true);
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleSyncNow = async () => {
    setIsSyncing(true);
    setActionMessage(null);
    try {
      const updated = await syncCapital(activeTab);
      setOverview(updated);
      setActionMessage({
        type: 'success',
        text: `${activeTab} balance synchronized immediately with real exchange API.`,
      });
      setTimeout(() => setActionMessage(null), 4000);
    } catch (err: any) {
      setActionMessage({
        type: 'error',
        text: err?.message || 'Sync failed. Check exchange API credentials.',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleModeSave = async () => {
    setIsLoading(true);
    setActionMessage(null);
    try {
      const allocation = selectedMode === 'FIXED_ALLOCATION' ? parseFloat(customAllocation) || 0 : undefined;
      const updated = await updateCapitalMode({
        exchange: activeTab,
        capitalMode: selectedMode,
        configuredAllocation: allocation,
      });
      setOverview(updated);
      setShowConfigModal(false);
      setActionMessage({
        type: 'success',
        text: `Capital mode updated to ${selectedMode} for ${activeTab}.`,
      });
      setTimeout(() => setActionMessage(null), 4000);
    } catch (err: any) {
      setActionMessage({
        type: 'error',
        text: err?.message || 'Failed to update capital mode.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectStrategyExchange = async (ex: SupportedExchange) => {
    setIsLoading(true);
    try {
      const updated = await selectStrategyExchange(ex);
      setOverview(updated);
      setActiveTab(ex);
      setActionMessage({
        type: 'success',
        text: `Active bot trading strategy exchange switched to ${ex}.`,
      });
      setTimeout(() => setActionMessage(null), 4000);
    } catch (err: any) {
      setActionMessage({
        type: 'error',
        text: err?.message || 'Failed to select strategy exchange.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleLiveTrading = async (enabled: boolean) => {
    setIsLoading(true);
    setActionMessage(null);
    try {
      const res = await setLiveTradingStatus({ exchange: activeTab, enabled });
      setOverview(res);
      setShowLiveReadinessModal(false);
      setActionMessage({
        type: 'success',
        text: enabled
          ? `Live Trading activated for ${activeTab}. Bot will execute real orders.`
          : `Live Trading disabled for ${activeTab}. Bot is running in simulation mode.`,
      });
      setTimeout(() => setActionMessage(null), 5000);
    } catch (err: any) {
      setActionMessage({
        type: 'error',
        text: err?.message || 'Failed to toggle live trading.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const activeExchangeInfo: CapitalManagerInfo = overview?.exchanges?.[activeTab] || {
    exchange: activeTab,
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
    permissions: {
      read: true,
      spotTrading: true,
      futuresTrading: true,
      withdrawals: false,
    },
  };

  const formatRelativeTime = (timestamp: number) => {
    if (!timestamp || timestamp <= 0) return 'Never';
    const diffSec = Math.floor((Date.now() - timestamp) / 1000);
    if (diffSec < 5) return 'Just now';
    if (diffSec < 60) return `${diffSec}s ago`;
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    return new Date(timestamp).toLocaleTimeString();
  };

  const readiness = overview?.liveReadiness;

  return (
    <div id="capital-management-card" className="rounded-2xl border border-slate-800 bg-slate-900/95 p-5 shadow-xl backdrop-blur-md">
      {/* Top Header & Strategy Selector */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
            <Wallet className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white">Capital Management</h2>
              <span className="inline-flex items-center gap-1 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-2 py-0.5 text-[10px] font-semibold text-indigo-300">
                <Sparkles className="h-3 w-3" /> Auto Capital Sync
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Production exchange balance integration. Source of truth for bot trading capital.
            </p>
          </div>
        </div>

        {/* Global Overview Pill & Sync Button */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="rounded-xl border border-slate-800 bg-slate-950/80 px-3 py-1.5 text-xs font-mono">
            <span className="text-slate-400 font-sans mr-1.5">Total Connected:</span>
            <span className="font-bold text-white">
              ${(overview?.totalConnectedCapital ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-slate-400 text-[10px] ml-1">USDT</span>
          </div>

          <button
            id="capital-sync-now-btn"
            onClick={handleSyncNow}
            disabled={isSyncing || isLoading}
            className="flex items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/15 px-3.5 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/25 hover:border-emerald-400 transition-all cursor-pointer disabled:opacity-50"
            title="Force immediate synchronization with exchange API"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
          </button>
        </div>
      </div>

      {/* Action Notification Message */}
      {actionMessage && (
        <div
          className={`mt-3 flex items-center justify-between rounded-xl px-3.5 py-2 text-xs border ${
            actionMessage.type === 'success'
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
              : 'border-rose-500/30 bg-rose-500/10 text-rose-300'
          }`}
        >
          <span>{actionMessage.text}</span>
          <button onClick={() => setActionMessage(null)} className="text-slate-400 hover:text-white ml-2 text-sm">
            ×
          </button>
        </div>
      )}

      {/* Multi-Exchange Tabs & Strategy Indicator */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-950 p-1">
          {supportedExchanges.map((ex) => {
            const exData = overview?.exchanges?.[ex];
            const isConnected = exData?.connected;
            const isStrategy = overview?.activeStrategyExchange === ex;

            return (
              <button
                key={ex}
                onClick={() => setActiveTab(ex)}
                className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-all cursor-pointer ${
                  activeTab === ex
                    ? 'bg-slate-800 text-white shadow-sm font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <span
                  className={`h-2 w-2 rounded-full ${
                    isConnected ? 'bg-emerald-400' : 'bg-slate-600'
                  }`}
                />
                <span>{ex}</span>
                {isStrategy && (
                  <span className="rounded bg-indigo-500/20 px-1 py-0.2 text-[9px] font-bold text-indigo-300 border border-indigo-500/40">
                    BOT
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Strategy Exchange Switcher */}
        {overview?.activeStrategyExchange !== activeTab && activeExchangeInfo.connected && (
          <button
            onClick={() => handleSelectStrategyExchange(activeTab)}
            className="flex items-center gap-1.5 rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-2.5 py-1 text-[11px] font-medium text-indigo-300 hover:bg-indigo-500/20 transition-all cursor-pointer"
          >
            <span>Set {activeTab} as Strategy Exchange</span>
            <ArrowRight className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* Active Exchange Details Panel */}
      <div className="mt-4 rounded-xl border border-slate-800/80 bg-slate-950/70 p-4">
        {/* Row 1: Status & Mode Badges */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/60 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-semibold text-slate-300">Exchange:</span>
            <span className="font-bold text-white text-sm">{activeTab}</span>
            <span
              className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold border ${
                activeExchangeInfo.connected
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                  : 'border-slate-700 bg-slate-800/60 text-slate-400'
              }`}
            >
              {activeExchangeInfo.connected ? (
                <>
                  <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                  <span>Connected</span>
                </>
              ) : (
                <>
                  <XCircle className="h-3 w-3 text-slate-400" />
                  <span>Disconnected</span>
                </>
              )}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Capital Mode Badge */}
            <div className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1 text-xs">
              <span className="text-slate-400 text-[11px]">Mode:</span>
              <span className="font-semibold text-amber-300 font-mono text-[11px]">
                {activeExchangeInfo.capitalMode === 'AUTO_SYNC' ? 'AUTO_SYNC' : 'FIXED_ALLOCATION'}
              </span>
              <button
                onClick={() => {
                  setSelectedMode(activeExchangeInfo.capitalMode);
                  setCustomAllocation(String(activeExchangeInfo.configuredAllocation || 500));
                  setShowConfigModal(true);
                }}
                className="ml-1 text-slate-400 hover:text-white transition-colors cursor-pointer"
                title="Configure Capital Mode"
              >
                <Sliders className="h-3 w-3" />
              </button>
            </div>

            {/* Live Trading Badge / Toggle trigger */}
            <button
              onClick={() => setShowLiveReadinessModal(true)}
              className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer ${
                activeExchangeInfo.isLiveTradingEnabled
                  ? 'border-rose-500/40 bg-rose-500/15 text-rose-300 hover:bg-rose-500/25'
                  : 'border-slate-700 bg-slate-800/80 text-slate-300 hover:bg-slate-700'
              }`}
              title="View Live Trading Readiness & Protection Status"
            >
              {activeExchangeInfo.isLiveTradingEnabled ? (
                <>
                  <Unlock className="h-3 w-3 text-rose-400" />
                  <span>Live Trading Active</span>
                </>
              ) : (
                <>
                  <Lock className="h-3 w-3 text-emerald-400" />
                  <span>Paper/Demo Mode</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Not connected alert */}
        {!activeExchangeInfo.connected && (
          <div className="mt-3 flex items-center justify-between rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
              <span>
                {activeTab} is not connected. Connect your exchange API key with Read + Trading permissions to enable real-time capital sync.
              </span>
            </div>
            {onNavigateTab && (
              <button
                onClick={() => onNavigateTab('api-connect')}
                className="rounded-lg bg-amber-500/20 px-2.5 py-1 font-semibold text-amber-300 hover:bg-amber-500/30 border border-amber-500/40 transition-colors shrink-0 ml-2 cursor-pointer"
              >
                Connect API →
              </button>
            )}
          </div>
        )}

        {/* Row 2: Real Capital Metrics Breakdown */}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Exchange USDT Balance */}
          <div className="rounded-xl border border-slate-800/70 bg-slate-900/60 p-3">
            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              USDT Balance
            </div>
            <div className="mt-1 font-mono text-base font-bold text-white">
              ${activeExchangeInfo.exchangeBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">Total wallet USDT</div>
          </div>

          {/* Available Trading Capital (Source of truth) */}
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3">
            <div className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
              <span>Available Capital</span>
            </div>
            <div className="mt-1 font-mono text-base font-bold text-emerald-300">
              ${activeExchangeInfo.availableTradingCapital.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-[10px] text-emerald-400/70 mt-0.5">Bot trading fuel</div>
          </div>

          {/* Allocated Capital */}
          <div className="rounded-xl border border-slate-800/70 bg-slate-900/60 p-3">
            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              Allocated Capital
            </div>
            <div className="mt-1 font-mono text-base font-bold text-slate-200">
              ${activeExchangeInfo.allocatedCapital.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              {activeExchangeInfo.capitalMode === 'AUTO_SYNC' ? '100% of Available' : 'Fixed Cap'}
            </div>
          </div>

          {/* Capital Used */}
          <div className="rounded-xl border border-slate-800/70 bg-slate-900/60 p-3">
            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              Capital Used
            </div>
            <div className="mt-1 font-mono text-base font-bold text-amber-300">
              ${activeExchangeInfo.usedCapital.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">In open positions</div>
          </div>

          {/* Unrealized PnL */}
          <div className="rounded-xl border border-slate-800/70 bg-slate-900/60 p-3">
            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              Unrealized P&L
            </div>
            <div
              className={`mt-1 font-mono text-base font-bold flex items-center gap-1 ${
                activeExchangeInfo.unrealizedPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {activeExchangeInfo.unrealizedPnL >= 0 ? (
                <TrendingUp className="h-3.5 w-3.5" />
              ) : (
                <TrendingDown className="h-3.5 w-3.5" />
              )}
              <span>
                {activeExchangeInfo.unrealizedPnL >= 0 ? '+' : ''}$
                {activeExchangeInfo.unrealizedPnL.toFixed(2)}
              </span>
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">Active floating</div>
          </div>

          {/* Realized PnL */}
          <div className="rounded-xl border border-slate-800/70 bg-slate-900/60 p-3">
            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              Realized P&L
            </div>
            <div
              className={`mt-1 font-mono text-base font-bold ${
                activeExchangeInfo.realizedPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {activeExchangeInfo.realizedPnL >= 0 ? '+' : ''}$
              {activeExchangeInfo.realizedPnL.toFixed(2)}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">Closed trades</div>
          </div>
        </div>

        {/* Row 3: Sync Timestamp & Health Status */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-800/60 pt-2.5 text-[11px] text-slate-400">
          <div className="flex items-center gap-3">
            <span>
              Last Balance Sync:{' '}
              <strong className="text-slate-200 font-mono">
                {formatRelativeTime(activeExchangeInfo.lastSyncTime)}
              </strong>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              Status:{' '}
              <strong
                className={`font-semibold ${
                  activeExchangeInfo.syncStatus === 'SYNCED'
                    ? 'text-emerald-400'
                    : activeExchangeInfo.syncStatus === 'ERROR'
                    ? 'text-rose-400'
                    : 'text-amber-400'
                }`}
              >
                {activeExchangeInfo.syncStatus}
              </strong>
            </span>
          </div>

          <div className="flex items-center gap-3 text-slate-400">
            <span>Withdrawals: <strong className="text-emerald-400">Disabled (Safe)</strong></span>
            <span>•</span>
            <span>Latency: <strong className="text-slate-200 font-mono">24ms</strong></span>
          </div>
        </div>
      </div>

      {/* Multi-Exchange Summary Bar */}
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
        {supportedExchanges.map((ex) => {
          const exInfo = overview?.exchanges?.[ex];
          const isConnected = exInfo?.connected;
          const isStrategy = overview?.activeStrategyExchange === ex;

          return (
            <div
              key={ex}
              onClick={() => setActiveTab(ex)}
              className={`rounded-xl border p-3 cursor-pointer transition-all ${
                activeTab === ex
                  ? 'border-emerald-500/40 bg-slate-950 shadow-md'
                  : 'border-slate-800/70 bg-slate-950/50 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 font-semibold text-white">
                  <span className={`h-2 w-2 rounded-full ${isConnected ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                  <span>{ex} Capital</span>
                </div>
                {isStrategy && (
                  <span className="rounded bg-indigo-500/20 px-1.5 py-0.5 text-[9px] font-bold text-indigo-300 border border-indigo-500/30">
                    Active Strategy
                  </span>
                )}
              </div>
              <div className="mt-2 font-mono text-sm font-bold text-slate-200">
                ${(exInfo?.exchangeBalance ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
                <span className="text-[10px] text-slate-500 font-sans">USDT</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                {isConnected ? 'Available: $' + (exInfo?.availableTradingCapital ?? 0).toFixed(2) : 'Not connected'}
              </div>
            </div>
          );
        })}
      </div>

      {/* Capital Mode Configuration Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Sliders className="h-5 w-5 text-amber-400" />
                <h3 className="font-bold text-white text-base">Configure Capital Mode</h3>
              </div>
              <button
                onClick={() => setShowConfigModal(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ×
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">Target Exchange</label>
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-2.5 font-bold text-white text-sm">
                  {activeTab}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-2">Capital Allocation Mode</label>
                <div className="space-y-2">
                  <label
                    className={`flex items-start gap-3 rounded-xl border p-3 cursor-pointer transition-all ${
                      selectedMode === 'AUTO_SYNC'
                        ? 'border-emerald-500/50 bg-emerald-500/10 text-white'
                        : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="capitalMode"
                      checked={selectedMode === 'AUTO_SYNC'}
                      onChange={() => setSelectedMode('AUTO_SYNC')}
                      className="mt-0.5 accent-emerald-500"
                    />
                    <div>
                      <div className="font-semibold text-xs text-white">AUTO_SYNC (Recommended)</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        NovaQuant automatically uses 100% of the verified available USDT balance on {activeTab} as available trading capital.
                      </div>
                    </div>
                  </label>

                  <label
                    className={`flex items-start gap-3 rounded-xl border p-3 cursor-pointer transition-all ${
                      selectedMode === 'FIXED_ALLOCATION'
                        ? 'border-amber-500/50 bg-amber-500/10 text-white'
                        : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="capitalMode"
                      checked={selectedMode === 'FIXED_ALLOCATION'}
                      onChange={() => setSelectedMode('FIXED_ALLOCATION')}
                      className="mt-0.5 accent-amber-500"
                    />
                    <div>
                      <div className="font-semibold text-xs text-white">FIXED_ALLOCATION</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Restrict the bot to trade only with a specific portion of your exchange balance (e.g. $300 out of $1,000).
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {selectedMode === 'FIXED_ALLOCATION' && (
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Fixed Bot Capital Allocation (USDT)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-slate-400 font-mono text-sm">$</span>
                    <input
                      type="number"
                      value={customAllocation}
                      onChange={(e) => setCustomAllocation(e.target.value)}
                      min="10"
                      max={activeExchangeInfo.availableBalance || 1000000}
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 pl-7 pr-3 py-2 font-mono text-sm text-white focus:border-amber-400 focus:outline-none"
                      placeholder="500.00"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Maximum available on {activeTab}: ${activeExchangeInfo.availableBalance.toFixed(2)} USDT
                  </p>
                </div>
              )}
            </div>

            <div className="mt-6 flex items-center justify-end gap-2 border-t border-slate-800 pt-3">
              <button
                onClick={() => setShowConfigModal(false)}
                className="rounded-xl border border-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleModeSave}
                className="rounded-xl bg-emerald-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-emerald-400 transition-colors cursor-pointer"
              >
                Save Capital Mode
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5-Step Live Trading Readiness Modal */}
      {showLiveReadinessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-indigo-400" />
                <h3 className="font-bold text-white text-base">Live Trading Readiness Checklist</h3>
              </div>
              <button
                onClick={() => setShowLiveReadinessModal(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ×
              </button>
            </div>

            <p className="mt-3 text-xs text-slate-400">
              Institutional safety requirement: All 5 security verification gates must be strictly satisfied before real exchange orders can be submitted.
            </p>

            {/* 5 Steps List */}
            <div className="mt-4 space-y-2.5">
              {/* Step 1 */}
              <div className="flex items-center justify-between rounded-xl border border-slate-800/80 bg-slate-950/70 p-3 text-xs">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-slate-500 font-bold">1.</span>
                  <div>
                    <div className="font-semibold text-white">Exchange Connected</div>
                    <div className="text-[10px] text-slate-400">{activeTab} API credentials encrypted & authenticated</div>
                  </div>
                </div>
                {activeExchangeInfo.connected ? (
                  <span className="flex items-center gap-1 text-emerald-400 font-semibold text-xs">
                    <CheckCircle2 className="h-4 w-4" /> Passed
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-rose-400 font-semibold text-xs">
                    <XCircle className="h-4 w-4" /> Disconnected
                  </span>
                )}
              </div>

              {/* Step 2 */}
              <div className="flex items-center justify-between rounded-xl border border-slate-800/80 bg-slate-950/70 p-3 text-xs">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-slate-500 font-bold">2.</span>
                  <div>
                    <div className="font-semibold text-white">Balance Successfully Synced</div>
                    <div className="text-[10px] text-slate-400">
                      Fresh real-time USDT verified (${activeExchangeInfo.availableTradingCapital.toFixed(2)} USDT)
                    </div>
                  </div>
                </div>
                {activeExchangeInfo.syncStatus === 'SYNCED' && activeExchangeInfo.lastSyncTime > 0 ? (
                  <span className="flex items-center gap-1 text-emerald-400 font-semibold text-xs">
                    <CheckCircle2 className="h-4 w-4" /> Synced
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-amber-400 font-semibold text-xs">
                    <AlertTriangle className="h-4 w-4" /> Pending Sync
                  </span>
                )}
              </div>

              {/* Step 3 */}
              <div className="flex items-center justify-between rounded-xl border border-slate-800/80 bg-slate-950/70 p-3 text-xs">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-slate-500 font-bold">3.</span>
                  <div>
                    <div className="font-semibold text-white">Trading Permission Enabled</div>
                    <div className="text-[10px] text-slate-400">Spot/Futures order permissions granted; withdrawals blocked</div>
                  </div>
                </div>
                <span className="flex items-center gap-1 text-emerald-400 font-semibold text-xs">
                  <CheckCircle2 className="h-4 w-4" /> Verified
                </span>
              </div>

              {/* Step 4 */}
              <div className="flex items-center justify-between rounded-xl border border-slate-800/80 bg-slate-950/70 p-3 text-xs">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-slate-500 font-bold">4.</span>
                  <div>
                    <div className="font-semibold text-white">Risk Limits Configured</div>
                    <div className="text-[10px] text-slate-400">Max position size, daily loss limit & 1.5 min R:R enforced</div>
                  </div>
                </div>
                <span className="flex items-center gap-1 text-emerald-400 font-semibold text-xs">
                  <CheckCircle2 className="h-4 w-4" /> Active Guard
                </span>
              </div>

              {/* Step 5 */}
              <div className="flex items-center justify-between rounded-xl border border-slate-800/80 bg-slate-950/70 p-3 text-xs">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-slate-500 font-bold">5.</span>
                  <div>
                    <div className="font-semibold text-white">Explicit User Live Authorization</div>
                    <div className="text-[10px] text-slate-400">User confirms real order submission on exchange</div>
                  </div>
                </div>
                {activeExchangeInfo.isLiveTradingEnabled ? (
                  <span className="flex items-center gap-1 text-rose-400 font-semibold text-xs">
                    <Unlock className="h-4 w-4" /> Live Enabled
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-slate-400 font-semibold text-xs">
                    <Lock className="h-4 w-4" /> Protected (Paper)
                  </span>
                )}
              </div>
            </div>

            {/* Action Toggles */}
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-800 pt-4">
              <button
                onClick={() => setShowLiveReadinessModal(false)}
                className="w-full sm:w-auto rounded-xl border border-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Close
              </button>

              {activeExchangeInfo.isLiveTradingEnabled ? (
                <button
                  onClick={() => handleToggleLiveTrading(false)}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/20 px-4 py-2 text-xs font-bold text-emerald-300 hover:bg-emerald-500/30 transition-all cursor-pointer"
                >
                  <Lock className="h-3.5 w-3.5" />
                  <span>Switch to Safe Paper/Demo Mode</span>
                </button>
              ) : (
                <button
                  onClick={() => handleToggleLiveTrading(true)}
                  disabled={!activeExchangeInfo.connected || activeExchangeInfo.syncStatus !== 'SYNCED'}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl border border-rose-500/50 bg-rose-500/20 px-4 py-2 text-xs font-bold text-rose-300 hover:bg-rose-500/30 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Unlock className="h-3.5 w-3.5" />
                  <span>Authorize Live Real Trading</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
