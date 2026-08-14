"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AdminSidebar() {
  const pathname = usePathname();
  const [vlsOpen, setVlsOpen] = useState(pathname.startsWith("/admin/vls"));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [logoError, setLogoError] = useState(false);

  const isLinkActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  return (
    <>
      {/* Mobile Menu Button (Top Left) */}
      <div className="md:hidden fixed top-3 left-3 z-50">
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 bg-slate-900 text-white rounded-xl shadow-md border border-slate-700 text-xs font-bold"
        >
          {mobileOpen ? "✕ Close" : "☰ Menu"}
        </button>
      </div>

      {/* Backdrop for Mobile Drawer */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="md:hidden fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40"
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-40 w-64 bg-slate-900 text-slate-300 min-h-screen p-4 flex flex-col border-r border-slate-800 transition-transform duration-300 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* LOGO & BRANDING HEADER */}
        <div className="mb-8 px-2 flex items-center gap-3 pt-8 md:pt-0">
          {!logoError ? (
            <div className="relative px-2.5 py-1 bg-white rounded-xl shadow-sm border border-white/80 flex items-center justify-center">
              <Image
                src="/images/veezna-logo.png"
                alt="VEEZNA Logo"
                width={90}
                height={32}
                priority
                className="object-contain h-6 w-auto"
                onError={() => setLogoError(true)}
              />
            </div>
          ) : (
            <div className="w-9 h-9 rounded-xl bg-[#0057B8] flex items-center justify-center text-white font-extrabold text-lg shadow-sm">
              V
            </div>
          )}

          <div className="flex flex-col">
            <span className="font-extrabold text-white tracking-tight text-base block leading-none">
              VEEZNA
            </span>
            <span className="text-[10px] text-[#F7931E] font-bold uppercase tracking-widest block mt-0.5">
              Admin Panel
            </span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1 text-sm font-medium flex-grow overflow-y-auto">
          <Link
            href="/admin/dashboard"
            onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition ${
              pathname === "/admin/dashboard"
                ? "bg-[#0057B8] text-white font-semibold shadow-sm"
                : "hover:bg-slate-800 hover:text-white"
            }`}
          >
            <span>📊</span> Dashboard
          </Link>

          <Link
            href="/admin/students"
            onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition ${
              isLinkActive("/admin/students")
                ? "bg-[#0057B8] text-white font-semibold shadow-sm"
                : "hover:bg-slate-800 hover:text-white"
            }`}
          >
            <span>👨‍🎓</span> Students
          </Link>

          <Link
            href="/admin/admissions"
            onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition ${
              isLinkActive("/admin/admissions")
                ? "bg-[#0057B8] text-white font-semibold shadow-sm"
                : "hover:bg-slate-800 hover:text-white"
            }`}
          >
            <span>📋</span> Admissions
          </Link>

          <Link
            href="/admin/courses"
            onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition ${
              isLinkActive("/admin/courses")
                ? "bg-[#0057B8] text-white font-semibold shadow-sm"
                : "hover:bg-slate-800 hover:text-white"
            }`}
          >
            <span>📖</span> Courses
          </Link>

          <Link
            href="/admin/batches"
            onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition ${
              isLinkActive("/admin/batches")
                ? "bg-[#0057B8] text-white font-semibold shadow-sm"
                : "hover:bg-slate-800 hover:text-white"
            }`}
          >
            <span>🏫</span> Batches
          </Link>

          {/* VLS SUBMENU */}
          <div className="pt-1 pb-1">
            <button
              type="button"
              onClick={() => setVlsOpen(!vlsOpen)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition ${
                isLinkActive("/admin/vls")
                  ? "bg-slate-800 text-white font-semibold"
                  : "hover:bg-slate-800 hover:text-white text-slate-300"
              }`}
            >
              <div className="flex items-center gap-3">
                <span>🚀</span> VLS Management
              </div>
              <span className="text-xs">{vlsOpen ? "▲" : "▼"}</span>
            </button>

            {vlsOpen && (
              <div className="ml-7 mt-1 pl-2 border-l border-slate-800 space-y-1 text-xs">
                <Link
                  href="/admin/vls/curriculum"
                  onClick={() => setMobileOpen(false)}
                  className={`block px-3 py-2 rounded-lg transition ${
                    isLinkActive("/admin/vls/curriculum")
                      ? "bg-[#0057B8] text-white font-semibold"
                      : "hover:bg-slate-800 hover:text-white text-slate-400"
                  }`}
                >
                  Curriculum
                </Link>
                <Link
                  href="/admin/vls/modules"
                  onClick={() => setMobileOpen(false)}
                  className={`block px-3 py-2 rounded-lg transition ${
                    isLinkActive("/admin/vls/modules")
                      ? "bg-[#0057B8] text-white font-semibold"
                      : "hover:bg-slate-800 hover:text-white text-slate-400"
                  }`}
                >
                  Modules
                </Link>
                <Link
                  href="/admin/vls/lessons"
                  onClick={() => setMobileOpen(false)}
                  className={`block px-3 py-2 rounded-lg transition ${
                    isLinkActive("/admin/vls/lessons")
                      ? "bg-[#0057B8] text-white font-semibold"
                      : "hover:bg-slate-800 hover:text-white text-slate-400"
                  }`}
                >
                  Lessons
                </Link>
                <Link
                  href="/admin/vls/progress"
                  onClick={() => setMobileOpen(false)}
                  className={`block px-3 py-2 rounded-lg transition ${
                    isLinkActive("/admin/vls/progress")
                      ? "bg-[#0057B8] text-white font-semibold"
                      : "hover:bg-slate-800 hover:text-white text-slate-400"
                  }`}
                >
                  Student Progress
                </Link>
              </div>
            )}
          </div>

          <Link
            href="/admin/reports"
            onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition ${
              isLinkActive("/admin/reports")
                ? "bg-[#0057B8] text-white font-semibold shadow-sm"
                : "hover:bg-slate-800 hover:text-white"
            }`}
          >
            <span>📈</span> Reports
          </Link>

          <Link
            href="/admin/settings"
            onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition ${
              isLinkActive("/admin/settings")
                ? "bg-[#0057B8] text-white font-semibold shadow-sm"
                : "hover:bg-slate-800 hover:text-white"
            }`}
          >
            <span>⚙️</span> Settings
          </Link>
        </nav>

        <div className="pt-4 border-t border-slate-800 text-[11px] text-slate-500 text-center">
          VEEZNA Admin Engine
        </div>
      </aside>
    </>
  );
}