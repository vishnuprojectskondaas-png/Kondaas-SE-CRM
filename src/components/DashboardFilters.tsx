import React, { useState } from 'react';
import { 
  UserCheck, 
  CalendarPlus, 
  CalendarClock, 
  RotateCcw, 
  Filter, 
  ListFilter,
  Calendar,
  Clock,
  CalendarDays
} from 'lucide-react';
import { 
  formatMonthYearLabel, 
  formatExactDateLabel, 
  getYearMonthKey, 
  getExactDateKey 
} from '../lib/dateUtils';
import { UserRole } from '../types';

export interface DashboardFiltersProps {
  // 1. Responsible filter
  activeUserFilter: string;
  onUserChange: (user: string) => void;
  representativeOptions: { name: string; role?: UserRole; email?: string; count: number }[];
  totalLeadsCount: number;

  // 2. Lead created on filter (Monthly & Exact Date)
  activeCreatedMonth: string;
  onCreatedMonthChange: (month: string) => void;
  availableCreatedMonths: string[];
  activeCreatedExactDate: string;
  onCreatedExactDateChange: (dateStr: string) => void;

  // 3. Lead modified on filter (Monthly & Exact Date)
  activeModifiedMonth: string;
  onModifiedMonthChange: (month: string) => void;
  availableModifiedMonths: string[];
  activeModifiedExactDate: string;
  onModifiedExactDateChange: (dateStr: string) => void;

  // Actions
  onResetFilters: () => void;
  matchedLeadsCount: number;
  onViewFilteredLeads?: () => void;
}

export const DashboardFilters: React.FC<DashboardFiltersProps> = ({
  activeUserFilter,
  onUserChange,
  representativeOptions,
  totalLeadsCount,
  activeCreatedMonth,
  onCreatedMonthChange,
  availableCreatedMonths,
  activeCreatedExactDate,
  onCreatedExactDateChange,
  activeModifiedMonth,
  onModifiedMonthChange,
  availableModifiedMonths,
  activeModifiedExactDate,
  onModifiedExactDateChange,
  onResetFilters,
  matchedLeadsCount,
  onViewFilteredLeads,
}) => {
  // Local mode toggles for Created & Modified ('monthly' | 'exact')
  const [createdFilterMode, setCreatedFilterMode] = useState<'monthly' | 'exact'>(
    activeCreatedExactDate ? 'exact' : 'monthly'
  );
  const [modifiedFilterMode, setModifiedFilterMode] = useState<'monthly' | 'exact'>(
    activeModifiedExactDate ? 'exact' : 'monthly'
  );

  const isCreatedFiltered = 
    (createdFilterMode === 'monthly' && activeCreatedMonth !== 'ALL') ||
    (createdFilterMode === 'exact' && !!activeCreatedExactDate);

  const isModifiedFiltered = 
    (modifiedFilterMode === 'monthly' && activeModifiedMonth !== 'ALL') ||
    (modifiedFilterMode === 'exact' && !!activeModifiedExactDate);

  const isAnyFilterActive = 
    activeUserFilter !== 'ALL' || 
    isCreatedFiltered || 
    isModifiedFiltered;

  const currentMonthKey = getYearMonthKey(new Date());
  const todayKey = getExactDateKey(new Date()) || '';
  
  // Yesterday calculation
  const yDate = new Date();
  yDate.setDate(yDate.getDate() - 1);
  const yesterdayKey = getExactDateKey(yDate) || '';

  return (
    <div className="bg-white p-5 rounded-2xl border border-[#BBD5DA] shadow-xs space-y-4">
      {/* Header & Badges */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#DFF1F1] text-[#0E2429] flex items-center justify-center font-bold">
            <Filter className="w-4 h-4 text-[#0E2429]" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span>Admin Dashboard Analytics Filters</span>
              {isAnyFilterActive && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-300">
                  Filters Active
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-500">
              Filter by Responsible Rep, Lead Created Date (Monthly / Exact), and Lead Modified Date (Monthly / Exact)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {isAnyFilterActive && (
            <button
              type="button"
              onClick={() => {
                onResetFilters();
                setCreatedFilterMode('monthly');
                setModifiedFilterMode('monthly');
              }}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-200 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Filters</span>
            </button>
          )}

          {onViewFilteredLeads && (
            <button
              type="button"
              onClick={onViewFilteredLeads}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#0E2429] hover:bg-[#1a3f47] text-white shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <ListFilter className="w-3.5 h-3.5" />
              <span>View {matchedLeadsCount} Leads</span>
            </button>
          )}
        </div>
      </div>

      {/* The 3 Core Filters Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* 1. RESPONSIBLE FILTER */}
        <div className="space-y-1.5 flex flex-col justify-between">
          <div>
            <label 
              htmlFor="filter-responsible-select"
              className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1"
            >
              <span className="flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                <span>1. Responsible Filter</span>
              </span>
              {activeUserFilter !== 'ALL' && (
                <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
                  Selected
                </span>
              )}
            </label>

            <div className="relative mt-2">
              <select
                id="filter-responsible-select"
                value={activeUserFilter}
                onChange={(e) => onUserChange(e.target.value)}
                className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-[#BBD5DA] bg-white focus:outline-none focus:border-[#FF0000] focus:ring-1 focus:ring-[#FF0000] text-slate-900 transition-all cursor-pointer"
              >
                <option value="ALL">All Representatives ({totalLeadsCount} Total Leads)</option>
                {representativeOptions.map((rep) => (
                  <option key={rep.name} value={rep.name}>
                    {rep.name} {rep.role ? `(${rep.role})` : ''} — {rep.count} Leads
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="text-[11px] text-slate-500 pt-1">
            {activeUserFilter === 'ALL' ? (
              <span>Viewing all assigned representatives</span>
            ) : (
              <span className="font-medium text-blue-700">
                Assigned Rep: <strong>{activeUserFilter}</strong>
              </span>
            )}
          </div>
        </div>

        {/* 2. LEAD CREATED ON FILTER (Monthly & Exact Date) */}
        <div className="space-y-1.5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1">
              <span className="flex items-center gap-1.5">
                <CalendarPlus className="w-3.5 h-3.5 text-emerald-600" />
                <span>2. Lead Created On Filter</span>
              </span>
              
              {/* Toggle Mode: Monthly vs Exact Date */}
              <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-[10px]">
                <button
                  type="button"
                  onClick={() => {
                    setCreatedFilterMode('monthly');
                    if (activeCreatedExactDate) onCreatedExactDateChange('');
                  }}
                  className={`px-2 py-0.5 rounded-md font-bold transition-all cursor-pointer ${
                    createdFilterMode === 'monthly'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Monthly
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCreatedFilterMode('exact');
                    if (activeCreatedMonth !== 'ALL') onCreatedMonthChange('ALL');
                  }}
                  className={`px-2 py-0.5 rounded-md font-bold transition-all cursor-pointer ${
                    createdFilterMode === 'exact'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Exact Date
                </button>
              </div>
            </div>

            {createdFilterMode === 'monthly' ? (
              <div className="relative mt-2">
                <select
                  id="filter-created-on-select"
                  value={activeCreatedMonth}
                  onChange={(e) => onCreatedMonthChange(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-[#BBD5DA] bg-white focus:outline-none focus:border-[#FF0000] focus:ring-1 focus:ring-[#FF0000] text-emerald-900 transition-all cursor-pointer"
                >
                  <option value="ALL">All Creation Months (All Time)</option>
                  {availableCreatedMonths.map((mKey) => (
                    <option key={mKey} value={mKey}>
                      Created in {formatMonthYearLabel(mKey)} {mKey === currentMonthKey ? '(Current Month)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="space-y-1.5 mt-2">
                <div className="relative">
                  <input
                    type="date"
                    id="filter-created-on-exact"
                    value={activeCreatedExactDate}
                    onChange={(e) => onCreatedExactDateChange(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs font-semibold rounded-xl border border-[#BBD5DA] bg-white focus:outline-none focus:border-[#FF0000] focus:ring-1 focus:ring-[#FF0000] text-emerald-900 transition-all cursor-pointer"
                  />
                </div>
                {/* Quick Date Chips */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => onCreatedExactDateChange(todayKey)}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-all cursor-pointer ${
                      activeCreatedExactDate === todayKey
                        ? 'bg-emerald-600 text-white border-emerald-700'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    onClick={() => onCreatedExactDateChange(yesterdayKey)}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-all cursor-pointer ${
                      activeCreatedExactDate === yesterdayKey
                        ? 'bg-emerald-600 text-white border-emerald-700'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Yesterday
                  </button>
                  {activeCreatedExactDate && (
                    <button
                      type="button"
                      onClick={() => onCreatedExactDateChange('')}
                      className="px-2 py-0.5 rounded text-[10px] text-rose-600 hover:bg-rose-50 border border-rose-200 font-semibold cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="text-[11px] text-slate-500 pt-1">
            {createdFilterMode === 'monthly' ? (
              activeCreatedMonth === 'ALL' ? (
                <span>Includes all inquiry entry months</span>
              ) : (
                <span className="font-medium text-emerald-800">
                  Month: <strong>{formatMonthYearLabel(activeCreatedMonth)}</strong>
                </span>
              )
            ) : (
              activeCreatedExactDate ? (
                <span className="font-medium text-emerald-800">
                  Exact Date: <strong>{formatExactDateLabel(activeCreatedExactDate)}</strong>
                </span>
              ) : (
                <span>Pick any exact day to view leads created on that date</span>
              )
            )}
          </div>
        </div>

        {/* 3. LEAD MODIFIED ON FILTER (Monthly & Exact Date) */}
        <div className="space-y-1.5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1">
              <span className="flex items-center gap-1.5">
                <CalendarClock className="w-3.5 h-3.5 text-purple-600" />
                <span>3. Lead Modified On Filter</span>
              </span>

              {/* Toggle Mode: Monthly vs Exact Date */}
              <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-[10px]">
                <button
                  type="button"
                  onClick={() => {
                    setModifiedFilterMode('monthly');
                    if (activeModifiedExactDate) onModifiedExactDateChange('');
                  }}
                  className={`px-2 py-0.5 rounded-md font-bold transition-all cursor-pointer ${
                    modifiedFilterMode === 'monthly'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Monthly
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setModifiedFilterMode('exact');
                    if (activeModifiedMonth !== 'ALL') onModifiedMonthChange('ALL');
                  }}
                  className={`px-2 py-0.5 rounded-md font-bold transition-all cursor-pointer ${
                    modifiedFilterMode === 'exact'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Exact Date
                </button>
              </div>
            </div>

            {modifiedFilterMode === 'monthly' ? (
              <div className="relative mt-2">
                <select
                  id="filter-modified-on-select"
                  value={activeModifiedMonth}
                  onChange={(e) => onModifiedMonthChange(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-[#BBD5DA] bg-white focus:outline-none focus:border-[#FF0000] focus:ring-1 focus:ring-[#FF0000] text-purple-900 transition-all cursor-pointer"
                >
                  <option value="ALL">All Modification Periods (Any Month)</option>
                  {availableModifiedMonths.map((mKey) => (
                    <option key={mKey} value={mKey}>
                      Modified in {formatMonthYearLabel(mKey)} {mKey === currentMonthKey ? '(Current Month)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="space-y-1.5 mt-2">
                <div className="relative">
                  <input
                    type="date"
                    id="filter-modified-on-exact"
                    value={activeModifiedExactDate}
                    onChange={(e) => onModifiedExactDateChange(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs font-semibold rounded-xl border border-[#BBD5DA] bg-white focus:outline-none focus:border-[#FF0000] focus:ring-1 focus:ring-[#FF0000] text-purple-900 transition-all cursor-pointer"
                  />
                </div>
                {/* Quick Date Chips */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => onModifiedExactDateChange(todayKey)}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-all cursor-pointer ${
                      activeModifiedExactDate === todayKey
                        ? 'bg-purple-600 text-white border-purple-700'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    onClick={() => onModifiedExactDateChange(yesterdayKey)}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-all cursor-pointer ${
                      activeModifiedExactDate === yesterdayKey
                        ? 'bg-purple-600 text-white border-purple-700'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Yesterday
                  </button>
                  {activeModifiedExactDate && (
                    <button
                      type="button"
                      onClick={() => onModifiedExactDateChange('')}
                      className="px-2 py-0.5 rounded text-[10px] text-rose-600 hover:bg-rose-50 border border-rose-200 font-semibold cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="text-[11px] text-slate-500 pt-1">
            {modifiedFilterMode === 'monthly' ? (
              activeModifiedMonth === 'ALL' ? (
                <span>Includes all update & note dates</span>
              ) : (
                <span className="font-medium text-purple-800">
                  Month: <strong>{formatMonthYearLabel(activeModifiedMonth)}</strong>
                </span>
              )
            ) : (
              activeModifiedExactDate ? (
                <span className="font-medium text-purple-800">
                  Exact Date: <strong>{formatExactDateLabel(activeModifiedExactDate)}</strong>
                </span>
              ) : (
                <span>Pick any exact day to view leads modified on that date</span>
              )
            )}
          </div>
        </div>

      </div>

      {/* Quick Filter Status Summary Pills */}
      {isAnyFilterActive && (
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-slate-500 font-medium">Active Analytics Filter:</span>
            
            {activeUserFilter !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-900 border border-blue-200 text-xs font-semibold">
                <span>Rep: <strong>{activeUserFilter}</strong></span>
                <button
                  type="button"
                  onClick={() => onUserChange('ALL')}
                  className="text-blue-500 hover:text-rose-600 font-bold ml-1"
                  title="Clear representative filter"
                >
                  ×
                </button>
              </span>
            )}

            {activeCreatedMonth !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-900 border border-emerald-200 text-xs font-semibold">
                <span>Created Month: <strong>{formatMonthYearLabel(activeCreatedMonth)}</strong></span>
                <button
                  type="button"
                  onClick={() => onCreatedMonthChange('ALL')}
                  className="text-emerald-600 hover:text-rose-600 font-bold ml-1"
                  title="Clear creation month filter"
                >
                  ×
                </button>
              </span>
            )}

            {activeCreatedExactDate && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-900 border border-emerald-200 text-xs font-semibold">
                <span>Created Day: <strong>{formatExactDateLabel(activeCreatedExactDate)}</strong></span>
                <button
                  type="button"
                  onClick={() => onCreatedExactDateChange('')}
                  className="text-emerald-600 hover:text-rose-600 font-bold ml-1"
                  title="Clear creation exact date filter"
                >
                  ×
                </button>
              </span>
            )}

            {activeModifiedMonth !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-50 text-purple-900 border border-purple-200 text-xs font-semibold">
                <span>Modified Month: <strong>{formatMonthYearLabel(activeModifiedMonth)}</strong></span>
                <button
                  type="button"
                  onClick={() => onModifiedMonthChange('ALL')}
                  className="text-purple-600 hover:text-rose-600 font-bold ml-1"
                  title="Clear modified month filter"
                >
                  ×
                </button>
              </span>
            )}

            {activeModifiedExactDate && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-50 text-purple-900 border border-purple-200 text-xs font-semibold">
                <span>Modified Day: <strong>{formatExactDateLabel(activeModifiedExactDate)}</strong></span>
                <button
                  type="button"
                  onClick={() => onModifiedExactDateChange('')}
                  className="text-purple-600 hover:text-rose-600 font-bold ml-1"
                  title="Clear modified exact date filter"
                >
                  ×
                </button>
              </span>
            )}
          </div>

          <span className="text-slate-600 font-bold">
            {matchedLeadsCount} matching out of {totalLeadsCount} leads
          </span>
        </div>
      )}
    </div>
  );
};

