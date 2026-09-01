import React, { useState, useMemo } from 'react';
import {
  GitPullRequest,
  CheckCircle2,
  XCircle,
  RefreshCw,
  PlusCircle,
  Search,
  Filter,
  ArrowUpDown,
  Sparkles,
  Layers,
  FileText,
  Clock,
  ShieldCheck,
  AlertTriangle,
  ChevronRight,
  Info,
  X
} from 'lucide-react';
import { MatchResult, ExecutionEvent, ScheduleActivity, Project, Discipline, VerificationStatus } from '../types.ts';
import { api } from '../api.ts';

interface ReviewQueueViewProps {
  project: Project;
  matches: MatchResult[];
  events: ExecutionEvent[];
  activities: ScheduleActivity[];
  selectedMatchId?: string | null;
  onRefreshData: () => void;
  onNavigate: (view: string, itemId?: string) => void;
}

export const ReviewQueueView: React.FC<ReviewQueueViewProps> = ({
  project,
  matches = [],
  events = [],
  activities = [],
  selectedMatchId,
  onRefreshData,
  onNavigate
}) => {
  const safeMatches = matches || [];
  const safeEvents = events || [];
  const safeActivities = activities || [];

  const [activeTab, setActiveTab] = useState<string>('PENDING_REVIEW');
  const [searchQuery, setSearchQuery] = useState('');
  const [disciplineFilter, setDisciplineFilter] = useState<string>('ALL');
  const [confidenceFilter, setConfidenceFilter] = useState<string>('ALL');
  
  // Selected match for deep inspection modal
  const [inspectingMatch, setInspectingMatch] = useState<MatchResult | null>(() => {
    if (selectedMatchId) {
      return safeMatches.find(m => m.id === selectedMatchId) || null;
    }
    return null;
  });

  // Action Modals State
  const [actionModalType, setActionModalType] = useState<'APPROVE' | 'CHANGE' | 'REJECT' | 'MARK_NEW' | null>(null);
  const [actionReason, setActionReason] = useState('');
  const [selectedReplacementActivityId, setSelectedReplacementActivityId] = useState('');
  const [newActivityForm, setNewActivityForm] = useState({
    description: '',
    discipline: 'PIPING' as Discipline,
    area: 'Area A',
    reason: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackBanner, setFeedbackBanner] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

  // Filtered Matches
  const filteredMatches = useMemo(() => {
    return safeMatches.filter(m => {
      // Tab filter
      if (activeTab === 'PENDING_REVIEW' && m.verificationStatus !== 'PENDING_REVIEW') return false;
      if (activeTab === 'AUTO_MATCH' && (m.decision !== 'AUTO_MATCH' || m.verificationStatus !== 'PENDING_REVIEW')) return false;
      if (activeTab === 'UNMATCHED' && m.verificationStatus !== 'UNMATCHED') return false;
      if (activeTab === 'CHANGED' && m.verificationStatus !== 'CHANGED') return false;
      if (activeTab === 'REJECTED' && m.verificationStatus !== 'REJECTED') return false;
      if (activeTab === 'APPROVED' && m.verificationStatus !== 'APPROVED') return false;

      // Discipline filter
      if (disciplineFilter !== 'ALL' && m.topCandidateDiscipline !== disciplineFilter) return false;

      // Confidence filter
      if (confidenceFilter === 'HIGH' && m.finalScore < 0.90) return false;
      if (confidenceFilter === 'MEDIUM' && (m.finalScore < 0.80 || m.finalScore >= 0.90)) return false;
      if (confidenceFilter === 'LOW' && m.finalScore >= 0.80) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const repName = m.reportedActivityName.toLowerCase();
        const candName = (m.topCandidateActivityName || '').toLowerCase();
        const exp = (m.explanation || '').toLowerCase();
        if (!repName.includes(q) && !candName.includes(q) && !exp.includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [matches, activeTab, disciplineFilter, confidenceFilter, searchQuery]);

  // Find linked execution event for inspector
  const activeEvent = useMemo(() => {
    if (!inspectingMatch) return null;
    return events.find(e => e.id === inspectingMatch.executionEventId) || null;
  }, [inspectingMatch, events]);

  // L5/L6 activities for change modal
  const eligibleActivities = useMemo(() => {
    return activities.filter(a => a.wbs_level === 'L5' || a.wbs_level === 'L6');
  }, [activities]);

  // Handlers
  const handleApprove = async () => {
    if (!inspectingMatch) return;
    setIsSubmitting(true);
    try {
      await api.approveMatch(project.id, inspectingMatch.id, 'Anita Sharma', actionReason || 'Verified and approved by Lead Planner.');
      setFeedbackBanner({
        message: `Activity "${inspectingMatch.reportedActivityName}" successfully approved! Actual progress recorded and synced with PMIS.`,
        type: 'success'
      });
      setActionModalType(null);
      setInspectingMatch(null);
      onRefreshData();
    } catch (err: any) {
      alert(`Approval error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = async () => {
    if (!inspectingMatch || !selectedReplacementActivityId || !actionReason.trim()) {
      alert('Please select an activity and provide a reason.');
      return;
    }
    setIsSubmitting(true);
    try {
      await api.changeMatch(project.id, inspectingMatch.id, selectedReplacementActivityId, actionReason);
      setFeedbackBanner({
        message: `Match re-assigned successfully to selected WBS activity.`,
        type: 'info'
      });
      setActionModalType(null);
      setInspectingMatch(null);
      onRefreshData();
    } catch (err: any) {
      alert(`Change error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!inspectingMatch || !actionReason.trim()) {
      alert('Please provide a reason for rejection.');
      return;
    }
    setIsSubmitting(true);
    try {
      await api.rejectMatch(project.id, inspectingMatch.id, actionReason);
      setFeedbackBanner({
        message: `Match marked as REJECTED in audit log.`,
        type: 'info'
      });
      setActionModalType(null);
      setInspectingMatch(null);
      onRefreshData();
    } catch (err: any) {
      alert(`Rejection error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMarkNew = async () => {
    if (!inspectingMatch || !newActivityForm.description || !newActivityForm.reason) {
      alert('Please complete the new activity description and reason.');
      return;
    }
    setIsSubmitting(true);
    try {
      await api.markNewActivity(project.id, inspectingMatch.id, newActivityForm);
      setFeedbackBanner({
        message: `Proposed new activity registered. Baseline schedule preserved pending formal MOC approval.`,
        type: 'info'
      });
      setActionModalType(null);
      setInspectingMatch(null);
      onRefreshData();
    } catch (err: any) {
      alert(`Proposal error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <GitPullRequest className="w-5 h-5 text-indigo-600" />
            <span>AI Review & Verification Queue</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Reconcile unstructured daily site evidence against baseline L5/L6 schedule activities.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">Total in Queue:</span>
          <span className="text-xs font-mono font-bold text-slate-800 px-2.5 py-0.5 rounded bg-slate-100 border border-slate-200">
            {matches.length} Records
          </span>
        </div>
      </div>

      {/* Easy Understanding Callout Banner */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50/60 border border-indigo-200/80 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-indigo-200/70 text-indigo-900 font-bold flex items-center justify-center flex-shrink-0 text-sm">
            💡
          </div>
          <div>
            <div className="font-bold text-slate-900 text-xs">
              How the Approval Queue Works
            </div>
            <p className="text-[11px] text-slate-600 mt-0.5">
              SitePulse AI reads inspection reports, photos, and weld sheets, then suggests the matching task in the project plan. Click <strong>"Approve"</strong> to confirm the match, or <strong>"Change"</strong> if you want to assign it to a different activity.
            </p>
          </div>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedbackBanner && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span className="text-xs font-medium">{feedbackBanner.message}</span>
          </div>
          <button onClick={() => setFeedbackBanner(null)} className="text-slate-400 hover:text-slate-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-200">
        {[
          { id: 'PENDING_REVIEW', label: 'Pending Review', count: matches.filter(m => m.verificationStatus === 'PENDING_REVIEW').length },
          { id: 'AUTO_MATCH', label: 'Auto Matched', count: matches.filter(m => m.decision === 'AUTO_MATCH' && m.verificationStatus === 'PENDING_REVIEW').length },
          { id: 'APPROVED', label: 'Approved', count: matches.filter(m => m.verificationStatus === 'APPROVED').length },
          { id: 'CHANGED', label: 'Changed', count: matches.filter(m => m.verificationStatus === 'CHANGED').length },
          { id: 'REJECTED', label: 'Rejected', count: matches.filter(m => m.verificationStatus === 'REJECTED').length },
          { id: 'UNMATCHED', label: 'Unmatched', count: matches.filter(m => m.verificationStatus === 'UNMATCHED').length },
          { id: 'ALL', label: 'All Records', count: matches.length }
        ].map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                isActive ? 'bg-indigo-200/70 text-indigo-800' : 'bg-slate-100 text-slate-500'
              }`}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Filters & Search Toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search report text, activity ID, or description..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg bg-white border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-xs"
          />
        </div>

        <div>
          <select
            value={disciplineFilter}
            onChange={(e) => setDisciplineFilter(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-lg bg-white border border-slate-200 text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-xs"
          >
            <option value="ALL">All Disciplines</option>
            <option value="CIVIL">Civil</option>
            <option value="PIPING">Piping</option>
            <option value="STATIC_EQUIPMENT">Static Equipment</option>
            <option value="ROTATING_EQUIPMENT">Rotating Equipment</option>
            <option value="ELECTRICAL">Electrical</option>
            <option value="INSTRUMENTATION">Instrumentation</option>
            <option value="HSE">HSE</option>
          </select>
        </div>

        <div>
          <select
            value={confidenceFilter}
            onChange={(e) => setConfidenceFilter(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-lg bg-white border border-slate-200 text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-xs"
          >
            <option value="ALL">All AI Confidence Levels</option>
            <option value="HIGH">High Confidence (&gt;90%)</option>
            <option value="MEDIUM">Medium Confidence (80-90%)</option>
            <option value="LOW">Low / Unmatched (&lt;80%)</option>
          </select>
        </div>
      </div>

      {/* Main Review Queue Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        {filteredMatches.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Info className="w-8 h-8 mx-auto mb-2 text-slate-400" />
            <div className="text-sm font-semibold text-slate-800">No records found for current filters</div>
            <p className="text-xs text-slate-500 mt-1">Try switching tabs or resetting filter queries.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-4 px-4">Reported Field Activity</th>
                  <th className="py-4 px-4">AI Candidate Match</th>
                  <th className="py-4 px-4">Discipline / Area</th>
                  <th className="py-4 px-4">Confidence</th>
                  <th className="py-4 px-4">Status</th>
                  <th className="py-4 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMatches.map(match => {
                  const isPending = match.verificationStatus === 'PENDING_REVIEW';
                  return (
                    <tr
                      key={match.id}
                      onClick={() => setInspectingMatch(match)}
                      className="hover:bg-slate-50/80 cursor-pointer transition-colors group"
                    >
                      <td className="py-4 px-4">
                        <div className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                          {match.reportedActivityName}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate max-w-xs mt-0.5">
                          {match.explanation}
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        {match.topCandidateActivityName ? (
                          <div>
                            <span className="font-mono text-indigo-600 font-medium">
                              {match.topCandidateActivityName}
                            </span>
                            <span className="text-[10px] text-slate-600 font-semibold ml-2 px-1.5 py-0.2 rounded bg-slate-100">
                              {match.topCandidateWbs}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">No direct match</span>
                        )}
                      </td>

                      <td className="py-4 px-4 text-slate-700">
                        <div className="font-medium">{match.topCandidateDiscipline || 'GENERAL'}</div>
                        <div className="text-[11px] text-slate-500">{match.topCandidateArea || 'Site Wide'}</div>
                      </td>

                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-12 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                match.finalScore >= 0.90
                                  ? 'bg-emerald-500'
                                  : match.finalScore >= 0.75
                                  ? 'bg-amber-500'
                                  : 'bg-rose-500'
                              }`}
                              style={{ width: `${Math.round(match.finalScore * 100)}%` }}
                            />
                          </div>
                          <span className="font-mono font-bold text-slate-800">
                            {Math.round(match.finalScore * 100)}%
                          </span>
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          match.verificationStatus === 'APPROVED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : match.verificationStatus === 'PENDING_REVIEW'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : match.verificationStatus === 'CHANGED'
                            ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                            : match.verificationStatus === 'REJECTED'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}>
                          {match.verificationStatus}
                        </span>
                      </td>

                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => setInspectingMatch(match)}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition-colors"
                          >
                            Review
                          </button>
                          {isPending && (
                            <button
                              onClick={() => {
                                setInspectingMatch(match);
                                setActionModalType('APPROVE');
                              }}
                              className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors"
                            >
                              Approve
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ================= INSPECTOR DRAWER / MODAL ================= */}
      {inspectingMatch && !actionModalType && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-6">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold font-mono text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
                    MATCH INSPECTION
                  </span>
                  <span className="text-xs text-slate-500 font-mono">{inspectingMatch.id}</span>
                </div>
                <h2 className="text-lg font-bold text-slate-900 mt-1">{inspectingMatch.reportedActivityName}</h2>
              </div>
              <button
                onClick={() => setInspectingMatch(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 1. SOURCE EVIDENCE */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span className="font-semibold uppercase tracking-wider text-[10px] text-indigo-600 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" /> Source Field Evidence
                </span>
                <span className="text-slate-500 font-medium">{activeEvent?.documentName || 'Daily Report Log'}</span>
              </div>
              <p className="text-xs text-slate-900 font-mono bg-white p-3 rounded-lg border border-slate-200 leading-relaxed shadow-xs">
                "{activeEvent?.evidenceSnippet || inspectingMatch.explanation}"
              </p>
            </div>

            {/* 2. EXTRACTED EVENT */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-[10px] text-slate-500 uppercase font-semibold">Event Type</div>
                <div className="font-semibold text-slate-800 mt-0.5">{activeEvent?.eventType || 'ACTIVITY_IN_PROGRESS'}</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-[10px] text-slate-500 uppercase font-semibold">Quantity</div>
                <div className="font-semibold text-emerald-600 font-mono mt-0.5">
                  {activeEvent?.quantity ?? 1} {activeEvent?.unit || 'NOS'}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-[10px] text-slate-500 uppercase font-semibold">Discipline</div>
                <div className="font-semibold text-slate-800 mt-0.5">{activeEvent?.discipline || 'PIPING'}</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-[10px] text-slate-500 uppercase font-semibold">Area / Unit</div>
                <div className="font-semibold text-slate-800 mt-0.5">{activeEvent?.area || 'Area A'}</div>
              </div>
            </div>

            {/* 3. AI RECOMMENDATION & CONFIDENCE BREAKDOWN */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-xs text-indigo-700 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" /> AI Recommended Schedule Node
                </span>
                <span className="text-sm font-bold font-mono text-emerald-600">
                  {Math.round(inspectingMatch.finalScore * 100)}% Overall Confidence
                </span>
              </div>

              <div className="p-3 rounded-lg bg-white border border-slate-200 shadow-xs">
                <div className="text-sm font-bold text-indigo-900 font-mono">
                  {inspectingMatch.topCandidateActivityName || 'None'}
                </div>
                <p className="text-xs text-slate-600 mt-1">{inspectingMatch.explanation}</p>
              </div>

              {/* Score Radar / Multi-score breakdown */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-[11px] pt-2 border-t border-slate-200 text-center">
                <div className="p-2 rounded bg-white border border-slate-200 shadow-2xs">
                  <div className="text-slate-500 text-[10px] font-medium">Semantic</div>
                  <div className="font-mono font-bold text-slate-800">{Math.round(inspectingMatch.semanticScore * 100)}%</div>
                </div>
                <div className="p-2 rounded bg-white border border-slate-200 shadow-2xs">
                  <div className="text-slate-500 text-[10px] font-medium">Lexical</div>
                  <div className="font-mono font-bold text-slate-800">{Math.round(inspectingMatch.lexicalScore * 100)}%</div>
                </div>
                <div className="p-2 rounded bg-white border border-slate-200 shadow-2xs">
                  <div className="text-slate-500 text-[10px] font-medium">Discipline</div>
                  <div className="font-mono font-bold text-slate-800">{Math.round(inspectingMatch.disciplineScore * 100)}%</div>
                </div>
                <div className="p-2 rounded bg-white border border-slate-200 shadow-2xs">
                  <div className="text-slate-500 text-[10px] font-medium">Area</div>
                  <div className="font-mono font-bold text-slate-800">{Math.round(inspectingMatch.areaScore * 100)}%</div>
                </div>
                <div className="p-2 rounded bg-white border border-slate-200 shadow-2xs">
                  <div className="text-slate-500 text-[10px] font-medium">Context</div>
                  <div className="font-mono font-bold text-slate-800">{Math.round(inspectingMatch.contextScore * 100)}%</div>
                </div>
              </div>
            </div>

            {/* 4. ALTERNATIVE CANDIDATES */}
            {inspectingMatch.alternativeCandidates && inspectingMatch.alternativeCandidates.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Alternative Candidates ({inspectingMatch.alternativeCandidates.length})
                </div>
                <div className="space-y-1.5">
                  {inspectingMatch.alternativeCandidates.map(alt => (
                    <div
                      key={alt.candidateActivityId}
                      className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-mono text-slate-800 font-semibold">{alt.candidateActivityName}</span>
                        <span className="text-[10px] text-slate-500 ml-2">({alt.candidateDiscipline} • {alt.candidateArea})</span>
                      </div>
                      <span className="font-mono font-bold text-slate-700">
                        {Math.round(alt.finalScore * 100)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 5. ACTION BUTTONS */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100">
              <div className="text-xs text-slate-500">
                Current Status: <span className="font-bold text-emerald-600">{inspectingMatch.verificationStatus}</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActionModalType('REJECT')}
                  className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold border border-rose-200 transition-colors flex items-center gap-1.5"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Reject</span>
                </button>

                <button
                  onClick={() => {
                    setSelectedReplacementActivityId('');
                    setActionModalType('CHANGE');
                  }}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition-colors flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Change Match</span>
                </button>

                <button
                  onClick={() => setActionModalType('MARK_NEW')}
                  className="px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-semibold border border-amber-200 transition-colors flex items-center gap-1.5"
                >
                  <PlusCircle className="w-3.5 h-3.5 text-amber-600" />
                  <span>Mark New Activity</span>
                </button>

                <button
                  onClick={() => setActionModalType('APPROVE')}
                  className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-all flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Approve Match</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ================= ACTION CONFIRMATION MODALS ================= */}

      {/* APPROVE MODAL */}
      {actionModalType === 'APPROVE' && inspectingMatch && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>Confirm Verification & Actualization</span>
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              You are about to verify <strong className="text-slate-900 font-mono">{inspectingMatch.reportedActivityName}</strong> and link it to <strong className="text-indigo-600 font-mono">{inspectingMatch.topCandidateActivityName}</strong>.
            </p>
            <div className="text-[11px] text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
              <div>✓ Actual Start/Finish will be recorded in schedule</div>
              <div>✓ Verified progress percentage applied to WBS</div>
              <div>✓ PMIS sync event will be dispatched</div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Verification Note / Reason (Optional)</label>
              <textarea
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                placeholder="Verified against daily weld log and spool erection quality inspection sheet."
                className="w-full p-2.5 text-xs rounded-lg bg-white border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-xs"
                rows={2}
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setActionModalType(null)}
                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={handleApprove}
                disabled={isSubmitting}
                className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs"
              >
                {isSubmitting ? 'Saving...' : 'Confirm & Sync PMIS'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CHANGE MODAL */}
      {actionModalType === 'CHANGE' && inspectingMatch && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-indigo-600" />
              <span>Change Matched Schedule Activity</span>
            </h3>
            <p className="text-xs text-slate-600">
              Select another L5/L6 activity from this project's WBS to remap:
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Target Activity (L5 / L6)</label>
              <select
                value={selectedReplacementActivityId}
                onChange={(e) => setSelectedReplacementActivityId(e.target.value)}
                className="w-full p-2.5 text-xs rounded-lg bg-white border border-slate-200 text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-xs"
              >
                <option value="">-- Select Target Activity --</option>
                {eligibleActivities.map(act => (
                  <option key={act.id} value={act.id}>
                    [{act.wbs_level}] {act.activity_id} - {act.activity_name} ({act.discipline} • {act.area})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Planner Reason for Re-mapping *</label>
              <textarea
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                placeholder="Explain why the AI candidate was re-assigned (e.g., 'Remapped to granular L6 task for specific equipment tag')."
                className="w-full p-2.5 text-xs rounded-lg bg-white border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-xs"
                rows={2}
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setActionModalType(null)}
                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={handleChange}
                disabled={isSubmitting}
                className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs"
              >
                {isSubmitting ? 'Updating...' : 'Save Re-assignment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REJECT MODAL */}
      {actionModalType === 'REJECT' && inspectingMatch && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <XCircle className="w-5 h-5 text-rose-600" />
              <span>Reject Execution Event Match</span>
            </h3>
            <p className="text-xs text-slate-600">
              The execution event will be preserved for auditing, but the match status will be marked REJECTED.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Reason for Rejection *</label>
              <textarea
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                placeholder="e.g., Incomplete inspection permit, duplicate submittal, or non-EPC scope."
                className="w-full p-2.5 text-xs rounded-lg bg-white border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-rose-500 shadow-xs"
                rows={2}
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setActionModalType(null)}
                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={isSubmitting}
                className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs"
              >
                {isSubmitting ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MARK NEW ACTIVITY PROPOSAL MODAL */}
      {actionModalType === 'MARK_NEW' && inspectingMatch && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-amber-600" />
              <span>Propose New Schedule Activity</span>
            </h3>
            <p className="text-xs text-slate-600">
              Register a proposed new activity for baseline change order (MOC) review without directly altering baseline schedules.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Proposed Activity Description *</label>
                <input
                  type="text"
                  value={newActivityForm.description}
                  onChange={(e) => setNewActivityForm({ ...newActivityForm, description: e.target.value })}
                  placeholder="e.g., Underground Conduit Relocation - Flare Header"
                  className="w-full p-2.5 rounded-lg bg-white border border-slate-200 text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500 shadow-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Discipline</label>
                  <select
                    value={newActivityForm.discipline}
                    onChange={(e) => setNewActivityForm({ ...newActivityForm, discipline: e.target.value as Discipline })}
                    className="w-full p-2.5 rounded-lg bg-white border border-slate-200 text-slate-800 shadow-xs"
                  >
                    <option value="PIPING">Piping</option>
                    <option value="CIVIL">Civil</option>
                    <option value="ELECTRICAL">Electrical</option>
                    <option value="INSTRUMENTATION">Instrumentation</option>
                    <option value="STATIC_EQUIPMENT">Static Equipment</option>
                    <option value="ROTATING_EQUIPMENT">Rotating Equipment</option>
                    <option value="HSE">HSE</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Area / Location</label>
                  <input
                    type="text"
                    value={newActivityForm.area}
                    onChange={(e) => setNewActivityForm({ ...newActivityForm, area: e.target.value })}
                    className="w-full p-2.5 rounded-lg bg-white border border-slate-200 text-slate-800 shadow-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Proposal Justification *</label>
                <textarea
                  value={newActivityForm.reason}
                  onChange={(e) => setNewActivityForm({ ...newActivityForm, reason: e.target.value })}
                  placeholder="Explain why this activity is not present in original baseline..."
                  className="w-full p-2.5 rounded-lg bg-white border border-slate-200 text-slate-800 shadow-xs"
                  rows={2}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setActionModalType(null)}
                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={handleMarkNew}
                disabled={isSubmitting}
                className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs"
              >
                {isSubmitting ? 'Proposing...' : 'Submit Proposal'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
