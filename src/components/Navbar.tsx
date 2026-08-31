import React, { useState } from 'react';
import { 
  Sun, 
  Database, 
  FileSpreadsheet, 
  Download, 
  Upload, 
  FileText, 
  Plus, 
  Layers, 
  CheckCircle2, 
  AlertCircle,
  Menu,
  X,
  Sparkles,
  Users,
  UserPlus,
  ChevronDown,
  ShieldCheck,
  UserCheck,
  Lock,
  LogOut
} from 'lucide-react';
import { SupabaseConfig, AppUser } from '../types';
import { downloadSampleTemplate } from '../lib/excel';

interface NavbarProps {
  supabaseConfig: SupabaseConfig;
  onOpenSupabaseModal: () => void;
  onOpenNewLeadModal: () => void;
  onOpenImportModal: () => void;
  onExportExcel: () => void;
  onOpenCreateUserModal?: () => void;
  totalLeadsCount: number;
  totalUsersCount?: number;
  activeView: 'leads' | 'dashboard' | 'followups' | 'users';
  setActiveView: (view: 'leads' | 'dashboard' | 'followups' | 'users') => void;
  currentUser?: AppUser | null;
  allUsers?: AppUser[];
  onSelectActiveUser?: (user: AppUser) => void;
  onLogout?: () => void;
  canAccessExcel?: boolean;
  canManageUsers?: boolean;
  canAddLead?: boolean;
  canManageDatabase?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  supabaseConfig,
  onOpenSupabaseModal,
  onOpenNewLeadModal,
  onOpenImportModal,
  onExportExcel,
  onOpenCreateUserModal,
  totalLeadsCount,
  totalUsersCount = 0,
  activeView,
  setActiveView,
  currentUser,
  allUsers = [],
  onSelectActiveUser,
  onLogout,
  canAccessExcel = true,
  canManageUsers = true,
  canAddLead = true,
  canManageDatabase = false,
}) => {
  const [showExcelMenu, setShowExcelMenu] = useState(false);
  const [showUserSwitcher, setShowUserSwitcher] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

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
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Branch Manager':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Sales Representative':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Survey Engineer':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Telecaller':
        return 'bg-cyan-100 text-cyan-800 border-cyan-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-sm shrink-0">
              <Sun className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg sm:text-xl tracking-tight text-slate-900 font-sans">
                  KONDAAS <span className="text-blue-600">SOLAR CRM</span>
                </span>
                <span className="hidden lg:inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                  PM Surya Ghar
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Tabs (Desktop) */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              id="nav-tab-dashboard"
              onClick={() => setActiveView('dashboard')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                activeView === 'dashboard'
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              Dashboard
            </button>
            <button
              id="nav-tab-leads"
              onClick={() => setActiveView('leads')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeView === 'leads'
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <span>Leads</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-blue-100 text-blue-700 font-bold">
                {totalLeadsCount}
              </span>
            </button>
            <button
              id="nav-tab-followups"
              onClick={() => setActiveView('followups')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                activeView === 'followups'
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              Follow-up Queue
            </button>

            {/* Team & Users Tab (Hidden for users without canManageUsers) */}
            {canManageUsers && (
              <button
                id="nav-tab-users"
                onClick={() => setActiveView('users')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  activeView === 'users'
                    ? 'bg-white text-slate-900 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Team & Users</span>
                {totalUsersCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 text-slate-700 font-bold">
                    {totalUsersCount}
                  </span>
                )}
              </button>
            )}
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Supabase Connection Status Pill (Admin / canManageDatabase only) */}
            {canManageDatabase && (
              <button
                id="btn-supabase-status"
                onClick={onOpenSupabaseModal}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                  supabaseConfig.isConnected
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
                title="Click to configure Supabase Connection"
              >
                <Database className="w-3.5 h-3.5 text-slate-500" />
                <span className="hidden xl:inline text-[11px]">
                  {supabaseConfig.isConnected ? 'Supabase Connected' : 'Local DB'}
                </span>
                <span
                  className={`w-2 h-2 rounded-full ${
                    supabaseConfig.isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'
                  }`}
                />
              </button>
            )}

            {/* Excel Actions Dropdown (Hidden for users without canAccessExcel) */}
            {canAccessExcel && (
              <div className="relative">
                <button
                  id="btn-excel-menu"
                  onClick={() => setShowExcelMenu(!showExcelMenu)}
                  className="bg-blue-50 text-blue-700 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-md text-xs sm:text-sm font-semibold border border-blue-100 hover:bg-blue-100 transition-colors flex items-center gap-1.5"
                >
                  <FileSpreadsheet className="w-4 h-4 text-blue-600" />
                  <span className="hidden sm:inline">Excel</span>
                </button>

                {showExcelMenu && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setShowExcelMenu(false)}
                    />
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                      <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        SheetJS Excel Tools
                      </div>
                      <button
                        id="btn-download-sample-template"
                        onClick={() => {
                          downloadSampleTemplate();
                          setShowExcelMenu(false);
                        }}
                        className="w-full px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-blue-50 flex items-center gap-2 transition-colors"
                      >
                        <FileText className="w-4 h-4 text-blue-600" />
                        <span>Download Sample Template</span>
                      </button>
                      <button
                        id="btn-import-excel"
                        onClick={() => {
                          onOpenImportModal();
                          setShowExcelMenu(false);
                        }}
                        className="w-full px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-blue-50 flex items-center gap-2 transition-colors"
                      >
                        <Upload className="w-4 h-4 text-blue-600" />
                        <span>Import Excel / CSV</span>
                      </button>
                      <button
                        id="btn-export-excel"
                        onClick={() => {
                          onExportExcel();
                          setShowExcelMenu(false);
                        }}
                        className="w-full px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-blue-50 flex items-center gap-2 transition-colors"
                      >
                        <Download className="w-4 h-4 text-green-600" />
                        <span>Export to Excel</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Primary Add Lead Button (Hidden if canAddLead is false) */}
            {canAddLead && (
              <button
                id="btn-add-new-lead"
                onClick={onOpenNewLeadModal}
                className="bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-md text-xs sm:text-sm font-semibold shadow-sm flex items-center gap-1.5 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>New Lead</span>
              </button>
            )}

            {/* Quick Add User Button (Only shown if canManageUsers is true) */}
            {canManageUsers && onOpenCreateUserModal && (
              <button
                id="btn-quick-add-user"
                onClick={onOpenCreateUserModal}
                className="hidden lg:flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-md text-xs font-semibold border border-slate-200 transition-colors"
                title="Create a new team member or user"
              >
                <UserPlus className="w-3.5 h-3.5 text-slate-600" />
                <span>+ User</span>
              </button>
            )}

            <div className="w-px h-6 bg-slate-200 mx-0.5 hidden sm:block" />

            {/* Active User Switcher / Profile Dropdown */}
            <div className="relative">
              <button
                id="btn-user-switcher"
                onClick={() => setShowUserSwitcher(!showUserSwitcher)}
                className="flex items-center gap-2 p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
                title="Account profile and settings"
              >
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-xs ${
                  currentUser?.role === 'Admin' ? 'bg-slate-900' : 'bg-blue-600'
                }`}>
                  {currentUser ? getInitials(currentUser.name) : 'VK'}
                </div>
                <div className="text-left hidden lg:block">
                  <div className="text-xs font-bold text-slate-900 leading-tight">
                    {currentUser?.name || 'Admin User'}
                  </div>
                  <div className="text-[10px] text-slate-500 leading-tight">
                    {currentUser?.role || 'Admin'}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {showUserSwitcher && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setShowUserSwitcher(false)}
                  />
                  <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                    
                    {/* Active User Details Header */}
                    <div className="px-3.5 py-2.5 border-b border-slate-100">
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
                    {canManageUsers && (
                      <div className="px-2 pt-1 border-t border-slate-100">
                        <button
                          onClick={() => {
                            setActiveView('users');
                            setShowUserSwitcher(false);
                          }}
                          className="w-full px-3 py-1.5 rounded-lg text-xs font-semibold text-blue-600 hover:bg-blue-50 flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <Users className="w-3.5 h-3.5" />
                          <span>Manage Users & Permissions</span>
                        </button>
                      </div>
                    )}

                    {/* Logout Button */}
                    {onLogout && (
                      <div className="px-2 pt-1 border-t border-slate-100 mt-1">
                        <button
                          id="btn-navbar-logout"
                          onClick={() => {
                            setShowUserSwitcher(false);
                            onLogout();
                          }}
                          className="w-full px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <LogOut className="w-3.5 h-3.5 text-rose-600" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Mobile Nav Toggle */}
            <button
              id="btn-mobile-nav"
              onClick={() => setMobileNavOpen(!mobileNavOpen)}
              className="p-2 text-slate-600 hover:text-slate-900 md:hidden"
              aria-label="Toggle Navigation"
            >
              {mobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileNavOpen && (
          <div className="md:hidden py-3 border-t border-slate-200 space-y-1">
            <button
              onClick={() => {
                setActiveView('dashboard');
                setMobileNavOpen(false);
              }}
              className={`w-full text-left px-3 py-2 rounded-md text-sm font-semibold ${
                activeView === 'dashboard' ? 'bg-blue-50 text-blue-700' : 'text-slate-700'
              }`}
            >
              Dashboard & Conversion
            </button>
            <button
              onClick={() => {
                setActiveView('leads');
                setMobileNavOpen(false);
              }}
              className={`w-full text-left px-3 py-2 rounded-md text-sm font-semibold flex items-center justify-between ${
                activeView === 'leads' ? 'bg-blue-50 text-blue-700' : 'text-slate-700'
              }`}
            >
              <span>Leads</span>
              <span className="px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700 font-bold">
                {totalLeadsCount}
              </span>
            </button>
            <button
              onClick={() => {
                setActiveView('followups');
                setMobileNavOpen(false);
              }}
              className={`w-full text-left px-3 py-2 rounded-md text-sm font-semibold ${
                activeView === 'followups' ? 'bg-blue-50 text-blue-700' : 'text-slate-700'
              }`}
            >
              Follow-up Action Queue
            </button>

            {/* Mobile Team & Users Tab (Hidden for users without canManageUsers) */}
            {canManageUsers && (
              <button
                onClick={() => {
                  setActiveView('users');
                  setMobileNavOpen(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-md text-sm font-semibold flex items-center justify-between ${
                  activeView === 'users' ? 'bg-blue-50 text-blue-700' : 'text-slate-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-slate-500" />
                  <span>Team & User Directory</span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-xs bg-slate-200 text-slate-700 font-bold">
                  {totalUsersCount}
                </span>
              </button>
            )}

            {/* Mobile Create User (Hidden for users without canManageUsers) */}
            {canManageUsers && onOpenCreateUserModal && (
              <button
                onClick={() => {
                  onOpenCreateUserModal();
                  setMobileNavOpen(false);
                }}
                className="w-full text-left px-3 py-2 rounded-md text-sm font-semibold text-blue-600 bg-blue-50 flex items-center gap-2"
              >
                <UserPlus className="w-4 h-4" />
                <span>+ Create New User</span>
              </button>
            )}

            {/* Mobile Sign Out */}
            {onLogout && (
              <button
                onClick={() => {
                  setMobileNavOpen(false);
                  onLogout();
                }}
                className="w-full text-left px-3 py-2 rounded-md text-sm font-semibold text-rose-600 bg-rose-50/70 flex items-center gap-2 mt-2"
              >
                <LogOut className="w-4 h-4 text-rose-600" />
                <span>Sign Out ({currentUser?.name})</span>
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
