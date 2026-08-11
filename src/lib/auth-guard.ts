// src/lib/auth-guard.ts
import { adminAuth, adminDb } from '@/lib/firebase-admin';

export async function verifyAdminToken(authHeader: string | null) {
  // 1. Development Mode Bypass - Local testing ke dauran verification bypass karein
  if (process.env.NODE_ENV === 'development') {
    return { authorized: true, uid: 'dev-admin-uid' };
  }

  if (!authHeader) {
    return { authorized: false, error: 'Missing Authorization header' };
  }

  const token = authHeader.replace(/^Bearer\s+/i, '').trim();

  // 2. Production Firebase ID Token Verification
  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    const uid = decodedToken.uid;

    if (decodedToken.role === 'admin') {
      return { authorized: true, uid };
    }

    const userDoc = await adminDb.collection('users').doc(uid).get();
    if (userDoc.exists && userDoc.data()?.role === 'admin') {
      return { authorized: true, uid };
    }

    return { authorized: false, error: 'User does not have admin privileges' };
  } catch (error: any) {
    console.error('Token Verification Error:', error.message || error);
    return { authorized: false, error: 'Invalid or expired ID token' };
  }
}