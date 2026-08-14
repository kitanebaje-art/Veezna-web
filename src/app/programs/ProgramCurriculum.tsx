// src/components/programs/ProgramCurriculum.tsx
'use client';

import React, { useState } from 'react';
import { VLSModule } from '@/types/program';

interface ProgramCurriculumProps {
  curriculum: VLSModule[];
}

export const ProgramCurriculum: React.FC<ProgramCurriculumProps> = ({ curriculum }) => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleAccordion = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  if (!curriculum || curriculum.length === 0) {
    return (
      <div className="p-6 bg-gray-50 rounded-xl text-gray-500 text-sm">
        Curriculum syllabus is currently being finalized for the upcoming batch.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {curriculum.map((module, idx) => {
        const isOpen = openIndex === idx;

        return (
          <div
            key={module.moduleId || idx}
            className="border border-gray-200 rounded-xl bg-white overflow-hidden shadow-sm transition-all"
          >
            <button
              onClick={() => toggleAccordion(idx)}
              className="w-full flex items-center justify-between p-5 text-left bg-gray-50/50 hover:bg-gray-100/70 transition-colors focus:outline-none"
              aria-expanded={isOpen}
            >
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-[#0057B8]/10 text-[#0057B8] font-bold flex items-center justify-center text-sm">
                  {idx + 1}
                </span>
                <div>
                  <h4 className="font-bold text-gray-900 text-base">{module.title}</h4>
                  {module.duration && (
                    <span className="text-xs text-gray-500">{module.duration}</span>
                  )}
                </div>
              </div>
              <span className="text-xl font-bold text-gray-500">
                {isOpen ? '−' : '+'}
              </span>
            </button>

            {isOpen && (
              <div className="p-5 border-t border-gray-100 bg-white">
                {module.description && (
                  <p className="text-sm text-gray-600 mb-4">{module.description}</p>
                )}
                <ul className="space-y-3">
                  {module.lessons.map((lesson) => (
                    <li
                      key={lesson.lessonId}
                      className="flex items-center justify-between text-sm py-2 px-3 rounded-lg bg-gray-50 border border-gray-100"
                    >
                      <div className="flex items-center gap-2 text-gray-800">
                        <span className="text-blue-600 font-bold">▪</span>
                        <span>{lesson.title}</span>
                      </div>
                      {lesson.type && (
                        <span className="text-xs uppercase tracking-wider font-semibold px-2 py-0.5 rounded bg-gray-200 text-gray-700">
                          {lesson.type.replace('_', ' ')}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};