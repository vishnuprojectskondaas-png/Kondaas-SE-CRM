import React, { useState, useEffect } from 'react';
import { 
  X, 
  Calendar, 
  Clock, 
  AlertCircle, 
  FileText, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight,
  User,
  MapPin,
  ClipboardList,
  Phone,
  MessageSquare,
  History,
  Tag,
  IndianRupee,
  Layers,
  ChevronRight,
  Zap,
  Check
} from 'lucide-react';
import DatePicker from 'react-datepicker';
import { format } from 'date-fns';
import { Lead, LeadStatus, NoteEntry, AppUser, MANDATORY_KW_PRODUCT_STAGES, RequiredProduct } from '../types';
import { LEAD_STATUSES } from '../lib/mockData';
import { formatDateTime } from '../lib/dateUtils';

interface UpdateLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: Lead | null;
  currentUser?: AppUser | null;
  onConfirmUpdate: (
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
  ) => Promise<void>;
}

export const UpdateLeadModal: React.FC<UpdateLeadModalProps> = ({
  isOpen,
  onClose,
  lead,
  currentUser,
  onConfirmUpdate,
}) => {
  const [selectedStatus, setSelectedStatus] = useState<LeadStatus>('Inprogress');
  const [requiredKw, setRequiredKw] = useState('');
  const [requiredProduct, setRequiredProduct] = useState<RequiredProduct | ''>('');
  const [requiredLoan, setRequiredLoan] = useState<'Yes' | 'No' | ''>('');
  const [requiredFreeSiteVisit, setRequiredFreeSiteVisit] = useState<'Yes' | 'No' | ''>('');
  const [followUpDateTime, setFollowUpDateTime] = useState('');
  const [siteSurveyRequestedDate, setSiteSurveyRequestedDate] = useState('');
  const [siteSurveyCompletedDate, setSiteSurveyCompletedDate] = useState('');
  const [conversationNote, setConversationNote] = useState('');
  const [specialInstruction, setSpecialInstruction] = useState('');
  const [activeHistoryTab, setActiveHistoryTab] = useState<'conversation' | 'instructions'>('conversation');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // When modal opens, initialize fields as BLANK for fresh entry, and set status
  useEffect(() => {
    if (lead && isOpen) {
      // Default to lead's current status, or if Open, suggest Inprogress
      setSelectedStatus(lead.lead_status === 'Open' ? 'Inprogress' : lead.lead_status);
      
      // CRITICAL REQUIREMENT: "When Click Update Lead Then Only Pop up Mandotry filed (As blank)"
      // Mandatory input fields start completely blank for the new session update
      setRequiredKw(lead.required_kw || '');
      setRequiredProduct((lead.required_product as RequiredProduct) || '');
      setRequiredLoan(
        lead.required_loan !== undefined && lead.required_loan !== null 
          ? (lead.required_loan ? 'Yes' : 'No') 
          : ''
      );
      setRequiredFreeSiteVisit(
        lead.required_free_site_visit !== undefined && lead.required_free_site_visit !== null
          ? (lead.required_free_site_visit ? 'Yes' : 'No')
          : ''
      );
      setSiteSurveyRequestedDate(lead.site_survey_requested_date ? lead.site_survey_requested_date.substring(0, 16) : '');
      setSiteSurveyCompletedDate(lead.site_survey_completed_date ? lead.site_survey_completed_date.substring(0, 16) : '');
      setFollowUpDateTime('');
      setConversationNote('');
      setSpecialInstruction('');
      setErrors({});
      setActiveHistoryTab('conversation');
    }
  }, [lead, isOpen]);

  if (!isOpen || !lead) return null;

  const isMandatoryStage = MANDATORY_KW_PRODUCT_STAGES.includes(selectedStatus);

  const setPresetFollowUp = (offsetHours: number, targetHour?: number) => {
    const d = new Date();
    if (targetHour !== undefined) {
      d.setDate(d.getDate() + (offsetHours >= 24 ? Math.floor(offsetHours / 24) : 0));
      d.setHours(targetHour, 0, 0, 0);
    } else {
      d.setHours(d.getHours() + offsetHours);
    }
    const pad = (n: number) => (n < 10 ? '0' + n : n);
    setFollowUpDateTime(
      `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
    );
    if (errors.followUpDateTime) {
      setErrors((prev) => ({ ...prev, followUpDateTime: '' }));
    }
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    // Mandatory KW, Product, Loan Assistance & Free Site Survey for specific stages:
    // Inprogress, Scheduled Site Survey, Site Survey Completed, Order Confirmed
    if (isMandatoryStage) {
      if (!requiredKw.trim()) {
        errs.requiredKw = `Required KW is mandatory for "${selectedStatus}" stage.`;
      }
      if (!requiredProduct) {
        errs.requiredProduct = `Required Product (On-Grid / Hybrid) is mandatory for "${selectedStatus}" stage.`;
      }
      if (!requiredLoan) {
        errs.requiredLoan = `Bank Loan Assistance (Yes / No) is mandatory for "${selectedStatus}" stage.`;
      }
      if (!requiredFreeSiteVisit) {
        errs.requiredFreeSiteVisit = `Free Site Survey Visit (Yes / No) is mandatory for "${selectedStatus}" stage.`;
      }
    }

    // Follow Up Date & Time is NOT required for 'No Response' (auto-scheduled), 'Not Intrested', or 'Lost'
    const isFollowUpMandatory = selectedStatus !== 'No Response' && selectedStatus !== 'Not Intrested' && selectedStatus !== 'Lost';
    if (isFollowUpMandatory && !followUpDateTime.trim()) {
      errs.followUpDateTime = `Next Follow Up Date & Time is mandatory for "${selectedStatus}".`;
    }

    if (selectedStatus === 'Scheduled Site Survey' && !siteSurveyRequestedDate) {
      errs.siteSurveyRequestedDate = 'Site Survey Requested Date is required.';
    }
    if (selectedStatus === 'Site Survey Completed' && !siteSurveyCompletedDate) {
      errs.siteSurveyCompletedDate = 'Site Survey Completed Date is required.';
    }

    // Conversation & Progress Notes is ALWAYS mandatory for all stages (especially Not Intrested and Lost to log reasons)
    if (!conversationNote.trim()) {
      errs.conversationNote = selectedStatus === 'Not Intrested' || selectedStatus === 'Lost'
        ? `Conversation & Progress Notes are mandatory to record why lead is ${selectedStatus}.`
        : 'Conversation & Progress Notes are mandatory.';
    } else if (conversationNote.trim().length < 3) {
      errs.conversationNote = 'Please provide meaningful conversation notes (at least 3 characters).';
    }

    // Special Instructions is mandatory for active pipelines, but NOT required for Not Intrested and Lost stages
    const isSpecialInstructionsMandatory = selectedStatus !== 'Not Intrested' && selectedStatus !== 'Lost';
    if (isSpecialInstructionsMandatory) {
      if (!specialInstruction.trim()) {
        errs.specialInstruction = 'Special Instructions are mandatory.';
      } else if (specialInstruction.trim().length < 3) {
        errs.specialInstruction = 'Please provide specific instructions (at least 3 characters).';
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      let finalFollowUpDateTime = followUpDateTime.trim();
      if (selectedStatus === 'No Response') {
        const d = new Date();
        d.setHours(d.getHours() + 4);
        finalFollowUpDateTime = format(d, "yyyy-MM-dd'T'HH:mm:ss");
      }

      await onConfirmUpdate(
        lead.id,
        selectedStatus,
        finalFollowUpDateTime,
        conversationNote.trim(),
        specialInstruction.trim(),
        requiredKw.trim(),
        requiredProduct,
        requiredLoan ? requiredLoan === 'Yes' : false,
        requiredFreeSiteVisit ? requiredFreeSiteVisit === 'Yes' : false,
        siteSurveyRequestedDate.trim(),
        siteSurveyCompletedDate.trim()
      );
      onClose();
    } catch (err: any) {
      setErrors({ form: err?.message || 'Failed to update lead. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Extract separated notes histories with fallback to existing single note strings
  const conversationHistory: NoteEntry[] = lead.conversation_notes_history && lead.conversation_notes_history.length > 0
    ? lead.conversation_notes_history
    : lead.notes
    ? [
        {
          id: 'initial-note',
          type: 'conversation_note',
          text: lead.notes,
          created_at: lead.created_at || new Date().toISOString(),
          author: lead.responsible || 'System',
          lead_status: lead.lead_status,
        },
      ]
    : [];

  const instructionHistory: NoteEntry[] = lead.special_instructions_history && lead.special_instructions_history.length > 0
    ? lead.special_instructions_history
    : lead.special_instructions
    ? [
        {
          id: 'initial-inst',
          type: 'special_instruction',
          text: lead.special_instructions,
          created_at: lead.created_at || new Date().toISOString(),
          author: lead.responsible || 'System',
          lead_status: lead.lead_status,
        },
      ]
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header with Lead Summary */}
        <div className="bg-[linear-gradient(135deg,#0E2429_0%,#17343B_100%)] text-white p-5 border-b border-[#BBD5DA]/20">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#DFF1F1]/20 border border-[#BBD5DA]/30 flex items-center justify-center text-[#DFF1F1] shrink-0">
                <ClipboardList className="w-5 h-5 text-[#DFF1F1]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#DFF1F1]/20 text-[#DFF1F1] border border-[#BBD5DA]/30">
                    Lead Update Form
                  </span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-200 border border-amber-400/30">
                    Current: {lead.lead_status}
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-white mt-1">
                  Update Lead: {lead.customer_name}
                </h3>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Lead Details Meta Row */}
          <div className="mt-3.5 pt-3 border-t border-white/15 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-[#BBD5DA]">
            <div className="flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-[#DFF1F1] shrink-0" />
              <span className="font-mono">{lead.mobile_number}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#DFF1F1] shrink-0" />
              <span className="truncate">{lead.district}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <IndianRupee className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
              <span>{lead.avg_kseb_bill}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#FF0000] shrink-0" />
              <span className="truncate text-amber-200">
                Modified: {formatDateTime(lead.updated_at || lead.created_at)}
              </span>
            </div>
          </div>
        </div>

        {/* Modal Body: Mandatory Blank Fields + Note History Section */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {errors.form && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errors.form}</span>
            </div>
          )}

          {/* Prompt banner explaining blank mandatory inputs */}
          <div className="p-3 rounded-xl bg-blue-50/80 border border-blue-200/70 text-slate-700 text-xs flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-blue-900">Mandatory Update Fields (Initialized As Blank)</p>
              <p className="text-[11px] text-blue-800/85 mt-0.5">
                Fill in the fresh progress updates, next appointment schedule, and surveyor instructions below. Past notes remain preserved in the Note History section below for reference.
              </p>
            </div>
          </div>

          {/* 1. Lead Stage / Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-blue-600" />
                <span>Lead Stage / Status</span>
                <span className="text-rose-600 font-bold">* Mandatory</span>
              </label>
              <select
                id="select-update-status"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as LeadStatus)}
                className="w-full px-3.5 py-2.5 rounded-xl text-xs font-bold border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-600 outline-hidden transition-all cursor-pointer"
              >
                {LEAD_STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {st} {st === lead.lead_status ? '(Current Stage)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Next Follow Up Date & Time */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-blue-600" />
                  <span>Next Follow Up Date & Time</span>
                  {selectedStatus === 'Not Intrested' || selectedStatus === 'Lost' ? (
                    <span className="text-slate-400 font-normal text-[11px]">(Not required for {selectedStatus})</span>
                  ) : selectedStatus === 'No Response' ? (
                    <span className="text-slate-400 font-normal text-[11px]">(Auto-scheduled)</span>
                  ) : (
                    <span className="text-rose-600 font-bold">* Mandatory</span>
                  )}
                </label>
              </div>

              <DatePicker
                id="input-update-followup"
                selected={selectedStatus === 'No Response' ? null : (followUpDateTime ? new Date(followUpDateTime) : null)}
                onChange={(date: Date | null) => {
                  if (date) {
                    setFollowUpDateTime(format(date, "yyyy-MM-dd'T'HH:mm:ss"));
                  } else {
                    setFollowUpDateTime('');
                  }
                  if (errors.followUpDateTime) {
                    setErrors((prev) => ({ ...prev, followUpDateTime: '' }));
                  }
                }}
                disabled={selectedStatus === 'No Response'}
                showTimeSelect
                timeFormat="hh:mm aa"
                timeIntervals={15}
                dateFormat="dd-MM-yyyy hh:mm:ss aa"
                className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold border transition-all ${
                  selectedStatus === 'No Response'
                    ? 'bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed'
                    : 'bg-white border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100'
                } ${errors.followUpDateTime ? 'border-rose-500 ring-2 ring-rose-100' : ''}`}
                placeholderText={
                  selectedStatus === 'No Response'
                    ? 'Auto-scheduled to +4 hours on submit'
                    : selectedStatus === 'Not Intrested' || selectedStatus === 'Lost'
                    ? 'Optional (Not required for this stage)'
                    : 'Select date and time'
                }
                portalId="root-portal"
              />

              {selectedStatus !== 'No Response' && followUpDateTime && (
                <div className="mt-1.5 flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50/80 border border-blue-200 text-blue-900 text-xs font-mono">
                  <Calendar className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span>Scheduled: <strong>{formatDateTime(followUpDateTime)}</strong></span>
                </div>
              )}

              {/* Quick Presets */}
              {selectedStatus !== 'No Response' && selectedStatus !== 'Not Intrested' && selectedStatus !== 'Lost' && (
                <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                <span className="text-[10px] text-slate-400 font-medium">Quick:</span>
                <button
                  type="button"
                  onClick={() => setPresetFollowUp(2)}
                  className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                >
                  +2 Hours
                </button>
                <button
                  type="button"
                  onClick={() => setPresetFollowUp(24, 10)}
                  className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                >
                  Tomorrow 10 AM
                </button>
                <button
                  type="button"
                  onClick={() => setPresetFollowUp(24, 16)}
                  className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                >
                  Tomorrow 4 PM
                </button>
                <button
                  type="button"
                  onClick={() => setPresetFollowUp(72, 11)}
                  className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                >
                  +3 Days
                </button>
              </div>
              )}

              {errors.followUpDateTime && (
                <p className="mt-1 text-[11px] text-rose-600 font-semibold flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{errors.followUpDateTime}</span>
                </p>
              )}
            </div>

            {/* Site Survey Dates */}
            {selectedStatus === 'Scheduled Site Survey' && (
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-blue-600" />
                  <span>Site Survey Requested Date</span>
                  <span className="text-rose-600 font-bold">*</span>
                </label>
                <DatePicker
                  selected={siteSurveyRequestedDate ? new Date(siteSurveyRequestedDate) : null}
                  onChange={(date: Date | null) => {
                    setSiteSurveyRequestedDate(date ? format(date, "yyyy-MM-dd'T'HH:mm:ss") : '');
                    if (errors.siteSurveyRequestedDate) setErrors(prev => ({ ...prev, siteSurveyRequestedDate: '' }));
                  }}
                  dateFormat="dd-MM-yyyy"
                  className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold border bg-white outline-hidden transition-all ${
                    errors.siteSurveyRequestedDate ? 'border-rose-500 ring-2 ring-rose-100' : 'border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100'
                  }`}
                  placeholderText="Select requested date"
                  portalId="root-portal"
                />
                {errors.siteSurveyRequestedDate && (
                  <p className="mt-1 text-[11px] text-rose-600 font-semibold flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{errors.siteSurveyRequestedDate}</span>
                  </p>
                )}
              </div>
            )}

            {selectedStatus === 'Site Survey Completed' && (
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Site Survey Completed Date</span>
                  <span className="text-rose-600 font-bold">*</span>
                </label>
                <DatePicker
                  selected={siteSurveyCompletedDate ? new Date(siteSurveyCompletedDate) : null}
                  onChange={(date: Date | null) => {
                    setSiteSurveyCompletedDate(date ? format(date, "yyyy-MM-dd'T'HH:mm:ss") : '');
                    if (errors.siteSurveyCompletedDate) setErrors(prev => ({ ...prev, siteSurveyCompletedDate: '' }));
                  }}
                  disabled={!!lead?.site_survey_completed_date}
                  dateFormat="dd-MM-yyyy"
                  className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold border transition-all ${
                    !!lead?.site_survey_completed_date 
                      ? 'bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed'
                      : 'bg-white border-slate-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100'
                  } ${errors.siteSurveyCompletedDate ? 'border-rose-500 ring-2 ring-rose-100' : ''}`}
                  placeholderText="Select completed date"
                  portalId="root-portal"
                />
                {!!lead?.site_survey_completed_date && (
                  <p className="mt-1.5 text-[11px] text-slate-500 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>This date is locked because it was already submitted.</span>
                  </p>
                )}
                {errors.siteSurveyCompletedDate && (
                  <p className="mt-1 text-[11px] text-rose-600 font-semibold flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{errors.siteSurveyCompletedDate}</span>
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Required KW & Required Product: On-Grid / Hybrid */}
          <div className={`p-4 rounded-xl border transition-all ${
            isMandatoryStage 
              ? 'bg-blue-50/60 border-blue-200 ring-1 ring-blue-100' 
              : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-blue-600" />
                <span className="text-xs font-bold text-slate-800">Capacity & Product Requirement</span>
              </div>
              {isMandatoryStage ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                  Mandatory for {selectedStatus}
                </span>
              ) : (
                <span className="text-[10px] text-slate-500 font-normal">
                  Optional for {selectedStatus}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Required KW */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span>
                    Required KW {isMandatoryStage && <span className="text-rose-600 font-bold">*</span>}
                  </span>
                  {requiredKw && (
                    <span className="text-[10px] font-bold text-blue-600">{requiredKw}</span>
                  )}
                </label>
                <div className="relative">
                  <input
                    id="input-update-required-kw"
                    type="text"
                    placeholder="e.g. 5 kW, 3, 10"
                    value={requiredKw}
                    onChange={(e) => {
                      setRequiredKw(e.target.value);
                      if (errors.requiredKw) setErrors((prev) => ({ ...prev, requiredKw: '' }));
                    }}
                    className={`w-full px-3 py-2 rounded-lg text-xs font-semibold border bg-white ${
                      errors.requiredKw
                        ? 'border-rose-500 ring-2 ring-rose-100'
                        : 'border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100'
                    }`}
                  />
                  <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none text-slate-400 text-xs font-bold">
                    kW
                  </div>
                </div>
                {/* Presets */}
                <div className="flex flex-wrap gap-1 mt-1">
                  {['3 kW', '5 kW', '8 kW', '10 kW', '15 kW'].map((kw) => (
                    <button
                      key={kw}
                      type="button"
                      onClick={() => {
                        setRequiredKw(kw);
                        if (errors.requiredKw) setErrors((prev) => ({ ...prev, requiredKw: '' }));
                      }}
                      className={`text-[9.5px] px-1.5 py-0.5 rounded border transition-colors ${
                        requiredKw === kw
                          ? 'bg-blue-600 border-blue-700 text-white font-bold'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {kw}
                    </button>
                  ))}
                </div>
                {errors.requiredKw && (
                  <p className="mt-1 text-[11px] text-rose-600 font-semibold flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{errors.requiredKw}</span>
                  </p>
                )}
              </div>

              {/* Required Product: On-Grid / Hybrid */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  <span>
                    Required Product {isMandatoryStage && <span className="text-rose-600 font-bold">*</span>}
                  </span>
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {(['On-Grid', 'Hybrid'] as RequiredProduct[]).map((prod) => {
                    const isSelected = requiredProduct === prod;
                    return (
                      <button
                        key={prod}
                        type="button"
                        id={`btn-update-prod-${prod.toLowerCase().replace(/[^a-z0-9]/g, '')}`}
                        onClick={() => {
                          setRequiredProduct(prod);
                          if (errors.requiredProduct) setErrors((prev) => ({ ...prev, requiredProduct: '' }));
                        }}
                        className={`py-2 px-2 rounded-lg text-xs font-bold border flex items-center justify-center gap-1.5 transition-all ${
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
                {errors.requiredProduct && (
                  <p className="mt-1 text-[11px] text-rose-600 font-semibold flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{errors.requiredProduct}</span>
                  </p>
                )}
                <div className="mt-1 text-[10px] text-slate-500 flex justify-between">
                  <span>On-Grid (Subsidy)</span>
                  <span>Hybrid (Battery backup)</span>
                </div>
              </div>
            </div>

            {/* Dropdowns: Bank Loan Assistance & Free Site Survey Visit */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3 pt-3 border-t border-slate-200/80">
              {/* Required Bank Loan Assistance Dropdown */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span>
                    Required Bank Loan Assistance {isMandatoryStage && <span className="text-rose-600 font-bold">*</span>}
                  </span>
                </label>
                <div className="relative">
                  <select
                    id="select-update-loan"
                    value={requiredLoan}
                    onChange={(e) => {
                      setRequiredLoan(e.target.value as any);
                      if (errors.requiredLoan) setErrors((prev) => ({ ...prev, requiredLoan: '' }));
                    }}
                    className={`w-full px-3 py-2 rounded-lg text-xs font-semibold border bg-white ${
                      errors.requiredLoan
                        ? 'border-rose-500 ring-2 ring-rose-100'
                        : 'border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100'
                    }`}
                  >
                    <option value="">-- Select Yes / No --</option>
                    <option value="Yes">Yes (Loan Assistance Required)</option>
                    <option value="No">No (Self-Funded / Not Required)</option>
                  </select>
                </div>
                {errors.requiredLoan && (
                  <p className="mt-1 text-[11px] text-rose-600 font-semibold flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{errors.requiredLoan}</span>
                  </p>
                )}
              </div>

              {/* Required Free Site Survey Visit Dropdown */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span>
                    Required Free Site Survey Visit {isMandatoryStage && <span className="text-rose-600 font-bold">*</span>}
                  </span>
                </label>
                <div className="relative">
                  <select
                    id="select-update-site-visit"
                    value={requiredFreeSiteVisit}
                    onChange={(e) => {
                      setRequiredFreeSiteVisit(e.target.value as any);
                      if (errors.requiredFreeSiteVisit) setErrors((prev) => ({ ...prev, requiredFreeSiteVisit: '' }));
                    }}
                    className={`w-full px-3 py-2 rounded-lg text-xs font-semibold border bg-white ${
                      errors.requiredFreeSiteVisit
                        ? 'border-rose-500 ring-2 ring-rose-100'
                        : 'border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100'
                    }`}
                  >
                    <option value="">-- Select Yes / No --</option>
                    <option value="Yes">Yes (Free Site Visit Required)</option>
                    <option value="No">No (Site Visit Not Required)</option>
                  </select>
                </div>
                {errors.requiredFreeSiteVisit && (
                  <p className="mt-1 text-[11px] text-rose-600 font-semibold flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{errors.requiredFreeSiteVisit}</span>
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* 3. Conversation & Progress Notes (MANDATORY & BLANK) */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-blue-600" />
                <span>Conversation & Progress Notes</span>
                <span className="text-rose-600 font-bold">* Mandatory</span>
              </span>
              <span className="text-[10px] text-slate-400 font-normal">Logged with date & time stamp</span>
            </label>
            <textarea
              id="input-update-conversation-notes"
              rows={2}
              placeholder={
                selectedStatus === 'Not Intrested' || selectedStatus === 'Lost'
                  ? `Please enter the specific reason why the customer is ${selectedStatus} (Mandatory)...`
                  : "e.g. Called customer to discuss 5kW On-Grid subsidy calculation. Client agreed for site survey and requested techno-commercial sheet on WhatsApp..."
              }
              value={conversationNote}
              onChange={(e) => {
                setConversationNote(e.target.value);
                if (errors.conversationNote) {
                  setErrors((prev) => ({ ...prev, conversationNote: '' }));
                }
              }}
              className={`w-full px-3.5 py-2.5 rounded-xl text-xs border bg-slate-50/50 focus:bg-white outline-hidden transition-all ${
                errors.conversationNote
                  ? 'border-rose-500 ring-2 ring-rose-100'
                  : 'border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100'
              }`}
            />
            {errors.conversationNote && (
              <p className="mt-1 text-[11px] text-rose-600 font-semibold flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{errors.conversationNote}</span>
              </p>
            )}
          </div>

          {/* 4. Special Instructions */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Special Instructions</span>
                {selectedStatus === 'Not Intrested' || selectedStatus === 'Lost' ? (
                  <span className="text-slate-400 font-normal text-[11px]">(Optional for {selectedStatus})</span>
                ) : (
                  <span className="text-rose-600 font-bold">* Mandatory</span>
                )}
              </span>
              <span className="text-[10px] text-slate-400 font-normal">Logged with date & time stamp</span>
            </label>
            <textarea
              id="input-update-special-instructions"
              rows={2}
              placeholder={
                selectedStatus === 'Not Intrested' || selectedStatus === 'Lost'
                  ? 'Optional: any closing remarks or future re-contact notes...'
                  : "e.g. Survey team must inspect 3-phase meter board, verify roof shadow between 11 AM - 3 PM, check if elevated structure is needed..."
              }
              value={specialInstruction}
              onChange={(e) => {
                setSpecialInstruction(e.target.value);
                if (errors.specialInstruction) {
                  setErrors((prev) => ({ ...prev, specialInstruction: '' }));
                }
              }}
              className={`w-full px-3.5 py-2.5 rounded-xl text-xs border bg-slate-50/50 focus:bg-white outline-hidden transition-all ${
                errors.specialInstruction
                  ? 'border-rose-500 ring-2 ring-rose-100'
                  : 'border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100'
              }`}
            />
            {errors.specialInstruction && (
              <p className="mt-1 text-[11px] text-rose-600 font-semibold flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{errors.specialInstruction}</span>
              </p>
            )}
          </div>

          {/* --- NOTE SECTION & AUDIT TRAIL (Separated with Date & Time for Future Reference) --- */}
          <div className="pt-3 border-t border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-slate-500" />
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Lead Note History & Reference
                </h4>
              </div>

              {/* Toggle Tabs between Conversation Notes & Special Instructions */}
              <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setActiveHistoryTab('conversation')}
                  className={`px-3 py-1 rounded-md transition-all flex items-center gap-1.5 ${
                    activeHistoryTab === 'conversation'
                      ? 'bg-white text-blue-700 shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <FileText className="w-3 h-3" />
                  <span>Conversation Notes ({conversationHistory.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveHistoryTab('instructions')}
                  className={`px-3 py-1 rounded-md transition-all flex items-center gap-1.5 ${
                    activeHistoryTab === 'instructions'
                      ? 'bg-white text-amber-700 shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  <span>Special Instructions ({instructionHistory.length})</span>
                </button>
              </div>
            </div>

            {/* Note History Content Box */}
            <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 max-h-48 overflow-y-auto space-y-2.5">
              {activeHistoryTab === 'conversation' ? (
                conversationHistory.length === 0 ? (
                  <p className="text-xs text-slate-400 italic text-center py-4">
                    No previous conversation notes logged. Your new note will be the first entry with timestamp.
                  </p>
                ) : (
                  conversationHistory.map((item, idx) => (
                    <div
                      key={item.id || idx}
                      className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs space-y-1 text-xs"
                    >
                      <div className="flex items-center justify-between gap-2 text-[11px] text-slate-500">
                        <div className="flex items-center gap-1.5 font-bold text-slate-700">
                          <User className="w-3 h-3 text-blue-500" />
                          <span>{item.author || lead.responsible}</span>
                          {item.lead_status && (
                            <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-semibold border border-slate-200 text-[10px]">
                              {item.lead_status}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 font-mono text-[10px] text-slate-400">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{formatDateTime(item.created_at)}</span>
                        </div>
                      </div>
                      <p className="text-slate-800 font-medium whitespace-pre-wrap leading-relaxed">
                        {item.text}
                      </p>
                    </div>
                  ))
                )
              ) : (
                instructionHistory.length === 0 ? (
                  <p className="text-xs text-slate-400 italic text-center py-4">
                    No previous special instructions logged. Your new instruction will be the first entry with timestamp.
                  </p>
                ) : (
                  instructionHistory.map((item, idx) => (
                    <div
                      key={item.id || idx}
                      className="bg-amber-50/60 p-3 rounded-lg border border-amber-200 shadow-2xs space-y-1 text-xs"
                    >
                      <div className="flex items-center justify-between gap-2 text-[11px] text-amber-900/70">
                        <div className="flex items-center gap-1.5 font-bold text-amber-900">
                          <Sparkles className="w-3 h-3 text-amber-600" />
                          <span>{item.author || lead.responsible}</span>
                          {item.lead_status && (
                            <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 font-semibold border border-amber-300 text-[10px]">
                              {item.lead_status}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 font-mono text-[10px] text-amber-700/60">
                          <Clock className="w-3 h-3 text-amber-600" />
                          <span>{formatDateTime(item.created_at)}</span>
                        </div>
                      </div>
                      <p className="text-amber-950 font-medium whitespace-pre-wrap leading-relaxed">
                        {item.text}
                      </p>
                    </div>
                  ))
                )
              )}
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-3 border-t border-[#BBD5DA] flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-[#F5F5F5] transition-colors"
            >
              Cancel
            </button>
            <button
              id="btn-confirm-lead-update"
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#FF0000] hover:bg-[#D60000] text-white shadow-xs transition-all active:scale-[0.98] disabled:opacity-50 flex items-center gap-1.5"
            >
              {isSubmitting ? (
                <span>Saving Lead Update...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirm Lead Update</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
