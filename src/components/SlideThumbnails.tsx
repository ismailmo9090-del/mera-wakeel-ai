import React from 'react';
import { SlideData } from '../types';
import { DynamicIcon } from './DynamicIcon';

interface SlideThumbnailsProps {
  slides: SlideData[];
  currentSlide: number;
  onSelectSlide: (id: number) => void;
}

export const SlideThumbnails: React.FC<SlideThumbnailsProps> = ({
  slides,
  currentSlide,
  onSelectSlide,
}) => {
  return (
    <div className="relative z-20 bg-[#070d1e]/90 border-t border-amber-500/20 px-4 py-2.5 overflow-x-auto no-scrollbar">
      <div className="flex items-center gap-2 max-w-7xl mx-auto min-w-max">
        {slides.map((slide) => {
          const isActive = slide.id === currentSlide;
          return (
            <button
              key={slide.id}
              onClick={() => onSelectSlide(slide.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-all border ${
                isActive
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/60 shadow-md shadow-amber-500/10 font-bold scale-105'
                  : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
              }`}
            >
              <span
                className={`flex items-center justify-center w-5 h-5 rounded text-[10px] font-mono ${
                  isActive ? 'bg-amber-400 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {slide.id}
              </span>
              <DynamicIcon name={slide.iconName} size={14} className={isActive ? 'text-amber-400' : 'text-slate-500'} />
              <span className="truncate max-w-[120px]">{slide.title}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
