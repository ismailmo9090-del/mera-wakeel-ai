import React from 'react';
import { INDIAN_CITIES } from '../data/cities';
import { MapPin } from 'lucide-react';

interface CitySelectProps {
  value: string;
  onChange: (city: string) => void;
  required?: boolean;
  className?: string;
}

export const CitySelect: React.FC<CitySelectProps> = ({
  value,
  onChange,
  required = false,
  className = '',
}) => {
  return (
    <div className="relative">
      <MapPin className="w-4 h-4 text-[#9CA3AF] absolute left-3.5 top-3.5 z-10 pointer-events-none" />
      <select
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full bg-[#F9FAFB] border border-[#E5E7EB] focus:border-[#D4A017] rounded-xl pl-10 pr-8 py-2.5 text-sm text-[#111827] outline-none appearance-none cursor-pointer ${className}`}
      >
        <option value="" disabled>
          -- City Select Karein (शहर चुनें) --
        </option>
        {INDIAN_CITIES.map((c) => (
          <option key={`${c.name}-${c.state}`} value={`${c.name}, ${c.state}`}>
            {c.name} ({c.state})
          </option>
        ))}
        <option value="Other / Non-Listed City">Other / Aniyantrit City</option>
      </select>
      <div className="absolute right-3.5 top-3.5 pointer-events-none text-[#9CA3AF] text-xs">
        ▼
      </div>
    </div>
  );
};
