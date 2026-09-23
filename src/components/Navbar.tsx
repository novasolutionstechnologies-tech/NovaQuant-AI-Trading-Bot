import React, { useState, useRef, useEffect } from 'react';
import {
  RefreshCw,
  Wallet,
  Play,
  Square,
  Pause,
  User,
  ChevronDown,
  Check,
  ShieldCheck,
  Lock,
  Layers,
  Sparkles,
  LogOut,
  LogIn,
  Menu,
  X,
  Server,
  Globe
} from 'lucide-react';
import { BotStatus, UserProfile } from '../types';
import { switchUser, fetchCurrentUser, getApiBaseUrl } from '../services/api';
import { CloudRunDeploymentModal } from './CloudRunDeploymentModal';

interface NavbarProps {
  tradingMode: 'DEMO' | 'LIVE';
  onToggleMode?: (mode: 'DEMO' | 'LIVE') => void;
  botStatus: BotStatus;
  onToggleStartStop: () => void;
  onTogglePauseResume: () => void;
  accountBalance: number;
  dailyPnL: number;
  dailyPnLPct: number;
  prices: Record<string, number>;
  onTriggerScan: () => void;
  isScanning: boolean;
  onAccountSwitched?: () => void;
  currentUser?: UserProfile | null;
  onOpenAuthModal?: () => void;
  onSignOut?: () => void;
  onToggleMobileMenu?: () => void;
  isMobileMenuOpen?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  tradingMode = 'LIVE',
  botStatus,
  onToggleStartStop,
  onTogglePauseResume,
  accountBalance,
  dailyPnL,
  dailyPnLPct,
  prices,
  onTriggerScan,
  isScanning,
  onAccountSwitched,
  currentUser,
  onOpenAuthModal,
  onSignOut,
  onToggleMobileMenu,
  isMobileMenuOpen,
}) => {
  const [activeUser, setActiveUser] = useState<UserProfile>({
    id: 'usr_novaquant',
    name: 'NovaQuant Manager',
    email: 'novaquant2026@gmail.com',
  });
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const [isCloudRunModalOpen, setIsCloudRunModalOpen] = useState(false);
  const [backendUrl, setBackendUrl] = useState<string>(getApiBaseUrl());
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Available user accounts
  const availableAccounts: UserProfile[] = [
    {
      id: 'usr_novaquant',
      name: 'NovaQuant Manager',
      email: 'novaquant2026@gmail.com',
    },
  ];

  // Fetch current user on mount or sync with prop
  useEffect(() => {
    if (currentUser) {
      setActiveUser(currentUser);
      return;
    }
    fetchCurrentUser()
      .then((res) => {
        if (res.user) {
          setActiveUser(res.user);
        }
      })
      .catch(() => {
        // Fallback to default user
      });
  }, [currentUser]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsUserDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectUser = async (user: UserProfile) => {
    if (user.id === activeUser.id) {
      setIsUserDropdownOpen(false);
      return;
    }
    try {
      setIsSwitching(true);
      const res = await switchUser(user.id);
      setActiveUser(res.user);
      setIsUserDropdownOpen(false);
      if (onAccountSwitched) {
        onAccountSwitched();
      }
    } catch (err) {
      console.error('Failed to switch user:', err);
    } finally {
      setIsSwitching(false);
    }
  };

  const tickerList = [
    { symbol: 'BTC/USDT', name: 'BTC', price: prices['BTC/USDT'] || 67420.5, change: '+2.4%' },
    { symbol: 'ETH/USDT', name: 'ETH', price: prices['ETH/USDT'] || 3540.2, change: '+1.8%' },
    { symbol: 'SOL/USDT', name: 'SOL', price: prices['SOL/USDT'] || 184.8, change: '+4.2%' },
    { symbol: 'BNB/USDT', name: 'BNB', price: prices['BNB/USDT'] || 598.6, change: '-0.3%' },
    { symbol: 'XRP/USDT', name: 'XRP', price: prices['XRP/USDT'] || 0.624, change: '+0.9%' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#bf9b42]/25 bg-[#022824]/95 backdrop-blur-md">
      <div className="flex h-16 items-center justify-between px-4 lg:px-6">
        {/* Left: Brand Identity with Gold/Emerald Medallion Logo & Mobile Hamburger */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Mobile Menu Toggle Button */}
          {onToggleMobileMenu && (
            <button
              id="btn-navbar-mobile-menu"
              onClick={onToggleMobileMenu}
              className="md:hidden p-2 rounded-xl text-[#bf9b42] hover:bg-[#033631] border border-[#bf9b42]/30 transition-colors cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          )}

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="relative flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center shrink-0">
              <img
                src="/novaquant-logo.jpg"
                alt="NovaQuant Algorithmic Trading"
                className="h-10 w-10 sm:h-11 sm:w-11 rounded-full object-cover border-2 border-[#bf9b42] shadow-lg shadow-[#bf9b42]/30"
              />
              <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
              </span>
            </div>
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="text-base sm:text-lg font-bold tracking-tight text-[#bf9b42]">NovaQuant</span>
                <span className="rounded bg-[#bf9b42]/20 px-1 sm:px-1.5 py-0.5 text-[9px] sm:text-[10px] font-bold text-[#bf9b42] border border-[#bf9b42]/40 uppercase">
                  AI TRADING
                </span>
              </div>
              <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-[#e5c158]/85">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                <span>The Quantum Edge &bull; 999 Fine Metal</span>
              </div>
            </div>
          </div>
        </div>

        {/* Center: Live Real-Time Ticker Strip */}
        <div className="hidden xl:flex items-center gap-2 overflow-x-auto py-1 px-3 rounded-xl bg-[#033631]/80 border border-[#bf9b42]/30">
          {tickerList.map((t) => (
            <div
              key={t.symbol}
              className="flex items-center gap-2 px-2.5 py-1 text-xs transition-colors hover:bg-[#044a43]/60 rounded-lg"
            >
              <span className="font-semibold text-[#f5e6b3]">{t.name}</span>
              <span className="font-mono text-white font-medium">${t.price.toLocaleString()}</span>
              <span
                className={`text-[11px] font-semibold ${
                  t.change.startsWith('+') ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {t.change}
              </span>
            </div>
          ))}
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Bot Execution Controls (Start/Stop & Pause/Resume) */}
          <div className="flex items-center gap-1 sm:gap-1.5 p-1 rounded-xl bg-[#033631]/90 border border-[#bf9b42]/30 shadow-inner">
            {/* Status indicator dot + text */}
            <div className="hidden lg:flex items-center gap-1.5 px-2 py-1">
              <span className="relative flex h-2 w-2">
                {botStatus === 'RUNNING' && (
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                )}
                {botStatus === 'PAUSED' && (
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75"></span>
                )}
                <span
                  className={`relative inline-flex h-2 w-2 rounded-full ${
                    botStatus === 'RUNNING'
                      ? 'bg-emerald-400'
                      : botStatus === 'PAUSED'
                      ? 'bg-amber-400'
                      : 'bg-rose-500'
                  }`}
                />
              </span>
              <span
                className={`text-xs font-bold ${
                  botStatus === 'RUNNING'
                    ? 'text-emerald-400'
                    : botStatus === 'PAUSED'
                    ? 'text-amber-300'
                    : 'text-rose-400'
                }`}
              >
                {botStatus}
              </span>
            </div>

            {/* Start / Stop Button */}
            <button
              onClick={onToggleStartStop}
              className={`flex items-center gap-1 sm:gap-1.5 rounded-lg px-2 sm:px-2.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                botStatus === 'STOPPED'
                  ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/40 hover:bg-emerald-400'
                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30'
              }`}
            >
              {botStatus === 'STOPPED' ? (
                <>
                  <Play className="h-3.5 w-3.5 fill-current" />
                  <span className="hidden xs:inline sm:inline">Start</span>
                  <span className="hidden sm:inline">Bot</span>
                </>
              ) : (
                <>
                  <Square className="h-3.5 w-3.5 fill-current" />
                  <span className="hidden xs:inline sm:inline">Stop</span>
                  <span className="hidden sm:inline">Bot</span>
                </>
              )}
            </button>

            {/* Pause / Resume Button */}
            <button
              onClick={onTogglePauseResume}
              disabled={botStatus === 'STOPPED'}
              className={`hidden xs:flex items-center gap-1 sm:gap-1.5 rounded-lg px-2 sm:px-2.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                botStatus === 'STOPPED'
                  ? 'opacity-40 cursor-not-allowed bg-slate-800/40 text-slate-500 border border-slate-700/40'
                  : botStatus === 'PAUSED'
                  ? 'bg-amber-500 text-slate-950 shadow-sm shadow-amber-500/40 hover:bg-amber-400'
                  : 'bg-[#bf9b42]/20 text-[#f5e6b3] border border-[#bf9b42]/40 hover:bg-[#bf9b42]/30'
              }`}
            >
              {botStatus === 'PAUSED' ? (
                <>
                  <Play className="h-3.5 w-3.5 fill-current" />
                  <span>Resume</span>
                </>
              ) : (
                <>
                  <Pause className="h-3.5 w-3.5 fill-current" />
                  <span>Pause</span>
                </>
              )}
            </button>
          </div>

          {/* Quick AI Scan Trigger */}
          <button
            onClick={onTriggerScan}
            disabled={isScanning || botStatus === 'STOPPED'}
            className="hidden md:flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#bf9b42] to-[#a08032] px-3 py-1.5 text-xs font-bold text-[#033631] shadow-sm shadow-[#bf9b42]/30 transition-all hover:brightness-110 active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isScanning ? 'animate-spin' : ''}`} />
            <span className="hidden xl:inline">{isScanning ? 'Analyzing...' : 'Dual-AI Scan'}</span>
          </button>

          {/* Account Balance Widget */}
          <div className="hidden sm:flex items-center gap-2.5 rounded-lg border border-[#bf9b42]/30 bg-[#033631]/80 px-3 py-1.5">
            <Wallet className="h-4 w-4 text-[#bf9b42]" />
            <div className="text-right">
              <div className="text-xs font-mono font-bold text-[#f5e6b3]">
                ${accountBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="flex items-center justify-end gap-1 text-[10px]">
                <span className="text-[#bf9b42]/80">Daily:</span>
                <span
                  className={`font-semibold ${
                    dailyPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {dailyPnL >= 0 ? '+' : ''}${dailyPnL.toFixed(2)} ({dailyPnLPct >= 0 ? '+' : ''}{dailyPnLPct}%)
                </span>
              </div>
            </div>
          </div>

          {/* REAL PRODUCTION BADGE (Demo Mode Removed) */}
          <div
            title="Production Environment: Real exchange order routing with zero simulated orders"
            className="hidden lg:flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/40 shadow-sm"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400"></span>
            </span>
            <span className="tracking-wide">PRODUCTION LIVE</span>
          </div>

          {/* CLOUD RUN & STATIC IP STATUS BADGE */}
          <button
            onClick={() => {
              setBackendUrl(getApiBaseUrl());
              setIsCloudRunModalOpen(true);
            }}
            title="Cloud Run Backend & Static Outbound IP Whitelist Status. Click to configure or view exchange guides."
            className="hidden xl:flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-500/40 shadow-sm transition-all cursor-pointer"
          >
            <Server className="h-3.5 w-3.5 text-cyan-400" />
            <span className="font-mono text-[11px]">
              {backendUrl ? 'Cloud Run Connected' : 'Static IP: 34.126.154.21'}
            </span>
          </button>

          {/* USER PROFILE & MULTI-USER SWITCH DROPDOWN */}
          <div className="relative" ref={dropdownRef}>
            {currentUser ? (
              <button
                id="btn-user-profile-menu"
                onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                className="flex items-center gap-2 rounded-lg border border-[#bf9b42]/40 bg-[#022824] px-3 py-1.5 text-xs font-semibold text-[#f5e6b3] hover:bg-[#033631] transition-all cursor-pointer shadow-sm"
              >
                {activeUser.photoUrl ? (
                  <img
                    src={activeUser.photoUrl}
                    alt={activeUser.name}
                    className="h-5 w-5 rounded-full object-cover border border-[#bf9b42]"
                  />
                ) : (
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#bf9b42] text-[#022824] font-bold text-[10px]">
                    {activeUser.name.charAt(0)}
                  </div>
                )}
                <div className="hidden md:flex flex-col text-left leading-tight">
                  <div className="flex items-center gap-1">
                    <span className="text-[11px] font-bold text-white max-w-[110px] truncate">
                      {activeUser.name.split(' ')[0]}
                    </span>
                    {activeUser.provider === 'google' && (
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-blue-400" title="Google Authenticated" />
                    )}
                  </div>
                  <span className="text-[9px] text-[#bf9b42] font-mono">
                    Cloud SQL
                  </span>
                </div>
                <ChevronDown className={`h-3.5 w-3.5 text-[#bf9b42] transition-transform ${isUserDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
            ) : (
              <button
                id="btn-nav-login"
                onClick={onOpenAuthModal}
                className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-md shadow-indigo-500/20 transition-all cursor-pointer active:scale-95"
              >
                <LogIn className="h-3.5 w-3.5" />
                <span>Sign In / Register</span>
              </button>
            )}

            {isUserDropdownOpen && (
              <div className="absolute right-0 mt-2 w-72 rounded-xl border border-[#bf9b42]/40 bg-[#022824] p-2 shadow-2xl z-50 backdrop-blur-xl">
                {/* User Info Header */}
                <div className="px-2.5 py-2 border-b border-[#044a43] mb-1.5 flex items-center gap-2.5">
                  {activeUser.photoUrl ? (
                    <img
                      src={activeUser.photoUrl}
                      alt={activeUser.name}
                      className="h-8 w-8 rounded-full object-cover border border-[#bf9b42]"
                    />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#bf9b42] text-[#022824] font-bold text-xs">
                      {activeUser.name.charAt(0)}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-white truncate flex items-center gap-1.5">
                      <span>{activeUser.name}</span>
                      {activeUser.provider === 'google' && (
                        <span className="text-[9px] font-semibold text-blue-400 bg-blue-500/10 px-1 py-0.2 rounded border border-blue-500/30">
                          Google
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono truncate">
                      {activeUser.email}
                    </div>
                  </div>
                </div>

                <div className="px-2 py-1 mb-1">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#bf9b42]">
                    Switch Tenant (Cloud SQL)
                  </div>
                </div>

                <div className="space-y-1">
                  {availableAccounts.map((acc) => {
                    const isCurrent = acc.id === activeUser.id;
                    return (
                      <button
                        key={acc.id}
                        disabled={isSwitching}
                        onClick={() => handleSelectUser(acc)}
                        className={`w-full flex items-center justify-between gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-xs transition-colors cursor-pointer ${
                          isCurrent
                            ? 'bg-[#bf9b42]/20 border border-[#bf9b42]/40 text-[#f5e6b3]'
                            : 'hover:bg-[#033631] text-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className={`flex h-5 w-5 items-center justify-center rounded-full font-bold text-[10px] shrink-0 ${
                            isCurrent ? 'bg-[#bf9b42] text-[#022824]' : 'bg-[#033631] text-[#bf9b42] border border-[#bf9b42]/30'
                          }`}>
                            {acc.name.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-xs truncate text-white">{acc.name}</div>
                            <div className="text-[9px] text-slate-400 font-mono truncate">{acc.email}</div>
                          </div>
                        </div>
                        {isCurrent && <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />}
                      </button>
                    );
                  })}
                </div>

                {/* Additional Auth Options */}
                <div className="mt-2 pt-2 border-t border-[#044a43] space-y-1">
                  {onOpenAuthModal && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsUserDropdownOpen(false);
                        onOpenAuthModal();
                      }}
                      className="w-full flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-indigo-300 hover:bg-indigo-900/30 transition-colors cursor-pointer"
                    >
                      <LogIn className="h-3.5 w-3.5" />
                      <span>Google / Email Login &amp; Register</span>
                    </button>
                  )}

                  {onSignOut && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsUserDropdownOpen(false);
                        onSignOut();
                      }}
                      className="w-full flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-rose-300 hover:bg-rose-900/30 transition-colors cursor-pointer"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      <span>Sign Out</span>
                    </button>
                  )}
                </div>

                <div className="mt-2 pt-1.5 border-t border-[#044a43] px-2 text-[9px] text-slate-400 flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3 text-emerald-400" />
                  <span>Exchange keys encrypted with AES-256-GCM</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <CloudRunDeploymentModal
        isOpen={isCloudRunModalOpen}
        onClose={() => {
          setIsCloudRunModalOpen(false);
          setBackendUrl(getApiBaseUrl());
        }}
      />
    </header>
  );
};
