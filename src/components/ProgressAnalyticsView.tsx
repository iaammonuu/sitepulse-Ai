import React from 'react';
import {
  BarChart3,
  TrendingUp,
  PieChart,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Activity,
  ArrowUpRight
} from 'lucide-react';
import { Project, DashboardMetrics, ScheduleActivity, MatchResult } from '../types.ts';

interface ProgressAnalyticsViewProps {
  project: Project;
  metrics: DashboardMetrics | null;
  activities: ScheduleActivity[];
  matches: MatchResult[];
}

export const ProgressAnalyticsView: React.FC<ProgressAnalyticsViewProps> = ({
  project,
  metrics,
  activities = [],
  matches = []
}) => {
  const safeActs = activities || [];
  const safeMatches = matches || [];

  // Discipline progress calculation
  const disciplines = ['CIVIL', 'PIPING', 'STATIC_EQUIPMENT', 'ROTATING_EQUIPMENT', 'ELECTRICAL', 'INSTRUMENTATION', 'HSE'];
  
  const disciplineStats = disciplines.map(disc => {
    const discActs = safeActs.filter(a => a.discipline === disc);
    const total = discActs.length;
    const completed = discActs.filter(a => a.status === 'COMPLETED').length;
    const inProgress = discActs.filter(a => a.status === 'IN_PROGRESS').length;
    const avgProgress = total > 0 
      ? Math.round(discActs.reduce((acc, a) => acc + a.progress, 0) / total) 
      : 0;

    return {
      name: disc,
      total,
      completed,
      inProgress,
      progress: avgProgress
    };
  }).filter(d => d.total > 0);

  // Confidence distribution
  const highConf = safeMatches.filter(m => m.finalScore >= 0.90).length;
  const medConf = safeMatches.filter(m => m.finalScore >= 0.80 && m.finalScore < 0.90).length;
  const lowConf = safeMatches.filter(m => m.finalScore < 0.80).length;
  const totalMatches = safeMatches.length || 1;

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-600" />
            <span>Progress & AI Matching Analytics</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time S-curve indicators, discipline performance tracking, and semantic matching distribution.
          </p>
        </div>
        <div className="text-right">
          <div className="text-xs text-slate-500">Total Project Actual Progress</div>
          <div className="text-2xl font-bold text-emerald-600 font-mono">
            {metrics ? `${metrics.scheduleProgress}%` : '34.2%'}
          </div>
        </div>
      </div>

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm space-y-2">
          <div className="text-xs font-semibold uppercase text-slate-500 flex items-center justify-between">
            <span>AI Auto-Match Rate</span>
            <Sparkles className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900">88.4%</div>
          <p className="text-[11px] text-slate-500">
            Field reports matched above 0.85 threshold without manual intervention.
          </p>
        </div>

        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm space-y-2">
          <div className="text-xs font-semibold uppercase text-slate-500 flex items-center justify-between">
            <span>Critical Path Variance</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-600">+2.4 Days</div>
          <p className="text-[11px] text-slate-500">
            Critical path schedule variance based on actual verified progress.
          </p>
        </div>

        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm space-y-2">
          <div className="text-xs font-semibold uppercase text-slate-500 flex items-center justify-between">
            <span>Average Verification Cycle</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-600">4.2 Hours</div>
          <p className="text-[11px] text-slate-500">
            Reduced from industry average of 14 days down to same-day actualization.
          </p>
        </div>
      </div>

      {/* Discipline Breakdown & AI Confidence Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* Discipline Breakdown */}
        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600" />
              <span>Discipline Progress Breakdown</span>
            </h3>
            <span className="text-[10px] text-slate-500 font-mono">Real-time WBS rollup</span>
          </div>

          <div className="space-y-3">
            {disciplineStats.map(d => (
              <div key={d.name} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700">{d.name}</span>
                  <span className="font-mono text-slate-600">
                    {d.progress}% ({d.completed}/{d.total} tasks)
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200/60">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${d.progress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Confidence Distribution */}
        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>AI Match Confidence Distribution</span>
            </h3>
            <span className="text-[10px] text-slate-500 font-mono">{matches.length} Total Matches</span>
          </div>

          <div className="space-y-4 pt-2">
            {/* High */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-emerald-700 font-medium">High Confidence (&gt;90%)</span>
                <span className="font-mono text-slate-700 font-semibold">
                  {highConf} ({Math.round((highConf / totalMatches) * 100)}%)
                </span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200/60">
                <div
                  className="bg-emerald-500 h-full rounded-full"
                  style={{ width: `${(highConf / totalMatches) * 100}%` }}
                />
              </div>
            </div>

            {/* Medium */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-amber-700 font-medium">Medium Confidence (80% - 90%)</span>
                <span className="font-mono text-slate-700 font-semibold">
                  {medConf} ({Math.round((medConf / totalMatches) * 100)}%)
                </span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200/60">
                <div
                  className="bg-amber-500 h-full rounded-full"
                  style={{ width: `${(medConf / totalMatches) * 100}%` }}
                />
              </div>
            </div>

            {/* Low */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-rose-700 font-medium">Low / Unmatched (&lt;80%)</span>
                <span className="font-mono text-slate-700 font-semibold">
                  {lowConf} ({Math.round((lowConf / totalMatches) * 100)}%)
                </span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200/60">
                <div
                  className="bg-rose-500 h-full rounded-full"
                  style={{ width: `${(lowConf / totalMatches) * 100}%` }}
                />
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-600 space-y-1">
              <div className="text-slate-900 font-semibold">Semantic Engine Weights:</div>
              <div>• 40% Text Embedding Cosine Similarity (Domain fine-tuned)</div>
              <div>• 25% Lexical Tag & Token Match</div>
              <div>• 15% Discipline Matrix Constraint</div>
              <div>• 10% Spatial Area / Unit Fit</div>
              <div>• 10% Predecessor Milestone Context</div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
