import React from 'react';
import { Language, NavTab } from '../types';
import { getContent } from './LanguageContent';
import { UserCheck, Briefcase, CheckCircle2, ArrowRight, ShieldAlert, Sparkles, Scale } from 'lucide-react';
import { motion } from 'motion/react';

interface PlatformSectionsProps {
  language: Language;
  onStartConsultation: () => void;
  onOpenLawyerAuth: () => void;
}

export const PlatformSections: React.FC<PlatformSectionsProps> = ({
  language,
  onStartConsultation,
  onOpenLawyerAuth,
}) => {
  const t = getContent(language).platform;

  const citizenFeatures = [
    'Property, Tenancy & Encroachment disputes',
    'Family, Divorce & Inheritance guidance',
    'Consumer fraud, Bank scams & E-commerce refunds',
    'FIR understanding & Criminal procedure steps',
    'Employment termination & Unpaid wages',
  ];

  const lawyerFeatures = [
    'Get matched with clients in your practice jurisdiction',
    'Review AI-summarized case notes before first consultation',
    'Verified Advocate badge & LinkedIn-style professional profile',
    'Secure client messaging & document sharing workspace',
    'Zero commission on client consultations',
  ];

  return (
    <section id="for-lawyers" className="py-16 md:py-24 bg-[#F1EAD9]/50 border-t border-[#E3DCC9]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-14 space-y-2">
          <span className="text-xs font-mono-plex uppercase tracking-wider text-[#C9A227] font-semibold bg-[#152238] px-3.5 py-1.5 rounded-full">
            Two Sides of Mera Wakeel AI
          </span>
          <h2 className="font-fraunces text-3xl sm:text-4xl font-semibold text-[#1F2E4A]">
            {t.title}
          </h2>
        </div>

        {/* Two Columns Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Card 1: Citizens ("Log Kisi Bhi Legal Samasya Ke Liye") */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="bg-[#F7F3EC] rounded-3xl p-8 border-2 border-[#E3DCC9] shadow-md flex flex-col justify-between hover:border-[#C9A227] transition-all relative overflow-hidden"
          >
            <div className="space-y-6">
              {/* Card Header */}
              <div className="flex items-center justify-between">
                <span className="bg-[#1F2E4A] text-[#E4CE85] text-xs font-mono-plex px-3 py-1 rounded-full font-medium">
                  {t.citizenCard.badge}
                </span>
                <div className="p-3 bg-[#1F2E4A]/10 text-[#1F2E4A] rounded-2xl">
                  <UserCheck className="w-6 h-6" />
                </div>
              </div>

              {/* Title & Desc */}
              <div className="space-y-2">
                <h3 className="font-fraunces text-2xl sm:text-3xl font-bold text-[#1F2E4A]">
                  {t.citizenCard.title}
                </h3>
                <p className="text-sm text-[#2B2B26]/85 font-inter leading-relaxed">
                  {t.citizenCard.desc}
                </p>
              </div>

              {/* Bullet Features */}
              <div className="space-y-2.5 pt-2">
                <p className="text-xs font-mono-plex text-[#C9A227] font-bold uppercase tracking-wider">
                  Common Areas Handled:
                </p>
                {citizenFeatures.map((feat, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-[#2B2B26]/80 font-inter">
                    <CheckCircle2 className="w-4 h-4 text-[#5E7F5E] shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA */}
            <div className="pt-8 mt-6 border-t border-[#E3DCC9]">
              <button
                onClick={onStartConsultation}
                className="w-full bg-[#C9A227] hover:bg-[#E4CE85] text-[#152238] font-bold py-3.5 px-6 rounded-2xl text-base flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
              >
                <span>{t.citizenCard.cta}</span>
                <ArrowRight className="w-5 h-5 text-[#152238]" />
              </button>
            </div>
          </motion.div>

          {/* Card 2: Lawyers ("Wakeelon Ke Liye — Naye Clients Paayein") */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="bg-[#152238] text-[#F7F3EC] rounded-3xl p-8 border-2 border-[#C9A227]/40 shadow-xl flex flex-col justify-between hover:border-[#C9A227] transition-all relative overflow-hidden"
          >
            <div className="space-y-6">
              {/* Card Header */}
              <div className="flex items-center justify-between">
                <span className="bg-[#C9A227] text-[#152238] text-xs font-mono-plex px-3 py-1 rounded-full font-bold">
                  {t.lawyerCard.badge}
                </span>
                <div className="p-3 bg-[#1F2E4A] text-[#C9A227] rounded-2xl border border-[#C9A227]/30">
                  <Briefcase className="w-6 h-6" />
                </div>
              </div>

              {/* Title & Desc */}
              <div className="space-y-2">
                <h3 className="font-fraunces text-2xl sm:text-3xl font-bold text-[#F7F3EC]">
                  {t.lawyerCard.title}
                </h3>
                <p className="text-sm text-[#F7F3EC]/80 font-inter leading-relaxed">
                  {t.lawyerCard.desc}
                </p>
              </div>

              {/* Bullet Features */}
              <div className="space-y-2.5 pt-2">
                <p className="text-xs font-mono-plex text-[#E4CE85] font-bold uppercase tracking-wider">
                  Lawyer Platform Benefits:
                </p>
                {lawyerFeatures.map((feat, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-[#F7F3EC]/90 font-inter">
                    <CheckCircle2 className="w-4 h-4 text-[#C9A227] shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA */}
            <div className="pt-8 mt-6 border-t border-[#E3DCC9]/15">
              <button
                onClick={onOpenLawyerAuth}
                className="w-full bg-[#1F2E4A] hover:bg-[#152238] text-[#E4CE85] hover:text-[#F7F3EC] font-bold py-3.5 px-6 rounded-2xl text-base flex items-center justify-center gap-2 border-2 border-[#C9A227] shadow-md transition-all cursor-pointer"
              >
                <span>{t.lawyerCard.cta}</span>
                <ArrowRight className="w-5 h-5 text-[#C9A227]" />
              </button>
            </div>
          </motion.div>

        </div>

      </div>
    </section>
  );
};
