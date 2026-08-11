'use client';

import React from 'react';
import Link from 'next/link';

export default function TermsOfServicePage() {
  return (
    <main className="min-h-screen bg-[#F7FAFF] text-[#071A33] py-20 font-sans">
      <div className="max-w-4xl mx-auto px-6 sm:px-8">
        {/* Header */}
        <div className="border-b border-slate-200 pb-8 mb-10">
          <div className="inline-block px-4 py-1.5 rounded-full bg-[#0057B8]/10 text-[#0057B8] text-xs font-black uppercase tracking-wider mb-4">
            Legal Agreement
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-[#071A33]">
            Terms of Service
          </h1>
          <p className="text-sm text-slate-500 mt-3 font-medium">
            Effective Date: August 9, 2026 | Last Updated: August 9, 2026
          </p>
        </div>

        {/* Document Content */}
        <div className="space-y-8 text-slate-700 leading-relaxed text-base">
          <section>
            <h2 className="text-xl font-black text-[#071A33] mb-3">1. Acceptance of Terms</h2>
            <p>
              By accessing, browsing, or enrolling in any program offered through <strong>Veezna</strong> (&quot;Veezna&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) via our website <Link href="https://veezna.com" className="text-[#0057B8] underline">veezna.com</Link> or in-person facilities, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our website or services.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-[#071A33] mb-3">2. Description of Services</h2>
            <p>
              Veezna provides educational coaching, academic development, spoken English and communication training (VOX), web development instruction, personal growth mentoring, and wellness consultations. Services are delivered via the Veezna Learning System (VLS) framework through live sessions, digital learning materials, and physical coaching centers.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-[#071A33] mb-3">3. Student Enrollment &amp; Minor Accounts</h2>
            <p>
              For learners under the age of 18 (minors), enrollment must be completed with the explicit authorization and consent of a parent or legal guardian. The parent or guardian agrees to accept full responsibility for the minor&apos;s compliance with these Terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-[#071A33] mb-3">4. Intellectual Property Rights</h2>
            <p>
              All proprietary course materials, curriculum outlines, V-CPM cognitive mapping structures, design graphics, software tools, logos, and digital portal content remain the exclusive intellectual property of Veezna. Unlawful copying, distribution, reselling, or public dissemination of Veezna content without written consent is strictly prohibited.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-[#071A33] mb-3">5. User Conduct &amp; Code of Behavior</h2>
            <p>
              Students, parents, and portal users are expected to maintain respectful, constructive, and ethical behavior across all physical and online classrooms, forums, and portals. Veezna reserves the right to suspend or terminate service access without refund for any user engaging in harassment, academic dishonesty, unauthorized portal access, or disruptive behavior.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-[#071A33] mb-3">6. Payment Terms &amp; Refund Policy</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Fees:</strong> Program fees must be paid according to the selected installment or full payment schedule prior to session commencement.</li>
              <li><strong>Refunds:</strong> Refund requests are subject to Veezna&apos;s enrollment cancellation guidelines specified at the time of admission. Registration or administrative fees are non-refundable.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-black text-[#071A33] mb-3">7. Limitation of Liability</h2>
            <p>
              While Veezna strives for academic excellence and personal transformation, educational outcomes depend significantly on individual student effort and participation. Veezna does not guarantee specific exam ranks, job placements, or financial outcomes. To the maximum extent permitted by law, Veezna shall not be liable for indirect, incidental, or consequential damages arising from service usage.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-[#071A33] mb-3">8. Governing Law &amp; Jurisdiction</h2>
            <p>
              These Terms of Service shall be governed by and construed in accordance with the laws of India. Any disputes arising under or in connection with these Terms shall be subject to the exclusive jurisdiction of the competent courts located in Neemuch, Madhya Pradesh, India.
            </p>
          </section>

          <section className="border-t border-slate-200 pt-6">
            <h2 className="text-xl font-black text-[#071A33] mb-3">9. Contact Information</h2>
            <p>For questions regarding these Terms of Service, please contact us at:</p>
            <p className="mt-2 font-semibold">
              Veezna<br />
              Location: Neemuch, Madhya Pradesh, India<br />
              Email: <a href="mailto:contact@veezna.com" className="text-[#0057B8] underline">contact@veezna.com</a><br />
              Phone / WhatsApp: +91 90011 70039
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}