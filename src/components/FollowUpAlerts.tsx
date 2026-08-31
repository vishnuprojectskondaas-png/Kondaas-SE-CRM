import React, { useState } from 'react';
import { 
  Clock, 
  AlertTriangle, 
  Phone, 
  MessageSquare, 
  Calendar, 
  CheckCircle2, 
  MapPin, 
  User, 
  IndianRupee, 
  ArrowRight,
  ExternalLink,
  Filter,
  Check,
  Sparkles
} from 'lucide-react';
import { Lead, LeadStatus, AppUser } from '../types';
import { LEAD_STATUSES } from '../lib/mockData';
import { formatDateTime } from '../lib/dateUtils';

interface FollowUpAlertsProps {
  leads: Lead[];
  currentUser?: AppUser | null;
  onUpdateLeadStatus: (leadId: string, newStatus: LeadStatus) => void;
  onRescheduleFollowUp: (lead: Lead) => void;
  onEditLead: (lead: Lead) => void;
  onOpenUpdateLeadModal?: (lead: Lead) => void;
}

export const FollowUpAlerts: React.FC<FollowUpAlertsProps> = ({
  leads,
  currentUser,
  onUpdateLeadStatus,
  onRescheduleFollowUp,
  onEditLead,
  onOpenUpdateLeadModal,
}) => {
  const isUserLogin = Boolean(currentUser && currentUser.role !== 'Admin' && currentUser.role !== 'Branch Manager');
  const showResponsibleRep = !isUserLogin;

  const [filterType, setFilterType] = useState<'ALL' | 'OVERDUE' | 'TODAY'>('ALL');

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const todayEnd = todayStart + 86400000;

  // Process actionable leads with follow ups
  const followUpItems = leads
    .filter((lead) => {
      if (!lead.next_follow_up || lead.lead_status === 'Open' || lead.lead_status === 'Order Confirmed' || lead.lead_status === 'Not Intrested' || lead.lead_status === 'Lost') {
        return false;
      }
      const fTime = new Date(lead.next_follow_up).getTime();
      if (isNaN(fTime)) return false;
      return fTime <= todayEnd; // Overdue or due today
    })
    .map((lead) => {
      const fTime = new Date(lead.next_follow_up!).getTime();
      const isOverdue = fTime < todayStart;
      const isToday = fTime >= todayStart && fTime < todayEnd;
      
      const diffMs = Date.now() - fTime;
      const diffDays = Math.floor(diffMs / 86400000);
      const diffHours = Math.floor(diffMs / 3600000);

      return {
        lead,
        isOverdue,
        isToday,
        diffDays,
        diffHours,
        fTime,
      };
    })
    .sort((a, b) => a.fTime - b.fTime);

  const overdueList = followUpItems.filter((item) => item.isOverdue);
  const todayList = followUpItems.filter((item) => item.isToday);

  const displayedList = followUpItems.filter((item) => {
    if (filterType === 'OVERDUE') return item.isOverdue;
    if (filterType === 'TODAY') return item.isToday;
    return true;
  });

  const generateWhatsAppLink = (lead: Lead) => {
    const cleanPhone = lead.mobile_number.replace(/[^0-9]/g, '');
    const phoneWithCountry = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const text = encodeURIComponent(
      `Hello ${lead.customer_name}, Greetings from Solar CRM! Following up regarding your rooftop solar inquiry for your home in ${lead.district}. Would you like to schedule the free site visit or discuss the PM Surya Ghar subsidy?`
    );
    return `https://wa.me/${phoneWithCountry}?text=${text}`;
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-xl p-5 sm:p-6 border border-[#BBD5DA] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-[#DFF1F1] text-[#FF0000] flex items-center justify-center border border-[#BBD5DA]">
              <Clock className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">
              Follow-up Action Center
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Immediate customer callbacks, site survey appointments, and overdue lead follow-ups
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 bg-[#F5F5F5] p-1 rounded-lg border border-[#BBD5DA]">
          <button
            onClick={() => setFilterType('ALL')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              filterType === 'ALL'
                ? 'bg-white text-slate-900 shadow-xs font-bold border border-[#BBD5DA]'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Actionable ({followUpItems.length})
          </button>
          <button
            onClick={() => setFilterType('OVERDUE')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
              filterType === 'OVERDUE'
                ? 'bg-[#FF0000] text-white shadow-xs font-bold'
                : 'text-[#FF0000] hover:bg-[#FF0000]/10'
            }`}
          >
            <span>Overdue</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/20 text-white font-bold">
              {overdueList.length}
            </span>
          </button>
          <button
            onClick={() => setFilterType('TODAY')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
              filterType === 'TODAY'
                ? 'bg-[#0E2429] text-white shadow-xs font-bold'
                : 'text-[#0E2429] hover:bg-[#DFF1F1]'
            }`}
          >
            <span>Today's Due</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-[#DFF1F1] text-[#0E2429] font-bold">
              {todayList.length}
            </span>
          </button>
        </div>
      </div>

      {/* Leads List */}
      {displayedList.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center border border-[#BBD5DA] shadow-xs">
          <div className="w-12 h-12 rounded-lg bg-[#DFF1F1] text-emerald-700 mx-auto flex items-center justify-center mb-3 border border-[#BBD5DA]">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">All Caught Up!</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            There are no overdue or pending follow-ups in this queue. Great job staying on top of your solar leads.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {displayedList.map(({ lead, isOverdue, diffDays, diffHours }) => {
            const formattedFollowUp = formatDateTime(lead.next_follow_up);

            return (
              <div
                key={lead.id}
                className={`bg-white rounded-xl p-5 border transition-all hover:shadow-md relative overflow-hidden flex flex-col justify-between ${
                  isOverdue ? 'border-[#FF0000]/40 ring-1 ring-[#FF0000]/20' : 'border-[#BBD5DA]'
                }`}
              >
                {/* Status & Priority Badge Top bar */}
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {isOverdue ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-[#FF0000]/10 text-[#FF0000] border border-[#FF0000]/30">
                          <AlertTriangle className="w-3 h-3 text-[#FF0000]" />
                          Overdue ({diffDays > 0 ? `${diffDays}d ago` : `${diffHours}h ago`})
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-[#DFF1F1] text-[#0E2429] border border-[#BBD5DA]">
                          <Clock className="w-3 h-3 text-[#0E2429]" />
                          Due Today: {formattedFollowUp}
                        </span>
                      )}

                      <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-[#F5F5F5] text-slate-700 border border-[#BBD5DA]">
                        {lead.lead_status}
                      </span>
                    </div>

                    <span className="text-[11px] font-semibold text-slate-500">
                      {lead.district}
                    </span>
                  </div>

                  {/* Customer Info */}
                  <div className="mb-3">
                    <h3 className="text-base font-bold text-slate-900 hover:text-[#FF0000] cursor-pointer transition-colors" onClick={() => onEditLead(lead)}>
                      {lead.customer_name}
                    </h3>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 mt-1">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {lead.sub_district ? `${lead.sub_district}, ${lead.district}` : lead.district}
                      </span>
                      {showResponsibleRep && (
                        <span className="flex items-center gap-1 font-medium text-slate-700">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          {lead.responsible}
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-[10.5px] text-slate-500 font-mono">
                        <Clock className="w-3 h-3 text-[#FF0000]" />
                        <span>Mod: {formatDateTime(lead.updated_at || lead.created_at)}</span>
                      </span>
                    </div>
                  </div>

                  {/* KSEB Bill & Roof details */}
                  <div className="flex flex-wrap items-center gap-2 mb-4 text-xs">
                    <span className="px-2.5 py-1 rounded-md bg-[#F5F5F5] font-semibold text-slate-800 border border-[#BBD5DA] flex items-center gap-1">
                      <IndianRupee className="w-3 h-3 text-emerald-600 shrink-0" />
                      {lead.avg_kseb_bill || '—'}
                    </span>
                    <span className="px-2.5 py-1 rounded-md bg-[#F5F5F5] font-medium text-slate-700 border border-[#BBD5DA]">
                      Roof: {lead.roof_type}
                    </span>
                    {lead.required_free_site_visit && (
                      <span className="px-2 py-0.5 rounded-md bg-[#DFF1F1] text-[#0E2429] text-[11px] font-bold border border-[#BBD5DA]">
                        Site Visit Req.
                      </span>
                    )}
                  </div>

                  {lead.notes && (
                    <p className="text-xs text-slate-600 bg-[#F5F5F5] p-2.5 rounded-lg border border-[#BBD5DA] mb-2 line-clamp-2">
                      <span className="font-bold text-slate-800">Notes:</span> {lead.notes}
                    </p>
                  )}

                  {lead.special_instructions && (
                    <p className="text-xs text-amber-950 bg-amber-50/80 p-2.5 rounded-lg border border-amber-200 mb-4 line-clamp-2 flex items-start gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                      <span><strong>Special Instructions:</strong> {lead.special_instructions}</span>
                    </p>
                  )}
                </div>

                {/* Direct Action Buttons: Call, WhatsApp, Reschedule */}
                <div className="pt-3 border-t border-[#BBD5DA]/40 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {/* Direct Call */}
                    <a
                      href={`tel:${lead.mobile_number}`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#DFF1F1] hover:bg-[#cde9e9] text-[#0A2228] border border-[#BBD5DA] transition-colors"
                    >
                      <Phone className="w-3.5 h-3.5 text-[#0A2228]" />
                      <span>Call</span>
                    </a>

                    {/* Direct WhatsApp */}
                    <a
                      href={generateWhatsAppLink(lead)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 transition-colors"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-700" />
                      <span>WhatsApp</span>
                    </a>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {onOpenUpdateLeadModal && (
                      <button
                        onClick={() => onOpenUpdateLeadModal(lead)}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#FF0000] hover:bg-[#D60000] text-white shadow-xs transition-colors flex items-center gap-1 active:scale-95"
                        title="Update Lead (Blank mandatory form with notes)"
                      >
                        <span>Update Lead</span>
                      </button>
                    )}

                    {/* Quick Reschedule */}
                    <button
                      onClick={() => onRescheduleFollowUp(lead)}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-[#F5F5F5] hover:bg-[#DFF1F1] border border-[#BBD5DA] transition-colors flex items-center gap-1"
                    >
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      <span>Reschedule</span>
                    </button>

                    {/* Status Dropdown */}
                    <select
                      value={lead.lead_status}
                      onChange={(e) => onUpdateLeadStatus(lead.id, e.target.value as LeadStatus)}
                      className="px-2 py-1.5 rounded-lg text-xs font-semibold bg-white border border-[#BBD5DA] text-slate-700 focus:ring-2 focus:ring-[#FF0000]/20 focus:border-[#FF0000] cursor-pointer"
                    >
                      {LEAD_STATUSES.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
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
