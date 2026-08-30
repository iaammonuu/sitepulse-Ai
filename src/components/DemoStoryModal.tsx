import React, { useState } from 'react';
import {
  PlayCircle,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Sparkles,
  Layers,
  FileSpreadsheet,
  GitPullRequest,
  Network,
  HardHat,
  BarChart3,
  Brain,
  MessageSquareCode,
  ShieldCheck,
  X,
  ArrowRight
} from 'lucide-react';

interface DemoStoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (view: string, itemId?: string) => void;
}

export const DemoStoryModal: React.FC<DemoStoryModalProps> = ({
  isOpen,
  onClose,
  onNavigate
}) => {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const steps = [
    {
      title: 'Step 1: Baseline Schedule WBS Structure',
      tag: 'SCHEDULE INGESTION',
      view: 'schedule',
      icon: Network,
      color: 'text-indigo-600',
      description: 'SitePulse AI starts by loading the Primavera P6 enterprise schedule with a 6-level WBS (L1 Enterprise → L6 Granular Field Activity). Every planned date, unit quantity, and critical path flag is preserved.',
      actionLabel: 'Explore Schedule WBS'
    },
    {
      title: 'Step 2: Unstructured Field Document Ingestion',
      tag: 'DOCUMENT INGESTION',
      view: 'ingestion',
      icon: FileSpreadsheet,
      color: 'text-sky-600',
      description: 'Daily Progress Reports (PDF), Welder Inspection Logs (XLSX), and shift supervisor memos are ingested without requiring manual data entry forms.',
      actionLabel: 'View Ingestion Queue'
    },
    {
      title: 'Step 3: AI Event Extraction Engine',
      tag: 'NLP EXTRACTION',
      view: 'ingestion',
      icon: Sparkles,
      color: 'text-indigo-600',
      description: 'The engine parses unstructured field narratives into structured execution events (Activity Name, Event Type, Quantity, Unit, Area, Discipline, and Verbatim Evidence Snippet).',
      actionLabel: 'Inspect Parsed Events'
    },
    {
      title: 'Step 4: Multi-Factor Semantic Matching',
      tag: 'HYBRID MATCHER',
      view: 'review',
      icon: GitPullRequest,
      color: 'text-amber-600',
      description: 'A 5-factor scoring model ranks schedule candidates using Text Embeddings (40%), Lexical Tokens (25%), Discipline Matrix (15%), Spatial Area (10%), and Predecessor Context (10%).',
      actionLabel: 'Open Review Queue'
    },
    {
      title: 'Step 5: Planner Verification & Approval',
      tag: 'HUMAN-IN-THE-LOOP',
      view: 'review',
      icon: CheckCircle2,
      color: 'text-emerald-600',
      description: 'Planners review match candidates. Clicking "Approve" records actual start/finish dates, computes progress %, updates WBS rollups, and logs an immutable audit entry.',
      actionLabel: 'Try Match Approval'
    },
    {
      title: 'Step 6: Planner Match Re-Mapping (Change)',
      tag: 'GOVERNANCE',
      view: 'review',
      icon: GitPullRequest,
      color: 'text-sky-600',
      description: 'If a match requires adjustment, planners can select any L5/L6 activity from the project and provide an audit justification reason.',
      actionLabel: 'Test Change Match'
    },
    {
      title: 'Step 7: Propose New Activity (Scope MOC)',
      tag: 'MOC WORKFLOW',
      view: 'review',
      icon: Layers,
      color: 'text-amber-600',
      description: 'When field scope is not present in the baseline schedule, planners can propose a new activity without corrupting or directly altering baseline schedules.',
      actionLabel: 'View Proposal Workflow'
    },
    {
      title: 'Step 8: Dynamic Dashboard KPI Actualization',
      tag: 'REAL-TIME DASHBOARD',
      view: 'dashboard',
      icon: Layers,
      color: 'text-emerald-600',
      description: 'Approved verifications immediately propagate to Total Activities, Schedule Progress %, Pending Verification counters, and Recent Ingestion telemetry.',
      actionLabel: 'View Executive Dashboard'
    },
    {
      title: 'Step 9: Time Agent Conversational Logging',
      tag: 'FIELD ASSISTANT',
      view: 'time-agent',
      icon: MessageSquareCode,
      color: 'text-indigo-600',
      description: 'Site supervisors report field progress via natural chat (e.g. "Line 24 welding started at 10:30 in Area B"). The agent extracts structured attributes and provides instant confirmation cards.',
      actionLabel: 'Chat with Time Agent'
    },
    {
      title: 'Step 10: Progress & AI Matching Analytics',
      tag: 'ANALYTICS',
      view: 'analytics',
      icon: BarChart3,
      color: 'text-indigo-600',
      description: 'Discipline-wise progress bars (Civil, Piping, Electrical, HSE) and AI confidence histograms provide comprehensive visibility into matching performance.',
      actionLabel: 'View Progress Analytics'
    },
    {
      title: 'Step 11: Crew & Heavy Equipment Resource Tracking',
      tag: 'RESOURCE ALLOCATION',
      view: 'resources',
      icon: HardHat,
      color: 'text-indigo-600',
      description: 'Track trade crew headcounts, heavy crane & equipment telemetry, and resolve critical path over-allocations across WBS levels L1 through L6.',
      actionLabel: 'Explore Resource Allocation'
    },
    {
      title: 'Step 12: Institutional Memory & Historical Benchmarks',
      tag: 'EPC BENCHMARKS',
      view: 'memory',
      icon: Brain,
      color: 'text-indigo-600',
      description: 'Empirical cross-project duration statistics and AI buffer recommendations identify recurring turnaround and construction risks.',
      actionLabel: 'View Institutional Memory'
    },
    {
      title: 'Step 13: Immutable Governance Audit Trail',
      tag: 'AUDIT & COMPLIANCE',
      view: 'audit',
      icon: ShieldCheck,
      color: 'text-emerald-600',
      description: 'Every AI decision, planner verification, user role switch, and PMIS dispatch is recorded with timestamps, user identities, and entity refs.',
      actionLabel: 'Inspect Audit Trail'
    }
  ];

  const current = steps[currentStep];
  const Icon = current.icon;

  const handleGoToView = () => {
    onNavigate(current.view);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white border border-slate-200 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6 shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
              <PlayCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Interactive Guided Demo Walkthrough</h2>
              <p className="text-[11px] text-slate-500">Step {currentStep + 1} of {steps.length}: <span className="font-semibold text-indigo-600">{current.tag}</span></p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Body */}
        <div className="p-5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
          <div className="flex items-center gap-2">
            <Icon className={`w-5 h-5 ${current.color}`} />
            <h3 className="text-base font-bold text-slate-900">{current.title}</h3>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            {current.description}
          </p>
        </div>

        {/* Progress Dots */}
        <div className="flex items-center justify-center gap-1.5 py-1">
          {steps.map((s, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentStep(idx)}
              className={`h-2 rounded-full transition-all ${
                currentStep === idx
                  ? 'w-6 bg-indigo-600'
                  : 'w-2 bg-slate-200 hover:bg-slate-300'
              }`}
              title={s.title}
            />
          ))}
        </div>

        {/* Footer Navigation Controls */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <button
            onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
            disabled={currentStep === 0}
            className="px-3.5 py-2 rounded-lg bg-white border border-slate-200 disabled:opacity-40 text-slate-700 hover:bg-slate-50 text-xs font-medium flex items-center gap-1 shadow-xs"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>

          <button
            onClick={handleGoToView}
            className="px-4 py-2 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs"
          >
            <span>{current.actionLabel}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          {currentStep < steps.length - 1 ? (
            <button
              onClick={() => setCurrentStep(prev => Math.min(steps.length - 1, prev + 1))}
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm flex items-center gap-1 active:scale-95 transition-all"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm active:scale-95 transition-all"
            >
              Finish Tour
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
