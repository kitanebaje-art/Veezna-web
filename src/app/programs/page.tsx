// src/app/programs/page.tsx
import { Metadata } from 'next';
import { getAllPrograms } from '@/data/programs';
import ProgramsClientView from './ProgramsClientView';

export const metadata: Metadata = {
  title: 'Programs & Learning Paths | VEEZNA',
  description:
    'Explore VEEZNA flagship programs in Executive Communication (Veezna Vox), Psychology & Hypnotherapy (Veezna Wellness), Financial Markets (Veezna Spark), Full Stack Development, and AI Engineering.',
  openGraph: {
    title: 'VEEZNA Programs — Learn. Build. Transform.',
    description:
      'Professional training programs designed for real-world excellence and high-velocity career transformation.',
    url: 'https://veezna.com/programs',
    siteName: 'VEEZNA',
    type: 'website',
  },
};

export default async function ProgramsPage() {
  // Promise.resolve use kiya hai taaki sync ya async dono tarah ke data load ho sakein
  const programs = await Promise.resolve(getAllPrograms());

  return (
    <main className="min-h-screen bg-gray-50">
      <ProgramsClientView initialPrograms={programs} />
    </main>
  );
}