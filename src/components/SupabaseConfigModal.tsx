import React, { useState } from 'react';
import { 
  X, 
  Database, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  Check, 
  ExternalLink, 
  Sparkles,
  Server,
  RefreshCw,
  HelpCircle
} from 'lucide-react';
import { SupabaseConfig } from '../types';
import { 
  SUPABASE_SQL_SCHEMA, 
  DEFAULT_SUPABASE_URL, 
  DEFAULT_SUPABASE_ANON_KEY, 
  testConnection, 
  saveStoredSupabaseConfig 
} from '../lib/supabase';

interface SupabaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: SupabaseConfig;
  onSaveConfig: (config: SupabaseConfig) => void;
  onSyncWithSupabase: () => Promise<void>;
}

export const SupabaseConfigModal: React.FC<SupabaseConfigModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  onSyncWithSupabase,
}) => {
  const [url, setUrl] = useState(config.url || DEFAULT_SUPABASE_URL);
  const [anonKey, setAnonKey] = useState(config.anonKey || DEFAULT_SUPABASE_ANON_KEY);
  const [tableName, setTableName] = useState(config.tableName || 'leads');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  if (!isOpen) return null;

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await testConnection(url, anonKey, tableName);
      setTestResult(res);
      if (res.success) {
        const updated: SupabaseConfig = {
          url,
          anonKey,
          tableName,
          isConnected: true,
        };
        saveStoredSupabaseConfig(updated);
        onSaveConfig(updated);
      }
    } catch (err: any) {
      setTestResult({ success: false, message: err?.message || 'Connection test failed.' });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = () => {
    const isConn = testResult?.success || config.isConnected;
    const updated: SupabaseConfig = {
      url,
      anonKey,
      tableName,
      isConnected: isConn,
    };
    saveStoredSupabaseConfig(updated);
    onSaveConfig(updated);
    onClose();
  };

  const copySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await onSyncWithSupabase();
      alert('Data synchronized with Supabase successfully!');
    } catch (e: any) {
      alert('Sync failed: ' + e.message);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-[#BBD5DA] overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-[linear-gradient(135deg,#0E2429_0%,#17343B_100%)] text-white p-5 sm:p-6 flex items-center justify-between border-b border-[#BBD5DA]/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#FF0000] text-white flex items-center justify-center font-bold shadow-xs">
              <Database className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Supabase Database Settings</h2>
              <p className="text-xs text-[#BBD5DA]">
                Connect your cloud database for real-time solar lead persistence
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

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          
          {/* Status banner */}
          <div className={`p-4 rounded-xl border flex items-start gap-3 ${
            config.isConnected
              ? 'bg-green-50 border-green-200 text-green-900'
              : 'bg-amber-50 border-amber-200 text-amber-900'
          }`}>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
              config.isConnected ? 'bg-green-200 text-green-800' : 'bg-amber-200 text-amber-800'
            }`}>
              {config.isConnected ? <CheckCircle2 className="w-5 h-5" /> : <Server className="w-5 h-5" />}
            </div>
            <div className="text-xs">
              <div className="font-bold text-sm">
                {config.isConnected ? 'Connected to Supabase' : 'Offline / Local Persistence Mode'}
              </div>
              <p className="mt-0.5 opacity-90">
                {config.isConnected
                  ? 'All lead creations, edits, and status changes are synced in real-time to your Supabase PostgreSQL table.'
                  : 'Currently storing leads safely in your browser LocalStorage with preloaded Kerala solar demo leads. You can connect your live Supabase project anytime below!'}
              </p>
            </div>
          </div>

          {/* Form Credentials */}
          <div className="space-y-4">
            {/* Supabase URL */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                SUPABASE_URL
              </label>
              <input
                id="input-supabase-url"
                type="text"
                placeholder="https://your-project-id.supabase.co"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg text-xs font-mono border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-hidden"
              />
              <p className="mt-1 text-[11px] text-slate-500">
                Find this in your Supabase Dashboard &gt; Project Settings &gt; API
              </p>
            </div>

            {/* Supabase Anon Key */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                SUPABASE_ANON_KEY
              </label>
              <input
                id="input-supabase-anon-key"
                type="password"
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                value={anonKey}
                onChange={(e) => setAnonKey(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg text-xs font-mono border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-hidden"
              />
              <p className="mt-1 text-[11px] text-slate-500">
                Use your public 'anon' key with row level security.
              </p>
            </div>

            {/* Table Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Table Name
              </label>
              <input
                id="input-supabase-table-name"
                type="text"
                value={tableName}
                onChange={(e) => setTableName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg text-xs font-mono border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-hidden"
              />
            </div>

            {/* Test Connection Button & Result */}
            <div className="pt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={handleTest}
                disabled={testing}
                className="px-4 py-2 rounded-lg text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
                <span>{testing ? 'Testing...' : 'Test Connection'}</span>
              </button>

              {config.isConnected && (
                <button
                  type="button"
                  onClick={handleSync}
                  disabled={isSyncing}
                  className="px-4 py-2 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition-all flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isSyncing ? 'Syncing...' : 'Sync All Leads'}</span>
                </button>
              )}
            </div>

            {testResult && (
              <div className={`p-3.5 rounded-xl text-xs flex items-start gap-2 border ${
                testResult.success 
                  ? 'bg-green-50 border-green-200 text-green-800' 
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}>
                {testResult.success ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-green-600 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                )}
                <div>
                  <strong>{testResult.success ? 'Success!' : 'Connection issue:'}</strong> {testResult.message}
                </div>
              </div>
            )}
          </div>

          {/* Supabase SQL DDL Schema */}
          <div className="bg-slate-900 text-slate-200 p-4 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-amber-400">Required Supabase SQL Schema</span>
                <span className="text-[10px] text-slate-400">(Run once in SQL Editor)</span>
              </div>
              <button
                onClick={copySql}
                className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-800 hover:bg-slate-700 text-white flex items-center gap-1 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy SQL'}</span>
              </button>
            </div>
            <pre className="text-[11px] font-mono bg-slate-950 p-3 rounded-lg overflow-x-auto text-amber-300/90 max-h-40">
              {SUPABASE_SQL_SCHEMA}
            </pre>
          </div>

          {/* Action buttons */}
          <div className="pt-4 border-t border-[#BBD5DA] flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-lg text-xs font-bold text-slate-600 hover:bg-[#F5F5F5] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2.5 rounded-lg text-xs font-bold bg-[#FF0000] hover:bg-[#D60000] text-white shadow-xs transition-all active:scale-95"
            >
              Save Configuration
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
