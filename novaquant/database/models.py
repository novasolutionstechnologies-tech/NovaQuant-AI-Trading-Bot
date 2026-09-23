from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, Text
from datetime import datetime
from .database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True)

class TradeRecord(Base):
    __tablename__ = "trades"

    id = Column(String, primary_key=True, index=True)
    symbol = Column(String, index=True, nullable=False)
    direction = Column(String, nullable=False)  # LONG, SHORT
    entry_price = Column(Float, nullable=False)
    exit_price = Column(Float, nullable=True)
    position_size = Column(Float, nullable=False)
    pnl = Column(Float, default=0.0)
    pnl_percentage = Column(Float, default=0.0)
    stop_loss = Column(Float, nullable=False)
    take_profit = Column(Float, nullable=False)
    status = Column(String, default="ACTIVE")  # ACTIVE, CLOSED, CANCELLED
    result = Column(String, nullable=True)  # WIN, LOSS
    exit_reason = Column(String, nullable=True)
    opened_at = Column(DateTime, default=datetime.utcnow)
    closed_at = Column(DateTime, nullable=True)
    exchange = Column(String, default="Binance")
    mode = Column(String, default="DEMO")

    # AI & Indicator context for Feedback loop
    openai_confidence = Column(Float, nullable=True)
    gemini_confidence = Column(Float, nullable=True)
    technical_decision = Column(String, nullable=True)
    final_consensus = Column(String, nullable=True)
    rsi = Column(Float, nullable=True)
    trend = Column(String, nullable=True)
    feedback_insight = Column(Text, nullable=True)

class RiskSettingsRecord(Base):
    __tablename__ = "risk_settings"

    id = Column(Integer, primary_key=True, index=True)
    max_risk_per_trade = Column(Float, default=1.5)
    max_position_size = Column(Float, default=15.0)
    min_risk_reward = Column(Float, default=2.0)
    max_open_trades = Column(Integer, default=3)
    daily_loss_limit = Column(Float, default=3.0)
    max_leverage = Column(Integer, default=10)
    trading_mode = Column(String, default="DEMO")
