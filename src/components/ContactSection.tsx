
"use client";

import Link from "next/link";

export default function ContactSection() {
  return (
    <section
      id="contact"
      className="relative overflow-hidden bg-gradient-to-br from-blue-950 via-blue-900 to-blue-700 py-20"
    >
      <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-orange-500/10 blur-3xl" />
      <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-blue-400/10 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div className="text-white">
            <span className="inline-flex rounded-full border border-orange-400/30 bg-orange-400/10 px-4 py-2 text-sm font-semibold text-orange-300">
              Let&apos;s Connect
            </span>

            <h2 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
              Ready to Start Your
              <span className="block text-orange-400">
                Learning Journey?
              </span>
            </h2>

            <p className="mt-6 max-w-xl text-base leading-7 text-blue-100 sm:text-lg">
              Whether you are a student, parent, or professional, Veezna is
              here to help you move forward with clarity, confidence, and the
              right learning path.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/apply"
                className="rounded-lg bg-orange-500 px-6 py-3 font-semibold text-white shadow-lg transition hover:bg-orange-600"
              >
                Apply Now
              </Link>

              <a
                href="#contact"
                className="rounded-lg border border-white/30 px-6 py-3 font-semibold text-white transition hover:bg-white/10"
              >
                Contact Veezna
              </a>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/10 p-6 shadow-2xl backdrop-blur-md sm:p-8">
            <h3 className="text-2xl font-bold text-white">
              Connect With Veezna
            </h3>

            <p className="mt-2 text-sm leading-6 text-blue-100">
              Have a question about courses, admissions, or our learning
              programs? We are here to help.
            </p>

            <div className="mt-6 space-y-4">
              <div className="rounded-xl bg-white/10 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-orange-300">
                  Website
                </p>

                <a
                  href="https://www.veezna.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 block text-white transition hover:text-orange-300"
                >
                  www.veezna.com
                </a>
              </div>

              <div className="rounded-xl bg-white/10 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-orange-300">
                  Admissions
                </p>

                <Link
                  href="/apply"
                  className="mt-1 block text-white transition hover:text-orange-300"
                >
                  Start Your Application →
                </Link>
              </div>

              <div className="rounded-xl bg-white/10 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-orange-300">
                  Student Portal
                </p>

                <Link
                  href="/student/login"
                  className="mt-1 block text-white transition hover:text-orange-300"
                >
                  Student Login →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

