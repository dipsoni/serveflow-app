import React, { useState } from 'react';
import { X, Upload, Download, FileText, CheckCircle2, AlertCircle, ArrowRight, RefreshCw } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import api from '../services/api';

export default function DataImportModal({ onClose, onImportSuccess }) {
  const [importType, setImportType] = useState('menu'); // 'menu' or 'inventory'
  const [csvText, setCsvText] = useState('');
  const [parsedRows, setParsedRows] = useState([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);
  const { showToast } = useToast();

  const handleDownloadTemplate = () => {
    window.open(`/api/import/template/${importType}`, '_blank');
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === 'string') {
        setCsvText(content);
        parseCSVPreview(content);
      }
    };
    reader.readAsText(file);
  };

  const parseCSVPreview = (text) => {
    const lines = text.trim().split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length < 2) {
      setParsedRows([]);
      return;
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/^["']|["']$/g, ''));
    const rows = [];

    for (let i = 1; i < Math.min(lines.length, 25); i++) {
      const values = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(v => v.trim().replace(/^["']|["']$/g, ''));
      const obj = {};
      headers.forEach((h, idx) => {
        obj[h] = values[idx] || '';
      });
      rows.push(obj);
    }
    setParsedRows(rows);
    setResult(null);
  };

  const handleTextChange = (e) => {
    const val = e.target.value;
    setCsvText(val);
    parseCSVPreview(val);
  };

  const handleStartImport = async () => {
    if (!csvText.trim()) {
      showToast('Please provide or upload CSV data first.', 'error');
      return;
    }

    setImporting(true);
    try {
      const endpoint = importType === 'menu' ? '/import/menu' : '/import/inventory';
      const res = await api.post(endpoint, { csvData: csvText });

      setResult(res.data);
      showToast(res.data.message || 'Import completed successfully!', 'success');
      if (onImportSuccess) onImportSuccess(res.data);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Import failed';
      showToast(msg, 'error');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-lg border border-slate-200 shadow-2xl w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in-95">
        
        {/* Modal Header (Frappe desk style) */}
        <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Upload className="w-4 h-4 text-slate-700" />
            <span className="font-bold text-sm text-slate-900">Bulk CSV Data Import Tool</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-200/60"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs">
          
          {/* Step 1: Select Type & Template Download */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-50 border border-slate-200 rounded-md">
            <div className="flex items-center gap-3">
              <span className="font-semibold text-slate-800">Import Entity:</span>
              <div className="flex bg-white p-0.5 rounded border border-slate-200 shadow-2xs">
                <button
                  type="button"
                  onClick={() => { setImportType('menu'); setParsedRows([]); setCsvText(''); setResult(null); }}
                  className={`px-3 py-1 rounded text-xs transition-colors ${importType === 'menu' ? 'bg-slate-900 text-white font-medium' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  Menu & Dishes
                </button>
                <button
                  type="button"
                  onClick={() => { setImportType('inventory'); setParsedRows([]); setCsvText(''); setResult(null); }}
                  className={`px-3 py-1 rounded text-xs transition-colors ${importType === 'inventory' ? 'bg-slate-900 text-white font-medium' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  Inventory & Stock
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="btn-tactile hover-lift inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 rounded text-slate-700 font-medium shadow-2xs"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Download Sample {importType === 'menu' ? 'Menu' : 'Inventory'} CSV</span>
            </button>
          </div>

          {/* Step 2: Upload or Paste */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-slate-800">CSV Payload (Upload file or paste rows)</label>
              <label className="cursor-pointer text-blue-600 hover:text-blue-800 hover:underline font-medium flex items-center gap-1">
                <FileText className="w-3.5 h-3.5" />
                <span>Browse File (.csv)</span>
                <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>

            <textarea
              rows={4}
              value={csvText}
              onChange={handleTextChange}
              placeholder={importType === 'menu'
                ? "name,category,price,cost_price,is_veg,description\nPaneer Tikka,Starters,240,90,true,Marinated cottage cheese grilled in tandoor\nButter Chicken,Main Course,360,150,false,Classic chicken in butter gravy"
                : "name,sku,category,unit,min_stock,current_stock,cost_per_unit\nBasmati Rice,ING-RICE-01,Raw Grains,kg,25,120,85\nAmul Butter,ING-BTR-01,Dairy,kg,10,35,420"
              }
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded font-mono text-[11px] focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400"
            />
          </div>

          {/* Step 3: Live Preview Table */}
          {parsedRows.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span className="font-medium text-slate-700">Preview ({parsedRows.length} sample rows parsed):</span>
                <span>Ready for insertion</span>
              </div>

              <div className="border border-slate-200 rounded overflow-x-auto max-h-48">
                <table className="w-full text-left border-collapse text-[11px]">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold">
                      {Object.keys(parsedRows[0]).map((h, i) => (
                        <th key={i} className="p-2 border-r border-slate-200 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {parsedRows.map((row, rIdx) => (
                      <tr key={rIdx} className="border-b border-slate-100 hover:bg-slate-50/70">
                        {Object.values(row).map((val, cIdx) => (
                          <td key={cIdx} className="p-2 border-r border-slate-100 text-slate-800 font-mono text-[10px]">
                            {String(val)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Import Result Notification */}
          {result && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded flex items-center gap-2 text-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{result.message}</span>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
          <span className="text-[11px] text-slate-400">
            {parsedRows.length > 0 ? `${parsedRows.length} rows ready` : 'No file selected'}
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 rounded text-xs font-medium text-slate-700"
            >
              Close
            </button>
            <button
              type="button"
              disabled={importing || parsedRows.length === 0}
              onClick={handleStartImport}
              className="btn-tactile inline-flex items-center gap-1.5 px-4 py-1.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded text-xs font-medium shadow-2xs hover:shadow-xs transition-all cursor-pointer"
            >
              {importing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
              <span>{importing ? 'Importing...' : 'Start Bulk Import'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
