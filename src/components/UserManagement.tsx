import React, { useState, useMemo } from 'react';
import { 
  Users, 
  UserPlus, 
  Search, 
  Filter, 
  ShieldCheck, 
  MapPin, 
  Phone, 
  Mail, 
  Edit2, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  MessageSquare,
  Sparkles,
  ArrowRight,
  TrendingUp,
  FileText
} from 'lucide-react';
import { AppUser, Lead, UserRole } from '../types';
import { USER_ROLES } from '../lib/mockData';

interface UserManagementProps {
  users: AppUser[];
  leads: Lead[];
  onOpenCreateUserModal: () => void;
  onEditUser: (user: AppUser) => void;
  onDeleteUser: (userId: string) => void;
  onToggleUserStatus: (user: AppUser) => void;
  onFilterLeadsByRep: (repName: string) => void;
}

export const UserManagement: React.FC<UserManagementProps> = ({
  users,
  leads,
  onOpenCreateUserModal,
  onEditUser,
  onDeleteUser,
  onToggleUserStatus,
  onFilterLeadsByRep,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'Active' | 'Inactive'>('ALL');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Compute lead stats per user
  const userStats = useMemo(() => {
    const map: Record<string, { total: number; surveys: number; won: number }> = {};
    users.forEach((u) => {
      map[u.name] = { total: 0, surveys: 0, won: 0 };
    });

    leads.forEach((l) => {
      const rep = l.responsible;
      if (!map[rep]) {
        map[rep] = { total: 0, surveys: 0, won: 0 };
      }
      map[rep].total += 1;
      if (l.lead_status === 'Site Survey Completed' || l.lead_status === 'Scheduled Site Survey') {
        map[rep].surveys += 1;
      }
      if (l.lead_status === 'Order Confirmed') {
        map[rep].won += 1;
      }
    });

    return map;
  }, [users, leads]);

  // Filtered users
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = user.name.toLowerCase().includes(q);
        const matchesEmail = user.email.toLowerCase().includes(q);
        const matchesPhone = user.mobile_number.toLowerCase().includes(q);
        const matchesDistrict = user.district.toLowerCase().includes(q);
        const matchesRole = user.role.toLowerCase().includes(q);
        if (!matchesName && !matchesEmail && !matchesPhone && !matchesDistrict && !matchesRole) {
          return false;
        }
      }

      if (roleFilter !== 'ALL' && user.role !== roleFilter) {
        return false;
      }

      if (statusFilter !== 'ALL' && user.status !== statusFilter) {
        return false;
      }

      return true;
    });
  }, [users, searchQuery, roleFilter, statusFilter]);

  const activeCount = users.filter((u) => u.status === 'Active').length;
  const salesRepCount = users.filter((u) => u.role === 'Sales Representative').length;
  const surveyEngCount = users.filter((u) => u.role === 'Survey Engineer').length;

  return (
    <div className="space-y-6">
      
      {/* Top Banner / Summary */}
      <div className="bg-[linear-gradient(135deg,#0E2429_0%,#17343B_100%)] text-white rounded-xl p-5 sm:p-6 border border-[#BBD5DA]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-8 h-8 rounded-lg bg-[#FF0000] text-white flex items-center justify-center font-bold">
              <Users className="w-4 h-4" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">Team & User Directory</h1>
          </div>
          <p className="text-xs text-[#BBD5DA]">
            Manage sales executives, survey engineers, telecallers, and assign territory leads across Kerala.
          </p>
          
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            <span className="px-2.5 py-1 rounded-md bg-white/10 text-white border border-[#BBD5DA]/30 font-medium">
              Total Users: <strong className="text-white ml-1">{users.length}</strong>
            </span>
            <span className="px-2.5 py-1 rounded-md bg-green-950/60 text-green-300 border border-green-800/60 font-medium">
              Active: <strong className="text-green-200 ml-1">{activeCount}</strong>
            </span>
            <span className="px-2.5 py-1 rounded-md bg-[#DFF1F1]/20 text-[#DFF1F1] border border-[#BBD5DA]/30 font-medium">
              Sales Reps: <strong className="text-white ml-1">{salesRepCount}</strong>
            </span>
            <span className="px-2.5 py-1 rounded-md bg-[#DFF1F1]/20 text-[#DFF1F1] border border-[#BBD5DA]/30 font-medium">
              Survey Engineers: <strong className="text-white ml-1">{surveyEngCount}</strong>
            </span>
          </div>
        </div>

        {/* Primary Action Button */}
        <button
          id="btn-create-user"
          onClick={onOpenCreateUserModal}
          className="self-start sm:self-auto px-4 py-2.5 rounded-lg text-xs font-bold bg-[#FF0000] hover:bg-[#D60000] text-white shadow-xs transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 active:scale-95"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add New User</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-[#BBD5DA] shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* Search Box */}
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              id="input-search-users"
              type="text"
              placeholder="Search by name, email, phone number, territory, role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg text-xs border border-[#BBD5DA] bg-[#F5F5F5]/60 focus:bg-white focus:border-[#FF0000] focus:ring-1 focus:ring-[#FF0000]/20 outline-hidden"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 text-xs"
              >
                Clear
              </button>
            )}
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-xs font-bold text-slate-500 mr-1">Status:</span>
            {(['ALL', 'Active', 'Inactive'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  statusFilter === st
                    ? 'bg-[#0E2429] text-white shadow-2xs'
                    : 'bg-[#F5F5F5] text-slate-600 hover:bg-[#DFF1F1] border border-[#BBD5DA]'
                }`}
              >
                {st === 'ALL' ? 'All Status' : st}
              </button>
            ))}
          </div>
        </div>

        {/* Role Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-[#BBD5DA]/40">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">Role:</span>
          <button
            onClick={() => setRoleFilter('ALL')}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
              roleFilter === 'ALL'
                ? 'bg-[#FF0000] text-white font-bold'
                : 'bg-[#F5F5F5] text-slate-600 hover:bg-[#DFF1F1] border border-[#BBD5DA]'
            }`}
          >
            All Roles ({users.length})
          </button>
          {USER_ROLES.map((r) => {
            const count = users.filter((u) => u.role === r).length;
            return (
              <button
                key={r}
                onClick={() => setRoleFilter(r)}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                  roleFilter === r
                    ? 'bg-[#FF0000] text-white font-bold'
                    : 'bg-[#F5F5F5] text-slate-600 hover:bg-[#DFF1F1] border border-[#BBD5DA]'
                }`}
              >
                {r} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Users Grid */}
      {filteredUsers.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">No team members found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {searchQuery || roleFilter !== 'ALL' || statusFilter !== 'ALL'
              ? 'Try changing your search keywords or filter criteria.'
              : 'Start by creating your first sales rep or engineer.'}
          </p>
          <button
            onClick={onOpenCreateUserModal}
            className="mt-4 px-4 py-2 rounded-lg text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 transition-colors inline-flex items-center gap-1.5"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Create New User</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredUsers.map((user) => {
            const stats = userStats[user.name] || { total: 0, surveys: 0, won: 0 };
            const initials = user.name
              .split(' ')
              .map((n) => n[0])
              .join('')
              .substring(0, 2)
              .toUpperCase();

            const isDeleting = deleteConfirmId === user.id;

            return (
              <div
                key={user.id}
                id={`user-card-${user.id}`}
                className={`bg-white rounded-xl border transition-all hover:shadow-sm flex flex-col justify-between ${
                  user.status === 'Active' ? 'border-slate-200' : 'border-slate-200 opacity-75 bg-slate-50/40'
                }`}
              >
                {/* Card Header */}
                <div className="p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-11 h-11 rounded-lg ${
                          user.avatar_color || 'bg-blue-600'
                        } text-white flex items-center justify-center font-bold text-sm shadow-2xs shrink-0`}
                      >
                        {initials}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h3 className="text-sm font-bold text-slate-900 leading-tight">
                            {user.name}
                          </h3>
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            {user.role}
                          </span>
                          {user.username && (
                            <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-blue-50 text-blue-700 border border-blue-100">
                              @{user.username}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <button
                      onClick={() => onToggleUserStatus(user)}
                      title="Click to toggle status"
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 transition-colors ${
                        user.status === 'Active'
                          ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                          : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          user.status === 'Active' ? 'bg-green-600' : 'bg-rose-600'
                        }`}
                      />
                      <span>{user.status}</span>
                    </button>
                  </div>

                  {/* Contact & Territory details */}
                  <div className="mt-4 space-y-2 text-xs text-slate-600 border-t border-slate-100 pt-3">
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <a
                        href={`mailto:${user.email}`}
                        className="hover:text-blue-600 truncate font-medium"
                      >
                        {user.email}
                      </a>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <a
                          href={`tel:${user.mobile_number}`}
                          className="hover:text-blue-600 font-medium"
                        >
                          {user.mobile_number}
                        </a>
                      </div>
                      <a
                        href={`https://wa.me/${user.mobile_number.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-green-600 hover:text-green-700 font-bold flex items-center gap-0.5"
                      >
                        <MessageSquare className="w-3 h-3" />
                        <span>Chat</span>
                      </a>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="font-medium text-slate-700">
                        {user.district === 'All Kerala' ? 'All Kerala Territory' : `${user.district} District`}
                      </span>
                    </div>
                  </div>

                  {/* Live Lead Performance Stats */}
                  <div className="mt-4 grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200/80 text-center">
                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-500">Leads</div>
                      <div className="text-sm font-bold text-slate-900">{stats.total}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-500">Surveys</div>
                      <div className="text-sm font-bold text-blue-700">{stats.surveys}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-500">Orders</div>
                      <div className="text-sm font-bold text-green-700">{stats.won}</div>
                    </div>
                  </div>

                  {/* Permissions Summary Badges */}
                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap items-center gap-1">
                    <span className="text-[10px] font-bold text-slate-400 mr-0.5">Access:</span>
                    {user.permissions?.accessAssignedLeadsOnly ? (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#DFF1F1] text-[#0E2429] border border-[#BBD5DA]">
                        🎯 Assigned Leads Only
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        🌐 All Leads
                      </span>
                    )}
                    {user.permissions?.canAddLead && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
                        + Add Lead
                      </span>
                    )}
                    {user.permissions?.canEditContactDetails && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-100">
                        Edit Contact
                      </span>
                    )}
                    {user.permissions?.canDeleteLead && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-50 text-rose-700 border border-rose-100">
                        Delete Lead
                      </span>
                    )}
                    {user.permissions?.canAccessExcel && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                        Excel
                      </span>
                    )}
                    {user.permissions?.canManageUsers && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-50 text-purple-700 border border-purple-100">
                        Team & Users
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="p-3 bg-slate-50/70 border-t border-slate-100 rounded-b-xl flex items-center justify-between gap-2">
                  <button
                    onClick={() => onFilterLeadsByRep(user.name)}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    <span>View Assigned Leads</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onEditUser(user)}
                      className="p-1.5 rounded text-slate-500 hover:text-blue-600 hover:bg-white border border-transparent hover:border-slate-200 transition-all"
                      title="Edit User Details"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    {isDeleting ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            onDeleteUser(user.id);
                            setDeleteConfirmId(null);
                          }}
                          className="px-2 py-0.5 rounded bg-rose-600 text-white text-[10px] font-bold"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(null)}
                          className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 text-[10px]"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirmId(user.id)}
                        className="p-1.5 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 transition-all"
                        title="Delete User"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
