"use client";

import { useState, useEffect } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

export interface EnrollmentData {
  id?: string;
  courseId?: string;
  batchId?: string;
  startDate?: string;
  status?: string;
  [key: string]: any;
}

export interface StudentProfile {
  uid: string;
  studentId: string;
  email: string | null;
  name?: string;
  academicClass?: string;
  activeEnrollment?: EnrollmentData | null;
  enrollment?: EnrollmentData | null;
  [key: string]: any;
}

export interface StudentAuthData {
  user: User | null;
  student: StudentProfile | null;
  studentData: StudentProfile | null;
  userData?: StudentProfile | null;
  activeEnrollment: EnrollmentData | null;
  loading: boolean;
  error: string | null;
}

export function useStudentAuth(
  _requireStudent = false
): StudentAuthData {
  const [authState, setAuthState] = useState<StudentAuthData>({
    user: null,
    student: null,
    studentData: null,
    userData: null,
    activeEnrollment: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (firebaseUser) => {
        if (!firebaseUser) {
          setAuthState({
            user: null,
            student: null,
            studentData: null,
            userData: null,
            activeEnrollment: null,
            loading: false,
            error: null,
          });

          return;
        }

        try {
          // --------------------------------------------------
          // USER PROFILE
          // --------------------------------------------------

          const userRef = doc(
            db,
            "users",
            firebaseUser.uid
          );

          const userSnap = await getDoc(userRef);

          const userDataMap: Record<string, any> =
            userSnap.exists()
              ? userSnap.data()
              : {};

          // --------------------------------------------------
          // STUDENT PROFILE
          // --------------------------------------------------

          let studentDataMap: Record<string, any> | null =
            null;

          const studentQuery = query(
            collection(db, "students"),
            where("uid", "==", firebaseUser.uid)
          );

          const studentSnap = await getDocs(studentQuery);

          if (!studentSnap.empty) {
            const studentDoc = studentSnap.docs[0];

            studentDataMap = {
              id: studentDoc.id,
              ...studentDoc.data(),
            };
          }

          // --------------------------------------------------
          // FALLBACK: students/{uid}
          // --------------------------------------------------

          if (!studentDataMap) {
            const directStudentRef = doc(
              db,
              "students",
              firebaseUser.uid
            );

            const directStudentSnap =
              await getDoc(directStudentRef);

            if (directStudentSnap.exists()) {
              studentDataMap = {
                id: directStudentSnap.id,
                ...directStudentSnap.data(),
              };
            }
          }

          // --------------------------------------------------
          // COMBINED STUDENT PROFILE
          // --------------------------------------------------

          const combinedStudent: StudentProfile = {
            ...userDataMap,
            ...(studentDataMap ?? {}),

            uid: firebaseUser.uid,

            email:
              firebaseUser.email ??
              userDataMap.email ??
              null,

            studentId:
              studentDataMap?.studentId ??
              userDataMap.studentId ??
              studentDataMap?.id ??
              firebaseUser.uid,
          };

          // --------------------------------------------------
          // ENROLLMENT
          // --------------------------------------------------

          let activeEnrollment: EnrollmentData | null =
            null;

          const profileActiveEnrollment =
            combinedStudent.activeEnrollment;

          const profileEnrollment =
            combinedStudent.enrollment;

          if (profileActiveEnrollment) {
            activeEnrollment =
              profileActiveEnrollment;
          } else if (profileEnrollment) {
            activeEnrollment =
              profileEnrollment;
          }

          // --------------------------------------------------
          // ENROLLMENTS COLLECTION
          // --------------------------------------------------

          if (!activeEnrollment) {
            try {
              const enrollmentQuery = query(
                collection(db, "enrollments"),
                where("uid", "==", firebaseUser.uid)
              );

              const enrollmentSnap =
                await getDocs(enrollmentQuery);

              if (!enrollmentSnap.empty) {
                const enrollmentDoc =
                  enrollmentSnap.docs[0];

                const enrollmentDataMap =
                  enrollmentDoc.data();

                activeEnrollment = {
                  id: enrollmentDoc.id,
                  ...enrollmentDataMap,
                };
              }
            } catch (enrollmentError) {
              console.warn(
                "Enrollment lookup failed:",
                enrollmentError
              );

              activeEnrollment = null;
            }
          }

          // --------------------------------------------------
          // SUCCESS
          // --------------------------------------------------

          setAuthState({
            user: firebaseUser,
            student: combinedStudent,
            studentData: combinedStudent,
            userData: combinedStudent,
            activeEnrollment,
            loading: false,
            error: null,
          });
        } catch (error) {
          console.error(
            "Student profile loading error:",
            error
          );

          // --------------------------------------------------
          // AUTHENTICATION IS VALID EVEN IF PROFILE LOOKUP FAILS
          // --------------------------------------------------

          const fallbackStudent: StudentProfile = {
            uid: firebaseUser.uid,
            studentId: firebaseUser.uid,
            email: firebaseUser.email ?? null,
          };

          setAuthState({
            user: firebaseUser,
            student: fallbackStudent,
            studentData: fallbackStudent,
            userData: fallbackStudent,
            activeEnrollment: null,
            loading: false,
            error: null,
          });
        }
      }
    );

    return () => unsubscribe();
  }, []);

  return authState;
}