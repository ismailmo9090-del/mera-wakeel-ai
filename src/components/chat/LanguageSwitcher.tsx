import React, { useState } from 'react';
import { Language } from '../../types';
import { Globe, ChevronDown } from 'lucide-react';
import { LANGUAGES } from '../../lib/language';

interface LanguageSwitcherProps {
  language: Language;
  onSelectLanguage: (lang: Language) => void;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ language, onSelectLanguage }) => {
  const [langSwitcherOpen, setLangSwitcherOpen] = useState<boolean>(false);

  return (
    <div
      className="relative"
      onMouseEnter={() => setLangSwitcherOpen(true)}
      onMouseLeave={() => setLangSwitcherOpen(false)}
    >
      <button
        onClick={() => setLangSwitcherOpen((v) => !v)}
        className="bg-[#F1F5F9] border border-[#CBD5E1] text-[#0F1D38] text-[11px] font-bold px-3 py-1.5 rounded-full shadow-2xs flex items-center gap-1.5 cursor-pointer"
        title="Change language"
      >
        <Globe className="w-3.5 h-3.5" />
        {LANGUAGES.find((l) => l.code === language)?.nativeLabel || 'हिन्दी'}
        <ChevronDown className="w-3.5 h-3.5" />
      </button>
      {langSwitcherOpen && (
        <div className="absolute right-0 mt-1 bg-white border border-[#E2E8F0] rounded-xl shadow-lg py-1 z-50 w-44 max-h-72 overflow-y-auto">
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              onClick={() => {
                onSelectLanguage(l.code as Language);
                setLangSwitcherOpen(false);
              }}
              className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between gap-2 cursor-pointer ${
                language === l.code ? 'bg-[#0F1D38] text-[#FFFFFF] font-bold' : 'text-[#334155] hover:bg-[#F1F5F9]'
              }`}
            >
              <span>{l.nativeLabel}</span>
              <span className={`text-[10px] ${language === l.code ? 'text-[#F5A623]' : 'text-[#94A3B8]'}`}>{l.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};