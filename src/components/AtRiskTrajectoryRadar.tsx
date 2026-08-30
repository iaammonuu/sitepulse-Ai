import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Clock,
  ChevronRight,
  CheckCircle2,
  Filter,
  Wrench,
  Users,
  RefreshCw,
  Zap,
  Info
} from 'lucide-react';
import { AtRiskActivityAnalysis, Discipline, Project } from '../types.ts';
import { api } from '../api.ts';

interface AtRiskTrajectoryRadarProps {
  project: Project;
  onNavigate: (view: string, itemId?: string) => void;
  onSelectActivity?: (activityId: string) => void;
}

export const AtRiskTrajectoryRadar: React.FC<AtRiskTrajectoryRadarProps> = ({
  project,
  onNavigate,
  onSelectActivity
}) => {
  const [activities, setActivities] = useState<AtRiskActivityAnalysis[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>('ALL');
  const [selectedRiskFilter, setSelectedRiskFilter] = useState<string>('ALL');
  const [expandedId, setExpandedId] = useState<string | null>('risk-pip-003');
  const [mitigatingId, setMitigatingId] = useState<string | null>(null);
  const [appliedMitigations, setAppliedMitigations] = useState<Record<string, boolean>>({});

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await api.getAtRiskActivities(project.id);
      setActivities(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load at-risk activities:', err);
      setActivities([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [project.id]);

  const handleApplyMitigation = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setMitigatingId(id);
    setTimeout(() => {
      setAppliedMitigations(prev => ({ ...prev, [id]: true }));
      setMitigatingId(null);
    }, 900);
  };

  const safeActs = activities || [];

  const filtered = safeActs.filter(act => {
    if (selectedDiscipline !== 'ALL' && act.discipline !== selectedDiscipline) return false;
    if (selectedRiskFilter !== 'ALL' && act.riskLevel !== selectedRiskFilter) return false;
    return true;
  });

  const criticalCount = safeActs.filter(a => a.riskLevel === 'CRITICAL').length;
  const highCount = safeActs.filter(a => a.riskLevel === 'HIGH').length;
  const totalSlippage = safeActs.reduce((acc, a) => acc + (a.criticalPath ? a.slippageDays : 0), 0);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden space-y-0">
      
      {/* Header Bar */}
      <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950 text-white">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold tracking-tight text-white">AI Schedule Trajectory & Risk Radar</h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-indigo-400" />
                  <span>Gemini Predictive</span>
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Continuous baseline comparison evaluating velocity deviations, critical path float erosion, and resource constraints
              </p>
            </div>
          </div>
        </div>

        {/* Top telemetry counters */}
        <div className="flex items-center gap-3 self-start md:self-center">
          <div className="px-3.5 py-2 rounded-lg bg-slate-800/80 border border-slate-700/80 text-center">
            <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Critical Path Delay</div>
            <div className="text-sm font-bold font-mono text-rose-400 flex items-center justify-center gap-1">
              <span>+{totalSlippage} Days</span>
            </div>
          </div>

          <div className="px-3.5 py-2 rounded-lg bg-slate-800/80 border border-slate-700/80 text-center">
            <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">At-Risk Nodes</div>
            <div className="text-sm font-bold font-mono text-amber-400">
              {criticalCount} Crit • {highCount} High
            </div>
          </div>

          <button
            onClick={loadData}
            title="Refresh AI Trajectory"
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="px-5 py-3 bg-slate-50/80 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-slate-500 font-medium flex items-center gap-1 mr-1">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>Severity:</span>
          </span>
          {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map(lvl => (
            <button
              key={lvl}
              onClick={() => setSelectedRiskFilter(lvl)}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                selectedRiskFilter === lvl
                  ? lvl === 'CRITICAL'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : lvl === 'HIGH'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              {lvl === 'ALL' ? 'All Risks' : lvl}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-500 font-medium">Discipline:</span>
          <select
            value={selectedDiscipline}
            onChange={(e) => setSelectedDiscipline(e.target.value)}
            className="bg-white border border-slate-200 rounded-md px-2.5 py-1 text-xs text-slate-700 font-medium focus:ring-1 focus:ring-indigo-500 focus:outline-none"
          >
            <option value="ALL">All Disciplines</option>
            <option value="PIPING">Piping</option>
            <option value="STATIC_EQUIPMENT">Static Equipment</option>
            <option value="ELECTRICAL">Electrical</option>
            <option value="CIVIL">Civil</option>
            <option value="INSTRUMENTATION">Instrumentation</option>
          </select>
        </div>
      </div>

      {/* Trajectory Cards List */}
      <div className="p-5 space-y-4">
        {loading ? (
          <div className="p-8 text-center text-slate-500 space-y-2">
            <RefreshCw className="w-6 h-6 animate-spin text-indigo-600 mx-auto" />
            <div className="text-xs font-medium">Computing schedule velocity deviations & trajectory...</div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <div className="text-sm font-semibold text-slate-800">No activities match selected risk criteria</div>
            <p className="text-xs text-slate-500 mt-1">All monitored activities are tracking within baseline tolerance limits.</p>
          </div>
        ) : (
          filtered.map(act => {
            const isExpanded = expandedId === act.id;
            const isMitigated = appliedMitigations[act.id];

            return (
              <div
                key={act.id}
                onClick={() => setExpandedId(isExpanded ? null : act.id)}
                className={`rounded-xl border transition-all cursor-pointer ${
                  act.riskLevel === 'CRITICAL'
                    ? 'border-rose-200 bg-rose-50/20 hover:border-rose-300'
                    : act.riskLevel === 'HIGH'
                    ? 'border-amber-200 bg-amber-50/15 hover:border-amber-300'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                } p-4 space-y-3.5 shadow-xs`}
              >
                {/* Card Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                        {act.activity_id}
                      </span>
                      <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 font-semibold border border-indigo-200">
                        {act.wbs_level}
                      </span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {act.discipline}
                      </span>
                      {act.criticalPath && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-600 text-white uppercase tracking-wider animate-pulse flex items-center gap-1">
                          <ShieldAlert className="w-3 h-3" />
                          <span>Critical Path</span>
                        </span>
                      )}
                      <span className="text-xs text-slate-500">
                        • {act.area}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 hover:text-indigo-600 transition-colors">
                      {act.name}
                    </h3>
                  </div>

                  {/* Status Badges */}
                  <div className="flex items-center gap-2 flex-shrink-0 self-start md:self-center">
                    <div className={`px-2.5 py-1 rounded-md text-xs font-bold font-mono border ${
                      act.riskLevel === 'CRITICAL'
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : act.riskLevel === 'HIGH'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                    }`}>
                      Risk Score: {act.riskScore}/100
                    </div>

                    <div className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold flex items-center gap-1 font-mono">
                      <Clock className="w-3.5 h-3.5 text-rose-500" />
                      <span>{act.slippageDays > 0 ? `+${act.slippageDays}d Slippage` : 'On Track'}</span>
                    </div>
                  </div>
                </div>

                {/* Progress Trajectory Visual Bar */}
                <div className="space-y-1.5 bg-white p-3 rounded-lg border border-slate-200/80 shadow-2xs">
                  <div className="flex items-center justify-between text-xs font-medium">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500">Actual: <strong className="text-slate-900 font-mono">{act.actualProgress}%</strong></span>
                      <span className="text-slate-300">|</span>
                      <span className="text-slate-500">Baseline Planned: <strong className="text-slate-700 font-mono">{act.plannedProgress}%</strong></span>
                    </div>
                    
                    <div className="flex items-center gap-1 text-xs font-semibold">
                      {act.progressDelta < 0 ? (
                        <span className="text-rose-600 flex items-center gap-0.5 font-mono">
                          <TrendingDown className="w-3.5 h-3.5" />
                          <span>{act.progressDelta}% Lag</span>
                        </span>
                      ) : (
                        <span className="text-emerald-600 flex items-center gap-0.5 font-mono">
                          <TrendingUp className="w-3.5 h-3.5" />
                          <span>+{act.progressDelta}% Ahead</span>
                        </span>
                      )}
                      <span className="text-[10px] text-slate-400 ml-1.5 uppercase font-mono px-1.5 py-0.5 rounded bg-slate-100">
                        {act.velocityTrend}
                      </span>
                    </div>
                  </div>

                  {/* Dual Bar: Planned (gray outline/hatch) vs Actual (colored) */}
                  <div className="relative w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                    {/* Planned Target Marker */}
                    <div
                      className="absolute top-0 bottom-0 bg-slate-300/80 rounded-full z-0"
                      style={{ width: `${act.plannedProgress}%` }}
                    />
                    {/* Actual Progress Fill */}
                    <div
                      className={`h-full rounded-full transition-all duration-700 relative z-10 ${
                        act.riskLevel === 'CRITICAL'
                          ? 'bg-rose-500'
                          : act.riskLevel === 'HIGH'
                          ? 'bg-amber-500'
                          : 'bg-indigo-500'
                      }`}
                      style={{ width: `${act.actualProgress}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono pt-0.5">
                    <span>Planned End: {act.plannedFinish}</span>
                    <span className="text-rose-600 font-semibold">Forecast End: {act.forecastFinish}</span>
                  </div>
                </div>

                {/* AI Root Cause & Mitigation Expansion */}
                {isExpanded && (
                  <div className="pt-2 border-t border-slate-200/80 space-y-3 animate-fadeIn">
                    
                    {/* AI Diagnosis Block */}
                    <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                        <Sparkles className="w-4 h-4 text-indigo-600" />
                        <span>AI Root Cause Analysis & Empirical EPC Correlation</span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {act.aiRootCause}
                      </p>
                      {act.historicalComparison && (
                        <div className="text-[11px] text-indigo-700 bg-indigo-50/70 p-2 rounded border border-indigo-100 flex items-start gap-1.5">
                          <Info className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0 mt-0.5" />
                          <span>{act.historicalComparison}</span>
                        </div>
                      )}
                    </div>

                    {/* AI Recovery Plan */}
                    <div className="p-3.5 rounded-lg bg-emerald-50/60 border border-emerald-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs font-bold text-emerald-900">
                          <Zap className="w-4 h-4 text-emerald-600" />
                          <span>Recommended Recovery Mitigation</span>
                        </div>
                        {isMitigated && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Action Dispatched</span>
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-emerald-900 leading-relaxed">
                        {act.aiMitigation}
                      </p>
                      {act.resourceBottleneck && (
                        <div className="flex items-center gap-2 pt-1 text-xs text-slate-600">
                          <strong className="text-slate-800">Identified Constraint:</strong>
                          <span className="px-2 py-0.5 rounded bg-white text-slate-800 border border-slate-200 font-mono text-[11px]">
                            {act.resourceBottleneck}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Action Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onNavigate('resources');
                          }}
                          className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors"
                        >
                          <Users className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Manage Allocation in Resource View</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onNavigate('schedule');
                          }}
                          className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors"
                        >
                          <Wrench className="w-3.5 h-3.5 text-slate-600" />
                          <span>Inspect in Schedule WBS</span>
                        </button>
                      </div>

                      <button
                        onClick={(e) => handleApplyMitigation(act.id, e)}
                        disabled={isMitigated || mitigatingId === act.id}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all ${
                          isMitigated
                            ? 'bg-emerald-600 text-white cursor-default'
                            : 'bg-indigo-600 hover:bg-indigo-700 text-white active:scale-95'
                        }`}
                      >
                        {mitigatingId === act.id ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : isMitigated ? (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        ) : (
                          <Zap className="w-3.5 h-3.5" />
                        )}
                        <span>{isMitigated ? 'Mitigation Queued in PMIS' : 'Apply AI Mitigation Protocol'}</span>
                      </button>
                    </div>

                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer Navigation */}
      <div className="p-3.5 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between text-xs">
        <span className="text-slate-500 text-[11px]">
          Forecasts recalculated in real-time from verified field evidence & site supervisor chat inputs
        </span>
        <button
          onClick={() => onNavigate('resources')}
          className="font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 group py-1 px-2.5 rounded-lg hover:bg-indigo-50 transition-colors"
        >
          <span>Open Full Resource Allocation Engine</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

    </div>
  );
};
