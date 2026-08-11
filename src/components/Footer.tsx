'use client';

import React from 'react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-slate-950 text-slate-400 py-16 border-t border-slate-900 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">
          
          {/* BRAND COLUMN WITH SVG LOGO PLACEHOLDER */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="inline-flex items-center gap-3 text-white group">
             
          <div className="w-10 h-12 rounded-2xl bg-white shadow-lg flex items-center justify-center overflow-hidden">
            <img
              src="/images/veezna-logo.svg"
              alt="Veezna Logo"
              className="w-full h-full object-contain"
            />
          </div>
              {/* ========================================================= */}
              {/* SVG LOGO PLACEHOLDER - REPLACE THIS SVG WITH YOUR OWN     */}
              {/* ========================================================= */}
              
              {/* ========================================================= */}

              <span className="font-black text-2xl tracking-tight text-white">VEEZNA</span>
            </Link>

            <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
              Vision Turns Into Mission. A modern educational and wellness institution dedicated to practical learning, spoken English mastery, and career excellence.
            </p>
          </div>

          {/* DIVISIONS */}
          <div>
            <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-4">
              Divisions
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/programs/academic-excellence" className="hover:text-[#0057B8] transition-colors">
                  Academic Excellence
                </Link>
              </li>
              <li>
                <Link href="/programs/spoken-english-vox" className="hover:text-[#F7931E] transition-colors">
                  Veezna VOX
                </Link>
              </li>
              <li>
                <Link href="/programs/web-development" className="hover:text-white transition-colors">
                  Web Development
                </Link>
              </li>
              <li>
                <Link href="/programs/wellness-counselling" className="hover:text-white transition-colors">
                  Wellness & Care
                </Link>
              </li>
            </ul>
          </div>

     {/* PORTALS */}
<div>
  <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-4">
    Portals 
  </h4>
  <ul className="space-y-2.5 text-sm">
    <li>
      <Link href="/portal/dashboard" className="hover:text-white transition-colors">
        Student Dashboard
      </Link>
    </li>
    <li>
      <Link href="/admin/dashboard" className="hover:text-white transition-colors">
        Admin Control Center
      </Link>
    </li>
    <li>
      <Link href="/#vls" className="hover:text-white transition-colors">
        VLS Framework
      </Link>
    </li>
    <li>
      <Link href="/AboutVeezna" className="hover:text-white transition-colors">
        About Founder
      </Link>
    </li>
  </ul>
</div>

          {/* CONTACT & SUPPORT */}
          <div>
            <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-4">
              Contact & Support
            </h4>
            <p className="text-sm text-slate-400">Neemuch, Madhya Pradesh, India</p>
            <a href="tel:+919001170039" className="text-sm font-semibold text-[#F7931E] hover:underline block mt-2">
              +91 90011 70039
            </a>
            <a href="mailto:contact@veezna.com" className="text-sm text-slate-400 hover:text-white transition-colors mt-1 block">
              contact@veezna.com
            </a>
          </div>

        </div>

        {/* BOTTOM COPYRIGHT */}
        <div className="pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© 2026 Veezna. All Rights Reserved.</p>
          <div className="flex gap-6">
            <Link href="/privacy-policy" className="hover:text-slate-300 transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms-of-service" className="hover:text-slate-300 transition-colors">
              Terms of Service
            </Link>
            <Link href="/care-disclaimer" className="hover:text-slate-300 transition-colors">
              Care Disclaimer
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}