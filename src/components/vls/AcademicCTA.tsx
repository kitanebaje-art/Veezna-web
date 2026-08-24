import React from 'react';
import Link from 'next/link';

export function AcademicCTA() {
  return (
    <section id="enquire" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-[#003F88] to-[#0057B8] text-white">
      <div className="max-w-4xl mx-auto text-center">
        <p className="text-xs sm:text-sm uppercase font-bold tracking-widest text-[#FFD59E] mb-3">
          “Vision Turns Into Mission”
        </p>
        <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-6 leading-tight">
          Give Your Child More Than Tuition.<br />
          Give Them a Learning System.
        </h2>
        <p className="text-sm sm:text-base text-slate-200 mb-8 max-w-2xl mx-auto leading-relaxed">
          VEEZNA VLS – Academic Excellence helps students build strong concepts, practise consistently, identify mistakes and prepare with greater confidence.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
          <Link
            href="/apply"
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[#F7931E] hover:bg-[#e08215] text-slate-950 font-bold text-sm tracking-wide shadow-lg transition-all"
          >
            Start Your Journey
          </Link>
          <Link
            href="/apply"
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm border border-white/20 backdrop-blur-sm transition-all"
          >
            Talk to VEEZNA
          </Link>
        </div>

        <div className="pt-8 border-t border-white/10 flex flex-wrap justify-center items-center gap-6 text-xs text-slate-300 font-medium">
          <span>Classes 6th – 12th</span>
          <span>•</span>
          <span>Concept-Based Learning</span>
          <span>•</span>
          <span>Academic Guidance</span>
        </div>
      </div>
    </section>
  );
}