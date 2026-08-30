import React, { useState } from 'react';
import { RotateCcw, AlertTriangle, CheckCircle2, X } from 'lucide-react';
import { api } from '../api.ts';

interface ResetDemoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ResetDemoModal: React.FC<ResetDemoModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [isResetting, setIsResetting] = useState(false);

  if (!isOpen) return null;

  const handleReset = async () => {
    setIsResetting(true);
    try {
      await api.resetDemo();
      onSuccess();
      onClose();
    } catch (e: any) {
      alert(`Reset error: ${e.message}`);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-xl w-full max-w-md p-6 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2 text-rose-600">
            <RotateCcw className="w-5 h-5" />
            <h3 className="text-base font-bold text-slate-900">Reset Demo Environment</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          This will reset all projects, schedule activities, field documents, execution events, review queue matches, and audit logs back to the pristine baseline synthetic demo state.
        </p>

        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-[11px] text-slate-600 space-y-1">
          <div>• Baseline activities restored to planned dates</div>
          <div>• 5 pending review queue items re-seeded</div>
          <div>• Audit trail reset to initial ingestion logs</div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleReset}
            disabled={isResetting}
            className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-sm flex items-center gap-1.5"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
            <span>{isResetting ? 'Resetting...' : 'Confirm Reset'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
