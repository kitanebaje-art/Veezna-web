"use client";

import React, { useState, useRef, FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function AdminLoginPage() {
  const router = useRouter();

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Interactive 3D Card Tilt references & states
  const cardRef = useRef<HTMLDivElement>(null);
  const [tiltStyle, setTiltStyle] = useState({});

  // Floating background geometric & educational elements
  const floatingElements = [
    { text: "🛡️", top: "12%", left: "10%", delay: "0s", duration: "8s" },
    { text: "⚡", top: "22%", left: "84%", delay: "1s", duration: "10s" },
    { text: "🔐", top: "72%", left: "11%", delay: "2s", duration: "9s" },
    { text: "⚙️", top: "78%", left: "86%", delay: "0.5s", duration: "11s" },
    { text: "📊", top: "18%", left: "52%", delay: "1.5s", duration: "7s" },
    { text: "🌐", top: "62%", left: "76%", delay: "2.5s", duration: "12s" },
  ];

  // Mouse move handler for subtle desktop 3D tilt (3-5 degrees maximum)
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    if (window.innerWidth < 768) return;

    const card = cardRef.current;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -4;
    const rotateY = ((x - centerX) / centerX) * 4;

    setTiltStyle({
      transform: `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale3d(1.01, 1.01, 1.01)`,
      transition: "transform 0.1s ease-out",
    });
  };

  const handleMouseLeave = () => {
    setTiltStyle({
      transform: "perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)",
      transition: "transform 0.5s ease-in-out",
    });
  };

  // Human-friendly Firebase Error Converter
  const getFriendlyErrorMessage = (error: any): string => {
    const code = error?.code || "";
    switch (code) {
      case "auth/invalid-email":
      case "auth/user-not-found":
        return "No administrator account was found with this email address.";
      case "auth/wrong-password":
      case "auth/invalid-credential":
        return "Incorrect password. Please check your admin credentials.";
      case "auth/user-disabled":
        return "This administrator account has been disabled. Please contact system support.";
      case "auth/too-many-requests":
        return "Access temporarily blocked due to multiple failed login attempts. Please try again later.";
      case "auth/network-request-failed":
        return "Network connection issue. Please check your internet connection.";
      default:
        return error?.message || "Invalid admin credentials. Access denied.";
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (isAuthenticating) return;

    setErrorMessage("");

    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail) {
      setErrorMessage("Please enter your registered administrator email address.");
      return;
    }

    if (!password) {
      setErrorMessage("Please enter your administrator password.");
      return;
    }

    setIsAuthenticating(true);

    try {
      const credential = await signInWithEmailAndPassword(
        auth,
        trimmedEmail,
        password
      );

      // Force token refresh to retrieve custom claims if configured
      const idTokenResult = await credential.user.getIdTokenResult(true);

      /*
        Hook for strict Custom Claim / Role Verification:
        If using admin custom claims in Firebase Auth, verify here before granting access:
        
        if (!idTokenResult.claims.admin) {
          throw { code: "auth/unauthorized-role", message: "Account lacks administrator privileges." };
        }
      */

      // Redirect to Admin Dashboard upon authentication success
      router.replace("/admin/dashboard");
    } catch (error: any) {
      console.error("Admin Authentication Error:", error);
      setErrorMessage(getFriendlyErrorMessage(error));
      setIsAuthenticating(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full text-white flex flex-col items-center justify-between overflow-hidden select-none font-sans antialiased dynamic-admin-bg">
      {/* CSS Animations & Custom Styles */}
      <style jsx global>{`
        @keyframes dynamicAdminGradient {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }

        .dynamic-admin-bg {
          background: linear-gradient(
            -45deg,
            #02142d,
            #042d5a,
            #011638,
            #0057b8,
            #1e1b4b,
            #021833
          );
          background-size: 400% 400%;
          animation: dynamicAdminGradient 24s ease infinite;
        }

        @keyframes float-slow {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-16px) rotate(3deg); }
        }

        @keyframes pulse-glow {
          0%, 100% { opacity: 0.35; transform: scale(1) translate(0px, 0px); }
          50% { opacity: 0.65; transform: scale(1.15) translate(15px, -15px); }
        }

        /* 3D Platform Floating Animation */
        @keyframes platform-3d-float {
          0%, 100% {
            transform: translateY(0px) rotateX(10deg) rotateY(-3deg) rotateZ(0deg);
          }
          50% {
            transform: translateY(-8px) rotateX(14deg) rotateY(3deg) rotateZ(0.5deg);
          }
        }

        /* Platform Shadow Animation */
        @keyframes shadow-scale {
          0%, 100% {
            transform: scale(1);
            opacity: 0.6;
          }
          50% {
            transform: scale(0.85);
            opacity: 0.3;
          }
        }

        /* Shimmer Sweep Animation Across White Platform */
        @keyframes shimmerSweep {
          0% {
            transform: translateX(-150%) skewX(-25deg);
          }
          30%, 100% {
            transform: translateX(180%) skewX(-25deg);
          }
        }

        .animate-float {
          animation: float-slow infinite ease-in-out;
        }

        .animate-pulse-glow {
          animation: pulse-glow 12s infinite ease-in-out;
        }

        .animate-3d-platform {
          animation: platform-3d-float 6s ease-in-out infinite;
        }

        .animate-shadow {
          animation: shadow-scale 6s ease-in-out infinite;
        }

        .animate-shimmer {
          animation: shimmerSweep 7s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .animate-float,
          .animate-pulse-glow,
          .animate-3d-platform,
          .animate-shadow,
          .animate-shimmer,
          .dynamic-admin-bg {
            animation: none !important;
          }
        }
      `}</style>

      {/* BACKGROUND 3D AMBIENT ENVIRONMENT */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[550px] h-[550px] rounded-full bg-[#0057B8]/30 blur-[130px] animate-pulse-glow" />
        <div 
          className="absolute bottom-[-10%] right-[-10%] w-[650px] h-[650px] rounded-full bg-[#F7931E]/20 blur-[160px] animate-pulse-glow" 
          style={{ animationDelay: "-6s" }}
        />
        <div 
          className="absolute top-[35%] right-[10%] w-[400px] h-[400px] rounded-full bg-indigo-600/20 blur-[120px] animate-pulse-glow" 
          style={{ animationDelay: "-3s" }}
        />

        {/* Ambient Grid Overlay */}
        <div 
          className="absolute inset-0 opacity-[0.04]" 
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255, 255, 255, 0.8) 1px, transparent 0)`,
            backgroundSize: '32px 32px'
          }}
        />

        {/* Floating Geometric Elements */}
        {floatingElements.map((elem, idx) => (
          <div
            key={idx}
            className="absolute text-2xl md:text-3xl opacity-25 hover:opacity-50 transition-opacity animate-float"
            style={{
              top: elem.top,
              left: elem.left,
              animationDelay: elem.delay,
              animationDuration: elem.duration,
              filter: "drop-shadow(0 4px 12px rgba(247, 147, 30, 0.3))",
            }}
          >
            {elem.text}
          </div>
        ))}
      </div>

      {/* HEADER / BACK NAVIGATION */}
      <header className="relative z-10 w-full max-w-6xl mx-auto px-6 pt-6 flex items-center justify-between">
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium text-slate-300 hover:text-white bg-slate-900/40 border border-white/10 rounded-full px-4 py-2 backdrop-blur-md transition-all duration-200 hover:border-white/30 focus:outline-none focus:ring-2 focus:ring-[#F7931E]"
        >
          <span>← Back to VEEZNA Website</span>
        </Link>
        <div className="hidden sm:flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[#F7931E] bg-[#042d5a]/60 border border-[#F7931E]/20 px-3 py-1.5 rounded-full backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-[#F7931E] animate-pulse" />
          <span>Admin System</span>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="relative z-10 w-full max-w-md mx-auto px-4 py-8 md:py-10 flex-1 flex flex-col justify-center items-center">
        
        {/* INTERACTIVE 3D GLASSMORPHISM CARD */}
        <div
          ref={cardRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          style={tiltStyle}
          className="w-full bg-[#042d5a]/60 backdrop-blur-2xl border border-white/20 rounded-3xl p-6 sm:p-8 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.85)] hover:border-white/30 transition-all duration-300"
        >
          {/* VEEZNA LOGO 3D CENTERPIECE */}
          <div className="flex flex-col items-center text-center mb-8">
            <div className="relative my-2 py-2 flex flex-col items-center justify-center [perspective:1000px]">
              
              {/* Outer Ambient Glow Orbs */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-24 bg-gradient-to-r from-[#0057B8]/40 via-[#F7931E]/30 to-[#0057B8]/40 blur-2xl rounded-full pointer-events-none" />

              {/* 3D Platform Assembly */}
              <div className="relative animate-3d-platform [transform-style:preserve-3d]">
                
                {/* Layer 3 (Bottom Extrusion): Deep Navy Shadow Base */}
                <div className="absolute inset-0 translate-z-[-16px] translate-y-[12px] bg-[#02142d] rounded-3xl shadow-2xl opacity-95 border border-[#042d5a]/80" />

                {/* Layer 2 (Middle Extrusion): Brand Blue Rim */}
                <div className="absolute inset-0 translate-z-[-8px] translate-y-[6px] bg-gradient-to-r from-[#0057B8] via-[#042d5a] to-[#0057B8] rounded-3xl border border-blue-400/30 shadow-lg" />

                {/* Layer 1 (Top Platform): Pure White Glass/Acrylic Surface */}
                <div className="relative z-10 px-7 py-3.5 bg-white rounded-3xl border-2 border-white/90 shadow-[0_15px_35px_rgba(0,0,0,0.35),inset_0_2px_4px_rgba(255,255,255,1)] flex items-center justify-center overflow-hidden">
                  
                  {/* Subtle Light Shimmer Pass */}
                  <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden rounded-3xl">
                    <div className="w-1/2 h-full bg-gradient-to-r from-transparent via-blue-500/15 to-transparent animate-shimmer" />
                  </div>

                  {/* VEEZNA Logo Image */}
                  <Image
                    src="/images/veezna-logo.png"
                    alt="VEEZNA Logo"
                    width={220}
                    height={80}
                    priority
                    className="relative z-10 object-contain w-[180px] sm:w-[220px] h-[65px] sm:h-[80px] filter drop-shadow(0 3px 6px rgba(4,45,90,0.25))"
                  />
                </div>
              </div>

              {/* Realistic Elliptical Ground Depth Shadow */}
              <div className="w-48 h-3.5 mt-3 bg-black/60 rounded-[100%] blur-md animate-shadow pointer-events-none" />
            </div>

            {/* BRAND TITLES */}
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white mt-1">
              VEEZNA <span className="text-[#F7931E] font-medium text-lg">Admin Portal</span>
            </h1>

            <p className="text-xs uppercase tracking-widest text-[#F7931E] font-semibold mt-1">
              Clarity With Care
            </p>

            <p className="text-xs text-slate-300 mt-2 font-light">
              Secure administration starts here.
            </p>
          </div>

          {/* ERROR ALERT */}
          {errorMessage && (
            <div 
              role="alert"
              className="mb-6 p-3.5 rounded-xl bg-red-500/15 border border-red-500/40 backdrop-blur-md text-red-200 text-xs sm:text-sm flex items-start gap-2.5 transition-all"
            >
              <svg 
                className="w-5 h-5 text-red-400 shrink-0 mt-0.5" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{errorMessage}</span>
            </div>
          )}

          {/* LOGIN FORM */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* ADMIN EMAIL INPUT */}
            <div>
              <label 
                htmlFor="admin-email" 
                className="block text-xs font-medium text-slate-200 mb-1.5 tracking-wide"
              >
                Admin Email
              </label>
              <div className="relative">
                <input
                  id="admin-email"
                  type="email"
                  required
                  disabled={isAuthenticating}
                  autoComplete="email"
                  placeholder="Enter admin email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-900/70 border border-white/15 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-[#F7931E] focus:ring-4 focus:ring-[#F7931E]/20 transition-all duration-200 disabled:opacity-50"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* PASSWORD INPUT */}
            <div>
              <label 
                htmlFor="admin-password" 
                className="block text-xs font-medium text-slate-200 mb-1.5 tracking-wide"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="admin-password"
                  type={showPassword ? "text" : "password"}
                  required
                  disabled={isAuthenticating}
                  autoComplete="current-password"
                  placeholder="Enter admin password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-900/70 border border-white/15 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-[#F7931E] focus:ring-4 focus:ring-[#F7931E]/20 transition-all duration-200 disabled:opacity-50 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors p-1"
                >
                  {showPassword ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858-5.908a10.025 10.025 0 0110.123 2.128M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* SUBMIT BUTTON */}
            <button
              type="submit"
              disabled={isAuthenticating}
              className="w-full mt-2 relative group overflow-hidden rounded-xl bg-gradient-to-r from-[#F7931E] to-amber-600 hover:from-orange-600 hover:to-amber-700 active:scale-[0.98] text-white font-semibold py-3.5 px-4 text-sm shadow-[0_0_20px_rgba(247,147,30,0.4)] hover:shadow-[0_0_25px_rgba(247,147,30,0.6)] transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed disabled:active:scale-100"
            >
              {isAuthenticating ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 h-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Login to Admin Portal</span>
                  <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </>
              )}
            </button>
          </form>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="relative z-10 w-full py-4 text-center text-xs text-slate-300 flex flex-col sm:flex-row items-center justify-center gap-2 border-t border-white/10 bg-black/30 backdrop-blur-md">
        <span>© 2026 VEEZNA. All rights reserved.</span>
        <span className="hidden sm:inline text-slate-500">•</span>
        <span className="text-[#F7931E] font-medium">Clarity With Care</span>
      </footer>
    </div>
  );
}