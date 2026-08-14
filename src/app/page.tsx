// src/app/page.tsx
import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Pillars from "@/components/Pillars";
import Courses from "@/components/Courses";
import ProgramsGrid from "@/components/ProgramsGrid";
import VLSTimeline from "@/components/VLSTimeline";
import TrustSection from "@/components/TrustSection";
import AboutVeezna from "@/components/AboutVeezna";
import AboutVeeznaSection from "@/components/sections/AboutVeeznaSection";
import Impact from "@/components/Impact";
import Testimonials from "@/components/Testimonials";
import ContactSection from "@/components/ContactSection";
import AdmissionCTA from "@/components/AdmissionCTA";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main className="overflow-hidden min-h-screen bg-slate-50">
      <Navbar />

      {/* HERO SECTION */}
      <section className="relative flex min-h-screen items-center pt-24 pb-20 overflow-hidden bg-gradient-to-br from-[#00152F] via-[#003B73] to-[#0057B8]">
        {/* Background Ambient Glows */}
        <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-[#F7931E]/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-20 h-64 w-64 rounded-full bg-[#F7931E]/10 blur-3xl pointer-events-none" />

        {/* Animated Background Orbs */}
        <div className="absolute top-20 left-10 w-32 h-32 bg-orange-400/20 rounded-full blur-xl animate-pulse pointer-events-none" />
        <div className="absolute bottom-20 right-20 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />

        {/* Main Content Container */}
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center relative z-10 w-full">
          {/* LEFT SIDE CONTENT */}
          <div className="text-white">
            <span className="inline-block px-5 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-orange-300 font-semibold text-xs sm:text-sm uppercase tracking-wider">
              Vision Turns Into Mission
            </span>

            <h1 className="mt-6 text-4xl sm:text-5xl md:text-7xl font-extrabold leading-tight tracking-tight">
              Clarity in Learning
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-200">
                Confidence in Life
              </span>
            </h1>

            <p className="mt-6 text-base md:text-xl text-blue-100 max-w-xl font-normal leading-relaxed">
              At Veezna, we believe education should change more than a report card.
              We help students learn with understanding, speak with confidence,
              think independently, and build skills they can actually use in life.
              Because real education is not just about knowing more — it’s about
              becoming more capable.
            </p>

            <div className="mt-10 flex gap-4 sm:gap-5 flex-wrap">
              <Link
                href="/apply"
                className="px-8 py-4 rounded-full bg-[#F7931E] hover:bg-orange-600 transition-all shadow-xl hover:scale-105 font-bold text-white text-sm sm:text-base"
              >
                Start Your Journey
              </Link>

              <Link
                href="/programs"
                className="px-8 py-4 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 transition-all shadow-xl hover:scale-105 font-bold text-white text-sm sm:text-base"
              >
                Explore Programs
              </Link>
            </div>

            <div className="mt-12 flex gap-10 border-t border-white/15 pt-8">
              <div>
                <h3 className="text-3xl font-black">360°</h3>
                <p className="text-blue-200 text-sm font-semibold">Learning Approach</p>
              </div>

              <div>
                <h3 className="text-3xl font-black text-[#F7931E]">VLS</h3>
                <p className="text-blue-200 text-sm font-semibold">Learning System</p>
              </div>
            </div>
          </div>

          {/* RIGHT SIDE 3D CARD */}
          <div className="flex justify-center [perspective:1000px]">
            <div
              style={{
                transform: "rotateX(6deg) rotateY(-12deg) rotateZ(3deg)",
              }}
              className="
                group
                relative
                w-[340px]
                sm:w-[360px]
                min-h-[430px]
                rounded-[36px]
                bg-white/10
                backdrop-blur-xl
                border
                border-white/20
                shadow-2xl
                p-8
                [transform-style:preserve-3d]
                hover:!transform-none
                hover:-translate-y-2
                hover:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5)]
                transition-all
                duration-500
                ease-out
              "
            >
              {/* Glassmorphism Highlight Layer */}
              <div className="
                absolute
                inset-0
                rounded-[36px]
                bg-gradient-to-br
                from-white/25
                via-white/5
                to-transparent
                pointer-events-none
              " />

              <div className="relative z-10 [transform-style:preserve-3d]">
                {/* LOGO CONTAINER */}
                <div className="
                  w-20
                  h-20
                  rounded-2xl
                  bg-white
                  flex
                  items-center
                  justify-center
                  shadow-xl
                  p-3
                  [transform:translateZ(30px)]
                ">
                  <Image
                    src="/images/veezna-logo0.png"
                    alt="Veezna Logo"
                    width={80}
                    height={80}
                    className="w-full h-full object-contain"
                    priority
                  />
                </div>

                <h2 className="mt-6 text-2xl font-bold text-white [transform:translateZ(20px)]">
                  Veezna Learning System
                </h2>

                <p className="mt-2 text-blue-100 text-sm font-medium [transform:translateZ(15px)]">
                  Learn. Grow. Transform.
                </p>

                <div className="mt-6 space-y-3 [transform:translateZ(25px)]">
                  <div className="bg-white/10 border border-white/10 rounded-xl p-3.5 text-white text-sm font-medium backdrop-blur-md hover:bg-white/20 transition-colors">
                    Academic Excellence
                  </div>

                  <div className="bg-white/10 border border-white/10 rounded-xl p-3.5 text-white text-sm font-medium backdrop-blur-md hover:bg-white/20 transition-colors">
                    Communication Skills
                  </div>

                  <div className="bg-white/10 border border-white/10 rounded-xl p-3.5 text-white text-sm font-medium backdrop-blur-md hover:bg-white/20 transition-colors">
                    Personal Growth
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PAGE SECTIONS */}
      <Courses />
      <Pillars />
      <VLSTimeline />
      <ProgramsGrid />
      <TrustSection />
      <AboutVeezna />
      <AboutVeeznaSection /> {/* 👈 Your existing Founder & Leadership section */}
      <Impact />
      <Testimonials />
      <ContactSection />
      <AdmissionCTA />
      <Footer />
    </main>
  );
}