import React from 'react';
import { 
  BookOpen, Edit3, HelpCircle, FileText, RotateCcw, 
  Award, AlertTriangle, TrendingUp, UserCheck, 
  GraduationCap, Smile, Compass 
} from 'lucide-react';

const FEATURES = [
  { title: "Concept-Based Learning", desc: "Builds deep logic and comprehension rather than mechanical formula memorisation.", icon: BookOpen },
  { title: "Regular Practice", desc: "Daily and weekly problem sets aligned with school syllabus standards.", icon: Edit3 },
  { title: "Doubt Support", desc: "Prompt resolution of individual subject queries so no student lags behind.", icon: HelpCircle },
  { title: "Homework Guidance", desc: "Structured mentoring on assignments, projects, and presentation techniques.", icon: FileText },
  { title: "Revision Support", desc: "Systematic multi-tier reviews that prevent conceptual memory fade.", icon: RotateCcw },
  { title: "Tests & Assessments", desc: "Simulated exam conditions to assess mastery and benchmark progress.", icon: Award },
  { title: "Mistake Analysis", desc: "Post-test diagnostic breakdown to convert recurring errors into strengths.", icon: AlertTriangle },
  { title: "Progress Tracking", desc: "Regular evaluation metrics shared transparently to map academic growth.", icon: TrendingUp },
  { title: "Personal Attention", desc: "Focused batch dynamics allowing mentors to address individual learning styles.", icon: UserCheck },
  { title: "Examination Preparation", desc: "Strategic time-management and answer-structuring tactics for maximum clarity.", icon: GraduationCap },
  { title: "Confidence Building", desc: "Supportive academic culture that transforms exam anxiety into self-belief.", icon: Smile },
  { title: "Academic Guidance", desc: "Ongoing mentorship for long-term goal setting and study routine discipline.", icon: Compass }
];

export function FeatureGrid() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-50 border-y border-slate-200">
      <div className="max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#0057B8] bg-[#0057B8]/10 px-3 py-1 rounded-full">
            Complete Framework
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 mt-3 mb-4">
            Structured Academic Features
          </h2>
          <p className="text-slate-600 text-sm sm:text-base">
            Every feature is designed to support student consistency, clarity, and genuine confidence.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {FEATURES.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <div
                key={idx}
                className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:border-[#0057B8]/30 transition-all duration-200 flex flex-col"
              >
                <div className="w-10 h-10 rounded-xl bg-[#0057B8]/10 text-[#0057B8] flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-1.5">{feature.title}</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{feature.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}