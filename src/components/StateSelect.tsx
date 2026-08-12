import React from 'react';
import { INDIAN_STATES } from '../data/states';
import { MapPin } from 'lucide-react';

interface StateSelectProps {
  value: string;
  onChange: (state: string) => void;
  required?: boolean;
  className?: string;
}

export const StateSelect: React.FC<StateSelectProps> = ({
  value,
  onChange,
  required = false,
  className = '',
}) => {
  return (
    <div className="relative">
      <MapPin className="w-3.5 h-3.5 text-[#9CA3AF] absolute left-3 top-2.5 z-10 pointer-events-none" />
      <select
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full bg-[#FFFFFF] border border-[#CBD5E1] focus:border-[#D4A017] rounded-lg pl-9 pr-7 py-2 text-xs text-[#0F172A] outline-none appearance-none cursor-pointer ${className}`}
      >
        <option value="" disabled>
          -- State (राज्य) Select Karein --
        </option>
        {INDIAN_STATES.map((st) => (
          <option key={st} value={st}>
            {st}
          </option>
        ))}
      </select>
      <div className="absolute right-2.5 top-2.5 pointer-events-none text-[#94A3B8] text-[10px]">
        ▼
      </div>
    </div>
  );
};
