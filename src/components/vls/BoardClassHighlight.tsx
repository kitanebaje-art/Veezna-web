import React from 'react';
import Link from 'next/link';
import { Check } from 'lucide-react';

export function BoardClassHighlight() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#F7931E] bg-[#F7931E]/10 px-3 py-1 rounded-full">
            Board Focus
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 mt-3 mb-4">
            Board-Year Highlights: Class 10 & 12
          </h2>
          <p className="text-slate-600 text-sm sm:text-base">
            Specialized curriculum pacing, answer-presentation workshops, and rigorous test series.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Class 10 */}
          <div className="p-8 rounded-3xl bg-gradient-to-br from-amber-50/50 to-white border-2 border-[#F7931E]/40 shadow-lg relative flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className="px-3 py-1 rounded-md bg-[#F7931E] text-slate-950 font-extrabold text-xs">CLASS 10</span>
                  <h3 className="text-2xl font-bold text-slate-900 mt-2">Board-Year Excellence</h3>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-500 font-medium block">Annual Fee</span>
                  <span className="text-2xl font-extrabold text-slate-900">₹15,100</span>
                </div>
              </div>
              <p className="text-xs uppercase font-bold tracking-wider text-slate-400 mb-3">Core Focus:</p>
              <ul className="space-y-2.5 mb-8">
                {[
                  "Concept clarity",
                  "Board-oriented practice",
                  "Revision support",
                  "Tests and assessments",
                  "Examination preparation"
                ].map((item, idx) => (
                  <li key={idx} className="flex items-center gap-2.5 text-sm text-slate-700">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <Link
              href="/apply"
              className="w-full py-3 rounded-xl bg-[#F7931E] hover:bg-[#e08215] text-slate-950 font-bold text-center text-sm transition-colors"
            >
              Enquire for Class 10
            </Link>
          </div>

          {/* Class 12 */}
          <div className="p-8 rounded-3xl bg-gradient-to-br from-blue-50/50 to-white border-2 border-[#0057B8]/40 shadow-lg relative flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className="px-3 py-1 rounded-md bg-[#0057B8] text-white font-extrabold text-xs">CLASS 12</span>
                  <h3 className="text-2xl font-bold text-slate-900 mt-2">Perform With Confidence</h3>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-500 font-medium block">Annual Fee</span>
                  <span className="text-2xl font-extrabold text-slate-900">₹18,000</span>
                </div>
              </div>
              <p className="text-xs uppercase font-bold tracking-wider text-slate-400 mb-3">Core Focus:</p>
              <ul className="space-y-2.5 mb-8">
                {[
                  "Conceptual depth",
                  "Regular practice",
                  "Revision",
                  "Test preparation",
                  "Board examination readiness"
                ].map((item, idx) => (
                  <li key={idx} className="flex items-center gap-2.5 text-sm text-slate-700">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <Link
              href="/apply"
              className="w-full py-3 rounded-xl bg-[#0057B8] hover:bg-[#003F88] text-white font-bold text-center text-sm transition-colors"
            >
              Enquire for Class 12
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}