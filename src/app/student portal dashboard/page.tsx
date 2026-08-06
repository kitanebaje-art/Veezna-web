import React from 'react';
import Link from 'next/link';

export default function StudentPortalDashboard() {
  return (
    <div className="space-y-8">
      {/* Banner */}
      <div className="rounded-[32px] bg-gradient-to-r from-[#0057B8] to-[#00BFFF] p-8 sm:p-10 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-xl space-y-2">
          <span className="text-xs font-bold uppercase tracking-widest bg-white/20 px-3 py-1 rounded-full">
            Active Student Portal
          </span>
          <h1 className="text-3xl font-black">Welcome Back, Student</h1>
          <p className="text-blue-100 text-sm">
            Check your class schedule, download study materials, and manage fee receipts.
          </p>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Classes Attended', val: '96%', sub: 'High Attendance' },
          { label: 'Enrolled Program', val: 'Class 11 Commerce', sub: 'Active Cohort' },
          { label: 'Fee Status', val: 'Cleared', sub: 'Receipt #VZ-8842' },
          { label: 'Pending Tasks', val: '2 Homeworks', sub: 'Due Saturday' },
        ].map((m, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
            <span className="text-xs font-bold text-slate-400 uppercase">{m.label}</span>
            <div className="text-2xl font-black text-slate-900 mt-1">{m.val}</div>
            <div className="text-xs font-semibold text-emerald-600 mt-1">{m.sub}</div>
          </div>
        ))}
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 space-y-4">
          <div className="flex justify-between items-center border-b pb-3">
            <h3 className="font-bold text-slate-900 text-lg">My Fee Ledger</h3>
            <Link href="/portal/fees" className="text-xs font-bold text-[#0057B8]">View Full History →</Link>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">Total Program Fee</span>
            <span className="font-bold text-slate-900">₹44,500</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">Amount Paid</span>
            <span className="font-bold text-emerald-600">₹44,500</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">Balance Due</span>
            <span className="font-bold text-slate-900">₹0</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 space-y-4">
          <div className="flex justify-between items-center border-b pb-3">
            <h3 className="font-bold text-slate-900 text-lg">Upcoming Class Schedule</h3>
            <span className="text-xs font-bold text-slate-400">August 2026</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border flex justify-between items-center text-xs">
            <div>
              <h4 className="font-bold text-slate-900">Accountancy & Financial Statements</h4>
              <p className="text-slate-500">10:00 AM – 11:30 AM IST</p>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-blue-100 text-[#0057B8] font-bold">Classroom A</span>
          </div>
        </div>
      </div>
    </div>
  );
}