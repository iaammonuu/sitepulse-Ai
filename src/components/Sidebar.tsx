import React from 'react';
import {
  LayoutDashboard,
  FolderKanban,
  FileSpreadsheet,
  ListTree,
  GitPullRequest,
  Network,
  HardHat,
  BarChart3,
  Brain,
  MessageSquareCode,
  ShieldCheck,
  Users,
  CheckCircle2,
  ChevronRight,
  RotateCcw
} from 'lucide-react';
import { DashboardMetrics } from '../types.ts';

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  metrics: DashboardMetrics | null;
}

interface SidebarNavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | null;
  badgeColor?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
  metrics
}) => {
  const operationalItems: SidebarNavItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null
    },
    {
      id: 'projects',
      label: 'Projects',
      icon: FolderKanban,
      badge: '3',
      badgeColor: 'bg-indigo-500/20 text-indigo-400'
    },
    {
      id: 'ingestion',
      label: 'Ingestion Queue',
      icon: FileSpreadsheet,
      badge: metrics?.documentsCount ? metrics.documentsCount.toString() : '3',
      badgeColor: 'bg-indigo-500/20 text-indigo-400'
    },
    {
      id: 'review',
      label: 'Review Queue',
      icon: GitPullRequest,
      badge: metrics?.pendingVerificationCount && metrics.pendingVerificationCount > 0 
        ? metrics.pendingVerificationCount.toString() 
        : '0',
      badgeColor: metrics?.pendingVerificationCount && metrics.pendingVerificationCount > 0
        ? 'bg-amber-500/20 text-amber-400 font-bold'
        : 'bg-slate-800 text-slate-400'
    }
  ];

  const analysisItems: SidebarNavItem[] = [
    {
      id: 'activities',
      label: 'All Activities',
      icon: ListTree,
      badge: metrics?.totalActivities ? metrics.totalActivities.toString() : '52',
      badgeColor: 'bg-slate-800 text-slate-400'
    },
    {
      id: 'schedule',
      label: 'Schedule Explorer',
      icon: Network,
      badge: 'L1-L6',
      badgeColor: 'bg-emerald-500/20 text-emerald-400'
    },
    {
      id: 'resources',
      label: 'Resource Allocation',
      icon: HardHat,
      badge: 'Crews',
      badgeColor: 'bg-indigo-500/20 text-indigo-400'
    },
    {
      id: 'time-agent',
      label: 'Time Agent',
      icon: MessageSquareCode,
      badge: 'AI',
      badgeColor: 'bg-indigo-500/20 text-indigo-400 font-bold'
    },
    {
      id: 'analytics',
      label: 'Progress & Analytics',
      icon: BarChart3,
      badge: null
    },
    {
      id: 'memory',
      label: 'Institutional Memory',
      icon: Brain,
      badge: null
    }
  ];

  const governanceItems: SidebarNavItem[] = [
    {
      id: 'audit',
      label: 'Audit Trail',
      icon: ShieldCheck,
      badge: null
    },
    {
      id: 'team',
      label: 'Team Roles & RBAC',
      icon: Users,
      badge: null
    }
  ];

  return (
    <aside className="w-64 bg-[#0F172A] border-r border-[#1E293B] flex flex-col justify-between flex-shrink-0 min-h-[calc(100vh-4rem)]">
      <div className="p-4 space-y-6">
        
        {/* Operational Section */}
        <div>
          <div className="text-[10px] uppercase tracking-widest text-[#64748B] font-semibold mb-2 px-2">
            Operational
          </div>
          <div className="space-y-1">
            {operationalItems.map(item => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                      : 'text-[#94A3B8] hover:bg-[#1E293B] hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-[#64748B]'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${item.badgeColor || 'bg-slate-800 text-slate-400'}`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Analysis Section */}
        <div>
          <div className="text-[10px] uppercase tracking-widest text-[#64748B] font-semibold mb-2 px-2">
            Analysis & Field
          </div>
          <div className="space-y-1">
            {analysisItems.map(item => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                      : 'text-[#94A3B8] hover:bg-[#1E293B] hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-[#64748B]'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${item.badgeColor || 'bg-slate-800 text-slate-400'}`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Governance Section */}
        <div>
          <div className="text-[10px] uppercase tracking-widest text-[#64748B] font-semibold mb-2 px-2">
            Governance
          </div>
          <div className="space-y-1">
            {governanceItems.map(item => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                      : 'text-[#94A3B8] hover:bg-[#1E293B] hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-[#64748B]'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${item.badgeColor || 'bg-slate-800 text-slate-400'}`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

      </div>

      {/* Footer PMIS telemetry info */}
      <div className="p-4 border-t border-[#1E293B] bg-[#0A0F1D]/80 text-[11px] text-[#94A3B8]">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-slate-300 font-semibold text-xs">Primavera P6 Bridge</span>
          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-1.5 py-0.2 rounded border border-emerald-800/40">ONLINE</span>
        </div>
        <div className="text-[10px] text-[#64748B] flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>Bi-directional auto-sync active</span>
        </div>
        <div className="mt-2 text-[9px] text-[#64748B] font-mono">
          Engine: SitePulse-L6-Matcher-v2
        </div>
      </div>
    </aside>
  );
};
