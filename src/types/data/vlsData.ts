// src/data/vlsData.ts
export interface ClassTier {
  id: string;
  grade: string;
  classNumber: number;
  tagline: string;
  annualFee: string;
  focus: string[];
  isBoard?: boolean;
}

export const CLASS_TIERS: ClassTier[] = [
  {
    id: "class-6",
    grade: "Class 6",
    classNumber: 6,
    tagline: "Build the Foundation",
    annualFee: "₹9,400",
    focus: ["Developing strong basic concepts", "Healthy learning habits", "Academic confidence"]
  },
  {
    id: "class-7",
    grade: "Class 7",
    classNumber: 7,
    tagline: "Strengthen Your Concepts",
    annualFee: "₹10,800",
    focus: ["Improving core understanding", "Regular subject practice", "Academic consistency"]
  },
  {
    id: "class-8",
    grade: "Class 8",
    classNumber: 8,
    tagline: "Prepare for the Next Level",
    annualFee: "₹12,200",
    focus: ["Conceptual understanding", "Problem-solving skills", "Stronger academic discipline"]
  },
  {
    id: "class-9",
    grade: "Class 9",
    classNumber: 9,
    tagline: "Build Your Academic Strength",
    annualFee: "₹13,700",
    focus: ["Deeper conceptual depth", "Systematic syllabus coverage", "Examination readiness"]
  },
  {
    id: "class-10",
    grade: "Class 10",
    classNumber: 10,
    tagline: "Board-Year Excellence",
    annualFee: "₹15,100",
    focus: ["Concept clarity", "Intensive practice", "Targeted revision", "Test series", "Examination strategy"],
    isBoard: true
  },
  {
    id: "class-11",
    grade: "Class 11",
    classNumber: 11,
    tagline: "Choose Your Direction",
    annualFee: "₹16,600",
    focus: ["Stream-specific foundations", "Conceptual depth", "Rigorous preparation for Class 12"]
  },
  {
    id: "class-12",
    grade: "Class 12",
    classNumber: 12,
    tagline: "Perform With Confidence",
    annualFee: "₹18,000",
    focus: ["Conceptual depth", "Regular practice", "Multi-tier revision", "Test preparation", "Board examination readiness"],
    isBoard: true
  }
];

export const VLS_STEPS = [
  {
    step: "01",
    title: "Understand",
    description: "Learn concepts through guided explanation rather than blindly memorising answers."
  },
  {
    step: "02",
    title: "Practice",
    description: "Apply concepts through regular daily questions and structured problem-solving activities."
  },
  {
    step: "03",
    title: "Identify Mistakes",
    description: "Find recurring mistakes, calculation flaws, and conceptual weak areas proactively."
  },
  {
    step: "04",
    title: "Improve",
    description: "Work specifically on diagnosed learning gaps with targeted guidance and worksheets."
  },
  {
    step: "05",
    title: "Revise",
    description: "Strengthen important concepts, formulas, and theorems through scheduled revision cycles."
  },
  {
    step: "06",
    title: "Perform",
    description: "Develop the self-assurance and time management needed to perform confidently in school examinations."
  }
];

export const VLS_FEATURES = [
  { title: "Concept-Based Learning", desc: "Builds deep logic and comprehension rather than mechanical formula memorisation." },
  { title: "Regular Practice", desc: "Daily and weekly problem sets aligned with school syllabus standards." },
  { title: "Doubt Support", desc: "Prompt resolution of individual subject queries so no student lags behind." },
  { title: "Homework Guidance", desc: "Structured mentoring on assignments, projects, and presentation techniques." },
  { title: "Revision Support", desc: "Systematic multi-tier reviews that prevent conceptual memory fade." },
  { title: "Tests & Assessments", desc: "Simulated exam conditions to assess mastery and benchmark progress." },
  { title: "Mistake Analysis", desc: "Post-test diagnostic breakdown to convert recurring errors into strengths." },
  { title: "Progress Tracking", desc: "Regular evaluation metrics shared transparently to map academic growth." },
  { title: "Personal Attention", desc: "Focused batch dynamics allowing mentors to address individual learning styles." },
  { title: "Examination Preparation", desc: "Strategic time-management and answer-structuring tactics for maximum clarity." },
  { title: "Confidence Building", desc: "Supportive academic culture that transforms exam anxiety into self-belief." },
  { title: "Academic Guidance", desc: "Ongoing mentorship for long-term goal setting and study routine discipline." }
];

export const STUDENT_JOURNEY_STEPS = [
  "Assessment",
  "Learning Plan",
  "Concept Building",
  "Practice",
  "Tests",
  "Mistake Analysis",
  "Revision",
  "Improvement"
];