// src/components/programs/ProgramFAQ.tsx
'use client';

import React, { useState } from 'react';
import { ProgramFAQItem } from '@/types/program';

interface ProgramFAQProps {
  faq: ProgramFAQItem[];
}

export const ProgramFAQ: React.FC<ProgramFAQProps> = ({ faq }) => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  if (!faq || faq.length === 0) return null;

  return (
    <div className="space-y-3">
      {faq.map((item, idx) => {
        const isOpen = openIndex === idx;
        return (
          <div key={idx} className="border border-gray-200 rounded-xl overflow-hidden bg-white">
            <button
              onClick={() => setOpenIndex(isOpen ? null : idx)}
              className="w-full flex justify-between items-center p-4 text-left font-semibold text-gray-900 hover:bg-gray-50 transition-colors"
            >
              <span>{item.question}</span>
              <span className="text-lg text-gray-500">{isOpen ? '−' : '+'}</span>
            </button>
            {isOpen && (
              <div className="p-4 pt-0 text-sm text-gray-600 border-t border-gray-100 bg-gray-50/50">
                {item.answer}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};