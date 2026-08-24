import { Metadata } from 'next';
import { AcademicHero } from '@/components/vls/AcademicHero';
import { ClassFeeSection } from '@/components/vls/ClassFeeSection';
import { LearningJourney } from '@/components/vls/LearningJourney';
import { FeatureGrid } from '@/components/vls/FeatureGrid';
import { WhyVLS } from '@/components/vls/WhyVLS';
import { StudentJourney } from '@/components/vls/StudentJourney';
import { ParentSection } from '@/components/vls/ParentSection';
import { BoardClassHighlight } from '@/components/vls/BoardClassHighlight';
import { AcademicCTA } from '@/components/vls/AcademicCTA';

export const metadata: Metadata = {
  title: 'VEEZNA VLS Academic Excellence | Classes 6th to 12th',
  description:
    'VEEZNA VLS Academic Excellence provides structured academic learning for Classes 6th to 12th with concept-based learning, practice, revision, assessment and academic guidance.',
};

export default function AcademicExcellencePage() {
  return (
    <main className="min-h-screen bg-white">
      <AcademicHero />
      <WhyVLS />
      <LearningJourney />
      <ClassFeeSection />
      <BoardClassHighlight />
      <FeatureGrid />
      <StudentJourney />
      <ParentSection />
      <AcademicCTA />
    </main>
  );
}