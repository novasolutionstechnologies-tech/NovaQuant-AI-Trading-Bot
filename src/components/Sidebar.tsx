import React, { useEffect } from 'react';
import {
  LayoutDashboard,
  Wallet,
  LineChart,
  BrainCircuit,
  ShieldAlert,
  Zap,
  History,
  BarChart3,
  Settings,
  ChevronRight,
  Sparkles,
  Key,
  User,
  X,
  FileText
} from 'lucide-react';

export type NavTab =
  | 'dashboard'
  | 'assets'
  | 'api-connect'
  | 'market-analysis'
  | 'ai-decisions'
  | 'risk-management'
  | 'active-trades'
  | 'trade-history'
  | 'audit-logs'
  | 'analytics'
  | 'settings'
  | 'auth';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  activeTradesCount: number;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  activeTradesCount,
  isOpenMobile = false,
  onCloseMobile,
}) => {
  // Prevent body scroll when mobile drawer is open
  useEffect(() => {
    if (isOpenMobile) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpenMobile]);

  const handleTabClick = (tab: NavTab) => {
    onSelectTab(tab);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  const navItems = [
    {
      id: 'dashboard' as NavTab,
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'assets' as NavTab,
      label: 'Assets & Capital',
      icon: Wallet,
      badge: 'Live Balance',
      badgeColor: 'bg-emerald-950/60 text-emerald-300 border-emerald-500/30',
    },
    {
      id: 'api-connect' as NavTab,
      label: 'API Connect',
      icon: Key,
      badge: 'Gateways',
      badgeColor: 'bg-[#bf9b42]/20 text-[#bf9b42] border-[#bf9b42]/40',
    },

    {
      id: 'market-analysis' as NavTab,
      label: 'Market Analysis',
      icon: LineChart,
      badge: null,
    },
    {
      id: 'ai-decisions' as NavTab,
      label: 'AI Decisions',
      icon: BrainCircuit,
      badge: 'Dual AI',
      badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
    },
    {
      id: 'risk-management' as NavTab,
      label: 'Risk Management',
      icon: ShieldAlert,
      badge: 'Protected',
      badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    },
    {
      id: 'active-trades' as NavTab,
      label: 'Active Trades',
      icon: Zap,
      badge: activeTradesCount > 0 ? `${activeTradesCount}` : null,
      badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    },
    {
      id: 'trade-history' as NavTab,
      label: 'Trade History',
      icon: History,
      badge: null,
    },
    {
      id: 'audit-logs' as NavTab,
      label: 'Transaction & Regulatory Audit',
      icon: FileText,
      badge: 'Live Log',
      badgeColor: 'bg-emerald-950/60 text-emerald-300 border-emerald-500/30',
    },
    {
      id: 'analytics' as NavTab,
      label: 'Analytics & Learning',
      icon: BarChart3,
      badge: null,
    },
    {
      id: 'settings' as NavTab,
      label: 'Settings',
      icon: Settings,
      badge: null,
    },
    {
      id: 'auth' as NavTab,
      label: 'Login / Register',
      icon: User,
      badge: 'Google Auth',
      badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
    },
  ];

  const sidebarContent = (
    <>
      <div className="space-y-5">
        {/* NovaQuant Brand Header with Coin Logo */}
        <div className="flex items-center justify-between px-2 py-2 rounded-xl bg-[#033631]/80 border border-[#bf9b42]/30 shadow-sm">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src="/novaquant-logo.jpg"
              alt="NovaQuant Algorithmic Trading"
              className="h-10 w-10 rounded-full object-cover border-2 border-[#bf9b42] shadow-md shadow-[#bf9b42]/20 shrink-0"
            />
            <div className="min-w-0">
              <div className="text-xs font-bold tracking-wider text-[#bf9b42] uppercase truncate">
                NovaQuant
              </div>
              <div className="text-[10px] text-[#e5c158]/90 font-semibold truncate">
                AI Trading Bot
              </div>
              <div className="text-[9px] text-emerald-400 font-mono flex items-center gap-1 mt-0.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Algorithmic v2.4</span>
              </div>
            </div>
          </div>

          {/* Close button inside mobile drawer */}
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="md:hidden p-1.5 rounded-lg text-[#bf9b42] hover:bg-[#033631] transition-colors"
              aria-label="Close navigation menu"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Navigation Group */}
        <div>
          <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-[#bf9b42]/70">
            Platform Menu
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-item-${item.id}`}
                  onClick={() => handleTabClick(item.id)}
                  className={`group flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#bf9b42]/20 text-[#f5e6b3] border border-[#bf9b42]/50 shadow-sm shadow-[#bf9b42]/10'
                      : 'text-[#e5c158]/80 hover:bg-[#033631] hover:text-[#fbf2d5] border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`h-4 w-4 transition-colors ${
                        isActive ? 'text-[#bf9b42]' : 'text-[#bf9b42]/60 group-hover:text-[#bf9b42]'
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {item.badge && (
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${
                          item.badgeColor || 'bg-[#033631] text-[#bf9b42] border-[#bf9b42]/30'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                    {isActive && <ChevronRight className="h-3.5 w-3.5 text-[#bf9b42]" />}
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        {/* AI Engine Status Card */}
        <div className="rounded-xl border border-[#bf9b42]/30 bg-gradient-to-b from-[#033631] to-[#022824] p-3.5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#bf9b42]">
              <Sparkles className="h-3.5 w-3.5 text-[#bf9b42]" />
              <span>AI Consensus</span>
            </div>
            <span className="flex h-2 w-2 rounded-full bg-emerald-400"></span>
          </div>
          <p className="text-[11px] text-slate-200/90 leading-relaxed">
            Multi-agent consensus verifies technical indicators against OpenAI and Google Gemini models before any order execution.
          </p>
          <div className="mt-3 flex items-center justify-between text-[10px] text-[#bf9b42]/80 border-t border-[#bf9b42]/20 pt-2 font-mono">
            <span>Gemini: Active</span>
            <span>Risk Filter: 100%</span>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="border-t border-[#bf9b42]/20 pt-3 text-[11px] text-[#bf9b42]/70 flex items-center justify-between">
        <span>NovaQuant Engine</span>
        <span className="font-mono text-emerald-400">v2.4.0</span>
      </div>
    </>
  );

  return (
    <>
      {/* 1. Desktop Persistent Sidebar */}
      <aside className="w-64 shrink-0 border-r border-[#bf9b42]/20 bg-[#022824]/90 backdrop-blur-md hidden md:flex flex-col justify-between p-4 text-[#bf9b42]">
        {sidebarContent}
      </aside>

      {/* 2. Mobile Slide-Over Drawer & Overlay */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop Blur Overlay */}
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
            onClick={onCloseMobile}
            aria-hidden="true"
          />

          {/* Drawer Menu Panel */}
          <aside
            id="mobile-navigation-drawer"
            className="fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-[#022824] border-r border-[#bf9b42]/30 shadow-2xl flex flex-col justify-between p-4 text-[#bf9b42] overflow-y-auto animate-in slide-in-from-left duration-300"
          >
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
};

