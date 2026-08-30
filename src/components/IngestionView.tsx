import React, { useState } from 'react';
import {
  FileSpreadsheet,
  FileText,
  Upload,
  Play,
  Trash2,
  Eye,
  CheckCircle2,
  Clock,
  AlertCircle,
  Sparkles,
  Layers,
  X,
  RotateCw
} from 'lucide-react';
import { DocumentRecord, ExecutionEvent, Project } from '../types.ts';
import { api } from '../api.ts';

interface IngestionViewProps {
  project: Project;
  documents: DocumentRecord[];
  selectedDocId?: string | null;
  onRefreshData: () => void;
  onOpenUploadModal: () => void;
  onNavigate: (view: string, itemId?: string) => void;
}

export const IngestionView: React.FC<IngestionViewProps> = ({
  project,
  documents = [],
  selectedDocId,
  onRefreshData,
  onOpenUploadModal,
  onNavigate
}) => {
  const safeDocuments = documents || [];

  const [inspectingDoc, setInspectingDoc] = useState<DocumentRecord | null>(() => {
    if (selectedDocId) {
      return safeDocuments.find(d => d.id === selectedDocId) || null;
    }
    return null;
  });
  const [docEvents, setDocEvents] = useState<ExecutionEvent[]>([]);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const handleOpenDocDetail = async (doc: DocumentRecord) => {
    setInspectingDoc(doc);
    try {
      const res = await api.getDocumentDetail(project.id, doc.id);
      setDocEvents(res?.extractedEvents || []);
    } catch (e) {
      console.error(e);
      setDocEvents([]);
    }
  };

  const handleProcessDoc = async (e: React.MouseEvent, docId: string) => {
    e.stopPropagation();
    setIsProcessing(docId);
    try {
      await api.processDocument(project.id, docId);
      onRefreshData();
      if (inspectingDoc && inspectingDoc.id === docId) {
        const res = await api.getDocumentDetail(project.id, docId);
        setInspectingDoc(res.document);
        setDocEvents(res.extractedEvents);
      }
    } catch (err: any) {
      alert(`Processing error: ${err.message}`);
    } finally {
      setIsProcessing(null);
    }
  };

  const handleDeleteDoc = async (e: React.MouseEvent, docId: string) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this document and its associated execution events?')) return;
    setIsDeleting(docId);
    try {
      await api.deleteDocument(project.id, docId);
      if (inspectingDoc && inspectingDoc.id === docId) {
        setInspectingDoc(null);
      }
      onRefreshData();
    } catch (err: any) {
      alert(`Delete error: ${err.message}`);
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
            <span>Document Ingestion & Parsing Engine</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Ingest daily site progress reports, welding logs, NDT inspection sheets, and supervisor shift diaries.
          </p>
        </div>

        <button
          onClick={onOpenUploadModal}
          className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-2 shadow-sm transition-all active:scale-95"
        >
          <Upload className="w-4 h-4" />
          <span>Upload New Evidence</span>
        </button>
      </div>

      {/* Document Ingestion Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Document / File</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Uploaded By</th>
                <th className="py-3 px-4">Extracted Events</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {safeDocuments.map(doc => {
                return (
                  <tr
                    key={doc.id}
                    onClick={() => handleOpenDocDetail(doc)}
                    className="hover:bg-slate-50 cursor-pointer transition-colors group"
                  >
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-slate-100 text-slate-600 border border-slate-200/60 group-hover:bg-slate-200/70">
                          {doc.type === 'PDF' ? <FileText className="w-4 h-4 text-rose-600" /> :
                           doc.type === 'XLSX' ? <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> :
                           <FileText className="w-4 h-4 text-indigo-600" />}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-800 font-mono group-hover:text-indigo-600">
                            {doc.filename}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            {doc.fileSize} • Uploaded {doc.uploadedAt}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono font-medium text-slate-700">
                      {doc.type}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        doc.status === 'PROCESSED'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : doc.status === 'PROCESSING'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}>
                        {doc.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-slate-700">
                      {doc.uploadedBy}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 font-mono font-semibold text-slate-800">
                        <Layers className="w-3.5 h-3.5 text-indigo-600" />
                        <span>{doc.extractedEventsCount} Events</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleOpenDocDetail(doc)}
                          className="p-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200 shadow-xs"
                          title="View raw document & extracted events"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={(e) => handleProcessDoc(e, doc.id)}
                          disabled={isProcessing === doc.id}
                          className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-semibold flex items-center gap-1 shadow-xs transition-colors"
                          title="Re-run AI extraction"
                        >
                          {isProcessing === doc.id ? (
                            <RotateCw className="w-3 h-3 animate-spin" />
                          ) : (
                            <Sparkles className="w-3 h-3" />
                          )}
                          <span>Process</span>
                        </button>

                        <button
                          onClick={(e) => handleDeleteDoc(e, doc.id)}
                          disabled={isDeleting === doc.id}
                          className="p-1.5 rounded-lg bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200 shadow-xs transition-colors"
                          title="Delete document"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= DOCUMENT INSPECTOR DRAWER / MODAL ================= */}
      {inspectingDoc && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-6">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
                    DOCUMENT VIEWER
                  </span>
                  <span className="text-xs font-mono text-slate-500">{inspectingDoc.id}</span>
                </div>
                <h2 className="text-lg font-bold text-slate-900 mt-1 font-mono">{inspectingDoc.filename}</h2>
              </div>
              <button
                onClick={() => setInspectingDoc(null)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Document Metadata */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80">
                <div className="text-[10px] text-slate-500 uppercase font-semibold">Format</div>
                <div className="font-semibold text-slate-800 mt-0.5">{inspectingDoc.type}</div>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80">
                <div className="text-[10px] text-slate-500 uppercase font-semibold">File Size</div>
                <div className="font-semibold text-slate-800 mt-0.5">{inspectingDoc.fileSize}</div>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80">
                <div className="text-[10px] text-slate-500 uppercase font-semibold">Uploaded By</div>
                <div className="font-semibold text-slate-800 mt-0.5">{inspectingDoc.uploadedBy}</div>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80">
                <div className="text-[10px] text-slate-500 uppercase font-semibold">Status</div>
                <div className="font-semibold text-emerald-700 mt-0.5">{inspectingDoc.status}</div>
              </div>
            </div>

            {/* Raw Document Excerpt */}
            <div className="space-y-2">
              <div className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Raw Content Snippet / OCR Stream
              </div>
              <div className="p-4 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-slate-200 leading-relaxed max-h-48 overflow-y-auto whitespace-pre-wrap">
                {inspectingDoc.rawContent || 'No raw content preview stored.'}
              </div>
            </div>

            {/* Extracted Execution Events */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  <span>AI Extracted Events ({docEvents.length})</span>
                </h3>
              </div>

              {docEvents.length === 0 ? (
                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-center text-xs text-slate-500">
                  No execution events extracted yet. Click "Process Document" to run AI extraction.
                </div>
              ) : (
                <div className="space-y-2">
                  {docEvents.map(evt => (
                    <div
                      key={evt.id}
                      onClick={() => {
                        setInspectingDoc(null);
                        onNavigate('review', evt.matchResultId);
                      }}
                      className="p-3.5 rounded-lg bg-slate-50 hover:bg-indigo-50/50 border border-slate-200 cursor-pointer flex items-center justify-between text-xs transition-colors"
                    >
                      <div>
                        <div className="font-semibold text-slate-800">{evt.activityName}</div>
                        <p className="text-[11px] text-slate-500 font-mono mt-0.5">"{evt.evidenceSnippet}"</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded font-semibold text-[11px]">
                          {Math.round(evt.confidence * 100)}% Conf
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-200/70 text-slate-700 font-medium">
                          {evt.discipline}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
