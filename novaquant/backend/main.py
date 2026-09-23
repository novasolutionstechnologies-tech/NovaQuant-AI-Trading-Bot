from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import uvicorn
import os

from indicators.technical import calculate_ema, calculate_rsi, calculate_macd, calculate_bollinger, calculate_atr
from ai.openai_engine import OpenAIEngine
from ai.gemini_engine import GeminiEngine
from ai.consensus import AIConsensusEngine
from trading.risk_manager import RiskManager
from trading.order_manager import OrderManager

app = FastAPI(
    title="NovaQuant AI Trading Bot Engine",
    description="Dual-AI consensus quantitative cryptocurrency trading platform.",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

openai_engine = OpenAIEngine()
gemini_engine = GeminiEngine()
consensus_engine = AIConsensusEngine()
risk_manager = RiskManager()
order_manager = OrderManager(mode="DEMO")

class AnalyzeRequest(BaseModel):
    symbol: str = "BTC/USDT"

class ConsensusRequest(BaseModel):
    openai_decision: str
    gemini_decision: str
    technical_decision: str
    openai_confidence: Optional[int] = 80
    gemini_confidence: Optional[int] = 85
    technical_confidence: Optional[int] = 75

class RiskCheckRequest(BaseModel):
    symbol: str
    direction: str
    entry_price: float
    account_balance: Optional[float] = 50000.0
    custom_stop_loss: Optional[float] = None
    custom_take_profit: Optional[float] = None

class OpenTradeRequest(BaseModel):
    symbol: str
    direction: str
    position_size: float
    entry_price: float
    stop_loss: float
    take_profit: float
    exchange: Optional[str] = "Binance"

@app.get("/health")
def health_check():
    return {"status": "ok", "system": "NovaQuant Python Engine", "version": "1.0.0"}

@app.get("/market-data/{symbol:path}")
def get_market_data(symbol: str):
    return {
        "symbol": symbol,
        "timeframe": "1h",
        "price": 67420.50,
        "trend": "BULLISH",
        "rsi": 58.4,
        "macd": "BULLISH",
        "ema": 64800.0,
        "volume": 123456,
        "atr": 850.0
    }

@app.get("/analysis/{symbol:path}")
def get_analysis(symbol: str):
    return {
        "decision": "LONG",
        "confidence": 78,
        "trend": "BULLISH",
        "reasons": [
            "RSI is in healthy momentum zone above 50",
            "MACD bullish crossover with expanding histogram",
            "Price established above 21 and 50 EMA"
        ]
    }

@app.post("/ai/analyze")
def post_ai_analyze(req: AnalyzeRequest):
    tech = {"decision": "LONG", "confidence": 78, "indicators": {"rsi": 58.4}}
    mkt = {"symbol": req.symbol, "price": 67420.5, "trend": "BULLISH"}
    op = openai_engine.analyze(mkt, tech)
    gem = gemini_engine.analyze(mkt, tech)
    return {"symbol": req.symbol, "technical": tech, "openai": op, "gemini": gem}

@app.post("/consensus")
def post_consensus(req: ConsensusRequest):
    return consensus_engine.evaluate_consensus(
        {"decision": req.openai_decision, "confidence": req.openai_confidence},
        {"decision": req.gemini_decision, "confidence": req.gemini_confidence},
        {"decision": req.technical_decision, "confidence": req.technical_confidence},
    )

@app.post("/risk/check")
def post_risk_check(req: RiskCheckRequest):
    return risk_manager.evaluate_risk(
        symbol=req.symbol,
        direction=req.direction,
        entry_price=req.entry_price,
        atr=850.0,
        account_balance=req.account_balance or 50000.0,
        daily_pnl=350.0,
        active_trades_count=2,
        custom_sl=req.custom_stop_loss,
        custom_tp=req.custom_take_profit
    )

@app.post("/trades/open")
def post_open_trade(req: OpenTradeRequest):
    return order_manager.create_order(
        symbol=req.symbol,
        direction=req.direction,
        position_size=req.position_size,
        entry_price=req.entry_price,
        stop_loss=req.stop_loss,
        take_profit=req.take_profit,
        exchange_name=req.exchange or "Binance"
    )

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
