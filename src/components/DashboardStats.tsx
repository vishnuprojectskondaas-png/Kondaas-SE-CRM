import React, { useState, useMemo } from 'react';
import { 
  Users, 
  TrendingUp, 
  Calendar, 
  IndianRupee, 
  Sun, 
  Home, 
  Compass, 
  User, 
  Shield, 
  Headphones, 
  Briefcase, 
  Award, 
  CalendarRange,
  Layers,
  ArrowUpRight,
  Clock,
  Filter,
  X,
  RotateCcw,
  Download,
  Check,
  Loader2
} from 'lucide-react';
import { Lead, LeadStatus, AppUser, UserRole } from '../types';
import { parseKsebBill } from '../lib/billUtils';
import { 
  getYearMonthKey, 
  formatMonthYearLabel, 
  isDateInMonth, 
  isDateOnExactDay, 
  formatExactDateLabel 
} from '../lib/dateUtils';
import { downloadElementAsPng } from '../lib/exportUtils';
import { DashboardFilters } from './DashboardFilters';
import { OverallMonthlyPipelineMetrics } from './OverallMonthlyPipelineMetrics';

interface DashboardStatsProps {
  leads: Lead[];
  users?: AppUser[];
  currentUser?: AppUser | null;
  
  // 1. Responsible Filter
  selectedUserFilter?: string;
  onSelectUserFilter?: (userName: string) => void;
  
  // 2. Lead Created On Filter (Monthly & Exact Date)
  selectedCreatedMonthFilter?: string;
  onSelectCreatedMonthFilter?: (month: string) => void;
  selectedCreatedExactDateFilter?: string;
  onSelectCreatedExactDateFilter?: (date: string) => void;
  
  // 3. Lead Modified On Filter (Monthly & Exact Date)
  selectedModifiedMonthFilter?: string;
  onSelectModifiedMonthFilter?: (month: string) => void;
  selectedModifiedExactDateFilter?: string;
  onSelectModifiedExactDateFilter?: (date: string) => void;
  
  // Backward compatibility alias for month filter
  selectedMonthFilter?: string;
  onSelectMonthFilter?: (month: string) => void;
  
  onSelectStatusFilter: (
    status: string, 
    createdMonth?: string, 
    modifiedMonth?: string,
    createdExactDate?: string,
    modifiedExactDate?: string,
    repName?: string
  ) => void;
  onSelectFollowUpFilter: (filter: 'OVERDUE' | 'TODAY' | 'ALL') => void;
  onSelectSiteVisitFilter?: (filter: 'YES' | 'NO' | 'ALL', createdMonth?: string) => void;
  onSelectLoanFilter?: (filter: 'YES' | 'NO' | 'ALL', createdMonth?: string) => void;
  onSelectModifiedFilter?: (
    modifiedMonth?: string, 
    createdMonth?: string,
    modifiedExactDate?: string,
    createdExactDate?: string,
    repName?: string
  ) => void;
  onViewAllLeadsForUser?: (
    userName: string, 
    createdMonth?: string, 
    modifiedMonth?: string,
    createdExactDate?: string,
    modifiedExactDate?: string
  ) => void;
  onNavigateToUsers?: () => void;
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({
  leads,
  users = [],
  currentUser,
  selectedUserFilter = 'ALL',
  onSelectUserFilter,
  selectedCreatedMonthFilter,
  onSelectCreatedMonthFilter,
  selectedCreatedExactDateFilter,
  onSelectCreatedExactDateFilter,
  selectedModifiedMonthFilter,
  onSelectModifiedMonthFilter,
  selectedModifiedExactDateFilter,
  onSelectModifiedExactDateFilter,
  selectedMonthFilter = 'ALL',
  onSelectMonthFilter,
  onSelectStatusFilter,
  onSelectFollowUpFilter,
  onSelectSiteVisitFilter,
  onSelectLoanFilter,
  onSelectModifiedFilter,
  onViewAllLeadsForUser,
  onNavigateToUsers,
}) => {
  // Internal filter state fallbacks
  const [internalUserFilter, setInternalUserFilter] = useState<string>(selectedUserFilter);
  const [internalCreatedMonth, setInternalCreatedMonth] = useState<string>(
    selectedCreatedMonthFilter || selectedMonthFilter || 'ALL'
  );
  const [internalCreatedExactDate, setInternalCreatedExactDate] = useState<string>(
    selectedCreatedExactDateFilter || ''
  );
  const [internalModifiedMonth, setInternalModifiedMonth] = useState<string>(
    selectedModifiedMonthFilter || 'ALL'
  );
  const [internalModifiedExactDate, setInternalModifiedExactDate] = useState<string>(
    selectedModifiedExactDateFilter || ''
  );

  const [showTeamLeaderboard, setShowTeamLeaderboard] = useState<boolean>(false);
  const [showMonthlyBreakdown, setShowMonthlyBreakdown] = useState<boolean>(true);

  // PNG Export states
  const [isExportingMonthlyTable, setIsExportingMonthlyTable] = useState(false);
  const [exportSuccessMonthlyTable, setExportSuccessMonthlyTable] = useState(false);

  const [isExportingRepTable, setIsExportingRepTable] = useState(false);
  const [exportSuccessRepTable, setExportSuccessRepTable] = useState(false);

  const [isExportingStageDistribution, setIsExportingStageDistribution] = useState(false);
  const [exportSuccessStageDistribution, setExportSuccessStageDistribution] = useState(false);

  const handleDownloadMonthlyTablePng = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isExportingMonthlyTable) return;
    setIsExportingMonthlyTable(true);
    setExportSuccessMonthlyTable(false);

    const filename = `overall_monthly_pipeline_metric_comparison_table_${activeCreatedMonth !== 'ALL' ? `created_${activeCreatedMonth}` : ''}`;
    const success = await downloadElementAsPng('overall-monthly-pipeline-comparison-table-container', filename);

    setIsExportingMonthlyTable(false);
    if (success) {
      setExportSuccessMonthlyTable(true);
      setTimeout(() => setExportSuccessMonthlyTable(false), 2500);
    }
  };

  const handleDownloadRepTablePng = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isExportingRepTable) return;
    setIsExportingRepTable(true);
    setExportSuccessRepTable(false);

    const filename = `representative_performance_table_${activeModifiedMonth !== 'ALL' ? `modified_${activeModifiedMonth}` : ''}${activeModifiedExactDate ? `_${activeModifiedExactDate}` : ''}`;
    const success = await downloadElementAsPng('representative-performance-table-container', filename);

    setIsExportingRepTable(false);
    if (success) {
      setExportSuccessRepTable(true);
      setTimeout(() => setExportSuccessRepTable(false), 2500);
    }
  };

  const handleDownloadStageDistributionPng = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isExportingStageDistribution) return;
    setIsExportingStageDistribution(true);
    setExportSuccessStageDistribution(false);

    const filename = `pipeline_stage_distribution_${activeUserFilter !== 'ALL' ? `responsible_${activeUserFilter}` : 'all_responsible'}${activeCreatedMonth !== 'ALL' ? `_created_${activeCreatedMonth}` : ''}${activeModifiedMonth !== 'ALL' ? `_modified_${activeModifiedMonth}` : ''}`;
    const success = await downloadElementAsPng('pipeline-stage-distribution-container', filename);

    setIsExportingStageDistribution(false);
    if (success) {
      setExportSuccessStageDistribution(true);
      setTimeout(() => setExportSuccessStageDistribution(false), 2500);
    }
  };

  // Active filter values
  const activeUserFilter = onSelectUserFilter ? selectedUserFilter : internalUserFilter;
  
  const activeCreatedMonth = onSelectCreatedMonthFilter 
    ? (selectedCreatedMonthFilter || 'ALL') 
    : (onSelectMonthFilter ? selectedMonthFilter : internalCreatedMonth);
    
  const activeCreatedExactDate = onSelectCreatedExactDateFilter
    ? (selectedCreatedExactDateFilter || '')
    : internalCreatedExactDate;

  const activeModifiedMonth = onSelectModifiedMonthFilter 
    ? (selectedModifiedMonthFilter || 'ALL') 
    : internalModifiedMonth;

  const activeModifiedExactDate = onSelectModifiedExactDateFilter
    ? (selectedModifiedExactDateFilter || '')
    : internalModifiedExactDate;

  // 1. Responsible change handler
  const handleUserChange = (userVal: string) => {
    if (onSelectUserFilter) {
      onSelectUserFilter(userVal);
    } else {
      setInternalUserFilter(userVal);
    }
  };

  // 2. Lead Created On change handlers (Monthly & Exact Date)
  const handleCreatedMonthChange = (monthVal: string) => {
    if (onSelectCreatedMonthFilter) {
      onSelectCreatedMonthFilter(monthVal);
    } else if (onSelectMonthFilter) {
      onSelectMonthFilter(monthVal);
    } else {
      setInternalCreatedMonth(monthVal);
    }
    // Clear exact date when monthly is chosen
    if (monthVal !== 'ALL') {
      if (onSelectCreatedExactDateFilter) onSelectCreatedExactDateFilter('');
      else setInternalCreatedExactDate('');
    }
  };

  const handleCreatedExactDateChange = (dateVal: string) => {
    if (onSelectCreatedExactDateFilter) {
      onSelectCreatedExactDateFilter(dateVal);
    } else {
      setInternalCreatedExactDate(dateVal);
    }
    // Clear monthly filter when exact date is chosen
    if (dateVal) {
      if (onSelectCreatedMonthFilter) onSelectCreatedMonthFilter('ALL');
      else if (onSelectMonthFilter) onSelectMonthFilter('ALL');
      else setInternalCreatedMonth('ALL');
    }
  };

  // 3. Lead Modified On change handlers (Monthly & Exact Date)
  const handleModifiedMonthChange = (monthVal: string) => {
    if (onSelectModifiedMonthFilter) {
      onSelectModifiedMonthFilter(monthVal);
    } else {
      setInternalModifiedMonth(monthVal);
    }
    // Clear exact date when monthly is chosen
    if (monthVal !== 'ALL') {
      if (onSelectModifiedExactDateFilter) onSelectModifiedExactDateFilter('');
      else setInternalModifiedExactDate('');
    }
  };

  const handleModifiedExactDateChange = (dateVal: string) => {
    if (onSelectModifiedExactDateFilter) {
      onSelectModifiedExactDateFilter(dateVal);
    } else {
      setInternalModifiedExactDate(dateVal);
    }
    // Clear monthly filter when exact date is chosen
    if (dateVal) {
      if (onSelectModifiedMonthFilter) onSelectModifiedMonthFilter('ALL');
      else setInternalModifiedMonth('ALL');
    }
  };

  const handleResetFilters = () => {
    handleUserChange('ALL');
    handleCreatedMonthChange('ALL');
    handleCreatedExactDateChange('');
    handleModifiedMonthChange('ALL');
    handleModifiedExactDateChange('');
  };

  // Extract representatives
  const representativeOptions = useMemo(() => {
    const map = new Map<string, { name: string; role?: UserRole; email?: string; count: number }>();
    
    users.forEach(u => {
      if (u.name) {
        map.set(u.name, {
          name: u.name,
          role: u.role,
          email: u.email,
          count: 0
        });
      }
    });

    leads.forEach(l => {
      const respName = l.responsible?.trim();
      if (respName) {
        if (map.has(respName)) {
          map.get(respName)!.count++;
        } else {
          map.set(respName, {
            name: respName,
            role: 'Sales Representative',
            count: 1
          });
        }
      }
    });

    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [users, leads]);

  // Unique creation months
  const availableCreatedMonths = useMemo(() => {
    const monthSet = new Set<string>();
    const currentMonthKey = getYearMonthKey(new Date()) || '2026-08';
    monthSet.add(currentMonthKey);

    leads.forEach(l => {
      if (l.created_at) {
        const k = getYearMonthKey(l.created_at);
        if (k) monthSet.add(k);
      }
    });

    return Array.from(monthSet).sort((a, b) => b.localeCompare(a));
  }, [leads]);

  // Unique modification months
  const availableModifiedMonths = useMemo(() => {
    const monthSet = new Set<string>();
    const currentMonthKey = getYearMonthKey(new Date()) || '2026-08';
    monthSet.add(currentMonthKey);

    leads.forEach(l => {
      if (l.updated_at) {
        const k = getYearMonthKey(l.updated_at);
        if (k) monthSet.add(k);
      }
      if (l.conversation_notes_history) {
        l.conversation_notes_history.forEach(n => {
          const k = getYearMonthKey(n.created_at);
          if (k) monthSet.add(k);
        });
      }
      if (l.special_instructions_history) {
        l.special_instructions_history.forEach(i => {
          const k = getYearMonthKey(i.created_at);
          if (k) monthSet.add(k);
        });
      }
    });

    return Array.from(monthSet).sort((a, b) => b.localeCompare(a));
  }, [leads]);

  // Check if lead was modified in given month
  const isLeadModifiedInMonth = (l: Lead, monthKey: string): boolean => {
    if (!monthKey || monthKey === 'ALL') return true;
    if (l.updated_at && isDateInMonth(l.updated_at, monthKey)) {
      return true;
    }
    if (l.conversation_notes_history && l.conversation_notes_history.some(n => isDateInMonth(n.created_at, monthKey))) {
      return true;
    }
    if (l.special_instructions_history && l.special_instructions_history.some(i => isDateInMonth(i.created_at, monthKey))) {
      return true;
    }
    return false;
  };

  // Check if lead was modified on exact date
  const isLeadModifiedOnExactDate = (l: Lead, exactDateKey: string): boolean => {
    if (!exactDateKey) return true;
    if (l.updated_at && isDateOnExactDay(l.updated_at, exactDateKey)) {
      return true;
    }
    if (l.conversation_notes_history && l.conversation_notes_history.some(n => isDateOnExactDay(n.created_at, exactDateKey))) {
      return true;
    }
    if (l.special_instructions_history && l.special_instructions_history.some(i => isDateOnExactDay(i.created_at, exactDateKey))) {
      return true;
    }
    return false;
  };

  // Base user filtered leads
  const userFilteredLeads = useMemo(() => {
    if (!activeUserFilter || activeUserFilter === 'ALL') {
      return leads;
    }
    return leads.filter(l => l.responsible === activeUserFilter);
  }, [leads, activeUserFilter]);

  // Leads matching ALL active filters (Responsible + Created [Month/Exact] + Modified [Month/Exact])
  const filteredLeads = useMemo(() => {
    let result = userFilteredLeads;

    // 2. Created On filter (Exact Date takes precedence if set, otherwise Monthly)
    if (activeCreatedExactDate) {
      result = result.filter(l => isDateOnExactDay(l.created_at, activeCreatedExactDate));
    } else if (activeCreatedMonth && activeCreatedMonth !== 'ALL') {
      result = result.filter(l => isDateInMonth(l.created_at, activeCreatedMonth));
    }

    // 3. Modified On filter (Exact Date takes precedence if set, otherwise Monthly)
    if (activeModifiedExactDate) {
      result = result.filter(l => isLeadModifiedOnExactDate(l, activeModifiedExactDate));
    } else if (activeModifiedMonth && activeModifiedMonth !== 'ALL') {
      result = result.filter(l => isLeadModifiedInMonth(l, activeModifiedMonth));
    }

    return result;
  }, [userFilteredLeads, activeCreatedMonth, activeCreatedExactDate, activeModifiedMonth, activeModifiedExactDate]);

  // -------------------------------------------------------------
  // THE 5 OVERALL MONTHLY-WISE PIPELINE METRICS:
  // 1. Total Leads
  // 2. Site Survey Confirmed (Scheduled Site Survey)
  // 3. Site Survey Completed
  // 4. Order Confirmed
  // 5. Modified Leads
  // -------------------------------------------------------------
  const pipelineMetrics = useMemo(() => {
    let baseLeads = userFilteredLeads;
    if (activeCreatedExactDate) {
      baseLeads = baseLeads.filter(l => isDateOnExactDay(l.created_at, activeCreatedExactDate));
    } else if (activeCreatedMonth && activeCreatedMonth !== 'ALL') {
      baseLeads = baseLeads.filter(l => isDateInMonth(l.created_at, activeCreatedMonth));
    }

    // 1. Total Leads
    const totalCount = baseLeads.length;

    // 2. Site Survey Confirmed (Scheduled Site Survey)
    const surveyConfirmedLeads = baseLeads.filter(l => l.lead_status === 'Scheduled Site Survey');
    const surveyConfirmedCount = surveyConfirmedLeads.length;
    const surveyConfirmedRate = totalCount > 0 ? ((surveyConfirmedCount / totalCount) * 100).toFixed(1) : '0.0';

    // 3. Site Survey Completed
    const surveyCompletedLeads = baseLeads.filter(l => l.lead_status === 'Site Survey Completed');
    const surveyCompletedCount = surveyCompletedLeads.length;
    const surveyCompletedRate = totalCount > 0 ? ((surveyCompletedCount / totalCount) * 100).toFixed(1) : '0.0';

    // 4. Order Confirmed
    const orderConfirmedLeads = baseLeads.filter(l => l.lead_status === 'Order Confirmed');
    const orderConfirmedCount = orderConfirmedLeads.length;
    const orderConfirmedRate = totalCount > 0 ? ((orderConfirmedCount / totalCount) * 100).toFixed(1) : '0.0';

    // Confirmed kW
    let confirmedKw = 0;
    orderConfirmedLeads.forEach(l => {
      if (l.required_kw) {
        const match = String(l.required_kw).replace(/,/g, '').match(/(\d+(\.\d+)?)/);
        if (match) {
          const val = parseFloat(match[0]);
          if (!isNaN(val)) confirmedKw += val;
        }
      }
    });

    // 5. Modified Leads
    let modifiedLeads = userFilteredLeads;
    if (activeModifiedExactDate) {
      modifiedLeads = userFilteredLeads.filter(l => isLeadModifiedOnExactDate(l, activeModifiedExactDate));
    } else if (activeModifiedMonth && activeModifiedMonth !== 'ALL') {
      modifiedLeads = userFilteredLeads.filter(l => isLeadModifiedInMonth(l, activeModifiedMonth));
    } else if (activeCreatedExactDate) {
      modifiedLeads = userFilteredLeads.filter(l => isLeadModifiedOnExactDate(l, activeCreatedExactDate));
    } else if (activeCreatedMonth && activeCreatedMonth !== 'ALL') {
      modifiedLeads = userFilteredLeads.filter(l => isLeadModifiedInMonth(l, activeCreatedMonth));
    }
    const modifiedCount = modifiedLeads.length;
    const modificationRate = totalCount > 0 ? ((modifiedCount / totalCount) * 100).toFixed(1) : '0.0';

    return {
      totalCount,
      surveyConfirmedCount,
      surveyConfirmedRate,
      surveyCompletedCount,
      surveyCompletedRate,
      orderConfirmedCount,
      orderConfirmedRate,
      confirmedKw,
      modifiedCount,
      modificationRate,
    };
  }, [userFilteredLeads, activeCreatedMonth, activeCreatedExactDate, activeModifiedMonth, activeModifiedExactDate]);

  // Overall Monthly-Wise Pipeline Metric comparison table
  const monthlyBreakdownList = useMemo(() => {
    const allMonths = Array.from(new Set([...availableCreatedMonths, ...availableModifiedMonths])).sort((a, b) => b.localeCompare(a));

    return allMonths.map((mKey) => {
      const monthCreatedLeads = userFilteredLeads.filter(l => isDateInMonth(l.created_at, mKey));
      const totalCreated = monthCreatedLeads.length;
      
      const surveyConfirmed = monthCreatedLeads.filter(l => l.lead_status === 'Scheduled Site Survey').length;
      const surveyCompleted = monthCreatedLeads.filter(l => l.lead_status === 'Site Survey Completed').length;
      const orderConfirmed = monthCreatedLeads.filter(l => l.lead_status === 'Order Confirmed').length;
      const modifiedInMonth = userFilteredLeads.filter(l => isLeadModifiedInMonth(l, mKey)).length;
      
      const conversion = totalCreated > 0 ? ((orderConfirmed / totalCreated) * 100).toFixed(1) : '0.0';

      return {
        key: mKey,
        label: formatMonthYearLabel(mKey),
        totalCreated,
        surveyConfirmed,
        surveyCompleted,
        orderConfirmed,
        modifiedInMonth,
        conversion,
        isCurrent: mKey === getYearMonthKey(new Date()),
      };
    });
  }, [availableCreatedMonths, availableModifiedMonths, userFilteredLeads]);

  const totalLeads = filteredLeads.length;

  // Status counts for filtered leads
  const statusCounts: Record<LeadStatus, number> = {
    'Open': 0,
    'Inprogress': 0,
    'No Response': 0,
    'Busy Callback': 0,
    'Scheduled Site Survey': 0,
    'Site Survey Completed': 0,
    'Order Confirmed': 0,
    'Not Intrested': 0,
    'Lost': 0,
  };

  let loanCount = 0;
  let siteVisitCount = 0;
  let totalRequiredKw = 0;
  let kwFilledCount = 0;

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const todayEnd = todayStart + 86400000;

  let overdueCount = 0;
  let todayCount = 0;

  filteredLeads.forEach((l) => {
    if (statusCounts[l.lead_status] !== undefined) {
      statusCounts[l.lead_status]++;
    }
    if (l.required_loan) loanCount++;
    if (l.required_free_site_visit) siteVisitCount++;

    if (l.required_kw) {
      const match = String(l.required_kw).replace(/,/g, '').match(/(\d+(\.\d+)?)/);
      if (match) {
        const val = parseFloat(match[0]);
        if (!isNaN(val) && val > 0) {
          totalRequiredKw += val;
          kwFilledCount++;
        }
      }
    }

    if (l.next_follow_up && l.lead_status !== 'Open' && l.lead_status !== 'Order Confirmed' && l.lead_status !== 'Not Intrested' && l.lead_status !== 'Lost') {
      const fTime = new Date(l.next_follow_up).getTime();
      if (!isNaN(fTime)) {
        if (fTime < todayStart) {
          overdueCount++;
        } else if (fTime >= todayStart && fTime < todayEnd) {
          todayCount++;
        }
      }
    }
  });

  // Today & Yesterday date strings for quick filtering
  const todayDateKey = useMemo(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }, []);

  const yesterdayDateKey = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }, []);

  // Rep leaderboard data
  const userPerformanceList = useMemo(() => {
    return representativeOptions.map(rep => {
      let userLeads = leads.filter(l => l.responsible === rep.name);
      
      // 1. Created Date Filter (Exact Date takes precedence, otherwise Monthly)
      if (activeCreatedExactDate) {
        userLeads = userLeads.filter(l => isDateOnExactDay(l.created_at, activeCreatedExactDate));
      } else if (activeCreatedMonth && activeCreatedMonth !== 'ALL') {
        userLeads = userLeads.filter(l => isDateInMonth(l.created_at, activeCreatedMonth));
      }

      // 2. Modified Date Filter (Exact Date takes precedence, otherwise Monthly)
      if (activeModifiedExactDate) {
        userLeads = userLeads.filter(l => isLeadModifiedOnExactDate(l, activeModifiedExactDate));
      } else if (activeModifiedMonth && activeModifiedMonth !== 'ALL') {
        userLeads = userLeads.filter(l => isLeadModifiedInMonth(l, activeModifiedMonth));
      }

      const total = userLeads.length;
      const inProgress = userLeads.filter(l => l.lead_status === 'Inprogress' || l.lead_status === 'Scheduled Site Survey').length;
      const surveyConfirmed = userLeads.filter(l => l.lead_status === 'Scheduled Site Survey').length;
      const surveyCompleted = userLeads.filter(l => l.lead_status === 'Site Survey Completed').length;
      const confirmed = userLeads.filter(l => l.lead_status === 'Order Confirmed').length;
      
      // Compute modified leads count for this rep
      let repBaseLeads = leads.filter(l => l.responsible === rep.name);
      if (activeCreatedExactDate) {
        repBaseLeads = repBaseLeads.filter(l => isDateOnExactDay(l.created_at, activeCreatedExactDate));
      } else if (activeCreatedMonth && activeCreatedMonth !== 'ALL') {
        repBaseLeads = repBaseLeads.filter(l => isDateInMonth(l.created_at, activeCreatedMonth));
      }

      let modifiedLeads = repBaseLeads;
      if (activeModifiedExactDate) {
        modifiedLeads = modifiedLeads.filter(l => isLeadModifiedOnExactDate(l, activeModifiedExactDate));
      } else if (activeModifiedMonth && activeModifiedMonth !== 'ALL') {
        modifiedLeads = modifiedLeads.filter(l => isLeadModifiedInMonth(l, activeModifiedMonth));
      } else {
        const refMonth = activeCreatedMonth !== 'ALL' ? activeCreatedMonth : getYearMonthKey(new Date()) || '2026-08';
        modifiedLeads = modifiedLeads.filter(l => isLeadModifiedInMonth(l, refMonth));
      }
      const modified = modifiedLeads.length;

      const conversion = total > 0 ? ((confirmed / total) * 100).toFixed(1) : '0.0';

      return {
        ...rep,
        total,
        inProgress,
        surveyConfirmed,
        surveyCompleted,
        confirmed,
        modified,
        conversion
      };
    });
  }, [
    representativeOptions, 
    leads, 
    activeCreatedMonth, 
    activeCreatedExactDate, 
    activeModifiedMonth, 
    activeModifiedExactDate
  ]);

  const getRoleIcon = (role?: string) => {
    switch (role) {
      case 'Admin':
        return <Shield className="w-3.5 h-3.5 text-indigo-600" />;
      case 'Sales Representative':
        return <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />;
      case 'Survey Engineer':
        return <Compass className="w-3.5 h-3.5 text-amber-600" />;
      case 'Telecaller':
        return <Headphones className="w-3.5 h-3.5 text-sky-600" />;
      case 'Branch Manager':
        return <Briefcase className="w-3.5 h-3.5 text-violet-600" />;
      default:
        return <User className="w-3.5 h-3.5 text-slate-600" />;
    }
  };

  const statusPills: { 
    status: LeadStatus; 
    label: string; 
    bg: string; 
    text: string; 
    border: string; 
    dot: string; 
  }[] = [
    { status: 'Open', label: 'Open Leads', bg: 'bg-blue-50', text: 'text-blue-900', border: 'border-blue-200', dot: 'bg-blue-600' },
    { status: 'Inprogress', label: 'In Progress', bg: 'bg-amber-50', text: 'text-amber-900', border: 'border-amber-200', dot: 'bg-amber-600' },
    { status: 'No Response', label: 'No Response', bg: 'bg-orange-50', text: 'text-orange-900', border: 'border-orange-200', dot: 'bg-orange-600' },
    { status: 'Busy Callback', label: 'Busy / Callback', bg: 'bg-yellow-50', text: 'text-yellow-900', border: 'border-yellow-200', dot: 'bg-yellow-600' },
    { status: 'Scheduled Site Survey', label: 'Survey Confirmed', bg: 'bg-purple-50', text: 'text-purple-900', border: 'border-purple-200', dot: 'bg-purple-600' },
    { status: 'Site Survey Completed', label: 'Survey Completed', bg: 'bg-teal-50', text: 'text-teal-900', border: 'border-teal-200', dot: 'bg-teal-600' },
    { status: 'Order Confirmed', label: 'Order Confirmed', bg: 'bg-emerald-50', text: 'text-emerald-900', border: 'border-emerald-300', dot: 'bg-emerald-600' },
    { status: 'Not Intrested', label: 'Not Interested', bg: 'bg-rose-50', text: 'text-rose-900', border: 'border-rose-200', dot: 'bg-rose-600' },
    { status: 'Lost', label: 'Lost Lead', bg: 'bg-slate-100', text: 'text-slate-900', border: 'border-slate-300', dot: 'bg-slate-600' },
  ];

  return (
    <div className="space-y-6">
      
      {/* 1. ADMIN DASHBOARD ANALYTICS FILTERS (Responsible, Lead Created On, Lead Modified On) */}
      <DashboardFilters
        activeUserFilter={activeUserFilter}
        onUserChange={handleUserChange}
        representativeOptions={representativeOptions}
        totalLeadsCount={leads.length}
        activeCreatedMonth={activeCreatedMonth}
        onCreatedMonthChange={handleCreatedMonthChange}
        availableCreatedMonths={availableCreatedMonths}
        activeCreatedExactDate={activeCreatedExactDate}
        onCreatedExactDateChange={handleCreatedExactDateChange}
        activeModifiedMonth={activeModifiedMonth}
        onModifiedMonthChange={handleModifiedMonthChange}
        availableModifiedMonths={availableModifiedMonths}
        activeModifiedExactDate={activeModifiedExactDate}
        onModifiedExactDateChange={handleModifiedExactDateChange}
        onResetFilters={handleResetFilters}
        matchedLeadsCount={filteredLeads.length}
        onViewFilteredLeads={
          onViewAllLeadsForUser 
            ? () => onViewAllLeadsForUser(
                activeUserFilter, 
                activeCreatedMonth, 
                activeModifiedMonth,
                activeCreatedExactDate,
                activeModifiedExactDate
              ) 
            : undefined
        }
      />

      {/* 2. OVERALL MONTHLY-WISE PIPELINE METRIC (Total Leads, Site Survey Confirmed, Site Survey Completed, Order Confirmed, Modified Leads) */}
      <OverallMonthlyPipelineMetrics
        totalLeads={pipelineMetrics.totalCount}
        surveyConfirmedCount={pipelineMetrics.surveyConfirmedCount}
        surveyConfirmedRate={pipelineMetrics.surveyConfirmedRate}
        surveyCompletedCount={pipelineMetrics.surveyCompletedCount}
        surveyCompletedRate={pipelineMetrics.surveyCompletedRate}
        orderConfirmedCount={pipelineMetrics.orderConfirmedCount}
        orderConfirmedRate={pipelineMetrics.orderConfirmedRate}
        confirmedKw={pipelineMetrics.confirmedKw}
        modifiedCount={pipelineMetrics.modifiedCount}
        modificationRate={pipelineMetrics.modificationRate}
        activeCreatedMonth={activeCreatedMonth}
        activeModifiedMonth={activeModifiedMonth}
        activeCreatedExactDate={activeCreatedExactDate}
        activeModifiedExactDate={activeModifiedExactDate}
        activeUserFilter={activeUserFilter}
        onSelectStatusFilter={(status, cMonth, mMonth, cDate, mDate) => 
          onSelectStatusFilter(
            status, 
            cMonth || activeCreatedMonth, 
            mMonth || activeModifiedMonth,
            cDate || activeCreatedExactDate,
            mDate || activeModifiedExactDate
          )
        }
        onSelectModifiedFilter={(mMonth, cMonth, mDate, cDate) => 
          onSelectModifiedFilter && onSelectModifiedFilter(
            mMonth || activeModifiedMonth, 
            cMonth || activeCreatedMonth,
            mDate || activeModifiedExactDate,
            cDate || activeCreatedExactDate
          )
        }
      />

      {/* Section View Toggles: Monthly Comparison Table & Rep Table */}
      <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowMonthlyBreakdown(!showMonthlyBreakdown)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
              showMonthlyBreakdown 
                ? 'bg-emerald-800 text-white border-emerald-900 shadow-xs' 
                : 'bg-white text-slate-700 border-[#BBD5DA] hover:border-slate-400 hover:bg-slate-50'
            }`}
          >
            <CalendarRange className="w-3.5 h-3.5" />
            <span>{showMonthlyBreakdown ? 'Hide Monthly Table' : 'Show Monthly Breakdown Table'}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowTeamLeaderboard(!showTeamLeaderboard)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
              showTeamLeaderboard 
                ? 'bg-[#0E2429] text-white border-[#0E2429] shadow-xs' 
                : 'bg-white text-slate-700 border-[#BBD5DA] hover:border-slate-400 hover:bg-slate-50'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>{showTeamLeaderboard ? 'Hide Rep Table' : 'Show Rep Performance Table'}</span>
          </button>
        </div>

        <span className="text-xs text-slate-500 font-medium">
          Showing {filteredLeads.length} leads matching selected criteria
        </span>
      </div>

      {/* 3. OVERALL MONTHLY-WISE BREAKDOWN TABLE */}
      {showMonthlyBreakdown && (
        <div id="overall-monthly-pipeline-comparison-table-container" className="bg-white p-5 rounded-2xl border border-[#BBD5DA] shadow-xs space-y-3.5 animate-in fade-in duration-150">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <CalendarRange className="w-4 h-4 text-emerald-600" />
                <span>Overall Monthly-Wise Pipeline Metric Comparison Table</span>
              </h3>
              <p className="text-xs text-slate-500">
                Summary across Total Leads, Site Survey Confirmed, Site Survey Completed, Order Confirmed, and Modified Leads
              </p>
            </div>
            
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-slate-500 font-medium">{monthlyBreakdownList.length} Period Months</span>
              {currentUser?.permissions?.canAccessExcel && (
              <button
                type="button"
                data-export-ignore="false"
                onClick={handleDownloadMonthlyTablePng}
                disabled={isExportingMonthlyTable}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer shadow-xs ${
                  exportSuccessMonthlyTable
                    ? 'bg-emerald-600 text-white border-emerald-700'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                }`}
                title="Download Overall Monthly-Wise Pipeline Metric Comparison Table as PNG image"
              >
                {isExportingMonthlyTable ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                    <span>Exporting...</span>
                  </>
                ) : exportSuccessMonthlyTable ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Saved PNG!</span>
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Download PNG</span>
                  </>
                )}
              </button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-2.5 px-3">Month</th>
                  <th className="py-2.5 px-3 text-center">Total Leads</th>
                  <th className="py-2.5 px-3 text-center">Survey Confirmed</th>
                  <th className="py-2.5 px-3 text-center">Survey Completed</th>
                  <th className="py-2.5 px-3 text-center">Order Confirmed</th>
                  <th className="py-2.5 px-3 text-center">Modified Leads</th>
                  <th className="py-2.5 px-3 text-center">Win Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {monthlyBreakdownList.map((mItem) => {
                  const isCreatedActive = activeCreatedMonth === mItem.key;
                  return (
                    <tr 
                      key={mItem.key} 
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isCreatedActive ? 'bg-emerald-50/60 font-semibold' : ''
                      }`}
                    >
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{mItem.label}</span>
                          {mItem.isCurrent && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-600 text-white font-bold">Current</span>
                          )}
                          {isCreatedActive && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-600 text-white font-bold">Created Filter</span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => onSelectStatusFilter('ALL', mItem.key)}
                          className="px-2 py-0.5 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 font-bold transition-all cursor-pointer shadow-2xs hover:scale-105"
                          title={`View all leads created in ${mItem.label}`}
                        >
                          {mItem.totalCreated}
                        </button>
                      </td>

                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => onSelectStatusFilter('Scheduled Site Survey', mItem.key)}
                          className="px-2 py-0.5 rounded-md bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 font-semibold transition-all cursor-pointer shadow-2xs hover:scale-105"
                          title={`View survey confirmed leads for ${mItem.label}`}
                        >
                          {mItem.surveyConfirmed}
                        </button>
                      </td>

                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => onSelectStatusFilter('Site Survey Completed', mItem.key)}
                          className="px-2 py-0.5 rounded-md bg-teal-50 hover:bg-teal-100 text-teal-900 border border-teal-200 font-semibold transition-all cursor-pointer shadow-2xs hover:scale-105"
                          title={`View survey completed leads for ${mItem.label}`}
                        >
                          {mItem.surveyCompleted}
                        </button>
                      </td>

                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => onSelectStatusFilter('Order Confirmed', mItem.key)}
                          className="px-2 py-0.5 rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold transition-all cursor-pointer shadow-2xs hover:scale-105"
                          title={`View won orders for ${mItem.label}`}
                        >
                          {mItem.orderConfirmed}
                        </button>
                      </td>

                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            if (onSelectModifiedFilter) {
                              onSelectModifiedFilter(mItem.key, 'ALL');
                            } else {
                              onSelectStatusFilter('ALL', 'ALL', mItem.key);
                            }
                          }}
                          className="px-2 py-0.5 rounded-md bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 font-semibold transition-all cursor-pointer shadow-2xs hover:scale-105"
                          title={`View modified leads in ${mItem.label}`}
                        >
                          {mItem.modifiedInMonth}
                        </button>
                      </td>

                      <td className="py-3 px-3 text-center font-bold text-slate-900">
                        <span className={`px-2 py-0.5 rounded-md ${
                          Number(mItem.conversion) >= 10 ? 'bg-emerald-100 text-emerald-900 font-bold' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {mItem.conversion}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. TEAM LEADERBOARD TABLE */}
      {showTeamLeaderboard && (
        <div id="representative-performance-table-container" className="bg-white p-5 rounded-2xl border border-[#BBD5DA] shadow-xs space-y-4 animate-in fade-in duration-150">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-amber-50 text-amber-600 border border-amber-200">
                  <Award className="w-4 h-4" />
                </span>
                <h3 className="text-sm font-bold text-slate-900">
                  Representative Performance Table
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Executive pipeline stats & activity breakdown with live date filtering
              </p>
            </div>
            
            <div className="flex items-center flex-wrap gap-2 text-xs">
              <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 font-semibold border border-slate-200">
                {representativeOptions.length} Representatives
              </span>
              {currentUser?.permissions?.canAccessExcel && (

              <button
                type="button"
                onClick={handleDownloadRepTablePng}
                disabled={isExportingRepTable}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer shadow-xs ${
                  exportSuccessRepTable
                    ? 'bg-emerald-600 text-white border-emerald-700'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                }`}
                title="Download Representative Performance Table as PNG image"
              >
                {isExportingRepTable ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600" />
                    <span>Exporting...</span>
                  </>
                ) : exportSuccessRepTable ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Saved PNG!</span>
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5 text-amber-600" />
                    <span>Download PNG</span>
                  </>
                )}
              </button>

              )}
              {(activeModifiedExactDate || (activeModifiedMonth && activeModifiedMonth !== 'ALL') || activeCreatedExactDate || (activeCreatedMonth && activeCreatedMonth !== 'ALL')) && (
                <button
                  type="button"
                  onClick={() => {
                    handleModifiedMonthChange('ALL');
                    handleModifiedExactDateChange('');
                    handleCreatedMonthChange('ALL');
                    handleCreatedExactDateChange('');
                  }}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold border border-rose-200 transition-colors cursor-pointer"
                  title="Reset both modified and created date filters"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset Filters</span>
                </button>
              )}
            </div>
          </div>

          {/* DEDICATED MODIFIED DATE WISE FILTER TOOLBAR */}
          <div className="bg-slate-50/90 border border-slate-200 rounded-xl p-3.5 space-y-3">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              {/* Modified Date Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 flex-wrap">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  <span>Filter by Modified Date:</span>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  {/* Quick Filter: All */}
                  <button
                    type="button"
                    onClick={() => {
                      handleModifiedMonthChange('ALL');
                      handleModifiedExactDateChange('');
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      !activeModifiedExactDate && (!activeModifiedMonth || activeModifiedMonth === 'ALL')
                        ? 'bg-[#0E2429] text-white shadow-xs'
                        : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                    }`}
                  >
                    All Modified
                  </button>

                  {/* Quick Filter: Today */}
                  <button
                    type="button"
                    onClick={() => handleModifiedExactDateChange(todayDateKey)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      activeModifiedExactDate === todayDateKey
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'bg-white text-slate-700 hover:bg-amber-50 hover:text-amber-800 border border-slate-200'
                    }`}
                  >
                    Today
                  </button>

                  {/* Quick Filter: Yesterday */}
                  <button
                    type="button"
                    onClick={() => handleModifiedExactDateChange(yesterdayDateKey)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      activeModifiedExactDate === yesterdayDateKey
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'bg-white text-slate-700 hover:bg-amber-50 hover:text-amber-800 border border-slate-200'
                    }`}
                  >
                    Yesterday
                  </button>

                  {/* Exact Date Picker */}
                  <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg px-2 py-0.5 shadow-xs">
                    <input
                      type="date"
                      value={activeModifiedExactDate}
                      onChange={(e) => handleModifiedExactDateChange(e.target.value)}
                      className="text-xs font-semibold text-slate-800 bg-transparent focus:outline-none cursor-pointer"
                      title="Pick exact modified date"
                    />
                    {activeModifiedExactDate && (
                      <button
                        type="button"
                        onClick={() => handleModifiedExactDateChange('')}
                        className="text-slate-400 hover:text-slate-700 cursor-pointer p-0.5"
                        title="Clear exact modified date"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  {/* Modified Month Selector */}
                  <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg px-2 py-0.5 shadow-xs">
                    <span className="text-[11px] font-medium text-slate-500">Month:</span>
                    <select
                      value={activeModifiedMonth}
                      onChange={(e) => handleModifiedMonthChange(e.target.value)}
                      className="text-xs font-bold text-slate-800 bg-transparent focus:outline-none cursor-pointer pr-1"
                    >
                      <option value="ALL">All Months</option>
                      {availableModifiedMonths.map((m) => (
                        <option key={m} value={m}>
                          {formatMonthYearLabel(m)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Created Date Synchronizer */}
              <div className="flex items-center gap-2 text-xs flex-wrap">
                <span className="text-slate-500 font-medium">Created Month:</span>
                <select
                  value={activeCreatedMonth}
                  onChange={(e) => handleCreatedMonthChange(e.target.value)}
                  className="px-2 py-1 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none cursor-pointer shadow-xs"
                >
                  <option value="ALL">All Creation Months</option>
                  {availableCreatedMonths.map((m) => (
                    <option key={m} value={m}>
                      {formatMonthYearLabel(m)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Active Date Filter Badges */}
            {(activeModifiedExactDate || (activeModifiedMonth && activeModifiedMonth !== 'ALL') || activeCreatedExactDate || (activeCreatedMonth && activeCreatedMonth !== 'ALL')) && (
              <div className="flex items-center gap-2 pt-2 border-t border-slate-200/60 text-xs flex-wrap">
                <span className="text-[11px] font-semibold text-slate-500">Active Rep Table Filters:</span>
                
                {activeModifiedExactDate && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 font-bold border border-amber-300">
                    <Clock className="w-3 h-3 text-amber-700" />
                    <span>
                      Modified on: {formatExactDateLabel(activeModifiedExactDate)}
                      {activeModifiedExactDate === todayDateKey ? ' (Today)' : activeModifiedExactDate === yesterdayDateKey ? ' (Yesterday)' : ''}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleModifiedExactDateChange('')}
                      className="hover:text-amber-950 cursor-pointer ml-0.5"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </span>
                )}

                {!activeModifiedExactDate && activeModifiedMonth && activeModifiedMonth !== 'ALL' && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-100 text-purple-900 font-bold border border-purple-300">
                    <Calendar className="w-3 h-3 text-purple-700" />
                    <span>Modified Month: {formatMonthYearLabel(activeModifiedMonth)}</span>
                    <button
                      type="button"
                      onClick={() => handleModifiedMonthChange('ALL')}
                      className="hover:text-purple-950 cursor-pointer ml-0.5"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </span>
                )}

                {activeCreatedExactDate && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-100 text-blue-900 font-bold border border-blue-300">
                    <CalendarRange className="w-3 h-3 text-blue-700" />
                    <span>Created on: {formatExactDateLabel(activeCreatedExactDate)}</span>
                    <button
                      type="button"
                      onClick={() => handleCreatedExactDateChange('')}
                      className="hover:text-blue-950 cursor-pointer ml-0.5"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </span>
                )}

                {!activeCreatedExactDate && activeCreatedMonth && activeCreatedMonth !== 'ALL' && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-100 text-blue-900 font-bold border border-blue-300">
                    <Calendar className="w-3 h-3 text-blue-700" />
                    <span>Created Month: {formatMonthYearLabel(activeCreatedMonth)}</span>
                    <button
                      type="button"
                      onClick={() => handleCreatedMonthChange('ALL')}
                      className="hover:text-blue-950 cursor-pointer ml-0.5"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-2.5 px-3">Team Member</th>
                  <th className="py-2.5 px-3">Role</th>
                  <th className="py-2.5 px-3 text-center">Total Leads</th>
                  <th className="py-2.5 px-3 text-center">In Progress</th>
                  <th className="py-2.5 px-3 text-center">Survey Confirmed</th>
                  <th className="py-2.5 px-3 text-center">Survey Completed</th>
                  <th className="py-2.5 px-3 text-center">Orders Won</th>
                  <th className="py-2.5 px-3 text-center">Modified</th>
                  <th className="py-2.5 px-3 text-center">Conversion</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {userPerformanceList.map((userStats) => {
                  const isCurrentFilter = activeUserFilter === userStats.name;
                  return (
                    <tr 
                      key={userStats.name} 
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isCurrentFilter ? 'bg-blue-50/60 font-semibold' : ''
                      }`}
                    >
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          <span>{userStats.name}</span>
                          {isCurrentFilter && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-600 text-white font-bold">Active</span>
                          )}
                        </div>
                        {userStats.email && <div className="text-[10px] text-slate-400 font-normal">{userStats.email}</div>}
                      </td>
                      <td className="py-3 px-3">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                          {getRoleIcon(userStats.role)}
                          <span>{userStats.role || 'Representative'}</span>
                        </span>
                      </td>
                      
                      {/* Total Leads (Clickable) */}
                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => onSelectStatusFilter('ALL', activeCreatedMonth, activeModifiedMonth, activeCreatedExactDate, activeModifiedExactDate, userStats.name)}
                          className="px-2 py-0.5 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 font-bold transition-all cursor-pointer shadow-2xs hover:scale-105"
                          title={`View all ${userStats.total} leads for ${userStats.name}`}
                        >
                          {userStats.total}
                        </button>
                      </td>

                      {/* In Progress (Clickable) */}
                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => onSelectStatusFilter('Inprogress', activeCreatedMonth, activeModifiedMonth, activeCreatedExactDate, activeModifiedExactDate, userStats.name)}
                          className="px-2 py-0.5 rounded-md bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 font-semibold transition-all cursor-pointer shadow-2xs hover:scale-105"
                          title={`View in-progress leads for ${userStats.name}`}
                        >
                          {userStats.inProgress}
                        </button>
                      </td>

                      {/* Survey Confirmed (Clickable) */}
                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => onSelectStatusFilter('Scheduled Site Survey', activeCreatedMonth, activeModifiedMonth, activeCreatedExactDate, activeModifiedExactDate, userStats.name)}
                          className="px-2 py-0.5 rounded-md bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 font-semibold transition-all cursor-pointer shadow-2xs hover:scale-105"
                          title={`View site survey scheduled leads for ${userStats.name}`}
                        >
                          {userStats.surveyConfirmed}
                        </button>
                      </td>

                      {/* Survey Completed (Clickable) */}
                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => onSelectStatusFilter('Site Survey Completed', activeCreatedMonth, activeModifiedMonth, activeCreatedExactDate, activeModifiedExactDate, userStats.name)}
                          className="px-2 py-0.5 rounded-md bg-teal-50 hover:bg-teal-100 text-teal-900 border border-teal-200 font-semibold transition-all cursor-pointer shadow-2xs hover:scale-105"
                          title={`View site survey completed leads for ${userStats.name}`}
                        >
                          {userStats.surveyCompleted}
                        </button>
                      </td>

                      {/* Orders Won (Clickable) */}
                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => onSelectStatusFilter('Order Confirmed', activeCreatedMonth, activeModifiedMonth, activeCreatedExactDate, activeModifiedExactDate, userStats.name)}
                          className="px-2 py-0.5 rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold transition-all cursor-pointer shadow-2xs hover:scale-105"
                          title={`View won orders for ${userStats.name}`}
                        >
                          {userStats.confirmed}
                        </button>
                      </td>

                      {/* Modified Leads (Clickable) */}
                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            if (onSelectModifiedFilter) {
                              onSelectModifiedFilter(activeModifiedMonth, activeCreatedMonth, activeModifiedExactDate, activeCreatedExactDate, userStats.name);
                            } else {
                              onSelectStatusFilter('ALL', activeCreatedMonth, activeModifiedMonth, activeCreatedExactDate, activeModifiedExactDate, userStats.name);
                            }
                          }}
                          className="px-2 py-0.5 rounded-md bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 font-semibold transition-all cursor-pointer shadow-2xs hover:scale-105"
                          title={`View modified leads for ${userStats.name}`}
                        >
                          {userStats.modified}
                        </button>
                      </td>

                      {/* Conversion */}
                      <td className="py-3 px-3 text-center font-bold text-slate-900">
                        <span className={`px-2 py-0.5 rounded-md ${
                          Number(userStats.conversion) >= 10 ? 'bg-emerald-100 text-emerald-900 font-bold' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {userStats.conversion}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. ALL PIPELINE STAGES GRID */}
      <div id="pipeline-stage-distribution-container" className="bg-white p-5 rounded-2xl border border-[#BBD5DA] shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-200">
                <Layers className="w-4 h-4" />
              </span>
              <h3 className="text-sm font-bold text-slate-900">Pipeline Stage Distribution</h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Live status breakdown by responsible executive & active date criteria
            </p>
          </div>

          {/* Responsible Wise Filter & Download PNG Controls */}
          <div className="flex items-center flex-wrap gap-2.5">
            {/* Responsible Wise Dropdown Filter */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 shadow-2xs">
              <User className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-[11px] font-semibold text-slate-600 whitespace-nowrap">Responsible:</span>
              <select
                value={activeUserFilter}
                onChange={(e) => handleUserChange(e.target.value)}
                className="text-xs font-bold text-slate-800 bg-transparent focus:outline-none cursor-pointer max-w-[150px] sm:max-w-[200px] truncate"
                title="Filter Pipeline Stages by Responsible Executive"
              >
                <option value="ALL">All Executives ({leads.length})</option>
                {representativeOptions.map((rep) => (
                  <option key={rep.name} value={rep.name}>
                    {rep.name} ({rep.count})
                  </option>
                ))}
              </select>
              {activeUserFilter !== 'ALL' && (
                <button
                  type="button"
                  onClick={() => handleUserChange('ALL')}
                  className="text-slate-400 hover:text-slate-700 p-0.5 cursor-pointer ml-0.5"
                  title="Clear Responsible filter"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            <span className="text-xs font-semibold text-slate-600 px-2.5 py-1 rounded-lg bg-[#DFF1F1] border border-[#BBD5DA]">
              {totalLeads} Leads
            </span>

            {/* Download PNG Button */}
            {currentUser?.permissions?.canAccessExcel && (
            <button
              type="button"
              data-export-ignore="false"
              onClick={handleDownloadStageDistributionPng}
              disabled={isExportingStageDistribution}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer shadow-xs ${
                exportSuccessStageDistribution
                  ? 'bg-emerald-600 text-white border-emerald-700'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
              }`}
              title="Download Pipeline Stage Distribution as PNG image"
            >
              {isExportingStageDistribution ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                  <span>Exporting...</span>
                </>
              ) : exportSuccessStageDistribution ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Saved PNG!</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5 text-blue-600" />
                  <span>Download PNG</span>
                </>
              )}
            </button>
            )}
          </div>
        </div>

        {/* Active Filters Bar if any filter is active */}
        {(activeUserFilter !== 'ALL' || activeCreatedExactDate || (activeCreatedMonth && activeCreatedMonth !== 'ALL') || activeModifiedExactDate || (activeModifiedMonth && activeModifiedMonth !== 'ALL')) && (
          <div className="flex items-center gap-2 pt-0.5 text-xs flex-wrap">
            <span className="text-[11px] font-semibold text-slate-500">Active Criteria:</span>
            {activeUserFilter !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-900 font-bold border border-indigo-200">
                <User className="w-3 h-3 text-indigo-600" />
                <span>Rep: {activeUserFilter}</span>
                <button
                  type="button"
                  onClick={() => handleUserChange('ALL')}
                  className="hover:text-indigo-950 cursor-pointer ml-0.5"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            )}
            {activeCreatedExactDate && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-900 font-bold border border-blue-200">
                <CalendarRange className="w-3 h-3 text-blue-600" />
                <span>Created: {formatExactDateLabel(activeCreatedExactDate)}</span>
              </span>
            )}
            {!activeCreatedExactDate && activeCreatedMonth && activeCreatedMonth !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-900 font-bold border border-blue-200">
                <Calendar className="w-3 h-3 text-blue-600" />
                <span>Created Month: {formatMonthYearLabel(activeCreatedMonth)}</span>
              </span>
            )}
            {activeModifiedExactDate && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-900 font-bold border border-amber-200">
                <Clock className="w-3 h-3 text-amber-600" />
                <span>Modified: {formatExactDateLabel(activeModifiedExactDate)}</span>
              </span>
            )}
            {!activeModifiedExactDate && activeModifiedMonth && activeModifiedMonth !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-50 text-purple-900 font-bold border border-purple-200">
                <Clock className="w-3 h-3 text-purple-600" />
                <span>Modified Month: {formatMonthYearLabel(activeModifiedMonth)}</span>
              </span>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
          {statusPills.map((pill) => {
            const count = statusCounts[pill.status];
            const percentage = totalLeads > 0 ? Math.round((count / totalLeads) * 100) : 0;
            return (
              <button
                key={pill.status}
                onClick={() => onSelectStatusFilter(
                  pill.status, 
                  activeCreatedMonth, 
                  activeModifiedMonth,
                  activeCreatedExactDate,
                  activeModifiedExactDate,
                  activeUserFilter
                )}
                className={`p-3 rounded-lg border ${pill.border} ${pill.bg} hover:border-[#FF0000] hover:scale-[1.01] transition-all text-left group cursor-pointer shadow-2xs`}
                title={`Filter ${pill.label} leads${activeUserFilter !== 'ALL' ? ` for ${activeUserFilter}` : ''}`}
              >
                <div className="text-[11px] font-bold text-slate-700 truncate">
                  {pill.label}
                </div>
                <div className="flex items-baseline justify-between mt-1">
                  <span className={`text-lg font-bold ${pill.text}`}>{count}</span>
                  <span className="text-[10px] text-slate-500 font-medium">{percentage}%</span>
                </div>
                <div className="w-full bg-slate-200/80 rounded-full h-1 mt-1.5 overflow-hidden">
                  <div 
                    className={`h-full ${pill.dot} rounded-full`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 6. SECONDARY INSIGHTS ROW */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-[#BBD5DA] shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-[#DFF1F1] text-[#FF0000] flex items-center justify-center shrink-0 border border-[#BBD5DA]">
            <Sun className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Solar Capacity Required</div>
            <div className="text-lg font-bold text-slate-900">{totalRequiredKw.toFixed(1)} kW Total</div>
            <div className="text-[11px] text-slate-400">{kwFilledCount} customer specifications recorded</div>
          </div>
        </div>

        <div 
          onClick={() => onSelectLoanFilter && onSelectLoanFilter('YES', activeCreatedMonth)}
          className="bg-white p-5 rounded-xl border border-[#BBD5DA] shadow-xs flex items-center gap-3.5 hover:border-[#0E2429] hover:shadow-sm cursor-pointer transition-all group"
          title="Click to filter leads requiring Bank Loan"
        >
          <div className="w-10 h-10 rounded-lg bg-[#DFF1F1] text-[#0E2429] flex items-center justify-center shrink-0 border border-[#BBD5DA] group-hover:scale-105 transition-transform">
            <IndianRupee className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Bank Loan Required</div>
              <span className="text-[10px] text-blue-700 font-bold bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">Filter</span>
            </div>
            <div className="text-lg font-bold text-slate-900">{loanCount} Leads ({totalLeads > 0 ? Math.round((loanCount / totalLeads) * 100) : 0}%)</div>
            <div className="text-[11px] text-slate-400 truncate">PM Surya Ghar financing • Click to view</div>
          </div>
        </div>

        <div 
          onClick={() => onSelectSiteVisitFilter && onSelectSiteVisitFilter('YES', activeCreatedMonth)}
          className="bg-white p-5 rounded-xl border border-[#BBD5DA] shadow-xs flex items-center gap-3.5 hover:border-emerald-600 hover:shadow-sm cursor-pointer transition-all group"
          title="Click to filter leads requesting Free Site Survey"
        >
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-200 group-hover:scale-105 transition-transform">
            <Home className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Free Site Surveys</div>
              <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">Filter</span>
            </div>
            <div className="text-lg font-bold text-slate-900">{siteVisitCount} Requests ({totalLeads > 0 ? Math.round((siteVisitCount / totalLeads) * 100) : 0}%)</div>
            <div className="text-[11px] text-slate-400 truncate">Rooftop shadow analysis • Click to view</div>
          </div>
        </div>
      </div>

    </div>
  );
};
