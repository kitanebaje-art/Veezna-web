"use client";

import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AboutVeeznaSection from '@/components/sections/AboutVeeznaSection';
export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setError("");

    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }

    try {
      setLoading(true);

      await signInWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );

      router.push("/student-portal");
    } catch (err: any) {
      console.error("Login error:", err);

      switch (err.code) {
        case "auth/invalid-credential":
        case "auth/wrong-password":
        case "auth/user-not-found":
          setError("Invalid email or password.");
          break;

        case "auth/invalid-email":
          setError("Please enter a valid email address.");
          break;

        case "auth/too-many-requests":
          setError(
            "Too many unsuccessful attempts. Please try again later."
          );
          break;

        default:
          setError("Unable to login. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-950 via-blue-800 to-blue-600 flex items-center justify-center p-6">
      <div className="w-full max-w-md">

        <div className="bg-white rounded-3xl shadow-2xl p-8">

          <div className="text-center mb-8">

            <div className="mx-auto w-22  h-20 rounded-2xl bg-white shadow-lg flex items-center justify-center p-3 mb-5">
              <img
                src="/images/veezna-logo0.png"
                alt="Veezna Logo"
                className="w-full h-full object-contain"
              />
            </div>

            <h1 className="text-3xl font-bold text-blue-900">
              Student Login
            </h1>

            <p className="text-gray-500 mt-2">
              Welcome back to Veezna
            </p>

          </div>

          {error && (
            <div className="mb-5 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email Address
              </label>

              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                autoComplete="email"
                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Password
              </label>

              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-bold py-3.5 transition shadow-lg"
            >
              {loading ? "Signing In..." : "Sign In"}
            </button>

          </form>

          <div className="mt-6 text-center text-sm text-gray-500">
            Don't have a Veezna account?{" "}
            <Link
              href="/apply"
              className="font-semibold text-blue-700 hover:text-orange-500"
            >
              Apply Now
            </Link>
          </div>

          <div className="mt-4 text-center">
            <Link
              href="/"
              className="text-sm text-gray-500 hover:text-blue-700"
            >
              ← Back to Veezna Home
            </Link>
          </div>

        </div>

      </div>
    </main>
  );
}