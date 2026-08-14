export interface Program {
  id: string;
  title: string;
  duration: string;
  fee: number;
  registrationFee: number;
  seats: number;
  startDate: string;
  description: string;
}

export const PROGRAMS: Program[] = [
  {
    id: 'academic',
    title: 'Academic Excellence',
    duration: '1 Year',
    fee: 45000,
    registrationFee: 1500,
    seats: 12,
    startDate: '15 Aug 2026',
    description: 'Concept coaching for Class 6–12 Board Exams',
  },
  {
    id: 'vox',
    title: 'Veezna Vox',
    duration: '6 Months',
    fee: 25000,
    registrationFee: 1000,
    seats: 8,
    startDate: '20 Aug 2026',
    description: 'Spoken English, Fluency & Public Speaking',
  },
  {
    id: 'web',
    title: 'Web Development',
    duration: '6 Months',
    fee: 35000,
    registrationFee: 1000,
    seats: 5,
    startDate: '01 Sep 2026',
    description: 'Full Stack Next.js, React & Modern Web Technology',
  },
  {
    id: 'wellness',
    title: 'Wellness & Care',
    duration: 'Flexible',
    fee: 15000,
    registrationFee: 500,
    seats: 15,
    startDate: 'Immediate',
    description: 'Ethical guidance & mental wellbeing',
  },
];

export const GENERAL_DISCOUNT = 2000;