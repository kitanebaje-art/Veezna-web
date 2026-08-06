import React from 'react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-slate-950 text-slate-400 py-16 border-t border-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">
          
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3 text-white">
              <div className="w-9 h-9 rounded-xl bg-[#0057B8] flex items-center justify-center font-bold">
                V
              </div>
              <span className="font-black text-2xl tracking-tight">VEEZNA</span>
            </div>
            <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
              Vision Turns Into Mission. A modern educational and wellness institution dedicated to practical learning, spoken English mastery, and career excellence.
            </p>
          </div>

          <div>
            <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-4">Divisions</h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link href="/programs/academic-excellence" className="hover:text-white transition-colors">Academic Excellence</Link></li>
              <li><Link href="/programs/spoken-english-vox" className="hover:text-white transition-colors">Veezna VOX</Link></li>
              <li><Link href="/programs/web-development" className="hover:text-white transition-colors">Web Development</Link></li>
              <li><Link href="/programs/wellness-counselling" className="hover:text-white transition-colors">Wellness & Care</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-4">Portals</h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link href="/portal/dashboard" className="hover:text-white transition-colors">Student Dashboard</Link></li>
              <li><Link href="/admin/dashboard" className="hover:text-white transition-colors">Admin Control Center</Link></li>
              <li><Link href="/vls" className="hover:text-white transition-colors">VLS Framework</Link></li>
              <li><Link href="/about" className="hover:text-white transition-colors">About Founders</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-4">Contact & Support</h4>
            <p className="text-sm text-slate-400">Neemuch, Madhya Pradesh, India</p>
            <p className="text-sm font-semibold text-[#F7931E] mt-2">+91 90011 70039</p>
            <p className="text-sm text-slate-400 mt-1">contact@veezna.com</p>
          </div>

        </div>

        <div className="pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© 2026 Veezna. All Rights Reserved.</p>
          <div className="flex gap-6">
            <Link href="#" className="hover:text-slate-300">Privacy Policy</Link>
            <Link href="#" className="hover:text-slate-300">Terms of Service</Link>
            <Link href="#" className="hover:text-slate-300">Care Disclaimer</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}