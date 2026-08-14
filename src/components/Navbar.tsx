
"use client";

import { useState } from "react";
import Link from "next/link";

export default function Navbar() {
  const [open, setOpen] = useState(false);

  const closeMenu = () => {
    setOpen(false);
  };

  return (
    <nav className="fixed top-0 left-0 w-full z-50 backdrop-blur-xl bg-white/80 border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">

        {/* Logo + Tagline */}
        <Link
          href="/"
          onClick={closeMenu}
          className="flex items-center gap-3"
        >
          <div className="w-56 h-12 rounded-2xl bg-white shadow-lg flex items-center justify-center overflow-hidden">
            <img
              src="/images/veezna-logo.png"
              alt="Veezna Logo"
              className="w-full h-full object-contain"
            />
          </div>

          <h1 className="hidden lg:block text-2xl font-bold text-[#042d5a]">
            Clarity With Care
          </h1>
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-8 font-medium text-gray-700">

          <Link
            href="/"
            className="hover:text-orange-500 transition"
          >
            Home
          </Link>

          <Link
            href="/programs"
            className="hover:text-orange-500 transition"
          >
            Programs
          </Link>

          <Link
            href="/#about"
            className="hover:text-orange-500 transition"
          >
            About
          </Link>

          <Link
            href="/#contact"
            className="hover:text-orange-500 transition"
          >
            Contact
          </Link>

          {/* Student Portal */}
          <Link
  href="/student/login"
  className="hover:text-orange-500 transition"
>
  Student Portal
</Link>

          {/* Join Now */}
          <Link
            href="/apply"
            className="bg-orange-500 text-white px-6 py-3 rounded-full hover:bg-orange-600 transition shadow-lg"
          >
            Join Now
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setOpen((prev) => !prev)}
          aria-label="Toggle Menu"
          aria-expanded={open}
          className="md:hidden text-2xl font-bold text-blue-800 p-2 focus:outline-none"
        >
          {open ? "✕" : "☰"}
        </button>
      </div>

      {/* Mobile Dropdown */}
      {open && (
        <div className="md:hidden bg-white px-6 py-6 space-y-4 shadow-lg border-t border-gray-100">

          <Link
            href="/"
            onClick={closeMenu}
            className="block font-medium text-gray-700 hover:text-orange-500 transition"
          >
            Home
          </Link>

          <Link
            href="/#programs"
            onClick={closeMenu}
            className="block font-medium text-gray-700 hover:text-orange-500 transition"
          >
            Programs
          </Link>

          <Link
            href="/#about"
            onClick={closeMenu}
            className="block font-medium text-gray-700 hover:text-orange-500 transition"
          >
            About
          </Link>

          <Link
            href="/#contact"
            onClick={closeMenu}
            className="block font-medium text-gray-700 hover:text-orange-500 transition"
          >
            Contact
          </Link>

          {/* Student Portal */}
          <Link
  href="/student/login"
  className="hover:text-orange-500 transition"
>
  Student Portal
</Link>

          {/* Join Now */}
          <Link
            href="/apply"
            onClick={closeMenu}
            className="block w-full bg-orange-500 text-white py-3 rounded-full text-center hover:bg-orange-600 transition shadow-md"
          >
            Join Now
          </Link>
        </div>
      )}
    </nav>
  );
}

