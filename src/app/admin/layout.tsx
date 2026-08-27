'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import AdminSidebar from '@/components/AdminSidebar';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const [checkingAuth, setCheckingAuth] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  const isLoginPage = pathname === '/admin/login';

  useEffect(() => {
    // Login page should always remain public.
    if (isLoginPage) {
      setCheckingAuth(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setAuthenticated(false);
        setCheckingAuth(false);

        router.replace('/admin/login');
        return;
      }

      try {
        // Force refresh token so Firebase verifies the current session.
        await user.getIdToken(true);

        setAuthenticated(true);
      } catch (error) {
        console.error('Admin authentication error:', error);

        setAuthenticated(false);
        router.replace('/admin/login');
      } finally {
        setCheckingAuth(false);
      }
    });

    return () => unsubscribe();
  }, [isLoginPage, router]);

  /*
   * ADMIN LOGIN
   * No sidebar and no auth requirement.
   */
  if (isLoginPage) {
    return <>{children}</>;
  }

  /*
   * AUTH CHECK SCREEN
   */
  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 rounded-2xl bg-[#0057B8] flex items-center justify-center text-white text-xl font-black animate-pulse">
            V
          </div>

          <p className="text-white text-sm font-semibold">
            Verifying Admin Access...
          </p>

          <p className="text-slate-500 text-xs mt-1">
            Please wait
          </p>
        </div>
      </div>
    );
  }

  /*
   * NOT AUTHENTICATED
   * Redirect is already triggered above.
   */
  if (!authenticated) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-white text-sm">
          Redirecting to admin login...
        </div>
      </div>
    );
  }

  /*
   * PROTECTED ADMIN AREA
   *
   * Sidebar is rendered ONLY here.
   */
  return (
    <div className="min-h-screen bg-slate-100">
      <AdminSidebar />

      <main className="md:ml-64 min-h-screen">
        {children}
      </main>
    </div>
  );
}