import React from 'react';
import { ArrowRight, ChevronDown, ShieldCheck } from 'lucide-react';

export interface RefAction {
  label: string;
  onClick?: () => void;
  href?: string;
  variant: 'outline' | 'gold';
  icon?: React.ComponentType<{ className?: string }>;
}

export interface RefHeroProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle?: string;
  actions?: RefAction[];
}

const HERO_ICON_BG = 'bg-[#F5A623]/10';
const HERO_ICON_FG = 'text-[#F5A623]';

export const RefHero: React.FC<RefHeroProps> = ({ icon: Icon, title, subtitle, actions }) => {
  return (
    <section className="bg-[#0F2557] text-white relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#F5A623]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 -left-20 w-80 h-80 bg-[#3B82F6]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
        <div className="flex items-center gap-4 sm:gap-5 min-w-0">
          <div className={`w-16 h-16 shrink-0 border-2 border-white/80 rounded-2xl flex items-center justify-center ${HERO_ICON_BG}`}>
            <Icon className={`w-8 h-8 ${HERO_ICON_FG}`} />
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-[28px] font-extrabold leading-tight">{title}</h1>
            {subtitle && <p className="text-sm text-[#CBD5E1] mt-1">{subtitle}</p>}
          </div>
        </div>
        {actions && actions.length > 0 && (
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {actions.map((a, i) => {
              const ActionIcon = a.icon;
              const base =
                'inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer';
              const variantCls =
                a.variant === 'gold'
                  ? 'bg-[#F5A623] hover:bg-[#E0940F] text-[#0F2557] shadow-md'
                  : 'bg-transparent hover:bg-white/10 border border-white/60 text-white';
              const inner = (
                <>
                  {ActionIcon && <ActionIcon className="w-4 h-4" />}
                  <span>{a.label}</span>
                </>
              );
              return a.href ? (
                <a
                  key={i}
                  href={a.href}
                  target={a.href.startsWith('http') ? '_blank' : undefined}
                  rel="noopener noreferrer"
                  className={`${base} ${variantCls}`}
                >
                  {inner}
                </a>
              ) : (
                <button key={i} type="button" onClick={a.onClick} className={`${base} ${variantCls}`}>
                  {inner}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};

export const RefSectionHeading: React.FC<{ title: string }> = ({ title }) => (
  <h2 className="text-xl sm:text-2xl font-extrabold text-[#0F1D38] flex items-center gap-2.5">
    <span className="h-7 w-1.5 bg-[#F5A623] rounded-full" />
    {title}
  </h2>
);

const FEATURE_COLORS = [
  { bg: 'bg-[#DBEAFE]', fg: 'text-[#2563EB]' },
  { bg: 'bg-[#DCFCE7]', fg: 'text-[#16A34A]' },
  { bg: 'bg-[#EDE9FE]', fg: 'text-[#7C3AED]' },
  { bg: 'bg-[#FFEDD5]', fg: 'text-[#EA580C]' },
  { bg: 'bg-[#CCFBF1]', fg: 'text-[#0D9488]' },
];

export interface RefFeature {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc: string;
  onClick?: () => void;
  href?: string;
  linkText?: string;
}

export const RefFeatureGrid: React.FC<{ features: RefFeature[] }> = ({ features }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
    {features.map((f, idx) => {
      const c = FEATURE_COLORS[idx % FEATURE_COLORS.length];
      const Icon = f.icon;
      const inner = (
        <>
          <div className={`p-2.5 rounded-xl ${c.bg} ${c.fg} w-fit`}>
            <Icon className="w-5 h-5" />
          </div>
          <h3 className="text-[16px] font-bold text-[#0F1D38] leading-snug">{f.title}</h3>
          <p className="text-[13px] text-[#6B7280] leading-relaxed line-clamp-3">{f.desc}</p>
          <span className="mt-auto pt-2 inline-flex items-center gap-1 text-xs font-bold text-[#D98800] group-hover:gap-1.5 transition-all">
            {f.linkText || 'पेज खोलें'}
            <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </>
      );
      const cardCls =
        'group bg-white rounded-2xl border border-[#E2E8F0] shadow-sm hover:shadow-md hover:border-[#F5A623]/50 p-5 flex flex-col gap-2 text-left transition-all';
      return f.href ? (
        <a key={idx} href={f.href} target="_blank" rel="noopener noreferrer" className={`${cardCls} cursor-pointer`}>
          {inner}
        </a>
      ) : (
        <button key={idx} type="button" onClick={f.onClick} className={`${cardCls} cursor-pointer`}>
          {inner}
        </button>
      );
    })}
  </div>
);

export interface RefStep {
  title: string;
  desc: string;
}

export interface RefFaq {
  q: string;
  a: string;
}

export interface RefEmergencyRow {
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  label: string;
  value: string;
  href?: string;
}

export const RefSteps: React.FC<{ title: string; steps: RefStep[] }> = ({ title, steps }) => (
  <div className="bg-[#ECFDF3] border border-[#BBF7D0] rounded-2xl p-5 sm:p-6">
    <h3 className="text-base font-bold text-[#0F1D38] mb-4">{title}</h3>
    <ol className="space-y-4">
      {steps.map((s, i) => (
        <li key={i} className="flex gap-3">
          <span className="w-8 h-8 shrink-0 rounded-full bg-[#16A34A] text-white text-sm font-bold flex items-center justify-center mt-0.5 shadow-sm">
            {i + 1}
          </span>
          <div>
            <p className="font-bold text-sm text-[#0F1D38] leading-snug">{s.title}</p>
            {s.desc && <p className="text-xs text-[#6B7280] mt-0.5 leading-relaxed">{s.desc}</p>}
          </div>
        </li>
      ))}
    </ol>
  </div>
);

export const RefAccordion: React.FC<{ title: string; items: RefFaq[] }> = ({ title, items }) => (
  <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-2xl p-5 sm:p-6">
    <h3 className="text-base font-bold text-[#0F1D38] mb-4">{title}</h3>
    <div className="space-y-2">
      {items.map((it, i) => (
        <details key={i} className="group bg-white rounded-xl border border-[#E2E8F0] overflow-hidden">
          <summary className="cursor-pointer list-none flex items-center gap-2.5 px-3 py-2.5 text-[13px] font-bold text-[#0F1D38] hover:bg-[#F8FAFC] transition-colors">
            <span className="w-5 h-5 shrink-0 rounded-full bg-[#DBEAFE] text-[#2563EB] flex items-center justify-center text-[11px] font-black">
              ?
            </span>
            <span className="flex-1">{it.q}</span>
            <ChevronDown className="w-4 h-4 text-[#6B7280] shrink-0 transition-transform group-open:rotate-180" />
          </summary>
          <div className="px-3 pb-3 pl-8 text-xs text-[#55607A] leading-relaxed">{it.a}</div>
        </details>
      ))}
    </div>
  </div>
);

export const RefEmergency: React.FC<{
  title: string;
  rows: RefEmergencyRow[];
  trustText: string;
}> = ({ title, rows, trustText }) => (
  <div className="bg-[#FFF1F2] border border-[#FECDD3] rounded-2xl p-5 sm:p-6">
    <h3 className="text-base font-bold text-[#0F1D38] mb-4">{title}</h3>
    <div className="space-y-3">
      {rows.map((r, i) => {
        const Icon = r.icon;
        return (
          <div key={i} className="flex items-center gap-3 bg-white/70 rounded-xl p-2.5 border border-white">
            <span className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center ${r.color}`}>
              <Icon className="w-5 h-5" />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] text-[#9CA3AF] font-semibold uppercase tracking-wide">{r.label}</p>
              {r.href ? (
                <a href={r.href} className="font-extrabold text-sm text-[#0F1D38] hover:underline">
                  {r.value}
                </a>
              ) : (
                <p className="font-extrabold text-sm text-[#0F1D38]">{r.value}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
    <div className="mt-4 pt-3 border-t border-[#FECDD3] flex items-center gap-2 text-xs font-bold text-[#0F1D38]">
      <ShieldCheck className="w-4 h-4 text-[#DB2777]" />
      {trustText}
    </div>
  </div>
);

export interface RefBottomColumnsProps {
  stepsTitle: string;
  steps: RefStep[];
  faqTitle: string;
  faqs: RefFaq[];
  emergencyTitle: string;
  emergency: RefEmergencyRow[];
  trustText: string;
}

export const RefBottomColumns: React.FC<RefBottomColumnsProps> = ({
  stepsTitle,
  steps,
  faqTitle,
  faqs,
  emergencyTitle,
  emergency,
  trustText,
}) => (
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5 items-start">
    <RefSteps title={stepsTitle} steps={steps} />
    <RefAccordion title={faqTitle} items={faqs} />
    <RefEmergency title={emergencyTitle} rows={emergency} trustText={trustText} />
  </div>
);

export default RefHero;