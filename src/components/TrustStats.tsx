import React from 'react';
import { Language } from '../types';
import { getContent } from './LanguageContent';
import { Shield, Scale, Users, MapPin, Languages } from 'lucide-react';

interface TrustStatsProps {
  language: Language;
}

export const TrustStats: React.FC<TrustStatsProps> = ({ language }) => {
  const t = getContent(language).stats;

  const statsList = [
    {
      value: t.cases,
      label: t.casesLabel,
      subtext: 'Calculated across civil & criminal issues',
      icon: Scale,
    },
    {
      value: t.lawyers,
      label: t.lawyersLabel,
      subtext: 'High Court & District Advocates',
      icon: Users,
    },
    {
      value: t.states,
      label: t.statesLabel,
      subtext: 'State-specific legal codes covered',
      icon: MapPin,
    },
    {
      value: t.languages,
      label: t.languagesLabel,
      subtext: 'Devanagari, English, Roman Hinglish',
      icon: Languages,
    },
  ];

  return (
    <section className="bg-[#152238] text-[#F7F3EC] py-12 border-y-2 border-[#C9A227]/30 shadow-inner">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {statsList.map((stat, index) => {
            const IconComponent = stat.icon;
            return (
              <div
                key={index}
                className="bg-[#1F2E4A]/80 p-5 rounded-2xl border border-[#C9A227]/20 flex flex-col justify-between space-y-2 hover:border-[#C9A227]/50 transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="font-fraunces text-3xl sm:text-4xl font-bold text-[#E4CE85]">
                    {stat.value}
                  </span>
                  <div className="p-2 rounded-xl bg-[#152238] text-[#C9A227]">
                    <IconComponent className="w-5 h-5" />
                  </div>
                </div>

                <div>
                  <h4 className="font-inter font-semibold text-sm sm:text-base text-[#F7F3EC]">
                    {stat.label}
                  </h4>
                  <p className="text-[11px] font-mono-plex text-[#E4CE85]/70 mt-0.5">
                    {stat.subtext}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
