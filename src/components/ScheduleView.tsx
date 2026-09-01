import React, { useState, useMemo } from 'react';
import {
  Network,
  ListTree,
  Search,
  Filter,
  ChevronDown,
  ChevronRight,
  Activity,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  ShieldCheck,
  X,
  ExternalLink,
  Layers
} from 'lucide-react';
import { ScheduleActivity, Project, Discipline, WBSLevel, ActivityStatus } from '../types.ts';
import { api } from '../api.ts';

interface ScheduleViewProps {
  project: Project;
  activities: ScheduleActivity[];
  selectedActivityId?: string | null;
  onRefreshData: () => void;
  onNavigate: (view: string, itemId?: string) => void;
}

export const ScheduleView: React.FC<ScheduleViewProps> = ({
  project,
  activities = [],
  selectedActivityId,
  onRefreshData,
  onNavigate
}) => {
  const safeActivities = activities || [];

  const [viewMode, setViewMode] = useState<'TREE' | 'TABLE'>('TREE');
  const [searchQuery, setSearchQuery] = useState('');
  const [disciplineFilter, setDisciplineFilter] = useState<string>('ALL');
  const [wbsFilter, setWbsFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  
  // Expanded nodes in tree
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(() => {
    return new Set(['act-l1-001', 'act-l2-001', 'act-l3-002', 'act-l4-002', 'act-l5-pip-001', 'act-l5-pip-002']);
  });

  // Selected Activity Detail
  const [inspectingActivityId, setInspectingActivityId] = useState<string | null>(selectedActivityId || null);
  const [activityDetailData, setActivityDetailData] = useState<{
    activity: ScheduleActivity;
    events: any[];
    matches: any[];
    auditLogs: any[];
  } | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Load detail when inspectingActivityId changes
  const handleOpenDetail = async (actId: string) => {
    setInspectingActivityId(actId);
    setLoadingDetail(true);
    try {
      const data = await api.getActivityDetail(project.id, actId);
      setActivityDetailData(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingDetail(false);
    }
  };

  const toggleNode = (nodeId: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  // Filtered Activities
  const filteredActivities = useMemo(() => {
    return safeActivities.filter(a => {
      if (disciplineFilter !== 'ALL' && a.discipline !== disciplineFilter) return false;
      if (wbsFilter !== 'ALL' && a.wbs_level !== wbsFilter) return false;
      if (statusFilter !== 'ALL' && a.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        if (!a.activity_id.toLowerCase().includes(q) &&
            !a.activity_name.toLowerCase().includes(q) &&
            !a.area.toLowerCase().includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [safeActivities, disciplineFilter, wbsFilter, statusFilter, searchQuery]);

  // Group by Parent for Tree Rendering
  const childrenMap = useMemo(() => {
    const map = new Map<string | null, ScheduleActivity[]>();
    safeActivities.forEach(act => {
      const parent = act.parent_id || null;
      if (!map.has(parent)) {
        map.set(parent, []);
      }
      map.get(parent)!.push(act);
    });
    return map;
  }, [safeActivities]);

  const renderTreeNode = (act: ScheduleActivity, depth: number = 0) => {
    const children = childrenMap.get(act.id) || [];
    const hasChildren = children.length > 0;
    const isExpanded = expandedNodes.has(act.id);
    const isSelected = inspectingActivityId === act.id;

    // Filter check for parent when children match
    const passesFilters = (
      (disciplineFilter === 'ALL' || act.discipline === disciplineFilter) &&
      (statusFilter === 'ALL' || act.status === statusFilter) &&
      (!searchQuery.trim() || act.activity_name.toLowerCase().includes(searchQuery.toLowerCase()) || act.activity_id.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
      <div key={act.id} className="select-none">
        <div
          onClick={() => {
            if (act.wbs_level === 'L6' || act.wbs_level === 'L5') {
              handleOpenDetail(act.id);
            } else if (hasChildren) {
              toggleNode(act.id);
            }
          }}
          className={`flex items-center justify-between py-2 px-3 rounded-lg cursor-pointer transition-colors text-xs border ${
            isSelected
              ? 'bg-indigo-50/80 border-indigo-200 text-slate-900 font-medium'
              : 'hover:bg-slate-50 border-transparent text-slate-700'
          }`}
          style={{ paddingLeft: `${Math.max(12, depth * 22)}px` }}
        >
          <div className="flex items-center gap-2 min-w-0">
            {hasChildren ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleNode(act.id);
                }}
                className="p-1 hover:bg-slate-200/60 rounded text-slate-400 hover:text-slate-700"
              >
                {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </button>
            ) : (
              <span className="w-5" />
            )}

            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
              act.wbs_level === 'L1' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' :
              act.wbs_level === 'L2' ? 'bg-sky-50 text-sky-700 border border-sky-200' :
              act.wbs_level === 'L3' ? 'bg-slate-100 text-slate-700 border border-slate-200' :
              act.wbs_level === 'L4' ? 'bg-slate-100 text-slate-600 border border-slate-200' :
              act.wbs_level === 'L5' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
              'bg-emerald-50 text-emerald-700 border border-emerald-200'
            }`}>
              {act.wbs_level}
            </span>

            <span className="font-mono font-semibold text-indigo-600 text-xs truncate max-w-[130px] sm:max-w-none">
              {act.activity_id}
            </span>

            <span className="text-slate-800 truncate">{act.activity_name}</span>

            {act.critical_path && (
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-rose-50 text-rose-600 border border-rose-200 font-mono font-medium">
                CP
              </span>
            )}
          </div>

          <div className="flex items-center gap-4 flex-shrink-0">
            <span className="text-[11px] text-slate-500 hidden md:inline">
              {act.discipline} • {act.area}
            </span>

            <div className="w-20 hidden sm:block">
              <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                <span>{act.progress}%</span>
                <span>{act.actual_quantity}/{act.planned_quantity} {act.unit}</span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-0.5 border border-slate-200/50">
                <div
                  className={`h-full rounded-full ${
                    act.status === 'COMPLETED' ? 'bg-emerald-500' :
                    act.status === 'DELAYED' ? 'bg-rose-500' :
                    'bg-amber-500'
                  }`}
                  style={{ width: `${act.progress}%` }}
                />
              </div>
            </div>

            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
              act.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
              act.status === 'IN_PROGRESS' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
              act.status === 'DELAYED' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
              'bg-slate-100 text-slate-600 border border-slate-200'
            }`}>
              {act.status}
            </span>
          </div>
        </div>

        {/* Render children if expanded */}
        {hasChildren && isExpanded && (
          <div className="space-y-0.5">
            {children.map(child => renderTreeNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const rootActivities = childrenMap.get(null) || [];

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Network className="w-5 h-5 text-indigo-600" />
            <span>Baseline Schedule Explorer (L1 → L6 WBS)</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Browse planned vs actualized construction activities, milestone dependencies, and field evidence links.
          </p>
        </div>

        {/* View Switcher */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
          <button
            onClick={() => setViewMode('TREE')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
              viewMode === 'TREE' ? 'bg-white text-slate-900 shadow-sm border border-slate-200/60' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            WBS Tree View
          </button>
          <button
            onClick={() => setViewMode('TABLE')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
              viewMode === 'TABLE' ? 'bg-white text-slate-900 shadow-sm border border-slate-200/60' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Tabular View
          </button>
        </div>
      </div>

      {/* Easy Understanding Callout Banner */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-amber-50 to-indigo-50/50 border border-amber-200/80 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-amber-200/60 text-amber-900 font-bold flex items-center justify-center flex-shrink-0 text-sm">
            💡
          </div>
          <div>
            <div className="font-bold text-slate-900 text-xs">
              Quick Guide: How to Read the Schedule Hierarchy
            </div>
            <p className="text-[11px] text-slate-600 mt-0.5">
              <strong>L1</strong> is the entire project, <strong>L2–L4</strong> are plant areas and piping systems, while <strong>L5–L6</strong> are specific field tasks (e.g. welding, concrete pouring). Click any <strong>L6 task</strong> to see attached photos, inspection passes, and AI audit history.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 font-bold">
            CP = Critical Path
          </span>
        </div>
      </div>

      {/* Toolbar Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search activity ID, spool, welds, area..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg bg-white border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-sm"
          />
        </div>

        <div>
          <select
            value={disciplineFilter}
            onChange={(e) => setDisciplineFilter(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-lg bg-white border border-slate-200 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-sm"
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
            value={wbsFilter}
            onChange={(e) => setWbsFilter(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-lg bg-white border border-slate-200 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-sm"
          >
            <option value="ALL">All WBS Levels</option>
            <option value="L1">L1 - Project</option>
            <option value="L2">L2 - Unit</option>
            <option value="L3">L3 - Discipline</option>
            <option value="L4">L4 - Package</option>
            <option value="L5">L5 - Work Package</option>
            <option value="L6">L6 - Granular Activity</option>
          </select>
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-lg bg-white border border-slate-200 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-sm"
          >
            <option value="ALL">All Statuses</option>
            <option value="NOT_STARTED">Not Started</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="DELAYED">Delayed</option>
          </select>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 overflow-hidden shadow-sm">
        {viewMode === 'TREE' ? (
          <div className="space-y-1">
            {rootActivities.length > 0 ? (
              rootActivities.map(root => renderTreeNode(root, 0))
            ) : (
              activities.slice(0, 30).map(act => renderTreeNode(act, 0))
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-4 px-4">Activity ID</th>
                  <th className="py-4 px-4">Activity Name</th>
                  <th className="py-4 px-4">WBS</th>
                  <th className="py-4 px-4">Discipline</th>
                  <th className="py-4 px-4">Area</th>
                  <th className="py-4 px-4">Planned Dates</th>
                  <th className="py-4 px-4">Actual Dates</th>
                  <th className="py-4 px-4">Progress</th>
                  <th className="py-4 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredActivities.map(act => (
                  <tr
                    key={act.id}
                    onClick={() => handleOpenDetail(act.id)}
                    className="hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <td className="py-4 px-4 font-mono font-bold text-indigo-600">{act.activity_id}</td>
                    <td className="py-4 px-4 text-slate-800 font-medium">{act.activity_name}</td>
                    <td className="py-4 px-4">
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[10px] border border-slate-200">
                        {act.wbs_level}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-slate-600">{act.discipline}</td>
                    <td className="py-4 px-4 text-slate-500">{act.area}</td>
                    <td className="py-4 px-4 text-[11px] text-slate-500 font-mono">
                      {act.planned_start} → {act.planned_finish}
                    </td>
                    <td className="py-4 px-4 text-[11px] font-mono">
                      {act.actual_finish ? (
                        <span className="text-emerald-700 font-semibold">Done: {act.actual_finish}</span>
                      ) : act.actual_start ? (
                        <span className="text-amber-700 font-medium">Started: {act.actual_start}</span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-12 bg-slate-100 h-1.5 rounded-full overflow-hidden border border-slate-200/50">
                          <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${act.progress}%` }} />
                        </div>
                        <span className="font-mono text-slate-700">{act.progress}%</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        act.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        act.status === 'IN_PROGRESS' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                        act.status === 'DELAYED' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                        'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}>
                        {act.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ================= ACTIVITY DETAIL INSPECTOR MODAL ================= */}
      {inspectingActivityId && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-6">
            
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
                    {activityDetailData?.activity.wbs_level || 'L6'} ACTIVITY DETAIL
                  </span>
                  <span className="text-xs font-mono text-slate-500">
                    {activityDetailData?.activity.activity_id}
                  </span>
                </div>
                <h2 className="text-lg font-bold text-slate-900 mt-1">
                  {activityDetailData?.activity.activity_name}
                </h2>
              </div>
              <button
                onClick={() => setInspectingActivityId(null)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {loadingDetail ? (
              <div className="p-8 text-center text-slate-500">Loading activity intelligence data...</div>
            ) : activityDetailData ? (
              <>
                {/* 1. Schedule & Progress Parameters */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80">
                    <div className="text-[10px] text-slate-500 uppercase font-semibold">Discipline / Area</div>
                    <div className="font-semibold text-slate-800 mt-0.5">
                      {activityDetailData.activity.discipline} • {activityDetailData.activity.area}
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80">
                    <div className="text-[10px] text-slate-500 uppercase font-semibold">Current Progress</div>
                    <div className="font-semibold text-emerald-700 font-mono mt-0.5">
                      {activityDetailData.activity.progress}% ({activityDetailData.activity.actual_quantity}/{activityDetailData.activity.planned_quantity} {activityDetailData.activity.unit})
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80">
                    <div className="text-[10px] text-slate-500 uppercase font-semibold">Planned Dates</div>
                    <div className="font-mono text-slate-700 mt-0.5">
                      {activityDetailData.activity.planned_start} → {activityDetailData.activity.planned_finish}
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80">
                    <div className="text-[10px] text-slate-500 uppercase font-semibold">Actualized Dates</div>
                    <div className="font-mono text-indigo-700 mt-0.5 font-semibold">
                      {activityDetailData.activity.actual_finish ? `Finish: ${activityDetailData.activity.actual_finish}` : (activityDetailData.activity.actual_start ? `Start: ${activityDetailData.activity.actual_start}` : 'Not Started')}
                    </div>
                  </div>
                </div>

                {/* 2. Linked Evidence & Matched Events */}
                <div className="space-y-3">
                  <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Linked Field Evidence ({activityDetailData.events.length})</span>
                  </h3>
                  {activityDetailData.events.length === 0 ? (
                    <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-center text-xs text-slate-500">
                      No field reports linked yet for this activity.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {activityDetailData.events.map(evt => (
                        <div key={evt.id} className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-slate-800">{evt.activityName}</span>
                            <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded font-semibold">
                              {Math.round(evt.confidence * 100)}% Confidence
                            </span>
                          </div>
                          <p className="text-slate-700 font-mono text-[11px]">"{evt.evidenceSnippet}"</p>
                          <div className="text-[10px] text-slate-500">Source: {evt.documentName || 'Daily Log'} • {evt.timestamp}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 3. Activity Audit Trail */}
                <div className="space-y-3">
                  <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Activity Audit Trail</span>
                  </h3>
                  {activityDetailData.auditLogs.length === 0 ? (
                    <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-center text-xs text-slate-500">
                      No audit transactions recorded yet.
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {activityDetailData.auditLogs.map(aud => (
                        <div key={aud.id} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                          <div>
                            <span className="font-mono text-indigo-700 text-[11px] font-semibold">{aud.action}</span>
                            <span className="text-slate-700 ml-2">{aud.details}</span>
                          </div>
                          <span className="text-[10px] text-slate-500">{aud.timestamp.split('T')[0]}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </>
            ) : null}

          </div>
        </div>
      )}

    </div>
  );
};
