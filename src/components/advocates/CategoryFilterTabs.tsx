import React from 'react';

export interface CategoryOption {
  id: string;
  label: string;
}

interface CategoryFilterTabsProps {
  categories: CategoryOption[];
  active: string;
  onChange: (id: string) => void;
}

/**
 * Horizontally scrollable pill/tab row for filtering the advocate directory.
 * Active tab = dark navy bg + white text; inactive = white bg + border.
 */
export const CategoryFilterTabs: React.FC<CategoryFilterTabsProps> = ({ categories, active, onChange }) => (
  <div className="bg-[#FFFFFF] border-b border-[#E2E8F0]">
    <div className="max-w-6xl mx-auto px-4 md:px-8 py-3 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
      {categories.map((cat) => (
        <button
          key={cat.id}
          type="button"
          onClick={() => onChange(cat.id)}
          className={`px-4 py-1.5 text-xs font-bold rounded-full border whitespace-nowrap transition-all cursor-pointer ${
            active === cat.id
              ? 'bg-[#0A1628] text-[#FFFFFF] border-[#0A1628] shadow-sm'
              : 'bg-[#FFFFFF] text-[#475569] border-[#CBD5E1] hover:bg-[#F1F5F9] hover:border-[#94A3B8]'
          }`}
        >
          {cat.label}
        </button>
      ))}
    </div>
  </div>
);

export default CategoryFilterTabs;