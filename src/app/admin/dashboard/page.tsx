"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function AdminDashboardPage() {
  const router = useRouter();
  const pathname = usePathname();

  // Authentication & Loading States
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Real-time Firebase Authentication Guard & Role Verification Architecture
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        // Redirect unauthenticated users immediately to admin login
        router.replace("/admin/login");
        return;
      }

      try {
        // Retrieve ID token result with force-refresh to check custom claims
        const tokenResult = await currentUser.getIdTokenResult(true);

        /* 
          ROLE VERIFICATION HOOK:
          Uncomment and adjust the custom claim check below once admin claims are configured:
          
          if (!tokenResult.claims.admin) {
            console.error("Unauthorized access: User lacks administrator claim.");
            await signOut(auth);
            router.replace("/admin/login");
            return;
          }
        */

        setUser(currentUser);
      } catch (err) {
        console.error("Error verifying admin credentials:", err);
        router.replace("/admin/login");
      } finally {
        setAuthLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  // Real Firebase Logout Handler
  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.replace("/admin/login");
    } catch (error) {
      console.error("Logout Error:", error);
    }
  };

  // Sidebar Items Definition
  const navigationItems = [
    {
      name: "Dashboard",
      href: "/admin/dashboard",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      ),
    },
    {
      name: "Students",
      href: "/admin/students",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0112 20.055a11.952 11.952 0 01-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
        </svg>
      ),
    },
    {
      name: "Admissions",
      href: "/admin/admissions",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      name: "Fees & Payments",
      href: "/admin/fees",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
    },
    {
      name: "Attendance",
      href: "/admin/attendance",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      name: "Courses",
      href: "/admin/courses",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
    },
    {
      name: "Batches",
      href: "/admin/batches",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
    },
    {
      name: "Reports",
      href: "/admin/reports",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
    },
    {
      name: "Settings",
      href: "/admin/settings",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
  ];

  // Global Loading State View
  if (authLoading) {
    return (
      <div className="min-h-screen w-full bg-[#02142d] text-white flex flex-col items-center justify-center font-sans antialiased">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#F7931E] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-slate-300 animate-pulse">
            Verifying Admin Session...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#02142d] text-slate-100 flex flex-col md:flex-row font-sans antialiased relative overflow-x-hidden">
      
      {/* BACKGROUND AMBIENT GLOWS */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-[#0057B8]/15 blur-[140px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-[#F7931E]/10 blur-[160px]" />
        <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.8)_1px,transparent_0)] bg-[size:32px_32px]" />
      </div>

      {/* MOBILE SIDEBAR DRAWER OVERLAY */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden transition-opacity"
        />
      )}

      {/* SIDEBAR COMPONENT */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-50 h-screen w-64 bg-[#042d5a]/90 backdrop-blur-2xl border-r border-white/10 flex flex-col justify-between transition-transform duration-300 ease-in-out ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div>
          {/* LOGO & BRANDING HEADER */}
          <div className="p-5 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative px-3 py-1.5 bg-white rounded-xl shadow-md border border-white/80">
                <Image
                  src="/images/veezna-logo.png"
                  alt="VEEZNA Logo"
                  width={100}
                  height={36}
                  priority
                  className="object-contain h-7 w-auto"
                />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-sm tracking-tight text-white leading-none">
                  VEEZNA
                </span>
                <span className="text-[10px] uppercase font-semibold text-[#F7931E] tracking-widest mt-0.5">
                  Admin
                </span>
              </div>
            </div>
            {/* Mobile Close Button */}
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="md:hidden text-slate-400 hover:text-white p-1"
              aria-label="Close Sidebar"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* NAVIGATION LINKS */}
          <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-140px)]">
            {navigationItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-gradient-to-r from-[#F7931E] to-amber-600 text-white font-semibold shadow-[0_0_15px_rgba(247,147,30,0.35)]"
                      : "text-slate-300 hover:text-white hover:bg-white/5 border border-transparent"
                  }`}
                >
                  <span className={isActive ? "text-white" : "text-slate-400"}>
                    {item.icon}
                  </span>
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* SIDEBAR FOOTER BRAND TAGLINE */}
        <div className="p-4 border-t border-white/10 text-center bg-black/20">
          <p className="text-[11px] font-semibold text-[#F7931E] tracking-wide uppercase">
            Clarity With Care
          </p>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 z-10">
        
        {/* TOP HEADER BAR */}
        <header className="sticky top-0 z-30 h-16 bg-[#042d5a]/70 backdrop-blur-xl border-b border-white/10 px-4 sm:px-8 flex items-center justify-between">
          
          <div className="flex items-center gap-3">
            {/* Hamburger Toggle Button for Mobile */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden text-slate-300 hover:text-white p-2 rounded-lg bg-white/5 border border-white/10 focus:outline-none"
              aria-label="Open Sidebar Menu"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
              Admin Dashboard
            </h1>
          </div>

          {/* USER PROFILE & LOGOUT ACTION */}
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-2.5 bg-slate-900/50 border border-white/10 px-3 py-1.5 rounded-full">
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#0057B8] to-[#F7931E] flex items-center justify-center text-white font-bold text-xs shadow-inner">
                {user?.email ? user.email.charAt(0).toUpperCase() : "A"}
              </div>
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-xs font-semibold text-white leading-tight">
                  VEEZNA Administrator
                </span>
                <span className="text-[10px] text-slate-400 truncate max-w-[140px]">
                  {user?.email || "admin@veezna.com"}
                </span>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-red-300 hover:text-white bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 transition-all duration-200 focus:outline-none"
              title="Logout from Admin Portal"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </header>

        {/* DASHBOARD BODY CONTENT */}
        <main className="flex-1 p-4 sm:p-8 space-y-8 max-w-7xl mx-auto w-full">
          
          {/* WELCOME BANNER SECTION */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#042d5a] via-[#0057B8]/40 to-[#042d5a] border border-white/15 p-6 sm:p-8 shadow-2xl">
            <div className="relative z-10 max-w-2xl">
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-2">
                Good Morning, Administrator 👋
              </h2>
              <p className="text-xs sm:text-sm text-slate-200 mt-2 font-light leading-relaxed">
                Here's what's happening with VEEZNA today. Manage admissions, track student performance, review fee payments, and oversee institutional operations.
              </p>
            </div>
            {/* Decorative Ambient Accents */}
            <div className="absolute right-[-20px] bottom-[-20px] w-48 h-48 bg-[#F7931E]/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute right-8 top-1/2 -translate-y-1/2 hidden lg:block opacity-20 text-7xl font-sans font-bold text-white select-none">
              VEEZNA
            </div>
          </div>

          {/* STATISTICS CARDS GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            
            {/* Card 1: Total Students */}
            <div className="bg-[#042d5a]/60 backdrop-blur-xl border border-white/15 rounded-2xl p-5 shadow-lg hover:border-white/25 transition-all group">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Total Students
                </span>
                <div className="p-2.5 rounded-xl bg-[#0057B8]/20 border border-[#0057B8]/30 text-[#0057B8] group-hover:scale-110 transition-transform">
                  <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0112 20.055a11.952 11.952 0 01-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                  </svg>
                </div>
              </div>
              <div className="mt-4 flex items-baseline justify-between">
                <span className="text-3xl font-extrabold text-white tracking-tight">0</span>
                <span className="text-[11px] font-medium text-slate-400">Ready for Firestore</span>
              </div>
            </div>

            {/* Card 2: Active Students */}
            <div className="bg-[#042d5a]/60 backdrop-blur-xl border border-white/15 rounded-2xl p-5 shadow-lg hover:border-white/25 transition-all group">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Active Students
                </span>
                <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 group-hover:scale-110 transition-transform">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="mt-4 flex items-baseline justify-between">
                <span className="text-3xl font-extrabold text-white tracking-tight">0</span>
                <span className="text-[11px] font-medium text-slate-400">Enrolled & Active</span>
              </div>
            </div>

            {/* Card 3: Pending Admissions */}
            <div className="bg-[#042d5a]/60 backdrop-blur-xl border border-white/15 rounded-2xl p-5 shadow-lg hover:border-white/25 transition-all group">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Pending Admissions
                </span>
                <div className="p-2.5 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400 group-hover:scale-110 transition-transform">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="mt-4 flex items-baseline justify-between">
                <span className="text-3xl font-extrabold text-white tracking-tight">0</span>
                <span className="text-[11px] font-medium text-amber-400 font-semibold">Action Required</span>
              </div>
            </div>

            {/* Card 4: Fees Collected */}
            <div className="bg-[#042d5a]/60 backdrop-blur-xl border border-white/15 rounded-2xl p-5 shadow-lg hover:border-white/25 transition-all group">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Fees Collected
                </span>
                <div className="p-2.5 rounded-xl bg-[#F7931E]/20 border border-[#F7931E]/30 text-[#F7931E] group-hover:scale-110 transition-transform">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
              <div className="mt-4 flex items-baseline justify-between">
                <span className="text-3xl font-extrabold text-white tracking-tight">₹0</span>
                <span className="text-[11px] font-medium text-slate-400">Total Revenue</span>
              </div>
            </div>

          </div>

          {/* QUICK ACTIONS SECTION */}
          <div className="space-y-4">
            <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#F7931E]" />
              Quick Actions
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
              
              {/* Action 1: Add Student */}
              <Link
                href="/admin/students/add"
                className="flex flex-col items-center justify-center p-4 rounded-2xl bg-[#042d5a]/70 border border-white/15 hover:border-[#F7931E]/50 hover:bg-[#0057B8]/20 transition-all duration-200 group text-center shadow-md"
              >
                <div className="p-3 rounded-xl bg-[#F7931E]/20 border border-[#F7931E]/30 text-[#F7931E] group-hover:scale-110 transition-transform mb-2">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                </div>
                <span className="text-xs font-semibold text-white group-hover:text-[#F7931E] transition-colors">
                  Add Student
                </span>
              </Link>

              {/* Action 2: View Students */}
              <Link
                href="/admin/students"
                className="flex flex-col items-center justify-center p-4 rounded-2xl bg-[#042d5a]/70 border border-white/15 hover:border-[#F7931E]/50 hover:bg-[#0057B8]/20 transition-all duration-200 group text-center shadow-md"
              >
                <div className="p-3 rounded-xl bg-[#0057B8]/20 border border-[#0057B8]/30 text-blue-400 group-hover:scale-110 transition-transform mb-2">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0112 20.055a11.952 11.952 0 01-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                  </svg>
                </div>
                <span className="text-xs font-semibold text-white group-hover:text-[#F7931E] transition-colors">
                  View Students
                </span>
              </Link>

              {/* Action 3: Review Admissions */}
              <Link
                href="/admin/admissions"
                className="flex flex-col items-center justify-center p-4 rounded-2xl bg-[#042d5a]/70 border border-white/15 hover:border-[#F7931E]/50 hover:bg-[#0057B8]/20 transition-all duration-200 group text-center shadow-md"
              >
                <div className="p-3 rounded-xl bg-purple-500/20 border border-purple-500/30 text-purple-400 group-hover:scale-110 transition-transform mb-2">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <span className="text-xs font-semibold text-white group-hover:text-[#F7931E] transition-colors">
                  Review Admissions
                </span>
              </Link>

              {/* Action 4: Record Payment */}
              <Link
                href="/admin/fees"
                className="flex flex-col items-center justify-center p-4 rounded-2xl bg-[#042d5a]/70 border border-white/15 hover:border-[#F7931E]/50 hover:bg-[#0057B8]/20 transition-all duration-200 group text-center shadow-md"
              >
                <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 group-hover:scale-110 transition-transform mb-2">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <span className="text-xs font-semibold text-white group-hover:text-[#F7931E] transition-colors">
                  Record Payment
                </span>
              </Link>

              {/* Action 5: Mark Attendance */}
              <Link
                href="/admin/attendance"
                className="col-span-2 sm:col-span-1 flex flex-col items-center justify-center p-4 rounded-2xl bg-[#042d5a]/70 border border-white/15 hover:border-[#F7931E]/50 hover:bg-[#0057B8]/20 transition-all duration-200 group text-center shadow-md"
              >
                <div className="p-3 rounded-xl bg-teal-500/20 border border-teal-500/30 text-teal-400 group-hover:scale-110 transition-transform mb-2">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                </div>
                <span className="text-xs font-semibold text-white group-hover:text-[#F7931E] transition-colors">
                  Mark Attendance
                </span>
              </Link>

            </div>
          </div>

          {/* RECENT ACTIVITY SECTION */}
          <div className="space-y-4">
            <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#F7931E]" />
              Recent Activity
            </h3>

            <div className="bg-[#042d5a]/60 backdrop-blur-xl border border-white/15 rounded-3xl p-8 sm:p-12 text-center shadow-lg flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-2xl bg-slate-900/50 border border-white/10 flex items-center justify-center text-slate-400 mb-4 shadow-inner">
                <svg className="w-8 h-8 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h4 className="text-base font-semibold text-slate-200">
                No recent activity yet.
              </h4>
              <p className="text-xs text-slate-400 mt-1 max-w-sm font-light">
                System activities, new student enrollments, fee transactions, and attendance logs will appear here in real-time.
              </p>
            </div>
          </div>

        </main>
      </div>

    </div>
  );
}