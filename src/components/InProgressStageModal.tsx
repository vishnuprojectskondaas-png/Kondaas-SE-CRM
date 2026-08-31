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
  Zap,
  Check
} from 'lucide-react';
import DatePicker from 'react-datepicker';
import { format } from 'date-fns';
import { Lead, RequiredProduct } from '../types';
import { formatDateTime } from '../lib/dateUtils';

interface InProgressStageModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: Lead | null;
  onConfirm: (
    leadId: string, 
    followUpDateTime: string, 
    notes: string, 
    specialInstructions: string,
    requiredKw?: string,
    requiredProduct?: RequiredProduct | '',
    requiredLoan?: boolean,
    requiredFreeSiteVisit?: boolean
  ) => Promise<void>;
}

export const InProgressStageModal: React.FC<InProgressStageModalProps> = ({
  isOpen,
  onClose,
  lead,
  onConfirm,
}) => {
  const [followUpDateTime, setFollowUpDateTime] = useState('');
  const [requiredKw, setRequiredKw] = useState('');
  const [requiredProduct, setRequiredProduct] = useState<RequiredProduct | ''>('');
  const [requiredLoan, setRequiredLoan] = useState<'Yes' | 'No' | ''>('');
  const [requiredFreeSiteVisit, setRequiredFreeSiteVisit] = useState<'Yes' | 'No' | ''>('');
  const [notes, setNotes] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (lead && isOpen) {
      // Default to tomorrow 10:30 AM or existing follow up
      if (lead.next_follow_up) {
        setFollowUpDateTime(lead.next_follow_up.substring(0, 16));
      } else {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(10, 30, 0, 0);
        const pad = (n: number) => (n < 10 ? '0' + n : n);
        setFollowUpDateTime(
          `${tomorrow.getFullYear()}-${pad(tomorrow.getMonth() + 1)}-${pad(tomorrow.getDate())}T10:30`
        );
      }

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
      setNotes(lead.notes || '');
      setSpecialInstructions(lead.special_instructions || '');
      setErrors({});
    }
  }, [lead, isOpen]);

  if (!isOpen || !lead) return null;

  const setPreset = (offsetHours: number, targetHour?: number) => {
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

    if (!requiredKw.trim()) {
      errs.requiredKw = 'Required KW is mandatory for Inprogress stage.';
    }

    if (!requiredProduct) {
      errs.requiredProduct = 'Required Product (On-Grid / Hybrid) is mandatory for Inprogress stage.';
    }

    if (!requiredLoan) {
      errs.requiredLoan = 'Bank Loan Assistance (Yes / No) is mandatory for Inprogress stage.';
    }

    if (!requiredFreeSiteVisit) {
      errs.requiredFreeSiteVisit = 'Free Site Survey Visit (Yes / No) is mandatory for Inprogress stage.';
    }

    if (!followUpDateTime.trim()) {
      errs.followUpDateTime = 'Next Follow Up Date and Time is mandatory.';
    }

    if (!notes.trim()) {
      errs.notes = 'Notes are mandatory when moving lead to Inprogress stage.';
    } else if (notes.trim().length < 3) {
      errs.notes = 'Please provide detailed notes (at least 3 characters).';
    }

    if (!specialInstructions.trim()) {
      errs.specialInstructions = 'Special Instructions are mandatory when moving lead to Inprogress stage.';
    } else if (specialInstructions.trim().length < 3) {
      errs.specialInstructions = 'Please provide specific instructions (at least 3 characters).';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await onConfirm(
        lead.id,
        followUpDateTime.trim(),
        notes.trim(),
        specialInstructions.trim(),
        requiredKw.trim(),
        requiredProduct,
        requiredLoan === 'Yes',
        requiredFreeSiteVisit === 'Yes'
      );
      onClose();
    } catch (err: any) {
      setErrors({ form: err?.message || 'Failed to update stage. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-[#BBD5DA] overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-[linear-gradient(135deg,#0E2429_0%,#17343B_100%)] text-white p-5 border-b border-[#BBD5DA]/20">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#DFF1F1]/20 border border-[#BBD5DA]/30 flex items-center justify-center text-[#DFF1F1] shrink-0">
                <ClipboardList className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#DFF1F1]/20 text-[#DFF1F1] border border-[#BBD5DA]/30">
                    Stage Transition
                  </span>
                  <div className="flex items-center gap-1 text-xs text-[#BBD5DA]">
                    <span className="opacity-75">{lead.lead_status}</span>
                    <ArrowRight className="w-3 h-3" />
                    <span className="font-bold text-white bg-[#FF0000] px-1.5 py-0.2 rounded border border-red-400/40">Inprogress</span>
                  </div>
                </div>
                <h3 className="text-base font-bold text-white mt-1">
                  Change Stage to Inprogress
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

          {/* Lead Quick Details Bar */}
          <div className="mt-3.5 pt-3 border-t border-white/15 flex flex-wrap items-center justify-between text-xs text-[#BBD5DA] gap-2">
            <div className="font-semibold text-white flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-[#DFF1F1]" />
              <span>{lead.customer_name}</span>
              <span className="font-mono text-[#BBD5DA] font-normal">({lead.mobile_number})</span>
            </div>
            <div className="flex items-center gap-1 text-[#BBD5DA]">
              <MapPin className="w-3.5 h-3.5 text-[#DFF1F1]" />
              <span>{lead.district}</span>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5">
          {errors.form && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errors.form}</span>
            </div>
          )}

          <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-100 text-slate-700 text-xs flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-blue-900">Mandatory Requirements for Inprogress Stage</p>
              <p className="text-[11px] text-blue-800/80 mt-0.5">
                To move this solar lead into <strong>Inprogress</strong>, please specify the <strong>Required KW</strong>, <strong>Required Product (On-Grid / Hybrid)</strong>, follow-up appointment time, notes, and instructions.
              </p>
            </div>
          </div>

          {/* Required KW & Required Product (MANDATORY) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            {/* Required KW */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-blue-600" />
                  <span>Required KW</span>
                  <span className="text-rose-600 font-bold">*</span>
                </span>
                {requiredKw && (
                  <span className="text-[10px] font-bold text-blue-600">{requiredKw}</span>
                )}
              </label>
              <div className="relative">
                <input
                  id="input-inprogress-kw"
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
                {['3 kW', '5 kW', '8 kW', '10 kW'].map((kw) => (
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

            {/* Required Product */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1">
                <span>Required Product</span>
                <span className="text-rose-600 font-bold">*</span>
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {(['On-Grid', 'Hybrid'] as RequiredProduct[]).map((prod) => {
                  const isSelected = requiredProduct === prod;
                  return (
                    <button
                      key={prod}
                      type="button"
                      onClick={() => {
                        setRequiredProduct(prod);
                        if (errors.requiredProduct) setErrors((prev) => ({ ...prev, requiredProduct: '' }));
                      }}
                      className={`py-2 px-2 rounded-lg text-xs font-bold border flex items-center justify-center gap-1 transition-all ${
                        isSelected
                          ? 'bg-[#0E2429] text-white border-[#0E2429] shadow-xs'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 text-emerald-400" />}
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
              <div className="mt-1 text-[10px] text-slate-500">
                On-Grid or Hybrid
              </div>
            </div>

            {/* Required Bank Loan Assistance */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1">
                <span>Required Bank Loan Assistance</span>
                <span className="text-rose-600 font-bold">*</span>
              </label>
              <div className="relative">
                <select
                  id="select-inprogress-loan"
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

            {/* Required Free Site Survey Visit */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1">
                <span>Required Free Site Survey Visit</span>
                <span className="text-rose-600 font-bold">*</span>
              </label>
              <div className="relative">
                <select
                  id="select-inprogress-site-visit"
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

          {/* 1. Next Follow Up Date & Time (MANDATORY) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                <span>Next Follow Up Date & Time</span>
                <span className="text-rose-600 font-bold">* Mandatory</span>
              </label>
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-slate-400">Presets:</span>
                <button
                  type="button"
                  onClick={() => setPreset(2)}
                  className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                >
                  +2h
                </button>
                <button
                  type="button"
                  onClick={() => setPreset(24, 10)}
                  className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                >
                  Tomorrow 10AM
                </button>
                <button
                  type="button"
                  onClick={() => setPreset(24, 16)}
                  className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                >
                  Tomorrow 4PM
                </button>
                <button
                  type="button"
                  onClick={() => setPreset(72, 11)}
                  className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                >
                  +3 Days
                </button>
              </div>
            </div>

            <div className="relative">
              <DatePicker
                id="input-inprogress-followup"
                selected={followUpDateTime ? new Date(followUpDateTime) : null}
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
                showTimeSelect
                timeFormat="hh:mm aa"
                timeIntervals={15}
                dateFormat="dd-MM-yyyy hh:mm:ss aa"
                className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold border bg-white outline-hidden transition-all ${
                  errors.followUpDateTime
                    ? 'border-rose-500 ring-2 ring-rose-100'
                    : 'border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100'
                }`}
                placeholderText="Select date and time"
                portalId="root-portal"
              />
            </div>
            {followUpDateTime && (
              <div className="mt-1.5 flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50/80 border border-blue-200 text-blue-900 text-xs font-mono">
                <Calendar className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span>Scheduled: <strong>{formatDateTime(followUpDateTime)}</strong></span>
              </div>
            )}
            {errors.followUpDateTime && (
              <p className="mt-1 text-[11px] text-rose-600 font-semibold flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{errors.followUpDateTime}</span>
              </p>
            )}
          </div>

          {/* 2. Notes (MANDATORY) */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-blue-600" />
              <span>Progress & Discussion Notes</span>
              <span className="text-rose-600 font-bold">* Mandatory</span>
            </label>
            <textarea
              id="input-inprogress-notes"
              rows={3}
              placeholder="e.g. Discussed 5kW On-Grid solar plant proposal. Customer interested in subsidy scheme; sent estimated generation sheet on WhatsApp..."
              value={notes}
              onChange={(e) => {
                setNotes(e.target.value);
                if (errors.notes) {
                  setErrors((prev) => ({ ...prev, notes: '' }));
                }
              }}
              className={`w-full px-3.5 py-2.5 rounded-xl text-xs border bg-slate-50/50 focus:bg-white outline-hidden transition-all ${
                errors.notes
                  ? 'border-rose-500 ring-2 ring-rose-100'
                  : 'border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100'
              }`}
            />
            {errors.notes && (
              <p className="mt-1 text-[11px] text-rose-600 font-semibold flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{errors.notes}</span>
              </p>
            )}
          </div>

          {/* 3. Special Instructions (MANDATORY) */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Special Instructions</span>
              <span className="text-rose-600 font-bold">* Mandatory</span>
            </label>
            <textarea
              id="input-inprogress-instructions"
              rows={2}
              placeholder="e.g. Check shadow from neighbor's coconut tree during site survey, verify 3-phase sanction load with KSEB, bring sample panel spec sheet..."
              value={specialInstructions}
              onChange={(e) => {
                setSpecialInstructions(e.target.value);
                if (errors.specialInstructions) {
                  setErrors((prev) => ({ ...prev, specialInstructions: '' }));
                }
              }}
              className={`w-full px-3.5 py-2.5 rounded-xl text-xs border bg-slate-50/50 focus:bg-white outline-hidden transition-all ${
                errors.specialInstructions
                  ? 'border-rose-500 ring-2 ring-rose-100'
                  : 'border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100'
              }`}
            />
            {errors.specialInstructions && (
              <p className="mt-1 text-[11px] text-rose-600 font-semibold flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{errors.specialInstructions}</span>
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-[#BBD5DA] flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-[#F5F5F5] transition-colors"
            >
              Cancel
            </button>
            <button
              id="btn-confirm-inprogress"
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-[#FF0000] hover:bg-[#D60000] text-white shadow-xs transition-all active:scale-[0.98] disabled:opacity-50 flex items-center gap-1.5"
            >
              {isSubmitting ? (
                <span>Updating Stage...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Confirm Inprogress Stage</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
