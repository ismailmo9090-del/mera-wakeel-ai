import React from 'react';
import { Home, Building2, Receipt, ShieldAlert, ArrowRight } from 'lucide-react';

interface QuickLink {
  icon: React.ComponentType<{ className?: string }>;
  bg: string;
  fg: string;
  label: string;
}

interface QuickLinkGridProps {
  items?: QuickLink[];
  onSelect?: () => void;
  label?: string;
  freeLabel?: string;
}

const DEFAULT_ITEMS = [
  { icon: Home, bg: 'bg-[#F5A623]/10', fg: 'text-[#F5A623]', label: 'Property / Land Disputes' },
  { icon: Building2, bg: 'bg-[#2563EB]/10', fg: 'text-[#2563EB]', label: 'Tenant / Rent Agreements' },
  { icon: Receipt, bg: 'bg-[#16A34A]/10', fg: 'text-[#16A34A]', label: 'Consumer Fraud & Refunds' },
  { icon: ShieldAlert, bg: 'bg-[#7C3AED]/10', fg: 'text-[#7C3AED]', label: 'Police Notice / FIR Help' },
];

export const QuickLinkGrid: React.FC<QuickLinkGridProps> = ({
  items = DEFAULT_ITEMS,
  onSelect,
  label = 'Instantly Consult On',
  freeLabel = 'Free • Private',
}) => (
  <div>
    <div className="flex items-center justify-between px-1 mb-2.5">
      <span className="text-xs font-bold text-[#0F2557]">{label}</span>
      <span className="text-[10px] font-bold text-[#F5A623]">{freeLabel}</span>
    </div>

    <div className="grid grid-cols-2 gap-2">
      {items.map((item, idx) => {
        const Icon = item.icon;
        return (
          <button
            key={idx}
            type="button"
            onClick={onSelect}
            className="group flex items-center gap-2.5 bg-[#F8FAFC] hover:bg-[#FFFFFF] border border-[#E2E8F0] hover:border-[#F5A623]/60 rounded-lg p-3 text-left transition-all cursor-pointer shadow-xs"
          >
            <span className={`w-8 h-8 shrink-0 rounded-lg ${item.bg} ${item.fg} flex items-center justify-center`}>
              <Icon className="w-4 h-4" />
            </span>
            <span className="flex-1 text-xs font-bold text-[#0F2557] leading-snug">{item.label}</span>
            <ArrowRight className="w-4 h-4 text-[#9CA3AF] group-hover:text-[#F5A623] group-hover:translate-x-0.5 transition-all shrink-0" />
          </button>
        );
      })}
    </div>
  </div>
);

export default QuickLinkGrid;