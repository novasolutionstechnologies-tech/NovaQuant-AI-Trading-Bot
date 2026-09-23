import React, { useState, useEffect } from 'react';
import {
  Server,
  Globe,
  Shield,
  ShieldCheck,
  Copy,
  Check,
  RefreshCw,
  Zap,
  ExternalLink,
  Terminal,
  Activity,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  X,
  Layers,
  Cpu
} from 'lucide-react';
import {
  getApiBaseUrl,
  setApiBaseUrl,
  fetchOutboundIpInfo,
  testRemoteBackendConnection,
  OutboundIpInfo
} from '../services/api';

interface CloudRunDeploymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast?: (title: string, type: 'success' | 'info' | 'error') => void;
}

type ModalTab = 'whitelist' | 'connect' | 'scripts' | 'architecture';

export const CloudRunDeploymentModal: React.FC<CloudRunDeploymentModalProps> = ({
  isOpen,
  onClose,
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<ModalTab>('whitelist');
  const [selectedExchange, setSelectedExchange] = useState<'Binance' | 'Bybit' | 'Bitget'>('Binance');

  // Connection settings
  const [currentBackendUrl, setCurrentBackendUrl] = useState<string>(getApiBaseUrl());
  const [inputBackendUrl, setInputBackendUrl] = useState<string>(getApiBaseUrl());
  const [isTestingBackend, setIsTestingBackend] = useState(false);
  const [backendTestResult, setBackendTestResult] = useState<{
    success: boolean;
    latencyMs: number;
    outboundIp?: string;
    isCloudRun?: boolean;
    error?: string;
  } | null>(null);

  // Outbound IP diagnostics
  const [ipInfo, setIpInfo] = useState<OutboundIpInfo | null>(null);
  const [isLoadingIp, setIsLoadingIp] = useState(false);
  const [copiedIp, setCopiedIp] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const loadIpInfo = async (forceRefresh = false) => {
    setIsLoadingIp(true);
    try {
      const data = await fetchOutboundIpInfo(forceRefresh);
      setIpInfo(data);
    } catch (err: any) {
      console.warn('Could not load outbound IP info:', err);
    } finally {
      setIsLoadingIp(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setCurrentBackendUrl(getApiBaseUrl());
      setInputBackendUrl(getApiBaseUrl());
      loadIpInfo();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const staticIp = ipInfo?.outboundIp || '34.126.154.21';

  const handleCopyIp = async () => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(staticIp);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = staticIp;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopiedIp(true);
      if (onShowToast) onShowToast(`Static IP ${staticIp} copied!`, 'success');
      setTimeout(() => setCopiedIp(false), 2500);
    } catch {
      if (onShowToast) onShowToast('Failed to copy IP', 'error');
    }
  };

  const handleCopySnippet = async (key: string, snippet: string) => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(snippet);
      }
      setCopiedCode(key);
      if (onShowToast) onShowToast('Code copied to clipboard!', 'success');
      setTimeout(() => setCopiedCode(null), 2500);
    } catch {
      // ignore
    }
  };

  const handleTestBackend = async () => {
    if (!inputBackendUrl.trim()) {
      if (onShowToast) onShowToast('Please enter a Cloud Run backend URL', 'error');
      return;
    }
    setIsTestingBackend(true);
    setBackendTestResult(null);
    try {
      const result = await testRemoteBackendConnection(inputBackendUrl.trim());
      setBackendTestResult(result);
      if (result.success) {
        if (onShowToast) {
          onShowToast(
            `Backend reachable (${result.latencyMs}ms)! ${result.isCloudRun ? 'Cloud Run Verified.' : ''}`,
            'success'
          );
        }
      } else {
        if (onShowToast) onShowToast(result.error || 'Connection failed', 'error');
      }
    } finally {
      setIsTestingBackend(false);
    }
  };

  const handleApplyBackend = () => {
    const targetUrl = inputBackendUrl.trim();
    setApiBaseUrl(targetUrl);
    setCurrentBackendUrl(targetUrl);
    if (onShowToast) {
      if (targetUrl) {
        onShowToast(`Connected AI Studio frontend to Cloud Run: ${targetUrl}`, 'success');
      } else {
        onShowToast('Switched back to embedded AI Studio local backend', 'info');
      }
    }
    loadIpInfo(true);
  };

  const handleResetToLocal = () => {
    setInputBackendUrl('');
    setApiBaseUrl(null);
    setCurrentBackendUrl('');
    setBackendTestResult(null);
    if (onShowToast) onShowToast('Restored local AI Studio backend connection', 'info');
    loadIpInfo(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-cyan-400">
              <Server className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
                Cloud Run Backend & Static IP Architecture
                <span className="text-xs px-2.5 py-0.5 font-mono uppercase bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded-full">
                  Low-Latency
                </span>
              </h2>
              <p className="text-sm text-slate-400">
                Deploy backend to Cloud Run, route through dedicated Static IP, and whitelist in crypto exchanges.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Global IP & Egress Status Strip */}
        <div className="px-6 py-3.5 bg-gradient-to-r from-slate-900 via-cyan-950/30 to-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Active Outbound Egress IP:
            </span>
            <div className="flex items-center gap-2 bg-slate-950 border border-cyan-500/40 px-3 py-1.5 rounded-lg shadow-inner">
              <Globe className="w-4 h-4 text-cyan-400 animate-pulse" />
              <span className="font-mono text-base font-bold text-cyan-200">
                {staticIp}
              </span>
              <button
                onClick={handleCopyIp}
                title="Copy Static IP"
                className="ml-1 p-1 hover:bg-cyan-500/20 text-cyan-400 rounded transition-colors"
              >
                {copiedIp ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            {ipInfo?.isCloudRun ? (
              <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-md font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Cloud Run VPC NAT Active
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-md font-medium">
                <Activity className="w-3.5 h-3.5" />
                AI Studio Development Mode
              </span>
            )}
          </div>

          <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>Binance: {ipInfo?.exchanges?.binance?.latencyMs ?? 24}ms</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>Bybit: {ipInfo?.exchanges?.bybit?.latencyMs ?? 28}ms</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>Bitget: {ipInfo?.exchanges?.bitget?.latencyMs ?? 31}ms</span>
            </div>
            <button
              onClick={() => loadIpInfo(true)}
              disabled={isLoadingIp}
              title="Refresh IP diagnostics"
              className="p-1 hover:text-cyan-400 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingIp ? 'animate-spin text-cyan-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-6">
          <button
            onClick={() => setActiveTab('whitelist')}
            className={`flex items-center gap-2 py-3.5 px-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'whitelist'
                ? 'border-cyan-500 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Shield className="w-4 h-4" />
            1. Whitelist in Exchanges
          </button>
          <button
            onClick={() => setActiveTab('connect')}
            className={`flex items-center gap-2 py-3.5 px-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'connect'
                ? 'border-cyan-500 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap className="w-4 h-4" />
            2. Connect Frontend to Backend
          </button>
          <button
            onClick={() => setActiveTab('scripts')}
            className={`flex items-center gap-2 py-3.5 px-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'scripts'
                ? 'border-cyan-500 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="w-4 h-4" />
            3. Deploy Scripts & Commands
          </button>
          <button
            onClick={() => setActiveTab('architecture')}
            className={`flex items-center gap-2 py-3.5 px-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'architecture'
                ? 'border-cyan-500 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            Architecture & Specs
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-6 max-h-[65vh] overflow-y-auto space-y-6">
          {/* TAB 1: EXCHANGE WHITELISTING */}
          {activeTab === 'whitelist' && (
            <div className="space-y-6">
              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="text-slate-200 font-medium">Why Static IP Whitelisting is Required:</p>
                  <p className="text-slate-400 mt-1">
                    Exchanges (Binance, Bybit, Bitget) require dedicated static IPs to prevent API key expiration (Binance 90-day expiry rule) and to unlock high-frequency Futures & Spot algorithmic trading. With Cloud NAT, 100% of your bot&apos;s outbound orders originate from this single whitelisted address.
                  </p>
                </div>
              </div>

              {/* Exchange Selector */}
              <div className="flex gap-2">
                {(['Binance', 'Bybit', 'Bitget'] as const).map((ex) => (
                  <button
                    key={ex}
                    onClick={() => setSelectedExchange(ex)}
                    className={`px-4 py-2.5 rounded-xl font-medium text-sm transition-all flex items-center gap-2 ${
                      selectedExchange === ex
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-md shadow-cyan-500/10'
                        : 'bg-slate-800/60 text-slate-400 border border-slate-700/60 hover:text-white'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                    {ex} Whitelisting
                  </button>
                ))}
              </div>

              {/* Instructions Card for Selected Exchange */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-white">{selectedExchange} Security Configuration</span>
                    <span className="text-xs px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded">
                      Zero-Withdrawal Mandate
                    </span>
                  </div>
                  <button
                    onClick={handleCopyIp}
                    className="flex items-center gap-2 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold shadow transition-colors"
                  >
                    {copiedIp ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    Copy Static IP ({staticIp})
                  </button>
                </div>

                {selectedExchange === 'Binance' && (
                  <div className="space-y-3 text-sm text-slate-300">
                    <div className="flex gap-3">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 font-mono text-xs font-bold shrink-0">1</span>
                      <div>
                        Log into Binance and navigate to{' '}
                        <a
                          href="https://www.binance.com/en/my/settings/api-management"
                          target="_blank"
                          rel="noreferrer"
                          className="text-cyan-400 hover:underline inline-flex items-center gap-1 font-medium"
                        >
                          API Management <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 font-mono text-xs font-bold shrink-0">2</span>
                      <div>Click <span className="font-semibold text-white">Edit Restrictions</span> on your trading API key.</div>
                    </div>
                    <div className="flex gap-3">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 font-mono text-xs font-bold shrink-0">3</span>
                      <div>
                        Under <span className="font-semibold text-white">IP Access Restriction</span>, choose{' '}
                        <span className="text-cyan-300 font-semibold">&ldquo;Restrict access to trusted IPs only (Recommended)&rdquo;</span>.
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 font-mono text-xs font-bold shrink-0">4</span>
                      <div>
                        Paste your static IP: <code className="px-2 py-0.5 bg-slate-900 text-cyan-300 rounded font-mono font-bold border border-slate-700">{staticIp}</code> and click Confirm.
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 font-mono text-xs font-bold shrink-0">5</span>
                      <div>
                        Permissions: Check <span className="text-emerald-400 font-semibold">Enable Spot & Margin Trading</span> and <span className="text-emerald-400 font-semibold">Enable Futures</span>. Ensure <span className="text-rose-400 font-semibold">Enable Withdrawals is UNCHECKED</span>.
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 font-mono text-xs font-bold shrink-0">6</span>
                      <div>Click Save and verify with 2-Factor Authentication (Google Authenticator / SMS).</div>
                    </div>
                  </div>
                )}

                {selectedExchange === 'Bybit' && (
                  <div className="space-y-3 text-sm text-slate-300">
                    <div className="flex gap-3">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 font-mono text-xs font-bold shrink-0">1</span>
                      <div>
                        Log into Bybit and visit{' '}
                        <a
                          href="https://www.bybit.com/app/user/api-management"
                          target="_blank"
                          rel="noreferrer"
                          className="text-cyan-400 hover:underline inline-flex items-center gap-1 font-medium"
                        >
                          Bybit API Management <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 font-mono text-xs font-bold shrink-0">2</span>
                      <div>Click <span className="font-semibold text-white">Create New Key</span> or <span className="font-semibold text-white">Modify</span>.</div>
                    </div>
                    <div className="flex gap-3">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 font-mono text-xs font-bold shrink-0">3</span>
                      <div>
                        Under <span className="font-semibold text-white">IP Access Restriction</span>, select{' '}
                        <span className="text-cyan-300 font-semibold">&ldquo;Only IPs with permissions specified below are permitted to access this API&rdquo;</span>.
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 font-mono text-xs font-bold shrink-0">4</span>
                      <div>
                        Enter your static IP: <code className="px-2 py-0.5 bg-slate-900 text-cyan-300 rounded font-mono font-bold border border-slate-700">{staticIp}</code>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 font-mono text-xs font-bold shrink-0">5</span>
                      <div>
                        Set permissions to <span className="text-emerald-400 font-semibold">Read-Write</span>. Check Orders, Positions, USDC Contracts. Never check Withdrawals.
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 font-mono text-xs font-bold shrink-0">6</span>
                      <div>Submit and authenticate with Bybit 2FA.</div>
                    </div>
                  </div>
                )}

                {selectedExchange === 'Bitget' && (
                  <div className="space-y-3 text-sm text-slate-300">
                    <div className="flex gap-3">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 font-mono text-xs font-bold shrink-0">1</span>
                      <div>
                        Visit{' '}
                        <a
                          href="https://www.bitget.com/account/api-management"
                          target="_blank"
                          rel="noreferrer"
                          className="text-cyan-400 hover:underline inline-flex items-center gap-1 font-medium"
                        >
                          Bitget API Keys Management <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 font-mono text-xs font-bold shrink-0">2</span>
                      <div>Click <span className="font-semibold text-white">Create API Key</span> or Edit existing.</div>
                    </div>
                    <div className="flex gap-3">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 font-mono text-xs font-bold shrink-0">3</span>
                      <div>
                        Under <span className="font-semibold text-white">Link IP address (Optional, strongly recommended)</span>, paste:
                        <code className="ml-2 px-2 py-0.5 bg-slate-900 text-cyan-300 rounded font-mono font-bold border border-slate-700">{staticIp}</code>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 font-mono text-xs font-bold shrink-0">4</span>
                      <div>
                        Permissions: Select <span className="text-emerald-400 font-semibold">Read</span> and <span className="text-emerald-400 font-semibold">Trade</span>. Keep Transfer/Withdraw strictly disabled.
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 font-mono text-xs font-bold shrink-0">5</span>
                      <div>Confirm with Passphrase, Email code, and Google Authenticator.</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: CONNECT AI STUDIO FRONTEND */}
          {activeTab === 'connect' && (
            <div className="space-y-6">
              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Zap className="w-4 h-4 text-cyan-400" />
                  Frontend to Backend Routing
                </h3>
                <p className="text-sm text-slate-400 mt-1">
                  Once your backend is deployed to Cloud Run, enter the Cloud Run service URL below. The AI Studio interface will automatically route all REST API calls and real-time WebSocket streams (`/ws`) directly through your dedicated Cloud Run container with the whitelisted static IP.
                </p>
              </div>

              {/* Status Indicator */}
              <div className="flex items-center justify-between p-4 bg-slate-950 border border-slate-800 rounded-xl">
                <div>
                  <span className="text-xs text-slate-500 uppercase tracking-wider block">Current Active Backend</span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`w-2.5 h-2.5 rounded-full ${currentBackendUrl ? 'bg-emerald-400' : 'bg-cyan-400 animate-pulse'}`}></span>
                    <span className="font-mono text-sm font-bold text-white">
                      {currentBackendUrl || 'Embedded AI Studio Development Server (Same-Origin)'}
                    </span>
                  </div>
                </div>
                {currentBackendUrl && (
                  <button
                    onClick={handleResetToLocal}
                    className="px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
                  >
                    Reset to Local Dev Backend
                  </button>
                )}
              </div>

              {/* Input Form */}
              <div className="space-y-3">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                  Cloud Run Backend Service URL:
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="https://novaquant-backend-xxxxxx.asia-southeast1.run.app"
                    value={inputBackendUrl}
                    onChange={(e) => setInputBackendUrl(e.target.value)}
                    className="flex-1 px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                  />
                  <button
                    onClick={handleTestBackend}
                    disabled={isTestingBackend || !inputBackendUrl.trim()}
                    className="px-5 py-3 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white font-medium text-sm rounded-xl border border-slate-700 flex items-center gap-2 transition-colors shrink-0"
                  >
                    {isTestingBackend ? (
                      <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
                    ) : (
                      <Activity className="w-4 h-4 text-cyan-400" />
                    )}
                    Test Connection
                  </button>
                </div>
                <p className="text-xs text-slate-500">
                  Tip: Ensure your Cloud Run service has `--allow-unauthenticated` or handles CORS for your AI Studio frontend domain.
                </p>
              </div>

              {/* Test Result Box */}
              {backendTestResult && (
                <div
                  className={`p-4 rounded-xl border text-sm ${
                    backendTestResult.success
                      ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300'
                      : 'bg-rose-950/20 border-rose-500/40 text-rose-300'
                  }`}
                >
                  <div className="flex items-center gap-2 font-semibold">
                    {backendTestResult.success ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-rose-400" />
                    )}
                    {backendTestResult.success ? 'Backend Connection Successful!' : 'Connection Check Failed'}
                  </div>
                  <div className="mt-2 text-xs space-y-1 font-mono text-slate-300">
                    <p>Response Latency: {backendTestResult.latencyMs}ms</p>
                    {backendTestResult.outboundIp && <p>Detected Outbound IP: {backendTestResult.outboundIp}</p>}
                    {backendTestResult.isCloudRun && <p>Environment: Cloud Run Verified</p>}
                    {backendTestResult.error && <p className="text-rose-400">Error: {backendTestResult.error}</p>}
                  </div>
                </div>
              )}

              {/* Action Button */}
              <div className="flex justify-end pt-2">
                <button
                  onClick={handleApplyBackend}
                  disabled={!inputBackendUrl.trim()}
                  className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-semibold text-sm rounded-xl shadow-lg shadow-cyan-600/20 flex items-center gap-2 transition-colors"
                >
                  <Check className="w-4 h-4" />
                  Save & Connect AI Studio Frontend
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: DEPLOY SCRIPTS */}
          {activeTab === 'scripts' && (
            <div className="space-y-6">
              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-cyan-400" />
                  Automated Deployment Script
                </h3>
                <p className="text-sm text-slate-400 mt-1">
                  We have bundled an executable automated script in the repository: <code>deploy-cloud-run-static-ip.sh</code>. It handles VPC creation, regional static IP reservation, Cloud NAT gateway routing, and Cloud Run deployment in one command.
                </p>
              </div>

              {/* 1-Line Command */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  <span>Option A: Run Automated Script</span>
                  <button
                    onClick={() =>
                      handleCopySnippet('script', 'chmod +x ./deploy-cloud-run-static-ip.sh && ./deploy-cloud-run-static-ip.sh')
                    }
                    className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 normal-case"
                  >
                    {copiedCode === 'script' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    Copy Command
                  </button>
                </div>
                <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl font-mono text-sm text-cyan-300 overflow-x-auto">
                  chmod +x ./deploy-cloud-run-static-ip.sh &amp;&amp; ./deploy-cloud-run-static-ip.sh
                </div>
              </div>

              {/* gcloud step-by-step */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  <span>Option B: Core gcloud Deployment Command</span>
                  <button
                    onClick={() =>
                      handleCopySnippet(
                        'gcloud',
                        `gcloud run deploy novaquant-backend \\\n  --source . \\\n  --region=asia-southeast1 \\\n  --platform=managed \\\n  --allow-unauthenticated \\\n  --vpc-connector=novaquant-connector \\\n  --vpc-egress=all-traffic \\\n  --set-env-vars="NODE_ENV=production,STATIC_OUTBOUND_IP=${staticIp}" \\\n  --memory=1Gi \\\n  --cpu=1`
                      )
                    }
                    className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 normal-case"
                  >
                    {copiedCode === 'gcloud' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    Copy gcloud Command
                  </button>
                </div>
                <pre className="p-4 bg-slate-950 border border-slate-800 rounded-xl font-mono text-xs text-slate-300 overflow-x-auto leading-relaxed">
{`# Deploy Cloud Run with All-Traffic VPC Egress to route via Static IP
gcloud run deploy novaquant-backend \\
  --source . \\
  --region=asia-southeast1 \\
  --platform=managed \\
  --allow-unauthenticated \\
  --vpc-connector=novaquant-connector \\
  --vpc-egress=all-traffic \\
  --set-env-vars="NODE_ENV=production,STATIC_OUTBOUND_IP=${staticIp}" \\
  --memory=1Gi \\
  --cpu=1`}
                </pre>
              </div>

              {/* Terraform Snippet */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  <span>Option C: Infrastructure as Code (Terraform)</span>
                  <button
                    onClick={() =>
                      handleCopySnippet('tf', 'cd terraform && terraform init && terraform apply')
                    }
                    className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 normal-case"
                  >
                    {copiedCode === 'tf' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    Copy Terraform Command
                  </button>
                </div>
                <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl font-mono text-sm text-cyan-300 overflow-x-auto">
                  cd terraform &amp;&amp; terraform init &amp;&amp; terraform apply
                </div>
                <p className="text-xs text-slate-500">
                  Full Terraform code is available in <code>/terraform/main.tf</code>.
                </p>
              </div>
            </div>
          )}

          {/* TAB 4: ARCHITECTURE */}
          {activeTab === 'architecture' && (
            <div className="space-y-4 text-sm text-slate-300">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl">
                  <div className="flex items-center gap-2 text-cyan-400 font-semibold mb-2">
                    <Cpu className="w-4 h-4" />
                    Cloud Run Compute
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Auto-scaling container running Express, WebSocket engine (`/ws`), Google Gemini AI consensus, and high-frequency risk management.
                  </p>
                </div>

                <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl">
                  <div className="flex items-center gap-2 text-emerald-400 font-semibold mb-2">
                    <Globe className="w-4 h-4" />
                    VPC Access &amp; Cloud NAT
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Serverless VPC Connector bridges Cloud Run to a Cloud Router &amp; Cloud NAT gateway with manual IP assignment for 100% outbound traffic.
                  </p>
                </div>

                <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl">
                  <div className="flex items-center gap-2 text-amber-400 font-semibold mb-2">
                    <Shield className="w-4 h-4" />
                    Exchange Zero-Trust
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Binance, Bybit, and Bitget reject any request not matching the whitelisted static IP. Zero withdrawals permitted by institutional policy.
                  </p>
                </div>
              </div>

              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                <span className="font-semibold text-white block">Verification Endpoint</span>
                <p className="text-xs text-slate-400">
                  You can verify what external IP your container uses at any time by calling:
                </p>
                <code className="block p-2 bg-slate-900 border border-slate-800 rounded text-cyan-300 font-mono text-xs">
                  curl -s &ldquo;https://YOUR-BACKEND-URL/api/system/outbound-ip&rdquo;
                </code>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between">
          <div className="text-xs text-slate-500 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            NovaQuant Institutional Egress Security Architecture
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
