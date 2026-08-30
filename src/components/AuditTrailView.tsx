import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  User,
  ExternalLink,
  Layers,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { Project, AuditLog } from '../types.ts';

interface AuditTrailViewProps {
  project: Project;
  auditLogs: AuditLog[];
}

export const AuditTrailView: React.FC<AuditTrailViewProps> = ({
  project,
  auditLogs = []
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [userFilter, setUserFilter] = useState<string>('ALL');
  const [actionFilter, setActionFilter] = useState<string>('ALL');

  const safeLogs = auditLogs || [];

  const users = useMemo(() => {
    const set = new Set(safeLogs.map(a => a.user));
    return Array.from(set);
  }, [safeLogs]);

  const actions = useMemo(() => {
    const set = new Set(safeLogs.map(a => a.action));
    return Array.from(set);
  }, [safeLogs]);

  const filteredLogs = useMemo(() => {
    return safeLogs.filter(log => {
      if (userFilter !== 'ALL' && log.user !== userFilter) return false;
      if (actionFilter !== 'ALL' && log.action !== actionFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        if (!log.details.toLowerCase().includes(q) &&
            !log.action.toLowerCase().includes(q) &&
            !log.entityId.toLowerCase().includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [safeLogs, userFilter, actionFilter, searchQuery]);

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-600" />
            <span>Immutable Governance Audit Trail</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Complete audit trail of all AI extractions, planner verifications, re-mappings, and PMIS transactions.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-mono font-semibold">
            {auditLogs.length} Total Audit Records
          </div>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search action, activity ID, or details..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg bg-white border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-sm"
          />
        </div>

        <div>
          <select
            value={userFilter}
            onChange={(e) => setUserFilter(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-lg bg-white border border-slate-200 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-sm"
          >
            <option value="ALL">All Actors / Users</option>
            {users.map(u => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-lg bg-white border border-slate-200 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-sm"
          >
            <option value="ALL">All Action Types</option>
            {actions.map(a => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Actor / User</th>
                <th className="py-3 px-4">Entity Ref</th>
                <th className="py-3 px-4">Audit Details</th>
                <th className="py-3 px-4">PMIS Dispatch</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.map(log => {
                return (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                      {log.timestamp.replace('T', ' ').substring(0, 19)}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                        log.action.includes('APPROVED') ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        log.action.includes('REJECTED') ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                        log.action.includes('CHANGED') ? 'bg-sky-50 text-sky-700 border border-sky-200' :
                        log.action.includes('PMIS') ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' :
                        'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}>
                        {log.action}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-slate-800 font-medium whitespace-nowrap">
                      {log.user}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">
                      {log.entityId}
                    </td>

                    <td className="py-3.5 px-4 text-slate-700 max-w-md">
                      {log.details}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="text-[10px] font-mono font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        DEMO PMIS SYNCED
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
