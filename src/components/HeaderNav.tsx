import React from 'react';
import {
  Scale,
  MessageSquareText,
  Bot,
  FileText,
  Settings,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  Share2,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause
} from 'lucide-react';

interface HeaderNavProps {
  currentSlide: number;
  totalSlides: number;
  category: string;
  onPrev: () => void;
  onNext: () => void;
  onToggleQA: () => void;
  onToggleDemo: () => void;
  onToggleNotes: () => void;
  onToggleCustomizer: () => void;
  onToggleExport: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  showNotes: boolean;
  isNarrating: boolean;
  onToggleNarration: () => void;
  isAutoPlay: boolean;
  onToggleAutoPlay: () => void;
}

export const HeaderNav: React.FC<HeaderNavProps> = ({
  currentSlide,
  totalSlides,
  category,
  onPrev,
  onNext,
  onToggleQA,
  onToggleDemo,
  onToggleNotes,
  onToggleCustomizer,
  onToggleExport,
  isFullscreen,
  onToggleFullscreen,
  showNotes,
  isNarrating,
  onToggleNarration,
  isAutoPlay,
  onToggleAutoPlay,
}) => {
  return (
    <header className="relative z-30 flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-3 bg-[#0a1128]/80 backdrop-blur-md border-b border-amber-500/20 text-white">
      {/* Brand & Category */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 shadow-lg shadow-amber-500/20 font-bold">
          <Scale className="w-6 h-6" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-extrabold tracking-wider text-base sm:text-lg bg-gradient-to-r from-white via-amber-100 to-amber-400 bg-clip-text text-transparent">
              MERA WAKEEL AI
            </span>
            <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-full">
              Pitch Deck
            </span>
          </div>
          <p className="text-xs text-slate-400 hidden md:block">
            {category} • Slide {currentSlide} of {totalSlides}
          </p>
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="flex items-center gap-2 bg-slate-900/80 p-1.5 rounded-xl border border-slate-800">
        <button
          onClick={onPrev}
          disabled={currentSlide === 1}
          className="p-1.5 rounded-lg text-slate-300 hover:text-amber-400 hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
          title="Previous Slide (Left Arrow)"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <span className="text-xs font-mono font-bold text-amber-400 px-2 min-w-[70px] text-center">
          {String(currentSlide).padStart(2, '0')} / {String(totalSlides).padStart(2, '0')}
        </span>

        <button
          onClick={onNext}
          disabled={currentSlide === totalSlides}
          className="p-1.5 rounded-lg text-slate-300 hover:text-amber-400 hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
          title="Next Slide (Right Arrow)"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        <button
          onClick={onToggleAutoPlay}
          className={`p-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-all ${
            isAutoPlay ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Auto-play presentation timer"
        >
          {isAutoPlay ? <Pause className="w-4 h-4 text-amber-400" /> : <Play className="w-4 h-4" />}
          <span className="hidden lg:inline text-[11px]">{isAutoPlay ? 'Pause' : 'Auto'}</span>
        </button>
      </div>

      {/* Action Badges & Features */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Live Prototype Demo */}
        <button
          onClick={onToggleDemo}
          className="px-2.5 sm:px-3 py-1.5 text-xs font-medium rounded-lg bg-gradient-to-r from-amber-500/20 to-amber-600/30 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 transition-all flex items-center gap-1.5 shadow-sm shadow-amber-500/10"
        >
          <Bot className="w-4 h-4 text-amber-400" />
          <span className="hidden sm:inline">Test AI Demo</span>
        </button>

        {/* Judge QA Simulator */}
        <button
          onClick={onToggleQA}
          className="px-2.5 sm:px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-900/40 text-blue-300 border border-blue-500/30 hover:bg-blue-900/60 transition-all flex items-center gap-1.5"
        >
          <MessageSquareText className="w-4 h-4 text-blue-400" />
          <span className="hidden sm:inline">Judge Q&A</span>
        </button>

        {/* Presenter Notes */}
        <button
          onClick={onToggleNotes}
          className={`p-2 rounded-lg text-xs transition-all ${
            showNotes
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
          title="Presenter Notes / Speaking Script"
        >
          <FileText className="w-4 h-4" />
        </button>

        {/* Pitch Voiceover Narration */}
        <button
          onClick={onToggleNarration}
          className={`p-2 rounded-lg text-xs transition-all ${
            isNarrating
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 animate-pulse'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
          title={isNarrating ? 'Stop Audio Narration' : 'Play Slide Audio Voiceover'}
        >
          {isNarrating ? <Volume2 className="w-4 h-4 text-amber-400" /> : <VolumeX className="w-4 h-4" />}
        </button>

        {/* Export / Share */}
        <button
          onClick={onToggleExport}
          className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all"
          title="Export Deck & Google Slides"
        >
          <Share2 className="w-4 h-4" />
        </button>

        {/* Customizer */}
        <button
          onClick={onToggleCustomizer}
          className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all"
          title="Edit Team & Deck Details"
        >
          <Settings className="w-4 h-4" />
        </button>

        {/* Fullscreen */}
        <button
          onClick={onToggleFullscreen}
          className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all"
          title="Toggle Fullscreen (F)"
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
};
