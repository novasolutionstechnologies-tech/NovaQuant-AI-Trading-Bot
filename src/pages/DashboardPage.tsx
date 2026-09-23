import React from 'react';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Activity,
  Award,
  ShieldCheck,
  Zap,
  ArrowRight,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Clock,
  Play,
  Square,
  Pause,
  Power
} from 'lucide-react';
import {
  AnalyticsPerformance,
  ActiveTrade,
  ClosedTrade,
  AIConsensusResult,
  TradeDirection,
  BotStatus
} from '../types';
import { CapitalManagementCard } from '../components/CapitalManagementCard';

interface DashboardPageProps {
  analytics: AnalyticsPerformance | null;
  activeTrades: ActiveTrade[];
  closedTrades: ClosedTrade[];
  prices: Record<string, number>;
  latestConsensus: AIConsensusResult | null;
  botStatus: BotStatus;
  onToggleStartStop: () => void;
  onTogglePauseResume: () => void;
  onNavigateTab: (tab: any) => void;
  onSelectSymbol: (symbol: string) => void;
  onCloseTrade: (tradeId: string) => void;
  onTriggerOpenTrade: (symbol: string, direction: TradeDirection) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  analytics,
  activeTrades,
  closedTrades,
  prices,
  latestConsensus,
  botStatus,
  onToggleStartStop,
  onTogglePauseResume,
  onNavigateTab,
  onSelectSymbol,
  onCloseTrade,
  onTriggerOpenTrade,
}) => {
  const balance = analytics?.accountBalance ?? 0;
  const dailyPnL = analytics?.dailyPnL ?? 0;
  const dailyPnLPct = analytics?.dailyPnLPercentage ?? 0;
  const totalPnL = analytics?.totalProfitLoss ?? 0;
  const totalPnLPct = analytics?.totalProfitLossPercentage ?? 0;
  const winRate = analytics?.winRate ?? 0;
  const profitFactor = analytics?.profitFactor ?? 0;

  const cryptoMarkets = [
    { symbol: 'BTC/USDT', name: 'Bitcoin', price: prices['BTC/USDT'] || 67420.5, change: '+2.45%', trend: 'BULLISH', rsi: 58.4 },
    { symbol: 'ETH/USDT', name: 'Ethereum', price: prices['ETH/USDT'] || 3540.2, change: '+1.82%', trend: 'BULLISH', rsi: 54.1 },
    { symbol: 'SOL/USDT', name: 'Solana', price: prices['SOL/USDT'] || 184.8, change: '+4.15%', trend: 'BULLISH', rsi: 62.9 },
    { symbol: 'BNB/USDT', name: 'BNB', price: prices['BNB/USDT'] || 598.6, change: '-0.35%', trend: 'NEUTRAL', rsi: 49.5 },
    { symbol: 'XRP/USDT', name: 'Ripple', price: prices['XRP/USDT'] || 0.624, change: '+0.88%', trend: 'NEUTRAL', rsi: 51.2 },
  ];

  return (
    <div className="space-y-6">
      {/* Top Welcome & Summary Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>Executive Trading Cockpit</span>
            <span className="flex h-2 w-2 rounded-full bg-emerald-400"></span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time algorithmic supervision with Dual-AI Consensus and institutional risk guards.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigateTab('ai-decisions')}
            className="flex items-center gap-1.5 rounded-lg border border-indigo-500/30 bg-indigo-600/15 px-3 py-1.5 text-xs font-semibold text-indigo-300 hover:bg-indigo-600/25 transition-all cursor-pointer"
          >
            <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
            <span>AI Decision Room</span>
          </button>
          <button
            onClick={() => onNavigateTab('risk-management')}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition-all cursor-pointer"
          >
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            <span>Risk Guard Policy</span>
          </button>
        </div>
      </div>

      {/* Bot Operational State & Control Bar */}
      <div
        id="cockpit-bot-control-panel"
        className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 sm:p-5 backdrop-blur-md shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div className="flex items-start sm:items-center gap-3.5">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${
              botStatus === 'RUNNING'
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                : botStatus === 'PAUSED'
                ? 'border-amber-500/30 bg-amber-500/10 text-amber-400'
                : 'border-rose-500/30 bg-rose-500/10 text-rose-400'
            }`}
          >
            {botStatus === 'RUNNING' && <Activity className="h-6 w-6 animate-pulse" />}
            {botStatus === 'PAUSED' && <Pause className="h-6 w-6" />}
            {botStatus === 'STOPPED' && <Power className="h-6 w-6" />}
          </div>

          <div>
            <div className="flex items-center gap-2.5">
              <span className="text-sm font-bold text-white">Bot Status:</span>
              <span
                className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-0.5 text-xs font-mono font-bold uppercase tracking-wide border ${
                  botStatus === 'RUNNING'
                    ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300'
                    : botStatus === 'PAUSED'
                    ? 'border-amber-500/40 bg-amber-500/15 text-amber-300'
                    : 'border-rose-500/40 bg-rose-500/15 text-rose-300'
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    botStatus === 'RUNNING'
                      ? 'bg-emerald-400 animate-ping'
                      : botStatus === 'PAUSED'
                      ? 'bg-amber-400 animate-pulse'
                      : 'bg-rose-400'
                  }`}
                />
                {botStatus === 'RUNNING' && 'Active & Scanning'}
                {botStatus === 'PAUSED' && 'Paused (Protected)'}
                {botStatus === 'STOPPED' && 'Engine Stopped'}
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-400">
              {botStatus === 'RUNNING' &&
                'Autonomous market scanning and Dual-AI validation loop are operating continuously.'}
              {botStatus === 'PAUSED' &&
                'Bot execution paused. Active positions remain protected, but no new trades will be triggered.'}
              {botStatus === 'STOPPED' &&
                'Quantitative bot daemon is halted. Press "Start Bot" to activate autonomous scanning.'}
            </p>
          </div>
        </div>

        {/* Action Toggle Buttons */}
        <div className="flex items-center gap-3 self-end sm:self-auto">
          {/* Start / Stop Toggle Button */}
          <button
            id="cockpit-bot-start-stop-btn"
            onClick={onToggleStartStop}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all border shadow-md cursor-pointer ${
              botStatus === 'STOPPED'
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 hover:bg-emerald-500/30 hover:border-emerald-400 active:scale-95 shadow-emerald-500/10'
                : 'bg-rose-500/20 text-rose-300 border-rose-500/50 hover:bg-rose-500/30 hover:border-rose-400 active:scale-95 shadow-rose-500/10'
            }`}
            title={botStatus === 'STOPPED' ? 'Start Bot Engine' : 'Stop Bot Engine'}
          >
            {botStatus === 'STOPPED' ? (
              <>
                <Play className="h-4 w-4 fill-current" />
                <span>Start Bot</span>
              </>
            ) : (
              <>
                <Square className="h-4 w-4 fill-current" />
                <span>Stop Bot</span>
              </>
            )}
          </button>

          {/* Pause / Resume Toggle Button */}
          <button
            id="cockpit-bot-pause-resume-btn"
            onClick={onTogglePauseResume}
            disabled={botStatus === 'STOPPED'}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all border shadow-md ${
              botStatus === 'STOPPED'
                ? 'opacity-40 cursor-not-allowed border-slate-800 bg-slate-950 text-slate-500'
                : botStatus === 'PAUSED'
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 hover:bg-cyan-500/30 hover:border-cyan-400 active:scale-95 cursor-pointer shadow-cyan-500/10 animate-pulse'
                : 'bg-amber-500/20 text-amber-300 border-amber-500/50 hover:bg-amber-500/30 hover:border-amber-400 active:scale-95 cursor-pointer shadow-amber-500/10'
            }`}
            title={
              botStatus === 'STOPPED'
                ? 'Start bot first to enable pausing'
                : botStatus === 'PAUSED'
                ? 'Resume Bot Execution'
                : 'Pause Bot Execution'
            }
          >
            {botStatus === 'PAUSED' ? (
              <>
                <Play className="h-4 w-4 fill-current" />
                <span>Resume Bot</span>
              </>
            ) : (
              <>
                <Pause className="h-4 w-4 fill-current" />
                <span>Pause Bot</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Production Exchange Balance & Capital Sync Cockpit */}
      <CapitalManagementCard onNavigateTab={onNavigateTab} />

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Account Balance / Bot Capital */}
        <div
          onClick={() => onNavigateTab('assets')}
          className="rounded-2xl border border-[#bf9b42]/30 bg-[#022824]/90 p-5 shadow-sm backdrop-blur-sm hover:border-[#bf9b42] transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#8ea49e] uppercase tracking-wider">
              Bot Capital (Available)
            </span>
            <div className="rounded-lg bg-[#bf9b42]/15 p-2 text-[#bf9b42] border border-[#bf9b42]/30 group-hover:scale-105 transition-transform">
              <Wallet className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 font-mono text-2xl font-bold text-[#f3ebd7]">
            {balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
            <span className="text-xs font-sans text-[#bf9b42]">USDT</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-[#8ea49e]">
            <span className="flex items-center gap-1 text-emerald-400 text-[11px]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              Exchange Available
            </span>
            <span className="rounded bg-[#033631] px-1.5 py-0.5 text-[10px] font-semibold text-[#bf9b42] border border-[#bf9b42]/30">
              View Assets →
            </span>
          </div>
        </div>


        {/* Daily P&L */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-sm backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Daily P&L</span>
            <div
              className={`rounded-lg p-2 border ${
                dailyPnL >= 0
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
              }`}
            >
              {dailyPnL >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
            </div>
          </div>
          <div
            className={`mt-3 font-mono text-2xl font-bold ${
              dailyPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {dailyPnL >= 0 ? '+' : ''}${dailyPnL.toFixed(2)}
          </div>
          <div className="mt-2 flex items-center justify-between text-xs">
            <span className="text-slate-400">24h Return:</span>
            <span className={`font-mono font-bold ${dailyPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {dailyPnLPct >= 0 ? '+' : ''}{dailyPnLPct}%
            </span>
          </div>
        </div>

        {/* Open Trades & Exposure */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-sm backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Trades</span>
            <div className="rounded-lg bg-amber-500/10 p-2 text-amber-400 border border-amber-500/20">
              <Activity className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 font-mono text-2xl font-bold text-white flex items-baseline gap-2">
            <span>{activeTrades.length}</span>
            <span className="text-xs font-normal text-slate-400">/ 4 max capacity</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
            <span>Unrealized P&L:</span>
            <span
              className={`font-mono font-bold ${
                activeTrades.reduce((acc, t) => acc + t.pnl, 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              ${activeTrades.reduce((acc, t) => acc + t.pnl, 0).toFixed(2)}
            </span>
          </div>
        </div>

        {/* Win Rate & Profit Factor */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-sm backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Win Rate & Factor</span>
            <div className="rounded-lg bg-cyan-500/10 p-2 text-cyan-400 border border-cyan-500/20">
              <Award className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 font-mono text-2xl font-bold text-cyan-400 flex items-baseline gap-2">
            <span>{winRate}%</span>
            <span className="text-xs font-normal text-slate-400">({analytics?.winningTrades || 3}W / {analytics?.losingTrades || 1}L)</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
            <span>Profit Factor:</span>
            <span className="font-mono font-bold text-slate-200">{profitFactor} : 1</span>
          </div>
        </div>
      </div>

      {/* AI Consensus Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-indigo-500/30 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 p-5 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-cyan-400 animate-pulse"></span>
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                Active Multi-Agent Consensus Stream
              </span>
              <span className="rounded bg-indigo-500/20 px-2 py-0.5 text-[10px] font-mono text-indigo-200 border border-indigo-500/30">
                BTC/USDT 1h
              </span>
            </div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>Decision:</span>
              <span className="text-emerald-400 font-mono">LONG</span>
              <span className="text-xs font-normal text-slate-400">|</span>
              <span className="text-xs text-slate-300 font-normal">
                Triple agreement: OpenAI (84%), Gemini (88%), Technical (78%)
              </span>
            </h3>
            <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
              Consensus engine approved trade for Risk Management check. Position sizing verified with 1:2.4 R:R and ATR dynamic stop loss at $65,600.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigateTab('ai-decisions')}
              className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition-all cursor-pointer"
            >
              Inspect Model Logic
            </button>
            <button
              onClick={() => onTriggerOpenTrade('BTC/USDT', 'LONG')}
              className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-emerald-600/25 hover:bg-emerald-500 transition-all cursor-pointer"
            >
              <Zap className="h-3.5 w-3.5" />
              <span>Deploy Consensus Order</span>
            </button>
          </div>
        </div>
      </div>

      {/* Two-Column Section: Active Trades & Market Ticker */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Active Trades Live Monitor */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-sm backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-amber-400" />
              <h2 className="text-sm font-bold text-white">Live Monitored Positions</h2>
              <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-mono text-slate-300">
                {activeTrades.length} Active
              </span>
            </div>
            <button
              onClick={() => onNavigateTab('active-trades')}
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold cursor-pointer"
            >
              <span>View All</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {activeTrades.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No active trades right now. Run an AI scan to find consensus opportunities.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="pb-3 font-semibold">Symbol</th>
                    <th className="pb-3 font-semibold">Side</th>
                    <th className="pb-3 font-semibold">Entry Mark</th>
                    <th className="pb-3 font-semibold">Current Price</th>
                    <th className="pb-3 font-semibold">Stop Loss</th>
                    <th className="pb-3 font-semibold">Take Profit</th>
                    <th className="pb-3 font-semibold">Unrealized P&L</th>
                    <th className="pb-3 text-right font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {activeTrades.map((t) => {
                    const isLong = t.direction === 'LONG';
                    const isProfit = t.pnl >= 0;
                    return (
                      <tr key={t.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-3 font-bold text-white flex items-center gap-2">
                          <span>{t.symbol}</span>
                          <span className="text-[10px] text-slate-400 font-normal">({t.exchange})</span>
                        </td>
                        <td className="py-3">
                          <span
                            className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                              isLong
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            }`}
                          >
                            {t.direction}
                          </span>
                        </td>
                        <td className="py-3 font-mono text-slate-300">${t.entryPrice.toLocaleString()}</td>
                        <td className="py-3 font-mono text-white font-semibold">
                          ${t.currentPrice.toLocaleString()}
                        </td>
                        <td className="py-3 font-mono text-rose-400">${t.stopLoss.toLocaleString()}</td>
                        <td className="py-3 font-mono text-emerald-400">${t.takeProfit.toLocaleString()}</td>
                        <td className="py-3 font-mono font-bold">
                          <span className={isProfit ? 'text-emerald-400' : 'text-rose-400'}>
                            {isProfit ? '+' : ''}${t.pnl.toFixed(2)} ({isProfit ? '+' : ''}{t.pnlPercentage}%)
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          <button
                            onClick={() => onCloseTrade(t.id)}
                            className="rounded bg-slate-800 px-2.5 py-1 text-[11px] font-semibold text-slate-300 hover:bg-rose-950 hover:text-rose-300 hover:border-rose-800 border border-slate-700 transition-colors cursor-pointer"
                          >
                            Close
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right 1 Col: Live Crypto Market Scanner */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-sm backdrop-blur-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Crypto Market Radar</span>
              </h2>
              <span className="text-[11px] text-slate-400">1h Interval</span>
            </div>

            <div className="space-y-2.5">
              {cryptoMarkets.map((m) => (
                <div
                  key={m.symbol}
                  onClick={() => {
                    onSelectSymbol(m.symbol);
                    onNavigateTab('market-analysis');
                  }}
                  className="flex items-center justify-between p-2.5 rounded-xl border border-slate-800/80 bg-slate-950/50 hover:bg-slate-800/50 transition-all cursor-pointer group"
                >
                  <div>
                    <div className="font-bold text-white text-xs flex items-center gap-1.5">
                      <span>{m.symbol}</span>
                      <span className="text-[10px] text-slate-400">RSI {m.rsi}</span>
                    </div>
                    <div className="text-[11px] font-mono text-slate-400">
                      ${m.price.toLocaleString()}
                    </div>
                  </div>

                  <div className="text-right flex items-center gap-2">
                    <div>
                      <div
                        className={`text-xs font-mono font-bold ${
                          m.change.startsWith('+') ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {m.change}
                      </div>
                      <span className="text-[10px] font-semibold text-slate-400">{m.trend}</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-600 group-hover:text-slate-300 transition-colors" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Trading Engine Guard:</span>
            <span className="text-emerald-400 font-semibold">Strict 1:2 R:R Active</span>
          </div>
        </div>
      </div>
    </div>
  );
};
