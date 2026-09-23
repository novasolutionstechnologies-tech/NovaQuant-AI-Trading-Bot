from typing import Dict, Any, List

class RiskManager:
    """
    Mandatory Risk Management Engine.
    AI suggestions must never bypass risk management.
    """
    def __init__(
        self,
        max_risk_per_trade_pct: float = 1.5,
        max_position_size_pct: float = 15.0,
        min_risk_reward: float = 2.0,
        max_open_trades: int = 3,
        daily_loss_limit_pct: float = 3.0,
        max_leverage: int = 10,
    ):
        self.max_risk_per_trade_pct = max_risk_per_trade_pct
        self.max_position_size_pct = max_position_size_pct
        self.min_risk_reward = min_risk_reward
        self.max_open_trades = max_open_trades
        self.daily_loss_limit_pct = daily_loss_limit_pct
        self.max_leverage = max_leverage

    def evaluate_risk(
        self,
        symbol: str,
        direction: str,
        entry_price: float,
        atr: float,
        account_balance: float,
        daily_pnl: float,
        active_trades_count: int,
        custom_sl: float = None,
        custom_tp: float = None
    ) -> Dict[str, Any]:
        # Rule 1: Daily Loss Limit
        if daily_pnl < -(account_balance * (self.daily_loss_limit_pct / 100)):
            return {
                "approved": False,
                "reason": "Daily loss limit exceeded. Risk engine halted trading.",
                "position_size": 0.0,
                "stop_loss": 0.0,
                "take_profit": 0.0,
                "risk_reward_ratio": 0.0
            }

        # Rule 2: Max Open Trades
        if active_trades_count >= self.max_open_trades:
            return {
                "approved": False,
                "reason": f"Maximum open trades limit reached ({active_trades_count}/{self.max_open_trades})",
                "position_size": 0.0,
                "stop_loss": 0.0,
                "take_profit": 0.0,
                "risk_reward_ratio": 0.0
            }

        # Calculate Stop Loss & Take Profit
        if direction == "LONG":
            sl = custom_sl or round(entry_price - (1.5 * atr), 2)
            tp = custom_tp or round(entry_price + (3.2 * atr), 2)
        else:
            sl = custom_sl or round(entry_price + (1.5 * atr), 2)
            tp = custom_tp or round(entry_price - (3.2 * atr), 2)

        risk_dist = abs(entry_price - sl)
        reward_dist = abs(tp - entry_price)

        if risk_dist <= 0:
            return {"approved": False, "reason": "Invalid stop loss distance"}

        rr_ratio = round(reward_dist / risk_dist, 2)

        # Rule 3: Minimum 1:2 Risk/Reward Ratio
        if rr_ratio < self.min_risk_reward:
            return {
                "approved": False,
                "reason": f"Risk/Reward ratio {rr_ratio}:1 does not satisfy minimum {self.min_risk_reward}:1",
                "position_size": 0.0,
                "stop_loss": sl,
                "take_profit": tp,
                "risk_reward_ratio": rr_ratio
            }

        # Rule 4: Position Sizing (Fixed fractional risk)
        risk_capital = account_balance * (self.max_risk_per_trade_pct / 100)
        pos_size = round(risk_capital / risk_dist, 3 if entry_price > 1000 else 1)

        return {
            "approved": True,
            "reason": "Trade meets all institutional risk requirements",
            "position_size": pos_size,
            "stop_loss": sl,
            "take_profit": tp,
            "risk_reward_ratio": rr_ratio,
            "risk_amount": round(risk_dist * pos_size, 2),
            "potential_profit": round(reward_dist * pos_size, 2)
        }
