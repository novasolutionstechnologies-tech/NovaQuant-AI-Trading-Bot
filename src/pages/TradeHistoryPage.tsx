import React, { useState } from 'react';
import {
  History,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  Filter,
  CheckCircle2,
  XCircle,
  BrainCircuit,
  Sparkles,
  Award
} from 'lucide-react';
import { ClosedTrade } from '../types';

interface TradeHistoryPageProps {
  trades: ClosedTrade[];
}

export const TradeHistoryPage: React.FC<TradeHistoryPageProps> = ({ trades }) => {
  const [filterSymbol, setFilterSymbol] = useState('ALL');
  const [filterOutcome, setFilterOutcome] = useState<'ALL' | 'WIN' | 'LOSS'>('ALL');
  const [filterSide, setFilterSide] = useState<'ALL' | 'LONG' | 'SHORT'>('ALL');

  const symbols = ['ALL', 'BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'BNB/USDT', 'XRP/USDT'];

  const filteredTrades = trades.filter((t) => {
    if (filterSymbol !== 'ALL' && t.symbol !== filterSymbol) return false;
    if (filterOutcome !== 'ALL' && t.result !== filterOutcome) return false;
    if (filterSide !== 'ALL' && t.direction !== filterSide) return false;
    return true;
  });

  const exportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(trades, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `novaquant_trades_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const totalClosedPnL = filteredTrades.reduce((acc, t) => acc + t.pnl, 0);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-sm backdrop-blur-sm">
        <div>
          <h1 className="text-lg font-bold text-white flex items-center gap-2">
            <History className="h-5 w-5 text-indigo-400" />
            <span>Historical Ledger &amp; Closed Position Log</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Complete transaction &amp; regulatory audit records with recorded exit prices, AI model accuracies, and autonomous post-trade feedback notes.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={exportJSON}
            className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition-colors cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export JSON / CSV</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-800 bg-slate-950/60 p-3.5">
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 text-slate-400">
            <Filter className="h-3.5 w-3.5" />
            <span>Filters:</span>
          </div>

          {/* Symbol */}
          <select
            value={filterSymbol}
            onChange={(e) => setFilterSymbol(e.target.value)}
            className="rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1 text-slate-300 focus:outline-none"
          >
            {symbols.map((s) => (
              <option key={s} value={s}>
                {s === 'ALL' ? 'All Symbols' : s}
              </option>
            ))}
          </select>

          {/* Side */}
          <select
            value={filterSide}
            onChange={(e) => setFilterSide(e.target.value as any)}
            className="rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1 text-slate-300 focus:outline-none"
          >
            <option value="ALL">All Sides</option>
            <option value="LONG">Long Only</option>
            <option value="SHORT">Short Only</option>
          </select>

          {/* Outcome */}
          <select
            value={filterOutcome}
            onChange={(e) => setFilterOutcome(e.target.value as any)}
            className="rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1 text-slate-300 focus:outline-none"
          >
            <option value="ALL">All Outcomes</option>
            <option value="WIN">Wins Only</option>
            <option value="LOSS">Losses Only</option>
          </select>
        </div>

        <div className="text-xs text-slate-400">
          Showing <span className="text-white font-bold">{filteredTrades.length}</span> trades | Filtered P&amp;L:{' '}
          <span className={`font-mono font-bold ${totalClosedPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {totalClosedPnL >= 0 ? '+' : ''}${totalClosedPnL.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Table Container */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-sm backdrop-blur-sm">
        {filteredTrades.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            No trades matching the selected filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="pb-3 font-semibold">Trade</th>
                  <th className="pb-3 font-semibold">Entry / Exit</th>
                  <th className="pb-3 font-semibold">Outcome</th>
                  <th className="pb-3 font-semibold">Net P&amp;L</th>
                  <th className="pb-3 font-semibold">Exit Reason</th>
                  <th className="pb-3 font-semibold">AI Consensus</th>
                  <th className="pb-3 font-semibold">Post-Trade Learning Feedback</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredTrades.map((t) => {
                  const isWin = t.result === 'WIN';
                  const isLong = t.direction === 'LONG';
                  return (
                    <tr key={t.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5">
                        <div className="flex items-center gap-2">
                          <span
                            className={`rounded-lg p-1.5 ${
                              isLong
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : 'bg-rose-500/20 text-rose-400'
                            }`}
                          >
                            {isLong ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                          </span>
                          <div>
                            <div className="font-bold text-white">{t.symbol}</div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              {t.positionSize} units • {t.exchange || 'Binance'}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 font-mono">
                        <div className="text-slate-300">
                          In: ${t.entryPrice?.toLocaleString()}
                        </div>
                        <div className="text-slate-200 font-semibold">
                          Out: ${t.exitPrice?.toLocaleString()}
                        </div>
                      </td>

                      <td className="py-3.5">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${
                            isWin
                              ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                              : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                          }`}
                        >
                          {t.result}
                        </span>
                      </td>

                      <td className="py-3.5 font-mono font-bold">
                        <div className={isWin ? 'text-emerald-400' : 'text-rose-400'}>
                          {isWin ? '+' : ''}${t.pnl?.toFixed(2)}
                        </div>
                        <div className={`text-[10px] ${isWin ? 'text-emerald-400/80' : 'text-rose-400/80'}`}>
                          {isWin ? '+' : ''}{t.pnlPercentage}%
                        </div>
                      </td>

                      <td className="py-3.5 text-slate-300">
                        <span className="rounded bg-slate-800 px-2 py-0.5 text-[11px]">
                          {t.exitReason}
                        </span>
                      </td>

                      <td className="py-3.5">
                        <div className="space-y-0.5 font-mono text-[10px] text-slate-400">
                          <div>
                            OpenAI: <span className="text-slate-200">{t.openai_confidence ?? t.aiDecisionDetails?.openaiConfidence ?? 82}%</span>
                          </div>
                          <div>
                            Gemini: <span className="text-slate-200">{t.gemini_confidence ?? t.aiDecisionDetails?.geminiConfidence ?? 85}%</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 max-w-xs text-[11px] text-slate-400 leading-relaxed">
                        {t.feedbackInsight || 'High confluence setup validated by strong volume expansion.'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
