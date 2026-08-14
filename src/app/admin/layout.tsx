"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import AdminSidebar from "@/components/admin/AdminSidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Exclude the login page itself from the authentication guard to prevent infinite redirect loops
  const isLoginPage = pathname === "/admin/login";

  useEffect(() => {
    // If navigating to the login page, do not enforce auth check
    if (isLoginPage) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        // Redirect immediately if not logged in
        router.replace("/admin/login");
        return;
      }

      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router, pathname, isLoginPage]);

  // Render the login page directly without sidebar wrapper
  if (isLoginPage) {
    return <>{children}</>;
  }

  // Render a full-screen loading screen while checking authentication status
  if (loading) {
    return (
      <div className="min-h-screen w-full bg-[#02142d] text-white flex flex-col items-center justify-center font-sans antialiased">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#F7931E] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-slate-300 animate-pulse">
            Verifying Administrator Session...
          </p>
        </div>
      </div>
    );
  }

  // Block rendering content entirely if user is unauthenticated
  if (!user) {
    return null;
  }

  // Render Protected Admin UI
  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      <div className="shrink-0 hidden md:block">
        <AdminSidebar />
      </div>
      <main className="flex-1 min-w-0 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}