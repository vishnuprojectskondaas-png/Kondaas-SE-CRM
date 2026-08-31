import React, { useState, useEffect } from 'react';
import { 
  X, 
  Calendar, 
  Clock, 
  User, 
  Phone, 
  Briefcase, 
  CheckCircle2, 
  AlertCircle, 
  XCircle, 
  ShieldCheck, 
  FileText,
  Building,
  UserCheck,
  Search,
  Sparkles,
  Lock,
  Trash2, IndianRupee
} from 'lucide-react';
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
import { ACTIVITY_TYPES, LEAD_ASSIGNED_TYPES, ACTIVITY_STATUSES, APPROVAL_STATUSES } from '../lib/mockData';

interface DailyActivityReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: DailyActivityFormData) => Promise<boolean | void>;
  onDelete?: (id: string) => Promise<boolean | void>;
  editingReport: DailyActivityReport | null;
  currentUser: AppUser | null;
  users: AppUser[];
  leads: Lead[];
}

export const DailyActivityReportModal: React.FC<DailyActivityReportModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  editingReport,
  currentUser,
  users,
  leads,
}) => {
  const isAdmin = currentUser?.role === 'Admin';

  // Helper to format ISO to datetime-local string (YYYY-MM-DDTHH:mm)
  const formatForDateTimeInput = (dateInput?: string | null): string => {
    if (!dateInput) return '';
    try {
      if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(dateInput)) {
        return dateInput.substring(0, 16);
      }
      const d = new Date(dateInput);
      if (!isNaN(d.getTime())) {
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        const hh = String(d.getHours()).padStart(2, '0');
        const min = String(d.getMinutes()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
      }
    } catch {
      // fallback
    }
    return '';
  };

  const getInitialNowDateTime = () => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
  };

  const [formData, setFormData] = useState<DailyActivityFormData>({
    planned_date_time: getInitialNowDateTime(),
    activity: 'Site Survey',
    customer_name: '',
    mobile_number: '',
    lead_assigned: 'Office',
    status: 'Pending',
    completed_date_time: '',
    manager_approval_status: 'Not Approved',
    executive_name: currentUser?.name || 'Rajesh Kumar',
    executive_id: currentUser?.id,
    remarks: '',
  });

  const [searchLeadQuery, setSearchLeadQuery] = useState('');
  const [showLeadPicker, setShowLeadPicker] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editingReport) {
      setFormData({
        planned_date_time: formatForDateTimeInput(editingReport.planned_date_time),
        activity: editingReport.activity,
        customer_name: editingReport.customer_name,
        mobile_number: editingReport.mobile_number,
        lead_assigned: editingReport.lead_assigned,
        status: editingReport.status,
        completed_date_time: formatForDateTimeInput(editingReport.completed_date_time),
        manager_approval_status: editingReport.manager_approval_status,
        executive_name: editingReport.executive_name,
        executive_id: editingReport.executive_id,
        lead_id: editingReport.lead_id,
        remarks: editingReport.remarks || '',
        approved_by: editingReport.approved_by,
        approved_at: editingReport.approved_at,
      });
    } else {
      setFormData({
        planned_date_time: getInitialNowDateTime(),
        activity: 'Site Survey',
        customer_name: '',
        mobile_number: '',
        lead_assigned: 'Office',
        status: 'Pending',
        completed_date_time: '',
        manager_approval_status: 'Not Approved',
        executive_name: currentUser?.name || (users[0]?.name ?? 'Rajesh Kumar'),
        executive_id: currentUser?.id || users[0]?.id,
        remarks: '',
      });
    }
    setErrors({});
    setSearchLeadQuery('');
    setShowLeadPicker(false);
  }, [editingReport, currentUser, users, isOpen]);

  if (!isOpen) return null;

  const filteredLeads = searchLeadQuery.trim()
    ? leads.filter(
        (l) =>
          l.customer_name.toLowerCase().includes(searchLeadQuery.toLowerCase()) ||
          l.mobile_number.includes(searchLeadQuery) ||
          l.district.toLowerCase().includes(searchLeadQuery.toLowerCase())
      ).slice(0, 6)
    : leads.slice(0, 6);

  const handleSelectLead = (lead: Lead) => {
    setFormData((prev) => ({
      ...prev,
      customer_name: lead.customer_name,
      mobile_number: lead.mobile_number,
      lead_id: lead.id,
      executive_name: isAdmin ? (lead.responsible || prev.executive_name) : (currentUser?.name || prev.executive_name),
      executive_id: isAdmin ? (users.find((u) => u.name === lead.responsible)?.id || prev.executive_id) : (currentUser?.id || prev.executive_id),
      remarks: prev.remarks || `Linked with Lead ID #${lead.id} (${lead.district})`,
    }));
    setShowLeadPicker(false);
    setSearchLeadQuery('');
  };

  const handleStatusChange = (newStatus: ActivityStatus) => {
    setFormData((prev) => {
      const updates: Partial<DailyActivityFormData> = { status: newStatus };
      if (newStatus === 'Completed' && !prev.completed_date_time) {
        updates.completed_date_time = getInitialNowDateTime();
      } else if (newStatus !== 'Completed') {
        updates.completed_date_time = '';
      }
      return { ...prev, ...updates };
    });
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.planned_date_time) {
      newErrors.planned_date_time = 'Planned Date & Time is required';
    }
    if (!formData.activity) {
      newErrors.activity = 'Activity is required';
    }
    if (formData.status === 'Completed' && !formData.advance_payment_status) {
      newErrors.advance_payment_status = 'Advance Payment Status is mandatory';
    }
    if (!formData.customer_name.trim()) {
      newErrors.customer_name = 'Customer Name is required';
    }
    if (!formData.mobile_number.trim()) {
      newErrors.mobile_number = 'Mobile Number is required';
    }
    if (!formData.lead_assigned) {
      newErrors.lead_assigned = 'Lead Assigned type is required';
    }
    if (!formData.status) {
      newErrors.status = 'Status is required';
    }
    if (formData.status === 'Completed' && !formData.completed_date_time) {
      newErrors.completed_date_time = 'Completed Date & Time is required for completed activities';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      // If admin approved, set approval metadata if not already present
      const submissionData: DailyActivityFormData = {
        ...formData,
        approved_by: formData.manager_approval_status === 'Approved' 
          ? (formData.approved_by || `${currentUser?.name || 'Admin'} (Admin)`)
          : undefined,
        approved_at: formData.manager_approval_status === 'Approved'
          ? (formData.approved_at || new Date().toISOString())
          : undefined,
      };

      await onSave(submissionData);
      onClose();
    } catch (err) {
      console.error('Error saving daily activity report:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="px-6 py-4.5 bg-[#0E2429] text-white flex items-center justify-between border-b border-[#BBD5DA]/20 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#DFF1F1]/15 border border-[#BBD5DA]/30 flex items-center justify-center text-white shadow-xs">
              <Briefcase className="w-5 h-5 text-[#FF0000]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                {editingReport ? 'Edit Daily Activity Report' : 'Log New Daily Activity Report'}
              </h2>
              <p className="text-xs text-[#BBD5DA]">
                {editingReport ? `Report ID: ${editingReport.id}` : 'Record field task, survey, documentation, or cold calling'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/70 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
          
          {/* Quick Lead Auto-Fill Picker */}
          {!editingReport && leads.length > 0 && (
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  Auto-Fill from Existing Lead
                </span>
                <button
                  type="button"
                  onClick={() => setShowLeadPicker(!showLeadPicker)}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                >
                  {showLeadPicker ? 'Hide Lead Picker' : 'Select Customer Lead'}
                </button>
              </div>

              {showLeadPicker && (
                <div className="space-y-2 pt-1.5 animate-in fade-in duration-150">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search customer name, phone, or district..."
                      value={searchLeadQuery}
                      onChange={(e) => setSearchLeadQuery(e.target.value)}
                      className="w-full pl-8.5 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-36 overflow-y-auto pr-1">
                    {filteredLeads.map((lead) => (
                      <button
                        key={lead.id}
                        type="button"
                        onClick={() => handleSelectLead(lead)}
                        className="text-left p-2 rounded-lg bg-white border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 transition-all text-xs flex flex-col justify-between cursor-pointer"
                      >
                        <div className="font-bold text-slate-800 truncate">{lead.customer_name}</div>
                        <div className="text-[11px] text-slate-500 flex items-center justify-between mt-0.5">
                          <span>{lead.mobile_number}</span>
                          <span className="text-slate-400">{lead.district}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Planned Date & Time + Activity */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Planned Date & Time */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                Planned Date & Time <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                value={formData.planned_date_time}
                onChange={(e) => setFormData({ ...formData, planned_date_time: e.target.value })}
                className={`w-full px-3 py-2 text-xs font-semibold rounded-lg border ${
                  errors.planned_date_time ? 'border-red-500 bg-red-50/30' : 'border-slate-300 focus:border-blue-500'
                } focus:outline-none focus:ring-1 focus:ring-blue-500`}
              />
              {errors.planned_date_time && (
                <p className="text-[11px] text-red-600 mt-1 font-medium">{errors.planned_date_time}</p>
              )}
            </div>

            {/* Activity Type */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-indigo-600" />
                Activity <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.activity}
                onChange={(e) => setFormData({ ...formData, activity: e.target.value as ActivityType })}
                className={`w-full px-3 py-2 text-xs font-bold rounded-lg border ${
                  errors.activity ? 'border-red-500 bg-red-50/30' : 'border-slate-300 focus:border-indigo-500'
                } bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500`}
              >
                {ACTIVITY_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              {errors.activity && (
                <p className="text-[11px] text-red-600 mt-1 font-medium">{errors.activity}</p>
              )}
            </div>
          </div>

          {/* Customer Name & Mobile Number */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Customer Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-600" />
                Customer Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Dr. Madhavan Nair"
                value={formData.customer_name}
                onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                className={`w-full px-3 py-2 text-xs font-medium rounded-lg border ${
                  errors.customer_name ? 'border-red-500 bg-red-50/30' : 'border-slate-300 focus:border-blue-500'
                } focus:outline-none focus:ring-1 focus:ring-blue-500`}
              />
              {errors.customer_name && (
                <p className="text-[11px] text-red-600 mt-1 font-medium">{errors.customer_name}</p>
              )}
            </div>

            {/* Mobile Number */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-emerald-600" />
                Mobile Number <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                placeholder="e.g. +919447123456"
                value={formData.mobile_number}
                onChange={(e) => setFormData({ ...formData, mobile_number: e.target.value })}
                className={`w-full px-3 py-2 text-xs font-medium rounded-lg border ${
                  errors.mobile_number ? 'border-red-500 bg-red-50/30' : 'border-slate-300 focus:border-blue-500'
                } focus:outline-none focus:ring-1 focus:ring-blue-500`}
              />
              {errors.mobile_number && (
                <p className="text-[11px] text-red-600 mt-1 font-medium">{errors.mobile_number}</p>
              )}
            </div>
          </div>

          {/* Lead Assigned (Office / Own) & Executive */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Lead Assigned: Office / Own */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-purple-600" />
                Lead Assigned <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {LEAD_ASSIGNED_TYPES.map((type) => {
                  const isSelected = formData.lead_assigned === type;
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setFormData({ ...formData, lead_assigned: type })}
                      className={`py-2 px-3 rounded-lg border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        isSelected
                          ? type === 'Office'
                            ? 'bg-purple-50 text-purple-900 border-purple-300 shadow-xs'
                            : 'bg-teal-50 text-teal-900 border-teal-300 shadow-xs'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {type === 'Office' ? <Building className="w-3.5 h-3.5 text-purple-600" /> : <UserCheck className="w-3.5 h-3.5 text-teal-600" />}
                      <span>{type}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Executive / Staff */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-600" />
                Responsible Executive
              </label>
              {isAdmin ? (
                <select
                  value={formData.executive_name}
                  onChange={(e) => {
                    const rep = users.find((u) => u.name === e.target.value);
                    setFormData({
                      ...formData,
                      executive_name: e.target.value,
                      executive_id: rep?.id,
                    });
                  }}
                  className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                >
                  {users.length > 0 ? (
                    users.map((u) => (
                      <option key={u.id} value={u.name}>
                        {u.name} ({u.role})
                      </option>
                    ))
                  ) : (
                    <option value={formData.executive_name}>{formData.executive_name}</option>
                  )}
                </select>
              ) : (
                <div className="w-full px-3 py-2 text-xs font-bold rounded-lg border border-blue-200 bg-blue-50/70 text-blue-950 flex items-center justify-between shadow-2xs">
                  <span className="truncate">{formData.executive_name} ({currentUser?.role || 'Executive'})</span>
                  <span className="text-[11px] font-semibold text-blue-700 flex items-center gap-1 shrink-0 ml-2">
                    <Lock className="w-3 h-3 text-blue-500" />
                    Your Account
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Status: Completed / Pending / Cancelled */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Activity Status <span className="text-red-500">*</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {ACTIVITY_STATUSES.map((st) => {
                const isSelected = formData.status === st;
                let colorClasses = 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50';
                if (isSelected) {
                  if (st === 'Completed') colorClasses = 'bg-emerald-50 text-emerald-900 border-emerald-400 font-bold shadow-xs';
                  if (st === 'Pending') colorClasses = 'bg-amber-50 text-amber-900 border-amber-400 font-bold shadow-xs';
                  if (st === 'Cancelled') colorClasses = 'bg-rose-50 text-rose-900 border-rose-400 font-bold shadow-xs';
                  if (st === 'Planned') colorClasses = 'bg-sky-50 text-sky-900 border-sky-400 font-bold shadow-xs';
                  if (st === 'Started') colorClasses = 'bg-indigo-50 text-indigo-900 border-indigo-400 font-bold shadow-xs';
                }

                return (
                  <button
                    key={st}
                    type="button"
                    onClick={() => handleStatusChange(st)}
                    className={`flex-1 min-w-[100px] py-2 px-2.5 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${colorClasses}`}
                  >
                    {st === 'Completed' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                    {st === 'Pending' && <Clock className="w-3.5 h-3.5 text-amber-600" />}
                    {st === 'Cancelled' && <XCircle className="w-3.5 h-3.5 text-rose-600" />}
                    {st === 'Planned' && <Calendar className="w-3.5 h-3.5 text-sky-600" />}
                    {st === 'Started' && <Briefcase className="w-3.5 h-3.5 text-indigo-600" />}
                    <span>{st}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Completed Date & Time (Highlighted when status is Completed) */}
          {formData.status === 'Completed' && (
            <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-1.5 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-emerald-700" />
                  Completed Date & Time <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, completed_date_time: getInitialNowDateTime() })}
                  className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 hover:underline cursor-pointer"
                >
                  Set to Current Time
                </button>
              </div>
              <input
                type="datetime-local"
                value={formData.completed_date_time || ''}
                onChange={(e) => setFormData({ ...formData, completed_date_time: e.target.value })}
                className={`w-full px-3 py-2 text-xs font-semibold rounded-lg border ${
                  errors.completed_date_time ? 'border-red-500 bg-white' : 'border-emerald-300 focus:border-emerald-600'
                } bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500`}
              />
              {errors.completed_date_time && (
                <p className="text-[11px] text-red-600 mt-1 font-medium">{errors.completed_date_time}</p>
              )}
            </div>
          )}

          {/* Manager Approval Status: Approved / Not Approved (Admin Only Edit Access) */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                Manager Approval Status
              </label>
              {!isAdmin && (
                <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 flex items-center gap-1">
                  <Lock className="w-3 h-3 text-amber-600" />
                  Admin Edit Access Only
                </span>
              )}
            </div>

            {isAdmin ? (
              <div className="grid grid-cols-2 gap-2 pt-1">
                {APPROVAL_STATUSES.map((appStatus) => {
                  const isSelected = formData.manager_approval_status === appStatus;
                  return (
                    <button
                      key={appStatus}
                      type="button"
                      onClick={() => setFormData({ ...formData, manager_approval_status: appStatus })}
                      className={`py-2 px-3 rounded-lg border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        isSelected
                          ? appStatus === 'Approved'
                            ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                            : 'bg-rose-100 text-rose-900 border-rose-300 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {appStatus === 'Approved' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5 text-rose-600" />}
                      <span>{appStatus}</span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="flex items-center justify-between bg-white px-3 py-2 rounded-lg border border-slate-200">
                <span className="text-xs font-semibold text-slate-600">Current Status:</span>
                <span
                  className={`px-2.5 py-1 rounded-md text-xs font-bold border ${
                    formData.manager_approval_status === 'Approved'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border-rose-200'
                  }`}
                >
                  {formData.manager_approval_status}
                </span>
              </div>
            )}

            {formData.approved_by && formData.manager_approval_status === 'Approved' && (
              <p className="text-[11px] text-slate-500 pt-0.5">
                Approved by: <span className="font-semibold text-slate-700">{formData.approved_by}</span>
              </p>
            )}
          </div>

          {/* Advance Payment Status */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <IndianRupee className="w-3.5 h-3.5 text-emerald-600" />
              Advance Payment Status {formData.status === 'Completed' && <span className="text-red-500">*</span>}
            </label>
            <div className="flex gap-3 mt-2">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 hover:text-slate-900 transition-colors">
                <input
                  type="radio"
                  name="advancePayment"
                  value="Collected"
                  checked={formData.advance_payment_status === 'Collected'}
                  onChange={(e) => setFormData({ ...formData, advance_payment_status: e.target.value as 'Collected' })}
                  className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                />
                Collected
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 hover:text-slate-900 transition-colors">
                <input
                  type="radio"
                  name="advancePayment"
                  value="Not Paid"
                  checked={formData.advance_payment_status === 'Not Paid'}
                  onChange={(e) => setFormData({ ...formData, advance_payment_status: e.target.value as 'Not Paid' })}
                  className="w-4 h-4 text-slate-600 focus:ring-slate-500"
                />
                Not Paid
              </label>
            </div>
            {errors.advance_payment_status && <p className="text-red-500 text-[10px] font-bold mt-1">{errors.advance_payment_status}</p>}
          </div>

          {/* Remarks / Field Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-600" />
              Remarks & Outcome Notes
            </label>
            <textarea
              rows={2}
              placeholder="Enter activity findings, shadow study notes, documentation status, or customer feedback..."
              value={formData.remarks || ''}
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
              className="w-full px-3 py-2 text-xs font-medium rounded-lg border border-slate-300 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

        </form>

        {/* Footer Buttons */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>

            {editingReport && onDelete && (
              <button
                type="button"
                disabled={isSubmitting}
                onClick={async () => {
                  if (window.confirm(`Are you sure you want to delete the activity report for "${editingReport.customer_name}"?`)) {
                    setIsSubmitting(true);
                    await onDelete(editingReport.id);
                    setIsSubmitting(false);
                    onClose();
                  }
                }}
                className="px-3 py-2 text-xs font-bold text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-200 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-5 py-2 text-xs font-bold bg-[#0E2429] hover:bg-[#1a3f47] text-white rounded-lg shadow-xs hover:shadow transition-all cursor-pointer flex items-center gap-2"
          >
            {isSubmitting ? (
              <span>Saving Report...</span>
            ) : (
              <span>{editingReport ? 'Update Activity Report' : 'Save Activity Report'}</span>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
