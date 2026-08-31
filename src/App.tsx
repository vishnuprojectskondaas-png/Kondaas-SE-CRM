import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  fetchAllLeads, 
  fetchAllUsers, 
  createLeadRecord, 
  updateLeadRecord, 
  deleteLeadRecord,
  bulkInsertLeadRecords,
  createUserRecord,
  updateUserRecord,
  deleteUserRecord,
  getStoredSupabaseConfig,
  fetchDailyActivityReports,
  createDailyActivityReport,
  updateDailyActivityReport,
  deleteDailyActivityReport,
  bulkUpdateActivityReportApprovals,
} from './lib/supabase';
import { 
  Lead, 
  AppUser, 
  LeadStatus, 
  LeadFormData, 
  UserFormData, 
  SupabaseConfig,
  UserPermissions,
  NoteEntry,
  RequiredProduct,
  DailyActivityReport,
  DailyActivityFormData,
  ManagerApprovalStatus,
} from './types';
import { exportLeadsToExcel } from './lib/excel';
import { getDefaultPermissions } from './lib/mockData';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { DashboardStats } from './components/DashboardStats';
import { LeadList } from './components/LeadList';
import { FollowUpAlerts } from './components/FollowUpAlerts';
import { UserManagement } from './components/UserManagement';
import { DailyActivityReportModule } from './components/DailyActivityReportModule';
import { LeadFormModal } from './components/LeadFormModal';
import { UserModal } from './components/UserModal';
import { ExcelImportModal } from './components/ExcelImportModal';
import { SupabaseConfigModal } from './components/SupabaseConfigModal';
import { RescheduleModal } from './components/RescheduleModal';
import { InProgressStageModal } from './components/InProgressStageModal';
import { UpdateLeadModal } from './components/UpdateLeadModal';
import { LoginPage } from './components/LoginPage';
import { 
  Sun, 
  Plus, 
  Clock, 
  Users, 
  Layers, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight,
  Sparkles,
  Phone,
  MessageSquare,
  UserPlus,
  Briefcase
} from 'lucide-react';

export default function App() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [dailyReports, setDailyReports] = useState<DailyActivityReport[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(() => {
    return localStorage.getItem('solar_crm_active_user_id') || sessionStorage.getItem('solar_crm_active_user_id');
  });
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<'dashboard' | 'leads' | 'followups' | 'reports' | 'users'>('dashboard');
  const [supabaseConfig, setSupabaseConfig] = useState<SupabaseConfig>(getStoredSupabaseConfig());

  const [dashboardUserFilter, setDashboardUserFilter] = useState<string>('ALL');
  const [dashboardCreatedMonthFilter, setDashboardCreatedMonthFilter] = useState<string>('ALL');
  const [dashboardCreatedExactDateFilter, setDashboardCreatedExactDateFilter] = useState<string>('');
  const [dashboardModifiedMonthFilter, setDashboardModifiedMonthFilter] = useState<string>('ALL');
  const [dashboardModifiedExactDateFilter, setDashboardModifiedExactDateFilter] = useState<string>('');
  const [dashboardMonthFilter, setDashboardMonthFilter] = useState<string>('ALL');
  const [filterRepName, setFilterRepName] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<LeadStatus | 'ALL'>('ALL');
  const [filterSiteVisit, setFilterSiteVisit] = useState<'YES' | 'NO' | 'ALL'>('ALL');
  const [filterLoan, setFilterLoan] = useState<'YES' | 'NO' | 'ALL'>('ALL');
  const [filterMonth, setFilterMonth] = useState<string | null>(null);
  const [filterCreatedMonth, setFilterCreatedMonth] = useState<string | null>(null);
  const [filterCreatedExactDate, setFilterCreatedExactDate] = useState<string | null>(null);
  const [filterModifiedMonth, setFilterModifiedMonth] = useState<string | null>(null);
  const [filterModifiedExactDate, setFilterModifiedExactDate] = useState<string | null>(null);
  const [filterActivity, setFilterActivity] = useState<'ALL' | 'MODIFIED_IN_MONTH'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Modal States
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [updateLeadTarget, setUpdateLeadTarget] = useState<Lead | null>(null);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);
  const [rescheduleLead, setRescheduleLead] = useState<Lead | null>(null);
  const [inProgressModalLead, setInProgressModalLead] = useState<Lead | null>(null);

  // Toast / Notification
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Load leads, users, and daily activity reports
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [leadsRes, usersRes, reportsRes] = await Promise.all([
        fetchAllLeads(),
        fetchAllUsers(),
        fetchDailyActivityReports(),
      ]);
      setLeads(leadsRes.leads);
      setUsers(usersRes.users);
      setDailyReports(reportsRes.reports);

      // Verify active user
      setCurrentUserId((prev) => {
        if (prev && usersRes.users.some((u) => u.id === prev)) {
          return prev;
        }
        // If stored id is invalid, remove it
        localStorage.removeItem('solar_crm_active_user_id');
        sessionStorage.removeItem('solar_crm_active_user_id');
        return null;
      });

      if (leadsRes.source === 'supabase' || usersRes.source === 'supabase' || reportsRes.source === 'supabase') {
        setSupabaseConfig((prev) => ({ ...prev, isConnected: true }));
      }
    } catch (e) {
      console.error('Error loading CRM data', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Determine currently active user and their permissions
  const currentUser: AppUser | null = useMemo(() => {
    if (!currentUserId || users.length === 0) return null;
    const found = users.find((u) => u.id === currentUserId);
    return found || null;
  }, [users, currentUserId]);

  const handleLogin = (user: AppUser, rememberMe: boolean) => {
    setCurrentUserId(user.id);
    if (rememberMe) {
      localStorage.setItem('solar_crm_active_user_id', user.id);
    } else {
      sessionStorage.setItem('solar_crm_active_user_id', user.id);
    }
    showToast(`Welcome back, ${user.name}! Signed in as ${user.role}.`, 'success');
  };

  const handleLogout = () => {
    setCurrentUserId(null);
    localStorage.removeItem('solar_crm_active_user_id');
    sessionStorage.removeItem('solar_crm_active_user_id');
    showToast('You have been signed out.', 'info');
  };

  const currentUserPermissions: UserPermissions = useMemo(() => {
    if (!currentUser) {
      return {
        canAddLead: false,
        canEditContactDetails: false,
        canDeleteLead: false,
        canAccessExcel: false,
        canManageUsers: false,
        canManageDatabase: false,
      };
    }
    const defaultPerms = getDefaultPermissions(currentUser.role);
    return {
      ...defaultPerms,
      ...(currentUser.permissions || {}),
    };
  }, [currentUser]);

  // Visible / Accessible leads for current logged-in user
  const accessibleLeads = useMemo(() => {
    if (currentUser && currentUserPermissions.accessAssignedLeadsOnly) {
      return leads.filter((l) => l.responsible === currentUser.name);
    }
    return leads;
  }, [leads, currentUser, currentUserPermissions.accessAssignedLeadsOnly]);

  // Visible / Accessible daily activity reports for current logged-in user (Non-admins only see their own records)
  const accessibleDailyReports = useMemo(() => {
    if (currentUser && currentUser.role !== 'Admin') {
      return dailyReports.filter(
        (r) => r.executive_name === currentUser.name || (r.executive_id && r.executive_id === currentUser.id)
      );
    }
    return dailyReports;
  }, [dailyReports, currentUser]);

  // Overdue leads calculation for sidebar badge
  const overdueLeadsCount = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    let count = 0;
    accessibleLeads.forEach((l) => {
      if (l.next_follow_up && l.lead_status !== 'Open' && l.lead_status !== 'Order Confirmed' && l.lead_status !== 'Not Intrested' && l.lead_status !== 'Lost') {
        const fTime = new Date(l.next_follow_up).getTime();
        if (!isNaN(fTime) && fTime < todayStart) {
          count++;
        }
      }
    });
    return count;
  }, [accessibleLeads]);

  const handleSelectActiveUser = (user: AppUser) => {
    setCurrentUserId(user.id);
    localStorage.setItem('solar_crm_active_user_id', user.id);
    showToast(`Active profile switched to ${user.name} (${user.role})`);
    
    // If the newly switched user doesn't have permission to manage users and we're in the users tab, redirect to dashboard
    const perms = user.permissions || getDefaultPermissions(user.role);
    if (!perms.canManageUsers && activeView === 'users') {
      setActiveView('dashboard');
    }
  };

  // Lead CRUD handlers
  const handleSaveLead = async (formData: LeadFormData, leadId?: string) => {
    if (leadId) {
      // Update
      const res = await updateLeadRecord(leadId, formData);
      if (res.success && res.lead) {
        const updatedItem = res.lead;
        setLeads((prev) => prev.map((l) => (l.id === leadId ? updatedItem : l)));
        showToast('Lead details updated successfully!');
        await loadData();
      } else {
        showToast(res.error || 'Failed to update lead details', 'error');
      }
    } else {
      // Create
      const res = await createLeadRecord(formData);
      if (res.lead) {
        setLeads((prev) => [res.lead, ...prev.filter((l) => l.id !== res.lead.id)]);
        showToast(`New Solar Lead "${formData.customer_name}" stored successfully!`, 'success');
        await loadData();
      } else {
        showToast(res.error || 'Failed to create lead', 'error');
      }
    }
  };

  const handleUpdateStatus = async (leadId: string, status: LeadStatus) => {
    // When changing status to 'Inprogress', trigger the dedicated modal asking for Next Follow Up Date & Time, Notes, and Special Instructions as mandatory
    if (status === 'Inprogress') {
      const targetLead = leads.find((l) => l.id === leadId);
      if (targetLead) {
        setInProgressModalLead(targetLead);
        return;
      }
    }

    const res = await updateLeadRecord(leadId, { lead_status: status });
    if (res.success) {
      showToast(`Status updated to "${status}"`);
      await loadData();
    }
  };

  const handleConfirmInProgress = async (
    leadId: string,
    followUpDateTime: string,
    notes: string,
    specialInstructions: string,
    requiredKw?: string,
    requiredProduct?: RequiredProduct | '',
    requiredLoan?: boolean,
    requiredFreeSiteVisit?: boolean
  ) => {
    const updates: Partial<LeadFormData> = {
      lead_status: 'Inprogress',
      next_follow_up: followUpDateTime,
      notes: notes,
      special_instructions: specialInstructions,
    };
    if (requiredKw !== undefined) updates.required_kw = requiredKw;
    if (requiredProduct !== undefined) updates.required_product = requiredProduct;
    if (requiredLoan !== undefined) updates.required_loan = requiredLoan;
    if (requiredFreeSiteVisit !== undefined) updates.required_free_site_visit = requiredFreeSiteVisit;

    const res = await updateLeadRecord(leadId, updates);

    if (res.success) {
      showToast('Lead transitioned to Inprogress with specifications & scheduled follow-up!');
      await loadData();
    }
  };

  const handleConfirmUpdateLeadModal = async (
    leadId: string,
    newStatus: LeadStatus,
    followUpDateTime: string,
    newConversationNote: string,
    newSpecialInstruction: string,
    requiredKw?: string,
    requiredProduct?: RequiredProduct | '',
    requiredLoan?: boolean,
    requiredFreeSiteVisit?: boolean,
    siteSurveyRequestedDate?: string,
    siteSurveyCompletedDate?: string
  ) => {
    const targetLead = leads.find((l) => l.id === leadId);
    if (!targetLead) return;

    const authorName = currentUser?.name || targetLead.responsible || 'System User';
    const nowIso = new Date().toISOString();

    // Create timestamped history entry for Conversation Note
    const conversationEntry: NoteEntry = {
      id: 'cn-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      type: 'conversation_note',
      text: newConversationNote,
      created_at: nowIso,
      author: authorName,
      lead_status: newStatus,
    };

    // Create timestamped history entry for Special Instruction
    const instructionEntry: NoteEntry = {
      id: 'si-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      type: 'special_instruction',
      text: newSpecialInstruction,
      created_at: nowIso,
      author: authorName,
      lead_status: newStatus,
    };

    // Existing histories
    const prevConversationHistory = targetLead.conversation_notes_history || (
      targetLead.notes ? [{
        id: 'initial-cn-' + targetLead.id,
        type: 'conversation_note' as const,
        text: targetLead.notes,
        created_at: targetLead.created_at || nowIso,
        author: targetLead.responsible || 'System',
        lead_status: targetLead.lead_status,
      }] : []
    );

    const prevInstructionHistory = targetLead.special_instructions_history || (
      targetLead.special_instructions ? [{
        id: 'initial-si-' + targetLead.id,
        type: 'special_instruction' as const,
        text: targetLead.special_instructions,
        created_at: targetLead.created_at || nowIso,
        author: targetLead.responsible || 'System',
        lead_status: targetLead.lead_status,
      }] : []
    );

    const updatedConversationHistory = [conversationEntry, ...prevConversationHistory];
    const updatedInstructionHistory = [instructionEntry, ...prevInstructionHistory];

    const updates: Partial<LeadFormData> = {
      lead_status: newStatus,
      next_follow_up: followUpDateTime,
      site_survey_requested_date: siteSurveyRequestedDate || targetLead.site_survey_requested_date,
      site_survey_completed_date: siteSurveyCompletedDate || targetLead.site_survey_completed_date,
      notes: newConversationNote, // latest note
      special_instructions: newSpecialInstruction, // latest instruction
      conversation_notes_history: updatedConversationHistory,
      special_instructions_history: updatedInstructionHistory,
    };
    if (requiredKw !== undefined) updates.required_kw = requiredKw;
    if (requiredProduct !== undefined) updates.required_product = requiredProduct;
    if (requiredLoan !== undefined) updates.required_loan = requiredLoan;
    if (requiredFreeSiteVisit !== undefined) updates.required_free_site_visit = requiredFreeSiteVisit;

    const res = await updateLeadRecord(leadId, updates);

    if (res.success) {
      showToast(`Lead "${targetLead.customer_name}" updated with progress notes & specifications!`, 'success');
      await loadData();
    } else {
      throw new Error(res.error || 'Failed to update lead record');
    }
  };

  const handleDeleteLead = async (leadId: string) => {
    if (!currentUserPermissions.canDeleteLead) {
      showToast('Permission denied: You do not have permission to delete leads', 'error');
      return;
    }
    const res = await deleteLeadRecord(leadId);
    if (res.success) {
      showToast('Lead removed from CRM', 'info');
      await loadData();
    }
  };

  const handleBulkImport = async (importedLeads: LeadFormData[]) => {
    const res = await bulkInsertLeadRecords(importedLeads);
    showToast(`Bulk imported ${res.count} leads successfully!`);
    await loadData();
  };

  const handleReschedule = async (leadId: string, newDateTime: string, notes?: string) => {
    const updates: Partial<LeadFormData> = { next_follow_up: newDateTime };
    if (notes) {
      const currentLead = leads.find((l) => l.id === leadId);
      updates.notes = currentLead?.notes ? `${currentLead.notes} | ${notes}` : notes;
    }
    const res = await updateLeadRecord(leadId, updates);
    if (res.success) {
      showToast('Follow-up rescheduled successfully!');
      await loadData();
    }
  };

  const handleExportExcel = () => {
    if (!currentUserPermissions.canAccessExcel) {
      showToast('Permission denied: Excel export is restricted for your account', 'error');
      return;
    }
    if (accessibleLeads.length === 0) {
      showToast('No leads available to export', 'info');
      return;
    }
    const dateStr = new Date().toISOString().split('T')[0];
    exportLeadsToExcel(accessibleLeads, `Solar_CRM_Leads_${dateStr}.xlsx`);
    showToast(`Exported ${accessibleLeads.length} leads to Excel!`);
  };

  const handleExportFilteredExcel = (filteredLeads: Lead[]) => {
    if (!currentUserPermissions.canAccessExcel) {
      showToast('Permission denied: Excel export is restricted for your account', 'error');
      return;
    }
    if (filteredLeads.length === 0) {
      showToast('No leads match current filters', 'info');
      return;
    }
    const dateStr = new Date().toISOString().split('T')[0];
    exportLeadsToExcel(filteredLeads, `Solar_CRM_Filtered_Leads_${dateStr}.xlsx`);
    showToast(`Exported ${filteredLeads.length} filtered leads to Excel!`);
  };

  // User CRUD handlers
  const handleSaveUser = async (formData: UserFormData, userId?: string) => {
    if (userId) {
      const res = await updateUserRecord(userId, formData);
      if (res.success) {
        showToast('User profile updated successfully!');
        await loadData();
      }
    } else {
      const res = await createUserRecord(formData);
      showToast(`User "${res.user.name}" created successfully!`);
      await loadData();
    }
  };

  const handleToggleUserStatus = async (user: AppUser) => {
    const newStatus = user.status === 'Active' ? 'Inactive' : 'Active';
    const res = await updateUserRecord(user.id, { status: newStatus });
    if (res.success) {
      showToast(`User status set to ${newStatus}`);
      await loadData();
    }
  };

  const handleDeleteUser = async (userId: string) => {
    const res = await deleteUserRecord(userId);
    if (res.success) {
      showToast('User removed from directory', 'info');
      await loadData();
    }
  };

  // Daily Activity Report CRUD handlers
  const handleAddDailyReport = async (formData: DailyActivityFormData) => {
    const res = await createDailyActivityReport(formData);
    if (res.success) {
      showToast(`Activity for "${formData.customer_name}" logged successfully!`);
      await loadData();
    } else {
      showToast(res.error || 'Failed to save daily activity report', 'error');
    }
  };

  const handleUpdateDailyReport = async (
    id: string,
    updates: Partial<DailyActivityFormData> & { approved_by?: string; approved_at?: string }
  ) => {
    const res = await updateDailyActivityReport(id, updates);
    if (res.success) {
      showToast('Activity report updated successfully!');
      await loadData();
    } else {
      showToast(res.error || 'Failed to update daily activity report', 'error');
    }
  };

  const handleDeleteDailyReport = async (id: string) => {
    const res = await deleteDailyActivityReport(id);
    if (res.success) {
      showToast('Activity report removed', 'info');
      await loadData();
    } else {
      showToast(res.error || 'Failed to delete activity report', 'error');
    }
  };

  const handleBulkApproveDailyReports = async (ids: string[], approvalStatus: ManagerApprovalStatus) => {
    if (!currentUserPermissions.canManageUsers) {
      showToast('Access restricted: Only Admin accounts can update manager approval status.', 'error');
      return;
    }
    const adminName = `${currentUser?.name || 'Admin'} (Admin)`;
    const res = await bulkUpdateActivityReportApprovals(ids, approvalStatus, adminName);
    if (res.success) {
      showToast(`Updated approval status for ${res.count} reports to "${approvalStatus}"!`);
      await loadData();
    }
  };

  const handleFilterLeadsByRep = (repName: string) => {
    setFilterRepName(repName);
    setActiveView('leads');
  };

  const handleSelectStatusFilterFromDashboard = (
    status: string, 
    createdMonth?: string, 
    modifiedMonth?: string,
    createdExactDate?: string,
    modifiedExactDate?: string,
    repName?: string
  ) => {
    setFilterStatus(status as LeadStatus | 'ALL');
    setFilterSiteVisit('ALL');
    setFilterLoan('ALL');
    setFilterActivity('ALL');
    
    // Responsible Filter
    const targetRep = repName !== undefined 
      ? (repName === 'ALL' ? null : repName) 
      : (dashboardUserFilter !== 'ALL' ? dashboardUserFilter : null);
    setFilterRepName(targetRep);

    // Lead Created On Filter
    const targetCreatedExact = createdExactDate !== undefined ? createdExactDate : dashboardCreatedExactDateFilter;
    if (targetCreatedExact) {
      setFilterCreatedExactDate(targetCreatedExact);
      setFilterCreatedMonth(null);
      setFilterMonth(null);
    } else {
      setFilterCreatedExactDate(null);
      const targetCreated = createdMonth || dashboardCreatedMonthFilter;
      if (targetCreated && targetCreated !== 'ALL') {
        setFilterCreatedMonth(targetCreated);
        setFilterMonth(targetCreated);
      } else {
        setFilterCreatedMonth(null);
        setFilterMonth(null);
      }
    }

    // Lead Modified On Filter
    const targetModifiedExact = modifiedExactDate !== undefined ? modifiedExactDate : dashboardModifiedExactDateFilter;
    if (targetModifiedExact) {
      setFilterModifiedExactDate(targetModifiedExact);
      setFilterModifiedMonth(null);
    } else {
      setFilterModifiedExactDate(null);
      const targetModified = modifiedMonth || dashboardModifiedMonthFilter;
      if (targetModified && targetModified !== 'ALL') {
        setFilterModifiedMonth(targetModified);
      } else {
        setFilterModifiedMonth(null);
      }
    }

    setActiveView('leads');
  };

  const handleSelectSiteVisitFilterFromDashboard = (filter: 'YES' | 'NO' | 'ALL', createdMonth?: string) => {
    setFilterSiteVisit(filter);
    setFilterStatus('ALL');
    setFilterLoan('ALL');
    setFilterActivity('ALL');
    
    if (dashboardUserFilter !== 'ALL') {
      setFilterRepName(dashboardUserFilter);
    } else {
      setFilterRepName(null);
    }

    if (dashboardCreatedExactDateFilter) {
      setFilterCreatedExactDate(dashboardCreatedExactDateFilter);
      setFilterCreatedMonth(null);
      setFilterMonth(null);
    } else {
      setFilterCreatedExactDate(null);
      const targetCreated = createdMonth || dashboardCreatedMonthFilter;
      if (targetCreated && targetCreated !== 'ALL') {
        setFilterCreatedMonth(targetCreated);
        setFilterMonth(targetCreated);
      } else {
        setFilterCreatedMonth(null);
        setFilterMonth(null);
      }
    }

    setActiveView('leads');
  };

  const handleSelectLoanFilterFromDashboard = (filter: 'YES' | 'NO' | 'ALL', createdMonth?: string) => {
    setFilterLoan(filter);
    setFilterStatus('ALL');
    setFilterSiteVisit('ALL');
    setFilterActivity('ALL');
    
    if (dashboardUserFilter !== 'ALL') {
      setFilterRepName(dashboardUserFilter);
    } else {
      setFilterRepName(null);
    }

    if (dashboardCreatedExactDateFilter) {
      setFilterCreatedExactDate(dashboardCreatedExactDateFilter);
      setFilterCreatedMonth(null);
      setFilterMonth(null);
    } else {
      setFilterCreatedExactDate(null);
      const targetCreated = createdMonth || dashboardCreatedMonthFilter;
      if (targetCreated && targetCreated !== 'ALL') {
        setFilterCreatedMonth(targetCreated);
        setFilterMonth(targetCreated);
      } else {
        setFilterCreatedMonth(null);
        setFilterMonth(null);
      }
    }

    setActiveView('leads');
  };

  const handleSelectModifiedFilterFromDashboard = (
    modifiedMonth?: string, 
    createdMonth?: string,
    modifiedExactDate?: string,
    createdExactDate?: string,
    repName?: string
  ) => {
    setFilterActivity('MODIFIED_IN_MONTH');
    setFilterStatus('ALL');
    setFilterSiteVisit('ALL');
    setFilterLoan('ALL');
    
    const targetRep = repName !== undefined 
      ? (repName === 'ALL' ? null : repName) 
      : (dashboardUserFilter !== 'ALL' ? dashboardUserFilter : null);
    setFilterRepName(targetRep);

    const targetModifiedExact = modifiedExactDate !== undefined ? modifiedExactDate : dashboardModifiedExactDateFilter;
    if (targetModifiedExact) {
      setFilterModifiedExactDate(targetModifiedExact);
      setFilterModifiedMonth(null);
    } else {
      setFilterModifiedExactDate(null);
      const targetModified = modifiedMonth || dashboardModifiedMonthFilter;
      if (targetModified && targetModified !== 'ALL') {
        setFilterModifiedMonth(targetModified);
      } else {
        setFilterModifiedMonth(null);
      }
    }

    const targetCreatedExact = createdExactDate !== undefined ? createdExactDate : dashboardCreatedExactDateFilter;
    if (targetCreatedExact) {
      setFilterCreatedExactDate(targetCreatedExact);
      setFilterCreatedMonth(null);
      setFilterMonth(null);
    } else {
      setFilterCreatedExactDate(null);
      const targetCreated = createdMonth || dashboardCreatedMonthFilter;
      if (targetCreated && targetCreated !== 'ALL') {
        setFilterCreatedMonth(targetCreated);
        setFilterMonth(targetCreated);
      } else {
        setFilterCreatedMonth(null);
      }
    }

    setActiveView('leads');
  };

  const handleSelectFollowUpFilterFromDashboard = (filter: 'OVERDUE' | 'TODAY' | 'ALL') => {
    setActiveView('followups');
  };

  const handleViewAllLeadsForUser = (
    userName: string, 
    createdMonth?: string, 
    modifiedMonth?: string,
    createdExactDate?: string,
    modifiedExactDate?: string
  ) => {
    if (userName && userName !== 'ALL') {
      setFilterRepName(userName);
    } else {
      setFilterRepName(null);
    }

    setFilterStatus('ALL');
    setFilterSiteVisit('ALL');
    setFilterLoan('ALL');
    setFilterActivity('ALL');

    const targetCreatedExact = createdExactDate || dashboardCreatedExactDateFilter;
    if (targetCreatedExact) {
      setFilterCreatedExactDate(targetCreatedExact);
      setFilterCreatedMonth(null);
      setFilterMonth(null);
    } else {
      setFilterCreatedExactDate(null);
      const targetCreated = createdMonth || dashboardCreatedMonthFilter;
      if (targetCreated && targetCreated !== 'ALL') {
        setFilterCreatedMonth(targetCreated);
        setFilterMonth(targetCreated);
      } else {
        setFilterCreatedMonth(null);
        setFilterMonth(null);
      }
    }

    const targetModifiedExact = modifiedExactDate || dashboardModifiedExactDateFilter;
    if (targetModifiedExact) {
      setFilterModifiedExactDate(targetModifiedExact);
      setFilterModifiedMonth(null);
    } else {
      setFilterModifiedExactDate(null);
      const targetModified = modifiedMonth || dashboardModifiedMonthFilter;
      if (targetModified && targetModified !== 'ALL') {
        setFilterModifiedMonth(targetModified);
      } else {
        setFilterModifiedMonth(null);
      }
    }

    setActiveView('leads');
  };

  // If loading data, show full-screen loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-full border-3 border-blue-500/20 border-t-blue-500 animate-spin mb-4" />
        <p className="text-sm font-bold text-slate-200">Loading Kondaas Solar CRM...</p>
        <p className="text-xs text-slate-400 mt-1">Initializing PM Surya Ghar pipeline & user accounts</p>
      </div>
    );
  }

  // If not logged in, show the User Login Page
  if (!currentUser) {
    return (
      <>
        <LoginPage
          users={users}
          onLogin={handleLogin}
        />

        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-4 duration-150">
            <div className={`px-4 py-2.5 rounded-lg shadow-lg border flex items-center gap-2.5 text-xs font-bold ${
              toastMessage.type === 'error'
                ? 'bg-rose-900 text-rose-100 border-rose-800'
                : toastMessage.type === 'info'
                ? 'bg-slate-900 text-slate-100 border-slate-800'
                : 'bg-slate-900 text-slate-100 border-slate-800'
            }`}>
              <CheckCircle2 className="w-4 h-4 shrink-0 text-green-400" />
              <span>{toastMessage.text}</span>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex font-sans">
      
      {/* Persistent Left Sidebar (240px wide) */}
      <Sidebar
        activeView={activeView}
        setActiveView={(view) => {
          if (view !== 'leads') setFilterRepName(null);
          setActiveView(view);
        }}
        totalLeadsCount={accessibleLeads.length}
        totalUsersCount={users.length}
        overdueCount={overdueLeadsCount}
        activityReportsCount={accessibleDailyReports.length}
        canManageUsers={currentUserPermissions.canManageUsers}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Workspace Column */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Slim Top Bar (same dark navy gradient, logo, search, Excel, Supabase status, New Lead, User profile) */}
        <TopBar
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(true)}
          searchQuery={searchQuery}
          onSearchChange={(query) => {
            setSearchQuery(query);
            if (query.trim() && activeView !== 'leads') {
              setActiveView('leads');
            }
          }}
          supabaseConfig={supabaseConfig}
          onOpenSupabaseModal={() => {
            if (currentUserPermissions.canManageDatabase) {
              setIsSupabaseModalOpen(true);
            } else {
              showToast('Access restricted: Only Admin accounts can configure Supabase database.', 'error');
            }
          }}
          onOpenNewLeadModal={() => {
            setEditingLead(null);
            setIsLeadModalOpen(true);
          }}
          onOpenImportModal={() => setIsImportModalOpen(true)}
          onExportExcel={handleExportExcel}
          currentUser={currentUser}
          onLogout={handleLogout}
          canAccessExcel={currentUserPermissions.canAccessExcel}
          canManageUsers={currentUserPermissions.canManageUsers}
          canAddLead={currentUserPermissions.canAddLead}
          canManageDatabase={currentUserPermissions.canManageDatabase}
          onNavigateToUsers={() => setActiveView('users')}
        />

        {/* Main Content Area */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-20 md:pb-8">
          
          {/* Loading Spinner */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-10 h-10 rounded-full border-3 border-blue-200 border-t-blue-600 animate-spin mb-4" />
              <p className="text-xs font-semibold text-slate-600">Loading Solar CRM Data...</p>
            </div>
          ) : (
          <>
            {/* View 1: Admin Dashboard */}
            {activeView === 'dashboard' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                {/* Dashboard Stats & Conversion Rates */}
                <DashboardStats
                  leads={accessibleLeads}
                  users={users}
                  currentUser={currentUser}
                  selectedUserFilter={dashboardUserFilter}
                  onSelectUserFilter={setDashboardUserFilter}
                  selectedCreatedMonthFilter={dashboardCreatedMonthFilter}
                  onSelectCreatedMonthFilter={setDashboardCreatedMonthFilter}
                  selectedCreatedExactDateFilter={dashboardCreatedExactDateFilter}
                  onSelectCreatedExactDateFilter={setDashboardCreatedExactDateFilter}
                  selectedModifiedMonthFilter={dashboardModifiedMonthFilter}
                  onSelectModifiedMonthFilter={setDashboardModifiedMonthFilter}
                  selectedModifiedExactDateFilter={dashboardModifiedExactDateFilter}
                  onSelectModifiedExactDateFilter={setDashboardModifiedExactDateFilter}
                  selectedMonthFilter={dashboardMonthFilter}
                  onSelectMonthFilter={setDashboardMonthFilter}
                  onSelectStatusFilter={handleSelectStatusFilterFromDashboard}
                  onSelectFollowUpFilter={handleSelectFollowUpFilterFromDashboard}
                  onSelectSiteVisitFilter={handleSelectSiteVisitFilterFromDashboard}
                  onSelectLoanFilter={handleSelectLoanFilterFromDashboard}
                  onSelectModifiedFilter={handleSelectModifiedFilterFromDashboard}
                  onViewAllLeadsForUser={handleViewAllLeadsForUser}
                  onNavigateToUsers={() => setActiveView('users')}
                />
              </div>
            )}

            {/* View 2: Leads (Form & Table / Cards) */}
            {activeView === 'leads' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h1 className="text-xl font-bold text-slate-900 tracking-tight">Leads</h1>
                    <p className="text-xs text-slate-500">
                      {currentUserPermissions.accessAssignedLeadsOnly
                        ? `Viewing leads assigned to ${currentUser?.name || 'you'}`
                        : 'Filter, search, call, and manage your entire rooftop solar customer pipeline'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {currentUserPermissions.canManageUsers && (
                      <button
                        onClick={() => {
                          setEditingUser(null);
                          setIsUserModalOpen(true);
                        }}
                        className="px-3 py-2 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition-all flex items-center gap-1.5"
                      >
                        <UserPlus className="w-3.5 h-3.5 text-slate-500" />
                        <span>New Rep</span>
                      </button>
                    )}
                    {currentUserPermissions.canAddLead && (
                      <button
                        onClick={() => {
                          setEditingLead(null);
                          setIsLeadModalOpen(true);
                        }}
                        className="px-4 py-2 rounded-lg text-xs font-bold bg-[#FF0000] hover:bg-[#D60000] text-white transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Create New Lead</span>
                      </button>
                    )}
                  </div>
                </div>

                <LeadList
                  leads={accessibleLeads}
                  users={users}
                  currentUser={currentUser}
                  initialFilterRep={filterRepName}
                  initialFilterStatus={filterStatus}
                  initialFilterSiteVisit={filterSiteVisit}
                  initialFilterLoan={filterLoan}
                  initialFilterMonth={filterMonth}
                  initialFilterCreatedMonth={filterCreatedMonth}
                  initialFilterCreatedExactDate={filterCreatedExactDate}
                  initialFilterModifiedMonth={filterModifiedMonth}
                  initialFilterModifiedExactDate={filterModifiedExactDate}
                  initialActivityFilter={filterActivity}
                  externalSearchQuery={searchQuery}
                  canDeleteLead={currentUserPermissions.canDeleteLead}
                  canAddLead={currentUserPermissions.canAddLead}
                  canAccessExcel={currentUserPermissions.canAccessExcel}
                  onExportFiltered={handleExportFilteredExcel}
                  onEditLead={(lead) => {
                    setEditingLead(lead);
                    setIsLeadModalOpen(true);
                  }}
                  onOpenUpdateLeadModal={(lead) => {
                    setUpdateLeadTarget(lead);
                  }}
                  onDeleteLead={handleDeleteLead}
                  onUpdateStatus={handleUpdateStatus}
                  onOpenNewLeadModal={() => {
                    setEditingLead(null);
                    setIsLeadModalOpen(true);
                  }}
                />
              </div>
            )}

            {/* View 3: Follow-up Action Queue */}
            {activeView === 'followups' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-xl font-bold text-slate-900 tracking-tight">Follow-up Action Queue</h1>
                    <p className="text-xs text-slate-500">Overdue callbacks, today's schedule, and pending site visits</p>
                  </div>
                </div>

                <FollowUpAlerts
                  leads={accessibleLeads}
                  currentUser={currentUser}
                  onUpdateLeadStatus={handleUpdateStatus}
                  onRescheduleFollowUp={(lead) => setRescheduleLead(lead)}
                  onEditLead={(lead) => {
                    setEditingLead(lead);
                    setIsLeadModalOpen(true);
                  }}
                  onOpenUpdateLeadModal={(lead) => {
                    setUpdateLeadTarget(lead);
                  }}
                />
              </div>
            )}

            {/* View 4: Daily Activity Reports Module & Admin Dashboard */}
            {activeView === 'reports' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <DailyActivityReportModule
                  reports={accessibleDailyReports}
                  users={users}
                  leads={accessibleLeads}
                  currentUser={currentUser}
                  onAddReport={handleAddDailyReport}
                  onUpdateReport={handleUpdateDailyReport}
                  onDeleteReport={handleDeleteDailyReport}
                  onBulkApprove={handleBulkApproveDailyReports}
                  onRefresh={loadData}
                />
              </div>
            )}

            {/* View 5: Team & User Directory (Protected by canManageUsers) */}
            {activeView === 'users' && currentUserPermissions.canManageUsers && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <UserManagement
                  users={users}
                  leads={leads}
                  onOpenCreateUserModal={() => {
                    setEditingUser(null);
                    setIsUserModalOpen(true);
                  }}
                  onEditUser={(user) => {
                    setEditingUser(user);
                    setIsUserModalOpen(true);
                  }}
                  onDeleteUser={handleDeleteUser}
                  onToggleUserStatus={handleToggleUserStatus}
                  onFilterLeadsByRep={handleFilterLeadsByRep}
                />
              </div>
            )}
          </>
        )}
      </main>
      </div>

      {/* Floating Bottom Navigation for Mobile */}
      <div className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-slate-200 z-30 px-2 py-2 flex items-center justify-around shadow-sm">
        <button
          onClick={() => setActiveView('dashboard')}
          className={`flex flex-col items-center gap-0.5 text-[10px] font-bold ${
            activeView === 'dashboard' ? 'text-blue-600' : 'text-slate-500'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Dashboard</span>
        </button>
        <button
          onClick={() => setActiveView('leads')}
          className={`flex flex-col items-center gap-0.5 text-[10px] font-bold ${
            activeView === 'leads' ? 'text-blue-600' : 'text-slate-500'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Leads</span>
        </button>
        <button
          onClick={() => setActiveView('followups')}
          className={`flex flex-col items-center gap-0.5 text-[10px] font-bold ${
            activeView === 'followups' ? 'text-blue-600' : 'text-slate-500'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Queue</span>
        </button>
        <button
          onClick={() => setActiveView('reports')}
          className={`flex flex-col items-center gap-0.5 text-[10px] font-bold ${
            activeView === 'reports' ? 'text-blue-600' : 'text-slate-500'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          <span>Reports</span>
        </button>
        {currentUserPermissions.canManageUsers && (
          <button
            onClick={() => setActiveView('users')}
            className={`flex flex-col items-center gap-0.5 text-[10px] font-bold ${
              activeView === 'users' ? 'text-blue-600' : 'text-slate-500'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>Team</span>
          </button>
        )}
        {currentUserPermissions.canAddLead && (
          <button
            onClick={() => {
              setEditingLead(null);
              setIsLeadModalOpen(true);
            }}
            className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-sm"
          >
            <Plus className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-16 md:bottom-6 right-4 sm:right-6 z-50 animate-in fade-in slide-in-from-bottom-4 duration-150">
          <div className={`px-4 py-2.5 rounded-lg shadow-lg border flex items-center gap-2.5 text-xs font-bold ${
            toastMessage.type === 'error'
              ? 'bg-rose-900 text-rose-100 border-rose-800'
              : toastMessage.type === 'info'
              ? 'bg-slate-900 text-slate-100 border-slate-800'
              : 'bg-slate-900 text-slate-100 border-slate-800'
          }`}>
            <CheckCircle2 className="w-4 h-4 shrink-0 text-green-400" />
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Modals */}
      <LeadFormModal
        isOpen={isLeadModalOpen}
        onClose={() => setIsLeadModalOpen(false)}
        onSubmit={handleSaveLead}
        initialLead={editingLead}
        users={users}
        currentUser={currentUser}
        canEditContactDetails={currentUserPermissions.canEditContactDetails}
        onQuickCreateUser={() => {
          setEditingUser(null);
          setIsUserModalOpen(true);
        }}
      />

      <UserModal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        onSubmit={handleSaveUser}
        initialUser={editingUser}
      />

      <ExcelImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onBulkImport={handleBulkImport}
      />

      {currentUserPermissions.canManageDatabase && (
        <SupabaseConfigModal
          isOpen={isSupabaseModalOpen}
          onClose={() => setIsSupabaseModalOpen(false)}
          config={supabaseConfig}
          onSaveConfig={(cfg) => {
            setSupabaseConfig(cfg);
            showToast('Supabase configuration saved!');
          }}
          onSyncWithSupabase={loadData}
        />
      )}

      <RescheduleModal
        isOpen={!!rescheduleLead}
        onClose={() => setRescheduleLead(null)}
        lead={rescheduleLead}
        onSave={handleReschedule}
      />

      <InProgressStageModal
        isOpen={!!inProgressModalLead}
        onClose={() => setInProgressModalLead(null)}
        lead={inProgressModalLead}
        onConfirm={handleConfirmInProgress}
      />

      <UpdateLeadModal
        isOpen={!!updateLeadTarget}
        onClose={() => setUpdateLeadTarget(null)}
        lead={updateLeadTarget}
        onConfirmUpdate={handleConfirmUpdateLeadModal}
      />
    </div>
  );
}
