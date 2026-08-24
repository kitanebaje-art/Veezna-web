import React from 'react';
import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';

export function AcademicHero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#003F88] via-[#0057B8] to-[#002D62] text-white pt-20 pb-24 px-4 sm:px-6 lg:px-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(247,147,30,0.15),transparent_50%)] pointer-events-none" />
      
      <div className="max-w-5xl mx-auto text-center relative z-10">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-xs sm:text-sm font-semibold text-[#FFD59E] mb-6">
          <Sparkles className="w-4 h-4 text-[#F7931E]" />
          VEEZNA VLS · Academic Excellence
        </div>

        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white mb-6 leading-tight">
          Strong Concepts.<br />
          Better Performance.<br />
          Confident Future.
        </h1>

        <p className="max-w-3xl mx-auto text-sm sm:text-base text-slate-200 leading-relaxed mb-10">
          A structured academic learning system for Classes 6th to 12th designed to build conceptual clarity, regular practice, confidence and examination readiness.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href="#classes"
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[#F7931E] hover:bg-[#e08215] text-slate-950 font-bold text-sm tracking-wide shadow-lg shadow-[#F7931E]/20 transition-all duration-200 flex items-center justify-center gap-2"
          >
            Explore Program
            <ArrowRight className="w-4 h-4" />
          </a>
          <Link
            href="/apply"
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm border border-white/20 backdrop-blur-sm transition-all duration-200 flex items-center justify-center"
          >
            Enquire Now
          </Link>
        </div>
      </div>
    </section>
  );
}