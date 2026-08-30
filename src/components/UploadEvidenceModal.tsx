import React, { useState } from 'react';
import {
  Upload,
  FileText,
  FileSpreadsheet,
  CheckCircle2,
  Sparkles,
  X,
  RotateCw,
  Layers
} from 'lucide-react';
import { api } from '../api.ts';

interface UploadEvidenceModalProps {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const UploadEvidenceModal: React.FC<UploadEvidenceModalProps> = ({
  projectId,
  isOpen,
  onClose,
  onSuccess
}) => {
  const [filename, setFilename] = useState('');
  const [fileType, setFileType] = useState<'PDF' | 'XLSX' | 'TXT'>('PDF');
  const [rawContent, setRawContent] = useState('');
  const [autoProcess, setAutoProcess] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  if (!isOpen) return null;

  const sampleTemplates = [
    {
      name: 'DPR_Piping_AreaA_Day42.pdf',
      type: 'PDF' as const,
      content: `DAILY PROGRESS REPORT - AREA A PIPING
Date: 2026-04-16 | Shift: Day | Supervisor: Rajesh Kumar
- Spool Erection: Completed spool erection for Sub-area A-1. 18 spools positioned and bolted.
- Field Welding: Line 24 field welds initiated. 4 joints completed by welder W-102.
- Hydro Testing: Hydro test loop HT-04 prep 40% complete.
- Issues: Crane 02 maintenance required at 15:00.`
    },
    {
      name: 'Weld_Inspection_Line24.xlsx',
      type: 'XLSX' as const,
      content: `WELD LOG SHEET - LINE 24
Line No: L24-001 | Area: Area B | NDT Inspector: Vikram Patel
Joint 01: PASSED (UT/RT)
Joint 02: PASSED (Visual)
Joint 03: FITUP COMPLETE
Joint 04: ROOT RUN COMPLETED
Summary: 12 total joints in progress. Line 24 welding proceeding according to ISO specifications.`
    },
    {
      name: 'Civil_Foundation_Inspection.txt',
      type: 'TXT' as const,
      content: `CIVIL SHIFT REPORT - AREA A
Activity: Pump Foundation Excavation & Rebar Placement
Status: Rebar tying completed for Foundation F-101. Ready for concrete pour inspection tomorrow morning.`
    }
  ];

  const handleSelectTemplate = (template: typeof sampleTemplates[0]) => {
    setFilename(template.name);
    setFileType(template.type);
    setRawContent(template.content);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setFilename(file.name);
      const ext = file.name.split('.').pop()?.toUpperCase();
      if (ext === 'PDF' || ext === 'XLSX' || ext === 'TXT') {
        setFileType(ext as any);
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        setRawContent(event.target?.result as string || `Uploaded content from ${file.name}`);
      };
      reader.readAsText(file);
    }
  };

  const handleSubmit = async () => {
    if (!filename.trim()) {
      alert('Please enter or select a filename.');
      return;
    }
    setIsUploading(true);
    setUploadProgress(20);

    const interval = setInterval(() => {
      setUploadProgress(prev => (prev < 90 ? prev + 25 : prev));
    }, 200);

    try {
      await api.uploadDocument(projectId, {
        filename,
        type: fileType,
        fileSize: `${Math.floor(Math.random() * 800 + 200)} KB`,
        rawContent: rawContent || `Construction daily report content for ${filename}`,
        autoProcess
      });
      clearInterval(interval);
      setUploadProgress(100);
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
        onSuccess();
        onClose();
      }, 500);
    } catch (err: any) {
      clearInterval(interval);
      setIsUploading(false);
      alert(`Upload failed: ${err.message}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-xl w-full max-w-2xl p-6 space-y-5 shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Upload Construction Evidence</h2>
              <p className="text-[11px] text-slate-500">Daily reports, welding logs, inspection sheets</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Sample Presets */}
        <div className="space-y-1.5 text-xs">
          <span className="text-slate-500 text-[11px] font-semibold">Or load quick realistic sample data:</span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {sampleTemplates.map((tpl, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSelectTemplate(tpl)}
                className="p-2.5 rounded-lg bg-slate-50 hover:bg-indigo-50/60 border border-slate-200 text-left transition-colors"
              >
                <div className="font-semibold text-slate-800 font-mono text-[11px] truncate">{tpl.name}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">{tpl.type} Sample</div>
              </button>
            ))}
          </div>
        </div>

        {/* Drag and Drop Zone */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className="border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-xl p-5 text-center bg-slate-50/50 hover:bg-indigo-50/20 transition-all cursor-pointer"
        >
          <Upload className="w-6 h-6 text-indigo-600 mx-auto mb-2" />
          <div className="text-xs font-semibold text-slate-800">
            Drag & drop PDF, Excel (XLSX), or TXT report here
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">Or use the inputs below to simulate report ingestion</p>
        </div>

        {/* Form Inputs */}
        <div className="space-y-3 text-xs">
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-slate-600 mb-1 font-medium">Document Filename *</label>
              <input
                type="text"
                value={filename}
                onChange={(e) => setFilename(e.target.value)}
                placeholder="e.g. DPR_Piping_AreaA_2026-04-16.pdf"
                className="w-full p-2.5 rounded-lg bg-white border border-slate-200 text-slate-800 placeholder-slate-400 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-sm"
              />
            </div>
            <div>
              <label className="block text-slate-600 mb-1 font-medium">Format</label>
              <select
                value={fileType}
                onChange={(e) => setFileType(e.target.value as any)}
                className="w-full p-2.5 rounded-lg bg-white border border-slate-200 text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-sm"
              >
                <option value="PDF">PDF</option>
                <option value="XLSX">XLSX (Excel)</option>
                <option value="TXT">TXT / Text</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-600 mb-1 font-medium">Raw Construction Text / OCR Excerpt</label>
            <textarea
              value={rawContent}
              onChange={(e) => setRawContent(e.target.value)}
              placeholder="Paste raw construction daily log or weld inspection text here..."
              className="w-full p-2.5 rounded-lg bg-white border border-slate-200 text-slate-800 placeholder-slate-400 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-sm"
              rows={4}
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="autoProcess"
              checked={autoProcess}
              onChange={(e) => setAutoProcess(e.target.checked)}
              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="autoProcess" className="text-slate-700 text-xs select-none cursor-pointer flex items-center gap-1.5 font-medium">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Automatically extract events and match to WBS activities immediately</span>
            </label>
          </div>
        </div>

        {/* Progress Bar */}
        {isUploading && (
          <div className="space-y-1 pt-2">
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span className="flex items-center gap-1.5">
                <RotateCw className="w-3 h-3 animate-spin text-indigo-600" />
                <span>Extracting events with SitePulse AI...</span>
              </span>
              <span className="font-mono">{uploadProgress}%</span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200/60">
              <div className="bg-indigo-600 h-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-medium"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isUploading || !filename.trim()}
            className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold shadow-sm flex items-center gap-2"
          >
            {isUploading ? <RotateCw className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
            <span>Upload & Ingest</span>
          </button>
        </div>

      </div>
    </div>
  );
};
