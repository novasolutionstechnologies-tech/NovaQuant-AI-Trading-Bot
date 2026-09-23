import uuid
from typing import Dict, Any, Optional

class OrderManager:
    """
    Order Manager:
    - Validate approved trades
    - Create order
    - Track order status
    - Handle failed orders
    - Record order information
    """
    def __init__(self, exchange_client=None, mode: str = "DEMO"):
        self.exchange = exchange_client
        self.mode = mode

    def create_order(
        self,
        symbol: str,
        direction: str,
        position_size: float,
        entry_price: float,
        stop_loss: float,
        take_profit: float,
        exchange_name: str = "Binance"
    ) -> Dict[str, Any]:
        order_id = f"ord-{uuid.uuid4().hex[:8]}"

        # In DEMO / SANDBOX mode:
        order = {
            "id": order_id,
            "symbol": symbol,
            "direction": direction,
            "position_size": position_size,
            "entry_price": entry_price,
            "current_price": entry_price,
            "stop_loss": stop_loss,
            "take_profit": take_profit,
            "status": "FILLED",
            "exchange": exchange_name,
            "mode": self.mode,
            "timestamp": "now"
        }
        return order
