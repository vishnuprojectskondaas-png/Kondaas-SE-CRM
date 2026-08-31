import React from 'react';
import { 
  Sun, 
  Layers, 
  FileText, 
  Clock, 
  Users, 
  X,
  Sparkles,
  PhoneCall,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Briefcase
} from 'lucide-react';
import { AppUser } from '../types';

interface SidebarProps {
  activeView: 'dashboard' | 'leads' | 'followups' | 'reports' | 'users';
  setActiveView: (view: 'dashboard' | 'leads' | 'followups' | 'reports' | 'users') => void;
  totalLeadsCount: number;
  totalUsersCount: number;
  overdueCount?: number;
  activityReportsCount?: number;
  canManageUsers?: boolean;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  setActiveView,
  totalLeadsCount,
  totalUsersCount,
  overdueCount = 0,
  activityReportsCount = 0,
  canManageUsers = true,
  isOpenMobile = false,
  onCloseMobile,
}) => {
  const navItems = [
    {
      id: 'dashboard' as const,
      label: 'Dashboard',
      icon: Layers,
      count: 0,
      showCount: false,
    },
    {
      id: 'leads' as const,
      label: 'Leads',
      icon: FileText,
      count: totalLeadsCount,
      showCount: totalLeadsCount > 0,
    },
    {
      id: 'followups' as const,
      label: 'Follow-up Queue',
      icon: Clock,
      count: overdueCount,
      showCount: overdueCount > 0,
    },
    {
      id: 'reports' as const,
      label: 'Daily Activity Reports',
      icon: Briefcase,
      count: activityReportsCount,
      showCount: activityReportsCount > 0,
    },
    ...(canManageUsers
      ? [
          {
            id: 'users' as const,
            label: 'Team & Users',
            icon: Users,
            count: totalUsersCount,
            showCount: totalUsersCount > 0,
          },
        ]
      : []),
  ];


  const sidebarContent = (
    <div className="flex flex-col h-full select-none">
      {/* Brand Header */}
      <div className="p-5 pb-4 border-b border-[#BBD5DA]/20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#DFF1F1]/20 border border-[#BBD5DA]/40 flex items-center justify-center text-white shadow-xs shrink-0">
            <Sun className="w-5 h-5 text-[#FF0000]" />
          </div>
          <div>
            <div className="font-bold text-base tracking-tight text-white font-sans leading-tight">
              KONDAAS <span className="text-[#DFF1F1]">SOLAR</span>
            </div>
            <div className="text-[10px] font-semibold text-[#BBD5DA] uppercase tracking-wider">
              PM Surya Ghar CRM
            </div>
          </div>
        </div>

        {/* Mobile Close Button */}
        {onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="md:hidden p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-5 space-y-1.5 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-bold text-[#BBD5DA]/70 uppercase tracking-widest">
          Main Navigation
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;

          return (
            <button
              key={item.id}
              id={`sidebar-nav-${item.id}`}
              onClick={() => {
                setActiveView(item.id);
                if (onCloseMobile) onCloseMobile();
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs transition-all duration-150 group text-left ${
                isActive
                  ? 'bg-[#DFF1F1] text-[#0A2228] font-bold shadow-sm border border-[#BBD5DA]'
                  : 'text-white/85 hover:text-white hover:bg-white/10 font-medium'
              }`}
            >
              <div className="flex items-center gap-3">
                {/* Icon wrapper with relative positioning for red count badge */}
                <div className="relative flex items-center justify-center">
                  <Icon
                    className={`w-5 h-5 shrink-0 transition-colors stroke-[1.75] ${
                      isActive ? 'text-[#FF0000]' : 'text-[#BBD5DA] group-hover:text-white'
                    }`}
                  />
                  
                  {/* Red circular badge (#FF0000) on top-right of nav icon */}
                  {item.showCount && (
                    <span 
                      className="absolute -top-1.5 -right-2.5 bg-[#FF0000] text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full min-w-[18px] h-[17px] flex items-center justify-center leading-none shadow-xs border border-white/20"
                    >
                      {item.count}
                    </span>
                  )}
                </div>

                <span className="truncate">{item.label}</span>
              </div>
            </button>
          );
        })}
      </nav>

      {/* Sidebar Footer Widget */}
      <div className="p-4 m-3 rounded-xl bg-white/5 border border-[#BBD5DA]/20 text-white/90">
        <div className="flex items-center gap-2 mb-1.5 text-xs font-bold text-white">
          <Sparkles className="w-3.5 h-3.5 text-[#FF0000]" />
          <span>Kerala Rooftop Solar</span>
        </div>
        <p className="text-[11px] text-[#BBD5DA] leading-relaxed">
          KSEB grid-connected pipeline under PM Surya Ghar Muft Bijli scheme.
        </p>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Left Sidebar (240px wide) */}
      <aside 
        id="desktop-left-sidebar"
        className="hidden md:flex flex-col w-[240px] shrink-0 min-h-screen bg-[linear-gradient(135deg,#0E2429_0%,#17343B_100%)] border-r border-[#BBD5DA]/25 z-30 sticky top-0 h-screen"
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity" 
            onClick={onCloseMobile}
          />
          
          {/* Off-canvas sidebar */}
          <aside className="relative flex flex-col w-[260px] max-w-[85vw] h-full bg-[linear-gradient(135deg,#0E2429_0%,#17343B_100%)] shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
};
