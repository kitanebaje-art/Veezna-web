// src/app/programs/ProgramFilters.tsx
'use client';

import React from 'react';
import { PROGRAM_CATEGORIES } from '@/data/programs';

interface ProgramFiltersProps {
  activeCategory: string;
  onSelectCategory: (category: string) => void;
  programCountByCategory?: Record<string, number>;
}

export const ProgramFilters: React.FC<ProgramFiltersProps> = ({
  activeCategory,
  onSelectCategory,
  programCountByCategory = {},
}) => {
  return (
    <div className="w-full bg-white border-y border-slate-200 sticky top-0 z-20 shadow-sm backdrop-blur-md bg-white/90">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          {PROGRAM_CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat.id;
            const count = programCountByCategory[cat.id] ?? (cat.id === 'all' ? programCountByCategory['all'] : undefined);

            return (
              <button
                key={cat.id}
                onClick={() => onSelectCategory(cat.id)}
                className={`
                  inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-200
                  ${
                    isActive
                      ? 'bg-[#0057B8] text-white shadow-md shadow-blue-500/20'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }
                `}
              >
                <span>{cat.label}</span>
                {typeof count === 'number' && (
                  <span
                    className={`
                      px-1.5 py-0.5 rounded-full text-[10px]
                      ${isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'}
                    `}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ProgramFilters;