import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Phone, 
  MessageSquare, 
  Edit3, 
  Trash2, 
  Calendar, 
  MapPin, 
  User, 
  IndianRupee, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  ArrowUpDown,
  MoreVertical,
  Plus,
  Zap,
  Home,
  Check,
  ChevronDown,
  Layers,
  LayoutGrid,
  List,
  FileText,
  Sparkles,
  ClipboardList,
  X,
} from 'lucide-react';
import { Lead, LeadStatus, RoofType, FilterOptions, AppUser, RequiredProduct } from '../types';
import { 
  KERALA_DISTRICTS, 
  LEAD_STATUSES, 
  ROOF_TYPES, 
  SALES_REPS,
  REQUIRED_PRODUCT_OPTIONS
} from '../lib/mockData';
import { 
  formatDateTime, 
  isDateInMonth, 
  isDateOnExactDay, 
  formatMonthYearLabel, 
  formatExactDateLabel, 
  getYearMonthKey 
} from '../lib/dateUtils';
import { parseKsebBill } from '../lib/billUtils';

interface LeadListProps {
  leads: Lead[];
  users?: AppUser[];
  currentUser?: AppUser | null;
  onEditLead: (lead: Lead) => void;
  onOpenUpdateLeadModal?: (lead: Lead) => void;
  onDeleteLead: (leadId: string) => void;
  onUpdateStatus: (leadId: string, status: LeadStatus) => void;
  onOpenNewLeadModal: () => void;
  initialFilterRep?: string | null;
  initialFilterStatus?: LeadStatus | 'ALL';
  initialFilterSiteVisit?: 'YES' | 'NO' | 'ALL';
  initialFilterLoan?: 'YES' | 'NO' | 'ALL';
  initialFilterMonth?: string | null;
  initialFilterCreatedMonth?: string | null;
  initialFilterCreatedExactDate?: string | null;
  initialFilterModifiedMonth?: string | null;
  initialFilterModifiedExactDate?: string | null;
  initialActivityFilter?: 'ALL' | 'MODIFIED_IN_MONTH';
  externalSearchQuery?: string;
  canDeleteLead?: boolean;
  canAddLead?: boolean;
  canAccessExcel?: boolean;
  onExportFiltered?: (filteredLeads: Lead[]) => void;
}

export const LeadList: React.FC<LeadListProps> = ({
  leads,
  users = [],
  currentUser,
  onEditLead,
  onOpenUpdateLeadModal,
  onDeleteLead,
  onUpdateStatus,
  onOpenNewLeadModal,
  initialFilterRep,
  initialFilterStatus,
  initialFilterSiteVisit,
  initialFilterLoan,
  initialFilterMonth,
  initialFilterCreatedMonth,
  initialFilterCreatedExactDate,
  initialFilterModifiedMonth,
  initialFilterModifiedExactDate,
  initialActivityFilter,
  externalSearchQuery = '',
  canDeleteLead = true,
  canAddLead = true,
  canAccessExcel = false,
  onExportFiltered,
}) => {
  const isUserLogin = Boolean(currentUser && currentUser.role !== 'Admin' && currentUser.role !== 'Branch Manager');
  const showResponsibleRep = !isUserLogin;

  const [filters, setFilters] = useState<FilterOptions>({
    searchQuery: externalSearchQuery || '',
    statusFilter: initialFilterStatus || 'ALL',
    productFilter: 'ALL',
    roofTypeFilter: 'ALL',
    districtFilter: 'ALL',
    responsibleFilter: initialFilterRep || 'ALL',
    followUpFilter: 'ALL',
    loanRequiredFilter: initialFilterLoan || 'ALL',
    siteVisitFilter: initialFilterSiteVisit || 'ALL',
    monthFilter: initialFilterMonth || initialFilterCreatedMonth || 'ALL',
    createdMonthFilter: initialFilterCreatedMonth || initialFilterMonth || 'ALL',
    createdExactDateFilter: initialFilterCreatedExactDate || '',
    modifiedMonthFilter: initialFilterModifiedMonth || 'ALL',
    modifiedExactDateFilter: initialFilterModifiedExactDate || '',
    activityFilter: initialActivityFilter || 'ALL',
    sortBy: 'created_desc',
  });

  // Available unique creation months
  const availableCreatedMonths = useMemo(() => {
    const set = new Set<string>();
    const curr = getYearMonthKey(new Date()) || '2026-08';
    set.add(curr);
    leads.forEach(l => {
      if (l.created_at) {
        const k = getYearMonthKey(l.created_at);
        if (k) set.add(k);
      }
    });
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [leads]);

  // Available unique modified months
  const availableModifiedMonths = useMemo(() => {
    const set = new Set<string>();
    const curr = getYearMonthKey(new Date()) || '2026-08';
    set.add(curr);
    leads.forEach(l => {
      if (l.updated_at) {
        const k = getYearMonthKey(l.updated_at);
        if (k) set.add(k);
      }
      if (l.conversation_notes_history) {
        l.conversation_notes_history.forEach(n => {
          const k = getYearMonthKey(n.created_at);
          if (k) set.add(k);
        });
      }
    });
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [leads]);

  const availableMonths = availableCreatedMonths;

  // Sync external search query from topbar if provided
  React.useEffect(() => {
    if (externalSearchQuery !== undefined) {
      setFilters((prev) => ({ ...prev, searchQuery: externalSearchQuery }));
    }
  }, [externalSearchQuery]);

  // Sync initialFilterRep if changed from parent
  React.useEffect(() => {
    if (initialFilterRep !== undefined) {
      setFilters((prev) => ({ ...prev, responsibleFilter: initialFilterRep || 'ALL' }));
    }
  }, [initialFilterRep]);

  // Sync initialFilterStatus if changed from dashboard
  React.useEffect(() => {
    if (initialFilterStatus !== undefined) {
      setFilters((prev) => ({ ...prev, statusFilter: initialFilterStatus || 'ALL' }));
    }
  }, [initialFilterStatus]);

  // Sync initialFilterSiteVisit if changed from dashboard
  React.useEffect(() => {
    if (initialFilterSiteVisit !== undefined) {
      setFilters((prev) => ({ ...prev, siteVisitFilter: initialFilterSiteVisit || 'ALL' }));
    }
  }, [initialFilterSiteVisit]);

  // Sync initialFilterLoan if changed from dashboard
  React.useEffect(() => {
    if (initialFilterLoan !== undefined) {
      setFilters((prev) => ({ ...prev, loanRequiredFilter: initialFilterLoan || 'ALL' }));
    }
  }, [initialFilterLoan]);

  // Sync initialFilterCreatedMonth if changed from dashboard
  React.useEffect(() => {
    if (initialFilterCreatedMonth !== undefined) {
      setFilters((prev) => ({ 
        ...prev, 
        createdMonthFilter: initialFilterCreatedMonth || 'ALL',
        monthFilter: initialFilterCreatedMonth || 'ALL'
      }));
    }
  }, [initialFilterCreatedMonth]);

  // Sync initialFilterCreatedExactDate if changed from dashboard
  React.useEffect(() => {
    if (initialFilterCreatedExactDate !== undefined) {
      setFilters((prev) => ({ 
        ...prev, 
        createdExactDateFilter: initialFilterCreatedExactDate || ''
      }));
    }
  }, [initialFilterCreatedExactDate]);

  // Sync initialFilterModifiedMonth if changed from dashboard
  React.useEffect(() => {
    if (initialFilterModifiedMonth !== undefined) {
      setFilters((prev) => ({ ...prev, modifiedMonthFilter: initialFilterModifiedMonth || 'ALL' }));
    }
  }, [initialFilterModifiedMonth]);

  // Sync initialFilterModifiedExactDate if changed from dashboard
  React.useEffect(() => {
    if (initialFilterModifiedExactDate !== undefined) {
      setFilters((prev) => ({ 
        ...prev, 
        modifiedExactDateFilter: initialFilterModifiedExactDate || ''
      }));
    }
  }, [initialFilterModifiedExactDate]);

  // Sync initialFilterMonth if changed from dashboard
  React.useEffect(() => {
    if (initialFilterMonth !== undefined) {
      setFilters((prev) => ({ 
        ...prev, 
        monthFilter: initialFilterMonth || 'ALL',
        createdMonthFilter: initialFilterMonth || 'ALL'
      }));
    }
  }, [initialFilterMonth]);

  // Sync initialActivityFilter if changed from dashboard
  React.useEffect(() => {
    if (initialActivityFilter !== undefined) {
      setFilters((prev) => ({ ...prev, activityFilter: initialActivityFilter || 'ALL' }));
    }
  }, [initialActivityFilter]);

  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [historyModalLead, setHistoryModalLead] = useState<Lead | null>(null);
  const [activeHistoryTab, setActiveHistoryTab] = useState<'conversation' | 'instructions'>('conversation');

  // Helper to test if lead was modified in a given month
  const isLeadModifiedInPeriod = (lead: Lead, monthKey: string): boolean => {
    if (!monthKey || monthKey === 'ALL') return true;
    if (lead.updated_at && isDateInMonth(lead.updated_at, monthKey)) return true;
    if (lead.conversation_notes_history && lead.conversation_notes_history.some(n => isDateInMonth(n.created_at, monthKey))) return true;
    if (lead.special_instructions_history && lead.special_instructions_history.some(i => isDateInMonth(i.created_at, monthKey))) return true;
    return false;
  };

  // Helper to test if lead was modified on an exact date
  const isLeadModifiedOnExactDate = (lead: Lead, exactDateKey: string): boolean => {
    if (!exactDateKey) return true;
    if (lead.updated_at && isDateOnExactDay(lead.updated_at, exactDateKey)) return true;
    if (lead.conversation_notes_history && lead.conversation_notes_history.some(n => isDateOnExactDay(n.created_at, exactDateKey))) return true;
    if (lead.special_instructions_history && lead.special_instructions_history.some(i => isDateOnExactDay(i.created_at, exactDateKey))) return true;
    return false;
  };

  // Filtering & Sorting Logic
  const filteredLeads = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const todayEnd = todayStart + 86400000;

    return leads.filter((lead) => {
      // Search Query
      if (filters.searchQuery.trim()) {
        const q = filters.searchQuery.toLowerCase();
        const matchesName = lead.customer_name.toLowerCase().includes(q);
        const matchesPhone = lead.mobile_number.toLowerCase().includes(q);
        const matchesDistrict = lead.district.toLowerCase().includes(q);
        const matchesSub = (lead.sub_district || '').toLowerCase().includes(q);
        const matchesResp = (lead.responsible || '').toLowerCase().includes(q);
        const matchesAddress = (lead.address || '').toLowerCase().includes(q);
        const matchesKw = (lead.required_kw || '').toLowerCase().includes(q);
        const matchesProduct = (lead.required_product || '').toLowerCase().includes(q);
        if (!matchesName && !matchesPhone && !matchesDistrict && !matchesSub && !matchesResp && !matchesAddress && !matchesKw && !matchesProduct) {
          return false;
        }
      }

      // Status Filter
      if (filters.statusFilter !== 'ALL' && lead.lead_status !== filters.statusFilter) {
        return false;
      }

      // Product Filter (On-Grid / Hybrid)
      if (filters.productFilter && filters.productFilter !== 'ALL' && lead.required_product !== filters.productFilter) {
        return false;
      }

      // Roof Type Filter
      if (filters.roofTypeFilter !== 'ALL' && lead.roof_type !== filters.roofTypeFilter) {
        return false;
      }

      // District Filter
      if (filters.districtFilter !== 'ALL' && lead.district !== filters.districtFilter) {
        return false;
      }

      // 1. Responsible Filter
      if (filters.responsibleFilter !== 'ALL' && lead.responsible !== filters.responsibleFilter) {
        return false;
      }

      // Loan Filter
      if (filters.loanRequiredFilter === 'YES' && !lead.required_loan) return false;
      if (filters.loanRequiredFilter === 'NO' && lead.required_loan) return false;

      // Site Visit Filter
      if (filters.siteVisitFilter === 'YES' && !lead.required_free_site_visit) return false;
      if (filters.siteVisitFilter === 'NO' && lead.required_free_site_visit) return false;

      // 2. Lead Created On Filter (Exact Date takes precedence if set, otherwise Monthly)
      if (filters.createdExactDateFilter) {
        if (!isDateOnExactDay(lead.created_at, filters.createdExactDateFilter)) {
          return false;
        }
      } else {
        const activeCreated = filters.createdMonthFilter || filters.monthFilter;
        if (activeCreated && activeCreated !== 'ALL') {
          if (!isDateInMonth(lead.created_at, activeCreated)) {
            return false;
          }
        }
      }

      // 3. Lead Modified On Filter (Exact Date takes precedence if set, otherwise Monthly)
      if (filters.modifiedExactDateFilter) {
        if (!isLeadModifiedOnExactDate(lead, filters.modifiedExactDateFilter)) {
          return false;
        }
      } else if (filters.modifiedMonthFilter && filters.modifiedMonthFilter !== 'ALL') {
        if (!isLeadModifiedInPeriod(lead, filters.modifiedMonthFilter)) {
          return false;
        }
      } else if (filters.activityFilter === 'MODIFIED_IN_MONTH') {
        // If modified activity filter active without specific month
        const hasUpdates = (lead.updated_at && lead.updated_at !== lead.created_at) ||
          (lead.conversation_notes_history && lead.conversation_notes_history.length > 0) ||
          (lead.special_instructions_history && lead.special_instructions_history.length > 0);
        if (!hasUpdates) return false;
      }

      // Follow-up status filter
      if (filters.followUpFilter !== 'ALL') {
        if (!lead.next_follow_up) {
          return filters.followUpFilter === 'NONE';
        }
        const fTime = new Date(lead.next_follow_up).getTime();
        if (isNaN(fTime)) return false;

        if (filters.followUpFilter === 'OVERDUE') {
          return fTime < todayStart && lead.lead_status !== 'Open' && lead.lead_status !== 'Order Confirmed';
        }
        if (filters.followUpFilter === 'TODAY') {
          return fTime >= todayStart && fTime < todayEnd;
        }
        if (filters.followUpFilter === 'UPCOMING') {
          return fTime >= todayEnd;
        }
      }

      return true;
    }).sort((a, b) => {
      if (filters.sortBy === 'updated_desc') {
        const timeA = new Date(a.updated_at || a.created_at).getTime();
        const timeB = new Date(b.updated_at || b.created_at).getTime();
        return timeB - timeA;
      }
      if (filters.sortBy === 'updated_asc') {
        const timeA = new Date(a.updated_at || a.created_at).getTime();
        const timeB = new Date(b.updated_at || b.created_at).getTime();
        return timeA - timeB;
      }
      if (filters.sortBy === 'created_desc') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      if (filters.sortBy === 'created_asc') {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }
      if (filters.sortBy === 'bill_desc') {
        const billA = parseKsebBill(a.avg_kseb_bill).avg;
        const billB = parseKsebBill(b.avg_kseb_bill).avg;
        return billB - billA;
      }
      if (filters.sortBy === 'name_asc') {
        return a.customer_name.localeCompare(b.customer_name);
      }
      if (filters.sortBy === 'followup_asc') {
        if (!a.next_follow_up) return 1;
        if (!b.next_follow_up) return -1;
        return new Date(a.next_follow_up).getTime() - new Date(b.next_follow_up).getTime();
      }
      return 0;
    });
  }, [leads, filters]);

  const generateWhatsAppLink = (lead: Lead) => {
    const cleanPhone = lead.mobile_number.replace(/[^0-9]/g, '');
    const phoneWithCountry = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const text = encodeURIComponent(
      `Hello ${lead.customer_name}, Greetings from Solar CRM! We are following up regarding your Rooftop Solar Inquiry in ${lead.district}. Would you like to schedule the free site survey or discuss subsidy benefits?`
    );
    return `https://wa.me/${phoneWithCountry}?text=${text}`;
  };

  const getStatusBadgeStyle = (status: LeadStatus) => {
    switch (status) {
      case 'Open':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'Inprogress':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'No Response':
        return 'bg-rose-100 text-rose-700 border-rose-200';
      case 'Busy Callback':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Scheduled Site Survey':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'Site Survey Completed':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'Order Confirmed':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Not Intrested':
        return 'bg-slate-100 text-slate-700 border-slate-300';
      case 'Lost':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getFollowUpBadge = (lead: Lead) => {
    if (!lead.next_follow_up) {
      return (lead.lead_status === 'Open' || lead.lead_status === 'Not Intrested' || lead.lead_status === 'Lost') ? (
        <span className="text-[11px] text-slate-400">{lead.lead_status === 'Open' ? 'No date set (Open)' : 'Closed / Inactive'}</span>
      ) : (
        <span className="text-[11px] text-rose-600 font-semibold">Missing date</span>
      );
    }

    const fTime = new Date(lead.next_follow_up).getTime();
    if (isNaN(fTime)) return null;

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const todayEnd = todayStart + 86400000;

    const isOverdue = fTime < todayStart && lead.lead_status !== 'Open' && lead.lead_status !== 'Order Confirmed' && lead.lead_status !== 'Not Intrested' && lead.lead_status !== 'Lost';
    const isToday = fTime >= todayStart && fTime < todayEnd;

    const formattedDT = formatDateTime(lead.next_follow_up);

    if (isOverdue) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.8 rounded-md text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
          <AlertTriangle className="w-3 h-3 text-rose-600" />
          Overdue: {formattedDT}
        </span>
      );
    }
    if (isToday) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.8 rounded-md text-[11px] font-bold bg-orange-50 text-orange-700 border border-orange-200">
          <Clock className="w-3 h-3 text-orange-600" />
          Today: {formattedDT}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600">
        <Calendar className="w-3 h-3 text-slate-400" />
        {formattedDT}
      </span>
    );
  };

  const formatLeadDateTime = (isoString?: string) => {
    return formatDateTime(isoString);
  };

  const handleSelectAll = () => {
    if (selectedLeadIds.length === filteredLeads.length) {
      setSelectedLeadIds([]);
    } else {
      setSelectedLeadIds(filteredLeads.map((l) => l.id));
    }
  };

  const toggleSelectLead = (id: string) => {
    if (selectedLeadIds.includes(id)) {
      setSelectedLeadIds(selectedLeadIds.filter((item) => item !== id));
    } else {
      setSelectedLeadIds([...selectedLeadIds, id]);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Search & Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-[#BBD5DA] shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              id="input-search-leads"
              type="text"
              placeholder="Search by customer name, mobile number, address, notes..."
              value={filters.searchQuery}
              onChange={(e) => setFilters({ ...filters, searchQuery: e.target.value })}
              className="w-full pl-10 pr-4 py-2 rounded-lg text-sm border border-[#BBD5DA] bg-[#F5F5F5]/60 focus:bg-white focus:border-[#FF0000] focus:ring-2 focus:ring-[#FF0000]/20 transition-all"
            />
            {filters.searchQuery && (
              <button
                onClick={() => setFilters({ ...filters, searchQuery: '' })}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs font-semibold text-slate-400 hover:text-slate-600"
              >
                Clear
              </button>
            )}
          </div>

          {/* Quick Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold border flex items-center gap-1.5 transition-colors ${
                showAdvancedFilters || filters.statusFilter !== 'ALL' || filters.roofTypeFilter !== 'ALL' || filters.followUpFilter !== 'ALL' || filters.loanRequiredFilter !== 'ALL' || filters.siteVisitFilter !== 'ALL'
                  ? 'bg-[#DFF1F1] text-[#0A2228] border-[#BBD5DA]'
                  : 'bg-white text-slate-700 border-[#BBD5DA] hover:bg-[#F5F5F5]'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Filters</span>
              {(filters.statusFilter !== 'ALL' || filters.roofTypeFilter !== 'ALL' || filters.followUpFilter !== 'ALL' || filters.loanRequiredFilter !== 'ALL' || filters.siteVisitFilter !== 'ALL') && (
                <span className="w-2 h-2 rounded-full bg-[#FF0000]" />
              )}
            </button>

            {/* Sort Dropdown */}
            <div className="relative">
              <select
                value={filters.sortBy}
                onChange={(e) => setFilters({ ...filters, sortBy: e.target.value as any })}
                className="px-3 py-2 rounded-lg text-xs font-semibold border border-[#BBD5DA] bg-white text-slate-700 focus:ring-2 focus:ring-[#FF0000]/20 focus:border-[#FF0000] cursor-pointer"
              >
                <option value="updated_desc">Recently Modified</option>
                <option value="updated_asc">Least Recently Modified</option>
                <option value="created_desc">Newest Created</option>
                <option value="created_asc">Oldest Created</option>
                <option value="followup_asc">Follow-up: Soonest</option>
                <option value="bill_desc">Highest KSEB Bill</option>
                <option value="name_asc">Name (A-Z)</option>
              </select>
            </div>

            {/* Export Filtered Data */}
            {canAccessExcel && (
              <button
                onClick={() => onExportFiltered && onExportFiltered(filteredLeads)}
                className="px-3.5 py-2 rounded-lg text-xs font-semibold border border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 flex items-center gap-1.5 transition-colors"
                title="Export Filtered Data to Excel"
              >
                <FileText className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Export</span>
              </button>
            )}

            {/* View Mode Switcher */}
            <div className="hidden sm:flex items-center bg-[#F5F5F5] p-1 rounded-lg border border-[#BBD5DA]">
              <button
                onClick={() => setViewMode('card')}
                className={`p-1.5 rounded-md transition-colors ${
                  viewMode === 'card' ? 'bg-white text-slate-900 shadow-xs border border-[#BBD5DA]' : 'text-slate-500 hover:text-slate-900'
                }`}
                title="Card Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-md transition-colors ${
                  viewMode === 'table' ? 'bg-white text-slate-900 shadow-xs border border-[#BBD5DA]' : 'text-slate-500 hover:text-slate-900'
                }`}
                title="Table View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Quick Horizontal Stage Filter Strip */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs border-t border-[#BBD5DA]/50 pt-2.5">
          <button
            onClick={() => setFilters({ ...filters, statusFilter: 'ALL' })}
            className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              filters.statusFilter === 'ALL'
                ? 'bg-[#0E2429] text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200/60'
            }`}
          >
            <span>All Stages</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${filters.statusFilter === 'ALL' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'}`}>
              {leads.length}
            </span>
          </button>

          {LEAD_STATUSES.map((st) => {
            const count = leads.filter((l) => l.lead_status === st).length;
            const isSelected = filters.statusFilter === st;
            return (
              <button
                key={st}
                onClick={() => setFilters({ ...filters, statusFilter: st })}
                className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-[#FF0000] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200/60'
                }`}
              >
                <span>{st}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>



        {/* Advanced Filters Expandable Drawer */}
        {showAdvancedFilters && (
          <div className="pt-3 border-t border-[#BBD5DA] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            {/* Stages (Status) Filter */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Stages (Lead Status)</label>
              <select
                value={filters.statusFilter}
                onChange={(e) => setFilters({ ...filters, statusFilter: e.target.value as any })}
                className="w-full px-2.5 py-1.5 rounded-lg border border-[#BBD5DA] bg-white focus:border-[#FF0000] font-medium text-slate-800"
              >
                <option value="ALL">All Stages ({leads.length})</option>
                {LEAD_STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {st} ({leads.filter((l) => l.lead_status === st).length})
                  </option>
                ))}
              </select>
            </div>

            {/* Roof Type Filter */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Roof Type</label>
              <select
                value={filters.roofTypeFilter}
                onChange={(e) => setFilters({ ...filters, roofTypeFilter: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded-lg border border-[#BBD5DA] bg-white focus:border-[#FF0000]"
              >
                <option value="ALL">All Roof Types</option>
                {ROOF_TYPES.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            {/* Follow-up Queue Filter */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Follow-up Time</label>
              <select
                value={filters.followUpFilter}
                onChange={(e) => setFilters({ ...filters, followUpFilter: e.target.value as any })}
                className="w-full px-2.5 py-1.5 rounded-lg border border-[#BBD5DA] bg-white focus:border-[#FF0000]"
              >
                <option value="ALL">All Follow-ups</option>
                <option value="OVERDUE">Overdue Only</option>
                <option value="TODAY">Due Today</option>
                <option value="UPCOMING">Upcoming</option>
                <option value="NONE">No Date (Open)</option>
              </select>
            </div>

            {/* Loan & Survey Quick Toggle */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Loan / Survey</label>
              <div className="grid grid-cols-2 gap-1.5">
                <select
                  value={filters.loanRequiredFilter}
                  onChange={(e) => setFilters({ ...filters, loanRequiredFilter: e.target.value as any })}
                  className="w-full px-2 py-1.5 rounded-lg border border-[#BBD5DA] bg-white text-[11px]"
                >
                  <option value="ALL">Loan: Any</option>
                  <option value="YES">Loan: Yes</option>
                  <option value="NO">Loan: No</option>
                </select>
                <select
                  value={filters.siteVisitFilter}
                  onChange={(e) => setFilters({ ...filters, siteVisitFilter: e.target.value as any })}
                  className="w-full px-2 py-1.5 rounded-lg border border-[#BBD5DA] bg-white text-[11px]"
                >
                  <option value="ALL">Survey: Any</option>
                  <option value="YES">Survey: Yes</option>
                  <option value="NO">Survey: No</option>
                </select>
              </div>
            </div>

            {/* District Filter */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">District</label>
              <select
                value={filters.districtFilter}
                onChange={(e) => setFilters({ ...filters, districtFilter: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded-lg border border-[#BBD5DA] bg-white focus:border-[#FF0000]"
              >
                <option value="ALL">All Districts</option>
                {KERALA_DISTRICTS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            {/* Responsible Rep Filter (Shown when user has broad access) */}
            {!currentUser?.permissions?.accessAssignedLeadsOnly && (
              <div>
                <label className="block font-bold text-slate-700 mb-1">Assigned Executive</label>
                <select
                  value={filters.responsibleFilter}
                  onChange={(e) => setFilters({ ...filters, responsibleFilter: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-[#BBD5DA] bg-white focus:border-[#FF0000]"
                >
                  <option value="ALL">All Executives ({leads.length})</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.name}>
                      {u.name} ({leads.filter((l) => l.responsible === u.name).length})
                    </option>
                  ))}
                  <option value="Unassigned">Unassigned</option>
                </select>
              </div>
            )}

            {/* Required Product Filter (On-Grid / Hybrid) */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Required Product</label>
              <select
                value={filters.productFilter || 'ALL'}
                onChange={(e) => setFilters({ ...filters, productFilter: e.target.value as any })}
                className="w-full px-2.5 py-1.5 rounded-lg border border-[#BBD5DA] bg-white focus:border-[#FF0000]"
              >
                <option value="ALL">All Products (On-Grid / Hybrid)</option>
                {REQUIRED_PRODUCT_OPTIONS.map((prod) => (
                  <option key={prod} value={prod}>
                    {prod} ({leads.filter((l) => l.required_product === prod).length})
                  </option>
                ))}
              </select>
            </div>

            {/* Monthly Wise Filter */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Month (Period)</label>
              <select
                value={filters.monthFilter || 'ALL'}
                onChange={(e) => setFilters({ ...filters, monthFilter: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded-lg border border-[#BBD5DA] bg-white focus:border-[#FF0000] font-semibold text-emerald-800"
              >
                <option value="ALL">All Months (All Time)</option>
                {availableMonths.map((mKey) => (
                  <option key={mKey} value={mKey}>
                    {formatMonthYearLabel(mKey)} {mKey === getYearMonthKey(new Date()) ? '(Current)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Reset Filters */}
            <div className="col-span-1 sm:col-span-2 lg:col-span-4 flex justify-end pt-1">
              <button
                onClick={() => setFilters({
                  searchQuery: '',
                  statusFilter: 'ALL',
                  productFilter: 'ALL',
                  roofTypeFilter: 'ALL',
                  districtFilter: 'ALL',
                  responsibleFilter: 'ALL',
                  followUpFilter: 'ALL',
                  loanRequiredFilter: 'ALL',
                  siteVisitFilter: 'ALL',
                  monthFilter: 'ALL',
                  activityFilter: 'ALL',
                  sortBy: 'created_desc',
                })}
                className="text-xs font-semibold text-slate-600 hover:text-[#FF0000] transition-colors cursor-pointer"
              >
                Reset All Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Active Filter Badges */}
      {(filters.statusFilter !== 'ALL' || filters.searchQuery || filters.districtFilter !== 'ALL' || filters.roofTypeFilter !== 'ALL' || filters.productFilter !== 'ALL' || (filters.responsibleFilter && filters.responsibleFilter !== 'ALL') || filters.siteVisitFilter !== 'ALL' || filters.loanRequiredFilter !== 'ALL' || (filters.monthFilter && filters.monthFilter !== 'ALL') || (filters.createdMonthFilter && filters.createdMonthFilter !== 'ALL') || filters.createdExactDateFilter || (filters.modifiedMonthFilter && filters.modifiedMonthFilter !== 'ALL') || filters.modifiedExactDateFilter || (filters.activityFilter && filters.activityFilter !== 'ALL')) && (
        <div className="flex items-center gap-1.5 flex-wrap px-1 text-xs">
          <span className="text-[11px] text-slate-500 font-medium">Filtered by:</span>

          {/* Created Exact Date */}
          {filters.createdExactDateFilter && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.8 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 shadow-2xs">
              <Calendar className="w-3 h-3 text-emerald-700" />
              <span>Created: <strong>{formatExactDateLabel(filters.createdExactDateFilter)}</strong></span>
              <button
                onClick={() => setFilters({ ...filters, createdExactDateFilter: '' })}
                className="hover:text-rose-600 transition-colors ml-0.5 cursor-pointer"
                title="Remove created date filter"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {/* Created Month */}
          {!filters.createdExactDateFilter && (filters.createdMonthFilter || filters.monthFilter) && (filters.createdMonthFilter !== 'ALL' || filters.monthFilter !== 'ALL') && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.8 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 shadow-2xs">
              <Calendar className="w-3 h-3 text-emerald-700" />
              <span>Created Month: <strong>{formatMonthYearLabel(filters.createdMonthFilter || filters.monthFilter)}</strong></span>
              <button
                onClick={() => setFilters({ ...filters, monthFilter: 'ALL', createdMonthFilter: 'ALL' })}
                className="hover:text-rose-600 transition-colors ml-0.5 cursor-pointer"
                title="Remove created month filter"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {/* Modified Exact Date */}
          {filters.modifiedExactDateFilter && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.8 rounded-full text-xs font-bold bg-purple-100 text-purple-900 border border-purple-300 shadow-2xs">
              <Clock className="w-3 h-3 text-purple-700" />
              <span>Modified: <strong>{formatExactDateLabel(filters.modifiedExactDateFilter)}</strong></span>
              <button
                onClick={() => setFilters({ ...filters, modifiedExactDateFilter: '' })}
                className="hover:text-rose-600 transition-colors ml-0.5 cursor-pointer"
                title="Remove modified date filter"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {/* Modified Month */}
          {!filters.modifiedExactDateFilter && filters.modifiedMonthFilter && filters.modifiedMonthFilter !== 'ALL' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.8 rounded-full text-xs font-bold bg-purple-100 text-purple-900 border border-purple-300 shadow-2xs">
              <Clock className="w-3 h-3 text-purple-700" />
              <span>Modified Month: <strong>{formatMonthYearLabel(filters.modifiedMonthFilter)}</strong></span>
              <button
                onClick={() => setFilters({ ...filters, modifiedMonthFilter: 'ALL' })}
                className="hover:text-rose-600 transition-colors ml-0.5 cursor-pointer"
                title="Remove modified month filter"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {filters.activityFilter === 'MODIFIED_IN_MONTH' && !filters.modifiedMonthFilter && !filters.modifiedExactDateFilter && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.8 rounded-full text-xs font-bold bg-purple-100 text-purple-900 border border-purple-300">
              <span>Activity: <strong>Modified Leads</strong></span>
              <button
                onClick={() => setFilters({ ...filters, activityFilter: 'ALL' })}
                className="hover:text-rose-600 transition-colors ml-0.5 cursor-pointer"
                title="Remove modified filter"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {filters.statusFilter !== 'ALL' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.8 rounded-full text-xs font-bold bg-[#DFF1F1] text-[#0E2429] border border-[#BBD5DA]">
              <span>Stage: <strong>{filters.statusFilter}</strong></span>
              <button
                onClick={() => setFilters({ ...filters, statusFilter: 'ALL' })}
                className="hover:text-rose-600 transition-colors ml-0.5 cursor-pointer"
                title="Remove stage filter"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {filters.siteVisitFilter !== 'ALL' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.8 rounded-full text-xs font-bold bg-emerald-50 text-emerald-900 border border-emerald-300">
              <span>Free Site Survey: <strong>{filters.siteVisitFilter === 'YES' ? 'Requested' : 'Not Requested'}</strong></span>
              <button
                onClick={() => setFilters({ ...filters, siteVisitFilter: 'ALL' })}
                className="hover:text-rose-600 transition-colors ml-0.5"
                title="Remove site survey filter"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {filters.loanRequiredFilter !== 'ALL' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.8 rounded-full text-xs font-bold bg-blue-50 text-blue-900 border border-blue-300">
              <span>Bank Loan: <strong>{filters.loanRequiredFilter === 'YES' ? 'Required' : 'Not Required'}</strong></span>
              <button
                onClick={() => setFilters({ ...filters, loanRequiredFilter: 'ALL' })}
                className="hover:text-rose-600 transition-colors ml-0.5"
                title="Remove loan filter"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {filters.searchQuery && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.8 rounded-full text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-300">
              <span>Search: "{filters.searchQuery}"</span>
              <button
                onClick={() => setFilters({ ...filters, searchQuery: '' })}
                className="hover:text-rose-600 transition-colors ml-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {filters.districtFilter !== 'ALL' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.8 rounded-full text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-300">
              <span>District: {filters.districtFilter}</span>
              <button
                onClick={() => setFilters({ ...filters, districtFilter: 'ALL' })}
                className="hover:text-rose-600 transition-colors ml-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {filters.productFilter !== 'ALL' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.8 rounded-full text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-300">
              <span>Product: {filters.productFilter}</span>
              <button
                onClick={() => setFilters({ ...filters, productFilter: 'ALL' })}
                className="hover:text-rose-600 transition-colors ml-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {filters.responsibleFilter && filters.responsibleFilter !== 'ALL' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.8 rounded-full text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-300">
              <span>Rep: {filters.responsibleFilter}</span>
              <button
                onClick={() => setFilters({ ...filters, responsibleFilter: 'ALL' })}
                className="hover:text-rose-600 transition-colors ml-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          <button
            onClick={() => setFilters({
              searchQuery: '',
              statusFilter: 'ALL',
              productFilter: 'ALL',
              roofTypeFilter: 'ALL',
              districtFilter: 'ALL',
              responsibleFilter: 'ALL',
              followUpFilter: 'ALL',
              loanRequiredFilter: 'ALL',
              siteVisitFilter: 'ALL',
              monthFilter: 'ALL',
              createdMonthFilter: 'ALL',
              createdExactDateFilter: '',
              modifiedMonthFilter: 'ALL',
              modifiedExactDateFilter: '',
              activityFilter: 'ALL',
              sortBy: 'created_desc',
            })}
            className="text-[11px] font-semibold text-[#FF0000] hover:underline ml-1 cursor-pointer"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Results Header with Count & Bulk Action */}
      <div className="flex items-center justify-between px-1">
        <div className="text-xs font-semibold text-slate-600 flex items-center gap-2">
          <span>Showing <strong>{filteredLeads.length}</strong> of {leads.length} leads</span>
          {selectedLeadIds.length > 0 && (
            <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 text-[11px] font-bold">
              {selectedLeadIds.length} Selected
            </span>
          )}
        </div>

        {selectedLeadIds.length > 0 && canDeleteLead && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (window.confirm(`Delete ${selectedLeadIds.length} selected leads?`)) {
                  selectedLeadIds.forEach((id) => onDeleteLead(id));
                  setSelectedLeadIds([]);
                }
              }}
              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Selected</span>
            </button>
          </div>
        )}
      </div>

      {/* Empty State */}
      {filteredLeads.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center border border-[#BBD5DA] shadow-xs">
          <div className="w-12 h-12 rounded-lg bg-[#DFF1F1] text-[#0E2429] mx-auto flex items-center justify-center mb-3 border border-[#BBD5DA]">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No matching solar leads found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
            Try adjusting your search criteria, clear status filters, or add a new lead.
          </p>
          {canAddLead && (
            <button
              onClick={onOpenNewLeadModal}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold bg-[#FF0000] hover:bg-[#D60000] text-white shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Lead</span>
            </button>
          )}
        </div>
      ) : viewMode === 'card' ? (
        /* Card Grid View (Mobile First & Touch friendly) */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLeads.map((lead) => {
            const isSelected = selectedLeadIds.includes(lead.id);

            return (
              <div
                key={lead.id}
                className={`bg-white rounded-xl p-4 border transition-all hover:shadow-md flex flex-col justify-between relative ${
                  isSelected ? 'border-[#FF0000] ring-2 ring-[#FF0000]/20' : 'border-[#BBD5DA]'
                }`}
              >
                <div>
                  {/* Top Bar: Checkbox, Status Badge & Follow-up Time */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectLead(lead.id)}
                        className="w-4 h-4 rounded text-[#FF0000] focus:ring-[#FF0000] border-[#BBD5DA] cursor-pointer"
                      />
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${getStatusBadgeStyle(lead.lead_status)}`}>
                        {lead.lead_status}
                      </span>
                    </div>

                    <div className="text-right">
                      {lead.next_follow_up ? (
                        <span className="inline-flex items-center gap-1.5 text-xs text-slate-600 font-medium font-mono">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{formatDateTime(lead.next_follow_up)}</span>
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400">No date set</span>
                      )}
                    </div>
                  </div>

                  {/* Customer Name & Phone */}
                  <div className="mb-3">
                    <h3 
                      onClick={() => onEditLead(lead)}
                      className="text-base font-bold text-slate-900 hover:text-[#FF0000] transition-colors cursor-pointer"
                    >
                      {lead.customer_name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs font-mono font-medium text-slate-700">
                        {lead.mobile_number}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <a
                          href={`tel:${lead.mobile_number}`}
                          title="Call"
                          className="flex items-center justify-center w-6 h-6 rounded-md bg-[#2563EB] text-white hover:bg-blue-700 transition-colors shadow-xs"
                        >
                          <Phone className="w-3 h-3" />
                        </a>
                        <a
                          href={generateWhatsAppLink(lead)}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="WhatsApp"
                          className="flex items-center justify-center w-6 h-6 rounded-md bg-[#16A34A] text-white hover:bg-green-700 transition-colors shadow-xs"
                        >
                          <MessageSquare className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Location Box */}
                  <div className="text-xs text-slate-700 mb-3 bg-[#F5F5F5] p-2.5 rounded-lg border border-[#BBD5DA] space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 font-bold text-slate-800">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{lead.district}</span>
                        {lead.sub_district && <span className="text-slate-600 font-normal">({lead.sub_district})</span>}
                      </span>
                      {lead.pincode && (
                        <span className="text-[11px] text-slate-500 font-mono">Pin: {lead.pincode}</span>
                      )}
                    </div>
                    {lead.address && (
                      <p className="text-[11px] text-slate-600 pl-5 leading-tight">
                        {lead.address}
                      </p>
                    )}
                  </div>

                  {/* Badges / Specs (2 rows) */}
                  <div className="space-y-1.5 mb-3">
                    {/* Row 1: Avg KSEB Bill & Roof Type */}
                    <div className="flex flex-wrap items-center gap-1.5 text-xs">
                      <span className="px-2.5 py-1 rounded-md bg-[#F5F5F5] text-slate-900 font-bold border border-[#BBD5DA] flex items-center gap-1">
                        <IndianRupee className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{lead.avg_kseb_bill || '—'}</span>
                      </span>
                      {lead.roof_type && (
                        <span className="px-2.5 py-1 rounded-md bg-[#F5F5F5] text-slate-800 font-medium border border-[#BBD5DA]">
                          {lead.roof_type}
                        </span>
                      )}
                    </div>

                    {/* Row 2: Required KW & Product Type */}
                    <div className="flex flex-wrap items-center gap-1.5 text-xs">
                      {lead.required_kw && (
                        <span className="px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-800 font-bold border border-blue-200 flex items-center gap-1">
                          <Zap className="w-3.5 h-3.5 text-blue-600" />
                          <span>{lead.required_kw.toLowerCase().includes('kw') ? lead.required_kw : `${lead.required_kw} kW`}</span>
                        </span>
                      )}
                      {lead.required_product && (
                        <span className={`px-2.5 py-0.5 rounded-md font-bold border ${
                          lead.required_product === 'On-Grid'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}>
                          {lead.required_product}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Lead Timestamps Section (All 5 Dates & Times) */}
                  <div className="text-xs text-slate-700 bg-slate-50/90 p-2.5 rounded-lg border border-[#BBD5DA]/60 space-y-1.5 font-mono">
                    {/* Created Date and Time */}
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-slate-600 font-sans font-medium text-[11.5px]">
                        <Clock className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span>Created:</span>
                      </span>
                      <span className="font-semibold text-slate-800 text-[11px]">
                        {formatLeadDateTime(lead.created_at)}
                      </span>
                    </div>

                    {/* Next Follow Up Date and Time */}
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-slate-600 font-sans font-medium text-[11.5px]">
                        <Calendar className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>Next Follow Up:</span>
                      </span>
                      <span className="font-semibold text-slate-800 text-[11px]">
                        {lead.next_follow_up ? formatLeadDateTime(lead.next_follow_up) : '—'}
                      </span>
                    </div>

                    {/* Site Survey Scheduled Date and Time */}
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-slate-600 font-sans font-medium text-[11.5px]">
                        <Calendar className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                        <span>Survey Scheduled:</span>
                      </span>
                      <span className="font-semibold text-slate-800 text-[11px]">
                        {lead.site_survey_requested_date ? formatLeadDateTime(lead.site_survey_requested_date) : '—'}
                      </span>
                    </div>

                    {/* Site Survey Completed Date and Time */}
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-slate-600 font-sans font-medium text-[11.5px]">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Survey Completed:</span>
                      </span>
                      <span className="font-semibold text-slate-800 text-[11px]">
                        {lead.site_survey_completed_date ? formatLeadDateTime(lead.site_survey_completed_date) : '—'}
                      </span>
                    </div>

                    {/* Modified Date and Time */}
                    <div className="flex items-center justify-between pt-1 border-t border-[#BBD5DA]/40">
                      <span className="flex items-center gap-1.5 text-slate-600 font-sans font-medium text-[11.5px]">
                        <Clock className="w-3.5 h-3.5 text-[#FF0000] shrink-0" />
                        <span>Modified:</span>
                      </span>
                      <span className="font-semibold text-slate-800 text-[11px]">
                        {formatLeadDateTime(lead.updated_at || lead.created_at)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Desktop Table View */
        <div className="bg-white rounded-xl border border-[#BBD5DA] shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-[#DFF1F1] border-b border-[#BBD5DA] text-[#0A2228] uppercase tracking-wider font-bold text-[11px]">
                <tr>
                  <th className="p-3.5 w-10">
                    <input
                      type="checkbox"
                      checked={selectedLeadIds.length === filteredLeads.length && filteredLeads.length > 0}
                      onChange={handleSelectAll}
                      className="w-4 h-4 rounded text-[#FF0000] focus:ring-[#FF0000] border-[#BBD5DA]"
                    />
                  </th>
                  <th className="p-3.5">Customer & Phone</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Next Follow-up</th>
                  <th className="p-3.5">Location</th>
                  <th className="p-3.5">Avg KSEB Bill</th>
                  <th className="p-3.5">Roof & Needs</th>
                  <th className="p-3.5">Notes & Instructions</th>
                  <th className="p-3.5">Last Modified</th>
                  {showResponsibleRep && <th className="p-3.5">Responsible</th>}
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#BBD5DA]/40">
                {filteredLeads.map((lead) => {
                  const isSelected = selectedLeadIds.includes(lead.id);
                  const notesCount = (lead.conversation_notes_history?.length || (lead.notes ? 1 : 0));
                  const instCount = (lead.special_instructions_history?.length || (lead.special_instructions ? 1 : 0));

                  return (
                    <tr key={lead.id} className={`hover:bg-[#DFF1F1]/30 transition-colors ${isSelected ? 'bg-[#DFF1F1]/50' : ''}`}>
                      <td className="p-3.5">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectLead(lead.id)}
                          className="w-4 h-4 rounded text-[#FF0000] focus:ring-[#FF0000] border-[#BBD5DA]"
                        />
                      </td>
                      <td className="p-3.5">
                        <div 
                          onClick={() => onEditLead(lead)}
                          className="font-bold text-slate-900 hover:text-[#FF0000] cursor-pointer text-sm"
                        >
                          {lead.customer_name}
                        </div>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="font-mono text-slate-500 text-[11px]">{lead.mobile_number}</span>
                          <a
                            href={`tel:${lead.mobile_number}`}
                            title="Call"
                            className="flex items-center justify-center p-1 rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm"
                          >
                            <Phone className="w-3 h-3" />
                          </a>
                          <a
                            href={generateWhatsAppLink(lead)}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="WhatsApp"
                            className="flex items-center justify-center p-1 rounded bg-green-500 text-white hover:bg-green-600 transition-colors shadow-sm"
                          >
                            <MessageSquare className="w-3 h-3" />
                          </a>
                        </div>
                      </td>
                      <td className="p-3.5">
                        <select
                          value={lead.lead_status}
                          onChange={(e) => onUpdateStatus(lead.id, e.target.value as LeadStatus)}
                          className={`text-[10px] font-bold py-1 px-2 rounded-full border cursor-pointer ${getStatusBadgeStyle(lead.lead_status)}`}
                        >
                          {LEAD_STATUSES.map((st) => (
                            <option key={st} value={st} className="bg-white text-slate-800 font-semibold">{st}</option>
                          ))}
                        </select>
                      </td>
                      <td className="p-3.5">
                        {getFollowUpBadge(lead)}
                      </td>
                      <td className="p-3.5">
                        <div className="font-medium text-slate-800">{lead.district}</div>
                        <div className="text-[11px] text-slate-500">{lead.sub_district || lead.address || '-'}</div>
                      </td>
                      <td className="p-3.5">
                        <span className="font-bold text-slate-900">
                          {lead.avg_kseb_bill || '—'}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <div className="font-medium text-slate-700">{lead.roof_type}</div>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {lead.required_kw && (
                            <span className="px-1.5 py-0.2 rounded bg-blue-50 text-blue-800 text-[10px] font-bold border border-blue-200">
                              {lead.required_kw.toLowerCase().includes('kw') ? lead.required_kw : `${lead.required_kw} kW`}
                            </span>
                          )}
                          {lead.required_product && (
                            <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold border ${
                              lead.required_product === 'On-Grid'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : 'bg-amber-50 text-amber-800 border-amber-200'
                            }`}>
                              {lead.required_product}
                            </span>
                          )}
                          {lead.required_loan && (
                            <span className="px-1.5 py-0.2 rounded bg-[#DFF1F1] text-[#0A2228] text-[10px] font-semibold border border-[#BBD5DA]">
                              Loan
                            </span>
                          )}
                          {lead.required_free_site_visit && (
                            <span className="px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-800 text-[10px] font-semibold border border-emerald-200">
                              Site Visit
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-3.5 max-w-[200px]">
                        <div className="space-y-1">
                          {lead.notes ? (
                            <button
                              type="button"
                              onClick={() => {
                                setHistoryModalLead(lead);
                                setActiveHistoryTab('conversation');
                              }}
                              className="text-left w-full text-[11px] text-slate-700 hover:text-[#0A2228] bg-[#F5F5F5] hover:bg-[#DFF1F1] p-1.5 rounded border border-[#BBD5DA] truncate block transition-colors"
                              title={lead.notes}
                            >
                              <span className="font-bold text-[#FF0000]">[{notesCount}]</span> {lead.notes}
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">No notes</span>
                          )}

                          {lead.special_instructions && (
                            <button
                              type="button"
                              onClick={() => {
                                setHistoryModalLead(lead);
                                setActiveHistoryTab('instructions');
                              }}
                              className="text-left w-full text-[10px] text-amber-900 hover:text-amber-950 bg-amber-50/80 hover:bg-amber-100/60 p-1 rounded border border-amber-200 truncate block transition-colors"
                              title={lead.special_instructions}
                            >
                              <span className="font-bold text-amber-700">★ [{instCount}]</span> {lead.special_instructions}
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="p-3.5 whitespace-nowrap">
                        <div className="font-semibold text-slate-800 text-[11px] flex items-center gap-1">
                          <Clock className="w-3 h-3 text-[#FF0000]" />
                          <span>{formatLeadDateTime(lead.updated_at || lead.created_at)}</span>
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Created: {formatDateTime(lead.created_at)}
                        </div>
                      </td>
                      {showResponsibleRep && (
                        <td className="p-3.5 text-slate-700 font-medium whitespace-nowrap">
                          {lead.responsible}
                        </td>
                      )}
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {onOpenUpdateLeadModal && (
                            <button
                              id={`btn-table-update-${lead.id}`}
                              onClick={() => onOpenUpdateLeadModal(lead)}
                              className="px-2 py-1.5 rounded-lg bg-[#FF0000] hover:bg-[#D60000] text-white text-[11px] font-bold shadow-xs flex items-center gap-1 transition-colors active:scale-95"
                              title="Update Lead (Blank form with notes)"
                            >
                              <ClipboardList className="w-3 h-3" />
                              <span>Update</span>
                            </button>
                          )}
                          <button
                            onClick={() => onEditLead(lead)}
                            className="p-1.5 rounded-lg bg-[#F5F5F5] text-slate-700 hover:bg-[#DFF1F1] transition-colors border border-[#BBD5DA]"
                            title="Edit"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          {canDeleteLead && (
                            <button
                              onClick={() => {
                                if (window.confirm(`Delete lead "${lead.customer_name}"?`)) {
                                  onDeleteLead(lead.id);
                                }
                              }}
                              className="p-1.5 rounded-lg bg-[#FF0000]/10 text-[#FF0000] hover:bg-[#FF0000]/20 transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- SEPARATE NOTE & SPECIAL INSTRUCTION HISTORY REFERENCE MODAL --- */}
      {historyModalLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-[#BBD5DA] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-[linear-gradient(135deg,#0E2429_0%,#17343B_100%)] text-white flex items-center justify-between border-b border-[#BBD5DA]/20">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#DFF1F1]/20 border border-[#BBD5DA]/30 flex items-center justify-center text-[#DFF1F1]">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white">
                    Notes & Instruction History
                  </h3>
                  <p className="text-xs text-[#BBD5DA] mt-0.5">
                    {historyModalLead.customer_name} &bull; {historyModalLead.district}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setHistoryModalLead(null)}
                className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Note Type Selector Tabs */}
            <div className="p-4 border-b border-[#BBD5DA] bg-[#F5F5F5] flex items-center justify-between gap-2">
              <div className="flex items-center bg-white p-1 rounded-xl border border-[#BBD5DA] text-xs font-semibold w-full">
                <button
                  type="button"
                  onClick={() => setActiveHistoryTab('conversation')}
                  className={`flex-1 py-1.5 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                    activeHistoryTab === 'conversation'
                      ? 'bg-[#FF0000] text-white font-bold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Conversation Notes ({historyModalLead.conversation_notes_history?.length || (historyModalLead.notes ? 1 : 0)})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveHistoryTab('instructions')}
                  className={`flex-1 py-1.5 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                    activeHistoryTab === 'instructions'
                      ? 'bg-[#0E2429] text-white font-bold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Special Instructions ({historyModalLead.special_instructions_history?.length || (historyModalLead.special_instructions ? 1 : 0)})</span>
                </button>
              </div>
            </div>

            {/* Timeline content */}
            <div className="p-4 sm:p-5 max-h-[60vh] overflow-y-auto space-y-3 bg-slate-50/50">
              {activeHistoryTab === 'conversation' ? (
                (historyModalLead.conversation_notes_history && historyModalLead.conversation_notes_history.length > 0) ? (
                  historyModalLead.conversation_notes_history.map((entry, idx) => (
                    <div key={entry.id || idx} className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-1.5 text-xs">
                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <div className="flex items-center gap-1.5 font-bold text-slate-800">
                          <User className="w-3.5 h-3.5 text-blue-600" />
                          <span>{entry.author || historyModalLead.responsible}</span>
                          {entry.lead_status && (
                            <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 font-semibold border border-slate-200 text-[10px]">
                              {entry.lead_status}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 font-mono text-[10px] text-slate-400">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>
                            {formatDateTime(entry.created_at)}
                          </span>
                        </div>
                      </div>
                      <p className="text-slate-800 font-medium whitespace-pre-wrap leading-relaxed">
                        {entry.text}
                      </p>
                    </div>
                  ))
                ) : historyModalLead.notes ? (
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-1.5 text-xs">
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <div className="flex items-center gap-1.5 font-bold text-slate-800">
                        <User className="w-3.5 h-3.5 text-blue-600" />
                        <span>{historyModalLead.responsible}</span>
                      </div>
                      <div className="flex items-center gap-1 font-mono text-[10px] text-slate-400">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{formatDateTime(historyModalLead.created_at)}</span>
                      </div>
                    </div>
                    <p className="text-slate-800 font-medium whitespace-pre-wrap leading-relaxed">
                      {historyModalLead.notes}
                    </p>
                  </div>
                ) : (
                  <p className="text-center py-6 text-xs text-slate-400 italic">No conversation notes found.</p>
                )
              ) : (
                (historyModalLead.special_instructions_history && historyModalLead.special_instructions_history.length > 0) ? (
                  historyModalLead.special_instructions_history.map((entry, idx) => (
                    <div key={entry.id || idx} className="bg-amber-50/70 p-3.5 rounded-xl border border-amber-200 shadow-2xs space-y-1.5 text-xs">
                      <div className="flex items-center justify-between text-[11px] text-amber-900/70">
                        <div className="flex items-center gap-1.5 font-bold text-amber-950">
                          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                          <span>{entry.author || historyModalLead.responsible}</span>
                          {entry.lead_status && (
                            <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 font-semibold border border-amber-300 text-[10px]">
                              {entry.lead_status}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 font-mono text-[10px] text-amber-800/60">
                          <Clock className="w-3 h-3 text-amber-600" />
                          <span>
                            {formatDateTime(entry.created_at)}
                          </span>
                        </div>
                      </div>
                      <p className="text-amber-950 font-medium whitespace-pre-wrap leading-relaxed">
                        {entry.text}
                      </p>
                    </div>
                  ))
                ) : historyModalLead.special_instructions ? (
                  <div className="bg-amber-50/70 p-3.5 rounded-xl border border-amber-200 shadow-2xs space-y-1.5 text-xs">
                    <div className="flex items-center justify-between text-[11px] text-amber-900/70">
                      <div className="flex items-center gap-1.5 font-bold text-amber-950">
                        <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                        <span>{historyModalLead.responsible}</span>
                      </div>
                      <div className="flex items-center gap-1 font-mono text-[10px] text-amber-800/60">
                        <Clock className="w-3 h-3 text-amber-600" />
                        <span>{formatDateTime(historyModalLead.created_at)}</span>
                      </div>
                    </div>
                    <p className="text-amber-950 font-medium whitespace-pre-wrap leading-relaxed">
                      {historyModalLead.special_instructions}
                    </p>
                  </div>
                ) : (
                  <p className="text-center py-6 text-xs text-slate-400 italic">No special instructions found.</p>
                )
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3.5 border-t border-slate-200 bg-white flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  const targetLead = historyModalLead;
                  setHistoryModalLead(null);
                  if (onOpenUpdateLeadModal && targetLead) {
                    onOpenUpdateLeadModal(targetLead);
                  }
                }}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 flex items-center gap-1.5 transition-colors"
              >
                <ClipboardList className="w-3.5 h-3.5" />
                <span>Add New Update Entry</span>
              </button>
              <button
                type="button"
                onClick={() => setHistoryModalLead(null)}
                className="px-4 py-1.5 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
