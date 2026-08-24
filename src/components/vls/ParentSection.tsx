import React from 'react';
import { Eye, BookOpen, Wrench, ShieldCheck } from 'lucide-react';

const PARENT_CARDS = [
  { title: "Understand", desc: "Better conceptual clarity", icon: Eye },
  { title: "Practice", desc: "Regular academic practice", icon: BookOpen },
  { title: "Improve", desc: "Identify and work on weak areas", icon: Wrench },
  { title: "Perform", desc: "Prepare with greater confidence", icon: ShieldCheck }
];

export function ParentSection() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-50 border-t border-slate-200">
      <div className="max-w-6xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            For Parents
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 mt-3 mb-4">
            Progress Beyond Just Marks
          </h2>
          <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
            Your child's progress is not only about marks. It is also about understanding, consistency, confidence and learning habits.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {PARENT_CARDS.map((card, idx) => {
            const Icon = card.icon;
            return (
              <div key={idx} className="p-6 rounded-2xl bg-white border border-slate-200 text-center shadow-sm">
                <div className="w-12 h-12 mx-auto rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-1">{card.title}</h3>
                <p className="text-xs sm:text-sm text-slate-600">{card.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}