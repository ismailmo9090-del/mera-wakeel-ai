import React, { useState, useEffect } from 'react';
import { SlideData } from '../types';
import { Clock, Volume2, VolumeX, X, MessageSquare, Sparkles } from 'lucide-react';

interface PresenterNotesProps {
  slide: SlideData;
  onClose: () => void;
  isNarrating: boolean;
  onToggleNarration: () => void;
}

export const PresenterNotes: React.FC<PresenterNotesProps> = ({
  slide,
  onClose,
  isNarrating,
  onToggleNarration,
}) => {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div className="fixed bottom-14 left-4 right-4 sm:left-auto sm:right-6 sm:w-96 z-30 bg-[#0a1128]/95 backdrop-blur-md border border-amber-500/40 rounded-2xl shadow-2xl p-4 text-white">
      <div className="flex items-center justify-between border-b border-amber-500/20 pb-2 mb-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">
            Presenter Script • Slide {slide.id}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-[11px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
            <Clock className="w-3 h-3" />
            <span>{formatTime(seconds)}</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-xs sm:text-sm text-slate-200 leading-relaxed font-normal">
          <p className="text-amber-300 font-semibold mb-1 flex items-center gap-1 text-[11px] uppercase tracking-wide">
            <Sparkles className="w-3 h-3 text-amber-400" /> 30-Second Speaking Cue:
          </p>
          "{slide.presenterNotes}"
        </div>

        <div className="flex items-center justify-between text-xs pt-1">
          <button
            onClick={onToggleNarration}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              isNarrating
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {isNarrating ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span>{isNarrating ? 'Pause Audio' : 'Play Voiceover'}</span>
          </button>
          <span className="text-[10px] text-slate-400 font-mono">
            {slide.id === 1 ? 'Pitch intro' : slide.id === 11 ? 'Closing ask' : 'Core slide'}
          </span>
        </div>
      </div>
    </div>
  );
};
