import React, { useRef } from 'react';
import { motion, useInView } from 'motion/react';
import { ArrowRight, type LucideIcon } from 'lucide-react';

export type StepAnimation = 'typing' | 'scanning' | 'checkmark';

interface StepCardProps {
  number: string;
  icon: LucideIcon;
  badgeBg: string;
  title: string;
  hindiTitle: string;
  description: string;
  tag: string;
  animation: StepAnimation;
  delay?: number;
  onStart?: () => void;
}

/** Typing indicator: 3 bouncing dots + a pulsing "active" dot */
const TypingIndicator: React.FC<{ active?: boolean }> = ({ active }) =>
  active ? (
    <>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="absolute bottom-1.5 w-1 h-1 rounded-full bg-white animate-bounce"
          style={{ left: `${13 + i * 7}px`, animationDelay: `${i * 0.18}s` }}
        />
      ))}
      <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-white/90 animate-ping" />
    </>
  ) : null;

/** Scanning: vertical radar-sweep line + shimmer progress bar at bottom */
const ScanningEffect: React.FC<{ active?: boolean }> = ({ active }) =>
  active ? (
    <>
      <span className="absolute left-1 right-1 top-1 h-[2px] rounded-full bg-white/95 mw-scan-line" />
      <span className="absolute bottom-1 left-2 right-2 h-[3px] rounded-full bg-white/25 overflow-hidden">
        <span
          className="absolute inset-0 mw-shimmer-bar"
          style={{
            backgroundImage: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.85), transparent)',
          }}
        />
      </span>
    </>
  ) : null;

/** Checkmark: stroke-draw the ✓ on a loop (draw in, hold, fade, redraw) */
const CheckmarkDraw: React.FC<{ active?: boolean }> = ({ active }) => (
  <svg viewBox="0 0 24 24" fill="none" className="absolute inset-0 w-full h-full p-3 pointer-events-none">
    <motion.path
      d="M5 13l4 4L19 7"
      stroke="#FFFFFF"
      strokeWidth="2.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      initial={false}
      animate={active ? { pathLength: [0, 1, 1, 0], opacity: [0, 1, 1, 0] } : { pathLength: 0, opacity: 0 }}
      transition={{ duration: 2.4, times: [0, 0.4, 0.75, 1], repeat: Infinity, repeatDelay: 0.6, ease: 'easeInOut' }}
    />
  </svg>
);

export const StepCard: React.FC<StepCardProps> = ({
  number,
  icon: Icon,
  badgeBg,
  title,
  hindiTitle,
  description,
  tag,
  animation,
  delay = 0,
  onStart,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.35, once: false });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.5, delay }}
      className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-7 flex flex-col gap-5 hover:shadow-md hover:border-[#F5A623]/40 transition-all"
    >
      {/* Top row: icon badge + tag pill + number badge */}
      <div className="flex items-center gap-3">
        <motion.div
          className={`relative w-12 h-12 shrink-0 rounded-xl ${badgeBg} flex items-center justify-center overflow-hidden shadow-md`}
          animate={
            animation === 'checkmark' && inView
              ? { scale: [1, 1.12, 1, 1.1, 1] }
              : { scale: 1 }
          }
          transition={
            animation === 'checkmark' && inView
              ? { duration: 2.6, times: [0, 0.2, 0.4, 0.6, 1], repeat: Infinity, repeatDelay: 0.4, ease: 'easeOut' }
              : { duration: 0.2 }
          }
        >
          <Icon className="w-6 h-6 text-white" />
          {animation === 'typing' && <TypingIndicator active={inView} />}
          {animation === 'scanning' && <ScanningEffect active={inView} />}
          {animation === 'checkmark' && <CheckmarkDraw active={inView} />}
        </motion.div>

        <span className="text-[11px] font-bold text-[#6B7280] bg-[#F3F4F6] border border-[#E5E7EB] px-2.5 py-1 rounded-full">
          {tag}
        </span>

        <span className="ml-auto text-xs font-extrabold text-[#0F2557] border border-[#E2E8F0] rounded-full px-2.5 py-1">
          {number}
        </span>
      </div>

      {/* Heading + Hindi subtitle */}
      <div>
        <h3 className="text-[22px] font-extrabold text-[#0F2557] leading-snug">{title}</h3>
        <p className="text-[13px] font-bold text-[#F5A623] mt-0.5">{hindiTitle}</p>
      </div>

      {/* Description */}
      <p className="text-[14px] text-[#4B5563] leading-relaxed flex-1">{description}</p>

      {/* Bottom CTA */}
      <div className="pt-4 border-t border-[#E2E8F0]">
        <button
          type="button"
          onClick={onStart}
          className="inline-flex items-center gap-1.5 text-sm font-bold text-[#0F2557] hover:text-[#F5A623] transition-colors cursor-pointer group"
        >
          <span>Start This Step</span>
          <ArrowRight className="w-4 h-4 text-[#F5A623] transition-transform group-hover:translate-x-1" />
        </button>
      </div>
    </motion.div>
  );
};

export default StepCard;