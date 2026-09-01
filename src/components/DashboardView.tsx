import React, { useState } from 'react';
import {
  Activity,
  TrendingUp,
  Clock,
  Sparkles,
  ArrowRight,
  Upload,
  FileText,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  ShieldCheck,
  Zap,
  Play,
  RotateCw
} from 'lucide-react';
import { Project, DashboardMetrics, MatchResult, DocumentRecord } from '../types.ts';
import { api } from '../api.ts';
import { AtRiskTrajectoryRadar } from './AtRiskTrajectoryRadar.tsx';
import { SimpleExplainerBanner } from './SimpleExplainerBanner.tsx';

interface DashboardViewProps {
  project: Project;
  metrics: DashboardMetrics | null;
  pendingMatches: MatchResult[];
  recentDocuments: DocumentRecord[];
  onNavigate: (view: string, itemId?: string) => void;
  onSelectMatch: (match: MatchResult) => void;
  onSelectDocument: (doc: DocumentRecord) => void;
  onRefreshData: () => void;
  onOpenUploadModal: () => void;
  onOpenGlossary?: () => void;
  onOpenDemoStory?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  project,
  metrics,
  pendingMatches = [],
  recentDocuments = [],
  onNavigate,
  onSelectMatch,
  onSelectDocument,
  onRefreshData,
  onOpenUploadModal,
  onOpenGlossary,
  onOpenDemoStory
}) => {
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [approveSuccessMsg, setApproveSuccessMsg] = useState<string | null>(null);
  
  const pendingList = pendingMatches || [];
  const docList = recentDocuments || [];

  const handleQuickApprove = async (e: React.MouseEvent, match: MatchResult) => {
    e.stopPropagation();
    setApprovingId(match.id);
    try {
      await api.approveMatch(project.id, match.id, 'Anita Sharma', 'Quick approved via executive dashboard.');
      setApproveSuccessMsg(`Activity "${match.reportedActivityName}" verified and synced with PMIS.`);
      setTimeout(() => setApproveSuccessMsg(null), 4000);
      onRefreshData();
    } catch (err: any) {
      alert(`Approval error: ${err.message}`);
    } finally {
      setApprovingId(null);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* 3-Step Simple Explainer Banner */}
      <SimpleExplainerBanner
        onNavigate={onNavigate}
        onOpenUpload={onOpenUploadModal}
      />

      {/* Top Banner / Notification */}
      {approveSuccessMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-between shadow-xs animate-fadeIn">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <div>
              <div className="font-semibold text-sm">Activity Verified Successfully</div>
              <div className="text-xs text-emerald-700">{approveSuccessMsg}</div>
            </div>
          </div>
          <button 
            onClick={() => onNavigate('audit')}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs flex items-center gap-1 transition-colors"
          >
            <span>View Audit Log</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Project Header Overview */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">{project.name}</h1>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 font-semibold">
              {project.code}
            </span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              {project.status}
            </span>
          </div>
          <p className="text-xs text-slate-500 max-w-2xl">
            Location: <strong className="text-slate-700">{project.location}</strong> • Client: <strong className="text-slate-700">{project.client}</strong> • Contractor: <strong className="text-slate-700">{project.contractor}</strong>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onOpenUploadModal}
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-2 shadow-xs transition-all active:scale-95"
          >
            <Upload className="w-4 h-4" />
            <span>Upload Evidence</span>
          </button>
          <button
            onClick={() => onNavigate('time-agent')}
            className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-semibold flex items-center gap-2 transition-all active:scale-95"
          >
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span>Time Agent Chat</span>
          </button>
        </div>
      </div>

      {/* 4 Clickable Metric KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Activities */}
        <div
          onClick={() => onNavigate('activities')}
          className="p-4 rounded-xl bg-white hover:bg-slate-50/80 border border-slate-200 hover:border-slate-300 transition-all cursor-pointer group shadow-sm"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Activities</span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 group-hover:text-slate-900 transition-colors">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono">
            {metrics ? metrics.totalActivities : 52}
          </div>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
            <span>L1 - L6 WBS Hierarchy</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>

        {/* Schedule Progress */}
        <div
          onClick={() => onNavigate('analytics')}
          className="p-4 rounded-xl bg-white hover:bg-slate-50/80 border border-slate-200 hover:border-slate-300 transition-all cursor-pointer group shadow-sm"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Schedule Progress</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-600 font-mono">
            {metrics ? `${metrics.scheduleProgress}%` : '34.2%'}
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${metrics ? metrics.scheduleProgress : 34.2}%` }}
            />
          </div>
        </div>

        {/* Pending Verification */}
        <div
          onClick={() => onNavigate('review')}
          className="p-4 rounded-xl bg-white hover:bg-slate-50/80 border border-slate-200 hover:border-slate-300 transition-all cursor-pointer group shadow-sm"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Pending Verification</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-600 font-mono">
            {metrics ? metrics.pendingVerificationCount : 5}
          </div>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[11px] text-amber-700 font-medium">
            <span>Requires Planner Review</span>
            <ChevronRight className="w-3.5 h-3.5 text-amber-500 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>

        {/* AI Confidence */}
        <div
          onClick={() => onNavigate('analytics')}
          className="p-4 rounded-xl bg-white hover:bg-slate-50/80 border border-slate-200 hover:border-slate-300 transition-all cursor-pointer group shadow-sm"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">AI Confidence</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-indigo-600 font-mono">
            {metrics ? `${metrics.averageAiConfidence}%` : '91.4%'}
          </div>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
            <span>Multi-factor semantic match</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>

      </div>

      {/* AI Schedule Trajectory & At-Risk Activities Radar */}
      <AtRiskTrajectoryRadar
        project={project}
        onNavigate={onNavigate}
      />

      {/* Main Content: Review Queue Preview + Recent Ingestion */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* Left 2 Cols: Pending Review Queue Preview */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span>Review Queue</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                  {pendingMatches.length} Pending
                </span>
              </h2>
              <p className="text-[11px] text-slate-500">Field evidence extracted by AI waiting for human verification</p>
            </div>
            <button
              onClick={() => onNavigate('review')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 group py-1 px-2.5 rounded-lg hover:bg-indigo-50 transition-colors"
            >
              <span>View All Queue</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

          {pendingList.length === 0 ? (
            <div className="p-8 rounded-xl bg-white border border-slate-200 text-center shadow-sm">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <div className="text-sm font-semibold text-slate-800">No activities require verification</div>
              <p className="text-xs text-slate-500 mt-1">All extracted site events have been verified and synced.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingList.slice(0, 5).map(match => (
                <div
                  key={match.id}
                  onClick={() => onSelectMatch(match)}
                  className="p-4 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 transition-all cursor-pointer group shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-xs text-slate-800 group-hover:text-indigo-600 transition-colors">
                        {match.reportedActivityName}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold">
                        {match.topCandidateWbs || 'L6'}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                      <span>Matched to:</span>
                      <span className="text-indigo-600 font-mono font-medium">
                        {match.topCandidateActivityName || 'Unmatched'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 sm:self-center">
                    <div className="text-right">
                      <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Confidence</div>
                      <div className="text-xs font-bold font-mono text-emerald-600">
                        {Math.round(match.finalScore * 100)}%
                      </div>
                    </div>

                    <button
                      onClick={(e) => handleQuickApprove(e, match)}
                      disabled={approvingId === match.id}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold shadow-xs transition-all flex items-center gap-1.5"
                    >
                      {approvingId === match.id ? (
                        <RotateCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      )}
                      <span>Approve</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right 1 Col: Recent Ingestion & Upload Widget */}
        <div className="space-y-4">
          
          {/* Upload Evidence Card */}
          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Upload className="w-4 h-4 text-indigo-600" />
                <span>Upload Evidence</span>
              </h3>
              <span className="text-[10px] text-slate-500 font-mono">PDF • XLSX • TXT</span>
            </div>
            <p className="text-xs text-slate-500">
              Drag and drop daily progress reports, weld logs, or supervisor texts for instant extraction.
            </p>
            <button
              onClick={onOpenUploadModal}
              className="w-full py-3 px-4 rounded-xl border-2 border-dashed border-slate-200 hover:border-indigo-500 bg-slate-50 hover:bg-indigo-50/20 text-slate-600 hover:text-indigo-600 text-xs font-medium flex flex-col items-center justify-center gap-1.5 transition-all group cursor-pointer"
            >
              <Upload className="w-5 h-5 text-indigo-600 group-hover:scale-110 transition-transform" />
              <span>Select or Drop Document</span>
            </button>
          </div>

          {/* Recent Ingestion Table */}
          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Recent Ingestion</h3>
                <p className="text-[10px] text-slate-500">Parsed reports & logs</p>
              </div>
              <button
                onClick={() => onNavigate('ingestion')}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-0.5"
              >
                <span>View All</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-4">
              {docList.slice(0, 4).map(doc => (
                <div
                  key={doc.id}
                  onClick={() => onSelectDocument(doc)}
                  className="p-4 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 cursor-pointer flex items-center justify-between gap-4 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 flex-shrink-0 shadow-xs">
                      {doc.type === 'PDF' ? (
                        <FileText className="w-4 h-4 text-rose-500" />
                      ) : doc.type === 'XLSX' ? (
                        <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <FileText className="w-4 h-4 text-indigo-500" />
                      )}
                    </div>
                    <div className="truncate">
                      <div className="text-xs font-medium text-slate-800 truncate">{doc.filename}</div>
                      <div className="text-[10px] text-slate-500">{doc.fileSize} • {doc.extractedEventsCount} events</div>
                    </div>
                  </div>

                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 flex-shrink-0 font-semibold">
                    {doc.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* PMIS Status Widget */}
          <div className="p-4 rounded-xl bg-slate-900 text-white text-xs space-y-2 shadow-sm">
            <div className="flex items-center justify-between text-slate-200 font-semibold">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>PMIS Integration</span>
              </span>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-800/40 font-bold">
                ACTIVE
              </span>
            </div>
            <p className="text-[11px] text-slate-300">
              Verified actual progress updates are automatically marshalled into Primavera P6 format.
            </p>
          </div>

        </div>

      </div>

    </div>
  );
};
