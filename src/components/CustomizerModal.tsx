import React, { useState } from 'react';
import { DeckMetadata } from '../types';
import { Settings, X, Save, RotateCcw } from 'lucide-react';

interface CustomizerModalProps {
  metadata: DeckMetadata;
  onSave: (updated: DeckMetadata) => void;
  onClose: () => void;
}

export const CustomizerModal: React.FC<CustomizerModalProps> = ({
  metadata,
  onSave,
  onClose,
}) => {
  const [formData, setFormData] = useState<DeckMetadata>(metadata);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#070b19] border border-amber-500/40 rounded-3xl shadow-2xl overflow-hidden text-white">
        <div className="p-4 bg-[#0a1128] border-b border-amber-500/20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm font-bold text-white">Customize Pitch Deck Info</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          <div>
            <label className="text-slate-400 font-mono uppercase block mb-1">
              Team / Startup Name:
            </label>
            <input
              type="text"
              value={formData.teamName}
              onChange={(e) => setFormData({ ...formData, teamName: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 focus:border-amber-500 rounded-xl p-2.5 text-white focus:outline-none"
            />
          </div>

          <div>
            <label className="text-slate-400 font-mono uppercase block mb-1">
              College / Institution / Company:
            </label>
            <input
              type="text"
              value={formData.collegeName}
              onChange={(e) => setFormData({ ...formData, collegeName: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 focus:border-amber-500 rounded-xl p-2.5 text-white focus:outline-none"
            />
          </div>

          <div>
            <label className="text-slate-400 font-mono uppercase block mb-1">
              Hackathon Event Name:
            </label>
            <input
              type="text"
              value={formData.hackathonName}
              onChange={(e) => setFormData({ ...formData, hackathonName: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 focus:border-amber-500 rounded-xl p-2.5 text-white focus:outline-none"
            />
          </div>

          <div>
            <label className="text-slate-400 font-mono uppercase block mb-1">
              Contact Email:
            </label>
            <input
              type="email"
              value={formData.contactEmail}
              onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 focus:border-amber-500 rounded-xl p-2.5 text-white focus:outline-none"
            />
          </div>

          <div>
            <label className="text-slate-400 font-mono uppercase block mb-1">
              GitHub / Project Link:
            </label>
            <input
              type="text"
              value={formData.repoUrl}
              onChange={(e) => setFormData({ ...formData, repoUrl: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 focus:border-amber-500 rounded-xl p-2.5 text-white focus:outline-none"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold flex items-center gap-1.5 shadow-md shadow-amber-500/20"
            >
              <Save className="w-4 h-4" /> Save Deck
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
