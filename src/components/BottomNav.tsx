import React from 'react';
import {
  LayoutDashboard,
  Wallet,
  BrainCircuit,
  Zap,
  Menu
} from 'lucide-react';
import { NavTab } from './Sidebar';

interface BottomNavProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  activeTradesCount: number;
  onOpenMobileMenu: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  onSelectTab,
  activeTradesCount,
  onOpenMobileMenu,
}) => {
  const primaryTabs: { id: NavTab; label: string; icon: React.ElementType; badge?: string | null }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'assets', label: 'Assets', icon: Wallet },
    { id: 'ai-decisions', label: 'Dual AI', icon: BrainCircuit },
    {
      id: 'active-trades',
      label: 'Trades',
      icon: Zap,
      badge: activeTradesCount > 0 ? `${activeTradesCount}` : null,
    },
  ];

  return (
    <nav
      id="mobile-bottom-nav"
      aria-label="Mobile Navigation"
      className="fixed bottom-0 left-0 right-0 z-40 md:hidden border-t border-[#bf9b42]/30 bg-[#022824]/95 backdrop-blur-lg px-2 py-1.5 shadow-2xl safe-area-bottom"
    >
      <div className="flex items-center justify-around">
        {primaryTabs.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              id={`bottom-nav-${item.id}`}
              onClick={() => onSelectTab(item.id)}
              className={`relative flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all cursor-pointer min-w-[56px] min-h-[44px] ${
                isActive
                  ? 'text-[#f5e6b3]'
                  : 'text-[#e5c158]/70 hover:text-[#f5e6b3]'
              }`}
            >
              {isActive && (
                <span className="absolute -top-1.5 h-1 w-8 rounded-full bg-[#bf9b42] shadow-sm shadow-[#bf9b42]/50" />
              )}
              <div className="relative">
                <Icon
                  className={`h-5 w-5 transition-transform ${
                    isActive ? 'text-[#bf9b42] scale-110' : ''
                  }`}
                />
                {item.badge && (
                  <span className="absolute -top-1.5 -right-2.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[9px] font-bold text-slate-950 shadow-sm">
                    {item.badge}
                  </span>
                )}
              </div>
              <span
                className={`text-[10px] mt-1 font-medium tracking-tight ${
                  isActive ? 'font-bold text-[#f5e6b3]' : ''
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}

        {/* Menu Drawer Toggle Button */}
        <button
          id="bottom-nav-menu-toggle"
          onClick={onOpenMobileMenu}
          className="flex flex-col items-center justify-center py-1 px-3 rounded-xl text-[#e5c158]/70 hover:text-[#f5e6b3] transition-all cursor-pointer min-w-[56px] min-h-[44px]"
        >
          <Menu className="h-5 w-5" />
          <span className="text-[10px] mt-1 font-medium tracking-tight">More</span>
        </button>
      </div>
    </nav>
  );
};
