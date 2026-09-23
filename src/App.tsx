import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar, NavTab } from './components/Sidebar';
import { BottomNav } from './components/BottomNav';
import { OpenTradeModal } from './components/OpenTradeModal';

import { DashboardPage } from './pages/DashboardPage';
import { MarketAnalysisPage } from './pages/MarketAnalysisPage';
import { AIDecisionPage } from './pages/AIDecisionPage';
import { RiskManagementPage } from './pages/RiskManagementPage';
import { ActiveTradesPage } from './pages/ActiveTradesPage';
import { TradeHistoryPage } from './pages/TradeHistoryPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { SettingsPage } from './pages/SettingsPage';
import { APIConnectPage } from './pages/APIConnectPage';
import { AssetsPage } from './pages/AssetsPage';
import { AuthPage } from './pages/AuthPage';
import { AuditLogsPage } from './pages/AuditLogsPage';
import { useTradingWebSocket } from './hooks/useTradingWebSocket';

import { auth } from './lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

import {
  fetchMarketData,
  fetchCandles,
  fetchTechnicalAnalysis,
  runAIAnalysis,
  evaluateConsensus,
  checkRisk,
  openTrade,
  fetchActiveTrades,
  fetchTradeHistory,
  closeActiveTrade,
  fetchAnalytics,
  fetchRiskSettings,
  saveRiskSettings,
  fetchBotStatus,
  updateBotStatus,
  syncBotState,
  fetchCurrentUser,
  clearAuthSession,
  loginWithGoogleApi
} from './services/api';

import {
  MarketData,
  Candle,
  TechnicalAnalysisResult,
  AIEngineDecision,
  AIConsensusResult,
  RiskCheckResult,
  ActiveTrade,
  ClosedTrade,
  AnalyticsPerformance,
  RiskSettings,
  TradeDirection,
  BotStatus,
  UserProfile
} from './types';

import { CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [selectedSymbol, setSelectedSymbol] = useState<string>('BTC/USDT');
  const [tradingMode, setTradingMode] = useState<'DEMO' | 'LIVE'>('LIVE');
  const [botStatus, setBotStatus] = useState<BotStatus>('RUNNING');

  // Real-time prices
  const [prices, setPrices] = useState<Record<string, number>>({
    'BTC/USDT': 67420.5,
    'ETH/USDT': 3540.2,
    'SOL/USDT': 184.8,
    'BNB/USDT': 598.6,
    'XRP/USDT': 0.624,
  });

  // Data states
  const [marketData, setMarketData] = useState<MarketData | null>(null);
  const [candles, setCandles] = useState<Candle[]>([]);
  const [technical, setTechnical] = useState<TechnicalAnalysisResult | null>(null);
  const [openAIResult, setOpenAIResult] = useState<AIEngineDecision | null>(null);
  const [geminiResult, setGeminiResult] = useState<AIEngineDecision | null>(null);
  const [consensusResult, setConsensusResult] = useState<AIConsensusResult | null>(null);
  const [currentRiskCheck, setCurrentRiskCheck] = useState<RiskCheckResult | null>(null);

  const [activeTrades, setActiveTrades] = useState<ActiveTrade[]>([]);
  const [tradeHistory, setTradeHistory] = useState<ClosedTrade[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsPerformance | null>(null);
  const [riskSettings, setRiskSettings] = useState<RiskSettings>({
    maxRiskPerTradePercent: 1.5,
    maxPositionSizePercent: 15.0,
    minRiskRewardRatio: 2.0,
    maxOpenTrades: 3,
    dailyLossLimitPercent: 3.0,
    maxLeverage: 10,
    atrMultiplierSL: 1.5,
    atrMultiplierTP: 3.2,
  });

  // UI state
  const [isScanning, setIsScanning] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ title: string; type: 'success' | 'info' | 'error' } | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalSymbol, setModalSymbol] = useState('BTC/USDT');
  const [modalDirection, setModalDirection] = useState<TradeDirection>('LONG');
  const [modalRiskCheck, setModalRiskCheck] = useState<RiskCheckResult | null>(null);

  // Authentication state
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const showToast = (title: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage({ title, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Real-time WebSocket hook for low-latency market & order streams
  const { isConnected: wsConnected } = useTradingWebSocket({
    onPriceUpdate: (newPrices) => {
      setPrices((prev) => ({ ...prev, ...newPrices }));
    },
    onOrderCreated: (newTrade) => {
      setActiveTrades((prev) => {
        const exists = prev.some((t) => t.id === newTrade.id);
        if (exists) return prev.map((t) => (t.id === newTrade.id ? newTrade : t));
        return [newTrade, ...prev];
      });
      showToast(`Real order executed: ${newTrade.direction} ${newTrade.symbol}`, 'success');
    },
    onOrderUpdated: (updatedTrade) => {
      setActiveTrades((prev) => prev.map((t) => (t.id === updatedTrade.id ? updatedTrade : t)));
    },
    onOrderClosed: ({ trade, reason }) => {
      setActiveTrades((prev) => prev.filter((t) => t.id !== trade?.id));
      loadActiveTradesAndAnalytics();
      if (reason === 'STOP_LOSS') {
        showToast(`Stop-Loss triggered for ${trade?.symbol}! Loss capped at -$${Math.abs(trade?.pnl || 0)}`, 'error');
      } else if (reason === 'TAKE_PROFIT') {
        showToast(`Take-Profit reached for ${trade?.symbol}! Gain: +$${trade?.pnl || 0}`, 'success');
      }
    },
    onStopLossTriggered: (data) => {
      showToast(`STOP-LOSS DEFENSE: ${data.symbol} closed at $${data.exitPrice}. Protection engaged.`, 'error');
      loadActiveTradesAndAnalytics();
    },
    onTakeProfitTriggered: (data) => {
      showToast(`TAKE PROFIT TARGET HIT: ${data.symbol} closed at $${data.exitPrice}. Gain +$${data.pnl}`, 'success');
      loadActiveTradesAndAnalytics();
    },
    onBotStatusChanged: (newStatus) => {
      setBotStatus(newStatus);
    },
  });

  // Sync current user on mount & listen to Firebase Auth
  useEffect(() => {
    fetchCurrentUser()
      .then((res) => {
        if (res.user) {
          setCurrentUser(res.user);
        }
      })
      .catch((e) => console.warn('User session fetch deferred:', e));

    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser && fbUser.email) {
        try {
          const res = await loginWithGoogleApi({
            uid: fbUser.uid,
            email: fbUser.email,
            displayName: fbUser.displayName || undefined,
            photoUrl: fbUser.photoURL || undefined,
          });
          setCurrentUser(res.user);
        } catch (err) {
          console.warn('Silent Google sync deferred:', err);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    try {
      await auth.signOut();
    } catch {}
    clearAuthSession();
    setCurrentUser(null);
    showToast('Signed out of NovaQuant Terminal', 'info');
  };

  const handleAuthSuccess = (user: UserProfile) => {
    setCurrentUser(user);
    setIsAuthModalOpen(false);
    if (currentTab === 'auth') {
      setCurrentTab('dashboard');
    }
    loadActiveTradesAndAnalytics();
  };

  // Polling overlap guard & manual status update cooldown guard
  const isPollingRef = useRef(false);
  const lastManualStatusTimeRef = useRef<number>(0);

  // 1. Initial Load & Polling
  const loadActiveTradesAndAnalytics = useCallback(async () => {
    try {
      const syncData = await syncBotState(selectedSymbol);
      setActiveTrades(syncData.activeTrades);
      setTradeHistory(syncData.tradeHistory);
      setAnalytics(syncData.analytics);
      if (Date.now() - lastManualStatusTimeRef.current > 4000) {
        setBotStatus(syncData.botStatus);
      }
      setPrices((prev) => ({ ...prev, ...syncData.prices }));
      if (syncData.marketData) {
        setMarketData(syncData.marketData);
      }
    } catch (err: any) {
      // Graceful fallback to separate endpoints if sync endpoint is momentarily unavailable
      try {
        const [trades, hist, perf] = await Promise.all([
          fetchActiveTrades(),
          fetchTradeHistory(),
          fetchAnalytics(),
        ]);
        setActiveTrades(trades);
        setTradeHistory(hist);
        setAnalytics(perf);
      } catch (innerErr: any) {
        // Soft debug log instead of console.error to avoid false alarms during connection switches
        console.warn('Sync temporarily unavailable, will retry next tick:', innerErr?.message || innerErr);
      }
    }
  }, [selectedSymbol]);

  const loadSymbolData = useCallback(async (sym: string) => {
    try {
      const [mkt, cndl, tech] = await Promise.all([
        fetchMarketData(sym),
        fetchCandles(sym),
        fetchTechnicalAnalysis(sym),
      ]);
      setMarketData(mkt);
      setCandles(cndl);
      setTechnical(tech);
      setPrices((prev) => ({ ...prev, [sym]: mkt.price }));

      // Run risk check for the primary signal
      try {
        const rCheck = await checkRisk({
          symbol: sym,
          direction: tech.decision === 'HOLD' ? 'LONG' : tech.decision,
          entryPrice: mkt.price,
        });
        setCurrentRiskCheck(rCheck);
      } catch (rErr) {
        console.warn('Pre-trade risk check deferred:', rErr);
      }
    } catch (err: any) {
      console.warn('Failed to load symbol data:', err?.message || err);
    }
  }, []);

  useEffect(() => {
    loadSymbolData(selectedSymbol);
    loadActiveTradesAndAnalytics();

    // Fetch initial settings & bot status
    fetchRiskSettings()
      .then((res) => {
        if (res.settings) setRiskSettings(res.settings);
        if (res.tradingMode) setTradingMode(res.tradingMode);
      })
      .catch((e) => console.warn('Risk settings load deferred:', e?.message || e));

    fetchBotStatus()
      .then((res) => {
        if (res.status) setBotStatus(res.status);
      })
      .catch((e) => console.warn('Bot status load deferred:', e?.message || e));

    // Fast Polling loop (every 3 seconds) with in-flight guard
    const interval = setInterval(async () => {
      if (isPollingRef.current) return;
      isPollingRef.current = true;
      try {
        const syncData = await syncBotState(selectedSymbol);
        setActiveTrades(syncData.activeTrades);
        setTradeHistory(syncData.tradeHistory);
        setAnalytics(syncData.analytics);
        if (Date.now() - lastManualStatusTimeRef.current > 4000) {
          setBotStatus(syncData.botStatus);
        }
        setPrices((prev) => ({ ...prev, ...syncData.prices }));
        if (syncData.marketData) {
          setMarketData(syncData.marketData);
        }
      } catch (err: any) {
        // Soft warning, will resume automatically next interval
        console.warn('Polling updates paused momentarily:', err?.message || err);
      } finally {
        isPollingRef.current = false;
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [selectedSymbol, loadSymbolData, loadActiveTradesAndAnalytics]);

  // Dual AI Scan Trigger
  const handleRunDualAIScan = async (sym: string) => {
    setIsScanning(true);
    try {
      const aiData = await runAIAnalysis(sym);
      if (!aiData || !aiData.gemini || !aiData.openai || !aiData.technical) {
        throw new Error('Dual-AI engine returned an incomplete analysis response');
      }
      setOpenAIResult(aiData.openai);
      setGeminiResult(aiData.gemini);
      setTechnical(aiData.technical);

      // Evaluate Consensus
      const cons = await evaluateConsensus({
        openai_decision: aiData.openai.decision,
        gemini_decision: aiData.gemini.decision,
        technical_decision: aiData.technical.decision,
        openai_confidence: aiData.openai.confidence,
        gemini_confidence: aiData.gemini.confidence,
        technical_confidence: aiData.technical.confidence,
      });
      setConsensusResult(cons);

      // Run Risk Check for final consensus
      const dir = cons.final_consensus === 'NO TRADE' ? 'HOLD' : cons.final_consensus;
      const rCheck = await checkRisk({
        symbol: sym,
        direction: dir,
      });
      setCurrentRiskCheck(rCheck);

      showToast(`AI Analysis Complete for ${sym}! Consensus: ${cons.final_consensus}`, 'info');
    } catch (err: any) {
      showToast(err.message || 'AI Scan Failed', 'error');
    } finally {
      setIsScanning(false);
    }
  };

  // Open Trade Dialog Setup
  const handleTriggerOpenTrade = async (sym: string, dir: TradeDirection) => {
    const validDir = dir === 'HOLD' ? 'LONG' : dir;
    setModalSymbol(sym);
    setModalDirection(validDir);

    try {
      const rCheck = await checkRisk({
        symbol: sym,
        direction: validDir,
        entryPrice: prices[sym] || 67420.5,
      });
      setModalRiskCheck(rCheck);
      setIsModalOpen(true);
    } catch (err: any) {
      showToast('Risk check failed: ' + err.message, 'error');
    }
  };

  // Confirm Open Trade from Modal
  const handleConfirmOrder = async (tradeParams: {
    symbol: string;
    direction: TradeDirection;
    position_size: number;
    stop_loss: number;
    take_profit: number;
    exchange: string;
    consensusScore: number;
  }) => {
    await openTrade(tradeParams);
    showToast(`Order executed: ${tradeParams.direction} ${tradeParams.symbol} on ${tradeParams.exchange}!`, 'success');
    await loadActiveTradesAndAnalytics();
    setCurrentTab('active-trades');
  };

  // Close Trade Action
  const handleCloseTrade = async (tradeId: string) => {
    try {
      await closeActiveTrade(tradeId);
      showToast('Position closed. Feedback engine updated!', 'success');
      await loadActiveTradesAndAnalytics();
    } catch (err: any) {
      showToast(err.message || 'Failed to close trade', 'error');
    }
  };

  // Save Risk Settings
  const handleSaveRiskSettings = async (newSettings: Partial<RiskSettings>) => {
    await saveRiskSettings({ settings: newSettings, tradingMode });
    setRiskSettings((prev) => ({ ...prev, ...newSettings }));
    showToast('Risk engine parameters saved successfully!', 'success');
  };

  // Toggle Bot Start / Stop (same button)
  const handleToggleStartStop = async () => {
    const prevStatus = botStatus;
    const nextStatus: BotStatus = botStatus === 'STOPPED' ? 'RUNNING' : 'STOPPED';
    const action = nextStatus === 'RUNNING' ? 'START' : 'STOP';

    // Instant optimistic UI update and cooldown marker
    lastManualStatusTimeRef.current = Date.now();
    setBotStatus(nextStatus);

    if (nextStatus === 'RUNNING') {
      showToast('Bot started! Autonomous market scanning and execution active.', 'success');
    } else {
      showToast('Bot stopped. Quantitative trading algorithms halted.', 'info');
    }

    try {
      const res = await updateBotStatus(nextStatus, action);
      if (res?.status) {
        setBotStatus(res.status);
      }
      // Refresh dashboard state immediately from production backend
      await loadActiveTradesAndAnalytics();
    } catch (err: any) {
      // Revert if request genuinely failed
      setBotStatus(prevStatus);
      showToast(err.message || 'Failed to update bot status', 'error');
    }
  };

  // Toggle Bot Pause / Resume (same button)
  const handleTogglePauseResume = async () => {
    if (botStatus === 'STOPPED') {
      showToast('Bot is stopped. Click "Start Bot" first to activate.', 'info');
      return;
    }

    const prevStatus = botStatus;
    const nextStatus: BotStatus = botStatus === 'PAUSED' ? 'RUNNING' : 'PAUSED';
    const action = nextStatus === 'RUNNING' ? 'RESUME' : 'PAUSE';

    // Instant optimistic UI update and cooldown marker
    lastManualStatusTimeRef.current = Date.now();
    setBotStatus(nextStatus);

    if (nextStatus === 'PAUSED') {
      showToast('Bot paused. Active positions remain protected, new entries suspended.', 'info');
    } else {
      showToast('Bot resumed! Algorithmic scanning and execution active.', 'success');
    }

    try {
      const res = await updateBotStatus(nextStatus, action);
      if (res?.status) {
        setBotStatus(res.status);
      }
      // Refresh dashboard state immediately from production backend
      await loadActiveTradesAndAnalytics();
    } catch (err: any) {
      // Revert if request genuinely failed
      setBotStatus(prevStatus);
      showToast(err.message || 'Failed to update bot status', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-[#033631] text-[#bf9b42] flex flex-col font-sans selection:bg-[#bf9b42]/30 selection:text-[#f5e6b3]">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-2.5 rounded-xl border border-[#bf9b42]/40 bg-[#022824]/95 px-4 py-3 text-xs font-semibold text-[#f5e6b3] shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-top-4">
          <Sparkles className="h-4 w-4 text-[#bf9b42]" />
          <span>{toastMessage.title}</span>
        </div>
      )}

      {/* Top Navigation */}
      <Navbar
        tradingMode="LIVE"
        botStatus={botStatus}
        onToggleStartStop={handleToggleStartStop}
        onTogglePauseResume={handleTogglePauseResume}
        accountBalance={analytics?.accountBalance ?? 0}
        dailyPnL={analytics?.dailyPnL ?? 0}
        dailyPnLPct={analytics?.dailyPnLPercentage ?? 0}
        prices={prices}
        onTriggerScan={() => handleRunDualAIScan(selectedSymbol)}
        isScanning={isScanning}
        currentUser={currentUser}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onSignOut={handleSignOut}
        onAccountSwitched={() => {
          loadActiveTradesAndAnalytics();
          loadSymbolData(selectedSymbol);
          showToast('Switched account session. Loaded tenant exchange credentials.', 'success');
        }}
        onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        isMobileMenuOpen={isMobileMenuOpen}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          activeTradesCount={activeTrades.length}
          isOpenMobile={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-6 lg:p-8 pb-24 md:pb-8">
          <div className="mx-auto max-w-7xl">
            {currentTab === 'dashboard' && (
              <DashboardPage
                analytics={analytics}
                activeTrades={activeTrades}
                closedTrades={tradeHistory}
                prices={prices}
                latestConsensus={consensusResult}
                botStatus={botStatus}
                onToggleStartStop={handleToggleStartStop}
                onTogglePauseResume={handleTogglePauseResume}
                onNavigateTab={setCurrentTab}
                onSelectSymbol={(sym) => {
                  setSelectedSymbol(sym);
                  loadSymbolData(sym);
                }}
                onCloseTrade={handleCloseTrade}
                onTriggerOpenTrade={handleTriggerOpenTrade}
              />
            )}

            {currentTab === 'market-analysis' && (
              <MarketAnalysisPage
                symbol={selectedSymbol}
                onSelectSymbol={(sym) => {
                  setSelectedSymbol(sym);
                  loadSymbolData(sym);
                }}
                candles={candles}
                technical={technical}
                marketData={marketData}
                onTriggerDualAI={handleRunDualAIScan}
                onTriggerOpenTrade={handleTriggerOpenTrade}
                isScanning={isScanning}
              />
            )}

            {currentTab === 'ai-decisions' && (
              <AIDecisionPage
                symbol={selectedSymbol}
                onSelectSymbol={(sym) => {
                  setSelectedSymbol(sym);
                  loadSymbolData(sym);
                }}
                openAIResult={openAIResult}
                geminiResult={geminiResult}
                technicalResult={technical}
                consensusResult={consensusResult}
                isScanning={isScanning}
                onRunDualAIScan={handleRunDualAIScan}
                onProceedToRiskCheck={(sym, dir) => {
                  setCurrentTab('risk-management');
                }}
              />
            )}

            {currentTab === 'risk-management' && (
              <RiskManagementPage
                settings={riskSettings}
                onSaveSettings={handleSaveRiskSettings}
                currentRiskCheck={currentRiskCheck}
                symbol={selectedSymbol}
                direction={technical?.decision === 'HOLD' ? 'LONG' : (technical?.decision || 'LONG')}
                currentPrice={prices[selectedSymbol] || 67420.5}
                onRunRiskCheck={async (sym, dir) => {
                  const res = await checkRisk({ symbol: sym, direction: dir });
                  setCurrentRiskCheck(res);
                  showToast('Risk engine evaluation updated!', 'info');
                }}
                onExecuteTrade={handleTriggerOpenTrade}
              />
            )}

            {currentTab === 'active-trades' && (
              <ActiveTradesPage
                trades={activeTrades}
                onCloseTrade={handleCloseTrade}
                onNavigateTab={setCurrentTab}
                wsConnected={wsConnected}
              />
            )}

            {currentTab === 'trade-history' && (
              <TradeHistoryPage trades={tradeHistory} />
            )}

            {currentTab === 'audit-logs' && (
              <AuditLogsPage
                wsConnected={wsConnected}
                onNavigateTab={setCurrentTab}
              />
            )}

            {currentTab === 'assets' && (
              <AssetsPage onNavigate={setCurrentTab} />
            )}

            {currentTab === 'api-connect' && (
              <APIConnectPage onShowToast={showToast} onNavigate={setCurrentTab} />
            )}

            {currentTab === 'analytics' && (
              <AnalyticsPage analytics={analytics} />
            )}


            {currentTab === 'settings' && (
              <SettingsPage />
            )}

            {currentTab === 'auth' && (
              <AuthPage
                onAuthSuccess={handleAuthSuccess}
                onShowToast={showToast}
              />
            )}
          </div>
        </main>
      </div>

      {/* Mobile Sticky Bottom Navigation Bar */}
      <BottomNav
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setCurrentTab(tab);
          setIsMobileMenuOpen(false);
        }}
        activeTradesCount={activeTrades.length}
        onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
      />

      {/* Auth Modal Popup */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md">
            <AuthPage
              onAuthSuccess={handleAuthSuccess}
              onShowToast={showToast}
              onClose={() => setIsAuthModalOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Execution Confirmation Modal */}
      <OpenTradeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        symbol={modalSymbol}
        direction={modalDirection}
        currentPrice={prices[modalSymbol] || 67420.5}
        riskCheck={modalRiskCheck}
        consensusScore={consensusResult?.consensusScore || 85}
        onConfirmOrder={handleConfirmOrder}
      />
    </div>
  );
}
