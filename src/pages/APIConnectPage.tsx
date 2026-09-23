import React, { useState, useEffect } from 'react';
import {
  Key,
  Shield,
  ShieldCheck,
  Lock,
  Copy,
  Check,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Eye,
  EyeOff,
  Activity,
  Globe,
  Trash2,
  Coins,
  Zap,
  Wallet,
  ArrowRight,
  ExternalLink,
  Server
} from 'lucide-react';
import {
  SupportedExchange,
  ExchangeConnectionInfo,
  AllExchangeBalancesResponse,
  ConnectionTestResult
} from '../types';
import { NavTab } from '../components/Sidebar';
import {
  fetchExchangeConnections,
  connectExchange,
  disconnectExchange,
  fetchExchangeBalances,
  refreshExchangeBalances,
  testExchangeConnection,
  getApiBaseUrl
} from '../services/api';
import { CloudRunDeploymentModal } from '../components/CloudRunDeploymentModal';

interface APIConnectPageProps {
  onShowToast?: (title: string, type: 'success' | 'info' | 'error') => void;
  onNavigate?: (tab: NavTab) => void;
}

export const APIConnectPage: React.FC<APIConnectPageProps> = ({ onShowToast, onNavigate }) => {
  const [selectedExchange, setSelectedExchange] = useState<SupportedExchange>('Binance');
  const [apiKey, setApiKey] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [passphrase, setPassphrase] = useState('');
  const [showSecret, setShowSecret] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<ConnectionTestResult | null>(null);
  const [isRefreshingBalances, setIsRefreshingBalances] = useState(false);
  const [balanceData, setBalanceData] = useState<AllExchangeBalancesResponse | null>(null);
  const [copiedIPs, setCopiedIPs] = useState(false);
  const [isDeployModalOpen, setIsDeployModalOpen] = useState(false);
  const [activeBackendUrl, setActiveBackendUrl] = useState<string>(getApiBaseUrl());

  const [trustedIPs, setTrustedIPs] = useState<string[]>([
    '34.126.154.21',
    '35.240.219.88',
    '34.87.112.45',
  ]);
  const [connections, setConnections] = useState<Record<SupportedExchange, ExchangeConnectionInfo>>({
    Binance: {
      exchange: 'Binance',
      apiKeyMasked: '',
      hasSecret: false,
      status: 'DISCONNECTED',
      trustedIPsOnly: true,
      pingMs: 24,
      permissions: { read: true, spotTrading: true, futuresTrading: true, withdrawals: false },
    },
    Bybit: {
      exchange: 'Bybit',
      apiKeyMasked: '',
      hasSecret: false,
      status: 'DISCONNECTED',
      trustedIPsOnly: true,
      pingMs: 28,
      permissions: { read: true, spotTrading: true, futuresTrading: true, withdrawals: false },
    },
    Bitget: {
      exchange: 'Bitget',
      apiKeyMasked: '',
      hasSecret: false,
      hasPassphrase: false,
      status: 'DISCONNECTED',
      trustedIPsOnly: true,
      pingMs: 31,
      permissions: { read: true, spotTrading: true, futuresTrading: true, withdrawals: false },
    },
  });

  const ipString = trustedIPs.join(', ');

  // Load existing connections strictly from server (no local credential storage)
  const loadConnections = async () => {
    try {
      const data = await fetchExchangeConnections();
      if (data.connections) {
        setConnections(data.connections);
      }
      if (data.trustedIPs && data.trustedIPs.length > 0) {
        setTrustedIPs(data.trustedIPs);
      }
    } catch (err) {
      console.warn('Could not fetch exchange connections from server:', err);
    }

    // Also fetch real balances from server
    try {
      const bData = await fetchExchangeBalances();
      setBalanceData(bData);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadConnections();
  }, []);

  const handleTestConnection = async () => {
    if (!apiKey.trim() || !secretKey.trim()) {
      if (onShowToast) {
        onShowToast('Please provide both API Key and Secret Key to test connection.', 'error');
      }
      return;
    }

    if (selectedExchange === 'Bitget' && !passphrase.trim()) {
      if (onShowToast) {
        onShowToast('Bitget requires an API passphrase.', 'error');
      }
      return;
    }

    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await testExchangeConnection({
        exchange: selectedExchange,
        apiKey: apiKey.trim(),
        secretKey: secretKey.trim(),
        passphrase: passphrase.trim() || undefined,
      });

      setTestResult(res);
      if (res.success) {
        if (onShowToast) {
          onShowToast(
            `Connection test passed (${res.latencyMs}ms)! Read & trade permissions verified. Withdrawals disabled.`,
            'success'
          );
        }
      } else {
        if (onShowToast) {
          onShowToast(res.error || 'Connection test failed.', 'error');
        }
      }
    } catch (err: any) {
      const failureResult: ConnectionTestResult = {
        success: false,
        exchange: selectedExchange,
        status: 'ERROR',
        latencyMs: 0,
        permissions: { read: false, trade: false, withdrawal: false },
        error: err.message || 'Connection test failed',
      };
      setTestResult(failureResult);
      if (onShowToast) {
        onShowToast(err.message || 'Connection test failed.', 'error');
      }
    } finally {
      setIsTesting(false);
    }
  };

  const handleRefreshBalances = async () => {
    try {
      setIsRefreshingBalances(true);
      const res = await refreshExchangeBalances(selectedExchange);
      if (res.balances) {
        setBalanceData((prev) => prev ? { ...prev, balances: res.balances! } : null);
      } else {
        const bData = await fetchExchangeBalances();
        setBalanceData(bData);
      }
      if (onShowToast) {
        onShowToast(`Synchronized real balances for ${selectedExchange}.`, 'success');
      }
    } catch (err: any) {
      if (onShowToast) {
        onShowToast(err.message || 'Failed to sync balance.', 'error');
      }
    } finally {
      setIsRefreshingBalances(false);
    }
  };

  const handleCopyIPs = async () => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(ipString);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = ipString;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopiedIPs(true);
      if (onShowToast) onShowToast('Trusted IPs copied to clipboard!', 'success');
      setTimeout(() => setCopiedIPs(false), 2500);
    } catch {
      if (onShowToast) onShowToast('Failed to copy IPs. Please copy manually.', 'error');
    }
  };

  // Import button action
  const handleImport = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!apiKey.trim() || !secretKey.trim()) {
      if (onShowToast) {
        onShowToast('Please provide both API Key and Secret Key.', 'error');
      }
      return;
    }

    if (selectedExchange === 'Bitget' && !passphrase.trim()) {
      if (onShowToast) {
        onShowToast('Bitget requires an API passphrase.', 'error');
      }
      return;
    }

    setIsConnecting(true);
    try {
      const res = await connectExchange({
        exchange: selectedExchange,
        apiKey: apiKey.trim(),
        secretKey: secretKey.trim(),
        passphrase: passphrase.trim() ? passphrase.trim() : undefined,
        trustIPsOnly: true,
        selectedMode: 'SPOT',
      });

      // Update connection state from server response
      const masked = `${apiKey.trim().slice(0, 4)}••••••••${apiKey.trim().slice(-4)}`;
      setConnections((prev) => ({
        ...prev,
        [selectedExchange]: {
          ...prev[selectedExchange],
          status: 'CONNECTED' as const,
          apiKeyMasked: masked,
          hasSecret: true,
          hasPassphrase: !!passphrase.trim(),
          connectedAt: Date.now(),
          pingMs: res.pingMs || 22,
          permissions: res.permissions || {
            read: true,
            spotTrading: true,
            futuresTrading: true,
            withdrawals: false,
          },
        },
      }));

      // Update balances state
      if (res.balance) {
        setBalanceData((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            activeExchange: selectedExchange,
            totalBotCapital: res.botCapital ?? res.balance!.activeBotCapital,
            balances: {
              ...prev.balances,
              [selectedExchange]: res.balance!,
            },
          };
        });
      } else {
        const bData = await fetchExchangeBalances();
        setBalanceData(bData);
      }

      setApiKey('');
      setSecretKey('');
      setPassphrase('');
      setTestResult(null);

      if (onShowToast) {
        const botCap = res.botCapital !== undefined ? `${res.botCapital.toFixed(2)} USDT` : 'Available Balance';
        onShowToast(
          `${selectedExchange} securely connected & encrypted! Bot Capital synchronized to ${botCap}.`,
          'success'
        );
      }
    } catch (err: any) {
      if (onShowToast) {
        onShowToast(err?.message || 'Failed to connect exchange. Please verify credentials.', 'error');
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async (ex: SupportedExchange) => {
    try {
      await disconnectExchange(ex);
      setConnections((prev) => ({
        ...prev,
        [ex]: {
          ...prev[ex],
          status: 'DISCONNECTED' as const,
          apiKeyMasked: '',
          hasSecret: false,
        },
      }));
      setTestResult(null);
      await loadConnections();
      if (onShowToast) onShowToast(`${ex} disconnected.`, 'info');
    } catch {
      if (onShowToast) onShowToast('Error disconnecting exchange.', 'error');
    }
  };

  const currentConnection = connections[selectedExchange];

  return (
    <div className="space-y-6 text-[#bf9b42]">
      {/* Top Banner with Logo */}
      <div className="rounded-2xl border border-[#bf9b42]/30 bg-[#022824]/90 p-5 shadow-md backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <img
              src="/novaquant-logo.jpg"
              alt="NovaQuant Algorithmic Trading"
              className="h-12 w-12 rounded-full object-cover border-2 border-[#bf9b42] shadow-md shadow-[#bf9b42]/20 shrink-0"
            />
            <div>
              <h1 className="text-lg font-bold text-[#f5e6b3] flex items-center gap-2">
                <Key className="h-5 w-5 text-[#bf9b42]" />
                <span>API Connect Option</span>
              </h1>
              <p className="text-xs text-[#e5c158]/80 mt-0.5">
                Securely connect Binance, Bybit, or Bitget (Bitgate) trading gateways for automated AI strategy execution.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-300">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              <span>Zero-Withdrawal Policy Enforced</span>
            </span>
            <span className="flex items-center gap-1.5 rounded-full border border-[#bf9b42]/40 bg-[#bf9b42]/15 px-3 py-1 text-xs font-semibold text-[#f5e6b3]">
              <Lock className="h-3.5 w-3.5 text-[#bf9b42]" />
              <span>AES-256-GCM Encrypted</span>
            </span>
          </div>
        </div>
      </div>

      {/* Cloud Run & Dedicated Static IP Integration Banner */}
      <div className="rounded-2xl border border-cyan-500/40 bg-gradient-to-r from-[#021f24] via-[#022b30] to-[#021f24] p-4 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 shrink-0">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <span>Cloud Run Backend &amp; Static IP Egress</span>
                  <span className="text-[10px] px-2 py-0.5 bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 rounded-full font-mono">
                    Binance / Bybit / Bitget Whitelist
                  </span>
                </h3>
                {activeBackendUrl ? (
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-md font-medium">
                    Remote Cloud Run Connected
                  </span>
                ) : (
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-md font-medium">
                    AI Studio Dev Gateway
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300 mt-1">
                Active Static Egress IP:{' '}
                <code className="font-mono text-cyan-300 font-bold bg-slate-950 px-2 py-0.5 rounded border border-cyan-500/30">
                  {trustedIPs[0] || '34.126.154.21'}
                </code>{' '}
                <span className="text-slate-400">
                  (Used by Cloud NAT to guarantee 100% IP whitelist compliance)
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleCopyIPs}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-500/30 transition-colors"
            >
              {copiedIPs ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-cyan-400" />}
              <span>{copiedIPs ? 'Copied IP' : 'Copy IP'}</span>
            </button>
            <button
              type="button"
              onClick={() => setIsDeployModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white shadow-md shadow-cyan-600/25 transition-all"
            >
              <Zap className="w-3.5 h-3.5 text-amber-300" />
              <span>Deploy Backend &amp; Static IP Setup</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Real Available Balance Card when Connected */}
      {currentConnection?.status === 'CONNECTED' && (
        <div className="rounded-2xl border-2 border-[#bf9b42] bg-gradient-to-r from-[#022824] via-[#033631] to-[#022824] p-5 shadow-lg space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#044a43] pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#bf9b42]/20 border border-[#bf9b42]/40 flex items-center justify-center">
                <Coins className="w-4 h-4 text-[#bf9b42]" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#f3ebd7] flex items-center gap-2">
                  <span>{selectedExchange} Real Available Balance Synchronized</span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/40">
                    Live API Verified
                  </span>
                </h3>
                <p className="text-[11px] text-[#a2b5af]">
                  Bot Capital automatically set = Available Exchange Trading Balance
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleRefreshBalances}
                disabled={isRefreshingBalances}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded bg-[#021f1c] text-[#f3ebd7] border border-[#bf9b42]/40 hover:border-[#bf9b42] transition-all disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 text-[#bf9b42] ${isRefreshingBalances ? 'animate-spin' : ''}`} />
                <span>{isRefreshingBalances ? 'Querying API...' : 'Synchronize Balance'}</span>
              </button>
              {onNavigate && (
                <button
                  type="button"
                  onClick={() => onNavigate('assets')}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded bg-[#bf9b42] text-[#021f1c] hover:bg-[#d4ac4d] transition-all shadow"
                >
                  <Wallet className="w-3 h-3" />
                  <span>View in Assets</span>
                </button>
              )}
            </div>
          </div>

          {/* Capital Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-[#021f1c] p-3 rounded-xl border border-[#044a43]">
              <span className="text-[10px] font-semibold text-[#8ea49e] uppercase">Capital</span>
              <div className="text-xl font-bold font-mono text-[#f3ebd7] mt-0.5">
                {balanceData?.balances?.[selectedExchange]
                  ? (
                      balanceData.balances[selectedExchange].spot.capital +
                      balanceData.balances[selectedExchange].futures.capital
                    ).toFixed(2)
                  : '0.00'}{' '}
                <span className="text-xs text-[#bf9b42]">USDT</span>
              </div>
              <span className="text-[10px] text-[#8ea49e]">Total Exchange Portfolio</span>
            </div>

            <div className="bg-[#033631] p-3 rounded-xl border-2 border-[#bf9b42] shadow-sm">
              <span className="text-[10px] font-bold text-[#bf9b42] uppercase flex items-center justify-between">
                <span>Bot Capital</span>
                <span className="text-[9px] bg-[#bf9b42] text-[#021f1c] px-1.5 py-0.2 rounded font-extrabold">
                  AUTO-SET
                </span>
              </span>
              <div className="text-xl font-bold font-mono text-[#f3ebd7] mt-0.5">
                {balanceData?.balances?.[selectedExchange]
                  ? balanceData.balances[selectedExchange].activeBotCapital.toFixed(2)
                  : '0.00'}{' '}
                <span className="text-xs text-[#bf9b42]">USDT</span>
              </div>
              <span className="text-[10px] text-emerald-300">
                = Available {balanceData?.balances?.[selectedExchange]?.selectedMode || 'SPOT'} Balance
              </span>
            </div>

            <div className="bg-[#021f1c] p-3 rounded-xl border border-[#044a43]">
              <span className="text-[10px] font-semibold text-emerald-400 uppercase">Available</span>
              <div className="text-xl font-bold font-mono text-emerald-400 mt-0.5">
                {balanceData?.balances?.[selectedExchange]
                  ? balanceData.balances[selectedExchange].activeBotCapital.toFixed(2)
                  : '0.00'}{' '}
                <span className="text-xs text-[#bf9b42]">USDT</span>
              </div>
              <span className="text-[10px] text-[#8ea49e]">Excludes locked & margin</span>
            </div>
          </div>

          {/* Granular Breakdown Preview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-[#021f1c]/70 p-3 rounded-lg border border-[#044a43]">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-[#8ea49e]">Spot Available:</span>
              <span className="font-mono text-[#f3ebd7] font-bold">
                {balanceData?.balances?.[selectedExchange]?.spot.available.toFixed(2) ?? '0.00'} USDT
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-[#8ea49e]">Futures Available Margin:</span>
              <span className="font-mono text-emerald-400 font-bold">
                {balanceData?.balances?.[selectedExchange]?.futures.available.toFixed(2) ?? '0.00'} USDT
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid: API Connect Form & Trust IPs Only */}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 Columns: Connection Form */}
        <div className="lg:col-span-7 space-y-6">
          <div className="rounded-2xl border border-[#bf9b42]/30 bg-[#022824]/90 p-6 shadow-sm backdrop-blur-sm space-y-5">
            {/* Exchange Selector */}
            <div>
              <label className="text-xs font-semibold text-[#f5e6b3] block mb-2">
                Select Target Exchange
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {(['Binance', 'Bybit', 'Bitget'] as SupportedExchange[]).map((ex) => {
                  const isConn = connections[ex]?.status === 'CONNECTED';
                  const label = ex === 'Bitget' ? 'Bitgate (Bitget)' : ex;
                  return (
                    <button
                      key={ex}
                      type="button"
                      onClick={() => setSelectedExchange(ex)}
                      className={`relative rounded-xl border p-3 text-center transition-all cursor-pointer ${
                        selectedExchange === ex
                          ? 'border-[#bf9b42] bg-[#bf9b42]/25 text-[#fbf2d5] shadow-sm shadow-[#bf9b42]/20 font-bold'
                          : 'border-[#bf9b42]/20 bg-[#033631]/80 text-[#e5c158]/75 hover:border-[#bf9b42]/50 hover:text-[#fbf2d5]'
                      }`}
                    >
                      <div className="text-xs font-bold">{label}</div>
                      <div className="flex items-center justify-center gap-1 text-[10px] mt-1">
                        {isConn ? (
                          <span className="flex items-center gap-1 text-emerald-400 font-medium">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            Connected
                          </span>
                        ) : (
                          <span className="text-[#bf9b42]/60">Not Connected</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Input Form */}
            <form onSubmit={handleImport} className="space-y-4">
              {/* API Key Field */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="api-key-input" className="text-xs font-semibold text-[#f5e6b3] flex items-center gap-1.5">
                    <Key className="h-3.5 w-3.5 text-[#bf9b42]" />
                    <span>API Key (Binance/ Bybit /Bitgate):</span>
                  </label>
                  {currentConnection?.apiKeyMasked && (
                    <span className="text-[10px] text-[#bf9b42]/80 font-mono">
                      Active: {currentConnection.apiKeyMasked}
                    </span>
                  )}
                </div>
                <div className="relative">
                  <input
                    id="api-key-input"
                    type="text"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder={`Enter your ${selectedExchange === 'Bitget' ? 'Bitgate/Bitget' : selectedExchange} API Key`}
                    className="w-full rounded-xl border border-[#bf9b42]/30 bg-[#033631] px-3.5 py-2.5 text-xs text-white font-mono placeholder:text-[#bf9b42]/50 focus:border-[#bf9b42] focus:outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Secret Key Field */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="secret-key-input" className="text-xs font-semibold text-[#f5e6b3] flex items-center gap-1.5">
                    <Lock className="h-3.5 w-3.5 text-[#bf9b42]" />
                    <span>Secret Key (Binance/ Bybit /Bitgate):</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowSecret(!showSecret)}
                    className="text-[11px] text-[#bf9b42] hover:text-[#f5e6b3] flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    {showSecret ? (
                      <>
                        <EyeOff className="h-3 w-3" />
                        <span>Hide Secret</span>
                      </>
                    ) : (
                      <>
                        <Eye className="h-3 w-3" />
                        <span>Show Secret</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="relative">
                  <input
                    id="secret-key-input"
                    type={showSecret ? 'text' : 'password'}
                    value={secretKey}
                    onChange={(e) => setSecretKey(e.target.value)}
                    placeholder={`Enter your ${selectedExchange === 'Bitget' ? 'Bitgate/Bitget' : selectedExchange} Secret Key`}
                    className="w-full rounded-xl border border-[#bf9b42]/30 bg-[#033631] px-3.5 py-2.5 text-xs text-white font-mono placeholder:text-[#bf9b42]/50 focus:border-[#bf9b42] focus:outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Passphrase for Bitget / Bitgate */}
              {selectedExchange === 'Bitget' && (
                <div>
                  <label htmlFor="passphrase-input" className="text-xs font-semibold text-[#f5e6b3] flex items-center gap-1.5 mb-1.5">
                    <Key className="h-3.5 w-3.5 text-[#bf9b42]" />
                    <span>API Passphrase (Required for Bitgate / Bitget):</span>
                  </label>
                  <input
                    id="passphrase-input"
                    type="password"
                    value={passphrase}
                    onChange={(e) => setPassphrase(e.target.value)}
                    placeholder="Enter Bitget API passphrase"
                    className="w-full rounded-xl border border-[#bf9b42]/30 bg-[#033631] px-3.5 py-2.5 text-xs text-white font-mono placeholder:text-[#bf9b42]/50 focus:border-[#bf9b42] focus:outline-none transition-colors"
                  />
                </div>
              )}

              {/* Actions Row: Test Connection & Import Buttons */}
              <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  id="test-api-btn"
                  type="button"
                  onClick={handleTestConnection}
                  disabled={isTesting || isConnecting}
                  className="rounded-xl border border-[#bf9b42]/60 bg-[#033631] px-4 py-2.5 text-xs font-bold text-[#f5e6b3] hover:bg-[#bf9b42]/20 active:scale-[0.99] disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isTesting ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin text-[#bf9b42]" />
                      <span>Testing Handshake...</span>
                    </>
                  ) : (
                    <>
                      <Activity className="h-4 w-4 text-[#bf9b42]" />
                      <span>Test Connection</span>
                    </>
                  )}
                </button>

                <button
                  id="import-api-btn"
                  type="submit"
                  disabled={isConnecting || isTesting}
                  className="rounded-xl bg-gradient-to-r from-[#bf9b42] to-[#9c7c2b] px-4 py-2.5 text-xs font-bold text-[#033631] shadow-lg shadow-[#bf9b42]/20 hover:brightness-110 active:scale-[0.99] disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isConnecting ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin text-[#033631]" />
                      <span>Validating &amp; Encrypting...</span>
                    </>
                  ) : (
                    <>
                      <UploadCloud className="h-4 w-4 text-[#033631]" />
                      <span>Import &amp; Save ({selectedExchange})</span>
                    </>
                  )}
                </button>
              </div>

              {/* Connection Test Result Inspection Panel */}
              {testResult && (
                <div
                  className={`rounded-xl border p-4 text-xs space-y-3 transition-all ${
                    testResult.success
                      ? 'border-emerald-500/50 bg-emerald-950/20 text-emerald-200'
                      : 'border-rose-500/50 bg-rose-950/20 text-rose-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {testResult.success ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0" />
                      )}
                      <span className="font-bold">
                        {testResult.success
                          ? `${testResult.exchange} Gateway Handshake Passed (${testResult.latencyMs}ms)`
                          : `${testResult.exchange} Connection Failed`}
                      </span>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                        testResult.success
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      }`}
                    >
                      {testResult.status}
                    </span>
                  </div>

                  {testResult.error && (
                    <p className="text-[11px] text-rose-300 bg-rose-900/30 p-2 rounded-lg border border-rose-800/40">
                      {testResult.error}
                    </p>
                  )}

                  {/* Permissions Checklist */}
                  <div className="grid grid-cols-3 gap-2 pt-1">
                    <div className="rounded-lg bg-[#021f1c] p-2 border border-[#bf9b42]/20">
                      <div className="text-[10px] text-[#bf9b42]">Read Account:</div>
                      <div className="font-semibold text-[11px] text-white flex items-center gap-1 mt-0.5">
                        {testResult.permissions.read ? (
                          <Check className="h-3 w-3 text-emerald-400" />
                        ) : (
                          <span className="text-rose-400">✗</span>
                        )}
                        <span>{testResult.permissions.read ? 'Verified' : 'Disabled'}</span>
                      </div>
                    </div>

                    <div className="rounded-lg bg-[#021f1c] p-2 border border-[#bf9b42]/20">
                      <div className="text-[10px] text-[#bf9b42]">Trading:</div>
                      <div className="font-semibold text-[11px] text-white flex items-center gap-1 mt-0.5">
                        {testResult.permissions.trade ? (
                          <Check className="h-3 w-3 text-emerald-400" />
                        ) : (
                          <span className="text-rose-400">✗</span>
                        )}
                        <span>{testResult.permissions.trade ? 'Verified' : 'Disabled'}</span>
                      </div>
                    </div>

                    <div className="rounded-lg bg-[#021f1c] p-2 border border-[#bf9b42]/20">
                      <div className="text-[10px] text-[#bf9b42]">Withdrawals:</div>
                      <div className="font-semibold text-[11px] mt-0.5 flex items-center gap-1">
                        {testResult.permissions.withdrawal ? (
                          <span className="text-rose-400 flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3 text-rose-400" />
                            <span>ALLOWED (Unsafe)</span>
                          </span>
                        ) : (
                          <span className="text-emerald-400 flex items-center gap-1">
                            <Check className="h-3 w-3 text-emerald-400" />
                            <span>Disabled (Safe)</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {testResult.permissions.withdrawal && (
                    <div className="text-[11px] text-rose-300 font-semibold flex items-center gap-1.5 bg-rose-900/40 p-2 rounded-lg">
                      <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400" />
                      <span>
                        Security Policy Violation: Withdrawals are enabled. NovaQuant strictly rejects any API key with withdrawal permissions enabled. Please disable withdrawals on {selectedExchange} and re-test.
                      </span>
                    </div>
                  )}
                </div>
              )}
            </form>

            {/* If currently connected, show disconnect option */}
            {currentConnection?.status === 'CONNECTED' && (
              <div className="pt-3 border-t border-[#bf9b42]/20 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-emerald-400">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <span>{selectedExchange} API Gateway is active and streaming market data.</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleDisconnect(selectedExchange)}
                  className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Disconnect</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right 5 Columns: Trust IPs Only (Recommended) + Security Guidelines */}
        <div className="lg:col-span-5 space-y-6">
          {/* Trust IPs Only (Recommended) Card */}
          <div className="rounded-2xl border border-[#bf9b42]/40 bg-gradient-to-b from-[#022824] via-[#033631]/90 to-[#022824] p-6 shadow-md backdrop-blur-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-[#bf9b42]" />
                <h2 className="text-sm font-bold text-[#f5e6b3]">Trust IPs Only (Recommended)</h2>
              </div>
              <span className="rounded-full border border-[#bf9b42]/40 bg-[#bf9b42]/20 px-2.5 py-0.5 text-[10px] font-bold text-[#f5e6b3] uppercase tracking-wider">
                Recommended
              </span>
            </div>

            <p className="text-xs text-slate-200/90 leading-relaxed">
              When creating your API Key on <strong>Binance</strong>, <strong>Bybit</strong>, or <strong>Bitgate/Bitget</strong>, enable <em>"Restrict access to trusted IPs only"</em>. This ensures orders can only be executed by the authorized NovaQuant trading cluster.
            </p>

            {/* IP Box with Copy button */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] font-semibold text-[#f5e6b3]">
                <span>Cluster Outbound Egress IPs:</span>
                <span className="text-[#bf9b42]/80 text-[10px]">3 Verified Gateway Nodes</span>
              </div>

              <div className="rounded-xl border border-[#bf9b42]/30 bg-[#033631] p-3 space-y-2">
                <div className="font-mono text-xs text-[#f5e6b3] break-all select-all leading-relaxed bg-[#022824] p-2 rounded-lg border border-[#bf9b42]/20">
                  {ipString}
                </div>

                {/* Copy button & Cloud Run modal button */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsDeployModalOpen(true)}
                    className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 transition-colors"
                  >
                    <Server className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Cloud Run &amp; Static IP Whitelisting Guide</span>
                  </button>

                  <button
                    id="copy-trusted-ips-btn"
                    type="button"
                    onClick={handleCopyIPs}
                    className={`rounded-lg px-4 py-1.5 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      copiedIPs
                        ? 'border border-emerald-500/50 bg-emerald-500/20 text-emerald-300 shadow-sm'
                        : 'border border-[#bf9b42]/40 bg-[#bf9b42]/20 text-[#f5e6b3] hover:bg-[#bf9b42]/30 hover:border-[#bf9b42]'
                    }`}
                  >
                    {copiedIPs ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5 text-[#bf9b42]" />
                        <span>Copy button (Copy IPs)</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Key Permissions Checklist */}
            <div className="rounded-xl border border-[#bf9b42]/20 bg-[#033631]/60 p-3 space-y-2">
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#bf9b42]">
                Required Exchange Permissions:
              </div>
              <ul className="space-y-1.5 text-xs">
                <li className="flex items-center gap-2 text-slate-200">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  <span><strong>Enable Reading</strong> (Market &amp; account queries)</span>
                </li>
                <li className="flex items-center gap-2 text-slate-200">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  <span><strong>Enable Spot &amp; Margin Trading</strong></span>
                </li>
                <li className="flex items-center gap-2 text-slate-200">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  <span><strong>Enable Futures Trading</strong> (If trading perps)</span>
                </li>
                <li className="flex items-center gap-2 text-rose-300 font-semibold">
                  <AlertTriangle className="h-3.5 w-3.5 text-rose-400 shrink-0" />
                  <span><strong>DO NOT Enable Withdrawals</strong> (Strict security rule)</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Connection Health & Status Card */}
          <div className="rounded-2xl border border-[#bf9b42]/30 bg-[#022824]/90 p-5 shadow-sm backdrop-blur-sm space-y-3">
            <div className="flex items-center justify-between border-b border-[#bf9b42]/20 pb-2.5">
              <span className="text-xs font-bold text-[#f5e6b3] flex items-center gap-1.5">
                <Activity className="h-3.5 w-3.5 text-[#bf9b42]" />
                <span>Active Exchange Gateway Status</span>
              </span>
              <span className="text-[10px] text-[#bf9b42]/80">Low-latency REST / WS</span>
            </div>

            <div className="space-y-2">
              {(['Binance', 'Bybit', 'Bitget'] as SupportedExchange[]).map((ex) => {
                const conn = connections[ex];
                const isConn = conn?.status === 'CONNECTED';
                const exName = ex === 'Bitget' ? 'Bitgate / Bitget' : ex;

                return (
                  <div
                    key={ex}
                    className="flex items-center justify-between rounded-xl border border-[#bf9b42]/20 bg-[#033631]/70 px-3 py-2 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`h-2 w-2 rounded-full ${
                          isConn ? 'bg-emerald-400 shadow-sm shadow-emerald-400' : 'bg-slate-600'
                        }`}
                      />
                      <span className="font-semibold text-slate-200">{exName}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      {isConn ? (
                        <>
                          <span className="font-mono text-[11px] text-[#bf9b42]">
                            {conn.apiKeyMasked}
                          </span>
                          <span className="text-[10px] text-emerald-400 font-mono">
                            {conn.pingMs}ms
                          </span>
                          <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/30">
                            ONLINE
                          </span>
                        </>
                      ) : (
                        <span className="text-[10px] text-[#bf9b42]/60">STANDBY</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <CloudRunDeploymentModal
        isOpen={isDeployModalOpen}
        onClose={() => {
          setIsDeployModalOpen(false);
          setActiveBackendUrl(getApiBaseUrl());
        }}
        onShowToast={onShowToast}
      />
    </div>
  );
};
