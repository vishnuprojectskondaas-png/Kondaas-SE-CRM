import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, AlertCircle, Check } from 'lucide-react';
import DatePicker from 'react-datepicker';
import { format } from 'date-fns';
import { Lead } from '../types';
import { formatDateTime } from '../lib/dateUtils';

interface RescheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: Lead | null;
  onSave: (leadId: string, newDateTime: string, notes?: string) => Promise<void>;
}

export const RescheduleModal: React.FC<RescheduleModalProps> = ({
  isOpen,
  onClose,
  lead,
  onSave,
}) => {
  const [dateTime, setDateTime] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (lead) {
      setDateTime(lead.next_follow_up ? lead.next_follow_up.substring(0, 16) : '');
      setNote('');
      setError('');
    }
  }, [lead, isOpen]);

  if (!isOpen || !lead) return null;

  const setPreset = (hours: number) => {
    const d = new Date();
    d.setHours(d.getHours() + hours);
    const pad = (n: number) => (n < 10 ? '0' + n : n);
    setDateTime(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`);
    setError('');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dateTime.trim()) {
      setError('Please select a valid date and time for the follow-up.');
      return;
    }
    setSaving(true);
    try {
      await onSave(lead.id, dateTime, note);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to reschedule.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-md bg-white rounded-xl shadow-2xl border border-[#BBD5DA] overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-[linear-gradient(135deg,#0E2429_0%,#17343B_100%)] text-white p-4 sm:p-5 flex items-center justify-between border-b border-[#BBD5DA]/20">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#DFF1F1] text-[#0E2429] flex items-center justify-center font-bold border border-[#BBD5DA]">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold">Reschedule Follow-up</h3>
              <p className="text-[11px] text-[#BBD5DA]">{lead.customer_name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSave} className="p-5 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Quick Presets */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Quick Presets</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPreset(2)}
                className="py-1.5 px-2 rounded-lg text-xs font-semibold bg-[#F5F5F5] hover:bg-[#DFF1F1] text-slate-700 border border-[#BBD5DA] transition-colors"
              >
                In 2 Hours
              </button>
              <button
                type="button"
                onClick={() => setPreset(24)}
                className="py-1.5 px-2 rounded-lg text-xs font-semibold bg-[#F5F5F5] hover:bg-[#DFF1F1] text-slate-700 border border-[#BBD5DA] transition-colors"
              >
                Tomorrow
              </button>
              <button
                type="button"
                onClick={() => setPreset(72)}
                className="py-1.5 px-2 rounded-lg text-xs font-semibold bg-[#F5F5F5] hover:bg-[#DFF1F1] text-slate-700 border border-[#BBD5DA] transition-colors"
              >
                In 3 Days
              </button>
            </div>
          </div>

          {/* Date Picker */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Select Date & Time <span className="text-rose-500">*</span>
            </label>
            <DatePicker
              selected={dateTime ? new Date(dateTime) : null}
              onChange={(date: Date | null) => {
                if (date) {
                  setDateTime(format(date, "yyyy-MM-dd'T'HH:mm:ss"));
                } else {
                  setDateTime('');
                }
                if (error) setError('');
              }}
              showTimeSelect
              timeFormat="hh:mm aa"
              timeIntervals={15}
              dateFormat="dd-MM-yyyy hh:mm:ss aa"
              className="w-full px-3.5 py-2.5 rounded-lg text-xs border border-[#BBD5DA] bg-white font-medium focus:border-[#FF0000] focus:ring-1 focus:ring-[#FF0000]/20 outline-hidden"
              placeholderText="Select date and time"
                portalId="root-portal"
            />
            {dateTime && (
              <div className="mt-1.5 flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#DFF1F1] border border-[#BBD5DA] text-[#0E2429] text-xs font-mono">
                <Calendar className="w-3.5 h-3.5 text-[#0E2429] shrink-0" />
                <span>Scheduled: <strong>{formatDateTime(dateTime)}</strong></span>
              </div>
            )}
          </div>

          {/* Optional Note */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Follow-up Call Note (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Customer requested call after 4 PM"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3.5 py-2 rounded-lg text-xs border border-[#BBD5DA] bg-[#F5F5F5]/60 focus:bg-white focus:border-[#FF0000] focus:ring-1 focus:ring-[#FF0000]/20 outline-hidden"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-[#BBD5DA] flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 rounded-lg text-xs font-bold text-slate-600 hover:bg-[#F5F5F5] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded-lg text-xs font-bold bg-[#FF0000] hover:bg-[#D60000] text-white shadow-xs transition-colors active:scale-95"
            >
              {saving ? 'Updating...' : 'Save New Schedule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
