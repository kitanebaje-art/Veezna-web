// src/components/programs/ProgramsHero.tsx
'use client';

import React from 'react';
import Link from 'next/link';

export const ProgramsHero: React.FC = () => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#002D62] via-[#0057B8] to-[#004494] text-white pt-28 pb-20 px-4 sm:px-6 lg:px-8">
      {/* Subtle 3D background visual geometry */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-[#F7931E] blur-3xl animate-pulse" />
        <div className="absolute top-1/2 right-0 w-80 h-80 rounded-full bg-[#10B981] blur-3xl" />
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }}
        />
      </div>

      <div className="relative max-w-6xl mx-auto text-center z-10">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold uppercase tracking-wider text-orange-300 mb-6 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-[#F7931E] animate-ping" />
          VEEZNA Educational Ecosystem
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight mb-6">
          Learn. Build. <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-amber-300 to-emerald-400">Transform.</span>
        </h1>

        <p className="max-w-3xl mx-auto text-base sm:text-lg lg:text-xl text-blue-100/90 font-normal leading-relaxed mb-10">
          Industry-aligned programs in communication, technology, applied psychology, financial markets, and cognitive sciences. Engineered for measurable transformation.
        </p>

        {/* Dynamic Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto pt-6 border-t border-white/15">
          <div className="p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
            <div className="text-2xl sm:text-3xl font-black text-white">6+</div>
            <div className="text-xs text-blue-200 uppercase tracking-wider mt-1">Core Disciplines</div>
          </div>
          <div className="p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
            <div className="text-2xl sm:text-3xl font-black text-[#F7931E]">100%</div>
            <div className="text-xs text-blue-200 uppercase tracking-wider mt-1">Practical Labs</div>
          </div>
          <div className="p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
            <div className="text-2xl sm:text-3xl font-black text-[#10B981]">VLS</div>
            <div className="text-xs text-blue-200 uppercase tracking-wider mt-1">LMS Integrated</div>
          </div>
          <div className="p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
            <div className="text-2xl sm:text-3xl font-black text-white">Direct</div>
            <div className="text-xs text-blue-200 uppercase tracking-wider mt-1">Mentorship</div>
          </div>
        </div>
      </div>
    </section>
  );
};