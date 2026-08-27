"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { collection, getDocs, query, where } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import AdminSidebar from "@/components/AdminSidebar";

// ==========================================
// ADVANCED 3D TILT CARD COMPONENT
// ==========================================
interface Card3DProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
}

const Card3D: React.FC<Card3DProps> = ({
  children,
  className = "",
  glowColor = "rgba(0, 87, 184, 0.25)",
}) => {
  const cardRef = useRef<HTMLDivElement>(null);

  const [transformStyle, setTransformStyle] = useState(
    "perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0px)"
  );

  const [glareStyle, setGlareStyle] = useState({
    opacity: 0,
    x: "50%",
    y: "50%",
  });

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!cardRef.current) return;

      const rect = cardRef.current.getBoundingClientRect();

      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const rotateX = ((y - centerY) / centerY) * -6;
      const rotateY = ((x - centerX) / centerX) * 6;

      setTransformStyle(
        `perspective(1000px) rotateX(${rotateX.toFixed(
          2
        )}deg) rotateY(${rotateY.toFixed(2)}deg) translateZ(8px)`
      );

      setGlareStyle({
        opacity: 0.15,
        x: `${((x / rect.width) * 100).toFixed(1)}%`,
        y: `${((y / rect.height) * 100).toFixed(1)}%`,
      });
    },
    []
  );

  const handleMouseLeave = useCallback(() => {
    setTransformStyle(
      "perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0px)"
    );

    setGlareStyle({
      opacity: 0,
      x: "50%",
      y: "50%",
    });
  }, []);

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: transformStyle,
        transition:
          "transform 0.18s cubic-bezier(0.1, 0.8, 0.3, 1)",
        willChange: "transform",
      }}
      className={`relative rounded-3xl transition-all duration-300 ${className}`}
    >
      <div
        className="pointer-events-none absolute inset-0 rounded-3xl transition-opacity duration-300 z-20"
        style={{
          background: `radial-gradient(circle at ${glareStyle.x} ${glareStyle.y}, rgba(255,255,255,0.15) 0%, transparent 60%)`,
          opacity: glareStyle.opacity,
        }}
      />

      {children}
    </div>
  );
};

// ==========================================
// ADMIN DASHBOARD
// ==========================================
export default function AdminDashboardPage() {
  const router = useRouter();

  // ==========================================
  // AUTHENTICATION STATES
  // ==========================================
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [logoError, setLogoError] = useState(false);

  // ==========================================
  // DYNAMIC METRICS
  // ==========================================
  const [metrics, setMetrics] = useState({
    totalStudents: 0,
    activeStudents: 0,
    pendingAdmissions: 0,
    feesCollected: 0,
  });

  const [metricsLoading, setMetricsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // ==========================================
  // FIREBASE AUTH GUARD
  // ==========================================
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (currentUser) => {
        if (!currentUser) {
          router.replace("/admin/login");
          return;
        }

        try {
          await currentUser.getIdTokenResult(true);
          setUser(currentUser);
        } catch (err) {
          console.error(
            "Error verifying admin credentials:",
            err
          );

          router.replace("/admin/login");
        } finally {
          setAuthLoading(false);
        }
      }
    );

    return () => unsubscribe();
  }, [router]);

  // ==========================================
  // FIRESTORE DASHBOARD METRICS
  // ==========================================
  useEffect(() => {
    async function fetchDashboardMetrics() {
      if (!user) return;

      setMetricsLoading(true);

      try {
        // ======================================
        // 1. TOTAL & ACTIVE STUDENTS
        // ======================================
        let studentCount = 0;
        let activeCount = 0;

        try {
          const studentSnap = await getDocs(
            collection(db, "students")
          );

          studentCount = studentSnap.size;

          studentSnap.forEach((d) => {
            const status = d.data().status;

            if (
              status === "active" ||
              status === "enrolled"
            ) {
              activeCount++;
            }
          });
        } catch {
          const userSnap = await getDocs(
            collection(db, "users")
          );

          studentCount = userSnap.size;
          activeCount = userSnap.size;
        }

        // ======================================
        // 2. PENDING ADMISSIONS
        // ======================================
        let pendingAdmCount = 0;

        try {
          const admQuery = query(
            collection(db, "admissions"),
            where("status", "==", "pending")
          );

          const admSnap = await getDocs(admQuery);

          pendingAdmCount = admSnap.size;
        } catch {
          // Collection may not exist yet
        }

        // ======================================
        // 3. FEES COLLECTED
        // ======================================
        let totalRevenue = 0;

        try {
          const paymentsSnap = await getDocs(
            collection(db, "payments")
          );

          paymentsSnap.forEach((d) => {
            const data = d.data();

            const status = (
              data.paymentStatus ||
              data.status ||
              ""
            ).toLowerCase();

            if (
              [
                "paid",
                "success",
                "successful",
                "captured",
              ].includes(status)
            ) {
              totalRevenue += Number(
                data.amount || 0
              );
            }
          });
        } catch {
          // Collection may not exist yet
        }

        setMetrics({
          totalStudents: studentCount,
          activeStudents: activeCount,
          pendingAdmissions: pendingAdmCount,
          feesCollected: totalRevenue,
        });
      } catch (err) {
        console.error(
          "Error aggregating admin metrics:",
          err
        );
      } finally {
        setMetricsLoading(false);
      }
    }

    if (!authLoading) {
      fetchDashboardMetrics();
    }
  }, [user, authLoading]);

  // ==========================================
  // LOGOUT
  // ==========================================
  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.replace("/admin/login");
    } catch (error) {
      console.error("Logout Error:", error);
    }
  };

  // ==========================================
  // CURRENCY FORMATTER
  // ==========================================
  const formatINR = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  // ==========================================
  // GLOBAL LOADING SCREEN
  // ==========================================
  if (authLoading) {
    return (
      <div className="min-h-screen w-full bg-[#02142d] text-white flex flex-col items-center justify-center font-sans antialiased">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#F7931E] border-t-transparent rounded-full animate-spin" />

          <p className="text-sm font-medium text-slate-300 animate-pulse">
            Authenticating Veezna Command Center...
          </p>
        </div>
      </div>
    );
  }

  // ==========================================
  // MAIN DASHBOARD
  // ==========================================
  return (
    <div className="min-h-screen w-full bg-[#02142d] text-slate-100 flex font-sans antialiased relative overflow-x-hidden selection:bg-[#0057B8] selection:text-white">

      {/* ======================================
          AMBIENT MESH LIGHTING
      ====================================== */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-[#0057B8]/20 blur-[150px]" />

        <div className="absolute bottom-[-10%] right-[-10%] w-[700px] h-[700px] rounded-full bg-[#F7931E]/12 blur-[170px]" />

        <div className="absolute top-1/2 left-1/3 w-[500px] h-[500px] rounded-full bg-blue-500/10 blur-[140px]" />

        <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.8)_1px,transparent_0)] bg-[size:32px_32px]" />
      </div>

      {/* ======================================
          ADMIN SIDEBAR
      ====================================== */}
      <AdminSidebar />

      {/* ======================================
          MAIN CONTENT WRAPPER
      ====================================== */}
      <div className="flex-1 flex flex-col min-w-0 z-10">

        {/* ====================================
            TOP HEADER
        ==================================== */}
        <header className="sticky top-0 z-30 h-20 bg-[#042d5a]/80 backdrop-blur-xl border-b border-white/10 px-4 sm:px-8 flex items-center justify-between gap-4">

          {/* BRANDING HEADER */}
          <div className="flex items-center gap-3">

            {!logoError ? (
              <div className="relative px-3 py-1.5 bg-white/95 rounded-xl shadow-md border border-white/80 flex items-center justify-center">
                <Image
                  src="/images/veezna-logo.png"
                  alt="VEEZNA Logo"
                  width={110}
                  height={38}
                  priority
                  className="object-contain h-7 w-auto"
                  onError={() => setLogoError(true)}
                />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#0057B8] via-[#00428C] to-blue-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-blue-500/25 border border-white/20">
                V
              </div>
            )}

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-extrabold text-white tracking-tight leading-none">
                  VEEZNA
                </h1>

                <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 uppercase border border-blue-400/30">
                  GLOBAL
                </span>
              </div>

              <p className="text-[10px] font-bold text-[#F7931E] uppercase tracking-widest mt-0.5">
                Executive Command Center
              </p>
            </div>
          </div>

          {/* SEARCH */}
          <div className="hidden md:flex items-center flex-1 max-w-sm mx-6">
            <div className="relative w-full">

              <input
                type="text"
                placeholder="Search modules, students, or system tools..."
                value={searchQuery}
                onChange={(e) =>
                  setSearchQuery(e.target.value)
                }
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900/60 border border-white/15 focus:border-[#0057B8] focus:ring-2 focus:ring-blue-500/20 text-xs font-medium text-white placeholder-slate-400 outline-none transition"
              />

              <svg
                className="w-4 h-4 absolute left-3 top-2.5 text-slate-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>

            </div>
          </div>

          {/* ADMIN PROFILE */}
          <div className="flex items-center gap-3 sm:gap-4">

            <div className="flex items-center gap-2.5 bg-slate-900/60 border border-white/10 px-3.5 py-1.5 rounded-full">

              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#0057B8] to-[#F7931E] flex items-center justify-center text-white font-black text-xs shadow-md">
                {user?.email
                  ? user.email
                      .charAt(0)
                      .toUpperCase()
                  : "A"}
              </div>

              <div className="hidden sm:flex flex-col text-left">
                <span className="text-xs font-bold text-white leading-tight">
                  VEEZNA Administrator
                </span>

                <span className="text-[10px] text-slate-400 font-mono truncate max-w-[140px]">
                  {user?.email ||
                    "admin@veezna.com"}
                </span>
              </div>

            </div>

            {/* LOGOUT */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-red-300 hover:text-white bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 transition-all duration-200 focus:outline-none"
              title="Logout from Admin Portal"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>

              <span className="hidden sm:inline">
                Logout
              </span>
            </button>

          </div>
        </header>

        {/* ====================================
            DASHBOARD BODY
        ==================================== */}
        <main className="flex-1 p-4 sm:p-8 space-y-8 max-w-7xl mx-auto w-full">

          {/* ==================================
              PLATFORM DIVISIONS
          ================================== */}
          <section className="bg-[#042d5a]/60 backdrop-blur-xl border border-white/10 rounded-2xl p-4 sm:p-5 shadow-lg">

            <div className="flex flex-col md:flex-row items-center justify-between gap-4">

              <div className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">
                <span className="w-2.5 h-2.5 rounded-full bg-[#0057B8] animate-pulse" />
                <span>
                  Veezna Platform Divisions
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full md:w-auto">

                {[
                  {
                    title: "VLS Engine",
                    label: "Learning System",
                    color: "text-blue-400",
                    bg: "bg-blue-500/10",
                  },
                  {
                    title: "V-CPM Test",
                    label: "Cognitive Mapping",
                    color: "text-orange-400",
                    bg: "bg-orange-500/10",
                  },
                  {
                    title: "Academic Hub",
                    label: "Excellence Division",
                    color: "text-purple-400",
                    bg: "bg-purple-500/10",
                  },
                  {
                    title: "Wellness Framework",
                    label: "Mind & Growth",
                    color: "text-emerald-400",
                    bg: "bg-emerald-500/10",
                  },
                ].map((brand, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-slate-900/50 border border-white/10 hover:border-white/20 transition cursor-default"
                  >
                    <div
                      className={`w-7 h-7 rounded-lg ${brand.bg} ${brand.color} flex items-center justify-center font-black text-xs`}
                    >
                      {brand.title[0]}
                    </div>

                    <div>
                      <div className="text-xs font-extrabold text-white leading-tight">
                        {brand.title}
                      </div>

                      <div className="text-[9px] text-slate-400 font-medium">
                        {brand.label}
                      </div>
                    </div>
                  </div>
                ))}

              </div>

            </div>
          </section>

          {/* ==================================
              WELCOME HERO
          ================================== */}
          <Card3D className="bg-gradient-to-r from-[#003B7E] via-[#0057B8] to-[#042d5a] border border-blue-400/30 p-6 sm:p-10 text-white shadow-2xl overflow-hidden">

            <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-[#F7931E]/20 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 max-w-2xl space-y-3">

              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-semibold text-blue-100">
                <span className="w-2 h-2 rounded-full bg-[#F7931E] animate-ping" />

                <span>
                  Global System Status: Operational
                </span>
              </div>

              <h2 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
                Good Morning, Administrator 👋
              </h2>

              <p className="text-xs sm:text-sm text-blue-100/90 font-medium leading-relaxed">
                Welcome to your Veezna Executive Command
                Center. Real-time metrics are synced across
                admissions, student performance, fee
                collections, and VLS curriculum operations.
              </p>

            </div>
          </Card3D>

          {/* ==================================
              STATISTICS
          ================================== */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">

            {/* TOTAL STUDENTS */}
            <Card3D className="bg-[#042d5a]/70 backdrop-blur-xl border border-white/15 p-6 shadow-xl">

              <div className="flex items-center justify-between">

                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Total Students
                </span>

                <div className="p-2.5 rounded-xl bg-[#0057B8]/20 border border-[#0057B8]/40 text-blue-400">

                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 14l9-5-9-5-9 5 9 5z"
                    />

                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0112 20.055a11.952 11.952 0 01-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"
                    />
                  </svg>

                </div>
              </div>

              <div className="mt-4 flex items-baseline justify-between">

                <span className="text-3xl font-black text-white tracking-tight">
                  {metricsLoading
                    ? "..."
                    : metrics.totalStudents}
                </span>

                <span className="text-[11px] font-medium text-slate-400">
                  Synced to Firestore
                </span>

              </div>
            </Card3D>

            {/* ACTIVE STUDENTS */}
            <Card3D className="bg-[#042d5a]/70 backdrop-blur-xl border border-white/15 p-6 shadow-xl">

              <div className="flex items-center justify-between">

                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Active Enrolled
                </span>

                <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400">

                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>

                </div>
              </div>

              <div className="mt-4 flex items-baseline justify-between">

                <span className="text-3xl font-black text-white tracking-tight">
                  {metricsLoading
                    ? "..."
                    : metrics.activeStudents}
                </span>

                <span className="text-[11px] font-semibold text-emerald-400">
                  Verified Active
                </span>

              </div>
            </Card3D>

            {/* PENDING ADMISSIONS */}
            <Card3D className="bg-[#042d5a]/70 backdrop-blur-xl border border-white/15 p-6 shadow-xl">

              <div className="flex items-center justify-between">

                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Pending Admissions
                </span>

                <div className="p-2.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400">

                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>

                </div>
              </div>

              <div className="mt-4 flex items-baseline justify-between">

                <span className="text-3xl font-black text-white tracking-tight">
                  {metricsLoading
                    ? "..."
                    : metrics.pendingAdmissions}
                </span>

                <span className="text-[11px] font-semibold text-amber-400">
                  Action Required
                </span>

              </div>
            </Card3D>

            {/* FEES */}
            <Card3D className="bg-[#042d5a]/70 backdrop-blur-xl border border-white/15 p-6 shadow-xl">

              <div className="flex items-center justify-between">

                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Fees Revenue
                </span>

                <div className="p-2.5 rounded-xl bg-[#F7931E]/20 border border-[#F7931E]/40 text-[#F7931E]">

                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>

                </div>
              </div>

              <div className="mt-4 flex items-baseline justify-between">

                <span className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  {metricsLoading
                    ? "..."
                    : formatINR(
                        metrics.feesCollected
                      )}
                </span>

                <span className="text-[11px] font-medium text-slate-400">
                  Verified Paid
                </span>

              </div>
            </Card3D>

          </div>

          {/* ==================================
              QUICK ACTIONS
          ================================== */}
          <section className="space-y-4">

            <h3 className="text-base sm:text-lg font-extrabold text-white flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#F7931E]" />
              Executive Quick Actions
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">

              {/* ADD STUDENT */}
              <Link
                href="/admin/students/add"
                className="flex flex-col items-center justify-center p-4 rounded-2xl bg-[#042d5a]/70 border border-white/15 hover:border-[#F7931E]/50 hover:bg-[#0057B8]/20 transition-all duration-200 group text-center shadow-md"
              >
                <div className="p-3 rounded-xl bg-[#F7931E]/20 border border-[#F7931E]/30 text-[#F7931E] group-hover:scale-110 transition-transform mb-2">

                  <svg
                    className="w-6 h-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                    />
                  </svg>

                </div>

                <span className="text-xs font-bold text-white group-hover:text-[#F7931E] transition-colors">
                  Add Student
                </span>
              </Link>

              {/* VLS */}
              <Link
                href="/admin/vls/curriculum"
                className="flex flex-col items-center justify-center p-4 rounded-2xl bg-[#042d5a]/70 border border-white/15 hover:border-blue-400/50 hover:bg-[#0057B8]/20 transition-all duration-200 group text-center shadow-md"
              >
                <div className="p-3 rounded-xl bg-[#0057B8]/20 border border-[#0057B8]/30 text-blue-400 group-hover:scale-110 transition-transform mb-2">

                  <svg
                    className="w-6 h-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>

                </div>

                <span className="text-xs font-bold text-white group-hover:text-blue-300 transition-colors">
                  VLS Curriculum
                </span>
              </Link>

              {/* ADMISSIONS */}
              <Link
                href="/admin/admissions"
                className="flex flex-col items-center justify-center p-4 rounded-2xl bg-[#042d5a]/70 border border-white/15 hover:border-purple-400/50 hover:bg-[#0057B8]/20 transition-all duration-200 group text-center shadow-md"
              >
                <div className="p-3 rounded-xl bg-purple-500/20 border border-purple-500/30 text-purple-400 group-hover:scale-110 transition-transform mb-2">

                  <svg
                    className="w-6 h-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>

                </div>

                <span className="text-xs font-bold text-white group-hover:text-purple-300 transition-colors">
                  Admissions
                </span>
              </Link>

              {/* FEES */}
              <Link
                href="/admin/fees"
                className="flex flex-col items-center justify-center p-4 rounded-2xl bg-[#042d5a]/70 border border-white/15 hover:border-emerald-400/50 hover:bg-[#0057B8]/20 transition-all duration-200 group text-center shadow-md"
              >
                <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 group-hover:scale-110 transition-transform mb-2">

                  <svg
                    className="w-6 h-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>

                </div>

                <span className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors">
                  Record Payment
                </span>
              </Link>

              {/* BATCHES */}
              <Link
                href="/admin/batches"
                className="flex flex-col items-center justify-center p-4 rounded-2xl bg-[#042d5a]/70 border border-white/15 hover:border-amber-400/50 hover:bg-[#0057B8]/20 transition-all duration-200 group text-center shadow-md"
              >
                <div className="p-3 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400 group-hover:scale-110 transition-transform mb-2">

                  <svg
                    className="w-6 h-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                    />
                  </svg>

                </div>

                <span className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors">
                  Batches
                </span>
              </Link>

              {/* ATTENDANCE */}
              <Link
                href="/admin/attendance"
                className="flex flex-col items-center justify-center p-4 rounded-2xl bg-[#042d5a]/70 border border-white/15 hover:border-teal-400/50 hover:bg-[#0057B8]/20 transition-all duration-200 group text-center shadow-md"
              >
                <div className="p-3 rounded-xl bg-teal-500/20 border border-teal-500/30 text-teal-400 group-hover:scale-110 transition-transform mb-2">

                  <svg
                    className="w-6 h-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a3 3 0 016 0M9 5a2 2 0 002 2h2a2 2 0 002-2M9 14l2 2 4-4"
                    />
                  </svg>

                </div>

                <span className="text-xs font-bold text-white group-hover:text-teal-300 transition-colors">
                  Attendance
                </span>
              </Link>

            </div>
          </section>

          {/* ==================================
              ACTIVITY LOG
          ================================== */}
          <section className="space-y-4">

            <h3 className="text-base sm:text-lg font-extrabold text-white flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#F7931E]" />
              Institutional Activity Log
            </h3>

            <div className="bg-[#042d5a]/60 backdrop-blur-xl border border-white/15 rounded-3xl p-8 sm:p-12 text-center shadow-lg flex flex-col items-center justify-center">

              <div className="w-16 h-16 rounded-2xl bg-slate-900/60 border border-white/10 flex items-center justify-center text-slate-400 mb-4 shadow-inner">

                <svg
                  className="w-8 h-8 opacity-60"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>

              </div>

              <h4 className="text-base font-bold text-slate-200">
                System Synchronized
              </h4>

              <p className="text-xs text-slate-400 mt-1 max-w-sm font-medium leading-relaxed">
                Real-time activity logs for new student
                enrollments, VLS progress updates, fee
                transactions, and attendance records will
                appear here as transactions occur.
              </p>

            </div>
          </section>

        </main>
      </div>
    </div>
  );
}