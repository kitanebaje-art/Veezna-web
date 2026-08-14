import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

/* =========================================================
   VEEZNA PROGRAM DATA
   Add future programs inside this array.
   ========================================================= */

interface Highlight {
  title: string;
  description: string;
}

interface CurriculumModule {
  title: string;
  description: string;
  topics: string[];
}

interface FAQ {
  question: string;
  answer: string;
}

interface Program {
  slug: string;
  title: string;
  category: string;
  level: string;
  mode: string;
  tagline: string;
  shortDescription: string;
  longDescription: string;
  duration: string;
  certificate: string;
  skills: string[];
  highlights: Highlight[];
  curriculum: CurriculumModule[];
  faq: FAQ[];
  price: string;
}

/* =========================================================
   PROGRAMS
   ========================================================= */

const programs: Program[] = [
  {
    slug: "spoken-english",
    title: "Veezna Vox — Spoken English",
    category: "Communication",
    level: "Beginner → Advanced",
    mode: "Offline / Online",
    tagline: "Build confidence. Speak clearly. Communicate naturally.",
    shortDescription:
      "A practical spoken English and communication program designed to build confidence and fluency.",
    longDescription:
      "Veezna Vox is a structured English communication program designed for learners who want to improve their speaking, pronunciation, vocabulary, grammar, confidence and real-world communication skills. The program focuses on practical communication rather than memorising English rules.",
    duration: "6 Months",
    certificate: "VEEZNA Professional Certificate",
    price: "₹2,999 onwards",

    skills: [
      "Spoken English",
      "Grammar",
      "Vocabulary",
      "Pronunciation",
      "Conversation",
      "Public Speaking",
      "Confidence",
      "Presentation Skills",
    ],

    highlights: [
      {
        title: "Practical Speaking",
        description:
          "Learn English through real-life conversations and everyday situations.",
      },
      {
        title: "Confidence Building",
        description:
          "Develop the confidence to communicate comfortably with others.",
      },
      {
        title: "Grammar in Practice",
        description:
          "Understand grammar through practical examples instead of memorisation.",
      },
      {
        title: "Communication Skills",
        description:
          "Improve conversations, presentations and professional communication.",
      },
    ],

    curriculum: [
      {
        title: "Module 01 — Communication Foundations",
        description:
          "Understand the fundamentals of effective communication.",
        topics: [
          "Communication basics",
          "Sentence formation",
          "Common expressions",
          "Basic vocabulary",
        ],
      },
      {
        title: "Module 02 — Everyday English",
        description:
          "Build practical English for everyday situations.",
        topics: [
          "Daily conversations",
          "Introductions",
          "Asking questions",
          "Giving information",
        ],
      },
      {
        title: "Module 03 — Grammar for Speaking",
        description:
          "Learn the grammar structures needed for confident speaking.",
        topics: [
          "Tenses",
          "Articles",
          "Prepositions",
          "Modal verbs",
          "Sentence correction",
        ],
      },
      {
        title: "Module 04 — Vocabulary & Fluency",
        description:
          "Develop vocabulary and improve speaking speed and fluency.",
        topics: [
          "Useful vocabulary",
          "Phrasal expressions",
          "Word usage",
          "Fluency practice",
        ],
      },
      {
        title: "Module 05 — Pronunciation",
        description:
          "Improve clarity and natural English pronunciation.",
        topics: [
          "Sounds",
          "Word stress",
          "Sentence stress",
          "Intonation",
        ],
      },
      {
        title: "Module 06 — Public Speaking",
        description:
          "Develop confidence for speaking before groups.",
        topics: [
          "Speech preparation",
          "Presentation skills",
          "Body language",
          "Audience interaction",
        ],
      },
    ],

    faq: [
      {
        question: "Who can join Veezna Vox?",
        answer:
          "Students, professionals and anyone who wants to improve spoken English and communication skills can join.",
      },
      {
        question: "Is this program suitable for beginners?",
        answer:
          "Yes. The program is designed to support learners from beginner level through advanced communication.",
      },
      {
        question: "Is online learning available?",
        answer:
          "Yes. The program can be offered through online as well as offline learning modes.",
      },
      {
        question: "Will I receive a certificate?",
        answer:
          "Eligible learners receive a VEEZNA Professional Certificate after completing the required program requirements.",
      },
    ],
  },

  {
    slug: "web-development",
    title: "Full Stack Web Development",
    category: "Technology",
    level: "Beginner → Professional",
    mode: "Offline / Online",
    tagline:
      "Learn to build modern websites and real-world web applications.",
    shortDescription:
      "A practical full-stack development program covering frontend, backend, databases and deployment.",
    longDescription:
      "The VEEZNA Full Stack Web Development program takes learners from programming fundamentals to modern web application development. Students learn how websites work, how to build responsive interfaces, how frontend connects with backend services and how applications are deployed.",
    duration: "12 Months",
    certificate: "VEEZNA Professional Certificate",
    price: "₹35,000 onwards",

    skills: [
      "HTML",
      "CSS",
      "JavaScript",
      "TypeScript",
      "React",
      "Next.js",
      "Node.js",
      "Databases",
      "Git & GitHub",
      "Deployment",
    ],

    highlights: [
      {
        title: "Project Based Learning",
        description:
          "Build practical projects instead of learning only through theory.",
      },
      {
        title: "Modern Technologies",
        description:
          "Learn technologies used in modern web development.",
      },
      {
        title: "Full Stack Understanding",
        description:
          "Understand frontend, backend, databases and deployment.",
      },
      {
        title: "Industry Preparation",
        description:
          "Develop practical skills needed for professional development work.",
      },
    ],

    curriculum: [
      {
        title: "Module 01 — Digital Thinking & Programming Logic",
        description:
          "Build the logical foundation required for programming.",
        topics: [
          "Computational thinking",
          "Algorithms",
          "Flowcharts",
          "Problem solving",
        ],
      },
      {
        title: "Module 02 — HTML Mastery",
        description:
          "Learn how modern webpages are structured.",
        topics: [
          "HTML5",
          "Semantic HTML",
          "Forms",
          "Accessibility",
          "SEO basics",
        ],
      },
      {
        title: "Module 03 — CSS Mastery",
        description:
          "Create responsive and attractive user interfaces.",
        topics: [
          "CSS fundamentals",
          "Flexbox",
          "Grid",
          "Responsive design",
          "Animations",
        ],
      },
      {
        title: "Module 04 — JavaScript",
        description:
          "Learn programming for interactive web applications.",
        topics: [
          "Variables",
          "Functions",
          "Arrays",
          "Objects",
          "DOM",
          "Async programming",
        ],
      },
      {
        title: "Module 05 — React & Next.js",
        description:
          "Build modern component-based applications.",
        topics: [
          "React",
          "Components",
          "State",
          "Props",
          "Next.js",
          "Routing",
        ],
      },
      {
        title: "Module 06 — Backend & Database",
        description:
          "Understand server-side applications and data.",
        topics: [
          "APIs",
          "Authentication",
          "Databases",
          "CRUD",
          "Server logic",
        ],
      },
      {
        title: "Module 07 — Git, Deployment & Projects",
        description:
          "Learn how professional projects are managed and deployed.",
        topics: [
          "Git",
          "GitHub",
          "Version control",
          "Deployment",
          "Portfolio projects",
        ],
      },
    ],

    faq: [
      {
        question: "Do I need previous programming experience?",
        answer:
          "No. The program is structured to begin with fundamentals and progressively move toward professional development.",
      },
      {
        question: "Which technologies are covered?",
        answer:
          "The program can cover HTML, CSS, JavaScript, TypeScript, React, Next.js, backend concepts, databases, Git and deployment.",
      },
      {
        question: "Will I build projects?",
        answer:
          "Yes. Practical projects are an important part of the learning process.",
      },
    ],
  },

  {
    slug: "wellness",
    title: "Veezna Wellness",
    category: "Wellness",
    level: "Professional",
    mode: "Offline / Online",
    tagline:
      "Understand yourself. Build clarity. Move forward with care.",
    shortDescription:
      "A structured wellness and personal development learning experience.",
    longDescription:
      "Veezna Wellness focuses on self-awareness, emotional understanding, personal development and practical wellbeing education. The exact services and learning activities may vary according to the selected program or session.",
    duration: "Flexible",
    certificate: "VEEZNA Certificate",
    price: "Contact VEEZNA",

    skills: [
      "Self Awareness",
      "Communication",
      "Personal Development",
      "Emotional Understanding",
      "Mindfulness",
      "Life Skills",
    ],

    highlights: [
      {
        title: "Personal Growth",
        description:
          "Develop greater awareness of your thoughts, habits and goals.",
      },
      {
        title: "Practical Approach",
        description:
          "Focus on practical strategies that can be applied in daily life.",
      },
      {
        title: "Individual Attention",
        description:
          "Learning and sessions can be adapted according to individual requirements.",
      },
      {
        title: "Clarity With Care",
        description:
          "A supportive approach focused on understanding before action.",
      },
    ],

    curriculum: [
      {
        title: "Module 01 — Self Awareness",
        description:
          "Understand yourself and your behavioural patterns.",
        topics: [
          "Self observation",
          "Strengths",
          "Goals",
          "Personal values",
        ],
      },
      {
        title: "Module 02 — Communication",
        description:
          "Develop healthier and clearer communication.",
        topics: [
          "Active listening",
          "Expression",
          "Boundaries",
          "Interpersonal skills",
        ],
      },
      {
        title: "Module 03 — Personal Development",
        description:
          "Create practical strategies for continuous growth.",
        topics: [
          "Goal setting",
          "Habits",
          "Time management",
          "Self discipline",
        ],
      },
    ],

    faq: [
      {
        question: "Who is this program for?",
        answer:
          "It is intended for learners interested in personal development, self-awareness and practical wellbeing education.",
      },
      {
        question: "Is this available online?",
        answer:
          "Selected VEEZNA services and programs may be available online or offline.",
      },
    ],
  },

  {
    slug: "trading",
    title: "Veezna Spark — Trading & Market Learning",
    category: "Business & Finance",
    level: "Beginner → Intermediate",
    mode: "Online / Offline",
    tagline:
      "Learn market concepts, risk management and disciplined decision-making.",
    shortDescription:
      "A structured learning program for understanding trading and financial markets.",
    longDescription:
      "Veezna Spark introduces learners to market fundamentals, technical concepts, risk management, trading psychology and disciplined decision-making. This is an educational program and does not guarantee profits or investment returns.",
    duration: "Flexible",
    certificate: "VEEZNA Certificate",
    price: "₹1,999 onwards",

    skills: [
      "Market Basics",
      "Technical Analysis",
      "Risk Management",
      "Trading Psychology",
      "Chart Reading",
      "Trading Discipline",
    ],

    highlights: [
      {
        title: "Market Fundamentals",
        description:
          "Understand how financial markets and trading instruments work.",
      },
      {
        title: "Risk First",
        description:
          "Learn why risk management is more important than chasing returns.",
      },
      {
        title: "Chart Understanding",
        description:
          "Develop a structured approach to reading charts and market behaviour.",
      },
      {
        title: "Trading Psychology",
        description:
          "Understand discipline, emotions and decision-making.",
      },
    ],

    curriculum: [
      {
        title: "Module 01 — Market Fundamentals",
        description:
          "Understand the basic structure of financial markets.",
        topics: [
          "Markets",
          "Trading instruments",
          "Orders",
          "Exchanges",
        ],
      },
      {
        title: "Module 02 — Charts & Price Action",
        description:
          "Learn the foundations of chart analysis.",
        topics: [
          "Candlesticks",
          "Trends",
          "Support",
          "Resistance",
        ],
      },
      {
        title: "Module 03 — Risk Management",
        description:
          "Learn how responsible traders manage risk.",
        topics: [
          "Position sizing",
          "Stop loss",
          "Risk-reward",
          "Capital protection",
        ],
      },
      {
        title: "Module 04 — Trading Psychology",
        description:
          "Develop discipline and structured decision-making.",
        topics: [
          "Emotions",
          "FOMO",
          "Overtrading",
          "Trading journal",
        ],
      },
    ],

    faq: [
      {
        question: "Is this an investment recommendation service?",
        answer:
          "No. This is an educational program designed to teach market concepts, risk management and disciplined decision-making.",
      },
      {
        question: "Can beginners join?",
        answer:
          "Yes. The curriculum starts with basic market concepts.",
      },
    ],
  },
];

/* =========================================================
   HELPERS
   ========================================================= */

function getProgramBySlug(slug: string): Program | undefined {
  return programs.find((program) => program.slug === slug);
}

/* =========================================================
   STATIC ROUTES
   ========================================================= */

export function generateStaticParams() {
  return programs.map((program) => ({
    slug: program.slug,
  }));
}

/* =========================================================
   SEO METADATA
   ========================================================= */

interface ProgramPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({
  params,
}: ProgramPageProps): Promise<Metadata> {
  const { slug } = await params;
  const program = getProgramBySlug(slug);

  if (!program) {
    return {
      title: "Program Not Found | VEEZNA",
    };
  }

  return {
    title: `${program.title} | VEEZNA`,
    description: program.shortDescription,
    openGraph: {
      title: `${program.title} — VEEZNA`,
      description: program.tagline,
      type: "website",
    },
  };
}

/* =========================================================
   PAGE
   ========================================================= */

export default async function ProgramDetailPage({
  params,
}: ProgramPageProps) {
  const { slug } = await params;
  const program = getProgramBySlug(slug);

  if (!program) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-gray-50 pb-20">
      {/* HERO SECTION */}
      <section className="relative overflow-hidden bg-[#002D62] text-white pt-28 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-blue-500/20 blur-3xl" />
          <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-orange-500/20 blur-3xl" />
        </div>

        <div className="relative max-w-6xl mx-auto">
          <Link
            href="/#programs"
            className="inline-flex items-center gap-2 mb-8 text-sm font-semibold text-blue-200 hover:text-white transition"
          >
            ← Back to all programs
          </Link>

          <div className="flex flex-wrap gap-2 mb-6">
            <span className="px-3 py-1 rounded-full bg-[#F7931E] text-white text-xs font-bold uppercase tracking-wide">
              {program.category}
            </span>

            <span className="px-3 py-1 rounded-full bg-white/10 border border-white/20 text-blue-100 text-xs font-semibold">
              {program.level}
            </span>

            <span className="px-3 py-1 rounded-full bg-white/10 border border-white/20 text-blue-100 text-xs font-semibold">
              {program.mode}
            </span>
          </div>

          <h1 className="max-w-4xl text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight">
            {program.title}
          </h1>

          <p className="max-w-3xl mt-6 text-lg sm:text-xl text-blue-100 leading-relaxed">
            {program.tagline}
          </p>

          <div className="flex flex-wrap gap-4 mt-9">
            <Link
              href={`/apply?program=${program.slug}`}
              className="px-8 py-4 rounded-xl bg-[#F7931E] hover:bg-orange-600 text-white font-bold shadow-lg transition"
            >
              Apply Now
            </Link>

            <a
              href="#curriculum"
              className="px-8 py-4 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold transition"
            >
              Explore Curriculum
            </a>
          </div>
        </div>
      </section>

      {/* MAIN CONTENT */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* LEFT CONTENT */}
          <div className="lg:col-span-2 space-y-10">
            {/* Overview */}
            <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-7 sm:p-8">
              <h2 className="text-2xl font-bold text-gray-900">
                Program Overview
              </h2>
              <p className="mt-4 text-gray-600 leading-8">
                {program.longDescription}
              </p>
            </section>

            {/* Highlights */}
            <section>
              <div className="mb-6">
                <p className="text-sm font-bold uppercase tracking-wider text-[#F7931E]">
                  Why VEEZNA
                </p>
                <h2 className="mt-1 text-2xl font-bold text-gray-900">
                  Key Highlights
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {program.highlights.map((highlight, index) => (
                  <div
                    key={index}
                    className="group bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all"
                  >
                    <div className="w-11 h-11 rounded-xl bg-blue-50 text-[#0057B8] flex items-center justify-center font-bold mb-5">
                      {String(index + 1).padStart(2, "0")}
                    </div>
                    <h3 className="font-bold text-gray-900 text-lg">
                      {highlight.title}
                    </h3>
                    <p className="mt-2 text-sm text-gray-600 leading-6">
                      {highlight.description}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {/* Skills */}
            <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-7 sm:p-8">
              <h2 className="text-2xl font-bold text-gray-900">
                Skills You Will Develop
              </h2>
              <p className="mt-2 text-gray-600">
                Important skills covered throughout the program.
              </p>
              <div className="flex flex-wrap gap-3 mt-6">
                {program.skills.map((skill, index) => (
                  <span
                    key={index}
                    className="px-4 py-2 rounded-xl bg-blue-50 text-[#0057B8] border border-blue-100 text-sm font-semibold"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </section>

            {/* Curriculum */}
            <section id="curriculum" className="scroll-mt-24">
              <div className="mb-6">
                <p className="text-sm font-bold uppercase tracking-wider text-[#F7931E]">
                  Learning Journey
                </p>
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Curriculum & Modules
                  </h2>
                  <span className="text-sm font-semibold text-gray-500">
                    {program.curriculum.length} Modules
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                {program.curriculum.map((module, index) => (
                  <details
                    key={index}
                    className="group bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden"
                    open={index === 0}
                  >
                    <summary className="list-none cursor-pointer p-6 flex items-start gap-4">
                      <div className="w-10 h-10 shrink-0 rounded-xl bg-[#0057B8] text-white flex items-center justify-center font-bold">
                        {String(index + 1).padStart(2, "0")}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900">
                          {module.title}
                        </h3>
                        <p className="mt-1 text-sm text-gray-600">
                          {module.description}
                        </p>
                      </div>
                      <span className="text-xl text-[#0057B8] group-open:rotate-180 transition-transform">
                        ↓
                      </span>
                    </summary>

                    <div className="px-6 pb-6 pl-20">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {module.topics.map((topic, topicIndex) => (
                          <div
                            key={topicIndex}
                            className="flex items-center gap-2 text-sm text-gray-700"
                          >
                            <span className="text-[#F7931E] font-bold">✓</span>
                            <span>{topic}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </details>
                ))}
              </div>
            </section>

            {/* FAQ */}
            {program.faq.length > 0 && (
              <section>
                <div className="mb-6">
                  <p className="text-sm font-bold uppercase tracking-wider text-[#F7931E]">
                    Need to Know
                  </p>
                  <h2 className="mt-1 text-2xl font-bold text-gray-900">
                    Frequently Asked Questions
                  </h2>
                </div>

                <div className="space-y-3">
                  {program.faq.map((item, index) => (
                    <details
                      key={index}
                      className="group bg-white rounded-xl border border-gray-200 shadow-sm"
                    >
                      <summary className="list-none cursor-pointer px-6 py-5 flex items-center justify-between gap-4 font-semibold text-gray-900">
                        <span>{item.question}</span>
                        <span className="shrink-0 text-2xl text-[#0057B8] group-open:rotate-45 transition-transform">
                          +
                        </span>
                      </summary>

                      <div className="px-6 pb-5 text-sm text-gray-600 leading-7">
                        {item.answer}
                      </div>
                    </details>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* SIDEBAR */}
          <aside>
            <div className="lg:sticky lg:top-24 bg-white rounded-2xl border border-gray-200 shadow-md p-6">
              <p className="text-sm font-bold uppercase tracking-wider text-[#F7931E]">
                Program Details
              </p>
              <h2 className="mt-2 text-xl font-bold text-gray-900">
                Quick Specs
              </h2>

              <div className="mt-6 space-y-1">
                <div className="flex justify-between gap-4 py-4 border-b border-gray-100">
                  <span className="font-semibold text-gray-700">Duration</span>
                  <span className="text-gray-600 text-right">
                    {program.duration}
                  </span>
                </div>

                <div className="flex justify-between gap-4 py-4 border-b border-gray-100">
                  <span className="font-semibold text-gray-700">Mode</span>
                  <span className="text-gray-600 text-right">
                    {program.mode}
                  </span>
                </div>

                <div className="flex justify-between gap-4 py-4 border-b border-gray-100">
                  <span className="font-semibold text-gray-700">Level</span>
                  <span className="text-gray-600 text-right">
                    {program.level}
                  </span>
                </div>

                <div className="py-4 border-b border-gray-100">
                  <span className="font-semibold text-gray-700 block mb-2">
                    Certification
                  </span>
                  <span className="block text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg p-3">
                    {program.certificate}
                  </span>
                </div>

                <div className="py-4">
                  <span className="font-semibold text-gray-700 block mb-2">
                    Program Fee
                  </span>
                  <span className="text-2xl font-extrabold text-[#002D62]">
                    {program.price}
                  </span>
                </div>
              </div>

              <Link
                href={`/apply?program=${program.slug}`}
                className="block w-full mt-5 py-4 rounded-xl bg-[#F7931E] hover:bg-orange-600 text-white text-center font-bold shadow-md transition"
              >
                Enroll Now
              </Link>

              <p className="mt-4 text-xs text-center text-gray-500 leading-5">
                Have questions before enrolling? Contact VEEZNA for program details and availability.
              </p>

              <Link
                href="/#contact"
                className="block text-center mt-3 text-sm font-semibold text-[#0057B8] hover:underline"
              >
                Contact VEEZNA →
              </Link>
            </div>
          </aside>
        </div>

        {/* BOTTOM CTA */}
        <section className="relative overflow-hidden mt-14 rounded-3xl bg-[#002D62] px-7 sm:px-12 py-12 sm:py-16 text-center text-white">
          <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-blue-500/20 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-orange-500/20 blur-3xl" />

          <div className="relative">
            <p className="text-sm font-bold uppercase tracking-widest text-orange-300">
              Your next step
            </p>
            <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold">
              Ready to Start Your VEEZNA Journey?
            </h2>
            <p className="max-w-2xl mx-auto mt-4 text-blue-100 leading-7">
              Choose your program, take the first step and turn your vision into action.
            </p>

            <div className="flex flex-wrap justify-center gap-4 mt-8">
              <Link
                href={`/apply?program=${program.slug}`}
                className="px-8 py-4 rounded-xl bg-[#F7931E] hover:bg-orange-600 text-white font-bold shadow-lg transition"
              >
                Apply for This Program
              </Link>

              <Link
                href="/#programs"
                className="px-8 py-4 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 font-semibold transition"
              >
                View All Programs
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}