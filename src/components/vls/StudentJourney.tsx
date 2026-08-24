import React from 'react';
import { ChevronDown } from 'lucide-react';

const JOURNEY_STEPS = [
  "Assessment",
  "Learning Plan",
  "Concept Building",
  "Practice",
  "Tests",
  "Mistake Analysis",
  "Revision",
  "Improvement"
];

export function StudentJourney() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#0057B8] bg-[#0057B8]/10 px-3 py-1 rounded-full">
            Structured Pathway
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 mt-3 mb-4">
            The Student Learning Journey
          </h2>
          <p className="text-slate-600 text-sm sm:text-base">
            From baseline diagnostic assessment to sustained academic improvement.
          </p>
        </div>

        {/* Desktop Horizontal View */}
        <div className="hidden lg:flex items-center justify-between relative">
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-200 -translate-y-1/2 z-0" />
          {JOURNEY_STEPS.map((step, idx) => (
            <div key={idx} className="relative z-10 flex flex-col items-center group">
              <div className="w-10 h-10 rounded-full bg-white border-2 border-[#0057B8] text-[#0057B8] group-hover:bg-[#0057B8] group-hover:text-white transition-colors duration-200 flex items-center justify-center font-bold text-xs shadow-sm">
                {idx + 1}
              </div>
              <span className="mt-3 text-xs font-bold text-slate-800 text-center max-w-[90px]">
                {step}
              </span>
            </div>
          ))}
        </div>

        {/* Mobile / Tablet Vertical View */}
        <div className="lg:hidden flex flex-col items-center space-y-3">
          {JOURNEY_STEPS.map((step, idx) => (
            <React.Fragment key={idx}>
              <div className="w-full max-w-xs flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200 shadow-sm">
                <span className="w-7 h-7 rounded-full bg-[#0057B8] text-white flex items-center justify-center text-xs font-bold shrink-0">
                  {idx + 1}
                </span>
                <span className="text-sm font-bold text-slate-800">{step}</span>
              </div>
              {idx < JOURNEY_STEPS.length - 1 && (
                <ChevronDown className="w-4 h-4 text-[#F7931E]" />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </section>
  );
}