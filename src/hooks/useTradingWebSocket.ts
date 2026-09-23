import { useEffect, useRef, useState, useCallback } from 'react';
import { WebSocketPayload, ActiveTrade, AuditLogEntry, BotStatus } from '../types';
import { getApiBaseUrl } from '../services/api';

interface UseTradingWebSocketOptions {
  onPriceUpdate?: (prices: Record<string, number>) => void;
  onOrderCreated?: (trade: ActiveTrade) => void;
  onOrderUpdated?: (trade: ActiveTrade) => void;
  onOrderClosed?: (data: { trade: any; reason: string; balance?: number }) => void;
  onStopLossTriggered?: (data: { tradeId: string; symbol: string; exitPrice: number; stopLoss: number; pnl: number }) => void;
  onTakeProfitTriggered?: (data: { tradeId: string; symbol: string; exitPrice: number; takeProfit: number; pnl: number }) => void;
  onAuditLog?: (log: AuditLogEntry) => void;
  onBotStatusChanged?: (status: BotStatus) => void;
}

export function useTradingWebSocket(options: UseTradingWebSocketOptions = {}) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessageTime, setLastMessageTime] = useState<number>(0);
  const [recentWsLogs, setRecentWsLogs] = useState<AuditLogEntry[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<any>(null);
  const pingIntervalRef = useRef<any>(null);

  const optionsRef = useRef(options);
  optionsRef.current = options;

  const connect = useCallback(() => {
    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
      return;
    }

    try {
      let wsUrl = '';
      const customBase = getApiBaseUrl();
      if (customBase) {
        try {
          const parsed = new URL(customBase);
          const proto = parsed.protocol === 'https:' ? 'wss:' : 'ws:';
          wsUrl = `${proto}//${parsed.host}/ws`;
        } catch {
          const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
          wsUrl = `${protocol}//${window.location.host}/ws`;
        }
      } else {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.host;
        wsUrl = `${protocol}//${host}/ws`;
      }

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        // Start ping interval
        if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping' }));
          }
        }, 15000);
      };

      ws.onmessage = (event) => {
        try {
          const payload: WebSocketPayload = JSON.parse(event.data);
          setLastMessageTime(Date.now());

          switch (payload.type) {
            case 'market:ticker':
              if (payload.data?.prices && optionsRef.current.onPriceUpdate) {
                optionsRef.current.onPriceUpdate(payload.data.prices);
              }
              break;

            case 'order:created':
              if (payload.data?.trade && optionsRef.current.onOrderCreated) {
                optionsRef.current.onOrderCreated(payload.data.trade);
              }
              break;

            case 'order:updated':
              if (payload.data?.trade && optionsRef.current.onOrderUpdated) {
                optionsRef.current.onOrderUpdated(payload.data.trade);
              }
              break;

            case 'order:closed':
              if (optionsRef.current.onOrderClosed) {
                optionsRef.current.onOrderClosed(payload.data);
              }
              break;

            case 'stoploss:triggered':
              if (optionsRef.current.onStopLossTriggered) {
                optionsRef.current.onStopLossTriggered(payload.data);
              }
              break;

            case 'takeprofit:triggered':
              if (optionsRef.current.onTakeProfitTriggered) {
                optionsRef.current.onTakeProfitTriggered(payload.data);
              }
              break;

            case 'audit:log':
              if (payload.data) {
                setRecentWsLogs((prev) => [payload.data, ...prev.slice(0, 49)]);
                if (optionsRef.current.onAuditLog) {
                  optionsRef.current.onAuditLog(payload.data);
                }
              }
              break;

            case 'emergency:stop':
              if (optionsRef.current.onBotStatusChanged) {
                optionsRef.current.onBotStatusChanged('STOPPED');
              }
              break;

            case 'init':
              if (payload.data?.prices && optionsRef.current.onPriceUpdate) {
                optionsRef.current.onPriceUpdate(payload.data.prices);
              }
              if (payload.data?.botStatus && optionsRef.current.onBotStatusChanged) {
                optionsRef.current.onBotStatusChanged(payload.data.botStatus);
              }
              if (payload.data?.auditLogs) {
                setRecentWsLogs(payload.data.auditLogs);
              }
              break;

            default:
              break;
          }
        } catch (err) {
          console.warn('[WS CLIENT PARSE ERROR]', err);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
        // Exponential reconnect attempt
        if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, 3000);
      };

      ws.onerror = (err) => {
        console.warn('[WS CLIENT ERROR]', err);
        ws.close();
      };
    } catch (err) {
      console.warn('[WS CONNECTION FAILED]', err);
    }
  }, []);

  useEffect(() => {
    connect();

    const handleBackendChange = () => {
      if (wsRef.current) {
        try {
          wsRef.current.close();
        } catch {
          // ignore
        }
        wsRef.current = null;
      }
      connect();
    };
    window.addEventListener('novaquant:backend_changed', handleBackendChange);

    return () => {
      window.removeEventListener('novaquant:backend_changed', handleBackendChange);
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  const sendMessage = useCallback((msg: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    }
  }, []);

  return {
    isConnected,
    lastMessageTime,
    recentWsLogs,
    sendMessage,
    reconnect: connect,
  };
}
