import React from 'react';
import { Language, NavTab } from '../types';
import { getContent } from './LanguageContent';
import { ShieldCheck, Target, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';

interface HeroProps {
  language: Language;
  onStartConsultation: () => void;
  onNavigate: (tab: NavTab) => void;
}

export const Hero: React.FC<HeroProps> = ({
  language,
  onStartConsultation,
}) => {
  const t = getContent(language).hero;

  return (
    <section className="relative overflow-hidden pt-8 pb-16 md:pt-14 md:pb-24 bg-gradient-to-b from-[#F8FAFC] via-[#FFFFFF] to-[#F1F5F9]">
      
      {/* Background Decorative Graphic Light Watermark */}
      <div className="absolute top-1/2 right-10 -translate-y-1/2 w-[600px] h-[600px] opacity-[0.04] pointer-events-none">
        <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="100" cy="100" r="80" stroke="#0F1D38" strokeWidth="3" />
          <path d="M100 30V170M50 170H150M40 80H160" stroke="#0F1D38" strokeWidth="3" />
          <path d="M40 80L25 125M40 80L55 125" stroke="#0F1D38" strokeWidth="2.5" />
          <path d="M160 80L145 125M160 80L175 125" stroke="#0F1D38" strokeWidth="2.5" />
        </svg>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          
          {/* Left Column: Headline & Action */}
          <div className="lg:col-span-7 space-y-6 text-left">
            
            {/* Top Badge Pill */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="inline-flex items-center gap-2 bg-[#F0F5FE] text-[#1E3A8A] text-xs sm:text-sm font-semibold px-4 py-2 rounded-full border border-[#CBD5E1] shadow-2xs"
            >
              <Sparkles className="w-4 h-4 text-[#D98800]" />
              <span>AI Powered Legal Guidance, Built for India</span>
            </motion.div>

            {/* Main Title with Deep Navy & Gold Gradient Typography */}
            <motion.h1
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.12]"
            >
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D98800] via-[#EAB308] to-[#B45309] block mb-1">
                Apna Personal Wakeel,
              </span>
              <span className="text-[#0F1D38] block">
                Hamesha Aapke Saath
              </span>
            </motion.h1>

            {/* Subtitle Description */}
            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-base sm:text-lg text-[#475569] leading-relaxed max-w-2xl font-normal"
            >
              Chahe property ka jhagda ho, family matter ya koi kanooni pareshani – hum aapko samjhayenge, guide karenge aur sahi raasta dikhayenge.
            </motion.p>

            {/* Primary Action Button */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="pt-2 space-y-4"
            >
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                <button
                  onClick={onStartConsultation}
                  className="bg-gradient-to-r from-[#D98800] to-[#C27900] hover:from-[#C27900] hover:to-[#A36400] text-[#FFFFFF] font-bold text-base px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 group"
                >
                  <span>Start Free Consultation</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>

              {/* Guarantee Bar */}
              <div className="flex flex-wrap items-center gap-y-2 gap-x-5 text-xs sm:text-sm text-[#64748B] font-medium pt-1">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#0F1D38]" />
                  <span>100% Confidential</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
                  <span>24/7 AI Legal Assistance</span>
                </div>
              </div>
            </motion.div>

          </div>

          {/* Right Column: Hero Consultation Illustration */}
          <div className="lg:col-span-5 relative flex justify-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative w-full max-w-lg"
            >
              {/* Soft Golden Backdrop Glow */}
              <div className="absolute inset-0 bg-[#D98800]/15 rounded-3xl blur-3xl -z-10" />

              {/* Main Illustration Card Container */}
              <div className="bg-[#FFFFFF] rounded-2xl p-3 shadow-2xl border border-[#E2E8F0] overflow-hidden group">
                
                {/* Image Frame */}
                <div className="relative rounded-xl overflow-hidden bg-[#0F1D38] border border-[#1E2E4F]">
                  <img
                    src="https://zperifsbcjfmngfugfdd.supabase.co/storage/v1/object/public/logo/hero%20.png"
                    alt="Mera Wakeel AI Legal Consultation"
                    referrerPolicy="no-referrer"
                    className="w-full h-auto object-cover transform group-hover:scale-[1.02] transition-transform duration-500 rounded-xl"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/hero-advocate.svg';
                    }}
                  />

                  {/* Overlaid Assistant Badge */}
                  <div className="absolute top-3 left-3 bg-[#0F1D38]/90 backdrop-blur-md text-[#FFFFFF] px-3 py-1.5 rounded-lg border border-[#FFFFFF]/20 shadow-lg flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] animate-pulse" />
                    <span className="text-xs font-semibold text-[#F8FAFC]">Mera Wakeel AI • Live Legal Assistance</span>
                  </div>
                </div>

                {/* Quick Consultation Topic Chips */}
                <div className="p-3 bg-[#F8FAFC] rounded-xl mt-3 border border-[#F1F5F9] space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-[#0F1D38] px-1">
                    <span>Instantly Consult On:</span>
                    <span className="text-[#D98800]">Free • Private</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {[
                      ' Property / Land Disputes',
                      ' Tenant / Rent Agreements',
                      ' Consumer Fraud & Refunds',
                      ' Police Notice / FIR Help',
                    ].map((topic, idx) => (
                      <button
                        key={idx}
                        onClick={onStartConsultation}
                        className="text-left bg-[#FFFFFF] hover:bg-[#F0F5FE] border border-[#CBD5E1] hover:border-[#D98800] rounded-lg p-2 text-xs font-medium text-[#334155] hover:text-[#0F1D38] transition-all flex items-center justify-between cursor-pointer"
                      >
                        <span className="truncate">{topic}</span>
                        <span className="text-[#D98800] text-xs font-bold shrink-0">→</span>
                      </button>
                    ))}
                  </div>
                </div>

              </div>
            </motion.div>
          </div>

        </div>
      </div>
    </section>
  );
};

