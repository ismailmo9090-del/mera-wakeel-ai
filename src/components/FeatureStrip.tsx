import React from 'react';
import { MessageCircle, Clock, ShieldCheck, Users } from 'lucide-react';

interface FeatureStripProps {
  items?: {
    icon: React.ComponentType<{ className?: string }>;
    bg: string;
    fg: string;
    title: string;
    subtitle: string;
  }[];
}

const DEFAULT_ITEMS = [
  {
    icon: MessageCircle,
    bg: 'bg-[#F5A623]/10',
    fg: 'text-[#F5A623]',
    title: 'Aasan Bhasha',
    subtitle: 'Simple language mein samjhayenge',
  },
  {
    icon: Clock,
    bg: 'bg-[#2563EB]/10',
    fg: 'text-[#2563EB]',
    title: 'Turant Salah',
    subtitle: 'AI se instant legal guidance payen',
  },
  {
    icon: ShieldCheck,
    bg: 'bg-[#16A34A]/10',
    fg: 'text-[#16A34A]',
    title: 'Puri Tarah Gupt',
    subtitle: 'Aapki privacy hamari zimmedari hai',
  },
  {
    icon: Users,
    bg: 'bg-[#7C3AED]/10',
    fg: 'text-[#7C3AED]',
    title: 'Trusted by Indians',
    subtitle: 'Lakhon users ka bharosa',
  },
];

export const FeatureStrip: React.FC<FeatureStripProps> = ({ items = DEFAULT_ITEMS }) => (
  <div className="bg-[#FFFFFF] rounded-xl border border-[#E2E8F0] shadow-sm p-3 sm:p-4">
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-y-4 gap-x-2">
      {items.map((item, idx) => {
        const Icon = item.icon;
        return (
          <div key={idx} className="flex items-start gap-3 px-1.5">
            <span className={`w-9 h-9 shrink-0 rounded-lg ${item.bg} ${item.fg} flex items-center justify-center`}>
              <Icon className="w-4 h-4" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-bold text-[#0F2557] leading-tight">{item.title}</p>
              <p className="text-[11px] text-[#6B7280] mt-0.5 leading-snug">{item.subtitle}</p>
            </div>
          </div>
        );
      })}
    </div>
  </div>
);

export default FeatureStrip;