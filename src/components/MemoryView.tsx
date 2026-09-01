import React, { useState, useEffect } from 'react';
import {
  Brain,
  TrendingUp,
  AlertTriangle,
  Sparkles,
  ShieldCheck,
  Activity,
  Layers,
  Info
} from 'lucide-react';
import { Project, InstitutionalMemoryBenchmark } from '../types.ts';
import { api } from '../api.ts';

interface MemoryViewProps {
  project: Project;
}

export const MemoryView: React.FC<MemoryViewProps> = ({ project }) => {
  const [benchmarks, setBenchmarks] = useState<InstitutionalMemoryBenchmark[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await api.getInstitutionalMemory(project.id);
        setBenchmarks(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error(e);
        setBenchmarks([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [project.id]);

  const safeBenchmarks = benchmarks || [];

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Brain className="w-5 h-5 text-indigo-600" />
            <span>Institutional Memory & Historical Benchmarks</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Empirical cross-project execution knowledge base synthesized from past turnaround and greenfield refinery schedules.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-200">
            5 EPC DOMAIN BENCHMARKS
          </span>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-500">Loading institutional memory records...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {safeBenchmarks.map(b => (
            <div
              key={b.id}
              className="p-5 rounded-xl bg-white border border-slate-200 hover:border-indigo-200 transition-all space-y-4 shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                      {b.discipline}
                    </span>
                    <span className="text-xs text-slate-500 font-mono">
                      {b.historicalActivitiesCount} Historical Activities
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mt-1">{b.activityType}</h3>
                </div>

                <div className="text-right">
                  <div className="text-[10px] text-slate-500 uppercase font-semibold">Avg Deviation</div>
                  <span className={`text-xs font-bold font-mono px-2 py-0.5 rounded ${
                    b.typicalDeviationPercent > 15
                      ? 'bg-rose-50 text-rose-700 border border-rose-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}>
                    +{b.typicalDeviationPercent}%
                  </span>
                </div>
              </div>

              {/* Durations */}
              <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-lg border border-slate-200/80">
                <div>
                  <div className="text-slate-500 text-[10px] uppercase font-semibold">Planned Duration Avg</div>
                  <div className="font-mono font-bold text-slate-800 mt-0.5">{b.avgPlannedDurationDays} Days</div>
                </div>
                <div>
                  <div className="text-slate-500 text-[10px] uppercase font-semibold">Actual Realized Avg</div>
                  <div className="font-mono font-bold text-amber-700 mt-0.5">{b.avgActualDurationDays} Days</div>
                </div>
              </div>

              {/* Risk Bottlenecks */}
              <div className="space-y-1.5 text-xs">
                <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                  <span>Historical Risk Bottlenecks</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(b.riskBottlenecks || []).map((risk, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] border border-slate-200"
                    >
                      {risk}
                    </span>
                  ))}
                </div>
              </div>

              {/* AI Recommendation */}
              <div className="p-3 rounded-lg bg-indigo-50/70 border border-indigo-100 text-xs space-y-1">
                <div className="font-semibold text-indigo-800 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  <span>AI Buffer Recommendation</span>
                </div>
                <p className="text-slate-700 text-[11px] leading-relaxed">
                  {b.recommendation}
                </p>
              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
};
