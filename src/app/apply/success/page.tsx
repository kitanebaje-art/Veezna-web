'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function SuccessContent() {
  const searchParams = useSearchParams();
  const appId = searchParams.get('appId') || 'N/A';
  const utr = searchParams.get('utr') || 'N/A';
  const amount = searchParams.get('amount') || '0';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50/50 to-slate-200 flex items-center justify-center p-4 font-sans antialiased">
      <div className="max-w-md w-full bg-white/95 backdrop-blur-2xl rounded-3xl shadow-2xl shadow-slate-400/30 border border-white/80 p-8 text-center space-y-6">
        {/* Animated Success Badge */}
        <div className="w-20 h-20 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto text-emerald-600 text-4xl font-black shadow-lg shadow-emerald-500/20 transform hover:scale-105 transition-transform">
          ✓
        </div>

        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Application Submitted!</h1>
          <p className="text-xs text-slate-600 font-semibold mt-2 leading-relaxed">
            Your admission application has been recorded. Our admissions team will verify your payment UTR and update your admission status shortly.
          </p>
        </div>

        {/* Application Summary Box */}
        <div className="bg-slate-50 rounded-2xl p-5 text-left text-sm space-y-3 border-2 border-slate-200/80 shadow-inner">
          <div className="flex justify-between items-center border-b border-slate-200 pb-2">
            <span className="text-slate-500 font-bold text-xs uppercase">Application Ref:</span>
            <span className="font-mono font-black text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-300">
              {appId}
            </span>
          </div>

          <div className="flex justify-between items-center border-b border-slate-200 pb-2">
            <span className="text-slate-500 font-bold text-xs uppercase">UPI UTR / Ref ID:</span>
            <span className="font-mono font-bold text-xs text-slate-800">{utr}</span>
          </div>

          <div className="flex justify-between items-center border-b border-slate-200 pb-2">
            <span className="text-slate-500 font-bold text-xs uppercase">Amount Payable:</span>
            <span className="font-black text-[#0057B8] text-base">
              ₹{Number(amount).toLocaleString('en-IN')}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-slate-500 font-bold text-xs uppercase">Status:</span>
            <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
              Under Review
            </span>
          </div>
        </div>

        {/* Informational Alert */}
        <div className="p-3 bg-blue-50/80 rounded-xl border border-blue-200 text-left">
          <p className="text-[11px] text-slate-600 font-medium">
            💡 <strong className="text-[#0057B8]">Next Steps:</strong> Save your Application Reference number. You will receive an SMS/Email confirmation once your UTR is verified by the administrator.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex flex-col gap-3">
          <button
            onClick={() => window.print()}
            className="w-full bg-[#0057B8] text-white py-3.5 rounded-xl text-sm font-black shadow-lg shadow-[#0057B8]/25 hover:bg-blue-700 transition-all hover:scale-[1.01] active:scale-95"
          >
            🖨️ Print / Save Acknowledgement
          </button>
          <Link
            href="/"
            className="w-full py-2.5 text-center text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors"
          >
            ← Return to Homepage
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ApplicationSuccessPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center font-bold text-slate-600">Loading receipt details...</div>}>
      <SuccessContent />
    </Suspense>
  );
}