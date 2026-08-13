import React, { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'motion/react';
import { ArrowRight, type LucideIcon } from 'lucide-react';

export interface OnboardingStep {
  number: number;
  title: string;
  description: string;
  icon: LucideIcon;
  badgeBg: string;
  iconClass?: string;
  showSuccess?: boolean;
}

interface OnboardingStepsProps {
  steps: OnboardingStep[];
  stagger?: number;
  iconClass?: string;
}

/**
 * Reusable 3-step onboarding strip. Cards fade/slide in staggered on scroll,
 * desktop connector arrow badges pulse between cards, and the flagged
 * "success" step draws a checkmark (SVG stroke draw + scale bounce) once its
 * card enters the viewport — signaling "you're ready to receive clients".
 */
export const OnboardingSteps: React.FC<OnboardingStepsProps> = ({
  steps,
  stagger = 0.15,
  iconClass = 'text-[#64748B]',
}) => {
  const successRef = useRef<HTMLDivElement>(null);
  const successInView = useInView(successRef, { amount: 0.5, once: true });
  const [successShown, setSuccessShown] = useState(false);

  useEffect(() => {
    if (successInView && !successShown) setSuccessShown(true);
  }, [successInView, successShown]);

  return (
    <div className="relative">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        {steps.map((step, i) => {
          const Icon = step.icon;
          const isSuccess = !!step.showSuccess;
          const showCheck = isSuccess && successShown;
          return (
            <motion.div
              key={step.number}
              ref={isSuccess ? successRef : undefined}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.5, delay: i * stagger }}
              className="bg-[#FFFFFF] rounded-2xl border border-[#E2E8F0] shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200 ease-out p-7 flex flex-col gap-4"
            >
              {/* Number badge + icon chip */}
              <div className="flex items-center gap-2.5">
                <motion.div
                  className={`relative w-12 h-12 shrink-0 rounded-full ${step.badgeBg} text-[#FFFFFF] flex items-center justify-center font-extrabold text-base shadow-md overflow-hidden`}
                  animate={showCheck ? { scale: [1, 1.18, 1] } : { scale: 1 }}
                  transition={
                    showCheck ? { duration: 0.7, times: [0, 0.6, 1], ease: 'easeOut' } : { duration: 0.2 }
                  }
                >
                  <motion.span
                    animate={showCheck ? { opacity: [1, 0] } : { opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    {step.number}
                  </motion.span>
                  {showCheck && (
                    <svg viewBox="0 0 24 24" fill="none" className="absolute inset-0 w-full h-full pointer-events-none">
                      <motion.path
                        d="M6 12.5l4 4 8-9"
                        stroke="#FFFFFF"
                        strokeWidth="3.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 0.55, ease: 'easeOut', delay: 0.3 }}
                      />
                    </svg>
                  )}
                </motion.div>

                <span
                  className={`w-8 h-8 rounded-full bg-white border border-[#E2E8F0] shadow-sm flex items-center justify-center ${step.iconClass || iconClass}`}
                >
                  <Icon className="w-4 h-4" />
                </span>
              </div>

              <h3 className="text-lg font-bold text-[#0F172A] leading-snug">{step.title}</h3>
              <p className="text-sm text-[#64748B] leading-relaxed">{step.description}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Desktop connector arrows between cards */}
      <div className="hidden lg:block pointer-events-none">
        {[33, 67].map((pos, i) => (
          <motion.div
            key={pos}
            className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-white border border-[#E2E8F0] shadow-md flex items-center justify-center text-[#F59E0B]"
            style={{ left: `${pos}%` }}
            animate={{ scale: [1, 1.12, 1] }}
            transition={{
              duration: 2.4,
              times: [0, 0.5, 1],
              repeat: Infinity,
              ease: 'easeInOut',
              delay: i * 0.4,
            }}
          >
            <ArrowRight className="w-4 h-4" />
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default OnboardingSteps;