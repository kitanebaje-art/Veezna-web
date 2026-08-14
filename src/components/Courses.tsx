"use client";

import React, { useRef, useState } from "react";
import Link from "next/link";

interface ProgramCardProps {
  title: string;
  category: string;
  description: string;
  features: string[];
  bannerGradient: string;
  badgeBg: string;
  badgeText: string;
  glowColor: string;
  icon: React.ReactNode;
  slug: string;
}

const programsData: ProgramCardProps[] = [
  {
    title: "Academic Excellence",
    category: "School Education",
    description:
      "Concept-based coaching for Classes 6–12 with board preparation, doubt solving, regular assessments and personalized guidance.",
    features: [
      "Small Batches",
      "Weekly Tests",
      "Personal Mentoring",
    ],
    bannerGradient:
      "from-[#0057B8] via-[#00BFFF] to-[#3B82F6]",
    badgeBg:
      "bg-blue-50 text-[#0057B8] border-blue-200",
    badgeText: "Recommended",
    glowColor: "rgba(0, 87, 184, 0.18)",
    slug: "academic-excellence",
    icon: (
      <svg
        className="w-7 h-7 text-[#0057B8]"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 14l9-5-9-5-9 5 9 5z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0112 20.055a11.952 11.952 0 01-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"
        />
      </svg>
    ),
  },

  {
    title: "Veezna Vox",
    category: "Communication Skills",
    description:
      "Build fluent spoken English, confidence, public speaking, interview skills and personality development.",
    features: [
      "Daily Speaking Practice",
      "Group Discussions",
      "Interview Training",
    ],
    bannerGradient:
      "from-[#F7931E] via-[#FFB74D] to-[#F59E0B]",
    badgeBg:
      "bg-amber-50 text-[#D97706] border-amber-200",
    badgeText: "Popular",
    glowColor: "rgba(247, 147, 30, 0.20)",
    slug: "spoken-english",
    icon: (
      <svg
        className="w-7 h-7 text-[#F7931E]"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 100-6 3 3 0 000 6z"
        />
      </svg>
    ),
  },

  {
    title: "Web Development",
    category: "Technology",
    description:
      "Master HTML, CSS, JavaScript, React, Next.js, AI tools and modern web development through practical projects.",
    features: [
      "Live Projects",
      "Portfolio Building",
      "Industry Skills",
    ],
    bannerGradient:
      "from-[#00BFFF] via-[#06B6D4] to-[#0284C7]",
    badgeBg:
      "bg-cyan-50 text-[#0284C7] border-cyan-200",
    badgeText: "Trending",
    glowColor: "rgba(0, 191, 255, 0.20)",
    slug: "web-development",
    icon: (
      <svg
        className="w-7 h-7 text-[#0284C7]"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
        />
      </svg>
    ),
  },

  {
    title: "Veezna Spark — Trading",
    category: "Business & Finance",
    description:
      "Learn market fundamentals, technical price action, chart reading, risk management and disciplined trading psychology.",
    features: [
      "Technical Analysis",
      "Risk Management",
      "Trading Psychology",
    ],
    bannerGradient:
      "from-[#F59E0B] via-[#D97706] to-[#B45309]",
    badgeBg:
      "bg-amber-50 text-[#B45309] border-amber-200",
    badgeText: "Finance",
    glowColor: "rgba(245, 158, 11, 0.20)",
    slug: "trading",
    icon: (
      <svg
        className="w-7 h-7 text-[#D97706]"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
        />
      </svg>
    ),
  },

  {
    title: "Wellness & Counselling",
    category: "Personal Growth",
    description:
      "Support for emotional well-being, stress management, confidence building and career counselling.",
    features: [
      "One-to-One Guidance",
      "Wellness Sessions",
      "Career Counselling",
    ],
    bannerGradient:
      "from-[#10B981] via-[#059669] to-[#047857]",
    badgeBg:
      "bg-emerald-50 text-[#059669] border-emerald-200",
    badgeText: "Support",
    glowColor: "rgba(16, 185, 129, 0.20)",
    slug: "wellness",
    icon: (
      <svg
        className="w-7 h-7 text-[#059669]"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
        />
      </svg>
    ),
  },

  {
    title: "AI & Digital Skills",
    category: "Future Skills",
    description:
      "Learn prompt engineering, AI productivity tools, automation and digital workflows for the modern workplace.",
    features: [
      "Practical AI Tools",
      "Automation Basics",
      "Real-world Use Cases",
    ],
    bannerGradient:
      "from-[#8B5CF6] via-[#A855F7] to-[#6366F1]",
    badgeBg:
      "bg-purple-50 text-[#7C3AED] border-purple-200",
    badgeText: "Future Skill",
    glowColor: "rgba(139, 92, 246, 0.20)",
    slug: "ai-digital-skills",
    icon: (
      <svg
        className="w-7 h-7 text-[#8B5CF6]"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M13 10V3L4 14h7v7l9-11h-7z"
        />
      </svg>
    ),
  },

  {
    title: "Career Guidance",
    category: "Success Planning",
    description:
      "Receive mentorship for higher education, competitive exams, career planning and professional development.",
    features: [
      "Career Roadmaps",
      "Goal Planning",
      "Expert Mentorship",
    ],
    bannerGradient:
      "from-[#EC4899] via-[#F43F5E] to-[#E11D48]",
    badgeBg:
      "bg-rose-50 text-[#E11D48] border-rose-200",
    badgeText: "Guidance",
    glowColor: "rgba(236, 72, 153, 0.20)",
    slug: "career-guidance",
    icon: (
      <svg
        className="w-7 h-7 text-[#E11D48]"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 20l6-6-6-6"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 4v16"
        />
      </svg>
    ),
  },
];

/* =========================================================
   PROGRAM CARD
   ========================================================= */

function ProgramCard({
  program,
}: {
  program: ProgramCardProps;
}) {
  const [tilt, setTilt] = useState({
    x: 0,
    y: 0,
  });

  const [isHovered, setIsHovered] = useState(false);

  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (
    e: React.MouseEvent<HTMLDivElement>
  ) => {
    if (!cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    setTilt({
      x: (y - centerY) / 25,
      y: (centerX - x) / 25,
    });
  };

  const handleMouseLeave = () => {
    setTilt({
      x: 0,
      y: 0,
    });

    setIsHovered(false);
  };

  /* List of detail pages configured in app/programs/[slug]/page.tsx */
  const detailPrograms = [
    "spoken-english",
    "web-development",
    "wellness",
    "trading",
  ];

  const hasDetailPage = detailPrograms.includes(program.slug);

  return (
    <div className="relative group h-full">
      {/* Ambient Glow */}
      <div
        className="absolute -inset-2 rounded-[34px] blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          backgroundColor: program.glowColor,
        }}
      />

      {/* Card Body */}
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={handleMouseLeave}
        style={{
          transform: isHovered
            ? `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) translateY(-8px)`
            : "perspective(1000px) rotateX(0deg) rotateY(0deg)",
          transformStyle: "preserve-3d",
        }}
        className="
          relative
          h-full
          min-h-[520px]
          flex
          flex-col
          rounded-[32px]
          bg-white
          border
          border-slate-200
          shadow-lg
          hover:shadow-2xl
          transition-shadow
          duration-300
          overflow-hidden
        "
      >
        {/* Top Gradient */}
        <div
          className={`h-3 w-full shrink-0 bg-gradient-to-r ${program.bannerGradient}`}
        />

        {/* Card Content */}
        <div className="p-7 flex flex-col flex-1 gap-6">
          {/* Badge + Icon */}
          <div className="flex justify-between items-start gap-4">
            <span
              className={`
                inline-flex
                px-3
                py-1.5
                rounded-full
                text-xs
                font-bold
                uppercase
                tracking-wide
                border
                ${program.badgeBg}
              `}
            >
              {program.badgeText}
            </span>

            <div className="shrink-0 p-3 rounded-2xl bg-slate-50 border border-slate-100">
              {program.icon}
            </div>
          </div>

          {/* Title & Desc */}
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-500 font-bold">
              {program.category}
            </p>

            <h3 className="text-2xl font-black text-slate-900 mt-2 leading-tight">
              {program.title}
            </h3>

            <p className="text-slate-600 mt-4 text-sm leading-7">
              {program.description}
            </p>
          </div>

          {/* Features */}
          <div className="flex flex-wrap gap-2">
            {program.features.map((feature, index) => (
              <span
                key={`${program.slug}-feature-${index}`}
                className="
                  px-3
                  py-1.5
                  bg-slate-100
                  border
                  border-slate-200
                  rounded-xl
                  text-xs
                  font-semibold
                  text-slate-700
                "
              >
                <span className="text-[#0057B8] mr-1">✓</span>
                {feature}
              </span>
            ))}
          </div>

          {/* Action Link Button */}
          <div className="mt-auto pt-4">
            {hasDetailPage ? (
              <Link
                href={`/programs/${program.slug}`}
                className="
                  group/button
                  flex
                  items-center
                  justify-center
                  w-full
                  py-3.5
                  px-5
                  rounded-xl
                  bg-slate-100
                  text-slate-800
                  hover:bg-[#0057B8]
                  hover:text-white
                  font-bold
                  transition-all
                  duration-300
                "
              >
                <span>Learn More</span>
                <span className="ml-2 transition-transform duration-300 group-hover/button:translate-x-1">
                  →
                </span>
              </Link>
            ) : (
              <Link
                href="/programs"
                className="
                  flex
                  items-center
                  justify-center
                  w-full
                  py-3.5
                  px-5
                  rounded-xl
                  bg-slate-100
                  text-slate-800
                  hover:bg-[#0057B8]
                  hover:text-white
                  font-bold
                  transition-all
                  duration-300
                "
              >
                <span>Explore Program</span>
                <span className="ml-2">→</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   MAIN PROGRAM SECTION
   ========================================================= */

export default function ExploreOurPrograms() {
  return (
    <section
      id="programs"
      className="
        relative
        py-24
        bg-gradient-to-b
        from-white
        via-[#F4F8FC]
        to-white
        overflow-hidden
      "
    >
      {/* Background Decoration */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-blue-100/50 blur-3xl" />
        <div className="absolute top-1/3 -right-32 w-96 h-96 rounded-full bg-orange-100/40 blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-6">
        {/* Section Heading */}
        <div className="text-center mb-16">
          <span
            className="
              inline-flex
              px-4
              py-2
              rounded-full
              bg-white
              border
              border-slate-200
              shadow-sm
              text-[#0057B8]
              text-xs
              font-bold
              tracking-wider
            "
          >
            TRANSFORMATIVE OFFERINGS
          </span>

          <h2 className="text-4xl sm:text-5xl font-black text-slate-900 mt-6">
            Explore Our <span className="text-[#0057B8]">Programs</span>
          </h2>

          <p className="max-w-2xl mx-auto text-slate-600 mt-5 text-base sm:text-lg leading-7">
            Choose the learning path that matches your ambition, interests and goals.
          </p>
        </div>

        {/* Program Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch">
          {programsData.map((program) => (
            <ProgramCard key={program.slug} program={program} />
          ))}
        </div>

        {/* Bottom CTA Box */}
        <div
          id="book-counselling"
          className="
            relative
            overflow-hidden
            mt-20
            rounded-[32px]
            bg-gradient-to-r
            from-[#0057B8]
            to-[#002855]
            text-white
            p-8
            sm:p-12
            text-center
            shadow-xl
          "
        >
          <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-white/10 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-orange-400/10 blur-3xl pointer-events-none" />

          <div className="relative">
            <h3 className="text-3xl sm:text-4xl font-black text-white">
              Not Sure Which Program Is Right for You?
            </h3>

            <p className="max-w-2xl mx-auto mt-4 text-blue-100 leading-7">
              Our mentors can help you understand your goals and choose the right learning path.
            </p>

            <div className="mt-8 flex justify-center gap-4 flex-wrap">
              <Link
                href="/apply?type=counselling"
                className="
                  inline-flex
                  items-center
                  justify-center
                  px-8
                  py-4
                  bg-[#F7931E]
                  hover:bg-orange-600
                  text-white
                  rounded-2xl
                  font-bold
                  shadow-lg
                  transition-all
                "
              >
                Book Free Counselling
                <span className="ml-2">→</span>
              </Link>

              <Link
                href="/#contact"
                className="
                  inline-flex
                  items-center
                  justify-center
                  px-8
                  py-4
                  bg-white/10
                  hover:bg-white/20
                  text-white
                  rounded-2xl
                  font-bold
                  border
                  border-white/20
                  transition-all
                "
              >
                Contact Us
                <span className="ml-2">→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}