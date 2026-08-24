import React from 'react';

const STAGES = [
  {
    step: "01",
    title: "Understand",
    desc: "Learn concepts instead of blindly memorising answers."
  },
  {
    step: "02",
    title: "Practice",
    desc: "Apply concepts through regular daily questions and structured problem-solving activities."
  },
  {
    step: "03",
    title: "Identify Mistakes",
    desc: "Find recurring mistakes, calculation flaws, and conceptual weak areas proactively."
  },
  {
    step: "04",
    title: "Improve",
    desc: "Work specifically on diagnosed learning gaps with targeted guidance and worksheets."
  },
  {
    step: "05",
    title: "Revise",
    desc: "Strengthen important concepts, formulas, and theorems through scheduled revision cycles."
  },
  {
    step: "06",
    title: "Perform",
    desc: "Develop the self-assurance and time management needed to perform confidently in school examinations."
  }
];

export function LearningJourney() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#0057B8] bg-[#0057B8]/10 px-3 py-1 rounded-full">
            Our Methodology
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 mt-3 mb-4">
            How VLS Helps Students Learn Better
          </h2>
          <p className="text-slate-600 text-sm sm:text-base">
            A continuous six-stage learning system transforming passive memorisation into conceptual mastery.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {STAGES.map((stage) => (
            <div
              key={stage.step}
              className="relative p-6 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-[#0057B8]/40 transition-all duration-300 hover:shadow-md"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-2xl font-black text-[#0057B8]/40 font-mono">{stage.step}</span>
                <span className="w-2.5 h-2.5 rounded-full bg-[#F7931E]" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">{stage.title}</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{stage.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}