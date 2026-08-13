import React from 'react';
import { ArrowRight, Plus, type LucideIcon } from 'lucide-react';

interface SectionCTAProps {
  title: string;
  subtitle?: string;
  buttonLabel: string;
  icon?: LucideIcon;
  onClick?: () => void;
}

/**
 * Reusable centered call-to-action block: bold heading, small subtitle, and an
 * orange primary button ("+" icon + label + arrow) with gentle hover lift.
 */
export const SectionCTA: React.FC<SectionCTAProps> = ({
  title,
  subtitle,
  buttonLabel,
  icon: Icon = Plus,
  onClick,
}) => (
  <div className="mt-12 text-center space-y-4">
    <h3 className="text-[22px] font-extrabold text-[#0F172A] leading-snug">{title}</h3>
    {subtitle && <p className="text-sm text-[#64748B]">{subtitle}</p>}
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 px-6 py-3.5 bg-[#D97706] hover:bg-[#B45309] text-[#FFFFFF] font-extrabold text-sm rounded-xl shadow-md hover:shadow-lg hover:scale-105 transition-all duration-200 cursor-pointer group"
    >
      <Icon className="w-4 h-4" />
      <span>{buttonLabel}</span>
      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
    </button>
  </div>
);

export default SectionCTA;