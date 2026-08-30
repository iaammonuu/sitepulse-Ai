import React, { useState, useEffect } from 'react';
import {
  Users,
  Truck,
  AlertTriangle,
  CheckCircle2,
  Wrench,
  Search,
  Filter,
  Plus,
  RefreshCw,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  Clock,
  Zap,
  Activity,
  Layers,
  Phone,
  Calendar,
  Fuel,
  Wifi,
  WifiOff,
  UserCheck,
  ChevronRight,
  X,
  Gauge
} from 'lucide-react';
import {
  Project,
  CrewResource,
  EquipmentResource,
  ResourceClashAlert,
  ResourceSummaryMetrics,
  WBSLevel,
  Discipline,
  ScheduleActivity
} from '../types.ts';
import { api } from '../api.ts';

interface ResourceAllocationViewProps {
  project: Project;
  onNavigate: (view: string, itemId?: string) => void;
}

export const ResourceAllocationView: React.FC<ResourceAllocationViewProps> = ({
  project,
  onNavigate
}) => {
  const [activeTab, setActiveTab] = useState<'CREWS' | 'EQUIPMENT' | 'CLASHES'>('CREWS');
  const [crews, setCrews] = useState<CrewResource[]>([]);
  const [equipment, setEquipment] = useState<EquipmentResource[]>([]);
  const [clashes, setClashes] = useState<ResourceClashAlert[]>([]);
  const [metrics, setMetrics] = useState<ResourceSummaryMetrics | null>(null);
  const [activities, setActivities] = useState<ScheduleActivity[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>('ALL');
  const [selectedWbsLevel, setSelectedWbsLevel] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedShift, setSelectedShift] = useState<string>('ALL');

  // Re-allocation Modal State
  const [reallocatingResource, setReallocatingResource] = useState<{ type: 'CREW' | 'EQUIPMENT'; item: CrewResource | EquipmentResource } | null>(null);
  const [targetActivityId, setTargetActivityId] = useState<string>('');
  const [targetShift, setTargetShift] = useState<'DAY' | 'NIGHT' | 'SWING'>('DAY');
  const [submittingAssignment, setSubmittingAssignment] = useState<boolean>(false);
  const [assignmentSuccessMsg, setAssignmentSuccessMsg] = useState<string | null>(null);

  // Clash resolution state
  const [resolvingClashId, setResolvingClashId] = useState<string | null>(null);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [crewsData, eqpData, clashData, metricsData, actsData] = await Promise.all([
        api.getCrews(),
        api.getEquipment(),
        api.getResourceClashes(),
        api.getResourceMetrics(),
        api.getActivities(project.id)
      ]);
      setCrews(Array.isArray(crewsData) ? crewsData : []);
      setEquipment(Array.isArray(eqpData) ? eqpData : []);
      setClashes(Array.isArray(clashData) ? clashData : []);
      setMetrics(metricsData || null);
      setActivities(Array.isArray(actsData) ? actsData : []);
    } catch (err) {
      console.error('Failed to load resource data:', err);
      setCrews([]);
      setEquipment([]);
      setClashes([]);
      setActivities([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, [project.id]);

  const handleOpenAssignModal = (type: 'CREW' | 'EQUIPMENT', item: CrewResource | EquipmentResource) => {
    setReallocatingResource({ type, item });
    setTargetActivityId(item.assignedWbsId || (activities[0]?.id || ''));
    if ('shift' in item) {
      setTargetShift(item.shift);
    }
  };

  const handleSaveAssignment = async () => {
    if (!reallocatingResource || !targetActivityId) return;
    const targetAct = activities.find(a => a.id === targetActivityId);
    if (!targetAct) return;

    setSubmittingAssignment(true);
    try {
      if (reallocatingResource.type === 'CREW') {
        await api.assignCrew(reallocatingResource.item.id, {
          activityId: targetAct.id,
          activityName: targetAct.activity_name,
          wbsLevel: targetAct.wbs_level,
          area: targetAct.area,
          shift: targetShift
        });
      } else {
        await api.assignEquipment(reallocatingResource.item.id, {
          activityId: targetAct.id,
          activityName: targetAct.activity_name,
          wbsLevel: targetAct.wbs_level,
          area: targetAct.area
        });
      }

      setAssignmentSuccessMsg(`Successfully reallocated "${reallocatingResource.item.name}" to [${targetAct.wbs_level}] ${targetAct.activity_name}.`);
      setTimeout(() => setAssignmentSuccessMsg(null), 4000);
      setReallocatingResource(null);
      await loadAllData();
    } catch (err: any) {
      alert(`Assignment failed: ${err.message}`);
    } finally {
      setSubmittingAssignment(false);
    }
  };

  const handleResolveClash = async (clash: ResourceClashAlert) => {
    setResolvingClashId(clash.id);
    try {
      await api.resolveClash(clash.id, clash.recommendedAction);
      setAssignmentSuccessMsg(`Conflict on "${clash.resourceName}" resolved and PMIS resource curve leveled.`);
      setTimeout(() => setAssignmentSuccessMsg(null), 4000);
      await loadAllData();
    } catch (err: any) {
      alert(`Resolution error: ${err.message}`);
    } finally {
      setResolvingClashId(null);
    }
  };

  // Filtered Crew list
  const filteredCrews = crews.filter(c => {
    if (selectedDiscipline !== 'ALL' && c.discipline !== selectedDiscipline) return false;
    if (selectedWbsLevel !== 'ALL' && c.assignedWbsLevel !== selectedWbsLevel) return false;
    if (selectedStatus !== 'ALL' && c.status !== selectedStatus) return false;
    if (selectedShift !== 'ALL' && c.shift !== selectedShift) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        c.trade.toLowerCase().includes(q) ||
        c.leadSupervisor.toLowerCase().includes(q) ||
        (c.assignedActivityName && c.assignedActivityName.toLowerCase().includes(q)) ||
        c.assignedArea.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Filtered Equipment list
  const filteredEquipment = equipment.filter(e => {
    if (selectedDiscipline !== 'ALL' && e.discipline !== selectedDiscipline) return false;
    if (selectedWbsLevel !== 'ALL' && e.assignedWbsLevel !== selectedWbsLevel) return false;
    if (selectedStatus !== 'ALL' && e.status !== selectedStatus) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        e.name.toLowerCase().includes(q) ||
        e.code.toLowerCase().includes(q) ||
        e.operatorName.toLowerCase().includes(q) ||
        (e.assignedActivityName && e.assignedActivityName.toLowerCase().includes(q)) ||
        e.assignedArea.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Calculate WBS distribution counts
  const wbsCounts: Record<string, { crews: number; headcount: number; equipment: number }> = {
    'L1': { crews: 0, headcount: 0, equipment: 0 },
    'L2': { crews: 0, headcount: 0, equipment: 0 },
    'L3': { crews: 0, headcount: 0, equipment: 0 },
    'L4': { crews: 0, headcount: 0, equipment: 0 },
    'L5': { crews: 0, headcount: 0, equipment: 0 },
    'L6': { crews: 0, headcount: 0, equipment: 0 },
    'UNASSIGNED': { crews: 0, headcount: 0, equipment: 0 }
  };

  crews.forEach(c => {
    const lvl = c.assignedWbsLevel || 'UNASSIGNED';
    if (wbsCounts[lvl]) {
      wbsCounts[lvl].crews += 1;
      wbsCounts[lvl].headcount += c.headcount;
    }
  });

  equipment.forEach(e => {
    const lvl = e.assignedWbsLevel || 'UNASSIGNED';
    if (wbsCounts[lvl]) {
      wbsCounts[lvl].equipment += 1;
    }
  });

  return (
    <div className="space-y-6">
      
      {/* Toast Banner */}
      {assignmentSuccessMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-between shadow-xs animate-fadeIn">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <div>
              <div className="font-semibold text-sm">Resource Allocation Updated</div>
              <div className="text-xs text-emerald-700">{assignmentSuccessMsg}</div>
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

      {/* Header Overview Card */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
              <Users className="w-4 h-4" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Resource Allocation & WBS Matrix</h1>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              Live Telemetry
            </span>
          </div>
          <p className="text-xs text-slate-500 max-w-2xl">
            Track crew headcounts, trade skill certifications, heavy equipment plant telemetry, and overallocation conflicts across L1–L6 WBS nodes.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => handleOpenAssignModal('CREW', crews[0])}
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-2 shadow-xs transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Quick Assign Resource</span>
          </button>
          <button
            onClick={loadAllData}
            title="Refresh All Resources"
            className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Easy Understanding Callout Banner */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-50 to-indigo-50/50 border border-emerald-200/80 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-emerald-200/60 text-emerald-900 font-bold flex items-center justify-center flex-shrink-0 text-sm">
            💡
          </div>
          <div>
            <div className="font-bold text-slate-900 text-xs">
              Quick Guide: Crews, Equipment & Conflict Resolution
            </div>
            <p className="text-[11px] text-slate-600 mt-0.5">
              <strong>Crews</strong> are worker teams (e.g. Master Welders, Electricians), <strong>Equipment</strong> are heavy machines (e.g. 500T Cranes, Hydrostatic Rigs), and <strong>Clashes</strong> alert you if a crane or team is accidentally double-booked for two different tasks at the same time.
            </p>
          </div>
        </div>
      </div>

      {/* 4 Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Workforce Headcount */}
        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Total Site Workforce</span>
            <div className="w-7 h-7 rounded-md bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Users className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono">
            {metrics ? metrics.deployedHeadcount : 115} <span className="text-xs text-slate-400 font-normal">/ {metrics ? metrics.totalHeadcount : 147} active</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-indigo-600 h-full rounded-full"
              style={{ width: `${metrics ? Math.round((metrics.deployedHeadcount / metrics.totalHeadcount) * 100) : 78}%` }}
            />
          </div>
          <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1">
            <span>{metrics ? metrics.activeCrews : 8} of {metrics ? metrics.totalCrews : 10} Crews Deployed</span>
            <span className="font-semibold text-indigo-600">
              {metrics ? Math.round((metrics.deployedHeadcount / metrics.totalHeadcount) * 100) : 78}% Utilized
            </span>
          </div>
        </div>

        {/* Equipment Fleet Status */}
        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Equipment Fleet</span>
            <div className="w-7 h-7 rounded-md bg-sky-50 text-sky-600 flex items-center justify-center">
              <Truck className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono">
            {metrics ? metrics.operationalEquipment : 6} <span className="text-xs text-slate-400 font-normal">/ {metrics ? metrics.totalEquipment : 8} Operational</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-sky-500 h-full rounded-full"
              style={{ width: `${metrics ? metrics.averageEquipmentUtilization : 75}%` }}
            />
          </div>
          <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1">
            <span>Avg Fleet Utilization</span>
            <span className="font-semibold text-sky-600">{metrics ? metrics.averageEquipmentUtilization : 75}%</span>
          </div>
        </div>

        {/* Resource Clashes & Overallocations */}
        <div 
          onClick={() => setActiveTab('CLASHES')}
          className="p-5 rounded-xl bg-white hover:bg-slate-50/80 border border-slate-200 hover:border-slate-300 transition-all cursor-pointer group shadow-sm space-y-2"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Resource Clashes</span>
            <div className="w-7 h-7 rounded-md bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-rose-600 font-mono flex items-center gap-2">
            <span>{clashes.length} Active</span>
            {clashes.some(c => c.severity === 'HIGH') && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200 animate-pulse">
                High Risk
              </span>
            )}
          </div>
          <div className="text-[11px] text-slate-500 flex items-center justify-between pt-2 border-t border-slate-100">
            <span>Critical lift & welder bottlenecks</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>

        {/* Institutional EPC Buffer Score */}
        <div 
          onClick={() => onNavigate('memory')}
          className="p-5 rounded-xl bg-white hover:bg-slate-50/80 border border-slate-200 hover:border-slate-300 transition-all cursor-pointer group shadow-sm space-y-2"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>EPC Productivity Index</span>
            <div className="w-7 h-7 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Gauge className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-600 font-mono">
            93.8 <span className="text-xs text-slate-400 font-normal">/ 100 benchmark</span>
          </div>
          <div className="text-[11px] text-slate-500 flex items-center justify-between pt-2 border-t border-slate-100">
            <span>Calibrated with Historical EPC Memory</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>

      </div>

      {/* WBS Level Resource Distribution Breakdown */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600" />
              <span>WBS Level Deployment Hierarchy (L1 Enterprise → L6 Granular Field Activity)</span>
            </h2>
            <p className="text-[11px] text-slate-500">Distribution of human gangs and heavy machinery across Primavera P6 WBS levels</p>
          </div>
          <span className="text-xs font-mono text-slate-400">P6 Baseline Schedule Sync</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {(['L1', 'L2', 'L3', 'L4', 'L5', 'L6'] as WBSLevel[]).map(lvl => {
            const data = wbsCounts[lvl] || { crews: 0, headcount: 0, equipment: 0 };
            const isSelected = selectedWbsLevel === lvl;

            return (
              <div
                key={lvl}
                onClick={() => setSelectedWbsLevel(isSelected ? 'ALL' : lvl)}
                className={`p-3.5 rounded-lg border text-center transition-all cursor-pointer ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-50/40 ring-2 ring-indigo-500/20'
                    : 'border-slate-200 hover:border-slate-300 bg-slate-50/50 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-mono font-bold px-1.5 py-0.5 rounded bg-slate-200/80 text-slate-800">
                    {lvl}
                  </span>
                  <span className="text-[10px] text-slate-400 font-semibold uppercase">
                    {lvl === 'L1' ? 'Project' : lvl === 'L2' ? 'Subproject' : lvl === 'L3' ? 'Facility' : lvl === 'L4' ? 'Discipline' : lvl === 'L5' ? 'Work Pack' : 'Field Act'}
                  </span>
                </div>
                
                <div className="text-lg font-bold font-mono text-slate-900 mt-2">
                  {data.headcount} <span className="text-[11px] font-normal text-slate-500">pax</span>
                </div>
                <div className="text-[11px] text-slate-500 flex items-center justify-center gap-2 mt-1">
                  <span>{data.crews} crews</span>
                  <span>•</span>
                  <span>{data.equipment} eqp</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Clash Alert Callout if any */}
      {clashes.length > 0 && activeTab !== 'CLASHES' && (
        <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-700 flex-shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-amber-900 flex items-center gap-2">
                <span>{clashes.length} Active Resource Conflicts Detected by SitePulse AI</span>
                <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-rose-600 text-white">Action Required</span>
              </div>
              <p className="text-[11px] text-amber-800 mt-0.5">
                Dual allocation on 500T crane and welder headcount deficit identified on Critical Path activities.
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('CLASHES')}
            className="px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold flex items-center gap-1.5 self-start md:self-center transition-colors shadow-xs"
          >
            <span>Review & Level Clashes</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Tabs & Controls */}
      <div className="space-y-4">
        
        {/* Tab Selector */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('CREWS')}
              className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${
                activeTab === 'CREWS'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Crew Workforces ({crews.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('EQUIPMENT')}
              className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${
                activeTab === 'EQUIPMENT'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Truck className="w-4 h-4" />
              <span>Heavy Equipment & Plant ({equipment.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('CLASHES')}
              className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${
                activeTab === 'CLASHES'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
              <span>Resource Conflict Radar ({clashes.length})</span>
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500">
            <span>WBS Filter: <strong className="text-slate-800 font-mono">{selectedWbsLevel}</strong></span>
            {selectedWbsLevel !== 'ALL' && (
              <button
                onClick={() => setSelectedWbsLevel('ALL')}
                className="text-indigo-600 hover:underline font-semibold"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Filter Bar (for Crews & Equipment) */}
        {activeTab !== 'CLASHES' && (
          <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={activeTab === 'CREWS' ? 'Search crew, supervisor, trade, activity...' : 'Search crane, equipment code, operator...'}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Dropdown Filters */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Discipline Filter */}
              <select
                value={selectedDiscipline}
                onChange={(e) => setSelectedDiscipline(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="ALL">All Disciplines</option>
                <option value="PIPING">Piping</option>
                <option value="CIVIL">Civil</option>
                <option value="ELECTRICAL">Electrical</option>
                <option value="STATIC_EQUIPMENT">Static Equipment</option>
                <option value="INSTRUMENTATION">Instrumentation</option>
                <option value="HSE">HSE</option>
              </select>

              {/* Status Filter */}
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="ALL">All Statuses</option>
                {activeTab === 'CREWS' ? (
                  <>
                    <option value="DEPLOYED">Deployed</option>
                    <option value="AVAILABLE">Available</option>
                    <option value="OVERALLOCATED">Overallocated</option>
                  </>
                ) : (
                  <>
                    <option value="OPERATIONAL">Operational</option>
                    <option value="STANDBY">Standby</option>
                    <option value="IN_MAINTENANCE">In Maintenance</option>
                  </>
                )}
              </select>

              {/* Shift Filter (for Crews) */}
              {activeTab === 'CREWS' && (
                <select
                  value={selectedShift}
                  onChange={(e) => setSelectedShift(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="ALL">All Shifts</option>
                  <option value="DAY">Day Shift</option>
                  <option value="NIGHT">Night Shift</option>
                  <option value="SWING">Swing Shift</option>
                </select>
              )}

              {/* Reset Filters */}
              {(searchTerm || selectedDiscipline !== 'ALL' || selectedStatus !== 'ALL' || selectedShift !== 'ALL' || selectedWbsLevel !== 'ALL') && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedDiscipline('ALL');
                    setSelectedStatus('ALL');
                    setSelectedShift('ALL');
                    setSelectedWbsLevel('ALL');
                  }}
                  className="px-2 py-1 text-xs text-slate-500 hover:text-slate-800 underline"
                >
                  Reset
                </button>
              )}
            </div>
          </div>
        )}

      </div>

      {/* Tab 1: Crew Workforces Grid */}
      {activeTab === 'CREWS' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredCrews.length === 0 ? (
            <div className="col-span-full p-8 text-center bg-white rounded-xl border border-slate-200 text-slate-500">
              <Users className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <div className="text-sm font-semibold text-slate-800">No crews found matching filter criteria</div>
              <p className="text-xs text-slate-400 mt-1">Try resetting the discipline, shift, or WBS level filter.</p>
            </div>
          ) : (
            filteredCrews.map(crew => (
              <div
                key={crew.id}
                className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm space-y-4 hover:border-slate-300 transition-all flex flex-col justify-between"
              >
                <div className="space-y-2.5">
                  {/* Top Bar */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                          {crew.assignedWbsLevel || 'UNASSIGNED'}
                        </span>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          {crew.discipline}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          crew.status === 'DEPLOYED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : crew.status === 'OVERALLOCATED'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200 animate-pulse'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}>
                          {crew.status}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                          {crew.shift} SHIFT
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-slate-900 mt-1.5">{crew.name}</h3>
                      <p className="text-xs text-slate-500 font-medium">{crew.trade}</p>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <div className="text-lg font-bold font-mono text-slate-900">
                        {crew.availableCount} / {crew.headcount}
                      </div>
                      <div className="text-[10px] text-slate-400 font-semibold uppercase">Headcount</div>
                    </div>
                  </div>

                  {/* Assigned Activity Block */}
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80 space-y-1 text-xs">
                    <div className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider flex items-center justify-between">
                      <span>Assigned WBS Scope</span>
                      <span className="text-slate-400 font-normal">{crew.assignedArea}</span>
                    </div>
                    <div className="font-semibold text-slate-800">
                      {crew.assignedActivityName || 'Standby / Available in Yard'}
                    </div>
                  </div>

                  {/* Supervisor & Certifications */}
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between text-slate-600">
                      <span className="flex items-center gap-1.5">
                        <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Lead: <strong className="text-slate-800">{crew.leadSupervisor}</strong></span>
                      </span>
                      {crew.contactPhone && (
                        <span className="text-[11px] font-mono text-slate-500 flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{crew.contactPhone}</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">Certs:</span>
                      {(crew.certifications || []).map((c, i) => (
                        <span key={i} className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white text-slate-700 border border-slate-200">
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-slate-500">Productivity:</span>
                    <span className="font-mono font-bold text-emerald-600">{crew.productivityScore}%</span>
                  </div>

                  <button
                    onClick={() => handleOpenAssignModal('CREW', crew)}
                    className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold flex items-center gap-1 transition-colors shadow-2xs"
                  >
                    <Wrench className="w-3.5 h-3.5" />
                    <span>Reallocate Scope</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 2: Equipment Fleet Grid */}
      {activeTab === 'EQUIPMENT' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredEquipment.length === 0 ? (
            <div className="col-span-full p-8 text-center bg-white rounded-xl border border-slate-200 text-slate-500">
              <Truck className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <div className="text-sm font-semibold text-slate-800">No equipment found matching filter criteria</div>
            </div>
          ) : (
            filteredEquipment.map(eqp => (
              <div
                key={eqp.id}
                className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm space-y-4 hover:border-slate-300 transition-all flex flex-col justify-between"
              >
                <div className="space-y-2.5">
                  {/* Top Bar */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                          {eqp.code}
                        </span>
                        <span className="text-xs font-mono px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-semibold border border-indigo-200">
                          {eqp.assignedWbsLevel || 'UNASSIGNED'}
                        </span>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          {eqp.discipline}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          eqp.status === 'OPERATIONAL'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : eqp.status === 'IN_MAINTENANCE'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {eqp.status}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-slate-900 mt-1.5">{eqp.name}</h3>
                      <p className="text-xs text-slate-500 font-medium">Category: {eqp.category.replace('_', ' ')}</p>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <div className="text-lg font-bold font-mono text-sky-600">
                        {eqp.utilizationRate}%
                      </div>
                      <div className="text-[10px] text-slate-400 font-semibold uppercase">Utilization</div>
                    </div>
                  </div>

                  {/* Assigned Activity Block */}
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80 space-y-1 text-xs">
                    <div className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider flex items-center justify-between">
                      <span>Deployment Site</span>
                      <span className="text-slate-400 font-normal">{eqp.assignedArea}</span>
                    </div>
                    <div className="font-semibold text-slate-800">
                      {eqp.assignedActivityName || 'Standby Yard Storage'}
                    </div>
                  </div>

                  {/* Telemetry Strip */}
                  <div className="grid grid-cols-3 gap-2 bg-slate-50/50 p-2.5 rounded-lg border border-slate-200/60 text-xs">
                    <div>
                      <div className="text-[10px] text-slate-400 font-semibold uppercase">Operator</div>
                      <div className="font-semibold text-slate-800 truncate">{eqp.operatorName}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 font-semibold uppercase flex items-center gap-1">
                        <Fuel className="w-3 h-3 text-amber-500" />
                        <span>Fuel Level</span>
                      </div>
                      <div className="font-mono font-bold text-slate-800">{eqp.fuelLevel}%</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 font-semibold uppercase flex items-center gap-1">
                        {eqp.telemetryStatus === 'CONNECTED' ? (
                          <Wifi className="w-3 h-3 text-emerald-500" />
                        ) : (
                          <WifiOff className="w-3 h-3 text-rose-500" />
                        )}
                        <span>Telematics</span>
                      </div>
                      <div className="font-mono text-[11px] font-semibold text-slate-800">{eqp.telemetryStatus}</div>
                    </div>
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                  <div className="flex items-center gap-2 text-slate-500 text-[11px]">
                    <span>Rate: <strong className="font-mono text-slate-700">${eqp.hourlyBurnRate}/hr</strong></span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      {eqp.safetyCertValid ? (
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                      )}
                      <span>Cert {eqp.safetyCertValid ? 'Valid' : 'Expired'}</span>
                    </span>
                  </div>

                  <button
                    onClick={() => handleOpenAssignModal('EQUIPMENT', eqp)}
                    className="px-3 py-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 text-xs font-semibold flex items-center gap-1 transition-colors shadow-2xs"
                  >
                    <Wrench className="w-3.5 h-3.5" />
                    <span>Reassign Plant</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 3: Resource Conflict Radar */}
      {activeTab === 'CLASHES' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <span>Critical Resource Clashes & Double-Booking Warnings</span>
                </h2>
                <p className="text-xs text-slate-500">Autonomous collision detection across concurrent WBS activities</p>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                {clashes.length} Active Collisions
              </span>
            </div>

            {clashes.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <div className="text-sm font-semibold text-slate-800">No Resource Clashes Detected</div>
                <p className="text-xs text-slate-500 mt-1">All cranes, crews, and specialized rigs are leveled across the project schedule.</p>
              </div>
            ) : (
              <div className="space-y-3.5">
                {clashes.map(clash => (
                  <div
                    key={clash.id}
                    className="p-4 rounded-xl bg-rose-50/20 border border-rose-200 space-y-3 shadow-xs"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                            clash.severity === 'HIGH'
                              ? 'bg-rose-600 text-white animate-pulse'
                              : 'bg-amber-600 text-white'
                          }`}>
                            {clash.severity} SEVERITY
                          </span>
                          <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-white text-slate-800 border border-slate-200">
                            {clash.wbsLevel}
                          </span>
                          <span className="text-xs font-semibold text-slate-800 font-mono">
                            {clash.resourceName}
                          </span>
                        </div>
                        <h3 className="text-sm font-bold text-slate-900">{clash.title}</h3>
                      </div>

                      <div className="flex items-center gap-2 self-start md:self-center">
                        <button
                          onClick={() => handleResolveClash(clash)}
                          disabled={resolvingClashId === clash.id}
                          className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all active:scale-95"
                        >
                          {resolvingClashId === clash.id ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Zap className="w-3.5 h-3.5" />
                          )}
                          <span>Auto-Level in PMIS</span>
                        </button>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed bg-white p-3 rounded-lg border border-rose-100">
                      {clash.description}
                    </p>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-emerald-50/60 p-3 rounded-lg border border-emerald-200 text-xs">
                      <div className="text-emerald-900">
                        <strong className="font-semibold">AI Recommended Action: </strong>
                        <span>{clash.recommendedAction}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Re-allocation Modal / Drawer */}
      {reallocatingResource && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-lg p-6 space-y-5 shadow-2xl animate-scaleUp">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
                  <Wrench className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Reallocate Resource Scope</h3>
                  <p className="text-[11px] text-slate-500">Assign to WBS Activity and update Primavera P6 resource curves</p>
                </div>
              </div>
              <button
                onClick={() => setReallocatingResource(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Target Resource Summary */}
            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900">{reallocatingResource.item.name}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-semibold border border-indigo-200">
                  {reallocatingResource.type}
                </span>
              </div>
              <div className="text-slate-500 flex items-center gap-3">
                <span>Discipline: <strong>{reallocatingResource.item.discipline}</strong></span>
                <span>•</span>
                <span>Current: <strong>{reallocatingResource.item.assignedActivityName || 'Unassigned'}</strong></span>
              </div>
            </div>

            {/* Selection Form */}
            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Select Target WBS Activity (L1 - L6)
                </label>
                <select
                  value={targetActivityId}
                  onChange={(e) => setTargetActivityId(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  {activities.map(act => (
                    <option key={act.id} value={act.id}>
                      [{act.wbs_level}] {act.activity_id} - {act.activity_name} ({act.area})
                    </option>
                  ))}
                </select>
              </div>

              {reallocatingResource.type === 'CREW' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Target Shift Allocation
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['DAY', 'NIGHT', 'SWING'] as const).map(sh => (
                      <button
                        key={sh}
                        type="button"
                        onClick={() => setTargetShift(sh)}
                        className={`py-2 rounded-lg text-xs font-semibold border transition-all ${
                          targetShift === sh
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {sh} SHIFT
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setReallocatingResource(null)}
                className="px-4 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveAssignment}
                disabled={submittingAssignment}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all active:scale-95 disabled:opacity-50"
              >
                {submittingAssignment ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                )}
                <span>Confirm & Level in PMIS</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
