'use client';

import React from 'react';
import Link from 'next/link';

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-[#F7FAFF] text-[#071A33] py-20 font-sans">
      <div className="max-w-4xl mx-auto px-6 sm:px-8">
        {/* Header */}
        <div className="border-b border-slate-200 pb-8 mb-10">
          <div className="inline-block px-4 py-1.5 rounded-full bg-[#0057B8]/10 text-[#0057B8] text-xs font-black uppercase tracking-wider mb-4">
            Data Governance
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-[#071A33]">
            Privacy Policy
          </h1>
          <p className="text-sm text-slate-500 mt-3 font-medium">
            Effective Date: August 9, 2026 | Last Updated: August 9, 2026
          </p>
        </div>

        {/* Document Content */}
        <div className="space-y-8 text-slate-700 leading-relaxed text-base">
          <section>
            <p>
              At <strong>Veezna</strong> (&quot;Veezna&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;), accessible from{' '}
              <Link href="https://veezna.com" className="text-[#0057B8] underline">
                veezna.com
              </Link>
              , one of our main priorities is the privacy of our visitors, students, clients, and partners. This Privacy Policy document outlines the types of information that is collected and recorded by Veezna and how we use, process, and protect it across our academic coaching, skill development, and wellness branches.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-[#071A33] mb-3">1. Information We Collect</h2>
            <p className="mb-3">
              We collect several types of information from and about users of our website and services:
            </p>

            <div className="space-y-3 pl-4 border-l-2 border-[#0057B8]">
              <div>
                <h3 className="font-extrabold text-[#071A33]">A. Personal Information</h3>
                <ul className="list-disc pl-5 text-sm space-y-1 mt-1">
                  <li><strong>Contact Details:</strong> Full name, email address, phone number, WhatsApp number, and postal address.</li>
                  <li><strong>Educational Information:</strong> Grade/class level, academic performance metrics, learning goals, and enrollment history.</li>
                  <li><strong>Wellness &amp; Consultation Records:</strong> Information disclosed voluntarily during wellness sessions, lifestyle intake forms, or counseling consultations.</li>
                  <li><strong>Payment Data:</strong> Billing details and payment status (processed securely through authorized third-party gateways; we do not store credit/debit card numbers on our servers).</li>
                </ul>
              </div>

              <div className="pt-2">
                <h3 className="font-extrabold text-[#071A33]">B. Non-Personal &amp; Technical Data</h3>
                <ul className="list-disc pl-5 text-sm space-y-1 mt-1">
                  <li><strong>Usage &amp; Device Data:</strong> IP address, browser type, operating system, referring URLs, pages viewed, and access timestamps.</li>
                  <li><strong>Cookies &amp; Tracking:</strong> Session identifiers and preferences stored via cookies to enhance user navigation and portal performance.</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-black text-[#071A33] mb-3">2. How We Use Your Information</h2>
            <p className="mb-2">Veezna uses the collected data for the following purposes:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Educational &amp; Service Delivery:</strong> To enroll students in the Veezna Learning System (VLS), deliver course content, issue certifications, and track academic progress.</li>
              <li><strong>Wellness &amp; Therapy Services:</strong> To structure personalized wellness guidance, consultations, and therapy appointments.</li>
              <li><strong>Communication:</strong> To send course updates, schedules, payment receipts, policy notifications, and respond to inquiries via email, phone, or WhatsApp.</li>
              <li><strong>Portal Administration:</strong> To maintain student and admin dashboards, authenticate user logins, and prevent unauthorized access.</li>
              <li><strong>Continuous Improvement:</strong> To analyze website analytics, refine our curriculum, and optimize overall user experience.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-black text-[#071A33] mb-3">3. Data Protection &amp; Security</h2>
            <p>
              We implement industry-standard administrative, technical, and physical security measures to safeguard your personal data:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li><strong>Encryption:</strong> Data transmitted to and from our website is encrypted using SSL/TLS protocols.</li>
              <li><strong>Restricted Access:</strong> Access to personal and wellness records is strictly limited to authorized Veezna personnel on a need-to-know basis.</li>
              <li><strong>Storage Protocols:</strong> Electronic data is stored in secure database environments with active monitoring against unauthorized intrusion or data breaches.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-black text-[#071A33] mb-3">4. Disclosure &amp; Sharing of Information</h2>
            <p>
              <strong>Veezna does not sell, trade, or rent your personal information to third parties.</strong> We may disclose personal data only under the following limited circumstances:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li><strong>Service Providers:</strong> Trusted third-party vendors (such as cloud hosting, payment gateways, and communications platforms) operating under strict confidentiality obligations.</li>
              <li><strong>Legal Requirements:</strong> When required by law, court order, or governmental regulations to protect our rights, safety, or property.</li>
              <li><strong>Consent:</strong> When you explicitly authorize us to share information with a specified third party.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-black text-[#071A33] mb-3">5. Cookies and Web Beacons</h2>
            <p>
              Veezna uses cookies to store information about visitors&apos; preferences and the pages on the website that the user accessed or visited. This information is used to optimize the users&apos; experience by customizing our web page content based on browser type or other technical information. You may choose to disable cookies through your individual browser options.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-[#071A33] mb-3">6. Privacy Rights &amp; User Choices</h2>
            <p className="mb-2">Depending on your jurisdiction, you have the following rights regarding your personal information:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Access &amp; Rectification:</strong> The right to request copies of your personal data and correct any inaccuracies.</li>
              <li><strong>Data Deletion:</strong> The right to request the deletion or removal of your personal information from our active databases, subject to legal retention obligations.</li>
              <li><strong>Opt-Out:</strong> The right to unsubscribe from promotional emails or communications at any time.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-black text-[#071A33] mb-3">7. Children&apos;s Privacy</h2>
            <p>
              For secondary school students and minors participating in Veezna academic programs, we collect personal data only with the explicit consent and involvement of a parent or legal guardian. If you believe your child has provided personal information without parental consent, please contact us immediately so we can remove the data.
            </p>
          </section>

          <section className="border-t border-slate-200 pt-6">
            <h2 className="text-xl font-black text-[#071A33] mb-3">8. Contact Us</h2>
            <p>If you have questions, concerns, or requests regarding this Privacy Policy or your personal data, please reach out to us:</p>
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