import React, { useState, useRef } from 'react';
import { 
  X, 
  Upload, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertTriangle, 
  Download, 
  FileCheck, 
  AlertCircle,
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import { LeadFormData } from '../types';
import { parseExcelFile, downloadSampleTemplate, ParseResult } from '../lib/excel';

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBulkImport: (leads: LeadFormData[]) => Promise<void>;
}

export const ExcelImportModal: React.FC<ExcelImportModalProps> = ({
  isOpen,
  onClose,
  onBulkImport,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importSuccessMessage, setImportSuccessMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = async (selectedFile: File) => {
    if (!selectedFile) return;
    setFile(selectedFile);
    setIsParsing(true);
    setImportSuccessMessage(null);

    try {
      const result = await parseExcelFile(selectedFile);
      setParseResult(result);
    } catch (err: any) {
      console.error('Excel parse error', err);
      alert('Failed to parse Excel file. Please ensure it is a valid .xlsx or .csv file.');
    } finally {
      setIsParsing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleExecuteImport = async () => {
    if (!parseResult || parseResult.validLeads.length === 0) return;
    setIsImporting(true);

    try {
      await onBulkImport(parseResult.validLeads);
      setImportSuccessMessage(`Successfully imported ${parseResult.validLeads.length} leads!`);
      setTimeout(() => {
        onClose();
        setFile(null);
        setParseResult(null);
        setImportSuccessMessage(null);
      }, 1200);
    } catch (err: any) {
      alert('Error saving imported leads: ' + err.message);
    } finally {
      setIsImporting(false);
    }
  };

  const reset = () => {
    setFile(null);
    setParseResult(null);
    setImportSuccessMessage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white rounded-xl shadow-2xl border border-[#BBD5DA] overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-[linear-gradient(135deg,#0E2429_0%,#17343B_100%)] text-white p-5 sm:p-6 flex items-center justify-between border-b border-[#BBD5DA]/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#FF0000] text-white flex items-center justify-center font-bold shadow-xs">
              <FileSpreadsheet className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Import Solar Leads from Excel</h2>
              <p className="text-xs text-[#BBD5DA]">
                Powered by SheetJS (.xlsx / .csv)
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
          
          {/* Quick template download banner */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                <Download className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">Need the standardized template?</h4>
                <p className="text-[11px] text-slate-500">
                  Download sample Excel sheet with pre-configured headers and example data.
                </p>
              </div>
            </div>
            <button
              onClick={downloadSampleTemplate}
              className="px-3.5 py-2 rounded-lg text-xs font-bold bg-white hover:bg-slate-100 text-blue-700 border border-blue-200 transition-colors shadow-2xs whitespace-nowrap shrink-0 flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Sample Template</span>
            </button>
          </div>

          {/* File Upload / Drag & Drop Area */}
          {!parseResult && (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 hover:border-green-500 bg-slate-50 hover:bg-green-50/20 rounded-xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
                className="hidden"
              />
              <div className="w-12 h-12 rounded-xl bg-green-100 text-green-700 flex items-center justify-center mb-3">
                <Upload className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">
                {isParsing ? 'Parsing Excel file...' : 'Choose or drag & drop Excel file'}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Supports .xlsx, .xls, and .csv formats
              </p>
            </div>
          )}

          {/* Parse Results Preview */}
          {parseResult && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-3 text-xs">
                  <span className="font-bold text-slate-900 truncate max-w-xs">{file?.name}</span>
                  <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-800 font-semibold border border-green-200">
                    {parseResult.validLeads.length} Valid Leads
                  </span>
                  {parseResult.invalidRows.length > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-semibold border border-rose-200">
                      {parseResult.invalidRows.length} Issues Found
                    </span>
                  )}
                </div>
                <button
                  onClick={reset}
                  className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 font-semibold"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Choose Another File</span>
                </button>
              </div>

              {/* Valid Leads Preview */}
              {parseResult.validLeads.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                    <span>Ready to Import ({parseResult.validLeads.length})</span>
                  </h4>
                  <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-left text-xs text-slate-700">
                      <thead className="bg-slate-100 sticky top-0 font-bold text-slate-600">
                        <tr>
                          <th className="p-2">Customer Name</th>
                          <th className="p-2">Mobile</th>
                          <th className="p-2">District</th>
                          <th className="p-2">Status</th>
                          <th className="p-2">KSEB Bill</th>
                          <th className="p-2">Roof</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {parseResult.validLeads.slice(0, 10).map((l, i) => (
                          <tr key={i} className="hover:bg-slate-50">
                            <td className="p-2 font-semibold text-slate-900">{l.customer_name}</td>
                            <td className="p-2 font-mono">{l.mobile_number}</td>
                            <td className="p-2">{l.district}</td>
                            <td className="p-2">{l.lead_status}</td>
                            <td className="p-2">{String(l.avg_kseb_bill || '').startsWith('₹') ? l.avg_kseb_bill : `₹${l.avg_kseb_bill}`}</td>
                            <td className="p-2">{l.roof_type}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {parseResult.validLeads.length > 10 && (
                    <p className="text-[11px] text-slate-400 mt-1">
                      ...and {parseResult.validLeads.length - 10} more rows ready for import.
                    </p>
                  )}
                </div>
              )}

              {/* Invalid Rows Warning */}
              {parseResult.invalidRows.length > 0 && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200">
                  <h4 className="text-xs font-bold text-rose-800 flex items-center gap-1.5 mb-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                    <span>Skipped Rows ({parseResult.invalidRows.length})</span>
                  </h4>
                  <div className="space-y-1 max-h-32 overflow-y-auto text-xs text-rose-700">
                    {parseResult.invalidRows.map((inv, idx) => (
                      <div key={idx} className="p-1.5 bg-white/70 rounded border border-rose-100">
                        <strong>Row {inv.rowNumber}:</strong> {inv.errors.join(', ')}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {importSuccessMessage && (
                <div className="p-3.5 rounded-xl bg-green-50 border border-green-200 text-green-800 text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span>{importSuccessMessage}</span>
                </div>
              )}
            </div>
          )}

          {/* Footer Action */}
          <div className="pt-4 border-t border-[#BBD5DA] flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-bold text-slate-600 hover:bg-[#F5F5F5] transition-colors"
            >
              Cancel
            </button>

            {parseResult && parseResult.validLeads.length > 0 && (
              <button
                onClick={handleExecuteImport}
                disabled={isImporting}
                className="px-5 py-2 rounded-lg text-xs font-bold bg-[#FF0000] hover:bg-[#D60000] text-white shadow-xs transition-all flex items-center gap-1.5 disabled:opacity-50 active:scale-95"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isImporting ? 'Importing...' : `Import ${parseResult.validLeads.length} Leads`}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
