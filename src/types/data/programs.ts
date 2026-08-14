// src/data/programs.ts
import { Program, ProgramCategory } from '@/types/program';

export const PROGRAM_CATEGORIES: { id: ProgramCategory; label: string }[] = [
  { id: 'all', label: 'All Programs' },
  { id: 'communication', label: 'Communication' },
  { id: 'wellness', label: 'Wellness & Psychology' },
  { id: 'business', label: 'Business & Finance' },
  { id: 'technology', label: 'Technology & AI' },
  { id: 'academic', label: 'Academic Excellence' },
  { id: 'professional-skills', label: 'Professional Skills' },
];

export const PROGRAMS_DATA: Program[] = [
  {
    id: 'prog-vox-01',
    slug: 'veezna-vox',
    title: 'Veezna Vox — Spoken English & Executive Communication',
    shortTitle: 'Veezna Vox',
    category: 'communication',
    tagline: 'Master English fluency, public speaking, and executive presence.',
    shortDescription: 'Comprehensive training in spoken English, conversational nuance, business articulation, and vocal confidence.',
    longDescription: 'Veezna Vox is an immersive communication mastery program designed to break conversational barriers. Blending speech psychology, phonetic refinement, and practical impromptu speaking drills, it equips learners and professionals to speak persuasively in global environments.',
    icon: 'Mic',
    image: '/images/programs/vox.jpg',
    heroImage: '/images/programs/vox-hero.jpg',
    color: '#0057B8',
    accentColor: '#F7931E',
    level: 'All Levels',
    duration: '12 Weeks',
    mode: 'Live Online',
    certificate: 'VEEZNA Executive Communication Certification',
    featured: true,
    popular: true,
    status: 'published',
    order: 1,
    pricing: {
      amount: 8999,
      currency: 'INR',
      displayPrice: '₹8,999',
      discountPercentage: 20
    },
    features: [
      '1-on-1 Personalized Speech Feedback',
      'Live Impromptu & Debate Labs',
      'Accent Softening & Phonetics',
      'Workplace & Business Articulation'
    ],
    highlights: [
      { title: 'Confidence First', description: 'Overcome hesitation through daily live speaking circles.' },
      { title: 'Corporate Readiness', description: 'Master interviews, email etiquette, and pitch decks.' },
      { title: 'Phonetic Precision', description: 'Master international pronunciation frameworks.' }
    ],
    skills: ['Spoken English', 'Public Speaking', 'Active Listening', 'Business Presentation', 'Body Language', 'Debate & Persuasion'],
    outcomes: [
      'Deliver flawless impromptu speeches and corporate presentations',
      'Eliminate hesitation, filler words, and mother-tongue influence',
      'Crack high-stakes job interviews and executive discussions'
    ],
    audience: ['Students entering professional life', 'Working professionals seeking promotions', 'Entrepreneurs pitching to clients'],
    requirements: ['Basic understanding of reading and writing simple English', 'Stable internet connection and microphone'],
    curriculum: [
      {
        moduleId: 'vox-mod-01',
        title: 'Module 1: Foundations of Fluency & Speech Psychology',
        duration: '3 Weeks',
        lessons: [
          { lessonId: 'vox-l-01', title: 'Diagnosing Hesitation & Speech Anxiety', type: 'live_session' },
          { lessonId: 'vox-l-02', title: 'Sentence Structuring in Real-time Thinking', type: 'video' },
          { lessonId: 'vox-l-03', title: 'Phonetics, Intonation, and Rhythm', type: 'live_session' }
        ]
      },
      {
        moduleId: 'vox-mod-02',
        title: 'Module 2: The Art of Professional & Executive Articulation',
        duration: '4 Weeks',
        lessons: [
          { lessonId: 'vox-l-04', title: 'Executive Vocabulary & Contextual Nuance', type: 'video' },
          { lessonId: 'vox-l-05', title: 'Storytelling Frameworks in Business', type: 'live_session' },
          { lessonId: 'vox-l-06', title: 'Managing Difficult Conversations & Q&A', type: 'assignment' }
        ]
      },
      {
        moduleId: 'vox-mod-03',
        title: 'Module 3: Public Speaking, Pitching & Global Fluency',
        duration: '5 Weeks',
        lessons: [
          { lessonId: 'vox-l-07', title: 'Stage Presence, Camera Poise & Body Language', type: 'live_session' },
          { lessonId: 'vox-l-08', title: 'The Capstone Live Showcase', type: 'live_session' }
        ]
      }
    ],
    faq: [
      { question: 'Is this suitable for beginners?', answer: 'Yes. We conduct an initial baseline assessment and group learners into suitable cohorts.' },
      { question: 'Will I get recorded sessions?', answer: 'Yes, all live sessions are recorded and made available inside your VLS student portal.' }
    ]
  },
  {
    id: 'prog-well-02',
    slug: 'veezna-wellness',
    title: 'Veezna Wellness — Applied Psychology, Counselling & Hypnotherapy',
    shortTitle: 'Veezna Wellness',
    category: 'wellness',
    tagline: 'Deepen understanding of human behavior, therapeutic tools, and emotional mastery.',
    shortDescription: 'A scientifically rooted curriculum in counseling skills, cognitive behavioral strategies, emotional regulation, and clinical hypnotherapy concepts.',
    longDescription: 'Veezna Wellness combines empirical psychological science with practical therapeutic intervention methods. Designed for aspiring practitioners, educators, and individuals seeking profound mental clarity.',
    icon: 'HeartHandshake',
    image: '/images/programs/wellness.jpg',
    heroImage: '/images/programs/wellness-hero.jpg',
    color: '#0D9488',
    accentColor: '#F7931E',
    level: 'Intermediate',
    duration: '16 Weeks',
    mode: 'Hybrid',
    certificate: 'VEEZNA Applied Counselling & Mind Sciences Certificate',
    featured: true,
    popular: false,
    status: 'published',
    order: 2,
    pricing: {
      amount: 14999,
      currency: 'INR',
      displayPrice: '₹14,999'
    },
    features: [
      'Case Study Analysis & Supervision',
      'Foundations of CBT & Somatic Awareness',
      'Hypnotherapy & Guided Visualization Practicum',
      'Ethics & Boundary Management in Therapy'
    ],
    highlights: [
      { title: 'Evidence-Based', description: 'Grounded in modern neuroscience and behavioral psychology.' },
      { title: 'Clinical Insights', description: 'Learn guided protocols for stress, trauma, and mindset shifts.' }
    ],
    skills: ['Active Empathetic Listening', 'Cognitive Restructuring', 'Hypnotherapeutic Induction', 'Emotional Regulation', 'Crisis Assessment'],
    outcomes: [
      'Facilitate structured, ethical one-on-one counseling consultations',
      'Understand subconscious reprogramming and guided relaxation methodologies',
      'Integrate emotional wellness frameworks into professional practices'
    ],
    audience: ['Psychology graduates', 'HR leaders & life coaches', 'Healthcare practitioners'],
    requirements: ['Undergraduate degree or foundational curiosity in human behavior'],
    curriculum: [
      {
        moduleId: 'well-mod-01',
        title: 'Module 1: Cognitive Frameworks & Empathetic Rapport',
        lessons: [
          { lessonId: 'well-l-01', title: 'Neurobiology of Emotion & Stress', type: 'video' },
          { lessonId: 'well-l-02', title: 'Rapport Building & Non-judgmental Inquiry', type: 'live_session' }
        ]
      },
      {
        moduleId: 'well-mod-02',
        title: 'Module 2: Applied Hypnotherapy & Mind Science',
        lessons: [
          { lessonId: 'well-l-03', title: 'The Architecture of the Subconscious', type: 'video' },
          { lessonId: 'well-l-04', title: 'Safe Induction & Deepening Techniques', type: 'live_session' }
        ]
      }
    ],
    faq: [
      { question: 'Can I practice after this course?', answer: 'This course provides foundational certification in counseling techniques and mind science methodologies suitable for coaching and institutional support.' }
    ]
  },
  {
    id: 'prog-spark-03',
    slug: 'veezna-spark',
    title: 'Veezna Spark — Modern Business, Trading & Financial Acumen',
    shortTitle: 'Veezna Spark',
    category: 'business',
    tagline: 'Master technical market analysis, capital management, and enterprise strategy.',
    shortDescription: 'An analytical program covering financial markets, risk modeling, equity & derivative analysis, and scalable modern business architecture.',
    longDescription: 'Veezna Spark bridges the gap between theoretical finance and high-conviction market execution. Build actionable understanding of market mechanics, macroeconomic trends, and risk management.',
    icon: 'TrendingUp',
    image: '/images/programs/spark.jpg',
    color: '#0057B8',
    accentColor: '#10B981',
    level: 'All Levels',
    duration: '10 Weeks',
    mode: 'Live Online',
    certificate: 'VEEZNA Financial Markets & Enterprise Strategy Certification',
    featured: true,
    popular: true,
    status: 'published',
    order: 3,
    pricing: {
      amount: 11999,
      currency: 'INR',
      displayPrice: '₹11,999'
    },
    features: [
      'Live Trading Simulations & Order Flow',
      'Risk-to-Reward System Design',
      'Macroeconomic Indicator Analysis',
      'Venture Financial Modeling'
    ],
    highlights: [
      { title: 'Capital Protection', description: 'Zero-tolerance risk management algorithms.' },
      { title: 'Real Market Drills', description: 'Hands-on chart breakdowns and live market reviews.' }
    ],
    skills: ['Price Action Analysis', 'Risk Management', 'Derivatives & Hedging', 'Balance Sheet Analysis', 'Portfolio Optimization'],
    outcomes: [
      'Construct and execute disciplined financial market trade plans',
      'Analyze business balance sheets and macroeconomic cycles',
      'Manage portfolio volatility with institutional risk frameworks'
    ],
    audience: ['Active traders', 'Aspiring business founders', 'Finance students'],
    requirements: ['Basic arithmetic and an analytical mindset'],
    curriculum: [
      {
        moduleId: 'spark-mod-01',
        title: 'Module 1: Market Structure & Technical Mechanics',
        lessons: [
          { lessonId: 'spk-l-01', title: 'Auction Theory & Liquidity Zones', type: 'video' },
          { lessonId: 'spk-l-02', title: 'Indicator Redundancy vs Pure Price Action', type: 'live_session' }
        ]
      }
    ],
    faq: [
      { question: 'Do you give direct investment advice?', answer: 'No, Veezna Spark is an educational program focused on building analytical skills and independent risk systems.' }
    ]
  },
  {
    id: 'prog-tech-04',
    slug: 'full-stack-web-development',
    title: 'Full Stack Modern Web Engineering',
    shortTitle: 'Full Stack Development',
    category: 'technology',
    tagline: 'Architect high-scale React, Next.js, Node.js, and Cloud native applications.',
    shortDescription: 'Production-grade software engineering curriculum covering modern frontend architectures, backend APIs, distributed databases, and CI/CD pipelines.',
    longDescription: 'Go beyond basic tutorials. Build production systems handling authentication, caching, ACID transactions, and modern serverless workflows with Next.js, TypeScript, PostgreSQL, and Firebase.',
    icon: 'Code2',
    image: '/images/programs/fullstack.jpg',
    color: '#0057B8',
    accentColor: '#6366F1',
    level: 'Intermediate',
    duration: '20 Weeks',
    mode: 'Hybrid',
    certificate: 'VEEZNA Full Stack Software Engineer Diploma',
    featured: true,
    popular: true,
    status: 'published',
    order: 4,
    pricing: {
      amount: 24999,
      currency: 'INR',
      displayPrice: '₹24,999'
    },
    features: [
      '5 Production Grade Micro-Projects & 1 Flagship Capstone',
      'System Design & Microservices Architecture',
      'Database Optimization & Redis Caching',
      'Weekly Code Reviews by Senior Engineers'
    ],
    highlights: [
      { title: 'Industry Stack', description: 'Next.js App Router, TypeScript, Tailwind, Docker, PostgreSQL.' },
      { title: 'Deploy to Production', description: 'Automated CI/CD pipelines on AWS and Vercel.' }
    ],
    skills: ['TypeScript', 'Next.js', 'React Server Components', 'PostgreSQL', 'Prisma / Drizzle', 'Firebase', 'Docker', 'REST & GraphQL'],
    outcomes: [
      'Design, build, and deploy full-stack web applications from scratch',
      'Implement secure authentication (OAuth, JWT, Session) and payment gateways',
      'Pass technical coding rounds and system design interviews'
    ],
    audience: ['Aspiring software engineers', 'Frontend developers upgrading to full stack', 'CS undergrads'],
    requirements: ['Foundational familiarity with HTML/CSS and basic JavaScript syntax'],
    curriculum: [
      {
        moduleId: 'fs-mod-01',
        title: 'Module 1: Modern TypeScript & React Internals',
        lessons: [
          { lessonId: 'fs-l-01', title: 'Deep Dive: Reconciliation & Component Lifecycle', type: 'video' },
          { lessonId: 'fs-l-02', title: 'Strict Type Systems & Generic Design', type: 'live_session' }
        ]
      },
      {
        moduleId: 'fs-mod-02',
        title: 'Module 2: Server-Side Architecture & Distributed Systems',
        lessons: [
          { lessonId: 'fs-l-03', title: 'Next.js Server Actions & Caching Strategies', type: 'video' },
          { lessonId: 'fs-l-04', title: 'Relational DB Modeling & Index Optimization', type: 'live_session' }
        ]
      }
    ],
    faq: [
      { question: 'Will I build real projects?', answer: 'Yes. You will build and deploy a multi-tenant SaaS application with stripe billing as your capstone.' }
    ]
  },
  {
    id: 'prog-ai-05',
    slug: 'ai-engineering',
    title: 'AI Engineering & Applied Machine Learning',
    shortTitle: 'AI Engineering',
    category: 'technology',
    tagline: 'Harness LLMs, embeddings, RAG architectures, and autonomous AI agents.',
    shortDescription: 'Hands-on engineering curriculum on building LLM applications, Vector databases, fine-tuning open models, and deploying intelligent systems.',
    longDescription: 'Step into the forefront of AI. Master Retrieval-Augmented Generation (RAG), vector indexing, multi-agent frameworks (LangGraph, CrewAI), and local inference deployment.',
    icon: 'Bot',
    image: '/images/programs/ai.jpg',
    color: '#0057B8',
    accentColor: '#10B981',
    level: 'Advanced',
    duration: '14 Weeks',
    mode: 'Live Online',
    certificate: 'VEEZNA Certified AI Solutions Architect',
    featured: true,
    popular: true,
    status: 'published',
    order: 5,
    pricing: {
      amount: 29999,
      currency: 'INR',
      displayPrice: '₹29,999'
    },
    features: [
      'Production-Ready RAG Pipeline Development',
      'Fine-Tuning Llama & Mistral Models',
      'Vector Databases (Pinecone, Qdrant, pgvector)',
      'Agentic Workflows with Function Calling'
    ],
    highlights: [
      { title: 'Generative AI Stacks', description: 'LangChain, LlamaIndex, Ollama, HuggingFace.' },
      { title: 'Real Evaluation', description: 'Learn Ragas and TruLens for evaluating hallucination and recall.' }
    ],
    skills: ['Prompt Engineering', 'RAG Pipelines', 'Vector Indexing', 'Python', 'Fine-Tuning', 'AI Agent Architecture'],
    outcomes: [
      'Architect enterprise-grade AI chatbots with document grounded retrieval',
      'Deploy autonomous multi-agent task execution systems',
      'Fine-tune small open-weight LLMs for specialized domain tasks'
    ],
    audience: ['Developers looking to specialize in Generative AI', 'Data analysts transitioning to AI Engineering'],
    requirements: ['Proficiency in Python and basic understanding of APIs'],
    curriculum: [
      {
        moduleId: 'ai-mod-01',
        title: 'Module 1: Vector Embeddings & Advanced RAG',
        lessons: [
          { lessonId: 'ai-l-01', title: 'Dense vs Sparse Vectors & Hybrid Search', type: 'video' },
          { lessonId: 'ai-l-02', title: 'Chunking Strategies & Context Enrichment', type: 'live_session' }
        ]
      }
    ],
    faq: [
      { question: 'Do I need a GPU?', answer: 'Cloud GPU environments (Google Colab Pro / RunPod) are configured for student labs.' }
    ]
  },
  {
    id: 'prog-acad-06',
    slug: 'academic-excellence',
    title: 'Academic Excellence & Cognitive Learning Mastery',
    shortTitle: 'Academic Excellence',
    category: 'academic',
    tagline: 'Evidence-based cognitive study techniques, memory retention, and exam psychology.',
    shortDescription: 'Accelerate learning velocity using cognitive science, active recall frameworks, spaced repetition, and analytical problem-solving models.',
    longDescription: 'Traditional schooling rarely teaches how the brain encodes information. This program provides students and scholars with high-performance cognitive workflows.',
    icon: 'GraduationCap',
    image: '/images/programs/academic.jpg',
    color: '#0057B8',
    accentColor: '#F7931E',
    level: 'All Levels',
    duration: '8 Weeks',
    mode: 'Live Online',
    certificate: 'VEEZNA Cognitive Learning & Academic Mastery Award',
    featured: false,
    popular: false,
    status: 'published',
    order: 6,
    pricing: {
      amount: 6999,
      currency: 'INR',
      displayPrice: '₹6,999'
    },
    features: [
      'Personalized Learning Velocity Audit',
      'Feynman & Spaced Repetition Workflows',
      'Speed Reading & Structural Mind Mapping',
      'Combating Exam Stress & Cognitive Overload'
    ],
    highlights: [
      { title: 'Neuroscience-Backed', description: 'Retain 4x more data in half the revision time.' },
      { title: 'Habit Systems', description: 'Eliminate chronic procrastination with structured friction logs.' }
    ],
    skills: ['Spaced Repetition', 'Active Recall', 'Mind Mapping', 'Metacognition', 'Exam Stress Regulation'],
    outcomes: [
      'Master high-volume syllabi with minimal cognitive fatigue',
      'Maintain peak focus using optimized ultradian rhythm cycles',
      'Consistently score in top percentiles in competitive examinations'
    ],
    audience: ['High school & university students', 'Competitive exam aspirants (UPSC, GRE, GMAT, CAT)'],
    requirements: ['Desire to upgrade study methodologies and cognitive habits'],
    curriculum: [
      {
        moduleId: 'acad-mod-01',
        title: 'Module 1: Information Encoding & Memory Science',
        lessons: [
          { lessonId: 'acad-l-01', title: 'Synaptic Consolidation & Working Memory Limits', type: 'video' },
          { lessonId: 'acad-l-02', title: 'Building Digital & Physical Memory Palaces', type: 'live_session' }
        ]
      }
    ],
    faq: [
      { question: 'Is this only for school students?', answer: 'No, university students and competitive examination aspirants benefit significantly.' }
    ]
  }
];

// Helper functions
export function getAllPrograms(): Program[] {
  return PROGRAMS_DATA.filter((p) => p.status === 'published' || p.status === 'active').sort(
    (a, b) => a.order - b.order
  );
}

export function getProgramBySlug(slug: string): Program | undefined {
  return PROGRAMS_DATA.find((p) => p.slug.toLowerCase() === slug.toLowerCase());
}

export function getProgramsByCategory(category: ProgramCategory): Program[] {
  if (category === 'all') return getAllPrograms();
  return getAllPrograms().filter((p) => p.category === category);
}

export function getFeaturedPrograms(): Program[] {
  return getAllPrograms().filter((p) => p.featured);
}