import React from 'react';
import {
  Users,
  Shield,
  CheckCircle2,
  Mail,
  UserCheck,
  Sparkles
} from 'lucide-react';
import { UserProfile } from '../types.ts';

interface TeamSettingsViewProps {
  users: UserProfile[];
  currentUser: UserProfile | null;
  onSelectUser: (userId: string) => void;
}

export const TeamSettingsView: React.FC<TeamSettingsViewProps> = ({
  users = [],
  currentUser,
  onSelectUser
}) => {
  const safeUsers = users || [];

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            <span>Team Roles & Governance Permissions</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure role-based access control (RBAC) for planning verifications, PMIS commit authorizations, and field reports.
          </p>
        </div>
      </div>

      {/* Users Roster */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="text-xs font-semibold uppercase text-slate-500">Team Members ({safeUsers.length})</span>
          <span className="text-xs text-indigo-600 font-medium">Click "Switch to Role" to simulate as that user</span>
        </div>

        <div className="divide-y divide-slate-100">
          {safeUsers.map(u => {
            const isCurrent = currentUser?.id === u.id;
            return (
              <div
                key={u.id}
                className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
                  isCurrent ? 'bg-indigo-50/50 border-l-4 border-indigo-600' : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700">
                    {u.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">{u.name}</span>
                      {isCurrent && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                          Active Persona
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span>{u.email}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-700">
                      {u.role}
                    </span>
                  </div>

                  {!isCurrent && (
                    <button
                      onClick={() => onSelectUser(u.id)}
                      className="px-3 py-1.5 rounded-lg bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 text-slate-700 hover:text-indigo-600 text-xs font-medium transition-all shadow-xs"
                    >
                      Switch to Role
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
