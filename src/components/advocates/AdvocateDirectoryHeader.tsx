import React from 'react';
import { ArrowLeft, Search, X } from 'lucide-react';

interface AdvocateDirectoryHeaderProps {
  title: string;
  subtitle: string;
  badge: string;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onBack: () => void;
  searchPlaceholder?: string;
}

/**
 * Dark-navy full-width header for the advocate directory: back button + title +
 * verified badge + subtitle on the left, rounded search box on the right.
 */
export const AdvocateDirectoryHeader: React.FC<AdvocateDirectoryHeaderProps> = ({
  title,
  subtitle,
  badge,
  searchQuery,
  onSearchChange,
  onBack,
  searchPlaceholder = 'Search name, city, court...',
}) => (
  <div className="bg-[#0A1628] text-[#FFFFFF] py-4 px-4 md:px-8 border-b border-[#1E293B] shadow-md">
    <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back"
          className="p-2 rounded-full bg-[#1E293B] hover:bg-[#334155] text-[#E2E8F0] hover:text-[#FFFFFF] cursor-pointer shrink-0 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-base md:text-lg font-extrabold tracking-tight">{title}</h1>
            <span className="px-2.5 py-0.5 bg-[#D97706]/20 border border-[#D97706]/50 text-[#F59E0B] text-[10px] font-bold rounded-full whitespace-nowrap">
              {badge}
            </span>
          </div>
          <p className="text-[11px] text-[#94A3B8] mt-0.5">{subtitle}</p>
        </div>
      </div>

      <div className="relative w-full md:w-80 shrink-0">
        <Search className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          className="w-full pl-10 pr-8 py-2.5 bg-[#1E293B] border border-[#334155] rounded-full text-xs text-[#FFFFFF] placeholder-[#64748B] focus:outline-none focus:border-[#D97706] transition-colors"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            aria-label="Clear search"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#FFFFFF] cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  </div>
);

export default AdvocateDirectoryHeader;