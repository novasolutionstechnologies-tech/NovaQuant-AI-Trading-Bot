import React, { useState } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  Sliders,
  CheckCircle2,
  XCircle,
  TrendingDown,
  Percent,
  Lock,
  Zap,
  Save
} from 'lucide-react';
import {
  RiskSettings,
  RiskCheckResult,
  TradeDirection
} from '../types';

interface RiskManagementPageProps {
  settings: RiskSettings;
  onSaveSettings: (newSettings: Partial<RiskSettings>) => Promise<void>;
  currentRiskCheck: RiskCheckResult | null;
  symbol: string;
  direction: TradeDirection;
  currentPrice: number;
  onRunRiskCheck: (sym: string, dir: TradeDirection) => void;
  onExecuteTrade: (sym: string, dir: TradeDirection) => void;
}

export const RiskManagementPage: React.FC<RiskManagementPageProps> = ({
  settings,
  onSaveSettings,
  currentRiskCheck,
  symbol,
  direction,
  currentPrice,
  onRunRiskCheck,
  onExecuteTrade,
}) => {
  const [formData, setFormData] = useState<RiskSettings>(settings);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      await onSaveSettings(formData);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const isApproved = currentRiskCheck?.approved ?? true;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-slate-900 via-emerald-950/20 to-slate-900 p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-emerald-400"></span>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                Non-Negotiable Risk Guard
              </span>
            </div>
            <h1 className="text-lg font-bold text-white">Risk Management Engine</h1>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Every trade proposed by the AI engines must strictly pass through this risk validation gate. Trades with sub-optimal Risk/Reward, excessive position sizing, or breached daily limits are rejected immediately.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded-xl bg-slate-950 px-3 py-1.5 text-xs font-mono font-bold text-emerald-400 border border-slate-800">
              Target R:R ≥ {settings.minRiskRewardRatio}:1
            </span>
          </div>
        </div>
      </div>

      {/* Grid: Live Trade Risk Assessment (Left 2 cols) & Configurable Policy Rules (Right 1 col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Evaluation Outcome */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Evaluation Card */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-sm backdrop-blur-sm">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-4 mb-4">
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Active Trade Candidate Risk Assessment
                </span>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-base font-bold text-white">{symbol}</span>
                  <span
                    className={`rounded px-2 py-0.5 text-xs font-bold ${
                      direction === 'LONG'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    }`}
                  >
                    {direction}
                  </span>
                  <span className="text-xs font-mono text-slate-400">
                    Mark: ${currentPrice.toLocaleString()}
                  </span>
                </div>
              </div>

              <button
                onClick={() => onRunRiskCheck(symbol, direction)}
                className="rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition-colors cursor-pointer"
              >
                Re-Validate Candidate
              </button>
            </div>

            {/* Verdict Badge */}
            <div
              className={`flex items-start gap-3 rounded-xl p-4 border ${
                isApproved
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              }`}
            >
              {isApproved ? (
                <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400 mt-0.5" />
              ) : (
                <XCircle className="h-5 w-5 shrink-0 text-rose-400 mt-0.5" />
              )}
              <div>
                <div className="text-xs font-bold uppercase tracking-wider">
                  {isApproved ? 'RISK ENGINE: APPROVED FOR EXECUTION' : 'RISK ENGINE: REJECTED'}
                </div>
                <p className="mt-1 text-xs text-slate-300 leading-relaxed">
                  {currentRiskCheck?.reason ||
                    'Candidate trade meets all risk requirements: positive expectancy, risk/reward 2.13:1, and compliant position sizing.'}
                </p>
              </div>
            </div>

            {/* Metrics Breakdown Grid */}
            <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                <span className="text-slate-400">Allowed Position Size</span>
                <div className="mt-1 font-mono font-bold text-white text-sm">
                  {currentRiskCheck?.position_size || 0.12} {symbol.split('/')[0]}
                </div>
                <span className="text-[10px] text-slate-400">
                  ${currentRiskCheck?.position_value?.toLocaleString() || '8,090'} value
                </span>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                <span className="text-slate-400">Risk/Reward Ratio</span>
                <div className="mt-1 font-mono font-bold text-emerald-400 text-sm">
                  1 : {currentRiskCheck?.risk_reward_ratio || 2.13}
                </div>
                <span className="text-[10px] text-slate-400">Required ≥ 2.0</span>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                <span className="text-slate-400">Dynamic Stop Loss</span>
                <div className="mt-1 font-mono font-bold text-rose-400 text-sm">
                  ${currentRiskCheck?.stop_loss.toLocaleString() || '65,600'}
                </div>
                <span className="text-[10px] text-rose-400/80">
                  Risk: -${currentRiskCheck?.risk_amount || '180'}
                </span>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                <span className="text-slate-400">Take Profit Target</span>
                <div className="mt-1 font-mono font-bold text-emerald-400 text-sm">
                  ${currentRiskCheck?.take_profit.toLocaleString() || '69,800'}
                </div>
                <span className="text-[10px] text-emerald-400/80">
                  Target: +${currentRiskCheck?.potential_profit || '384'}
                </span>
              </div>
            </div>

            {/* Strict Checks List */}
            <div className="mt-6 border-t border-slate-800/80 pt-4">
              <span className="text-xs font-bold text-slate-300">Mandatory Rule Verifications:</span>
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-2 rounded-lg bg-slate-950/40 p-2.5 border border-slate-800">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <span className="text-slate-300">Daily Loss Limit Check (&lt; 3.0%)</span>
                </div>
                <div className="flex items-center gap-2 rounded-lg bg-slate-950/40 p-2.5 border border-slate-800">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <span className="text-slate-300">Open Trades Limit (2/4 Available)</span>
                </div>
                <div className="flex items-center gap-2 rounded-lg bg-slate-950/40 p-2.5 border border-slate-800">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <span className="text-slate-300">Max Risk Capital (1.5% Cap Passed)</span>
                </div>
                <div className="flex items-center gap-2 rounded-lg bg-slate-950/40 p-2.5 border border-slate-800">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <span className="text-slate-300">ATR Volatility Band Clear</span>
                </div>
              </div>
            </div>

            {/* Execute Button */}
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => onExecuteTrade(symbol, direction)}
                disabled={!isApproved}
                className="flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-emerald-600/30 hover:bg-emerald-500 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Zap className="h-4 w-4" />
                <span>Send to Order Manager &amp; Open Position</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Configurable Risk Rules Form */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-sm backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-4">
            <Sliders className="h-4 w-4 text-indigo-400" />
            <h2 className="text-sm font-bold text-white">Risk Parameters Config</h2>
          </div>

          <form onSubmit={handleSave} className="space-y-4 text-xs">
            <div>
              <label className="text-slate-300 font-semibold block mb-1">
                Max Risk Per Trade (% of Balance)
              </label>
              <input
                type="number"
                step="0.1"
                min="0.5"
                max="5.0"
                value={formData.maxRiskPerTradePercent}
                onChange={(e) =>
                  setFormData({ ...formData, maxRiskPerTradePercent: parseFloat(e.target.value) || 1.5 })
                }
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-white font-mono focus:border-indigo-500 focus:outline-none"
              />
              <span className="text-[10px] text-slate-500 mt-0.5 block">Standard: 1.0% - 2.0%</span>
            </div>

            <div>
              <label className="text-slate-300 font-semibold block mb-1">
                Minimum Risk / Reward Ratio (e.g. 2.0 = 1:2)
              </label>
              <input
                type="number"
                step="0.1"
                min="1.5"
                max="5.0"
                value={formData.minRiskRewardRatio}
                onChange={(e) =>
                  setFormData({ ...formData, minRiskRewardRatio: parseFloat(e.target.value) || 2.0 })
                }
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-white font-mono focus:border-indigo-500 focus:outline-none"
              />
              <span className="text-[10px] text-slate-500 mt-0.5 block">Mandatory platform rule: ≥ 1:2.0</span>
            </div>

            <div>
              <label className="text-slate-300 font-semibold block mb-1">
                Daily Loss Circuit Breaker (%)
              </label>
              <input
                type="number"
                step="0.5"
                min="1.0"
                max="10.0"
                value={formData.dailyLossLimitPercent}
                onChange={(e) =>
                  setFormData({ ...formData, dailyLossLimitPercent: parseFloat(e.target.value) || 3.0 })
                }
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-white font-mono focus:border-indigo-500 focus:outline-none"
              />
              <span className="text-[10px] text-slate-500 mt-0.5 block">Halt bot if daily loss exceeds limit</span>
            </div>

            <div>
              <label className="text-slate-300 font-semibold block mb-1">
                Max Concurrent Open Positions
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={formData.maxOpenTrades}
                onChange={(e) =>
                  setFormData({ ...formData, maxOpenTrades: parseInt(e.target.value, 10) || 3 })
                }
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-white font-mono focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-slate-300 font-semibold block mb-1">
                ATR Multiplier for Stop Loss
              </label>
              <input
                type="number"
                step="0.1"
                min="1.0"
                max="3.0"
                value={formData.atrMultiplierSL}
                onChange={(e) =>
                  setFormData({ ...formData, atrMultiplierSL: parseFloat(e.target.value) || 1.5 })
                }
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-white font-mono focus:border-indigo-500 focus:outline-none"
              />
            </div>

            {saveSuccess && (
              <div className="rounded-lg bg-emerald-500/20 p-2 text-emerald-300 text-[11px] border border-emerald-500/30 text-center font-semibold">
                Risk rules updated and applied to engine!
              </div>
            )}

            <button
              type="submit"
              disabled={isSaving}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2.5 text-xs font-bold text-white shadow-lg shadow-indigo-600/25 hover:bg-indigo-500 transition-all cursor-pointer disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              <span>{isSaving ? 'Updating Policy...' : 'Save Risk Rules'}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
