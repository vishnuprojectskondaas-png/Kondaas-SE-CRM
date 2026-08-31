import React, { useState, useEffect } from 'react';
import { 
  X, 
  User, 
  Phone, 
  MapPin, 
  IndianRupee, 
  Home, 
  Calendar, 
  Check, 
  AlertCircle, 
  Sun, 
  Sparkles,
  Zap,
  Info,
  UserPlus,
  Lock,
  MessageSquare
} from 'lucide-react';
import DatePicker from 'react-datepicker';
import { format } from 'date-fns';
import { Lead, LeadFormData, LeadStatus, RoofType, AppUser, MANDATORY_KW_PRODUCT_STAGES, RequiredProduct } from '../types';
import { 
  KERALA_DISTRICTS, 
  SUB_DISTRICTS_MAP, 
  ROOF_TYPES, 
  LEAD_STATUSES, 
  SALES_REPS,
  REQUIRED_PRODUCT_OPTIONS
} from '../lib/mockData';
import { formatDateTime } from '../lib/dateUtils';
import { estimateSolarFromBill } from '../lib/billUtils';

interface LeadFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: LeadFormData, leadId?: string) => Promise<void>;
  initialLead?: Lead | null;
  users?: AppUser[];
  currentUser?: AppUser | null;
  onQuickCreateUser?: () => void;
  canEditContactDetails?: boolean;
}

export const LeadFormModal: React.FC<LeadFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialLead,
  users = [],
  currentUser,
  onQuickCreateUser,
  canEditContactDetails = true,
}) => {
  const isAssignedOnly = Boolean(currentUser?.permissions?.accessAssignedLeadsOnly);
  const defaultRep = currentUser?.name || (users.length > 0 ? users[0].name : 'Rahul Nair');

  const [formData, setFormData] = useState<LeadFormData>({
    responsible: defaultRep,
    customer_name: '',
    mobile_number: '',
    district: 'Ernakulam',
    sub_district: 'Aluva',
    address: '',
    pincode: '',
    required_kw: '',
    required_product: '',
    required_loan: false,
    required_free_site_visit: true,
    avg_kseb_bill: '3500 / Bi-monthly',
    roof_type: 'Concrete Flat',
    lead_status: 'Open',
    next_follow_up: '',
    notes: '',
    special_instructions: '',
  });


  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync form when initialLead changes
  useEffect(() => {
    if (initialLead) {
      setFormData({
        responsible: initialLead.responsible || defaultRep,
        customer_name: initialLead.customer_name || '',
        mobile_number: initialLead.mobile_number || '',
        district: initialLead.district || 'Ernakulam',
        sub_district: initialLead.sub_district || '',
        address: initialLead.address || '',
        pincode: initialLead.pincode || '',
        required_kw: initialLead.required_kw || '',
        required_product: initialLead.required_product || '',
        required_loan: !!initialLead.required_loan,
        required_free_site_visit: !!initialLead.required_free_site_visit,
        avg_kseb_bill: String(initialLead.avg_kseb_bill || ''),
        roof_type: String(initialLead.roof_type || 'Concrete Flat'),
        lead_status: initialLead.lead_status || 'Open',
        next_follow_up: initialLead.next_follow_up ? initialLead.next_follow_up.substring(0, 16) : '',
        site_survey_requested_date: initialLead.site_survey_requested_date ? initialLead.site_survey_requested_date.substring(0, 16) : '',
        site_survey_completed_date: initialLead.site_survey_completed_date ? initialLead.site_survey_completed_date.substring(0, 16) : '',
        notes: initialLead.notes || '',
        special_instructions: initialLead.special_instructions || '',
      });
    } else {
      // Default new lead
      setFormData({
        responsible: defaultRep,
        customer_name: '',
        mobile_number: '',
        district: currentUser?.district && currentUser.district !== 'All Kerala' ? currentUser.district : 'Ernakulam',
        sub_district: 'Aluva',
        address: '',
        pincode: '',
        required_kw: '',
        required_product: '',
        required_loan: false,
        required_free_site_visit: true,
        avg_kseb_bill: '3500 / Bi-monthly',
        roof_type: 'Concrete Flat',
        lead_status: 'Open',
        next_follow_up: '',
        site_survey_requested_date: '',
        site_survey_completed_date: '',
        notes: '',
        special_instructions: '',
      });
    }
    setErrors({});
  }, [initialLead, isOpen, currentUser]);

  if (!isOpen) return null;

  // Calculate live Solar system estimate based on KSEB monthly/bi-monthly bill or range (e.g. 2000-4000)
  const billEstimate = estimateSolarFromBill(formData.avg_kseb_bill);

  const isMandatoryStage = MANDATORY_KW_PRODUCT_STAGES.includes(formData.lead_status);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (!formData.customer_name.trim()) {
      errs.customer_name = 'Customer Name is required';
    }

    if (!formData.mobile_number.trim()) {
      errs.mobile_number = 'Mobile Number is required';
    } else if (!/^[0-9+-\s()]{7,15}$/.test(formData.mobile_number.trim())) {
      errs.mobile_number = 'Please enter a valid phone number (e.g. 9847123456)';
    }

    // MANDATORY RULES FOR SPECIFIC STAGES: Inprogress, Scheduled Site Survey, Site Survey Completed, Order Confirmed
    if (isMandatoryStage) {
      if (!formData.required_kw || !formData.required_kw.trim()) {
        errs.required_kw = `Required KW is mandatory for "${formData.lead_status}" stage`;
      }
      if (!formData.required_product || !formData.required_product.trim()) {
        errs.required_product = `Required Product (On-Grid / Hybrid) is mandatory for "${formData.lead_status}" stage`;
      }
      if (formData.required_loan === undefined || formData.required_loan === null) {
        errs.required_loan = `Please select Bank Loan Assistance (Yes / No) for "${formData.lead_status}" stage`;
      }
      if (formData.required_free_site_visit === undefined || formData.required_free_site_visit === null) {
        errs.required_free_site_visit = `Please select Free Site Survey Visit (Yes / No) for "${formData.lead_status}" stage`;
      }
    }

    // MANDATORY RULES FOR INPROGRESS AND OTHER STATUSES
    if (formData.lead_status === 'Inprogress') {
      if (!formData.next_follow_up || !formData.next_follow_up.trim()) {
        errs.next_follow_up = 'Next Follow Up Date and Time is mandatory when stage is Inprogress';
      }
      if (!formData.notes || !formData.notes.trim()) {
        errs.notes = 'Notes are mandatory when stage is Inprogress';
      }
      if (!formData.special_instructions || !formData.special_instructions.trim()) {
        errs.special_instructions = 'Special Instructions are mandatory when stage is Inprogress';
      }
    } else if (
      formData.lead_status === 'Not Intrested' ||
      formData.lead_status === 'Lost'
    ) {
      // For Not Intrested and Lost, only Conversation Notes is mandatory (Next Follow Up and Special Instructions are optional)
      if (!formData.notes || !formData.notes.trim()) {
        errs.notes = `Conversation & Progress Notes are mandatory to record why lead is ${formData.lead_status}`;
      }
    } else if (
      formData.lead_status !== 'Open' && 
      formData.lead_status !== 'No Response'
    ) {
      if (!formData.next_follow_up || !formData.next_follow_up.trim()) {
        errs.next_follow_up = `Next Follow Up Date and Time is mandatory when status is "${formData.lead_status}"`;
      }
    }

    if (formData.lead_status === 'Scheduled Site Survey' && !formData.site_survey_requested_date) {
      errs.site_survey_requested_date = 'Site Survey Requested Date is required.';
    }
    if (formData.lead_status === 'Site Survey Completed' && !formData.site_survey_completed_date) {
      errs.site_survey_completed_date = 'Site Survey Completed Date is required.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const finalFormData = { ...formData };
      if (finalFormData.lead_status === 'No Response') {
        const d = new Date();
        d.setHours(d.getHours() + 4);
        finalFormData.next_follow_up = format(d, "yyyy-MM-dd'T'HH:mm:ss");
      }
      
      await onSubmit(finalFormData, initialLead ? initialLead.id : undefined);
      onClose();
    } catch (err: any) {
      setErrors({ form: err?.message || 'Failed to save lead. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const setPresetFollowUp = (hoursAhead: number) => {
    const d = new Date();
    d.setHours(d.getHours() + hoursAhead);
    const pad = (n: number) => (n < 10 ? '0' + n : n);
    const formatted = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    setFormData({ ...formData, next_follow_up: formatted });
    if (errors.next_follow_up) {
      setErrors({ ...errors, next_follow_up: '' });
    }
  };

  const subDistrictOptions = SUB_DISTRICTS_MAP[formData.district] || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white rounded-xl shadow-2xl border border-[#BBD5DA] overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-[linear-gradient(135deg,#0E2429_0%,#17343B_100%)] text-white p-5 sm:p-6 flex items-center justify-between border-b border-[#BBD5DA]/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#FF0000] text-white flex items-center justify-center font-bold shadow-xs">
              <Sun className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold">
                {initialLead ? 'Edit Solar Lead' : 'New Solar Lead'}
              </h2>
              <p className="text-xs text-[#BBD5DA]">
                {initialLead ? `Updating lead #${initialLead.id}` : 'Capture customer requirements and site feasibility'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          
          {errors.form && (
            <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errors.form}</span>
            </div>
          )}

          {/* Section 1: Customer & Assignee Details */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" />
                <span>Customer & Assignment</span>
              </h3>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Customer Name */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <span>Customer Name</span>
                  <span className="text-rose-500">*</span>
                  {initialLead && !canEditContactDetails && <Lock className="w-3 h-3 text-slate-400" />}
                </label>
                <input
                  id="input-customer-name"
                  type="text"
                  placeholder="e.g. Dr. George Mathew"
                  value={formData.customer_name}
                  disabled={Boolean(initialLead && !canEditContactDetails)}
                  onChange={(e) => {
                    setFormData({ ...formData, customer_name: e.target.value });
                    if (errors.customer_name) setErrors({ ...errors, customer_name: '' });
                  }}
                  className={`w-full px-3.5 py-2 rounded-lg text-sm border bg-slate-50/50 focus:bg-white transition-all disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed ${
                    errors.customer_name ? 'border-rose-400 ring-2 ring-rose-100' : 'border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
                  }`}
                />
                {errors.customer_name && (
                  <p className="mt-1 text-[11px] text-rose-600 font-medium">{errors.customer_name}</p>
                )}
              </div>

              {/* Responsible */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Responsible
                  </label>
                  {!isAssignedOnly && onQuickCreateUser && (
                    <button
                      type="button"
                      onClick={onQuickCreateUser}
                      className="text-[11px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-0.5"
                    >
                      <UserPlus className="w-3 h-3" />
                      <span>+ New Rep</span>
                    </button>
                  )}
                </div>
                {isAssignedOnly ? (
                  <div className="w-full px-3.5 py-2 rounded-lg text-sm border border-slate-200 bg-slate-100 text-slate-700 flex items-center justify-between">
                    <span className="font-semibold text-slate-800">{formData.responsible}</span>
                    <span className="text-[10px] font-bold bg-[#DFF1F1] text-[#0E2429] px-1.5 py-0.5 rounded border border-[#BBD5DA]">
                      Assigned to you
                    </span>
                  </div>
                ) : (
                  <select
                    id="select-responsible"
                    value={formData.responsible}
                    onChange={(e) => setFormData({ ...formData, responsible: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-lg text-sm border border-slate-300 bg-slate-50/50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    {users.length > 0 ? (
                      users.map((user) => (
                        <option key={user.id} value={user.name}>
                          {user.name} ({user.role}{user.status === 'Inactive' ? ' - Inactive' : ''})
                        </option>
                      ))
                    ) : (
                      SALES_REPS.map((rep) => (
                        <option key={rep} value={rep}>
                          {rep}
                        </option>
                      ))
                    )}
                    <option value="Unassigned">Unassigned</option>
                  </select>
                )}
              </div>

              {/* Mobile Number */}
              <div className="sm:col-span-2">
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-bold text-slate-700 flex items-center gap-1">
                    <span>Mobile Number</span>
                    <span className="text-rose-500">*</span>
                    {initialLead && !canEditContactDetails && <Lock className="w-3 h-3 text-slate-400" />}
                  </label>
                  {initialLead && formData.mobile_number && (
                    <div className="flex items-center gap-1.5">
                      <a
                        href={`tel:${formData.mobile_number}`}
                        title="Call"
                        className="flex items-center justify-center p-1 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm"
                      >
                        <Phone className="w-3 h-3" />
                      </a>
                      <a
                        href={(() => {
                          const cleanPhone = formData.mobile_number.replace(/[^0-9]/g, '');
                          const phoneWithCountry = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
                          const text = encodeURIComponent(
                            `Hello ${formData.customer_name}, Greetings from Solar CRM! We are following up regarding your Rooftop Solar Inquiry.`
                          );
                          return `https://wa.me/${phoneWithCountry}?text=${text}`;
                        })()}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="WhatsApp"
                        className="flex items-center justify-center p-1 rounded-md bg-green-500 text-white hover:bg-green-600 transition-colors shadow-sm"
                      >
                        <MessageSquare className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    id="input-mobile-number"
                    type="tel"
                    placeholder="+91 98471 23456"
                    value={formData.mobile_number}
                    disabled={Boolean(initialLead && !canEditContactDetails)}
                    onChange={(e) => {
                      setFormData({ ...formData, mobile_number: e.target.value });
                      if (errors.mobile_number) setErrors({ ...errors, mobile_number: '' });
                    }}
                    className={`w-full pl-9 pr-3.5 py-2 rounded-lg text-sm border bg-slate-50/50 focus:bg-white transition-all disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed ${
                      errors.mobile_number ? 'border-rose-400 ring-2 ring-rose-100' : 'border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
                    }`}
                  />
                </div>
                {errors.mobile_number && (
                  <p className="mt-1 text-[11px] text-rose-600 font-medium">{errors.mobile_number}</p>
                )}
              </div>

              {/* Pincode */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <span>Pincode</span>
                  {initialLead && !canEditContactDetails && <Lock className="w-3 h-3 text-slate-400" />}
                </label>
                <input
                  id="input-pincode"
                  type="text"
                  placeholder="683101"
                  value={formData.pincode}
                  disabled={Boolean(initialLead && !canEditContactDetails)}
                  onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-lg text-sm border border-slate-300 bg-slate-50/50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Location & Address */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" />
              <span>Location in Kerala</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* District */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <span>District</span>
                  {initialLead && !canEditContactDetails && <Lock className="w-3 h-3 text-slate-400" />}
                </label>
                <select
                  id="select-district"
                  value={formData.district}
                  disabled={Boolean(initialLead && !canEditContactDetails)}
                  onChange={(e) => {
                    const dist = e.target.value;
                    const subs = SUB_DISTRICTS_MAP[dist] || [];
                    setFormData({
                      ...formData,
                      district: dist,
                      sub_district: subs[0] || '',
                    });
                  }}
                  className="w-full px-3.5 py-2 rounded-lg text-sm border border-slate-300 bg-slate-50/50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                >
                  {KERALA_DISTRICTS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sub-District */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <span>Sub-District / Taluk</span>
                  {initialLead && !canEditContactDetails && <Lock className="w-3 h-3 text-slate-400" />}
                </label>
                {subDistrictOptions.length > 0 ? (
                  <select
                    id="select-subdistrict"
                    value={formData.sub_district}
                    disabled={Boolean(initialLead && !canEditContactDetails)}
                    onChange={(e) => setFormData({ ...formData, sub_district: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-lg text-sm border border-slate-300 bg-slate-50/50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                  >
                    {subDistrictOptions.map((sub) => (
                      <option key={sub} value={sub}>
                        {sub}
                      </option>
                    ))}
                    <option value="Other">Other</option>
                  </select>
                ) : (
                  <input
                    type="text"
                    placeholder="Enter Sub-District"
                    value={formData.sub_district}
                    disabled={Boolean(initialLead && !canEditContactDetails)}
                    onChange={(e) => setFormData({ ...formData, sub_district: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-lg text-sm border border-slate-300 bg-slate-50/50 focus:bg-white disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                  />
                )}
              </div>

              {/* Full Address */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <span>Address & Landmarks</span>
                  {initialLead && !canEditContactDetails && <Lock className="w-3 h-3 text-slate-400" />}
                </label>
                <input
                  id="input-address"
                  type="text"
                  placeholder="House Name/No., Street, Landmarks"
                  value={formData.address}
                  disabled={Boolean(initialLead && !canEditContactDetails)}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-lg text-sm border border-slate-300 bg-slate-50/50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Solar Technical Details & KSEB Bill */}
          <div className="bg-slate-50 p-4 sm:p-5 rounded-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-blue-600" />
                <span>Solar & Site Feasibility</span>
              </h3>
              {isMandatoryStage && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 text-rose-500" />
                  Required KW & Product Mandatory for {formData.lead_status}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Required KW */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span>
                    Required KW {isMandatoryStage ? <span className="text-rose-600 font-bold ml-0.5">*(Mandatory)</span> : <span className="text-slate-400 font-normal ml-0.5">(Optional)</span>}
                  </span>
                  {formData.required_kw && (
                    <span className="text-[10.5px] font-bold text-blue-600">{formData.required_kw}</span>
                  )}
                </label>
                <div className="relative">
                  <input
                    id="input-required-kw"
                    type="text"
                    placeholder="e.g. 5 kW, 3, 10"
                    value={formData.required_kw || ''}
                    onChange={(e) => {
                      setFormData({ ...formData, required_kw: e.target.value });
                      if (errors.required_kw) setErrors({ ...errors, required_kw: '' });
                    }}
                    className={`w-full px-3.5 py-2 rounded-lg text-sm font-semibold border bg-white ${
                      errors.required_kw 
                        ? 'border-rose-500 ring-2 ring-rose-100' 
                        : 'border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
                    }`}
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400 text-xs font-bold">
                    kW
                  </div>
                </div>
                {errors.required_kw && (
                  <p className="mt-1 text-xs text-rose-600 font-semibold flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{errors.required_kw}</span>
                  </p>
                )}
                {/* Quick KW Chips */}
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {['3 kW', '5 kW', '8 kW', '10 kW', '15 kW'].map((kw) => (
                    <button
                      key={kw}
                      type="button"
                      onClick={() => {
                        setFormData({ ...formData, required_kw: kw });
                        if (errors.required_kw) setErrors({ ...errors, required_kw: '' });
                      }}
                      className={`text-[10px] px-1.5 py-0.5 rounded border font-semibold transition-colors ${
                        formData.required_kw === kw
                          ? 'bg-blue-600 border-blue-700 text-white font-bold'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {kw}
                    </button>
                  ))}
                  {billEstimate.avgKw > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        const kwText = `${billEstimate.avgKw} kW`;
                        setFormData({ ...formData, required_kw: kwText });
                        if (errors.required_kw) setErrors({ ...errors, required_kw: '' });
                      }}
                      className="text-[10px] px-1.5 py-0.5 rounded border border-emerald-300 bg-emerald-50 text-emerald-800 font-bold hover:bg-emerald-100"
                      title="Set to bill estimated capacity"
                    >
                      Suggested: {billEstimate.estimatedKwText}
                    </button>
                  )}
                </div>
              </div>

              {/* Required Product: On-Grid / Hybrid */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  <span>
                    Required Product {isMandatoryStage ? <span className="text-rose-600 font-bold ml-0.5">*(Mandatory)</span> : <span className="text-slate-400 font-normal ml-0.5">(Optional)</span>}
                  </span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(['On-Grid', 'Hybrid'] as RequiredProduct[]).map((prod) => {
                    const isSelected = formData.required_product === prod;
                    return (
                      <button
                        key={prod}
                        type="button"
                        id={`btn-product-${prod.toLowerCase().replace(/[^a-z0-9]/g, '')}`}
                        onClick={() => {
                          setFormData({ ...formData, required_product: prod });
                          if (errors.required_product) setErrors({ ...errors, required_product: '' });
                        }}
                        className={`py-2 px-3 rounded-lg text-xs font-bold border flex items-center justify-center gap-1.5 transition-all ${
                          isSelected
                            ? 'bg-[#0E2429] text-white border-[#0E2429] shadow-xs'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                        <span>{prod}</span>
                      </button>
                    );
                  })}
                </div>
                {errors.required_product && (
                  <p className="mt-1 text-xs text-rose-600 font-semibold flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{errors.required_product}</span>
                  </p>
                )}
                <div className="mt-1.5 text-[10.5px] text-slate-500 flex items-center justify-between">
                  <span>On-Grid (Subsidy eligible)</span>
                  <span>Hybrid (Battery backup)</span>
                </div>
              </div>

              {/* Avg KSEB Bill */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Avg KSEB Bill
                  </label>
                  <span className="text-[10px] text-slate-500 font-medium">
                    Supports ranges (e.g. 2000-4000)
                  </span>
                </div>
                <div className="relative">
                  <input
                    id="input-kseb-bill"
                    type="text"
                    placeholder="e.g. 2000-4000, 3500 / Bi-monthly"
                    value={formData.avg_kseb_bill}
                    onChange={(e) => setFormData({ ...formData, avg_kseb_bill: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-lg text-sm font-semibold border border-slate-300 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
                {/* Quick Presets */}
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] font-semibold text-slate-700">Quick ranges:</span>
                  {['2000-4000', '4000-6000', '6000-10000', '10000+'].map((range) => (
                    <button
                      key={range}
                      type="button"
                      onClick={() => setFormData({ ...formData, avg_kseb_bill: range })}
                      className={`text-[11px] px-2 py-0.5 rounded border transition-colors ${
                        formData.avg_kseb_bill === range
                          ? 'bg-blue-50 text-blue-700 border-blue-300 font-bold'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {range}
                    </button>
                  ))}
                </div>
                {formData.avg_kseb_bill && (
                  <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-700 bg-slate-50 p-1.5 rounded-md border border-slate-200">
                    <span>Suggested Solar: <strong className="text-blue-700">{billEstimate.estimatedKwText}</strong></span>
                    <span>Est. Annual Savings: <strong className="text-emerald-700">{billEstimate.annualSavingsText}</strong></span>
                  </div>
                )}
              </div>

              {/* Roof Type */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Roof Type
                </label>
                <div className="relative">
                  <input
                    id="input-roof-type"
                    type="text"
                    list="roof-types-list"
                    placeholder="e.g. Concrete Flat, Sloped Tile, Truss Work"
                    value={formData.roof_type}
                    onChange={(e) => setFormData({ ...formData, roof_type: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-lg text-sm border border-slate-300 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                  <datalist id="roof-types-list">
                    {ROOF_TYPES.map((roof) => (
                      <option key={roof} value={roof} />
                    ))}
                    <option value="Industrial Shed" />
                    <option value="Terracotta Tile" />
                    <option value="Clay Tile with Metal Truss" />
                    <option value="RCC Flat with Pergola" />
                  </datalist>
                </div>
                {/* Quick Roof Select Chips */}
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {['Concrete Flat', 'Sloped Tile', 'Metal Sheet', 'Truss Work'].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setFormData({ ...formData, roof_type: r })}
                      className={`text-[10px] px-1.5 py-0.5 rounded border transition-colors ${
                        formData.roof_type === r
                          ? 'bg-blue-50 border-blue-300 text-blue-700 font-bold'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dropdowns: Loan & Free Site Visit */}
              <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-200">
                {/* Required Bank Loan Assistance */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                    <span>
                      Required Bank Loan Assistance {isMandatoryStage ? <span className="text-rose-600 font-bold ml-0.5">*(Mandatory)</span> : <span className="text-slate-400 font-normal ml-0.5">(Optional)</span>}
                    </span>
                  </label>
                  <select
                    id="select-required-loan"
                    value={formData.required_loan ? 'Yes' : 'No'}
                    onChange={(e) => {
                      setFormData({ ...formData, required_loan: e.target.value === 'Yes' });
                      if (errors.required_loan) setErrors({ ...errors, required_loan: '' });
                    }}
                    className={`w-full px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold border bg-white ${
                      errors.required_loan 
                        ? 'border-rose-500 ring-2 ring-rose-100' 
                        : 'border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
                    }`}
                  >
                    <option value="Yes">Yes (Loan Assistance Required)</option>
                    <option value="No">No (Self-Funded / Not Required)</option>
                  </select>
                  {errors.required_loan && (
                    <p className="mt-1 text-xs text-rose-600 font-semibold flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{errors.required_loan}</span>
                    </p>
                  )}
                </div>

                {/* Required Free Site Survey Visit */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                    <span>
                      Required Free Site Survey Visit {isMandatoryStage ? <span className="text-rose-600 font-bold ml-0.5">*(Mandatory)</span> : <span className="text-slate-400 font-normal ml-0.5">(Optional)</span>}
                    </span>
                  </label>
                  <select
                    id="select-required-site-visit"
                    value={formData.required_free_site_visit ? 'Yes' : 'No'}
                    onChange={(e) => {
                      setFormData({ ...formData, required_free_site_visit: e.target.value === 'Yes' });
                      if (errors.required_free_site_visit) setErrors({ ...errors, required_free_site_visit: '' });
                    }}
                    className={`w-full px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold border bg-white ${
                      errors.required_free_site_visit 
                        ? 'border-rose-500 ring-2 ring-rose-100' 
                        : 'border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
                    }`}
                  >
                    <option value="Yes">Yes (Free Site Visit Required)</option>
                    <option value="No">No (Site Visit Not Required)</option>
                  </select>
                  {errors.required_free_site_visit && (
                    <p className="mt-1 text-xs text-rose-600 font-semibold flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{errors.required_free_site_visit}</span>
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Lead Status & Mandatory Follow Up Date */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>Status & Follow-up Scheduling</span>
            </h3>

            <div className="space-y-4">
              {/* Status Radio Pills */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Lead Status <span className="text-rose-500">*</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {LEAD_STATUSES.map((st) => {
                    const isSelected = formData.lead_status === st;
                    return (
                      <button
                        type="button"
                        key={st}
                        onClick={() => {
                          setFormData({ ...formData, lead_status: st });
                          if (st === 'Open' && errors.next_follow_up) {
                            setErrors({ ...errors, next_follow_up: '' });
                          }
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-700 shadow-xs font-bold'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {st}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Next Follow Up Date & Time */}
              <div className={`p-4 rounded-xl border transition-all ${
                formData.lead_status === 'Inprogress'
                  ? 'bg-blue-50/70 border-blue-300 ring-2 ring-blue-100'
                  : formData.lead_status !== 'Open' && formData.lead_status !== 'Not Intrested' && formData.lead_status !== 'Lost'
                  ? 'bg-blue-50/50 border-blue-200 ring-1 ring-blue-100'
                  : 'bg-slate-50/50 border-slate-200'
              }`}>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-800">
                    Next Follow Up Date and Time
                    {formData.lead_status === 'Inprogress' ? (
                      <span className="text-rose-600 font-bold ml-1">*(Mandatory for Inprogress)</span>
                    ) : formData.lead_status === 'Not Intrested' || formData.lead_status === 'Lost' ? (
                      <span className="text-slate-400 font-normal ml-1">(Not required for {formData.lead_status})</span>
                    ) : formData.lead_status !== 'Open' && formData.lead_status !== 'No Response' ? (
                      <span className="text-rose-600 font-bold ml-1">*(Mandatory for "{formData.lead_status}")</span>
                    ) : (
                      <span className="text-slate-400 font-normal ml-1">(Optional for Open leads)</span>
                    )}
                  </label>
                  {formData.lead_status !== 'No Response' && formData.lead_status !== 'Not Intrested' && formData.lead_status !== 'Lost' && (
                    <div className="flex items-center gap-1">
                      <span className="text-[11px] text-slate-500">Quick:</span>
                      <button
                        type="button"
                        onClick={() => setPresetFollowUp(2)}
                        className="px-2 py-0.5 rounded text-[10px] font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-100"
                      >
                        +2 Hours
                      </button>
                      <button
                        type="button"
                        onClick={() => setPresetFollowUp(24)}
                        className="px-2 py-0.5 rounded text-[10px] font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-100"
                      >
                        Tomorrow
                      </button>
                      <button
                        type="button"
                        onClick={() => setPresetFollowUp(72)}
                        className="px-2 py-0.5 rounded text-[10px] font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-100"
                      >
                        +3 Days
                      </button>
                    </div>
                  )}
                </div>

                <DatePicker
                  id="input-next-follow-up"
                  selected={formData.lead_status === 'No Response' ? null : (formData.next_follow_up ? new Date(formData.next_follow_up) : null)}
                  onChange={(date: Date | null) => {
                    if (date) {
                      setFormData({ ...formData, next_follow_up: format(date, "yyyy-MM-dd'T'HH:mm:ss") });
                    } else {
                      setFormData({ ...formData, next_follow_up: '' });
                    }
                    if (errors.next_follow_up) setErrors({ ...errors, next_follow_up: '' });
                  }}
                  disabled={formData.lead_status === 'No Response'}
                  showTimeSelect
                  timeFormat="hh:mm aa"
                  timeIntervals={15}
                  dateFormat="dd-MM-yyyy hh:mm:ss aa"
                  className={`w-full px-3.5 py-2 rounded-lg text-sm border font-medium transition-all ${
                    formData.lead_status === 'No Response'
                      ? 'bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed'
                      : 'bg-white border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
                  } ${errors.next_follow_up ? 'border-rose-500 ring-2 ring-rose-100' : ''}`}
                  placeholderText={
                    formData.lead_status === 'No Response'
                      ? 'Auto-scheduled to +4 hours on submit'
                      : formData.lead_status === 'Not Intrested' || formData.lead_status === 'Lost'
                      ? 'Optional (Not required for this stage)'
                      : 'Select date and time'
                  }
                  portalId="root-portal"
                />
                {formData.lead_status !== 'No Response' && formData.next_follow_up && (
                  <div className="mt-1.5 flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50/80 border border-blue-200 text-blue-900 text-xs font-mono">
                    <Calendar className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span>Scheduled: <strong>{formatDateTime(formData.next_follow_up)}</strong></span>
                  </div>
                )}
                {errors.next_follow_up && (
                  <p className="mt-1.5 text-xs text-rose-600 font-semibold flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{errors.next_follow_up}</span>
                  </p>
                )}
              </div>

              {/* Site Survey Dates */}
              {formData.lead_status === 'Scheduled Site Survey' && (
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-blue-600" />
                    <span>Site Survey Requested Date</span>
                    <span className="text-rose-600 font-bold">*</span>
                  </label>
                  <DatePicker
                    selected={formData.site_survey_requested_date ? new Date(formData.site_survey_requested_date) : null}
                    onChange={(date: Date | null) => {
                      setFormData({ ...formData, site_survey_requested_date: date ? format(date, "yyyy-MM-dd'T'HH:mm:ss") : '' });
                      if (errors.site_survey_requested_date) setErrors(prev => ({ ...prev, site_survey_requested_date: '' }));
                    }}
                    dateFormat="dd-MM-yyyy"
                    className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold border bg-white outline-hidden transition-all ${
                      errors.site_survey_requested_date ? 'border-rose-500 ring-2 ring-rose-100' : 'border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100'
                    }`}
                    placeholderText="Select requested date"
                    portalId="root-portal"
                  />
                  {errors.site_survey_requested_date && (
                    <p className="mt-1 text-[11px] text-rose-600 font-semibold flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>{errors.site_survey_requested_date}</span>
                    </p>
                  )}
                </div>
              )}

              {formData.lead_status === 'Site Survey Completed' && (
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Site Survey Completed Date</span>
                    <span className="text-rose-600 font-bold">*</span>
                  </label>
                  <DatePicker
                    selected={formData.site_survey_completed_date ? new Date(formData.site_survey_completed_date) : null}
                    onChange={(date: Date | null) => {
                      setFormData({ ...formData, site_survey_completed_date: date ? format(date, "yyyy-MM-dd'T'HH:mm:ss") : '' });
                      if (errors.site_survey_completed_date) setErrors(prev => ({ ...prev, site_survey_completed_date: '' }));
                    }}
                    disabled={!!initialLead?.site_survey_completed_date}
                    dateFormat="dd-MM-yyyy"
                    className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold border transition-all ${
                      !!initialLead?.site_survey_completed_date 
                        ? 'bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed'
                        : 'bg-white border-slate-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100'
                    } ${errors.site_survey_completed_date ? 'border-rose-500 ring-2 ring-rose-100' : ''}`}
                    placeholderText="Select completed date"
                    portalId="root-portal"
                  />
                  {!!initialLead?.site_survey_completed_date && (
                    <p className="mt-1.5 text-[11px] text-slate-500 font-medium flex items-center gap-1">
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span>This date is locked because it was already submitted.</span>
                    </p>
                  )}
                  {errors.site_survey_completed_date && (
                    <p className="mt-1 text-[11px] text-rose-600 font-semibold flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>{errors.site_survey_completed_date}</span>
                    </p>
                  )}
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span>
                    Conversation & Progress Notes{' '}
                    {formData.lead_status === 'Inprogress' ? (
                      <span className="text-rose-600 font-bold">*(Mandatory for Inprogress)</span>
                    ) : formData.lead_status === 'Not Intrested' || formData.lead_status === 'Lost' ? (
                      <span className="text-rose-600 font-bold">*(Mandatory for {formData.lead_status})</span>
                    ) : null}
                  </span>
                </label>
                <textarea
                  id="textarea-notes"
                  rows={2}
                  placeholder={
                    formData.lead_status === 'Not Intrested' || formData.lead_status === 'Lost'
                      ? `Please enter the specific reason why the customer is ${formData.lead_status} (Mandatory)...`
                      : "e.g. Discussed 5kW subsidy benefits, customer requested techno-commercial sheet..."
                  }
                  value={formData.notes || ''}
                  onChange={(e) => {
                    setFormData({ ...formData, notes: e.target.value });
                    if (errors.notes) setErrors({ ...errors, notes: '' });
                  }}
                  className={`w-full px-3.5 py-2 rounded-lg text-sm border bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 ${
                    errors.notes ? 'border-rose-500 ring-2 ring-rose-100' : 'border-slate-300'
                  }`}
                />
                {errors.notes && (
                  <p className="mt-1 text-xs text-rose-600 font-semibold flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{errors.notes}</span>
                  </p>
                )}
              </div>

              {/* Special Instructions */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span>
                    Special Instructions{' '}
                    {formData.lead_status === 'Inprogress' ? (
                      <span className="text-rose-600 font-bold">*(Mandatory for Inprogress)</span>
                    ) : formData.lead_status === 'Not Intrested' || formData.lead_status === 'Lost' ? (
                      <span className="text-slate-400 font-normal">(Optional for {formData.lead_status})</span>
                    ) : null}
                  </span>
                </label>
                <textarea
                  id="textarea-special-instructions"
                  rows={2}
                  placeholder={
                    formData.lead_status === 'Not Intrested' || formData.lead_status === 'Lost'
                      ? 'Optional: any closing remarks or future re-contact notes...'
                      : "e.g. Survey engineer must check 3-phase sanction load, carry tilt-angle gauge, call before 10 AM..."
                  }
                  value={formData.special_instructions || ''}
                  onChange={(e) => {
                    setFormData({ ...formData, special_instructions: e.target.value });
                    if (errors.special_instructions) setErrors({ ...errors, special_instructions: '' });
                  }}
                  className={`w-full px-3.5 py-2 rounded-lg text-sm border bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 ${
                    errors.special_instructions ? 'border-rose-500 ring-2 ring-rose-100' : 'border-slate-300'
                  }`}
                />
                {errors.special_instructions && (
                  <p className="mt-1 text-xs text-rose-600 font-semibold flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{errors.special_instructions}</span>
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-[#BBD5DA] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-bold text-slate-600 hover:bg-[#F5F5F5] transition-colors"
            >
              Cancel
            </button>
            <button
              id="btn-submit-lead"
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 rounded-lg text-xs font-bold bg-[#FF0000] hover:bg-[#D60000] text-white shadow-xs transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : initialLead ? 'Update Lead' : 'Create Solar Lead'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
