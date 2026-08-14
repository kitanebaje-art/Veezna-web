// src/types/program.ts

export type ProgramCategory =
  | 'all'
  | 'communication'
  | 'wellness'
  | 'business'
  | 'technology'
  | 'academic'
  | 'professional-skills';

export type ProgramLevel = 'Beginner' | 'Intermediate' | 'Advanced' | 'All Levels';
export type ProgramMode = 'Live Online' | 'Hybrid' | 'On-Campus' | 'Self-Paced';
export type ProgramStatus = 'draft' | 'active' | 'published' | 'archived';

// Compatible with future Veezna Learning System (VLS)
export interface VLSLesson {
  lessonId: string;
  title: string;
  duration?: string;
  type?: 'video' | 'live_session' | 'assignment' | 'quiz' | 'reading';
  isFreePreview?: boolean;
}

export interface VLSModule {
  moduleId: string;
  title: string;
  description?: string;
  duration?: string;
  lessons: VLSLesson[];
}

export interface ProgramFAQItem {
  question: string;
  answer: string;
}

export interface ProgramPricing {
  amount: number;
  currency: string;
  registrationFee?: number;
  discountPercentage?: number;
  installmentsAvailable?: boolean;
  displayPrice?: string;
}

export interface Program {
  id: string;
  slug: string;
  title: string;
  shortTitle: string;
  category: ProgramCategory;
  tagline: string;
  shortDescription: string;
  longDescription: string;
  icon: string; // Lucide icon identifier or SVG path
  image: string;
  heroImage?: string;
  color: string; // Primary brand/category HEX or Tailwind class
  accentColor: string;
  level: ProgramLevel;
  duration: string;
  mode: ProgramMode;
  certificate: string;
  pricing?: ProgramPricing;
  featured: boolean;
  popular?: boolean;
  status: ProgramStatus;
  order: number;
  features: string[];
  highlights: { title: string; description: string; icon?: string }[];
  skills: string[];
  outcomes: string[];
  audience: string[];
  requirements: string[];
  curriculum: VLSModule[];
  faq: ProgramFAQItem[];
  ctaText?: string;
  nextBatchDate?: string;
}