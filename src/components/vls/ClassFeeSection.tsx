import React from 'react';
import Link from 'next/link';
import { Check, ArrowRight } from 'lucide-react';

const CLASSES = [
  {
    grade: "Class 6th",
    tagline: "Build the Foundation",
    annualFee: "₹9,400",
    focus: ["Developing strong basic concepts", "Healthy learning habits", "Academic confidence"],
    isBoard: false
  },
  {
    grade: "Class 7th",
    tagline: "Strengthen Your Concepts",
    annualFee: "₹10,800",
    focus: ["Improving core understanding", "Regular subject practice", "Academic consistency"],
    isBoard: false
  },
  {
    grade: "Class 8th",
    tagline: "Prepare for the Next Level",
    annualFee: "₹12,200",
    focus: ["Conceptual understanding", "Problem-solving skills", "Stronger academic discipline"],
    isBoard: false
  },
  {
    grade: "Class 9th",
    tagline: "Build Your Academic Strength",
    annualFee: "₹13,700",
    focus: ["Deeper conceptual depth", "Systematic syllabus coverage", "Examination readiness"],
    isBoard: false
  },
  {
    grade: "Class 10th",
    tagline: "Board-Year Excellence",
    annualFee: "₹15,100",
    focus: ["Concept clarity", "Board-oriented practice", "Revision support", "Tests & assessments", "Examination preparation"],
    isBoard: true
  },
  {
    grade: "Class 11th",
    tagline: "Choose Your Direction",
    annualFee: "₹16,600",
    focus: ["Stream-specific foundations", "Conceptual depth", "Rigorous preparation for Class 12"],
    isBoard: false
  },
  {
    grade: "Class 12th",
    tagline: "Perform With Confidence",
    annualFee: "₹18,000",
    focus: ["Conceptual depth", "Regular practice", "Spaced revision", "Test preparation", "Board examination readiness"],
    isBoard: true
  }
];

export function ClassFeeSection() {
  return (
    <section id="classes" className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#0057B8] bg-[#0057B8]/10 px-3 py-1 rounded-full">
            Transparent Structure
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 mt-3 mb-4">
            Choose Your Academic Journey
          </h2>
          <p className="text-slate-600 text-sm sm:text-base">
            Structured annual academic programs tailored to each grade level with zero hidden charges.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {CLASSES.map((item, idx) => (
            <div
              key={idx}
              className={`relative flex flex-col rounded-2xl bg-white p-6 shadow-sm border transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
                item.isBoard
                  ? 'border-[#F7931E] ring-1 ring-[#F7931E]/30 bg-gradient-to-b from-orange-50/20 to-white'
                  : 'border-slate-200'
              }`}
            >
              {item.isBoard && (
                <div className="absolute -top-3 right-4 px-3 py-0.5 rounded-full bg-[#F7931E] text-slate-950 font-extrabold text-[10px] uppercase tracking-wider shadow-sm">
                  Board Focus
                </div>
              )}

              <div className="mb-4">
                <span className="inline-block px-3 py-1 rounded-lg bg-[#0057B8]/10 text-[#0057B8] font-bold text-xs uppercase tracking-wide">
                  {item.grade}
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-2">{item.tagline}</h3>
              </div>

              <div className="mb-6 pb-6 border-b border-slate-100">
                <p className="text-xs text-slate-500 font-medium">Annual Program Fee</p>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">{item.annualFee}</span>
                  <span className="text-xs font-medium text-slate-500">/ Year</span>
                </div>
              </div>

              <div className="flex-1 mb-6">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">Key Focus</p>
                <ul className="space-y-2.5">
                  {item.focus.map((focusItem, fIdx) => (
                    <li key={fIdx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-600">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{focusItem}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Link
                href="/apply"
                className={`w-full py-2.5 px-4 rounded-xl font-semibold text-xs text-center transition-colors duration-200 flex items-center justify-center gap-1.5 ${
                  item.isBoard
                    ? 'bg-[#F7931E] hover:bg-[#e08215] text-slate-950'
                    : 'bg-[#0057B8] hover:bg-[#003F88] text-white'
                }`}
              >
                Enquire Now
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}