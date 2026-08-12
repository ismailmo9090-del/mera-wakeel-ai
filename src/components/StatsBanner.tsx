import React from 'react';
import { ShieldCheck, MapPin, Star, Clock } from 'lucide-react';
import { motion } from 'motion/react';

export const StatsBanner: React.FC = () => {
  const stats = [
    {
      icon: ShieldCheck,
      value: '500+',
      label: 'Verified Advocates',
      sublabel: 'Bar Council Registered Network',
    },
    {
      icon: MapPin,
      value: '28 States',
      label: 'Court Coverage',
      sublabel: 'High Courts & District Courts',
    },
    {
      icon: Star,
      value: '100% Secure',
      label: 'DPDP Compliant',
      sublabel: 'Encrypted Legal Vault',
    },
    {
      icon: Clock,
      value: '24/7 Instant',
      label: 'AI Legal Guidance',
      sublabel: 'BNS, BNSS & BSA Analysis',
    },
  ];

  return (
    <div className="relative bg-gradient-to-r from-[#091224] via-[#0F1D38] to-[#070D1A] text-[#FFFFFF] py-10 md:py-14 border-y border-[#D98800]/25 shadow-2xl overflow-hidden">
      
      {/* Background Decorative Gold Light Glows */}
      <div className="absolute top-0 left-10 w-72 h-72 bg-[#D98800]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-10 w-72 h-72 bg-[#F59E0B]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 items-center">
          {stats.map((stat, idx) => {
            const IconComponent = stat.icon;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.1 }}
                className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-4 p-4 rounded-2xl bg-[#FFFFFF]/[0.03] hover:bg-[#FFFFFF]/[0.06] border border-[#FFFFFF]/10 hover:border-[#D98800]/40 transition-all duration-300 group"
              >
                {/* Gold Frosted Icon Box */}
                <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-[#D98800]/20 to-[#F59E0B]/10 border border-[#D98800]/40 flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:border-[#D98800] transition-all shadow-md">
                  <IconComponent className="w-6 h-6 sm:w-7 sm:h-7 text-[#F59E0B]" />
                </div>

                {/* Value & Label */}
                <div className="space-y-1">
                  <div className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-[#F59E0B] via-[#FBBF24] to-[#D97706]">
                    {stat.value}
                  </div>
                  <div className="text-sm sm:text-base font-bold text-[#F8FAFC]">
                    {stat.label}
                  </div>
                  <div className="text-xs text-[#94A3B8] font-medium hidden sm:block">
                    {stat.sublabel}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

