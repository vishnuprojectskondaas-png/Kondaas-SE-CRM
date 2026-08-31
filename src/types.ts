export type RoofType = string;

export type LeadStatus =
  | 'Open'
  | 'Inprogress'
  | 'No Response'
  | 'Busy Callback'
  | 'Scheduled Site Survey'
  | 'Site Survey Completed'
  | 'Order Confirmed'
  | 'Not Intrested'
  | 'Lost';

export type RequiredProduct = 'On-Grid' | 'Hybrid';

export const MANDATORY_KW_PRODUCT_STAGES: LeadStatus[] = [
  'Inprogress',
  'Scheduled Site Survey',
  'Site Survey Completed',
  'Order Confirmed',
];

export type UserRole =
  | 'Sales Representative'
  | 'Survey Engineer'
  | 'Branch Manager'
  | 'Telecaller'
  | 'Admin';

export interface UserPermissions {
  canAddLead: boolean;
  canEditContactDetails: boolean;
  canDeleteLead: boolean;
  canAccessExcel: boolean;
  canManageUsers: boolean;
  canManageDatabase?: boolean;
  accessAssignedLeadsOnly?: boolean;
}

export interface AppUser {
  id: string;
  name: string;
  username?: string;
  password?: string;
  email: string;
  mobile_number: string;
  role: UserRole;
  district: string;
  status: 'Active' | 'Inactive';
  created_at: string;
  avatar_color?: string;
  avatar_url?: string;
  permissions?: UserPermissions;
}

export type UserFormData = Omit<AppUser, 'id' | 'created_at'>;

export interface NoteEntry {
  id: string;
  type: 'conversation_note' | 'special_instruction';
  text: string;
  created_at: string; // ISO string with date and time
  author: string;
  lead_status?: LeadStatus;
}

export interface Lead {
  id: string;
  responsible: string;
  customer_name: string;
  mobile_number: string;
  district: string;
  sub_district: string;
  address: string;
  pincode: string;
  required_kw?: string;
  required_product?: RequiredProduct | '';
  required_loan: boolean;
  required_free_site_visit: boolean;
  avg_kseb_bill: string;
  roof_type: string;
  lead_status: LeadStatus;
  next_follow_up?: string | null; // ISO string YYYY-MM-DDTHH:mm
  site_survey_requested_date?: string | null;
  site_survey_completed_date?: string | null;
  notes?: string;
  special_instructions?: string;
  conversation_notes_history?: NoteEntry[];
  special_instructions_history?: NoteEntry[];
  created_at: string;
  updated_at?: string;
}

export type LeadFormData = Omit<Lead, 'id' | 'created_at' | 'updated_at'>;

export interface FilterOptions {
  searchQuery: string;
  statusFilter: string; // 'ALL' or specific LeadStatus
  productFilter: 'ALL' | 'On-Grid' | 'Hybrid';
  roofTypeFilter: string; // 'ALL' or specific RoofType
  districtFilter: string; // 'ALL' or specific District
  responsibleFilter: string; // 'ALL' or specific responsible name
  followUpFilter: 'ALL' | 'OVERDUE' | 'TODAY' | 'UPCOMING' | 'NONE';
  loanRequiredFilter: 'ALL' | 'YES' | 'NO';
  siteVisitFilter: 'ALL' | 'YES' | 'NO';
  monthFilter?: string; // 'ALL' or 'YYYY-MM'
  createdMonthFilter?: string; // 'ALL' or 'YYYY-MM'
  createdExactDateFilter?: string; // '' or 'YYYY-MM-DD'
  modifiedMonthFilter?: string; // 'ALL' or 'YYYY-MM'
  modifiedExactDateFilter?: string; // '' or 'YYYY-MM-DD'
  activityFilter?: 'ALL' | 'MODIFIED_IN_MONTH';
  sortBy: 'updated_desc' | 'updated_asc' | 'created_desc' | 'created_asc' | 'followup_asc' | 'followup_desc' | 'bill_desc' | 'name_asc';
}

export interface DashboardMetrics {
  totalLeads: number;
  statusCounts: Record<LeadStatus, number>;
  siteSurveyCompletedRate: number; // in percentage
  orderConfirmedRate: number; // in percentage
  overdueFollowUpsCount: number;
  todayFollowUpsCount: number;
  upcomingFollowUpsCount: number;
  totalKsebRevenueOpportunity: number;
  loanRequestedCount: number;
  freeSiteVisitRequestedCount: number;
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  tableName: string;
  isConnected: boolean;
}

export type ActivityType = 'Site Survey' | 'Cold Calling' | 'KSEB AF Payment' | 'KSEB RF payment' | 'KSEB Doccuments submission' | 'Other';
export type LeadAssignedType = 'Office' | 'Own';
export type ActivityStatus = 'Completed' | 'Pending' | 'Cancelled' | 'Planned' | 'Started';
export type ManagerApprovalStatus = 'Approved' | 'Not Approved';

export interface DailyActivityReport {
  id: string;
  planned_date_time: string; // ISO format or YYYY-MM-DDTHH:mm
  activity: ActivityType;
  customer_name: string;
  mobile_number: string;
  lead_assigned: LeadAssignedType;
  status: ActivityStatus;
  completed_date_time?: string | null; // ISO format or YYYY-MM-DDTHH:mm
  manager_approval_status: ManagerApprovalStatus;
  executive_name: string;
  executive_id?: string;
  lead_id?: string;
  advance_payment_status?: 'Collected' | 'Not Paid' | null;
  remarks?: string;
  approved_by?: string;
  approved_at?: string;
  created_at: string;
  updated_at?: string;
}

export type DailyActivityFormData = Omit<DailyActivityReport, 'id' | 'created_at' | 'updated_at'>;

export interface ActivityReportFilterOptions {
  dateMode: 'exact' | 'weekly' | 'monthly' | 'all';
  exactDate: string; // YYYY-MM-DD
  weekOffset: number; // 0 = this week, -1 = last week, etc.
  weekStartDate?: string; // YYYY-MM-DD
  weekEndDate?: string; // YYYY-MM-DD
  month: string; // YYYY-MM or 'ALL'
  activity: 'ALL' | ActivityType;
  leadAssigned: 'ALL' | LeadAssignedType;
  status: 'ALL' | ActivityStatus;
  approvalStatus: 'ALL' | ManagerApprovalStatus;
  executive: string; // 'ALL' or specific name
  searchQuery: string;
}


