import React, { useState } from 'react';
import { 
  Search, 
  Menu, 
  Sun, 
  Database, 
  FileSpreadsheet, 
  Download, 
  Upload, 
  FileText, 
  Plus, 
  ChevronDown, 
  ShieldCheck, 
  LogOut, 
  Users,
  UserPlus,
  Layers,
  Clock
} from 'lucide-react';
import { SupabaseConfig, AppUser } from '../types';
import { downloadSampleTemplate } from '../lib/excel';

interface TopBarProps {
  onToggleMobileSidebar?: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  supabaseConfig: SupabaseConfig;
  onOpenSupabaseModal: () => void;
  onOpenNewLeadModal: () => void;
  onOpenImportModal: () => void;
  onExportExcel: () => void;
  currentUser?: AppUser | null;
  onLogout?: () => void;
  canAccessExcel?: boolean;
  canManageUsers?: boolean;
  canAddLead?: boolean;
  canManageDatabase?: boolean;
  onNavigateToUsers?: () => void;
  activeView?: 'dashboard' | 'leads' | 'followups' | 'users';
  setActiveView?: (view: 'dashboard' | 'leads' | 'followups' | 'users') => void;
  totalLeadsCount?: number;
  overdueCount?: number;
  totalUsersCount?: number;
}

export const TopBar: React.FC<TopBarProps> = ({
  onToggleMobileSidebar,
  searchQuery,
  onSearchChange,
  supabaseConfig,
  onOpenNewLeadModal,
  onOpenImportModal,
  onExportExcel,
  onOpenSupabaseModal,
  currentUser,
  onLogout,
  canAccessExcel = true,
  canManageUsers = true,
  canAddLead = true,
  canManageDatabase = false,
  onNavigateToUsers,
  activeView = 'leads',
  setActiveView,
  totalLeadsCount = 0,
  overdueCount = 0,
  totalUsersCount = 0,
}) => {
  const [showExcelMenu, setShowExcelMenu] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const getRoleBadgeColor = (role?: string) => {
    switch (role) {
      case 'Admin':
        return 'bg-[#FF0000]/10 text-[#FF0000] border-[#FF0000]/30';
      case 'Branch Manager':
        return 'bg-[#DFF1F1] text-[#0E2429] border-[#BBD5DA]';
      case 'Sales Representative':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Survey Engineer':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Telecaller':
        return 'bg-cyan-100 text-cyan-800 border-cyan-200';
      default:
        return 'bg-[#F5F5F5] text-slate-700 border-[#BBD5DA]';
    }
  };

  const navMenuItems = [
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
      label: 'Queue',
      icon: Clock,
      count: overdueCount,
      showCount: overdueCount > 0,
    },
    ...(canManageUsers
      ? [
          {
            id: 'users' as const,
            label: 'Team',
            icon: Users,
            count: totalUsersCount,
            showCount: totalUsersCount > 0,
          },
        ]
      : []),
  ];

  return (
    <header className="sticky top-0 z-30 bg-[linear-gradient(135deg,#0E2429_0%,#17343B_100%)] border-b border-[#BBD5DA]/25 shadow-md">
      {/* Top Primary Bar */}
      <div className="h-14 sm:h-16 flex items-center px-3 sm:px-5 justify-between gap-2">
        {/* Left Section: Branding & Main Navigation Icons (Frozen on Top) */}
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          {onToggleMobileSidebar && (
            <button
              id="btn-mobile-sidebar-toggle"
              onClick={onToggleMobileSidebar}
              className="lg:hidden p-2 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Toggle navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          {/* Brand Logo */}
          <div 
            onClick={() => setActiveView && setActiveView('dashboard')}
            className="flex items-center gap-2 cursor-pointer select-none"
          >
            <div className="w-8 h-8 rounded-lg bg-[#DFF1F1]/20 border border-[#BBD5DA]/40 flex items-center justify-center text-white shadow-xs shrink-0">
              <Sun className="w-4.5 h-4.5 text-[#FF0000]" />
            </div>
            <div className="hidden xs:flex flex-col">
              <span className="font-bold text-sm sm:text-base tracking-tight text-white font-sans whitespace-nowrap leading-none">
                KONDAAS <span className="text-[#DFF1F1]">SOLAR</span>
              </span>
              <span className="text-[9px] font-semibold text-[#BBD5DA]/80 uppercase tracking-widest hidden sm:inline">
                PM Surya Ghar CRM
              </span>
            </div>
          </div>

          {/* Frozen Top Navigation Menu Tabs (Desktop & Tablet) */}
          {setActiveView && (
            <div className="hidden md:flex items-center gap-1 bg-black/25 p-1 rounded-xl border border-white/10 ml-2">
              {navMenuItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeView === item.id;

                return (
                  <button
                    key={item.id}
                    id={`topbar-nav-${item.id}`}
                    onClick={() => setActiveView(item.id)}
                    className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
                      isActive
                        ? 'bg-[#DFF1F1] text-[#0A2228] font-bold shadow-xs'
                        : 'text-white/80 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <div className="relative flex items-center justify-center">
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#FF0000]' : 'text-[#BBD5DA]'}`} />
                      {item.showCount && (
                        <span className="absolute -top-2 -right-2.5 bg-[#FF0000] text-white text-[9px] font-bold px-1 rounded-full min-w-[15px] h-[15px] flex items-center justify-center leading-none border border-white/40">
                          {item.count}
                        </span>
                      )}
                    </div>
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Middle Section: Global Search Bar (Desktop) */}
        <div className="flex-1 max-w-xs xl:max-w-md mx-2 hidden lg:block">
          <div className="relative">
            <Search className="w-4 h-4 text-[#BBD5DA] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="topbar-search-input"
              type="text"
              placeholder="Search customer, phone, notes..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full bg-white/15 hover:bg-white/20 focus:bg-white text-white focus:text-[#0E2429] placeholder:text-[#BBD5DA]/80 focus:placeholder:text-slate-400 text-xs rounded-lg pl-9 pr-3 py-1.5 border border-[#BBD5DA]/35 focus:border-[#FF0000] focus:outline-none transition-all shadow-inner"
            />
          </div>
        </div>

        {/* Right Section: Actions & Profile */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          
          {/* Supabase Status Pill */}
          {canManageDatabase && (
            <button
              id="btn-supabase-status"
              onClick={onOpenSupabaseModal}
              className={`hidden 2xl:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors ${
                supabaseConfig.isConnected
                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/25'
                  : 'bg-white/10 text-white/80 border-[#BBD5DA]/30 hover:bg-white/15'
              }`}
              title="Click to configure Supabase Connection"
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  supabaseConfig.isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                }`}
              />
              <Database className="w-3 h-3 text-[#BBD5DA]" />
              <span>{supabaseConfig.isConnected ? 'Connected' : 'Local'}</span>
            </button>
          )}

          {/* Excel Tools Dropdown */}
          {canAccessExcel && (
            <div className="relative">
              <button
                id="btn-excel-menu"
                onClick={() => setShowExcelMenu(!showExcelMenu)}
                className="bg-[#DFF1F1] hover:bg-[#cbe8e8] text-[#0A2228] border border-[#BBD5DA] px-2.5 py-1.5 rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1 transition-colors"
                title="Excel Import & Export"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-[#0A2228]" />
                <span className="hidden sm:inline">Excel</span>
              </button>

              {showExcelMenu && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setShowExcelMenu(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-[#BBD5DA] py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      SheetJS Excel Tools
                    </div>
                    <button
                      id="btn-download-sample-template"
                      onClick={() => {
                        downloadSampleTemplate();
                        setShowExcelMenu(false);
                      }}
                      className="w-full px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-[#DFF1F1]/50 flex items-center gap-2 transition-colors"
                    >
                      <FileText className="w-4 h-4 text-[#0A2228]" />
                      <span>Download Sample Template</span>
                    </button>
                    <button
                      id="btn-import-excel"
                      onClick={() => {
                        onOpenImportModal();
                        setShowExcelMenu(false);
                      }}
                      className="w-full px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-[#DFF1F1]/50 flex items-center gap-2 transition-colors"
                    >
                      <Upload className="w-4 h-4 text-[#0A2228]" />
                      <span>Import Excel / CSV</span>
                    </button>
                    <button
                      id="btn-export-excel"
                      onClick={() => {
                        onExportExcel();
                        setShowExcelMenu(false);
                      }}
                      className="w-full px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-[#DFF1F1]/50 flex items-center gap-2 transition-colors"
                    >
                      <Download className="w-4 h-4 text-emerald-600" />
                      <span>Export to Excel</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* New Lead Action Button */}
          {canAddLead && (
            <button
              id="btn-add-new-lead"
              onClick={onOpenNewLeadModal}
              className="bg-[#FF0000] hover:bg-[#D60000] text-white px-2.5 sm:px-3.5 py-1.5 rounded-lg text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span className="hidden sm:inline">New Lead</span>
            </button>
          )}

          <div className="w-px h-5 bg-[#BBD5DA]/30 mx-0.5 hidden sm:block" />

          {/* User Profile Dropdown */}
          <div className="relative">
            <button
              id="btn-user-profile"
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className="flex items-center gap-1.5 sm:gap-2 p-1 rounded-lg hover:bg-white/10 transition-colors"
              title="Account profile and settings"
            >
              <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full ring-2 ring-[#BBD5DA]/60 flex items-center justify-center text-xs font-bold text-white shadow-xs ${
                currentUser?.role === 'Admin' ? 'bg-[#FF0000]' : 'bg-[#0E2429]'
              }`}>
                {currentUser ? getInitials(currentUser.name) : 'VK'}
              </div>
              
              <div className="text-left hidden lg:block">
                <div className="text-xs font-bold text-white leading-tight truncate max-w-[100px]">
                  {currentUser?.name || 'Administrator'}
                </div>
                <div className="text-[10px] text-[#BBD5DA] leading-tight">
                  {currentUser?.role || 'Admin'}
                </div>
              </div>

              <ChevronDown className="w-3.5 h-3.5 text-white/70" />
            </button>

            {showUserDropdown && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowUserDropdown(false)}
                />
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-[#BBD5DA] py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                  
                  {/* Active User Details Header */}
                  <div className="px-3.5 py-2.5 border-b border-[#BBD5DA]/30">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Active Session
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getRoleBadgeColor(currentUser?.role)}`}>
                        {currentUser?.role || 'Admin'}
                      </span>
                    </div>
                    <div className="font-bold text-sm text-slate-900">
                      {currentUser?.name || 'Administrator'}
                    </div>
                    <div className="text-xs text-slate-500 font-mono">
                      {currentUser?.email || 'vishnu.kondaas@gmail.com'}
                    </div>
                  </div>

                  {/* Quick Link to Users Directory if Admin */}
                  {canManageUsers && onNavigateToUsers && (
                    <div className="px-2 pt-1 border-t border-[#BBD5DA]/30">
                      <button
                        onClick={() => {
                          onNavigateToUsers();
                          setShowUserDropdown(false);
                        }}
                        className="w-full px-3 py-1.5 rounded-lg text-xs font-semibold text-[#0A2228] hover:bg-[#DFF1F1] flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Users className="w-3.5 h-3.5 text-[#FF0000]" />
                        <span>Manage Users & Permissions</span>
                      </button>
                    </div>
                  )}

                  {/* Logout Button */}
                  {onLogout && (
                    <div className="px-2 pt-1 border-t border-[#BBD5DA]/30 mt-1">
                      <button
                        id="btn-topbar-logout"
                        onClick={() => {
                          setShowUserDropdown(false);
                          onLogout();
                        }}
                        className="w-full px-3 py-1.5 rounded-lg text-xs font-semibold text-[#FF0000] hover:bg-[#FF0000]/10 flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <LogOut className="w-3.5 h-3.5 text-[#FF0000]" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Frozen Navigation Menu (Visible on Mobile & Tablet, Fixed at Top) */}
      {setActiveView && (
        <div className="md:hidden px-3 py-1.5 bg-black/30 border-t border-white/10 flex items-center justify-around gap-1">
          {navMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;

            return (
              <button
                key={item.id}
                id={`mobile-topbar-nav-${item.id}`}
                onClick={() => setActiveView(item.id)}
                className={`relative flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex-1 ${
                  isActive
                    ? 'bg-[#DFF1F1] text-[#0A2228] shadow-xs'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
              >
                <div className="relative flex items-center justify-center">
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#FF0000]' : 'text-[#BBD5DA]'}`} />
                  {item.showCount && (
                    <span className="absolute -top-2 -right-2 bg-[#FF0000] text-white text-[9px] font-bold px-1 rounded-full min-w-[14px] h-[14px] flex items-center justify-center leading-none border border-white/40">
                      {item.count}
                    </span>
                  )}
                </div>
                <span className="text-[11px]">{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
};
