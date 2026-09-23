import React, { useState } from 'react';
import {
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  Zap,
  Clock,
  ExternalLink,
  AlertCircle,
  AlertTriangle,
  Sliders,
  X,
  Check,
  Radio,
  FileText
} from 'lucide-react';
import { ActiveTrade } from '../types';
import { updateTradeSlTpApi, triggerEmergencyStopApi } from '../services/api';

interface ActiveTradesPageProps {
  trades: ActiveTrade[];
  onCloseTrade: (tradeId: string) => Promise<void>;
  onNavigateTab: (tab: any) => void;
  wsConnected?: boolean;
}

export const ActiveTradesPage: React.FC<ActiveTradesPageProps> = ({
  trades,
  onCloseTrade,
  onNavigateTab,
  wsConnected = true,
}) => {
  const [editingTrade, setEditingTrade] = useState<ActiveTrade | null>(null);
  const [editSl, setEditSl] = useState<number>(0);
  const [editTp, setEditTp] = useState<number>(0);
  const [isUpdating, setIsUpdating] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [isEmergencyStopping, setIsEmergencyStopping] = useState(false);

  const totalUnrealizedPnL = trades.reduce((acc, t) => acc + t.pnl, 0);

  const showNotice = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 3500);
  };

  const handleOpenEditSlTp = (t: ActiveTrade) => {
    setEditingTrade(t);
    setEditSl(t.stopLoss);
    setEditTp(t.takeProfit);
  };

  const handleSaveSlTp = async () => {
    if (!editingTrade) return;
    setIsUpdating(true);
    try {
      await updateTradeSlTpApi(editingTrade.id, {
        stop_loss: editSl,
        take_profit: editTp,
      });
      // Update local object
      editingTrade.stopLoss = editSl;
      editingTrade.takeProfit = editTp;
      showNotice(`Updated SL ($${editSl}) & TP ($${editTp}) for ${editingTrade.symbol}`);
      setEditingTrade(null);
    } catch (err: any) {
      showNotice(err.message || 'Failed to update SL/TP');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleEmergencyStop = async () => {
    if (!window.confirm('EMERGENCY STOP WARNING: This will immediately close ALL open positions at market price and halt the bot. Continue?')) {
      return;
    }
    setIsEmergencyStopping(true);
    try {
      const res = await triggerEmergencyStopApi(true);
      showNotice(`Emergency stop triggered: ${res.closedTradesCount} positions liquidated at market mark.`);
    } catch (err: any) {
      showNotice(err.message || 'Emergency stop failed');
    } finally {
      setIsEmergencyStopping(false);
    }
  };

  // Live calculations for the edit modal
  const editPrice = editingTrade?.currentPrice || 1;
  const editRiskDist = Math.abs(editPrice - editSl);
  const editRewardDist = Math.abs(editTp - editPrice);
  const editLiveRR = editRiskDist > 0 ? Number((editRewardDist / editRiskDist).toFixed(2)) : 0;
  const editDirectionValid = editingTrade
    ? editingTrade.direction === 'LONG'
      ? editSl < editPrice && editTp > editPrice
      : editSl > editPrice && editTp < editPrice
    : true;

  return (
    <div className="space-y-6">
      {/* Toast Notice */}
      {actionNotice && (
        <div className="fixed top-5 right-5 z-50 rounded-xl border border-[#bf9b42]/50 bg-[#022824] px-4 py-2.5 text-xs font-semibold text-[#f5e6b3] shadow-xl">
          {actionNotice}
        </div>
      )}

      {/* Top Banner with Background #033631 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-[#bf9b42]/30 bg-[#033631]/90 p-5 shadow-lg backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#bf9b42]/20 text-[#bf9b42] border border-[#bf9b42]/40">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-[#f5e6b3] flex items-center gap-2">
                <span>Live Position Monitor &amp; Execution Watcher</span>
                <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold border border-emerald-500/40 bg-emerald-950/70 text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  {wsConnected ? 'WS STREAM ACTIVE' : 'WS RECONNECTING'}
                </span>
              </h1>
              <p className="text-xs text-[#bf9b42]/80 mt-0.5">
                Real-time mark updates, dynamic ATR stop-loss defense triggers, and non-custodial exchange order routing.
              </p>
            </div>
          </div>
        </div>

        {/* Unrealized PnL & Emergency Stop Button */}
        <div className="flex items-center gap-3">
          <div className="text-right px-3 py-1.5 rounded-xl border border-[#bf9b42]/20 bg-[#022824]">
            <span className="text-[10px] text-[#bf9b42]/80 uppercase tracking-wider block">Total Unrealized P&amp;L</span>
            <div
              className={`font-mono text-lg font-bold ${
                totalUnrealizedPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {totalUnrealizedPnL >= 0 ? '+' : ''}${totalUnrealizedPnL.toFixed(2)}
            </div>
          </div>

          <button
            onClick={handleEmergencyStop}
            disabled={isEmergencyStopping || trades.length === 0}
            className="flex items-center gap-1.5 rounded-xl border border-rose-500/50 bg-rose-950/40 px-3.5 py-2.5 text-xs font-bold text-rose-300 hover:bg-rose-900/60 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            title="Liquidate all active trades immediately and stop bot"
          >
            <AlertTriangle className="h-4 w-4 text-rose-400" />
            <span>Emergency Kill Switch</span>
          </button>

          <button
            onClick={() => onNavigateTab('audit-logs')}
            className="flex items-center gap-1.5 rounded-xl border border-[#bf9b42]/40 bg-[#022824] px-3.5 py-2.5 text-xs font-semibold text-[#f5e6b3] hover:bg-[#04443e] transition-colors cursor-pointer"
          >
            <FileText className="h-4 w-4 text-[#bf9b42]" />
            <span>Transaction &amp; Regulatory Audit</span>
          </button>
        </div>
      </div>

      {/* Trades Table Container with #033631 Background */}
      <div className="rounded-2xl border border-[#bf9b42]/30 bg-[#033631]/80 p-5 shadow-lg backdrop-blur-md">
        {trades.length === 0 ? (
          <div className="py-16 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#022824] text-[#bf9b42] border border-[#bf9b42]/30 mb-3">
              <Zap className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-bold text-[#f5e6b3]">No Open Positions</h3>
            <p className="mt-1 text-xs text-[#bf9b42]/70 max-w-sm mx-auto">
              All previous orders have either hit their take-profit target, stop-loss defense, or were closed.
            </p>
            <div className="mt-4 flex items-center justify-center gap-2">
              <button
                onClick={() => onNavigateTab('ai-decisions')}
                className="rounded-xl bg-[#bf9b42] px-4 py-2 text-xs font-bold text-[#022824] hover:bg-[#d4ad4e] transition-colors cursor-pointer"
              >
                Scan AI Market Opportunities
              </button>
              <button
                onClick={() => onNavigateTab('audit-logs')}
                className="rounded-xl border border-[#bf9b42]/40 bg-[#022824] px-4 py-2 text-xs font-semibold text-[#f5e6b3] hover:bg-[#04443e] transition-colors cursor-pointer"
              >
                View Audit Log History
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#bf9b42]/20 text-[#bf9b42]/70 bg-[#022824]/60">
                  <th className="py-3 px-3 font-semibold">Position</th>
                  <th className="py-3 px-3 font-semibold">Size</th>
                  <th className="py-3 px-3 font-semibold">Entry Mark</th>
                  <th className="py-3 px-3 font-semibold">Live Price</th>
                  <th className="py-3 px-3 font-semibold">Stop Loss (ATR)</th>
                  <th className="py-3 px-3 font-semibold">Take Profit</th>
                  <th className="py-3 px-3 font-semibold">R:R Ratio</th>
                  <th className="py-3 px-3 font-semibold">Unrealized P&amp;L</th>
                  <th className="py-3 px-3 font-semibold">Protection</th>
                  <th className="py-3 px-3 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#bf9b42]/15">
                {trades.map((t) => {
                  const isLong = t.direction === 'LONG';
                  const isProfit = t.pnl >= 0;
                  const rrRatio = t.riskRewardRatio || 2.4;

                  return (
                    <tr key={t.id} className="hover:bg-[#022824]/50 transition-colors">
                      <td className="py-3.5 px-3">
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
                            <div className="font-bold text-[#f5e6b3]">{t.symbol}</div>
                            <div className="text-[10px] text-[#bf9b42]/70">
                              {t.exchange} • {t.mode}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-3 font-mono">
                        <div className="font-bold text-[#f5e6b3]">
                          {t.positionSize} {t.symbol.split('/')[0]}
                        </div>
                        <div className="text-[10px] text-[#bf9b42]/60">
                          ${(t.positionSize * t.entryPrice).toLocaleString(undefined, { maximumFractionDigits: 1 })}
                        </div>
                      </td>

                      <td className="py-3.5 px-3 font-mono font-bold text-[#f5e6b3]">
                        ${t.entryPrice.toLocaleString()}
                      </td>

                      <td className="py-3.5 px-3 font-mono font-bold text-[#f5e6b3]">
                        <span className="flex items-center gap-1">
                          ${t.currentPrice.toLocaleString()}
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                        </span>
                      </td>

                      <td className="py-3.5 px-3 font-mono">
                        <div className="font-bold text-rose-400">
                          ${t.stopLoss.toLocaleString()}
                        </div>
                        <div className="text-[10px] text-rose-400/80">
                          -{Math.abs(((t.entryPrice - t.stopLoss) / t.entryPrice) * 100).toFixed(1)}%
                        </div>
                      </td>

                      <td className="py-3.5 px-3 font-mono">
                        <div className="font-bold text-emerald-400">
                          ${t.takeProfit.toLocaleString()}
                        </div>
                        <div className="text-[10px] text-emerald-400/80">
                          +{Math.abs(((t.takeProfit - t.entryPrice) / t.entryPrice) * 100).toFixed(1)}%
                        </div>
                      </td>

                      <td className="py-3.5 px-3">
                        <span
                          className={`rounded px-1.5 py-0.5 font-mono text-[10px] font-bold ${
                            rrRatio >= 2.0
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : 'bg-amber-500/20 text-amber-300'
                          }`}
                        >
                          1:{rrRatio}
                        </span>
                      </td>

                      <td className="py-3.5 px-3 font-mono whitespace-nowrap">
                        <div className={`font-bold ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {isProfit ? '+' : ''}${t.pnl.toFixed(2)}
                        </div>
                        <div className={`text-[10px] ${isProfit ? 'text-emerald-400/80' : 'text-rose-400/80'}`}>
                          {isProfit ? '+' : ''}{t.pnlPercentage.toFixed(2)}%
                        </div>
                      </td>

                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <button
                          onClick={() => handleOpenEditSlTp(t)}
                          className="flex items-center gap-1 rounded-lg border border-[#bf9b42]/30 bg-[#022824] px-2 py-1 text-[11px] text-[#f5e6b3] hover:border-[#bf9b42] cursor-pointer"
                          title="Modify Stop-Loss / Take-Profit"
                        >
                          <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                          <span>SL/TP Guard</span>
                        </button>
                      </td>

                      <td className="py-3.5 px-3 text-right whitespace-nowrap">
                        <button
                          onClick={() => onCloseTrade(t.id)}
                          className="rounded-lg border border-rose-500/40 bg-rose-950/40 px-2.5 py-1 text-[11px] font-bold text-rose-300 hover:bg-rose-900/60 transition-colors cursor-pointer"
                        >
                          Market Close
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

      {/* Edit SL/TP Modal */}
      {editingTrade && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
          <div className="w-full max-w-md rounded-2xl border border-[#bf9b42]/40 bg-[#033631] p-5 shadow-2xl text-[#bf9b42]">
            <div className="flex items-center justify-between border-b border-[#bf9b42]/20 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-emerald-400" />
                <h3 className="text-sm font-bold text-[#f5e6b3]">
                  Adjust Stop-Loss &amp; Take-Profit Protection
                </h3>
              </div>
              <button
                onClick={() => setEditingTrade(null)}
                className="rounded-lg p-1 text-[#bf9b42]/70 hover:bg-[#022824] hover:text-[#f5e6b3] cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-3 text-xs">
              <div className="rounded-xl border border-[#bf9b42]/20 bg-[#022824] p-3 mb-3">
                <div className="flex justify-between items-center text-[#f5e6b3]">
                  <span className="font-bold">{editingTrade.symbol} ({editingTrade.direction})</span>
                  <span className="font-mono text-emerald-400">Mark: ${editingTrade.currentPrice}</span>
                </div>
                <div className="text-[11px] text-[#bf9b42]/70 mt-1">
                  Entry: ${editingTrade.entryPrice} • Size: {editingTrade.positionSize}
                </div>
              </div>

              {/* Stop Loss Field */}
              <div className="mb-3">
                <label className="text-[11px] font-semibold text-rose-300">
                  Stop Loss Defense ($)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={editSl}
                  onChange={(e) => setEditSl(parseFloat(e.target.value) || 0)}
                  className="mt-1 w-full rounded-lg border border-rose-500/40 bg-[#022824] px-3 py-1.5 font-mono text-xs font-bold text-rose-300 focus:border-rose-400 focus:outline-none"
                />
                <span className="text-[10px] text-rose-400/80 mt-0.5 block">
                  Distance: ${Math.abs(editPrice - editSl).toFixed(2)} ({((Math.abs(editPrice - editSl) / editPrice) * 100).toFixed(2)}%)
                </span>
              </div>

              {/* Take Profit Field */}
              <div className="mb-3">
                <label className="text-[11px] font-semibold text-emerald-300">
                  Take Profit Target ($)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={editTp}
                  onChange={(e) => setEditTp(parseFloat(e.target.value) || 0)}
                  className="mt-1 w-full rounded-lg border border-emerald-500/40 bg-[#022824] px-3 py-1.5 font-mono text-xs font-bold text-emerald-300 focus:border-emerald-400 focus:outline-none"
                />
                <span className="text-[10px] text-emerald-400/80 mt-0.5 block">
                  Distance: ${Math.abs(editTp - editPrice).toFixed(2)} ({((Math.abs(editTp - editPrice) / editPrice) * 100).toFixed(2)}%)
                </span>
              </div>

              {/* Live R:R result */}
              <div className="rounded-xl border border-[#bf9b42]/20 bg-[#022824] p-2.5 flex items-center justify-between">
                <span className="text-[11px] text-[#f5e6b3]">Recalculated R:R Ratio</span>
                <span
                  className={`font-mono font-bold ${
                    editLiveRR >= 2.0 ? 'text-emerald-400' : 'text-amber-400'
                  }`}
                >
                  1 : {editLiveRR}
                </span>
              </div>

              {!editDirectionValid && (
                <div className="mt-2 text-[11px] text-rose-400 bg-rose-950/40 p-2 rounded-lg border border-rose-500/30">
                  Warning: For a {editingTrade.direction} trade, Stop-Loss must be {editingTrade.direction === 'LONG' ? 'below' : 'above'} the current price.
                </div>
              )}
            </div>

            <div className="mt-4 flex justify-end gap-2 border-t border-[#bf9b42]/20 pt-3">
              <button
                onClick={() => setEditingTrade(null)}
                className="rounded-lg border border-[#bf9b42]/30 bg-[#022824] px-3 py-1.5 text-xs text-[#bf9b42] cursor-pointer"
              >
                Cancel
              </button>
              <button
                disabled={!editDirectionValid || isUpdating}
                onClick={handleSaveSlTp}
                className="rounded-lg bg-[#bf9b42] px-4 py-1.5 text-xs font-bold text-[#022824] hover:bg-[#d4ad4e] disabled:opacity-40 cursor-pointer"
              >
                {isUpdating ? 'Saving...' : 'Apply Protection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
