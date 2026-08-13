import React from 'react';
import { Sparkles, ArrowRight, MessageCircle, Cpu, ShieldCheck } from 'lucide-react';
import { StepCard } from './StepCard';

interface HowItWorksSectionProps {
  onStart?: () => void;
}

const STEPS = [
  {
    number: '01',
    icon: MessageCircle,
    badgeBg: 'bg-[#F5A623]',
    title: 'Describe',
    hindiTitle: 'अपनी समस्या बताएं',
    description:
      'Apni samasya apni bhasha mein batayein. Text, voice message ya document upload — sabhi support hai.',
    tag: 'Voice & Text',
    animation: 'typing' as const,
  },
  {
    number: '02',
    icon: Cpu,
    badgeBg: 'bg-[#2563EB]',
    title: 'Analyze',
    hindiTitle: 'AI & Legal Analysis',
    description:
      'Hum Bhartiya Nyaya Sanhita (BNS), IPC aur Supreme Court precedents ke basis par situation analyze karte hain.',
    tag: 'Instant AI Engine',
    animation: 'scanning' as const,
  },
  {
    number: '03',
    icon: ShieldCheck,
    badgeBg: 'bg-[#16A34A]',
    title: 'Guide',
    hindiTitle: 'सही कानूनी रास्ता',
    description:
      'Aapko aapke rights, legal options, draft documents aur zaroorat hone par local advocates ki list milti hai.',
    tag: 'Actionable Steps',
    animation: 'checkmark' as const,
  },
];

export const HowItWorksSection: React.FC<HowItWorksSectionProps> = ({ onStart }) => {
  return (
    <section className="relative bg-[#FFFFFF] py-16 md:py-24 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center space-y-4 mb-12 md:mb-14">
          <span className="inline-flex items-center gap-2 bg-white text-[#0F2557] text-xs sm:text-sm font-bold px-4 py-2 rounded-full border border-[#F5A623]/50 shadow-xs">
            <Sparkles className="w-4 h-4 text-[#F5A623]" />
            3 Simple Steps To Legal Clarity
          </span>
          <h2 className="text-4xl sm:text-5xl font-extrabold text-[#0F2557] tracking-tight leading-tight">
            Kaise Kaam Karta Hai?
          </h2>
          <p className="text-[15px] text-[#6B7280] leading-relaxed max-w-2xl mx-auto">
            Kanooni salah paana ab behad aasan. Bina lawyer office ke chakkar kaate, seconds mein sahi
            jaankari paayein.
          </p>
        </div>

        {/* Cards + connectors */}
        <div className="relative">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
            {STEPS.map((step, idx) => (
              <StepCard
                key={step.number}
                number={step.number}
                icon={step.icon}
                badgeBg={step.badgeBg}
                title={step.title}
                hindiTitle={step.hindiTitle}
                description={step.description}
                tag={step.tag}
                animation={step.animation}
                delay={idx * 0.15}
                onStart={onStart}
              />
            ))}
          </div>

          {/* Desktop connector arrows between cards */}
          <div className="hidden lg:block pointer-events-none">
            <div className="absolute top-1/2 -translate-y-1/2 left-[33%] -translate-x-1/2 z-10 w-9 h-9 rounded-full bg-white border border-[#E2E8F0] shadow-md flex items-center justify-center text-[#F5A623]">
              <ArrowRight className="w-4 h-4" />
            </div>
            <div className="absolute top-1/2 -translate-y-1/2 left-[67%] -translate-x-1/2 z-10 w-9 h-9 rounded-full bg-white border border-[#E2E8F0] shadow-md flex items-center justify-center text-[#F5A623]">
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;