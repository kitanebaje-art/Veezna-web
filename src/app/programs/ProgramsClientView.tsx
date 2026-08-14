// src/app/programs/ProgramsClientView.tsx
'use client';

import React, { useState, useMemo } from 'react';
import { ProgramsHero } from './ProgramsHero';
import { ProgramFilters } from './ProgramFilters';
import { ProgramCard } from './ProgramCard';
import { ProgramCTA } from './ProgramCTA';

// Shared Interface Types
export interface Program {
  slug: string;
  title: string;
  category: string;
  level?: string;
  mode?: string;
  tagline?: string;
  shortDescription?: string;
  description?: string;
  longDescription?: string;
  duration?: string;
  certificate?: string;
  skills?: string[];
  features?: string[];
  bannerGradient?: string;
  badgeBg?: string;
  badgeText?: string;
  glowColor?: string;
  price?: string;
  icon?: React.ReactNode;
}

export type ProgramCategory = string;

interface ProgramsClientViewProps {
  initialPrograms: Program[];
}

export const ProgramsClientView: React.FC<ProgramsClientViewProps> = ({ initialPrograms = [] }) => {
  const [selectedCategory, setSelectedCategory] = useState<ProgramCategory>('all');

  const countsByCategory = useMemo(() => {
    const counts: Record<string, number> = { all: initialPrograms.length };
    initialPrograms.forEach((p) => {
      if (p.category) {
        counts[p.category] = (counts[p.category] || 0) + 1;
      }
    });
    return counts;
  }, [initialPrograms]);

  const filteredPrograms = useMemo(() => {
    if (selectedCategory === 'all') return initialPrograms;
    return initialPrograms.filter((p) => p.category?.toLowerCase() === selectedCategory.toLowerCase());
  }, [initialPrograms, selectedCategory]);

  return (
    <>
      <ProgramsHero />
      <ProgramFilters
        activeCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        programCountByCategory={countsByCategory}
      />
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-gray-900">
            {selectedCategory === 'all'
              ? 'All Available Programs'
              : `${selectedCategory.replace('-', ' ').toUpperCase()} Programs`}
          </h2>
          <span className="text-sm text-gray-500 font-medium">
            Showing {filteredPrograms.length} path{filteredPrograms.length === 1 ? '' : 's'}
          </span>
        </div>

        {/* Inlined Program Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch mb-16">
          {filteredPrograms.map((program) => (
            <ProgramCard key={program.slug} program={program as any} />
          ))}
        </div>

        <ProgramCTA />
      </section>
    </>
  );
};

export default ProgramsClientView;