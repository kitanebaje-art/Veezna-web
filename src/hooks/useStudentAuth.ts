// src/hooks/useStudentAuth.ts
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import type { StudentDocument, EnrollmentDocument, UserDocument } from '@/types/database';

export interface StudentAuthData {
  user: FirebaseUser | null;
  userData: UserDocument | null;
  studentData: StudentDocument | null;
  activeEnrollment: EnrollmentDocument | null;
  loading: boolean;
  error: string | null;
}

export function useStudentAuth(redirectToLogin: boolean = true): StudentAuthData {
  const router = useRouter();
  const [authData, setAuthData] = useState<StudentAuthData>({
    user: null,
    userData: null,
    studentData: null,
    activeEnrollment: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setAuthData({
          user: null,
          userData: null,
          studentData: null,
          activeEnrollment: null,
          loading: false,
          error: 'Not authenticated',
        });
        if (redirectToLogin) {
          router.push('/student/login');
        }
        return;
      }

      try {
        // 1. Fetch user document
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const userSnap = await getDoc(userDocRef);

        if (!userSnap.exists()) {
          throw new Error('User profile record not found.');
        }

        const userData = userSnap.data() as UserDocument;

        if (userData.status !== 'active') {
          throw new Error('Your user account is suspended or inactive.');
        }

        // 2. Fetch student document linked by uid
        const studentsQuery = query(
          collection(db, 'students'),
          where('uid', '==', firebaseUser.uid)
        );
        const studentSnap = await getDocs(studentsQuery);

        if (studentSnap.empty) {
          throw new Error('No student profile associated with this account.');
        }

        const studentData = studentSnap.docs[0].data() as StudentDocument;

        if (studentData.status !== 'active') {
          throw new Error('Your student profile is currently inactive.');
        }

        // 3. Fetch active enrollment linked by studentId
        const enrollmentsQuery = query(
          collection(db, 'enrollments'),
          where('studentId', '==', studentData.studentId),
          where('status', '==', 'active')
        );
        const enrollmentSnap = await getDocs(enrollmentsQuery);

        const activeEnrollment = enrollmentSnap.empty
          ? null
          : (enrollmentSnap.docs[0].data() as EnrollmentDocument);

        setAuthData({
          user: firebaseUser,
          userData,
          studentData,
          activeEnrollment,
          loading: false,
          error: null,
        });
      } catch (err: any) {
        console.error('Student Auth Verification Error:', err);
        setAuthData({
          user: firebaseUser,
          userData: null,
          studentData: null,
          activeEnrollment: null,
          loading: false,
          error: err.message || 'Authentication error',
        });
        if (redirectToLogin) {
          router.push('/student/login');
        }
      }
    });

    return () => unsubscribe();
  }, [redirectToLogin, router]);

  return authData;
}