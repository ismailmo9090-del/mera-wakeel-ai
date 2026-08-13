import React from 'react';
import { motion } from 'motion/react';
import { type LucideIcon } from 'lucide-react';

export interface FeatureCardData {
  icon: LucideIcon;
  iconClass: string;
  title: string;
  description: string;
  highlighted?: boolean;
  badgeText?: string;
}

interface FeatureGridProps {
  cards: FeatureCardData[];
  gridClass?: string;
  stagger?: number;
}

/**
 * Reusable feature grid. Cards fade/slide up as they scroll into view
 * (staggered left→right), lift on hover, and a card flagged `highlighted`
 * gets an orange border + a small "Core Feature" badge.
 */
export const FeatureGrid: React.FC<FeatureGridProps> = ({
  cards,
  gridClass = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6',
  stagger = 0.12,
}) => (
  <div className={gridClass}>
    {cards.map((card, i) => {
      const Icon = card.icon;
      return (
        <motion.div
          key={card.title}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.5, delay: i * stagger }}
          className={`relative bg-[#FFFFFF] rounded-2xl p-7 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200 ease-out ${
            card.highlighted ? 'border-2 border-[#F59E0B]' : 'border border-[#E2E8F0]'
          }`}
        >
          {card.highlighted && card.badgeText && (
            <span className="absolute top-3 right-3 px-2.5 py-0.5 bg-[#F59E0B] text-[#FFFFFF] text-[11px] font-extrabold rounded-full shadow-sm">
              {card.badgeText}
            </span>
          )}

          <motion.div
            className={`w-12 h-12 rounded-xl ${card.iconClass} flex items-center justify-center shadow-sm`}
            animate={{ scale: [1, 1.04, 1] }}
            transition={{ duration: 2.2, times: [0, 0.5, 1], repeat: Infinity, ease: 'easeInOut' }}
          >
            <Icon className="w-6 h-6" />
          </motion.div>

          <h3 className="mt-4 text-lg font-bold text-[#0F172A] leading-snug">{card.title}</h3>
          <p className="mt-2 text-sm text-[#64748B] leading-relaxed">{card.description}</p>
        </motion.div>
      );
    })}
  </div>
);

export default FeatureGrid;