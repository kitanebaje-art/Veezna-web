import React from 'react';
import { CheckCircle2 } from 'lucide-react';

const HIGHLIGHTS = [
  "Clarity Before Action",
  "Concept Understanding",
  "Regular Practice",
  "Mistake Analysis",
  "Progress Improvement",
  "Academic Guidance"
];

export function WhyVLS() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-900 text-white relative overflow-hidden">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6">
            <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#F7931E] bg-[#F7931E]/10 px-3.5 py-1.5 rounded-full border border-[#F7931E]/20">
              Core Philosophy: Clarity Before Action
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white mt-4 mb-6 leading-tight">
              More Than Tuition.<br />A Learning System.
            </h2>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed mb-6">
              VLS focuses on understanding how students learn, identifying learning gaps, improving mistakes and building consistent academic habits — not simply rushing through textbook chapters.
            </p>
            <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700">
              <p className="text-xs sm:text-sm text-[#FFD59E] font-medium">
                “Understanding where a student struggles is the foundation for lasting academic discipline.”
              </p>
            </div>
          </div>

          <div className="lg:col-span-6 bg-slate-800/60 p-6 sm:p-8 rounded-2xl border border-slate-700 backdrop-blur-sm">
            <h3 className="text-base sm:text-lg font-bold text-white mb-4">
              Key Focus Areas:
            </h3>
            <ul className="space-y-3.5">
              {HIGHLIGHTS.map((item, index) => (
                <li key={index} className="flex items-start gap-3 text-xs sm:text-sm text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}