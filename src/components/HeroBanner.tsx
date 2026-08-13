import React from 'react';
import { Language, NavTab } from '../types';
import { motion } from 'motion/react';
import {
  Sparkles,
  ArrowRight,
  PlayCircle,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react';
import { AnimatedChatDemo } from './AnimatedChatDemo';
import { FeatureStrip } from './FeatureStrip';
import { QuickLinkGrid } from './QuickLinkGrid';

interface HeroBannerProps {
  language?: Language;
  onStartConsultation: () => void;
  onNavigate?: (tab: NavTab) => void;
}

/** Faint decorative scale-of-justice watermark */
const ScaleWatermark: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 120 120" fill="none" className={className} aria-hidden="true">
    <circle cx="60" cy="14" r="8" stroke="currentColor" strokeWidth="4" />
    <line x1="60" y1="22" x2="60" y2="112" stroke="currentColor" strokeWidth="4" />
    <line x1="28" y1="46" x2="92" y2="46" stroke="currentColor" strokeWidth="4" />
    <path d="M28 46 L18 82 L38 82 Z" stroke="currentColor" strokeWidth="3" fill="none" />
    <path d="M92 46 L82 82 L102 82 Z" stroke="currentColor" strokeWidth="3" fill="none" />
    <line x1="14" y1="86" x2="42" y2="86" stroke="currentColor" strokeWidth="3" />
    <line x1="78" y1="86" x2="106" y2="86" stroke="currentColor" strokeWidth="3" />
  </svg>
);

/** Faint decorative court-pillar watermark */
const PillarWatermark: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 120 120" fill="none" className={className} aria-hidden="true">
    <path d="M16 52 L60 14 L104 52 Z" stroke="currentColor" strokeWidth="4" fill="none" />
    <line x1="60" y1="14" x2="60" y2="30" stroke="currentColor" strokeWidth="4" />
    <line x1="24" y1="52" x2="96" y2="52" stroke="currentColor" strokeWidth="4" />
    <line x1="30" y1="52" x2="30" y2="104" stroke="currentColor" strokeWidth="4" />
    <line x1="45" y1="52" x2="45" y2="104" stroke="currentColor" strokeWidth="4" />
    <line x1="60" y1="52" x2="60" y2="104" stroke="currentColor" strokeWidth="4" />
    <line x1="75" y1="52" x2="75" y2="104" stroke="currentColor" strokeWidth="4" />
    <line x1="90" y1="52" x2="90" y2="104" stroke="currentColor" strokeWidth="4" />
    <path d="M20 104 L100 104 L100 112 L20 112 Z" fill="currentColor" />
  </svg>
);

export const HeroBanner: React.FC<HeroBannerProps> = ({
  language,
  onStartConsultation,
  onNavigate,
}) => {
  const scrollToDemo = () => {
    document.getElementById('hero-chat-demo')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  return (
    <section className="relative overflow-hidden bg-[#FFF9F0] pt-10 pb-16 md:pt-16 md:pb-24">
      {/* Faint decorative watermarks */}
      <ScaleWatermark className="absolute -top-10 -left-14 w-72 h-72 text-[#0F2557] opacity-[0.05] pointer-events-none" />
      <PillarWatermark className="absolute bottom-0 -right-14 w-80 h-80 text-[#0F2557] opacity-[0.05] pointer-events-none" />
      <ScaleWatermark className="absolute top-1/3 right-1/4 w-40 h-40 text-[#F5A623] opacity-[0.06] pointer-events-none rotate-12" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* LEFT COLUMN */}
          <div className="lg:col-span-7 space-y-6 text-left">
            {/* Badge pill */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="inline-flex items-center gap-2 bg-[#FFFFFF]/70 text-[#0F2557] text-xs sm:text-sm font-bold px-4 py-2 rounded-full border border-[#F5A623]/50 shadow-xs"
            >
              <Sparkles className="w-4 h-4 text-[#F5A623]" />
              <span>AI Powered Legal Guidance, Built for India</span>
            </motion.div>

            {/* Heading */}
            <motion.h1
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-[1.1] text-[#0F2557]"
            >
              <span className="block">Apna Personal</span>
              <span className="block text-[#F5A623] text-[1.12em] leading-[1.05] w-fit relative py-1">
                Wakeel,
                <span className="absolute left-0 -bottom-0.5 h-1.5 w-20 bg-[#F5A623] rounded-full" />
              </span>
              <span className="block">Hamesha Aapke Saath</span>
            </motion.h1>

            {/* Paragraph */}
            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-[15px] text-[#4B5563] leading-relaxed max-w-xl"
            >
              Chahe property ka jhagda ho, family matter ya koi kanooni pareshani – hum aapko samjhayenge, guide karenge aur sahi raasta dikhayenge.
            </motion.p>

            {/* Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1"
            >
              <button
                onClick={onStartConsultation}
                className="inline-flex items-center justify-center gap-2 bg-[#F5A623] hover:bg-[#E0940F] text-white font-bold text-base px-7 py-3.5 rounded-lg shadow-lg shadow-[#F5A623]/30 transition-all cursor-pointer group"
              >
                <Sparkles className="w-4 h-4" />
                <span>Start Free Consultation</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>

              <button
                onClick={scrollToDemo}
                className="inline-flex items-center justify-center gap-2 bg-[#FFFFFF] text-[#0F2557] border border-[#0F2557] font-bold text-base px-7 py-3.5 rounded-lg hover:bg-[#F1F5F9] transition-all cursor-pointer"
              >
                <PlayCircle className="w-4 h-4 text-[#F5A623]" />
                <span>Demo Dekhein</span>
              </button>
            </motion.div>

            {/* Trust indicators */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-[#4B5563] font-medium pt-1">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#0F2557]" />
                <span>100% Confidential</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse" />
                <span>24/7 AI Legal Assistance</span>
              </div>
            </div>

            {/* Feature strip */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <FeatureStrip />
            </motion.div>
          </div>

          {/* RIGHT COLUMN — Animated chat demo */}
          <motion.div
            id="hero-chat-demo"
            initial={{ opacity: 0, scale: 0.97, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="lg:col-span-5 w-full max-w-xl mx-auto"
          >
            <div className="relative">
              <div className="absolute -inset-4 bg-[#F5A623]/20 rounded-3xl blur-3xl -z-10 pointer-events-none" />
              <AnimatedChatDemo
                placeholder={
                  language === 'hi'
                    ? 'Apna legal sawal likhiye...'
                    : 'Type your legal question...'
                }
              />
              {/* Quick links below chat */}
              <div className="mt-3 bg-[#FFFFFF] rounded-2xl border border-[#E2E8F0] shadow-sm p-4">
                <QuickLinkGrid onSelect={onStartConsultation} />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroBanner;