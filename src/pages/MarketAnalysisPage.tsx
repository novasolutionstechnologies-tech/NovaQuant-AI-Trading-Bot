import React, { useState } from 'react';
import {
  LineChart,
  Cpu,
  BrainCircuit,
  TrendingUp,
  TrendingDown,
  Activity,
  Zap,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  SlidersHorizontal
} from 'lucide-react';
import { CandleChart } from '../components/CandleChart';
import { Candle, TechnicalAnalysisResult, MarketData, TradeDirection } from '../types';

interface MarketAnalysisPageProps {
  symbol: string;
  onSelectSymbol: (sym: string) => void;
  candles: Candle[];
  technical: TechnicalAnalysisResult | null;
  marketData: MarketData | null;
  onTriggerDualAI: (sym: string) => void;
  onTriggerOpenTrade: (sym: string, dir: TradeDirection) => void;
  isScanning: boolean;
}

export const MarketAnalysisPage: React.FC<MarketAnalysisPageProps> = ({
  symbol,
  onSelectSymbol,
  candles,
  technical,
  marketData,
  onTriggerDualAI,
  onTriggerOpenTrade,
  isScanning,
}) => {
  const [timeframe, setTimeframe] = useState('1h');

  const symbols = ['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'BNB/USDT', 'XRP/USDT'];
  const timeframes = ['1m', '5m', '15m', '1h', '4h', '1d'];

  const decision = technical?.decision || 'LONG';
  const confidence = technical?.confidence || 78;
  const trend = technical?.trend || 'BULLISH';
  const indicators = technical?.indicators;

  return (
    <div className="space-y-6">
      {/* Top Controls Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 shadow-sm backdrop-blur-sm">
        {/* Symbol Selector Pills */}
        <div className="flex items-center gap-2 overflow-x-auto">
          {symbols.map((sym) => (
            <button
              key={sym}
              onClick={() => onSelectSymbol(sym)}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                symbol === sym
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 border border-indigo-500'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {sym}
            </button>
          ))}
        </div>

        {/* Timeframe Selector & Actions */}
        <div className="flex items-center gap-3">
          <div className="flex items-center rounded-xl bg-slate-950 p-1 border border-slate-800">
            {timeframes.map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors cursor-pointer ${
                  timeframe === tf ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>

          <button
            onClick={() => onTriggerDualAI(symbol)}
            disabled={isScanning}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-indigo-600/25 hover:from-indigo-500 hover:to-cyan-500 transition-all cursor-pointer disabled:opacity-50"
          >
            <BrainCircuit className={`h-4 w-4 ${isScanning ? 'animate-spin' : ''}`} />
            <span>Send to Dual-AI Engines</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Chart on Left, Technical Analysis Verdict on Right */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Chart Column (2 Cols on Large) */}
        <div className="xl:col-span-2 space-y-4">
          <CandleChart
            candles={candles}
            symbol={symbol}
            timeframe={timeframe}
            indicators={indicators}
          />
        </div>

        {/* Technical Analysis Output Panel (Right Column) */}
        <div className="space-y-4">
          {/* Signal Header Card */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-sm backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Technical Engine Signal
              </span>
              <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-mono text-slate-300">
                Rule-Based Algorithmic
              </span>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <div>
                <span
                  className={`inline-block rounded-xl px-3.5 py-1.5 text-base font-extrabold border ${
                    decision === 'LONG'
                      ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                      : decision === 'SHORT'
                      ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                      : 'bg-slate-800 text-slate-300 border-slate-700'
                  }`}
                >
                  {decision} SIGNAL
                </span>
                <div className="mt-1 text-xs text-slate-400">
                  Trend Regime: <span className="font-semibold text-slate-200">{trend}</span>
                </div>
              </div>

              <div className="text-right">
                <div className="font-mono text-2xl font-bold text-white">{confidence}%</div>
                <div className="text-[10px] text-slate-400">Signal Confidence</div>
              </div>
            </div>

            {/* Indicator Quick Readout */}
            <div className="mt-5 grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-2.5">
                <span className="text-slate-400">RSI (14)</span>
                <div className="mt-0.5 font-mono font-bold text-slate-200">
                  {indicators?.rsi || 58.4}
                </div>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-2.5">
                <span className="text-slate-400">MACD Histogram</span>
                <div
                  className={`mt-0.5 font-mono font-bold ${
                    (indicators?.macd.histogram || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {(indicators?.macd.histogram || 0) >= 0 ? '+' : ''}
                  {indicators?.macd.histogram || 18.2}
                </div>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-2.5">
                <span className="text-slate-400">EMA 21 Level</span>
                <div className="mt-0.5 font-mono font-bold text-slate-200">
                  ${indicators?.ema21.toLocaleString() || '64,800'}
                </div>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-2.5">
                <span className="text-slate-400">ATR Volatility</span>
                <div className="mt-0.5 font-mono font-bold text-slate-200">
                  ${indicators?.atr.toLocaleString() || '850'}
                </div>
              </div>
            </div>

            {/* Structured Reasons List */}
            <div className="mt-5">
              <div className="text-xs font-bold text-slate-300 mb-2">Signal Rationale:</div>
              <div className="space-y-2">
                {(technical?.reasons || [
                  'RSI is in healthy bullish momentum zone above 50',
                  'MACD bullish crossover with expanding green histogram',
                  'Price established above 21 and 50 EMA lines',
                ]).map((reason, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-slate-300">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{reason}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Action Button */}
            <div className="mt-6 pt-4 border-t border-slate-800/80">
              <button
                onClick={() => onTriggerOpenTrade(symbol, decision)}
                disabled={decision === 'HOLD'}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2.5 text-xs font-bold text-white shadow-lg shadow-indigo-600/25 hover:bg-indigo-500 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Zap className="h-4 w-4" />
                <span>Prepare Risk Check for {decision}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
