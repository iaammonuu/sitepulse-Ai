import React, { useState } from 'react';
import {
  BookOpen,
  X,
  Search,
  HelpCircle,
  Sparkles,
  Layers,
  Activity,
  HardHat,
  Truck,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowRight
} from 'lucide-react';

interface PlainEnglishGlossaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (view: string) => void;
}

interface GlossaryItem {
  term: string;
  category: 'Core Concepts' | 'Schedule & WBS' | 'Field & Engineering' | 'AI & Verification';
  shortSummary: string;
  simpleAnalogy: string;
  whyItMatters: string;
  example: string;
  relatedView?: string;
}

const GLOSSARY_ITEMS: GlossaryItem[] = [
  {
    term: 'WBS (Work Breakdown Structure L1 to L6)',
    category: 'Schedule & WBS',
    shortSummary: 'A family tree for project tasks, from the big mega-project down to individual daily jobs.',
    simpleAnalogy: 'Think of building a house: L1 is the whole house, L3 is the bathroom, and L6 is tightening a single water pipe screw.',
    whyItMatters: 'It organizes thousands of construction steps so managers know exactly who is doing what each hour.',
    example: 'L1: Propylene Expansion → L4: Piping Works → L6: Golden Joint Weld 24" Pipe.',
    relatedView: 'activities'
  },
  {
    term: 'Critical Path',
    category: 'Schedule & WBS',
    shortSummary: 'The essential chain of tasks that directly decides the final completion date of the project.',
    simpleAnalogy: 'If you are baking a cake, you cannot frost it until it finishes baking. Baking is on the critical path; picking the sprinkles can wait.',
    whyItMatters: 'If any task on the critical path is delayed by even 1 day, the entire multimillion-dollar project finishes 1 day late.',
    example: 'Erecting the 500-ton Heavy Distillation Column before connecting the steam pipes.',
    relatedView: 'schedule'
  },
  {
    term: 'Float (or Schedule Buffer)',
    category: 'Schedule & WBS',
    shortSummary: 'The amount of extra breathing room or buffer days an activity has before it delays the project.',
    simpleAnalogy: 'Leaving 30 minutes early for a flight: you have 30 minutes of "float" to deal with traffic before missing the plane.',
    whyItMatters: 'Tasks with zero float must be watched closely; tasks with high float can safely absorb minor weather delays.',
    example: 'Painting warehouse railings has +14 days float; High-Pressure Steam testing has 0 days float.',
    relatedView: 'analytics'
  },
  {
    term: 'NDT (Non-Destructive Testing)',
    category: 'Field & Engineering',
    shortSummary: 'Inspecting welds and steel structures using X-rays, ultrasound, or dye without damaging them.',
    simpleAnalogy: 'Like a hospital doctor taking an X-ray of a broken bone to check healing without surgery.',
    whyItMatters: 'High-pressure chemical pipes carry dangerous gas at high heat; testing ensures zero leaks before startup.',
    example: 'Radiographic testing (RT) verifying 100% volumetric pass rate on HP steam golden joints.',
    relatedView: 'ingestion'
  },
  {
    term: 'Golden Joint',
    category: 'Field & Engineering',
    shortSummary: 'The final critical tie-in pipe weld that joins two major sections of an industrial plant together.',
    simpleAnalogy: 'The final golden spike placed when connecting two coast-to-coast railway tracks.',
    whyItMatters: 'Because it cannot easily be hydrostatic pressure-tested in a workshop, it requires top-tier master welders and 100% NDT inspection.',
    example: 'Golden Joint Weld on 24-inch high pressure steam header connecting Boiler to Turbine.',
    relatedView: 'activities'
  },
  {
    term: 'AI Evidence Matching & Actualization',
    category: 'AI & Verification',
    shortSummary: 'SitePulse AI reads field documents (PDF reports, photos, drone surveys) and matches them to project schedule tasks.',
    simpleAnalogy: 'Like receipt scanner apps that automatically balance your monthly bank budget without manual typing.',
    whyItMatters: 'Engineers used to spend 15+ hours a week manually typing reports into spreadsheets; AI does it in seconds with verified proof.',
    example: 'Reading a daily welding inspector sheet and automatically updating activity L6-PIP-003 to 42% complete.',
    relatedView: 'matching'
  },
  {
    term: 'Resource Clash / Over-Allocation',
    category: 'Core Concepts',
    shortSummary: 'When the same crane, tool, or certified worker crew is accidentally scheduled for two jobs at the exact same time.',
    simpleAnalogy: 'Two family members booking the same car at 2:00 PM on Friday.',
    whyItMatters: 'Caught early, schedules can be adjusted. Caught on site, 50 workers stand idle waiting for a crane.',
    example: 'The 500-ton Liebherr crane needed simultaneously for Column Erection and Valve Skid installation.',
    relatedView: 'resources'
  },
  {
    term: 'PMIS & Primavera P6 Sync',
    category: 'Core Concepts',
    shortSummary: 'The master digital schedule and project management system used by engineering leadership.',
    simpleAnalogy: 'The master air-traffic control computer tracking all planes in flight.',
    whyItMatters: 'SitePulse AI automatically synchronizes verified field progress into Primavera P6 so executives see real-time truth.',
    example: 'Approved inspection approvals automatically push updated % progress into the official client schedule.',
    relatedView: 'audit'
  },
  {
    term: 'Institutional Memory & Benchmarks',
    category: 'AI & Verification',
    shortSummary: 'AI memory of past construction projects to predict how fast work will realistically get done.',
    simpleAnalogy: 'An experienced master foreman who remembers that "welding thick alloy pipes always takes 2 days longer when it rains".',
    whyItMatters: 'Prevents optimistic contractor schedules from masking realistic delivery delays.',
    example: 'Benchmarking 45-meter column heavy lifts against 12 historical petrochemical refinery projects.',
    relatedView: 'memory'
  },
  {
    term: 'Time Agent Chat',
    category: 'AI & Verification',
    shortSummary: 'A smart voice/text AI assistant where engineers and site supervisors can ask anything or report progress in plain words.',
    simpleAnalogy: 'Siri or ChatGPT, but specially trained on construction engineering, schedules, and safety rules.',
    whyItMatters: 'Allows anyone on site to say "We finished 40 meters of trenching today" and let AI handle the database entry.',
    example: 'Asking: "Which activities are currently delaying the critical path in Area B?"',
    relatedView: 'time-agent'
  }
];

export const PlainEnglishGlossaryModal: React.FC<PlainEnglishGlossaryModalProps> = ({
  isOpen,
  onClose,
  onNavigate
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  if (!isOpen) return null;

  const categories = ['ALL', 'Core Concepts', 'Schedule & WBS', 'Field & Engineering', 'AI & Verification'];

  const filteredItems = GLOSSARY_ITEMS.filter(item => {
    if (selectedCategory !== 'ALL' && item.category !== selectedCategory) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        item.term.toLowerCase().includes(q) ||
        item.shortSummary.toLowerCase().includes(q) ||
        item.simpleAnalogy.toLowerCase().includes(q) ||
        item.whyItMatters.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-scaleUp">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold tracking-tight">Plain English Construction Guide</h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Easy to Understand
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Simple everyday explanations and analogies for all construction & AI terms in this app
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Category Filter */}
        <div className="p-4 border-b border-slate-100 bg-slate-50 space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search any term (e.g. Critical Path, WBS, Golden Joint, NDT, Float)..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
              >
                Clear
              </button>
            )}
          </div>

          {/* Categories */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  selectedCategory === cat
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {cat === 'ALL' ? 'All Terms' : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Glossary Terms List */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {filteredItems.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 text-slate-500">
              <HelpCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <div className="text-sm font-semibold text-slate-800">No matching terms found</div>
              <p className="text-xs text-slate-400 mt-1">Try a different search keyword or category.</p>
            </div>
          ) : (
            filteredItems.map((item, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-white border border-slate-200 hover:border-indigo-300 transition-all shadow-2xs space-y-3"
              >
                {/* Title and Category */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                      {item.category}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 mt-1.5">{item.term}</h3>
                  </div>

                  {item.relatedView && onNavigate && (
                    <button
                      onClick={() => {
                        onClose();
                        onNavigate(item.relatedView!);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-indigo-50 text-indigo-600 text-xs font-semibold flex items-center gap-1 border border-slate-200 hover:border-indigo-200 transition-colors"
                    >
                      <span>Explore View</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Short Summary */}
                <p className="text-xs text-slate-700 font-medium">
                  {item.shortSummary}
                </p>

                {/* Simple Analogy Box */}
                <div className="p-3 rounded-lg bg-amber-50/70 border border-amber-200/80 text-xs space-y-1">
                  <div className="text-[11px] font-bold text-amber-900 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    <span>Simple Real-World Analogy:</span>
                  </div>
                  <p className="text-xs text-amber-900 leading-relaxed">
                    {item.simpleAnalogy}
                  </p>
                </div>

                {/* Why it matters & Example */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs pt-1">
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/70">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-0.5">
                      Why It Matters:
                    </span>
                    <span className="text-slate-700 text-[11px]">{item.whyItMatters}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/70">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-0.5">
                      Real Site Example:
                    </span>
                    <span className="text-slate-700 font-mono text-[11px]">{item.example}</span>
                  </div>
                </div>

              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs">
          <span className="text-slate-500">
            Have questions on the job? Ask the <strong>Time Agent Chat</strong> anytime in natural speech.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-xs"
          >
            Got It, Close
          </button>
        </div>

      </div>
    </div>
  );
};
