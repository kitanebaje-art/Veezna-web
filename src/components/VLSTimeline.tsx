import React from 'react';

const steps = [
  { step: '01', title: 'Learn', desc: 'Absorb foundational concepts from certified academic mentors and specialists.', color: 'border-[#0057B8]' },
  { step: '02', title: 'Understand', desc: 'Deconstruct complex theories through cognitive mapping and practical examples.', color: 'border-[#00BFFF]' },
  { step: '03', title: 'Practice', desc: 'Engage in structured exercises, mock tests, and real-world simulation scenarios.', color: 'border-[#F7931E]' },
  { step: '04', title: 'Apply', desc: 'Execute live projects, deliver public presentations, and solve practical challenges.', color: 'border-emerald-500' },
  { step: '05', title: 'Improve', desc: 'Receive personalized feedback, diagnostic insights, and targeted guidance.', color: 'border-indigo-500' },
  { step: '06', title: 'Achieve', desc: 'Attain academic excellence, career readiness, and personal transformation.', color: 'border-purple-500' },
];

export default function VLSTimeline() {
  return (
    <section className="py-24 bg-slate-50 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold text-[#0057B8] uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
            Methodology
          </span>
          <h2 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight mt-4">
            The Veezna Learning System (VLS)
          </h2>
          <p className="text-slate-600 text-base sm:text-lg mt-4 leading-relaxed">
            Our structured 6-phase framework transitions students from rote memorization into real understanding and sustainable performance.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 relative z-10">
          {steps.map((item, idx) => (
            <div
              key={idx}
              className={`bg-white rounded-3xl p-8 border-t-4 ${item.color} shadow-lg shadow-slate-200/50 hover-lift relative group`}
            >
              <div className="flex items-center justify-between mb-6">
                <span className="text-4xl font-black text-slate-200 group-hover:text-[#0057B8] transition-colors">
                  {item.step}
                </span>
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-[#0057B8] group-hover:text-white transition-all">
                  →
                </div>
              </div>
              <h3 className="text-2xl font-extrabold text-slate-900 mb-2">{item.title}</h3>
              <p className="text-slate-600 text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}