import React, { useState, useMemo } from 'react';
import { 
  DailyActivityReport, 
  DailyActivityFormData, 
  ActivityType, 
  LeadAssignedType, 
  ActivityStatus, 
  ManagerApprovalStatus, 
  AppUser, 
  Lead 
} from '../types';
import { 
  downloadElementAsPng 
} from '../lib/exportUtils';
import { 
  exportDailyReportsToExcel 
} from '../lib/excel';
import { 
  formatDateTime, 
  formatExactDateLabel, 
  getExactDateKey, 
  isDateOnExactDay, 
  getYearMonthKey, 
  formatMonthYearLabel, 
  isDateInMonth, 
  getWeekRange, 
  isDateInWeek 
} from '../lib/dateUtils';
import { 
  ACTIVITY_TYPES, 
  LEAD_ASSIGNED_TYPES, 
  ACTIVITY_STATUSES, 
  APPROVAL_STATUSES 
} from '../lib/mockData';
import { 
  Calendar, 
  Clock, 
  Download, 
  Filter, 
  Plus, 
  Search, 
  User, 
  Phone, 
  Briefcase, 
  CheckCircle2, 
  AlertCircle, 
  XCircle, 
  ShieldCheck, 
  Building, 
  UserCheck, 
  ChevronRight, 
  ChevronLeft, 
  CalendarDays, 
  Layers, 
  Check, 
  Loader2, 
  Edit3, 
  Trash2, 
  Lock, 
  Sparkles, 
  X, 
  RefreshCw,
  FileSpreadsheet,
  CheckSquare,
  Square,
  ArrowUpDown
} from 'lucide-react';
import { DailyActivityReportModal } from './DailyActivityReportModal';

interface DailyActivityReportModuleProps {
  reports: DailyActivityReport[];
  users: AppUser[];
  leads: Lead[];
  currentUser: AppUser | null;
  onAddReport: (data: DailyActivityFormData) => Promise<boolean | void>;
  onUpdateReport: (id: string, updates: Partial<DailyActivityFormData> & { approved_by?: string; approved_at?: string }) => Promise<boolean | void>;
  onDeleteReport: (id: string) => Promise<boolean | void>;
  onBulkApprove: (ids: string[], approvalStatus: ManagerApprovalStatus) => Promise<boolean | void>;
  onRefresh: () => void;
}

export const DailyActivityReportModule: React.FC<DailyActivityReportModuleProps> = ({
  reports,
  users,
  leads,
  currentUser,
  onAddReport,
  onUpdateReport,
  onDeleteReport,
  onBulkApprove,
  onRefresh,
}) => {
  const isAdmin = currentUser?.role === 'Admin';

  // Filter States
  const [dateFilterMode, setDateFilterMode] = useState<'all' | 'exact' | 'weekly' | 'monthly'>('exact');
  
  // Default to today or most recent active date in dataset
  const todayKey = useMemo(() => getExactDateKey(new Date()) || '2026-08-30', []);
  const [exactDateFilter, setExactDateFilter] = useState<string>(todayKey);
  
  // Weekly filter: 0 = this week, -1 = last week, etc.
  const [weekOffset, setWeekOffset] = useState<number>(0);
  
  // Monthly filter: YYYY-MM
  const currentMonthKey = useMemo(() => getYearMonthKey(new Date()) || '2026-08', []);
  const [monthFilter, setMonthFilter] = useState<string>(currentMonthKey);

  // Other filters
  const [activityFilter, setActivityFilter] = useState<string>('ALL');
  const [leadAssignedFilter, setLeadAssignedFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [approvalFilter, setApprovalFilter] = useState<string>('ALL');
  const [executiveFilter, setExecutiveFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Sorting
  const [sortBy, setSortBy] = useState<'planned_desc' | 'planned_asc' | 'customer_asc' | 'status'>('planned_desc');

  // Multi-select for Admin batch approval
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReport, setEditingReport] = useState<DailyActivityReport | null>(null);

  // PNG Export states
  const [isExportingPng, setIsExportingPng] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [isExportingTablePng, setIsExportingTablePng] = useState(false);
  const [tableExportSuccess, setTableExportSuccess] = useState(false);

  // Current calculated week range
  const currentWeekRange = useMemo(() => {
    return getWeekRange(new Date(), weekOffset);
  }, [weekOffset]);

  // Base accessible reports: Admins see all, non-admins strictly see only their own data
  const accessibleBaseReports = useMemo(() => {
    if (!isAdmin && currentUser) {
      return reports.filter(
        (r) => r.executive_name === currentUser.name || (r.executive_id && r.executive_id === currentUser.id)
      );
    }
    return reports;
  }, [reports, isAdmin, currentUser]);

  // Available unique months from accessible reports
  const availableMonths = useMemo(() => {
    const monthsSet = new Set<string>();
    monthsSet.add(currentMonthKey);
    accessibleBaseReports.forEach((r) => {
      const ym = getYearMonthKey(r.planned_date_time);
      if (ym) monthsSet.add(ym);
    });
    return Array.from(monthsSet).sort().reverse();
  }, [accessibleBaseReports, currentMonthKey]);

  // Filtered reports logic
  const filteredReports = useMemo(() => {
    return accessibleBaseReports.filter((report) => {
      // 1. Date Filtering based on active mode
      if (dateFilterMode === 'exact') {
        if (exactDateFilter && !isDateOnExactDay(report.planned_date_time, exactDateFilter)) {
          return false;
        }
      } else if (dateFilterMode === 'weekly') {
        if (!isDateInWeek(report.planned_date_time, currentWeekRange.startKey, currentWeekRange.endKey)) {
          return false;
        }
      } else if (dateFilterMode === 'monthly') {
        if (monthFilter && monthFilter !== 'ALL' && !isDateInMonth(report.planned_date_time, monthFilter)) {
          return false;
        }
      }

      // 2. Activity Type Filter
      if (activityFilter !== 'ALL' && report.activity !== activityFilter) {
        return false;
      }

      // 3. Lead Assigned Filter (Office / Own)
      if (leadAssignedFilter !== 'ALL' && report.lead_assigned !== leadAssignedFilter) {
        return false;
      }

      // 4. Activity Status Filter (Completed / Pending / Cancelled)
      if (statusFilter !== 'ALL' && report.status !== statusFilter) {
        return false;
      }

      // 5. Manager Approval Status Filter (Approved / Not Approved)
      if (approvalFilter !== 'ALL' && report.manager_approval_status !== approvalFilter) {
        return false;
      }

      // 6. Executive Filter (Only applicable for Admins)
      if (isAdmin && executiveFilter !== 'ALL' && report.executive_name !== executiveFilter) {
        return false;
      }

      // 7. Search Query (Customer, Phone, Remarks, Executive)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = report.customer_name.toLowerCase().includes(q);
        const matchesPhone = report.mobile_number.includes(q);
        const matchesRemarks = report.remarks?.toLowerCase().includes(q) || false;
        const matchesExecutive = report.executive_name.toLowerCase().includes(q);
        if (!matchesName && !matchesPhone && !matchesRemarks && !matchesExecutive) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'planned_desc') {
        return new Date(b.planned_date_time).getTime() - new Date(a.planned_date_time).getTime();
      }
      if (sortBy === 'planned_asc') {
        return new Date(a.planned_date_time).getTime() - new Date(b.planned_date_time).getTime();
      }
      if (sortBy === 'customer_asc') {
        return a.customer_name.localeCompare(b.customer_name);
      }
      if (sortBy === 'status') {
        return a.status.localeCompare(b.status);
      }
      return 0;
    });
  }, [
    accessibleBaseReports,
    dateFilterMode,
    exactDateFilter,
    currentWeekRange,
    monthFilter,
    activityFilter,
    leadAssignedFilter,
    statusFilter,
    approvalFilter,
    executiveFilter,
    isAdmin,
    searchQuery,
    sortBy,
  ]);

  // Summary Metrics for the active filter selection
  const metrics = useMemo(() => {
    const total = filteredReports.length;
    let completed = 0;
    let pending = 0;
    let cancelled = 0;
    let approved = 0;
    let siteSurvey = 0;
    let ksebDoc = 0;
    let coldCalling = 0;
    let officeAssigned = 0;
    let ownAssigned = 0;

    filteredReports.forEach((r) => {
      if (r.status === 'Completed') completed++;
      if (r.status === 'Pending') pending++;
      if (r.status === 'Cancelled') cancelled++;
      if (r.manager_approval_status === 'Approved') approved++;
      if (r.activity === 'Site Survey') siteSurvey++;
      if (r.activity.startsWith('KSEB')) ksebDoc++;
      if (r.activity === 'Cold Calling') coldCalling++;
      if (r.lead_assigned === 'Office') officeAssigned++;
      if (r.lead_assigned === 'Own') ownAssigned++;
    });

    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    const approvalRate = total > 0 ? Math.round((approved / total) * 100) : 0;

    return {
      total,
      completed,
      pending,
      cancelled,
      approved,
      notApproved: total - approved,
      completionRate,
      approvalRate,
      siteSurvey,
      ksebDoc,
      coldCalling,
      officeAssigned,
      ownAssigned,
    };
  }, [filteredReports]);

  // PNG Export Handler
  const handleDownloadPng = async () => {
    if (isExportingPng) return;
    setIsExportingPng(true);
    setExportSuccess(false);

    let dateDesc = 'all_dates';
    if (dateFilterMode === 'exact') {
      dateDesc = `exact_${exactDateFilter || 'today'}`;
    } else if (dateFilterMode === 'weekly') {
      dateDesc = `week_${currentWeekRange.startKey}_to_${currentWeekRange.endKey}`;
    } else if (dateFilterMode === 'monthly') {
      dateDesc = `month_${monthFilter || 'all'}`;
    }

    const filename = `daily_activity_reports_${dateDesc}_${activityFilter !== 'ALL' ? activityFilter.replace(/\s+/g, '_') : 'all_activities'}`;

    const success = await downloadElementAsPng('daily-activity-reports-export-container', filename);
    setIsExportingPng(false);
    if (success) {
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 2500);
    }
  };

  const handleDownloadExcel = () => {
    let dateDesc = 'all_dates';
    if (dateFilterMode === 'exact') {
      dateDesc = `exact_${exactDateFilter || 'today'}`;
    } else if (dateFilterMode === 'weekly') {
      dateDesc = `week_${currentWeekRange.startKey}_to_${currentWeekRange.endKey}`;
    } else if (dateFilterMode === 'monthly') {
      dateDesc = `month_${monthFilter || 'all'}`;
    }

    const filename = `daily_activity_reports_${dateDesc}_${activityFilter !== 'ALL' ? activityFilter.replace(/\s+/g, '_') : 'all_activities'}.xlsx`;
    exportDailyReportsToExcel(filteredReports, filename);
  };

  // Table-Only PNG Export Handler
  const handleDownloadTablePng = async () => {
    if (isExportingTablePng) return;
    setIsExportingTablePng(true);
    setTableExportSuccess(false);

    let dateDesc = 'all_dates';
    if (dateFilterMode === 'exact') {
      dateDesc = `exact_${exactDateFilter || 'today'}`;
    } else if (dateFilterMode === 'weekly') {
      dateDesc = `week_${currentWeekRange.startKey}_to_${currentWeekRange.endKey}`;
    } else if (dateFilterMode === 'monthly') {
      dateDesc = `month_${monthFilter || 'all'}`;
    }

    const filename = `daily_activity_records_table_${dateDesc}_${activityFilter !== 'ALL' ? activityFilter.replace(/\s+/g, '_') : 'all_activities'}`;

    const success = await downloadElementAsPng('daily-activity-table-export', filename);
    setIsExportingTablePng(false);
    if (success) {
      setTableExportSuccess(true);
      setTimeout(() => setTableExportSuccess(false), 2500);
    }
  };

  // Quick Date Helpers
  const handleSetToday = () => {
    setDateFilterMode('exact');
    setExactDateFilter(todayKey);
  };

  const handleSetYesterday = () => {
    setDateFilterMode('exact');
    const d = new Date();
    d.setDate(d.getDate() - 1);
    setExactDateFilter(getExactDateKey(d) || '');
  };

  const handleToggleSelectAll = () => {
    if (selectedIds.length === filteredReports.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredReports.map((r) => r.id));
    }
  };

  const handleToggleSelectRow = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleQuickApprovalToggle = async (report: DailyActivityReport) => {
    if (!isAdmin) return;
    const newStatus: ManagerApprovalStatus =
      report.manager_approval_status === 'Approved' ? 'Not Approved' : 'Approved';
    await onUpdateReport(report.id, {
      manager_approval_status: newStatus,
      approved_by: newStatus === 'Approved' ? `${currentUser?.name || 'Admin'} (Admin)` : undefined,
      approved_at: newStatus === 'Approved' ? new Date().toISOString() : undefined,
    });
  };

  const handleBatchApprove = async (status: ManagerApprovalStatus) => {
    if (!isAdmin || selectedIds.length === 0) return;
    await onBulkApprove(selectedIds, status);
    setSelectedIds([]);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      
      {/* Top Banner & Action Header */}
      <div className="bg-white p-5 rounded-2xl border border-[#BBD5DA] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-[#0E2429] text-white shadow-xs">
              <Briefcase className="w-5 h-5 text-[#FF0000]" />
            </span>
            <div>
              <h1 className="text-lg font-bold text-slate-900 tracking-tight">
                {isAdmin ? 'Daily Activity Reports & Admin Dashboard' : 'My Daily Activity Reports'}
              </h1>
              <p className="text-xs text-slate-500">
                {isAdmin
                  ? 'Track site surveys, KSEB documentation, and cold calling with manager approval controls'
                  : `Showing activity records logged for ${currentUser?.name || 'your account'} (${currentUser?.role || 'Executive'})`}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center flex-wrap gap-2.5">
          {/* Refresh button */}
          <button
            type="button"
            onClick={onRefresh}
            className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-all cursor-pointer shadow-2xs"
            title="Refresh reports"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {/* Download Excel Button */}
          <button
            type="button"
            onClick={handleDownloadExcel}
            className="px-3.5 py-2 rounded-xl text-xs font-bold border border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 hover:border-emerald-300 transition-all flex items-center gap-2 cursor-pointer shadow-xs"
            title="Export reports to Excel spreadsheet"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export to Excel</span>
          </button>

          {/* Download PNG Button */}
          <button
            type="button"
            data-export-ignore="false"
            onClick={handleDownloadPng}
            disabled={isExportingPng}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-2 cursor-pointer shadow-xs ${
              exportSuccess
                ? 'bg-emerald-600 text-white border-emerald-700'
                : 'bg-white text-slate-800 border-slate-300 hover:bg-slate-50 hover:border-slate-400'
            }`}
            title="Download report results and table as high-resolution PNG image"
          >
            {isExportingPng ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                <span>Generating PNG...</span>
              </>
            ) : exportSuccess ? (
              <>
                <Check className="w-4 h-4" />
                <span>Exported PNG!</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4 text-blue-600" />
                <span>Download Result as PNG</span>
              </>
            )}
          </button>

          {/* Log New Activity Button */}
          <button
            type="button"
            onClick={() => {
              setEditingReport(null);
              setIsModalOpen(true);
            }}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-[#0E2429] hover:bg-[#1a3f47] text-white shadow-xs hover:shadow transition-all flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#FF0000]" />
            <span>+ Log Activity Report</span>
          </button>
        </div>
      </div>

      {/* Main Export Container (Encapsulates KPI Cards, Filters Status & Table) */}
      <div id="daily-activity-reports-export-container" className="space-y-6 bg-transparent">
        
        {/* KPI Metrics Dashboard Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          
          {/* Total Filtered Activities */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Tasks</span>
              <Layers className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-2xl font-black text-slate-900">{metrics.total}</div>
            <div className="text-[10px] text-slate-500">
              {metrics.officeAssigned} Office • {metrics.ownAssigned} Own
            </div>
          </div>

          {/* Completed */}
          <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-2xs space-y-1 bg-emerald-50/20">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">Completed</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-emerald-700">{metrics.completed}</div>
            <div className="text-[10px] text-emerald-800 font-semibold">
              {metrics.completionRate}% Completion Rate
            </div>
          </div>

          {/* Pending */}
          <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-2xs space-y-1 bg-amber-50/20">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">Pending</span>
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-black text-amber-700">{metrics.pending}</div>
            <div className="text-[10px] text-amber-800">
              Awaiting execution
            </div>
          </div>

          {/* Cancelled */}
          <div className="bg-white p-4 rounded-xl border border-rose-200 shadow-2xs space-y-1 bg-rose-50/20">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-rose-800 uppercase tracking-wider">Cancelled</span>
              <XCircle className="w-4 h-4 text-rose-600" />
            </div>
            <div className="text-2xl font-black text-rose-700">{metrics.cancelled}</div>
            <div className="text-[10px] text-rose-700">
              Rescheduled or lost
            </div>
          </div>

          {/* Manager Approved */}
          <div className="bg-white p-4 rounded-xl border border-indigo-200 shadow-2xs space-y-1 bg-indigo-50/20">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-indigo-900 uppercase tracking-wider">Manager Approved</span>
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="text-2xl font-black text-indigo-700">{metrics.approved}</div>
            <div className="text-[10px] text-indigo-800 font-semibold">
              {metrics.approvalRate}% Approval Rate
            </div>
          </div>

          {/* Activity Breakdown */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Activity Split</span>
            <div className="space-y-1 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-600 text-[11px]">Site Surveys:</span>
                <span className="font-bold text-blue-700">{metrics.siteSurvey}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600 text-[11px]">KSEB Tasks:</span>
                <span className="font-bold text-purple-700">{metrics.ksebDoc}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600 text-[11px]">Cold Calls:</span>
                <span className="font-bold text-teal-700">{metrics.coldCalling}</span>
              </div>
            </div>
          </div>

        </div>

        {/* Filter Control Bar (Exact Date, Weekly, Monthly, Activity, Assigned, Executive) */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#BBD5DA] shadow-xs space-y-4">
          
          {/* Row 1: Primary Date Filter Modes (Exact Date, Weekly, Monthly, All) */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            
            {/* Date Mode Buttons */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-100/90 rounded-xl border border-slate-200 self-start">
              
              {/* Exact Date Tab */}
              <button
                type="button"
                onClick={() => setDateFilterMode('exact')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  dateFilterMode === 'exact'
                    ? 'bg-white text-blue-900 shadow-xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                <span>Exact Date</span>
              </button>

              {/* Weekly Filter Tab */}
              <button
                type="button"
                onClick={() => setDateFilterMode('weekly')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  dateFilterMode === 'weekly'
                    ? 'bg-white text-indigo-900 shadow-xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <CalendarDays className="w-3.5 h-3.5 text-indigo-600" />
                <span>Weekly Filter</span>
              </button>

              {/* Monthly Filter Tab */}
              <button
                type="button"
                onClick={() => setDateFilterMode('monthly')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  dateFilterMode === 'monthly'
                    ? 'bg-white text-purple-900 shadow-xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Clock className="w-3.5 h-3.5 text-purple-600" />
                <span>Monthly Filter</span>
              </button>

              {/* All Dates Tab */}
              <button
                type="button"
                onClick={() => setDateFilterMode('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  dateFilterMode === 'all'
                    ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-slate-500" />
                <span>All Dates</span>
              </button>
            </div>

            {/* Date Mode Active Controller */}
            <div className="flex items-center flex-wrap gap-2">
              
              {/* Exact Date Picker Controls */}
              {dateFilterMode === 'exact' && (
                <div className="flex items-center flex-wrap gap-2 animate-in fade-in duration-150">
                  <div className="flex items-center gap-1.5 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-lg text-xs shadow-2xs">
                    <Calendar className="w-3.5 h-3.5 text-blue-600" />
                    <span className="font-semibold text-blue-900">Select Date:</span>
                    <input
                      type="date"
                      value={exactDateFilter}
                      onChange={(e) => setExactDateFilter(e.target.value)}
                      className="bg-white border border-blue-200 rounded px-1.5 py-0.5 text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleSetToday}
                    className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                      exactDateFilter === todayKey
                        ? 'bg-blue-600 text-white border-blue-700'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Today
                  </button>

                  <button
                    type="button"
                    onClick={handleSetYesterday}
                    className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 transition-all cursor-pointer"
                  >
                    Yesterday
                  </button>
                </div>
              )}

              {/* Weekly Range Selector Controls */}
              {dateFilterMode === 'weekly' && (
                <div className="flex items-center flex-wrap gap-2 animate-in fade-in duration-150">
                  <button
                    type="button"
                    onClick={() => setWeekOffset((prev) => prev - 1)}
                    className="p-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 cursor-pointer shadow-2xs"
                    title="Previous Week"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <div className="px-3 py-1 bg-indigo-50 border border-indigo-200 rounded-lg text-xs font-bold text-indigo-950 flex items-center gap-1.5 shadow-2xs">
                    <CalendarDays className="w-3.5 h-3.5 text-indigo-600" />
                    <span>{currentWeekRange.label}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setWeekOffset((prev) => prev + 1)}
                    className="p-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 cursor-pointer shadow-2xs"
                    title="Next Week"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>

                  {weekOffset !== 0 && (
                    <button
                      type="button"
                      onClick={() => setWeekOffset(0)}
                      className="px-2.5 py-1 text-xs font-bold rounded-lg border border-indigo-200 bg-indigo-100 text-indigo-900 hover:bg-indigo-200 cursor-pointer"
                    >
                      Reset to This Week
                    </button>
                  )}
                </div>
              )}

              {/* Monthly Dropdown Picker Controls */}
              {dateFilterMode === 'monthly' && (
                <div className="flex items-center gap-2 animate-in fade-in duration-150">
                  <div className="flex items-center gap-1.5 bg-purple-50 border border-purple-200 px-2.5 py-1 rounded-lg text-xs shadow-2xs">
                    <Clock className="w-3.5 h-3.5 text-purple-600" />
                    <span className="font-semibold text-purple-900">Select Month:</span>
                    <select
                      value={monthFilter}
                      onChange={(e) => setMonthFilter(e.target.value)}
                      className="bg-white border border-purple-200 rounded px-2 py-0.5 text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
                    >
                      <option value="ALL">All Months ({reports.length} Reports)</option>
                      {availableMonths.map((m) => (
                        <option key={m} value={m}>
                          {formatMonthYearLabel(m)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Result Count Badge */}
              <span className="text-xs font-bold text-slate-700 px-2.5 py-1 rounded-lg bg-[#DFF1F1] border border-[#BBD5DA]">
                {filteredReports.length} Activities Found
              </span>

            </div>

          </div>

          {/* Row 2: Secondary Dropdown Filters (Activity, Status, Lead Assigned, Approval, Executive, Search) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5 text-xs">
            
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search customer, phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Activity Type Filter */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1">
              <span className="text-[11px] font-semibold text-slate-500 whitespace-nowrap">Activity:</span>
              <select
                value={activityFilter}
                onChange={(e) => setActivityFilter(e.target.value)}
                className="w-full bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Activities</option>
                {ACTIVITY_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1">
              <span className="text-[11px] font-semibold text-slate-500 whitespace-nowrap">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Statuses</option>
                {ACTIVITY_STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* Lead Assigned (Office / Own) Filter */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1">
              <span className="text-[11px] font-semibold text-slate-500 whitespace-nowrap">Assigned:</span>
              <select
                value={leadAssignedFilter}
                onChange={(e) => setLeadAssignedFilter(e.target.value)}
                className="w-full bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Assigned</option>
                {LEAD_ASSIGNED_TYPES.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>

            {/* Manager Approval Filter */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1">
              <span className="text-[11px] font-semibold text-slate-500 whitespace-nowrap">Approval:</span>
              <select
                value={approvalFilter}
                onChange={(e) => setApprovalFilter(e.target.value)}
                className="w-full bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Approvals</option>
                {APPROVAL_STATUSES.map((app) => (
                  <option key={app} value={app}>{app}</option>
                ))}
              </select>
            </div>

            {/* Executive Filter: Selectable for Admin, Locked to Current User for Non-Admin */}
            {isAdmin ? (
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1">
                <span className="text-[11px] font-semibold text-slate-500 whitespace-nowrap">Executive:</span>
                <select
                  value={executiveFilter}
                  onChange={(e) => setExecutiveFilter(e.target.value)}
                  className="w-full bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer truncate"
                >
                  <option value="ALL">All Executives</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.name}>{u.name}</option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 bg-blue-50/70 border border-blue-200 rounded-lg px-2.5 py-1 text-xs" title="You are viewing your own logged activities">
                <User className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                <span className="text-[11px] font-semibold text-blue-800 whitespace-nowrap">Executive:</span>
                <span className="font-bold text-blue-950 truncate">{currentUser?.name || 'Self'}</span>
                <Lock className="w-3 h-3 text-blue-500 ml-auto shrink-0" />
              </div>
            )}

          </div>

          {/* Active Filter Criteria Bar & Clear Filters */}
          {(activityFilter !== 'ALL' || leadAssignedFilter !== 'ALL' || statusFilter !== 'ALL' || approvalFilter !== 'ALL' || (isAdmin && executiveFilter !== 'ALL') || searchQuery) && (
            <div className="flex items-center gap-2 pt-1 flex-wrap text-xs">
              <span className="text-[11px] font-semibold text-slate-500">Active Criteria:</span>
              {activityFilter !== 'ALL' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 text-blue-800 font-semibold border border-blue-200">
                  Activity: {activityFilter}
                  <button type="button" onClick={() => setActivityFilter('ALL')} className="hover:text-blue-950 ml-1">×</button>
                </span>
              )}
              {leadAssignedFilter !== 'ALL' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-purple-50 text-purple-800 font-semibold border border-purple-200">
                  Assigned: {leadAssignedFilter}
                  <button type="button" onClick={() => setLeadAssignedFilter('ALL')} className="hover:text-purple-950 ml-1">×</button>
                </span>
              )}
              {statusFilter !== 'ALL' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-50 text-amber-800 font-semibold border border-amber-200">
                  Status: {statusFilter}
                  <button type="button" onClick={() => setStatusFilter('ALL')} className="hover:text-amber-950 ml-1">×</button>
                </span>
              )}
              {approvalFilter !== 'ALL' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-50 text-indigo-800 font-semibold border border-indigo-200">
                  Approval: {approvalFilter}
                  <button type="button" onClick={() => setApprovalFilter('ALL')} className="hover:text-indigo-950 ml-1">×</button>
                </span>
              )}
              {isAdmin && executiveFilter !== 'ALL' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-teal-50 text-teal-800 font-semibold border border-teal-200">
                  Executive: {executiveFilter}
                  <button type="button" onClick={() => setExecutiveFilter('ALL')} className="hover:text-teal-950 ml-1">×</button>
                </span>
              )}
              {searchQuery && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-semibold border border-slate-300">
                  Search: "{searchQuery}"
                  <button type="button" onClick={() => setSearchQuery('')} className="hover:text-slate-950 ml-1">×</button>
                </span>
              )}
              <button
                type="button"
                onClick={() => {
                  setActivityFilter('ALL');
                  setLeadAssignedFilter('ALL');
                  setStatusFilter('ALL');
                  setApprovalFilter('ALL');
                  setExecutiveFilter('ALL');
                  setSearchQuery('');
                }}
                className="text-[11px] font-bold text-red-600 hover:text-red-800 hover:underline ml-1 cursor-pointer"
              >
                Reset All Filters
              </button>
            </div>
          )}

        </div>

        {/* Batch Actions Bar for Admin (when rows are selected) */}
        {isAdmin && selectedIds.length > 0 && (
          <div className="bg-indigo-900 text-white px-5 py-3 rounded-xl flex items-center justify-between shadow-md animate-in fade-in duration-150">
            <div className="flex items-center gap-3 text-xs font-bold">
              <CheckSquare className="w-4 h-4 text-emerald-400" />
              <span>{selectedIds.length} activity reports selected</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleBatchApprove('Approved')}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Batch Approve</span>
              </button>
              <button
                type="button"
                onClick={() => handleBatchApprove('Not Approved')}
                className="px-3 py-1.5 bg-rose-700 hover:bg-rose-600 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Mark Not Approved</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedIds([])}
                className="px-2.5 py-1.5 text-slate-300 hover:text-white text-xs font-medium cursor-pointer"
              >
                Deselect All
              </button>
            </div>
          </div>
        )}

        {/* Admin Dashboard: Daily Activity Reports Table View */}
        <div id="daily-activity-table-export" className="bg-white rounded-2xl border border-[#BBD5DA] shadow-xs overflow-hidden">
          
          {/* Table Header Bar */}
          <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-[#0E2429]" />
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Daily Activity Records ({filteredReports.length})
              </h2>
              {dateFilterMode === 'exact' && (
                <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  {formatExactDateLabel(exactDateFilter)}
                </span>
              )}
              {dateFilterMode === 'weekly' && (
                <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                  {currentWeekRange.label}
                </span>
              )}
              {dateFilterMode === 'monthly' && (
                <span className="text-[11px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                  {formatMonthYearLabel(monthFilter)}
                </span>
              )}
            </div>

            {/* Table Header Bar Right: Download Table PNG & Sort */}
            <div className="flex items-center flex-wrap gap-2">
              <button
                type="button"
                onClick={handleDownloadExcel}
                className="px-3 py-1.5 rounded-lg text-xs font-bold border border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 hover:border-emerald-300 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                title="Export this Daily Activity Records Table to Excel"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Export to Excel</span>
              </button>
              <button
                type="button"
                data-export-ignore="true"
                onClick={handleDownloadTablePng}
                disabled={isExportingTablePng}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                  tableExportSuccess
                    ? 'bg-emerald-600 text-white border-emerald-700'
                    : 'bg-white text-blue-900 border-blue-200 hover:bg-blue-50'
                }`}
                title="Download this Daily Activity Records Table as PNG"
              >
                {isExportingTablePng ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                    <span>Saving Table PNG...</span>
                  </>
                ) : tableExportSuccess ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-white" />
                    <span>Table PNG Saved!</span>
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5 text-blue-600" />
                    <span>Download Table as PNG</span>
                  </>
                )}
              </button>

              {/* Sort Controller */}
              <div className="flex items-center gap-1.5 text-xs text-slate-600" data-export-ignore="true">
                <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-semibold text-[11px]">Sort By:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-white border border-slate-200 rounded px-2 py-1 text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
                >
                  <option value="planned_desc">Planned Date (Newest First)</option>
                  <option value="planned_asc">Planned Date (Oldest First)</option>
                  <option value="customer_asc">Customer Name (A-Z)</option>
                  <option value="status">Activity Status</option>
                </select>
              </div>
            </div>
          </div>

          {/* Table Element */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[950px]">
              <thead>
                <tr className="bg-slate-100/80 text-[11px] font-bold text-slate-700 uppercase tracking-wider border-b border-slate-200">
                  {isAdmin && (
                    <th className="py-3 px-3 w-10 text-center">
                      <button
                        type="button"
                        onClick={handleToggleSelectAll}
                        className="text-slate-600 hover:text-slate-900 cursor-pointer"
                        title="Select All"
                      >
                        {selectedIds.length > 0 && selectedIds.length === filteredReports.length ? (
                          <CheckSquare className="w-4 h-4 text-indigo-600" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-400" />
                        )}
                      </button>
                    </th>
                  )}
                  <th className="py-3 px-3.5">Planned Date & Time</th>
                  <th className="py-3 px-3.5">Activity</th>
                  <th className="py-3 px-3.5">Customer Name & Phone</th>
                  <th className="py-3 px-3">Lead Assigned</th>
                  <th className="py-3 px-3.5">Executive</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3.5">Completed Date & Time</th>
                  <th className="py-3 px-3.5">Manager Approval Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredReports.length === 0 ? (
                  <tr>
                    <td colSpan={isAdmin ? 9 : 8} className="py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Briefcase className="w-8 h-8 text-slate-300 stroke-[1.5]" />
                        <div className="font-bold text-sm text-slate-700">No activity reports match active criteria</div>
                        <p className="text-xs text-slate-400 max-w-sm">
                          Try switching to "All Dates", choosing another week/month, or adjusting the filter criteria above.
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setDateFilterMode('all');
                            setActivityFilter('ALL');
                            setLeadAssignedFilter('ALL');
                            setStatusFilter('ALL');
                            setApprovalFilter('ALL');
                            setExecutiveFilter('ALL');
                            setSearchQuery('');
                          }}
                          className="mt-2 px-3 py-1.5 bg-[#0E2429] text-white font-bold rounded-lg text-xs cursor-pointer shadow-xs hover:bg-[#1a3f47]"
                        >
                          View All Activity Reports
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredReports.map((report) => {
                    const isSelected = selectedIds.includes(report.id);
                    
                    // Badge styles for Activity
                    let activityBadgeStyle = 'bg-blue-50 text-blue-800 border-blue-200';
                    if (report.activity.startsWith('KSEB')) {
                      activityBadgeStyle = 'bg-purple-50 text-purple-800 border-purple-200';
                    } else if (report.activity === 'Cold Calling') {
                      activityBadgeStyle = 'bg-teal-50 text-teal-800 border-teal-200';
                    } else if (report.activity === 'Other') {
                      activityBadgeStyle = 'bg-slate-100 text-slate-700 border-slate-300';
                    }

                    // Badge styles for Status
                    let statusBadgeStyle = 'bg-amber-50 text-amber-800 border-amber-200';
                    if (report.status === 'Completed') {
                      statusBadgeStyle = 'bg-emerald-50 text-emerald-800 border-emerald-200';
                    } else if (report.status === 'Cancelled') {
                      statusBadgeStyle = 'bg-rose-50 text-rose-800 border-rose-200';
                    } else if (report.status === 'Planned') {
                      statusBadgeStyle = 'bg-sky-50 text-sky-800 border-sky-200';
                    } else if (report.status === 'Started') {
                      statusBadgeStyle = 'bg-indigo-50 text-indigo-800 border-indigo-200';
                    }

                    return (
                      <tr
                        key={report.id}
                        onDoubleClick={() => {
                          setEditingReport(report);
                          setIsModalOpen(true);
                        }}
                        className={`hover:bg-slate-50/80 transition-colors ${
                          isSelected ? 'bg-indigo-50/40' : ''
                        }`}
                        title="Double-click row to edit activity details"
                      >
                        {/* Checkbox for Admin */}
                        {isAdmin && (
                          <td className="py-3 px-3 text-center">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleSelectRow(report.id);
                              }}
                              className="text-slate-600 hover:text-indigo-600 cursor-pointer"
                            >
                              {isSelected ? (
                                <CheckSquare className="w-4 h-4 text-indigo-600" />
                              ) : (
                                <Square className="w-4 h-4 text-slate-300" />
                              )}
                            </button>
                          </td>
                        )}

                        {/* 1. Planned Date & Time */}
                        <td className="py-3 px-3.5 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 font-bold text-slate-900">
                            <Calendar className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                            <span>{formatDateTime(report.planned_date_time)}</span>
                          </div>
                          {report.remarks && (
                            <p className="text-[11px] text-slate-500 max-w-[200px] truncate mt-0.5" title={report.remarks}>
                              {report.remarks}
                            </p>
                          )}
                        </td>

                        {/* 2. Activity */}
                        <td className="py-3 px-3.5 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${activityBadgeStyle}`}>
                            <Briefcase className="w-3 h-3 shrink-0" />
                            <span>{report.activity}</span>
                          </span>
                        </td>

                        {/* 3. Customer Name & Mobile */}
                        <td className="py-3 px-3.5">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingReport(report);
                              setIsModalOpen(true);
                            }}
                            className="font-bold text-slate-900 leading-tight hover:text-blue-700 hover:underline text-left cursor-pointer transition-colors"
                            title="Click to edit activity details"
                          >
                            {report.customer_name}
                          </button>
                          <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
                            <Phone className="w-3 h-3 text-emerald-600 shrink-0" />
                            <a 
                              href={`tel:${report.mobile_number}`}
                              onClick={(e) => e.stopPropagation()}
                              className="hover:text-emerald-700 hover:underline font-medium"
                            >
                              {report.mobile_number}
                            </a>
                          </div>
                        </td>

                        {/* 4. Lead Assigned: Office / Own */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold border ${
                              report.lead_assigned === 'Office'
                                ? 'bg-purple-50 text-purple-900 border-purple-200'
                                : 'bg-teal-50 text-teal-900 border-teal-200'
                            }`}
                          >
                            {report.lead_assigned === 'Office' ? (
                              <Building className="w-3 h-3 text-purple-600 shrink-0" />
                            ) : (
                              <UserCheck className="w-3 h-3 text-teal-600 shrink-0" />
                            )}
                            <span>{report.lead_assigned}</span>
                          </span>
                        </td>

                        {/* 5. Responsible Executive */}
                        <td className="py-3 px-3.5 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                            <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{report.executive_name}</span>
                          </div>
                        </td>

                        {/* 6. Status */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          <div className="flex flex-col gap-1.5 items-start">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border ${statusBadgeStyle}`}>
                              {report.status === 'Completed' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                              {report.status === 'Pending' && <Clock className="w-3.5 h-3.5 text-amber-600" />}
                              {report.status === 'Cancelled' && <XCircle className="w-3.5 h-3.5 text-rose-600" />}
                              <span>{report.status}</span>
                            </span>
                            {report.advance_payment_status && (
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border ${
                                report.advance_payment_status === 'Collected' 
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                  : 'bg-slate-100 text-slate-600 border-slate-200'
                              }`}>
                                {report.advance_payment_status === 'Collected' ? '₹ Collected' : '₹ Not Paid'}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* 7. Completed Date & Time */}
                        <td className="py-3 px-3.5 whitespace-nowrap">
                          {report.completed_date_time ? (
                            <div className="flex items-center gap-1.5 font-semibold text-emerald-950">
                              <Clock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span>{formatDateTime(report.completed_date_time)}</span>
                            </div>
                          ) : (
                            <span className="text-slate-400 font-mono text-[11px]">-</span>
                          )}
                        </td>

                        {/* 8. Manager Approval Status (Edit access only for admin) */}
                        <td className="py-3 px-3.5 whitespace-nowrap">
                          {isAdmin ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleQuickApprovalToggle(report);
                              }}
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer shadow-2xs hover:scale-105 ${
                                report.manager_approval_status === 'Approved'
                                  ? 'bg-emerald-600 text-white border-emerald-700 hover:bg-emerald-700'
                                  : 'bg-rose-50 text-rose-800 border-rose-300 hover:bg-rose-100'
                              }`}
                              title="Click to toggle manager approval status (Admin Only)"
                            >
                              {report.manager_approval_status === 'Approved' ? (
                                <>
                                  <ShieldCheck className="w-3.5 h-3.5" />
                                  <span>Approved</span>
                                </>
                              ) : (
                                <>
                                  <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                                  <span>Not Approved</span>
                                </>
                              )}
                            </button>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border ${
                                  report.manager_approval_status === 'Approved'
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                    : 'bg-rose-50 text-rose-800 border-rose-200'
                                }`}
                              >
                                {report.manager_approval_status === 'Approved' ? (
                                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                                ) : (
                                  <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                                )}
                                <span>{report.manager_approval_status}</span>
                              </span>
                              <span title="Manager approval can only be edited by Admin">
                                <Lock className="w-3 h-3 text-slate-400" />
                              </span>
                            </div>
                          )}

                          {report.approved_by && report.manager_approval_status === 'Approved' && (
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              by {report.approved_by}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer */}
          <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-500 gap-2">
            <div>
              Showing <span className="font-bold text-slate-800">{filteredReports.length}</span> of{' '}
              <span className="font-bold text-slate-800">{reports.length}</span> total activity reports
            </div>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 font-semibold text-emerald-700">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                {metrics.completed} Completed
              </span>
              <span className="flex items-center gap-1 font-semibold text-indigo-700">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                {metrics.approved} Approved
              </span>
            </div>
          </div>

        </div>

      </div>

      {/* Modal for Create / Edit Activity Report */}
      <DailyActivityReportModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingReport(null);
        }}
        onSave={async (data) => {
          if (editingReport) {
            await onUpdateReport(editingReport.id, data);
          } else {
            await onAddReport(data);
          }
        }}
        onDelete={onDeleteReport}
        editingReport={editingReport}
        currentUser={currentUser}
        users={users}
        leads={leads}
      />

    </div>
  );
};
