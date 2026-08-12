import React from 'react';
import { MessageSquareText, Cpu, ShieldCheck, ArrowRight, ArrowDown, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { Language } from '../types';

interface HowItWorksProps {
  language?: Language;
  onStartConsultation: () => void;
}

export const HowItWorks: React.FC<HowItWorksProps> = ({ onStartConsultation }) => {
  const steps = [
    {
      num: '01',
      title: 'Describe',
      subtitle: 'अपनी समस्या बताएं',
      desc: 'Apni samasya apni bhasha mein batayein. Text, voice message ya document upload — sabhi support hai.',
      icon: MessageSquareText,
      badge: 'Voice & Text',
      color: 'from-amber-500/10 to-orange-500/10 text-[#D98800]',
    },
    {
      num: '02',
      title: 'Analyze',
      subtitle: 'AI & Legal Analysis',
      desc: 'Hum Bhartiya Nyaya Sanhita (BNS), IPC aur Supreme Court precedents ke basis par situation analyze karte hain.',
      icon: Cpu,
      badge: 'Instant AI Engine',
      color: 'from-blue-500/10 to-indigo-500/10 text-[#1E3A8A]',
    },
    {
      num: '03',
      title: 'Guide',
      subtitle: 'सही कानूनी रास्ता',
      desc: 'Aapko aapke rights, legal options, draft documents aur zaroorat hone par local advocates ki list milti hai.',
      icon: ShieldCheck,
      badge: 'Actionable Steps',
      color: 'from-emerald-500/10 to-teal-500/10 text-[#059669]',
    },
  ];

  return (
    <section id="how-it-works" className="py-16 md:py-24 bg-[#FAFBFD] relative border-t border-[#E2E8F0] overflow-hidden">
      
      {/* Background Subtle Gradient Blobs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#D98800]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#1E3A8A]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
          <div className="inline-flex items-center gap-2 bg-[#F0F5FE] text-[#1E3A8A] text-xs font-semibold px-3.5 py-1.5 rounded-full border border-[#CBD5E1]">
            <Sparkles className="w-3.5 h-3.5 text-[#D98800]" />
            <span>3 Simple Steps To Legal Clarity</span>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#0F1D38] tracking-tight">
            Kaise Kaam Karta Hai?
          </h2>

          <p className="text-base sm:text-lg text-[#64748B] font-normal">
            Kanooni salah paana ab behad aasan. Bina lawyer office ke chakkar kaate, seconds mein sahi jaankari paayein.
          </p>
        </div>

        {/* 3 Step Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-10 items-stretch relative">
          {steps.map((step, idx) => {
            const IconComponent = step.icon;
            return (
              <React.Fragment key={idx}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: idx * 0.15 }}
                  onClick={onStartConsultation}
                  className="bg-[#FFFFFF] rounded-2xl p-8 border border-[#E2E8F0] shadow-xl hover:shadow-2xl transition-all duration-300 relative flex flex-col justify-between group cursor-pointer hover:-translate-y-1.5"
                >
                  <div className="space-y-5">
                    
                    {/* Top Row: Icon on left, Step Number & Badge on right */}
                    <div className="flex items-center justify-between">
                      <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center border border-[#CBD5E1]/50 group-hover:scale-110 transition-transform duration-300`}>
                        <IconComponent className="w-7 h-7" />
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#64748B] bg-[#F1F5F9] px-2.5 py-1 rounded-md border border-[#E2E8F0]">
                          {step.badge}
                        </span>
                        <span className="text-2xl font-black tracking-wider text-[#0F1D38] bg-[#F0F5FE] text-[#1E3A8A] w-10 h-10 rounded-xl flex items-center justify-center border border-[#CBD5E1]">
                          {step.num}
                        </span>
                      </div>
                    </div>

                    {/* Step Title & Subtitle */}
                    <div>
                      <div className="flex items-baseline justify-between gap-2">
                        <h3 className="text-2xl font-bold text-[#0F1D38] group-hover:text-[#D98800] transition-colors">
                          {step.title}
                        </h3>
                      </div>
                      <p className="text-xs font-semibold text-[#D98800] mt-0.5">
                        {step.subtitle}
                      </p>
                    </div>

                    {/* Description */}
                    <p className="text-sm text-[#475569] leading-relaxed font-normal">
                      {step.desc}
                    </p>
                  </div>

                  {/* Card Footer Action */}
                  <div className="pt-6 mt-6 border-t border-[#F1F5F9] flex items-center justify-between text-xs font-bold text-[#0F1D38] group-hover:text-[#D98800] transition-colors">
                    <span>Start This Step</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </motion.div>

                {/* Desktop Transition Arrow between card 1->2 and 2->3 */}
                {idx < steps.length - 1 && (
                  <div className="hidden md:flex absolute top-1/2 -translate-y-1/2 z-20 pointer-events-none text-[#D98800]" style={{ left: idx === 0 ? '31.5%' : '65%' }}>
                    <div className="w-10 h-10 rounded-full bg-[#FFFFFF] shadow-md border border-[#E2E8F0] flex items-center justify-center animate-pulse">
                      <ArrowRight className="w-5 h-5 text-[#D98800]" />
                    </div>
                  </div>
                )}

                {/* Mobile Transition Connector Arrow */}
                {idx < steps.length - 1 && (
                  <div className="flex md:hidden justify-center my-2 text-[#D98800]">
                    <div className="w-8 h-8 rounded-full bg-[#FFFFFF] shadow-sm border border-[#E2E8F0] flex items-center justify-center">
                      <ArrowDown className="w-4 h-4 text-[#D98800]" />
                    </div>
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Bottom Quick Callout */}
        <div className="mt-12 text-center">
          <button
            onClick={onStartConsultation}
            className="inline-flex items-center gap-2 bg-[#0F1D38] hover:bg-[#1A2D54] text-[#FFFFFF] text-sm font-bold px-7 py-3.5 rounded-xl shadow-lg transition-all cursor-pointer"
          >
            <span>Shuru Karein — Nishulk Salah</span>
            <ArrowRight className="w-4 h-4 text-[#D98800]" />
          </button>
        </div>

      </div>
    </section>
  );
};

