import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Compass, 
  CheckCircle2, 
  Edit3, 
  CalendarCheck2, 
  ArrowUpRight,
  Download,
  Check,
  Loader2,
  Image as ImageIcon
} from 'lucide-react';
import { formatMonthYearLabel, formatExactDateLabel } from '../lib/dateUtils';
import { downloadElementAsPng } from '../lib/exportUtils';

interface OverallPipelineMetricProps {
  totalLeads: number;
  surveyConfirmedCount: number;
  surveyConfirmedRate: string;
  surveyCompletedCount: number;
  surveyCompletedRate: string;
  orderConfirmedCount: number;
  orderConfirmedRate: string;
  confirmedKw: number;
  modifiedCount: number;
  modificationRate: string;
  activeCreatedMonth: string;
  activeCreatedExactDate?: string;
  activeModifiedMonth: string;
  activeModifiedExactDate?: string;
  activeUserFilter: string;
  onSelectStatusFilter: (
    status: string, 
    createdMonth?: string, 
    modifiedMonth?: string,
    createdExactDate?: string,
    modifiedExactDate?: string
  ) => void;
  onSelectModifiedFilter?: (
    modifiedMonth?: string, 
    createdMonth?: string,
    modifiedExactDate?: string,
    createdExactDate?: string
  ) => void;
}

export const OverallMonthlyPipelineMetrics: React.FC<OverallPipelineMetricProps> = ({
  totalLeads,
  surveyConfirmedCount,
  surveyConfirmedRate,
  surveyCompletedCount,
  surveyCompletedRate,
  orderConfirmedCount,
  orderConfirmedRate,
  confirmedKw,
  modifiedCount,
  modificationRate,
  activeCreatedMonth,
  activeCreatedExactDate,
  activeModifiedMonth,
  activeModifiedExactDate,
  activeUserFilter,
  onSelectStatusFilter,
  onSelectModifiedFilter,
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  const handleDownloadPng = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isExporting) return;
    setIsExporting(true);
    setExportSuccess(false);

    const filename = `overall_monthly_pipeline_metrics_${activeCreatedMonth !== 'ALL' ? `created_${activeCreatedMonth}` : ''}${activeModifiedMonth !== 'ALL' ? `_modified_${activeModifiedMonth}` : ''}`;
    const success = await downloadElementAsPng('overall-monthly-pipeline-metrics-container', filename);

    setIsExporting(false);
    if (success) {
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 2500);
    }
  };

  return (
    <div id="overall-monthly-pipeline-metrics-container" className="space-y-2.5 bg-slate-50/50 p-2 rounded-2xl border border-slate-100">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
            <span>Overall Monthly-Wise Pipeline Metrics</span>
          </h3>
          {activeCreatedMonth !== 'ALL' && (
            <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200">
              Created: {formatMonthYearLabel(activeCreatedMonth)}
            </span>
          )}
          {activeCreatedExactDate && (
            <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200">
              Created Day: {formatExactDateLabel(activeCreatedExactDate)}
            </span>
          )}
          {activeModifiedMonth !== 'ALL' && (
            <span className="text-xs font-bold text-purple-800 bg-purple-100 px-2 py-0.5 rounded border border-purple-200">
              Modified: {formatMonthYearLabel(activeModifiedMonth)}
            </span>
          )}
          {activeModifiedExactDate && (
            <span className="text-xs font-bold text-purple-800 bg-purple-100 px-2 py-0.5 rounded border border-purple-200">
              Modified Day: {formatExactDateLabel(activeModifiedExactDate)}
            </span>
          )}
          {activeUserFilter !== 'ALL' && (
            <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
              Rep: {activeUserFilter}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-slate-500 font-medium hidden md:inline">Click card to filter leads</span>
          <button
            type="button"
            data-export-ignore="false"
            onClick={handleDownloadPng}
            disabled={isExporting}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer shadow-xs ${
              exportSuccess
                ? 'bg-emerald-600 text-white border-emerald-700'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
            }`}
            title="Download Overall Monthly-Wise Pipeline Metrics as PNG image"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                <span>Exporting...</span>
              </>
            ) : exportSuccess ? (
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
        </div>
      </div>

      {/* 5-Column Responsive Metric Grid for the 5 specified metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        
        {/* 1. TOTAL LEADS */}
        <div 
          id="card-metric-total-leads"
          onClick={() => onSelectStatusFilter('ALL', activeCreatedMonth, activeModifiedMonth, activeCreatedExactDate, activeModifiedExactDate)}
          className="bg-white p-4 rounded-2xl border border-[#BBD5DA] shadow-xs hover:border-[#FF0000] hover:shadow-sm transition-all cursor-pointer flex flex-col justify-between group relative overflow-hidden"
          title="Click to view Total Leads"
        >
          <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/5 rounded-bl-full pointer-events-none" />
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-1.5">
              <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-200">
                <Users className="w-3.5 h-3.5" />
              </div>
              <p className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                Total Leads
              </p>
            </div>
            <span className="text-[10px] text-blue-600 font-bold group-hover:underline flex items-center">
              View <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>

          <div className="flex items-baseline gap-2 mt-2.5 relative z-10">
            <span className="text-2xl sm:text-3xl font-bold text-slate-900">{totalLeads}</span>
            <span className="text-[10px] text-blue-700 font-bold bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
              Pipeline
            </span>
          </div>

          <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Inquiries Received</span>
            <span className="font-semibold text-slate-700">100%</span>
          </div>
        </div>

        {/* 2. SITE SURVEY CONFIRMED */}
        <div 
          id="card-metric-survey-confirmed"
          onClick={() => onSelectStatusFilter('Scheduled Site Survey', activeCreatedMonth, activeModifiedMonth, activeCreatedExactDate, activeModifiedExactDate)}
          className="bg-white p-4 rounded-2xl border border-[#BBD5DA] shadow-xs hover:border-[#FF0000] hover:shadow-sm transition-all cursor-pointer flex flex-col justify-between group relative overflow-hidden"
          title="Click to view Site Survey Confirmed (Scheduled)"
        >
          <div className="absolute top-0 right-0 w-20 h-20 bg-purple-500/5 rounded-bl-full pointer-events-none" />
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-1.5">
              <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center border border-purple-200">
                <CalendarCheck2 className="w-3.5 h-3.5" />
              </div>
              <p className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                Survey Confirmed
              </p>
            </div>
            <span className="text-[10px] text-purple-700 font-bold group-hover:underline flex items-center">
              View <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>

          <div className="flex items-baseline gap-2 mt-2.5 relative z-10">
            <span className="text-2xl sm:text-3xl font-bold text-purple-900">{surveyConfirmedCount}</span>
            <span className="text-[10px] text-purple-800 font-bold bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">
              {surveyConfirmedRate}% Rate
            </span>
          </div>

          <div className="mt-2.5 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
              <span>Scheduled Date Booked</span>
              <span className="font-semibold text-purple-800">{surveyConfirmedCount} Booked</span>
            </div>
            <div className="w-full bg-purple-100 rounded-full h-1.5 overflow-hidden">
              <div 
                className="bg-purple-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(Number(surveyConfirmedRate), 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* 3. SITE SURVEY COMPLETED */}
        <div 
          id="card-metric-survey-completed"
          onClick={() => onSelectStatusFilter('Site Survey Completed', activeCreatedMonth, activeModifiedMonth, activeCreatedExactDate, activeModifiedExactDate)}
          className="bg-white p-4 rounded-2xl border border-[#BBD5DA] shadow-xs hover:border-[#FF0000] hover:shadow-sm transition-all cursor-pointer flex flex-col justify-between group relative overflow-hidden"
          title="Click to view Site Survey Completed"
        >
          <div className="absolute top-0 right-0 w-20 h-20 bg-teal-500/5 rounded-bl-full pointer-events-none" />
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-1.5">
              <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-200">
                <Compass className="w-3.5 h-3.5" />
              </div>
              <p className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                Survey Completed
              </p>
            </div>
            <span className="text-[10px] text-teal-700 font-bold group-hover:underline flex items-center">
              View <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>

          <div className="flex items-baseline gap-2 mt-2.5 relative z-10">
            <span className="text-2xl sm:text-3xl font-bold text-teal-900">{surveyCompletedCount}</span>
            <span className="text-[10px] text-teal-800 font-bold bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200">
              {surveyCompletedRate}% Done
            </span>
          </div>

          <div className="mt-2.5 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
              <span>Feasibility & Shading Done</span>
              <span className="font-semibold text-teal-800">{surveyCompletedCount} Verified</span>
            </div>
            <div className="w-full bg-teal-100 rounded-full h-1.5 overflow-hidden">
              <div 
                className="bg-teal-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(Number(surveyCompletedRate), 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* 4. ORDER CONFIRMED */}
        <div 
          id="card-metric-order-confirmed"
          onClick={() => onSelectStatusFilter('Order Confirmed', activeCreatedMonth, activeModifiedMonth, activeCreatedExactDate, activeModifiedExactDate)}
          className="bg-white p-4 rounded-2xl border border-[#BBD5DA] shadow-xs hover:border-[#FF0000] hover:shadow-sm transition-all cursor-pointer flex flex-col justify-between group relative overflow-hidden"
          title="Click to view Order Confirmed leads"
        >
          <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/5 rounded-bl-full pointer-events-none" />
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-1.5">
              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
              <p className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                Order Confirmed
              </p>
            </div>
            <span className="text-[10px] text-emerald-700 font-bold group-hover:underline flex items-center">
              View <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>

          <div className="flex items-baseline gap-2 mt-2.5 relative z-10">
            <span className="text-2xl sm:text-3xl font-bold text-emerald-700">{orderConfirmedCount}</span>
            <span className="text-[10px] text-emerald-800 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
              {orderConfirmedRate}% Conv.
            </span>
          </div>

          <div className="mt-2.5 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
              <span>{confirmedKw > 0 ? `${confirmedKw} kW Closed` : 'Contracts Signed'}</span>
              <span className="font-semibold text-emerald-700">{orderConfirmedCount} Won</span>
            </div>
            <div className="w-full bg-emerald-100 rounded-full h-1.5 overflow-hidden">
              <div 
                className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(Number(orderConfirmedRate), 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* 5. MODIFIED LEADS */}
        <div 
          id="card-metric-modified-leads"
          onClick={() => {
            if (onSelectModifiedFilter) {
              onSelectModifiedFilter(activeModifiedMonth, activeCreatedMonth, activeModifiedExactDate, activeCreatedExactDate);
            } else {
              onSelectStatusFilter('ALL', activeCreatedMonth, activeModifiedMonth, activeCreatedExactDate, activeModifiedExactDate);
            }
          }}
          className="bg-white p-4 rounded-2xl border border-[#BBD5DA] shadow-xs hover:border-[#FF0000] hover:shadow-sm transition-all cursor-pointer flex flex-col justify-between group relative overflow-hidden"
          title="Click to view Modified Leads"
        >
          <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/5 rounded-bl-full pointer-events-none" />
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-1.5">
              <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-800 flex items-center justify-center border border-amber-200">
                <Edit3 className="w-3.5 h-3.5" />
              </div>
              <p className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                Modified Leads
              </p>
            </div>
            <span className="text-[10px] text-amber-800 font-bold group-hover:underline flex items-center">
              View <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>

          <div className="flex items-baseline gap-2 mt-2.5 relative z-10">
            <span className="text-2xl sm:text-3xl font-bold text-amber-900">{modifiedCount}</span>
            <span className="text-[10px] text-amber-800 font-bold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
              Active Updates
            </span>
          </div>

          <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Status / Notes Logged</span>
            <span className="font-semibold text-amber-900">{modifiedCount} Leads</span>
          </div>
        </div>

      </div>
    </div>
  );
};

