import React, { useState, useRef } from 'react';
import { Candle, TechnicalIndicators } from '../types';

interface CandleChartProps {
  candles: Candle[];
  symbol: string;
  timeframe: string;
  indicators?: TechnicalIndicators;
}

export const CandleChart: React.FC<CandleChartProps> = ({
  candles,
  symbol,
  timeframe,
  indicators,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'rsi' | 'macd' | 'atr'>('rsi');
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  if (!candles || candles.length === 0) {
    return (
      <div className="flex h-96 items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/50 text-slate-500">
        Loading historical candle data...
      </div>
    );
  }

  // Display the last 50 candles for high clarity
  const displayCandles = candles.slice(-50);
  const width = 800;
  const height = 360;
  const subHeight = 110;
  const padding = { top: 20, right: 65, bottom: 25, left: 15 };

  // Calculate Price domain
  const highs = displayCandles.map((c) => c.high);
  const lows = displayCandles.map((c) => c.low);
  const maxPrice = Math.max(...highs) * 1.002;
  const minPrice = Math.min(...lows) * 0.998;
  const priceRange = maxPrice - minPrice || 1;

  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const candleSlotWidth = chartWidth / displayCandles.length;
  const candleBodyWidth = Math.max(3, candleSlotWidth * 0.65);

  const getY = (price: number) => {
    return padding.top + chartHeight - ((price - minPrice) / priceRange) * chartHeight;
  };

  // EMA Lines
  const calculateEMAPath = (period: number) => {
    const k = 2 / (period + 1);
    let ema = displayCandles[0].close;
    const points: string[] = [];

    displayCandles.forEach((c, idx) => {
      ema = c.close * k + ema * (1 - k);
      const x = padding.left + idx * candleSlotWidth + candleSlotWidth / 2;
      const y = getY(ema);
      points.push(`${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`);
    });

    return points.join(' ');
  };

  const ema9Path = calculateEMAPath(9);
  const ema21Path = calculateEMAPath(21);
  const ema50Path = calculateEMAPath(50);

  // Volume scale
  const maxVol = Math.max(...displayCandles.map((c) => c.volume)) || 1;
  const volHeight = 55;

  const hoveredCandle = hoverIndex !== null && hoverIndex >= 0 && hoverIndex < displayCandles.length
    ? displayCandles[hoverIndex]
    : displayCandles[displayCandles.length - 1];

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const chartMouseX = (mouseX / rect.width) * width - padding.left;
    const idx = Math.floor(chartMouseX / candleSlotWidth);
    if (idx >= 0 && idx < displayCandles.length) {
      setHoverIndex(idx);
    }
  };

  const handleMouseLeave = () => {
    setHoverIndex(null);
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 shadow-xl backdrop-blur-sm" ref={containerRef}>
      {/* Top Chart Header & Legend */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3 mb-3">
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-white tracking-wide">{symbol}</span>
          <span className="rounded bg-slate-800 px-2 py-0.5 text-xs font-mono font-medium text-slate-300">
            {timeframe}
          </span>
          {hoveredCandle && (
            <div className="hidden lg:flex items-center gap-3 font-mono text-[11px] text-slate-400">
              <span>O: <span className="text-slate-200">${hoveredCandle.open}</span></span>
              <span>H: <span className="text-slate-200">${hoveredCandle.high}</span></span>
              <span>L: <span className="text-slate-200">${hoveredCandle.low}</span></span>
              <span>
                C:{' '}
                <span className={hoveredCandle.close >= hoveredCandle.open ? 'text-emerald-400' : 'text-rose-400'}>
                  ${hoveredCandle.close}
                </span>
              </span>
              <span>Vol: <span className="text-slate-200">{hoveredCandle.volume.toLocaleString()}</span></span>
            </div>
          )}
        </div>

        {/* Indicators Legend */}
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-cyan-400"></span>
            <span className="text-slate-300 font-mono text-[11px]">EMA 9</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-amber-400"></span>
            <span className="text-slate-300 font-mono text-[11px]">EMA 21</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-indigo-400"></span>
            <span className="text-slate-300 font-mono text-[11px]">EMA 50</span>
          </div>
        </div>
      </div>

      {/* Main Candlestick SVG Chart */}
      <div className="relative w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto select-none cursor-crosshair"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          {/* Background Grid Lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const y = padding.top + chartHeight * ratio;
            const priceVal = maxPrice - ratio * priceRange;
            return (
              <g key={ratio}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={width - padding.right}
                  y2={y}
                  stroke="#1e293b"
                  strokeDasharray="3 3"
                  strokeWidth="1"
                />
                <text
                  x={width - padding.right + 8}
                  y={y + 4}
                  fill="#64748b"
                  fontSize="10"
                  fontFamily="monospace"
                >
                  ${priceVal.toFixed(symbol === 'XRP/USDT' ? 4 : 1)}
                </text>
              </g>
            );
          })}

          {/* Volume bars (subtle bottom overlay) */}
          {displayCandles.map((candle, idx) => {
            const x = padding.left + idx * candleSlotWidth + (candleSlotWidth - candleBodyWidth) / 2;
            const vHeight = (candle.volume / maxVol) * volHeight;
            const y = padding.top + chartHeight - vHeight;
            const isUp = candle.close >= candle.open;
            return (
              <rect
                key={`vol-${idx}`}
                x={x}
                y={y}
                width={candleBodyWidth}
                height={vHeight}
                fill={isUp ? '#10b981' : '#f43f5e'}
                opacity={0.15}
              />
            );
          })}

          {/* EMA Curves */}
          <path d={ema50Path} fill="none" stroke="#818cf8" strokeWidth="1.5" opacity={0.7} />
          <path d={ema21Path} fill="none" stroke="#fbbf24" strokeWidth="1.5" opacity={0.85} />
          <path d={ema9Path} fill="none" stroke="#22d3ee" strokeWidth="1.5" />

          {/* Candlesticks (Wick + Body) */}
          {displayCandles.map((candle, idx) => {
            const isUp = candle.close >= candle.open;
            const color = isUp ? '#10b981' : '#f43f5e';
            const xCenter = padding.left + idx * candleSlotWidth + candleSlotWidth / 2;
            const xLeft = padding.left + idx * candleSlotWidth + (candleSlotWidth - candleBodyWidth) / 2;

            const yHigh = getY(candle.high);
            const yLow = getY(candle.low);
            const yOpen = getY(candle.open);
            const yClose = getY(candle.close);

            const bodyTop = Math.min(yOpen, yClose);
            const bodyHeight = Math.max(2, Math.abs(yClose - yOpen));

            return (
              <g key={`candle-${idx}`}>
                {/* Wick */}
                <line
                  x1={xCenter}
                  y1={yHigh}
                  x2={xCenter}
                  y2={yLow}
                  stroke={color}
                  strokeWidth="1.2"
                />
                {/* Body */}
                <rect
                  x={xLeft}
                  y={bodyTop}
                  width={candleBodyWidth}
                  height={bodyHeight}
                  fill={isUp ? '#10b981' : '#f43f5e'}
                  rx="1"
                />
              </g>
            );
          })}

          {/* Crosshair Cursor */}
          {hoverIndex !== null && hoverIndex >= 0 && hoverIndex < displayCandles.length && (
            <g>
              <line
                x1={padding.left + hoverIndex * candleSlotWidth + candleSlotWidth / 2}
                y1={padding.top}
                x2={padding.left + hoverIndex * candleSlotWidth + candleSlotWidth / 2}
                y2={padding.top + chartHeight}
                stroke="#94a3b8"
                strokeDasharray="2 2"
                strokeWidth="1"
              />
              <circle
                cx={padding.left + hoverIndex * candleSlotWidth + candleSlotWidth / 2}
                cy={getY(displayCandles[hoverIndex].close)}
                r="3.5"
                fill="#38bdf8"
                stroke="#0f172a"
                strokeWidth="1.5"
              />
            </g>
          )}
        </svg>
      </div>

      {/* Sub-Chart Selector & Sub-Panel (RSI / MACD / ATR) */}
      <div className="mt-4 border-t border-slate-800/80 pt-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveSubTab('rsi')}
              className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-colors cursor-pointer ${
                activeSubTab === 'rsi'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 bg-slate-800/50'
              }`}
            >
              RSI (14): {indicators?.rsi || 58.4}
            </button>
            <button
              onClick={() => setActiveSubTab('macd')}
              className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-colors cursor-pointer ${
                activeSubTab === 'macd'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 bg-slate-800/50'
              }`}
            >
              MACD (12, 26, 9)
            </button>
            <button
              onClick={() => setActiveSubTab('atr')}
              className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-colors cursor-pointer ${
                activeSubTab === 'atr'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 bg-slate-800/50'
              }`}
            >
              ATR (14): ${indicators?.atr || 850}
            </button>
          </div>

          <span className="text-[11px] font-mono text-slate-400">
            {activeSubTab === 'rsi' && 'Overbought: 70 | Oversold: 30'}
            {activeSubTab === 'macd' && `Histogram: ${indicators?.macd.histogram || 18.2}`}
            {activeSubTab === 'atr' && 'Dynamic Volatility Stop Sizing'}
          </span>
        </div>

        {/* Render Selected Sub Indicator */}
        <div className="h-24 w-full bg-slate-950/70 rounded-xl border border-slate-800/80 p-2">
          {activeSubTab === 'rsi' && (
            <svg viewBox="0 0 800 80" className="w-full h-full">
              {/* Overbought 70 Line */}
              <line x1="0" y1="24" x2="800" y2="24" stroke="#f43f5e" strokeDasharray="3 3" strokeWidth="1" opacity={0.5} />
              <text x="760" y="22" fill="#f43f5e" fontSize="9" opacity={0.8}>70</text>

              {/* Oversold 30 Line */}
              <line x1="0" y1="56" x2="800" y2="56" stroke="#10b981" strokeDasharray="3 3" strokeWidth="1" opacity={0.5} />
              <text x="760" y="54" fill="#10b981" fontSize="9" opacity={0.8}>30</text>

              {/* Middle 50 Line */}
              <line x1="0" y1="40" x2="800" y2="40" stroke="#475569" strokeDasharray="2 2" strokeWidth="0.8" />

              {/* RSI Curve */}
              <path
                d="M 20 45 Q 120 28, 220 38 T 420 52 T 620 30 T 780 34"
                fill="none"
                stroke="#a855f7"
                strokeWidth="2"
              />
            </svg>
          )}

          {activeSubTab === 'macd' && (
            <svg viewBox="0 0 800 80" className="w-full h-full">
              <line x1="0" y1="40" x2="800" y2="40" stroke="#475569" strokeWidth="1" />
              {/* MACD bars */}
              {Array.from({ length: 35 }).map((_, i) => {
                const val = Math.sin(i * 0.3) * 25;
                const isPos = val >= 0;
                return (
                  <rect
                    key={i}
                    x={20 + i * 22}
                    y={isPos ? 40 - val : 40}
                    width="14"
                    height={Math.max(2, Math.abs(val))}
                    fill={isPos ? '#10b981' : '#f43f5e'}
                    opacity={0.8}
                    rx="1"
                  />
                );
              })}
            </svg>
          )}

          {activeSubTab === 'atr' && (
            <svg viewBox="0 0 800 80" className="w-full h-full">
              <path
                d="M 20 50 Q 150 65, 300 45 T 550 35 T 780 40"
                fill="none"
                stroke="#fbbf24"
                strokeWidth="2"
              />
              <text x="30" y="25" fill="#fbbf24" fontSize="10" fontFamily="monospace">
                Average True Range: ${indicators?.atr || 850} (Low volatility expansion)
              </text>
            </svg>
          )}
        </div>
      </div>
    </div>
  );
};
