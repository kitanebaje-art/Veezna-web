// src/components/programs/ProgramCard.tsx
'use client';

import React, { useRef, useState } from 'react';
import Link from 'next/link';
import { Program } from '@/types/program';

interface ProgramCardProps {
  program: Program;
}

export const ProgramCard: React.FC<ProgramCardProps> = ({ program }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotX = ((y - centerY) / centerY) * -6; // max 6 deg tilt
    const rotY = ((x - centerX) / centerX) * 6;

    setRotateX(rotX);
    setRotateY(rotY);
  };

  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => {
    setIsHovered(false);
    setRotateX(0);
    setRotateY(0);
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
        transition: isHovered ? 'transform 0.1s ease-out' : 'transform 0.4s ease-out',
      }}
      className="group relative flex flex-col justify-between bg-white rounded-2xl border border-gray-200/80 shadow-md hover:shadow-2xl transition-shadow duration-300 overflow-hidden"
    >
      {/* Top Color Accent Band */}
      <div
        className="h-2 w-full transition-all duration-300 group-hover:h-2.5"
        style={{ backgroundColor: program.color || '#0057B8' }}
      />

      <div className="p-6 flex-1 flex flex-col">
        {/* Badges */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="text-xs uppercase font-bold tracking-wider px-2.5 py-1 rounded-md bg-blue-50 text-[#0057B8]">
            {program.category.replace('-', ' ')}
          </span>
          {program.popular && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
              Popular
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="text-xl font-bold text-gray-900 group-hover:text-[#0057B8] transition-colors leading-snug mb-2">
          {program.title}
        </h3>

        {/* Short Description */}
        <p className="text-sm text-gray-600 line-clamp-3 mb-6 flex-1">
          {program.shortDescription}
        </p>

        {/* Meta Grid */}
        <div className="grid grid-cols-2 gap-2 py-3 border-y border-gray-100 text-xs text-gray-600 mb-6 bg-gray-50/50 rounded-lg px-3">
          <div>
            <span className="font-semibold text-gray-900">Duration:</span> {program.duration}
          </div>
          <div>
            <span className="font-semibold text-gray-900">Level:</span> {program.level}
          </div>
          <div>
            <span className="font-semibold text-gray-900">Mode:</span> {program.mode}
          </div>
          <div>
            <span className="font-semibold text-gray-900">Modules:</span> {program.curriculum?.length || 3}
          </div>
        </div>

        {/* Key Features Preview */}
        <ul className="space-y-1.5 mb-6 text-xs text-gray-700">
          {program.features.slice(0, 3).map((feat, idx) => (
            <li key={idx} className="flex items-center gap-2">
              <span className="text-[#10B981] font-bold">✓</span>
              <span className="truncate">{feat}</span>
            </li>
          ))}
        </ul>

        {/* Pricing / Action */}
        <div className="pt-2 flex items-center justify-between mt-auto">
          {program.pricing?.displayPrice ? (
            <div>
              <span className="text-xs text-gray-500 block">Tuition</span>
              <span className="text-lg font-bold text-gray-900">
                {program.pricing.displayPrice}
              </span>
            </div>
          ) : (
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded">
              Cohort Based
            </span>
          )}

          <div className="flex items-center gap-2">
            <Link
              href={`/programs/${program.slug}`}
              className="inline-flex items-center justify-center text-sm font-semibold px-4 py-2 rounded-xl bg-gray-900 text-white group-hover:bg-[#0057B8] transition-colors focus:ring-2 focus:ring-offset-1 focus:ring-[#0057B8]"
            >
              Details →
            </Link>
            <Link
              href={`/apply?program=${program.slug}`}
              className="inline-flex items-center justify-center text-sm font-semibold px-4 py-2 rounded-xl bg-[#F7931E] text-white hover:bg-orange-600 transition-colors"
            >
              Apply
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};