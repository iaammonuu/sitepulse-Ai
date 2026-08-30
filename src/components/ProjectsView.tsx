import React from 'react';
import {
  FolderKanban,
  Building2,
  Calendar,
  Layers,
  ChevronRight,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Project } from '../types.ts';

interface ProjectsViewProps {
  projects: Project[];
  currentProjectId: string;
  onSelectProject: (projectId: string) => void;
  onNavigate: (view: string) => void;
}

export const ProjectsView: React.FC<ProjectsViewProps> = ({
  projects = [],
  currentProjectId,
  onSelectProject,
  onNavigate
}) => {
  const safeProjects = projects || [];

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <FolderKanban className="w-5 h-5 text-indigo-600" />
            <span>Enterprise Construction Projects</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage multi-project schedules, field ingestion pipelines, and Primavera P6 actualization bridges.
          </p>
        </div>
        <span className="text-xs font-mono font-semibold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
          {safeProjects.length} Active Mega-Projects
        </span>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {safeProjects.map(p => {
          const isSelected = p.id === currentProjectId;
          return (
            <div
              key={p.id}
              onClick={() => {
                onSelectProject(p.id);
                onNavigate('dashboard');
              }}
              className={`p-6 rounded-xl border cursor-pointer transition-all space-y-4 shadow-sm group ${
                isSelected
                  ? 'bg-indigo-50/40 border-indigo-500 ring-1 ring-indigo-500/30'
                  : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-md'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                    {p.code}
                  </span>
                  <h3 className="text-base font-bold text-slate-900 mt-1.5 group-hover:text-indigo-600 transition-colors">
                    {p.name}
                  </h3>
                </div>

                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {p.status}
                </span>
              </div>

              <div className="space-y-1.5 text-xs text-slate-500">
                <div className="flex items-center gap-2">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>Location: <strong className="text-slate-700">{p.location}</strong></span>
                </div>
                <div>Client: <strong className="text-slate-700">{p.client}</strong></div>
                <div>EPC Contractor: <strong className="text-slate-700">{p.contractor}</strong></div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1.5 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Schedule Actualization</span>
                  <span className="font-mono font-bold text-emerald-600">{p.progress}%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200/60">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${p.progress}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 text-xs">
                <span className="text-[11px] text-slate-500">
                  {isSelected ? '✓ Currently Loaded' : 'Click to Switch'}
                </span>
                <div className="flex items-center gap-1 text-indigo-600 font-semibold group-hover:translate-x-0.5 transition-transform">
                  <span>Enter Workspace</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};
