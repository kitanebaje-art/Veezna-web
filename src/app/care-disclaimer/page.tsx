'use client';

import React from 'react';
import Link from 'next/link';

export default function CareDisclaimerPage() {
  return (
    <main className="min-h-screen bg-[#F7FAFF] text-[#071A33] py-20 font-sans">
      <div className="max-w-4xl mx-auto px-6 sm:px-8">
        {/* Header */}
        <div className="border-b border-slate-200 pb-8 mb-10">
          <div className="inline-block px-4 py-1.5 rounded-full bg-[#F7931E]/10 text-[#F7931E] text-xs font-black uppercase tracking-wider mb-4">
            Wellness &amp; Counseling Notice
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-[#071A33]">
            Care &amp; Wellness Disclaimer
          </h1>
          <p className="text-sm text-slate-500 mt-3 font-medium">
            Effective Date: August 9, 2026 | Last Updated: August 9, 2026
          </p>
        </div>

        {/* Document Content */}
        <div className="space-y-8 text-slate-700 leading-relaxed text-base">
          <section className="p-6 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-900">
            <strong className="font-bold block text-sm uppercase tracking-wider mb-1">Important Notice:</strong>
            <p className="text-sm">
              The wellness therapies, supportive counseling, acupressure, hypnotherapy, cupping, neurotherapy, and lifestyle guidance offered under the Veezna Wellness branch are intended solely for personal growth, stress management, and complementary wellness support.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-[#071A33] mb-3">1. Not Medical or Psychiatric Treatment</h2>
            <p>
              Veezna wellness therapies and supportive counseling services do <strong>NOT</strong> constitute medical advice, clinical psychiatric diagnosis, or formal medical treatment. Our practitioners and mentors are not acting as licensed medical doctors, clinical psychiatrists, or emergency healthcare providers unless explicitly stated.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-[#071A33] mb-3">2. Complementary Approach</h2>
            <p>
              Our wellness modalities (including manual therapy, holistic counseling, and lifestyle guidance) are designed to complement—not replace—professional medical advice, prescribed clinical treatments, or psychiatric interventions. Clients are strongly advised never to disregard or delay seeking professional medical advice because of information provided by Veezna.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-[#071A33] mb-3">3. Emergency Situations</h2>
            <p>
              If you or someone you know is experiencing a medical emergency, severe mental health crisis, or suicidal thoughts, please contact an emergency medical service, visit the nearest hospital, or call a recognized crisis helpline immediately. Veezna does not provide immediate emergency crisis intervention services.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-[#071A33] mb-3">4. Individual Client Responsibility</h2>
            <p>
              Participation in Veezna wellness sessions, exercises, or counseling is voluntary. Clients and guardians agree to provide accurate health history information prior to therapy sessions. Veezna shall not be held liable for personal choices or health decisions made independently by clients.
            </p>
          </section>

          <section className="border-t border-slate-200 pt-6">
            <h2 className="text-xl font-black text-[#071A33] mb-3">5. Contact Us</h2>
            <p>If you have questions regarding our Care &amp; Wellness Disclaimer, please reach out to us:</p>
            <p className="mt-2 font-semibold">
              Veezna Wellness Division<br />
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