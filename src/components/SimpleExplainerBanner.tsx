import React from 'react';
import {
  Camera,
  Brain,
  TrendingUp,
  ArrowRight
} from 'lucide-react';

interface SimpleExplainerBannerProps {
  onNavigate: (view: string) => void;
  onOpenUpload: () => void;
}

export const SimpleExplainerBanner: React.FC<SimpleExplainerBannerProps> = ({
  onNavigate,
  onOpenUpload
}) => {
  return (
    <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 text-white rounded-2xl border border-indigo-800/60 shadow-md overflow-hidden transition-all">
      {/* 3 Steps Cards */}
      <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-900/40">
          
          {/* Step 1 */}
          <div
            onClick={onOpenUpload}
            className="p-4 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-indigo-500/20 hover:border-indigo-400/50 transition-all cursor-pointer group space-y-2.5"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-indigo-500/30 text-indigo-300 font-mono font-bold text-xs flex items-center justify-center border border-indigo-400/40">
                  1
                </span>
                <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider">Field Proof</span>
              </div>
              <Camera className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
            </div>

            <h3 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">
              Workers Upload Photos & Reports
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Supervisors take photos or upload daily inspection sheets from the job site directly into the system.
            </p>

            <div className="pt-2 flex items-center justify-between text-[11px] text-indigo-300 border-t border-slate-700/60">
              <span>Try uploading a document</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Step 2 */}
          <div
            onClick={() => onNavigate('matching')}
            className="p-4 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-indigo-500/20 hover:border-indigo-400/50 transition-all cursor-pointer group space-y-2.5"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-purple-500/30 text-purple-300 font-mono font-bold text-xs flex items-center justify-center border border-purple-400/40">
                  2
                </span>
                <span className="text-xs font-bold text-purple-300 uppercase tracking-wider">AI Verification</span>
              </div>
              <Brain className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
            </div>

            <h3 className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors">
              AI Reads & Matches Progress
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              SitePulse AI reads the text, numbers, and weld counts to automatically connect field work with the right schedule task.
            </p>

            <div className="pt-2 flex items-center justify-between text-[11px] text-purple-300 border-t border-slate-700/60">
              <span>See pending AI matches</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Step 3 */}
          <div
            onClick={() => onNavigate('schedule')}
            className="p-4 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-indigo-500/20 hover:border-indigo-400/50 transition-all cursor-pointer group space-y-2.5"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-emerald-500/30 text-emerald-300 font-mono font-bold text-xs flex items-center justify-center border border-emerald-400/40">
                  3
                </span>
                <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider">Live Timeline</span>
              </div>
              <TrendingUp className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
            </div>

            <h3 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">
              Schedule Updates Automatically
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Project progress is updated in real time. Delays and equipment clashes are flagged before they cost money.
            </p>

            <div className="pt-2 flex items-center justify-between text-[11px] text-emerald-300 border-t border-slate-700/60">
              <span>Explore Master Timeline</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

        </div>
    </div>
  );
};
