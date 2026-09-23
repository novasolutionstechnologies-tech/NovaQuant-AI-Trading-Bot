import React, { useState } from 'react';
import {
  BrainCircuit,
  Cpu,
  Sparkles,
  ShieldCheck,
  Zap,
  CheckCircle2,
  XCircle,
  AlertOctagon,
  RefreshCw,
  Scale,
  ArrowRight
} from 'lucide-react';
import {
  AIEngineDecision,
  TechnicalAnalysisResult,
  AIConsensusResult,
  TradeDirection
} from '../types';

interface AIDecisionPageProps {
  symbol: string;
  onSelectSymbol: (sym: string) => void;
  openAIResult: AIEngineDecision | null;
  geminiResult: AIEngineDecision | null;
  technicalResult: TechnicalAnalysisResult | null;
  consensusResult: AIConsensusResult | null;
  isScanning: boolean;
  onRunDualAIScan: (sym: string) => void;
  onProceedToRiskCheck: (sym: string, direction: TradeDirection) => void;
}

export const AIDecisionPage: React.FC<AIDecisionPageProps> = ({
  symbol,
  onSelectSymbol,
  openAIResult,
  geminiResult,
  technicalResult,
  consensusResult,
  isScanning,
  onRunDualAIScan,
  onProceedToRiskCheck,
}) => {
  const symbols = ['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'BNB/USDT', 'XRP/USDT'];

  const opDecision = openAIResult?.decision || 'LONG';
  const opConf = openAIResult?.confidence || 82;
  const opReason = openAIResult?.reason || 'Multi-timeframe liquidity sweep and orderbook depth confirm strong bullish support.';

  const gemDecision = geminiResult?.decision || 'LONG';
  const gemConf = geminiResult?.confidence || 88;
  const gemReason = geminiResult?.reason || 'Quantitative neural analysis detects sustained momentum above 21 EMA with expansion on RSI.';

  const techDecision = technicalResult?.decision || 'LONG';
  const techConf = technicalResult?.confidence || 78;

  const finalConsensus = consensusResult?.final_consensus || 'LONG';
  const approved = consensusResult?.approved_for_risk_check ?? true;
  const consensusScore = consensusResult?.consensusScore || 84;
  const consensusReasoning = consensusResult?.reasoning || 'Triple-Engine Unanimous Agreement: OpenAI, Gemini, and Technical Analysis all signal LONG.';

  return (
    <div className="space-y-6">
      {/* Top Header & Symbol Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 shadow-sm backdrop-blur-sm">
        <div>
          <h1 className="text-lg font-bold text-white flex items-center gap-2">
            <BrainCircuit className="h-5 w-5 text-indigo-400" />
            <span>Dual-AI Consensus Engine</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Two independent AI networks cross-evaluate market data with technical indicator rules. Neither AI can directly place trades.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {/* Symbol Selector */}
          <div className="flex items-center overflow-x-auto max-w-full rounded-xl bg-slate-950 p-1 border border-slate-800">
            {symbols.map((sym) => (
              <button
                key={sym}
                onClick={() => onSelectSymbol(sym)}
                className={`rounded-lg px-2.5 sm:px-3 py-1 text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  symbol === sym ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {sym}
              </button>
            ))}
          </div>

          <button
            onClick={() => onRunDualAIScan(symbol)}
            disabled={isScanning}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 px-3.5 sm:px-4 py-2 text-xs font-bold text-white shadow-md shadow-indigo-600/25 hover:from-indigo-500 hover:to-indigo-600 transition-all cursor-pointer disabled:opacity-50 whitespace-nowrap"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isScanning ? 'animate-spin' : ''}`} />
            <span>{isScanning ? 'Querying...' : 'Run Analysis'}</span>
          </button>
        </div>
      </div>

      {/* 3 Side-by-Side Model Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 1. OpenAI Engine Card */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-sm backdrop-blur-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-400 border border-emerald-500/20">
                  <Cpu className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white">OpenAI Engine</h3>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {openAIResult?.model || 'gpt-4o-mini'}
                  </span>
                </div>
              </div>
              <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-mono text-slate-400">
                {openAIResult?.latencyMs || 280}ms
              </span>
            </div>

            {/* Decision & Confidence */}
            <div className="mt-5 flex items-center justify-between border-y border-slate-800/80 py-3">
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider">Suggested Decision</span>
                <div
                  className={`mt-1 text-lg font-extrabold ${
                    opDecision === 'LONG'
                      ? 'text-emerald-400'
                      : opDecision === 'SHORT'
                      ? 'text-rose-400'
                      : 'text-slate-300'
                  }`}
                >
                  {opDecision}
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider">Confidence</span>
                <div className="mt-1 font-mono text-xl font-bold text-white">{opConf}%</div>
              </div>
            </div>

            {/* Reasoning */}
            <div className="mt-4">
              <span className="text-xs font-semibold text-slate-300">Model Rationale:</span>
              <p className="mt-1.5 text-xs text-slate-300 leading-relaxed rounded-xl bg-slate-950/60 p-3 border border-slate-800/80">
                {opReason}
              </p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 text-[10px] text-slate-400 flex items-center justify-between">
            <span>Direct Execution:</span>
            <span className="text-rose-400 font-semibold">Blocked (Safety Rule)</span>
          </div>
        </div>

        {/* 2. Google Gemini Engine Card */}
        <div className="rounded-2xl border border-indigo-500/30 bg-gradient-to-b from-indigo-950/30 to-slate-900/60 p-5 shadow-lg shadow-indigo-950/20 backdrop-blur-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-indigo-500/20 p-2 text-cyan-400 border border-indigo-500/30">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>Google Gemini Engine</span>
                    <span className="h-1.5 w-1.5 rounded-full bg-cyan-400"></span>
                  </h3>
                  <span className="text-[10px] text-cyan-300 font-mono">gemini-3.8-flash</span>
                </div>
              </div>
              <span className="rounded-full bg-indigo-900/60 px-2 py-0.5 text-[10px] font-mono text-indigo-300 border border-indigo-500/30">
                {geminiResult?.latencyMs || 210}ms
              </span>
            </div>

            {/* Decision & Confidence */}
            <div className="mt-5 flex items-center justify-between border-y border-slate-800/80 py-3">
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider">Suggested Decision</span>
                <div
                  className={`mt-1 text-lg font-extrabold ${
                    gemDecision === 'LONG'
                      ? 'text-emerald-400'
                      : gemDecision === 'SHORT'
                      ? 'text-rose-400'
                      : 'text-slate-300'
                  }`}
                >
                  {gemDecision}
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider">Confidence</span>
                <div className="mt-1 font-mono text-xl font-bold text-white">{gemConf}%</div>
              </div>
            </div>

            {/* Reasoning */}
            <div className="mt-4">
              <span className="text-xs font-semibold text-slate-300">Model Rationale:</span>
              <p className="mt-1.5 text-xs text-slate-300 leading-relaxed rounded-xl bg-slate-950/60 p-3 border border-slate-800/80">
                {gemReason}
              </p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 text-[10px] text-slate-400 flex items-center justify-between">
            <span>Direct Execution:</span>
            <span className="text-rose-400 font-semibold">Blocked (Safety Rule)</span>
          </div>
        </div>

        {/* 3. Technical Analysis Card */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-sm backdrop-blur-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-cyan-500/10 p-2 text-cyan-400 border border-cyan-500/20">
                  <Scale className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white">Technical Analysis</h3>
                  <span className="text-[10px] text-slate-400 font-mono">Indicators Mathematical Rule</span>
                </div>
              </div>
              <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-mono text-slate-400">
                Deterministic
              </span>
            </div>

            {/* Decision & Confidence */}
            <div className="mt-5 flex items-center justify-between border-y border-slate-800/80 py-3">
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider">Algorithmic Signal</span>
                <div
                  className={`mt-1 text-lg font-extrabold ${
                    techDecision === 'LONG'
                      ? 'text-emerald-400'
                      : techDecision === 'SHORT'
                      ? 'text-rose-400'
                      : 'text-slate-300'
                  }`}
                >
                  {techDecision}
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider">Confidence</span>
                <div className="mt-1 font-mono text-xl font-bold text-white">{techConf}%</div>
              </div>
            </div>

            {/* Indicators */}
            <div className="mt-4">
              <span className="text-xs font-semibold text-slate-300">Active Technical Confluence:</span>
              <ul className="mt-1.5 space-y-1.5 rounded-xl bg-slate-950/60 p-3 text-xs text-slate-300 border border-slate-800/80">
                <li className="flex items-center justify-between">
                  <span className="text-slate-400">RSI (14):</span>
                  <span className="font-mono font-bold text-slate-200">{technicalResult?.indicators.rsi || 58.4}</span>
                </li>
                <li className="flex items-center justify-between">
                  <span className="text-slate-400">MACD Hist:</span>
                  <span className="font-mono font-bold text-emerald-400">+{technicalResult?.indicators.macd.histogram || 18.2}</span>
                </li>
                <li className="flex items-center justify-between">
                  <span className="text-slate-400">EMA Trend:</span>
                  <span className="font-semibold text-emerald-400">Above 21 & 50 EMA</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 text-[10px] text-slate-400 flex items-center justify-between">
            <span>Direct Execution:</span>
            <span className="text-rose-400 font-semibold">Requires AI Consensus</span>
          </div>
        </div>
      </div>

      {/* Consensus Verification & Risk Gate Banner */}
      <div className="rounded-2xl border border-indigo-500/40 bg-slate-900/90 p-6 shadow-2xl backdrop-blur-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-cyan-400" />
              <h2 className="text-base font-bold text-white uppercase tracking-wide">
                AI Consensus Engine Evaluation
              </h2>
            </div>

            {/* Consensus Result Pill */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="text-xs text-slate-400">Final Consensus:</div>
              <span
                className={`rounded-xl px-4 py-1.5 text-sm font-extrabold border ${
                  finalConsensus === 'LONG'
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                    : finalConsensus === 'SHORT'
                    ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                    : 'bg-slate-800 text-slate-300 border-slate-700'
                }`}
              >
                {finalConsensus}
              </span>

              <div className="flex items-center gap-1.5 text-xs text-slate-300 font-mono">
                <span>Score:</span>
                <span className="font-bold text-cyan-400">{consensusScore}/100</span>
              </div>

              <span
                className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold border ${
                  approved
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                }`}
              >
                {approved ? 'Approved for Risk Check' : 'NO TRADE - Consensus Failed'}
              </span>
            </div>

            <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
              {consensusReasoning}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => onProceedToRiskCheck(symbol, finalConsensus === 'NO TRADE' ? 'HOLD' : finalConsensus)}
              disabled={!approved || finalConsensus === 'NO TRADE'}
              className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-xs font-bold text-white shadow-lg shadow-emerald-600/30 hover:bg-emerald-500 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>Proceed to Risk Management Engine</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
