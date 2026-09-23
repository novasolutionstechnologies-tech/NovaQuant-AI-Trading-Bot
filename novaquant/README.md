# NovaQuant AI Trading Bot

NovaQuant is an institutional-grade, AI-assisted cryptocurrency trading platform that pairs multi-agent consensus (OpenAI + Google Gemini) with mathematical technical analysis and non-negotiable risk management.

## Complete Trading Workflow

```
Market Data 
  → Technical Analysis (EMA, RSI, MACD, Bollinger, ATR)
  → Dual AI Analysis (OpenAI + Google Gemini)
  → AI Consensus Engine (Consensus Rules & Verification)
  → Mandatory Risk Management (Balance, R:R >= 1:2, Daily Loss, Drawdown)
  → Trade Approval
  → Order Manager (Binance, Bybit, Bitget)
  → Live Trade Monitoring (Automated TP/SL execution)
  → Trade Feedback & Learning Analytics (Continuous strategy optimization)
```

## Quick Start (Python FastAPI Backend)

```bash
cd novaquant
pip install -r requirements.txt
uvicorn backend.main:app --reload --port 8000
```

## Environment Variables (.env)

```env
GEMINI_API_KEY=your_gemini_api_key
OPENAI_API_KEY=your_openai_api_key
BINANCE_API_KEY=your_binance_sandbox_key
BINANCE_API_SECRET=your_binance_sandbox_secret
BYBIT_API_KEY=your_bybit_key
BYBIT_API_SECRET=your_bybit_secret
BITGET_API_KEY=your_bitget_key
BITGET_API_SECRET=your_bitget_secret
JWT_SECRET=super_secret_quant_key
```

## Running the Integrated Full-Stack Dev Server

In the root directory, run:
```bash
npm run dev
```
Access the dashboard on `http://localhost:3000`.
