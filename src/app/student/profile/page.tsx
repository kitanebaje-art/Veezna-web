"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, User } from "firebase/auth";
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  Timestamp,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

// --- STUDENT DOCUMENT INTERFACE ---
export interface StudentProfileData {
  docId: string;
  studentId?: string;
  uid?: string;
  name?: string;
  fullName?: string;
  email?: string;
  mobile?: string;
  phone?: string;
  dob?: string;
  gender?: string;
  address?: string;
  city?: string;
  state?: string;
  pinCode?: string;
  parentName?: string;
  relationship?: string;
  parentMobile?: string;
  emergencyContact?: string;
  academicClass?: string;
  class?: string;
  program?: string;
  course?: string;
  batch?: string;
  batchName?: string;
  academicYear?: string;
  status?: string;
  createdAt?: string | Timestamp | Date | number;
  startDate?: string | Timestamp | Date | number;
  endDate?: string | Timestamp | Date | number;
  profileImage?: string;
  // Fields that students CANNOT modify
  totalFee?: number | string;
  paidFee?: number | string;
  pendingFee?: number | string;
  role?: string;
}

export default function StudentProfilePage() {
  const router = useRouter();

  // Authentication & Doc States
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [studentDocId, setStudentDocId] = useState<string | null>(null);
  const [profile, setProfile] = useState<StudentProfileData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Edit Mode & Form States
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

  // Form Fields State for Editable Personal Data
  const [formData, setFormData] = useState({
    fullName: "",
    mobile: "",
    dob: "",
    gender: "",
    address: "",
    city: "",
    state: "",
    pinCode: "",
    parentName: "",
    relationship: "",
    parentMobile: "",
    emergencyContact: "",
  });

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Safe Helpers
  const parseDateToMillis = (dateVal: any): number => {
    if (!dateVal) return 0;
    if (dateVal instanceof Timestamp) return dateVal.toMillis();
    if (typeof dateVal?.toMillis === "function") return dateVal.toMillis();
    if (dateVal instanceof Date) return dateVal.getTime();
    if (typeof dateVal === "number") return dateVal;
    if (typeof dateVal === "string") {
      const parsed = new Date(dateVal).getTime();
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  };

  const formatDateDisplay = (dateVal: any): string => {
    if (typeof dateVal === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dateVal)) {
      const [year, month, day] = dateVal.split("-");
      const dt = new Date(Number(year), Number(month) - 1, Number(day));
      return dt.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    }
    const millis = parseDateToMillis(dateVal);
    if (!millis) return "—";
    return new Date(millis).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getInitials = (name?: string): string => {
    if (!name || !name.trim()) return "VZ";
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  // Populate Form Fields
  const syncFormData = (data: StudentProfileData) => {
    setFormData({
      fullName: data.fullName || data.name || "",
      mobile: data.mobile || data.phone || "",
      dob: data.dob || "",
      gender: data.gender || "",
      address: data.address || "",
      city: data.city || "",
      state: data.state || "",
      pinCode: data.pinCode || "",
      parentName: data.parentName || "",
      relationship: data.relationship || "",
      parentMobile: data.parentMobile || "",
      emergencyContact: data.emergencyContact || "",
    });
  };

  // Load Authenticated Student Profile
  const loadStudentProfile = useCallback(async (user: User) => {
    setLoading(true);
    setError(null);
    try {
      // Step 1: Direct Doc Lookup by UID
      const docRefDirect = doc(db, "students", user.uid);
      const docSnapDirect = await getDoc(docRefDirect);

      if (docSnapDirect.exists()) {
        const data = {
          docId: docSnapDirect.id,
          ...docSnapDirect.data(),
        } as StudentProfileData;
        setProfile(data);
        setStudentDocId(docSnapDirect.id);
        syncFormData(data);
        setLoading(false);
        return;
      }

      // Step 2: Query Collection by uid or email if direct lookup misses
      const studentsRef = collection(db, "students");
      let q = query(studentsRef, where("uid", "==", user.uid));
      let querySnap = await getDocs(q);

      if (querySnap.empty && user.email) {
        q = query(studentsRef, where("email", "==", user.email.toLowerCase()));
        querySnap = await getDocs(q);
      }

      if (!querySnap.empty) {
        const matchedDoc = querySnap.docs[0];
        const data = {
          docId: matchedDoc.id,
          ...matchedDoc.data(),
        } as StudentProfileData;
        setProfile(data);
        setStudentDocId(matchedDoc.id);
        syncFormData(data);
      } else {
        // Fallback View if no Firestore record exists yet for this student
        const fallbackData: StudentProfileData = {
          docId: user.uid,
          studentId: "VZ-PENDING",
          fullName: user.displayName || "Student User",
          email: user.email || "",
          mobile: user.phoneNumber || "",
          status: "active",
        };
        setProfile(fallbackData);
        setStudentDocId(user.uid);
        syncFormData(fallbackData);
      }
    } catch (err: any) {
      console.error("Error loading student profile:", err);
      setError("Unable to load profile details. Please check your internet connection.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.replace("/student/login");
        return;
      }
      setCurrentUser(user);
      loadStudentProfile(user);
    });

    return () => unsubscribe();
  }, [router, loadStudentProfile]);

  // Handle Save
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentDocId) return;

    if (!formData.fullName.trim()) {
      showToast("Full Name is required.", "error");
      return;
    }

    setIsSaving(true);
    try {
      const now = new Date().toISOString();

      // STRICT PERMITTED EDITABLE FIELDS ONLY
      // Academic, Fee, Role, Student ID, Status & Batch are EXCLUDED
      const allowedUpdates = {
        name: formData.fullName.trim(),
        fullName: formData.fullName.trim(),
        mobile: formData.mobile.trim(),
        phone: formData.mobile.trim(),
        dob: formData.dob,
        gender: formData.gender,
        address: formData.address.trim(),
        city: formData.city.trim(),
        state: formData.state.trim(),
        pinCode: formData.pinCode.trim(),
        parentName: formData.parentName.trim(),
        relationship: formData.relationship.trim(),
        parentMobile: formData.parentMobile.trim(),
        emergencyContact: formData.emergencyContact.trim(),
        updatedAt: now,
      };

      const docRef = doc(db, "students", studentDocId);
      await updateDoc(docRef, allowedUpdates);

      // Local State Update
      setProfile((prev) => (prev ? { ...prev, ...allowedUpdates } : null));
      setIsEditing(false);
      showToast("Profile updated successfully.", "success");
    } catch (err: any) {
      console.error("Error updating profile:", err);
      showToast("Unable to save profile changes. Permission denied or network issue.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    if (profile) {
      syncFormData(profile);
    }
    setIsEditing(false);
  };

  // --- LOADING STATE ---
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col items-center justify-center p-4 font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-[#0057B8] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-medium text-slate-500">Loading student profile...</p>
        </div>
      </div>
    );
  }

  // --- ERROR STATE ---
  if (error || !profile) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col items-center justify-center p-4 font-sans">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full border border-slate-200 text-center space-y-4 shadow-sm">
          <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto text-xl">
            ⚠️
          </div>
          <h2 className="text-lg font-bold text-slate-800">Profile Error</h2>
          <p className="text-xs text-slate-500">{error || "Student record not found."}</p>
          <button
            onClick={() => currentUser && loadStudentProfile(currentUser)}
            className="px-5 py-2 bg-[#0057B8] text-white text-xs font-semibold rounded-xl hover:bg-blue-700 transition"
          >
            Retry Loading
          </button>
        </div>
      </div>
    );
  }

  const displayName = profile.fullName || profile.name || "Student User";
  const displayClass = profile.academicClass || profile.class || "N/A";
  const displayCourse = profile.program || profile.course || "N/A";
  const displayBatch = profile.batchName || profile.batch || "N/A";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 p-4 sm:p-6 lg:p-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* TOAST ALERT */}
        {toastMessage && (
          <div
            className={`fixed bottom-5 right-5 z-50 px-5 py-3 rounded-xl shadow-2xl border text-white flex items-center gap-3 transition-all ${
              toastMessage.type === "error"
                ? "bg-rose-900 border-rose-700"
                : "bg-slate-900 border-slate-700"
            }`}
          >
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                toastMessage.type === "error" ? "bg-rose-500" : "bg-[#F7931E]"
              }`}
            />
            <span className="text-sm font-medium">{toastMessage.text}</span>
          </div>
        )}

        {/* BREADCRUMB & BACK BUTTON */}
        <div className="flex items-center justify-between">
          <Link
            href="/student/dashboard"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-[#0057B8] transition-colors bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Dashboard
          </Link>

          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#F7931E] hover:bg-amber-600 text-white rounded-xl text-xs font-semibold shadow-md transition"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              <span>Edit Profile</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCancelEdit}
                disabled={isSaving}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveProfile}
                disabled={isSaving}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-md transition disabled:opacity-50"
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          )}
        </div>

        {/* HEADER PROFILE CARD */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center sm:items-start gap-6">
          {/* Avatar */}
          <div className="relative shrink-0">
            {profile.profileImage ? (
              <img
                src={profile.profileImage}
                alt={displayName}
                className="w-24 h-24 rounded-2xl object-cover border-2 border-slate-100 shadow-sm"
              />
            ) : (
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-tr from-[#0057B8] to-[#F7931E] text-white flex items-center justify-center text-2xl font-black shadow-md">
                {getInitials(displayName)}
              </div>
            )}
            <span className="absolute -bottom-2 -right-2 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
              {profile.status || "Active"}
            </span>
          </div>

          {/* Profile Overview Meta */}
          <div className="flex-1 text-center sm:text-left space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">
                  {displayName}
                </h1>
                <p className="text-xs font-mono font-bold text-[#0057B8] mt-0.5">
                  ID: {profile.studentId || "VZ-STU-PENDING"}
                </p>
              </div>

              <div className="text-xs text-slate-500 font-light">
                <span>Admission Date: </span>
                <span className="font-semibold text-slate-700">
                  {formatDateDisplay(profile.createdAt)}
                </span>
              </div>
            </div>

            <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs">
              <span className="bg-blue-50 text-[#0057B8] font-semibold px-3 py-1 rounded-lg">
                Class: {displayClass}
              </span>
              <span className="bg-amber-50 text-amber-800 font-semibold px-3 py-1 rounded-lg">
                Course: {displayCourse}
              </span>
              <span className="bg-slate-100 text-slate-700 font-medium px-3 py-1 rounded-lg">
                Batch: {displayBatch}
              </span>
            </div>
          </div>
        </div>

        {/* MAIN DETAILS FORM / DISPLAY */}
        <form onSubmit={handleSaveProfile} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* SECTION 1: PERSONAL INFORMATION (EDITABLE BY STUDENT) */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h2 className="text-base font-bold text-[#0057B8] flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#0057B8]" />
                  Personal Information
                </h2>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {isEditing ? "Editable" : "Personal"}
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Full Name *</label>
                  {isEditing ? (
                    <input
                      type="text"
                      required
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-[#0057B8]"
                    />
                  ) : (
                    <p className="font-semibold text-slate-800 text-sm">{displayName}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">Email Address (Read-only)</label>
                    <p className="font-medium text-slate-700 py-1">{profile.email || currentUser?.email || "—"}</p>
                  </div>
                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">Phone Number</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.mobile}
                        onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-[#0057B8]"
                      />
                    ) : (
                      <p className="font-medium text-slate-800">{profile.mobile || profile.phone || "—"}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">Date of Birth</label>
                    {isEditing ? (
                      <input
                        type="date"
                        value={formData.dob}
                        onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-[#0057B8]"
                      />
                    ) : (
                      <p className="font-medium text-slate-800">{formData.dob || "—"}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">Gender</label>
                    {isEditing ? (
                      <select
                        value={formData.gender}
                        onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-[#0057B8]"
                      >
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    ) : (
                      <p className="font-medium text-slate-800">{profile.gender || "—"}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Address</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-[#0057B8]"
                    />
                  ) : (
                    <p className="font-medium text-slate-800">{profile.address || "—"}</p>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">City</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-[#0057B8]"
                      />
                    ) : (
                      <p className="font-medium text-slate-800">{profile.city || "—"}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">State</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.state}
                        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-[#0057B8]"
                      />
                    ) : (
                      <p className="font-medium text-slate-800">{profile.state || "—"}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">PIN Code</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.pinCode}
                        onChange={(e) => setFormData({ ...formData, pinCode: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-[#0057B8]"
                      />
                    ) : (
                      <p className="font-medium text-slate-800">{profile.pinCode || "—"}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 2: ACADEMIC INFORMATION (STRICT READ-ONLY FOR STUDENTS) */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h2 className="text-base font-bold text-[#0057B8] flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#0057B8]" />
                  Academic Information
                </h2>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#F7931E] bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  Admin Controlled
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-1">
                  <span className="text-slate-400 font-bold uppercase text-[9px] block">Student Identifier</span>
                  <p className="font-mono font-bold text-slate-800 text-sm">{profile.studentId || "VZ-PENDING"}</p>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-1">
                  <span className="text-slate-400 font-bold uppercase text-[9px] block">Enrollment Status</span>
                  <p className="font-bold text-emerald-700 capitalize">{profile.status || "Active"}</p>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-1">
                  <span className="text-slate-400 font-bold uppercase text-[9px] block">Assigned Class</span>
                  <p className="font-bold text-slate-800">{displayClass}</p>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-1">
                  <span className="text-slate-400 font-bold uppercase text-[9px] block">Batch Schedule</span>
                  <p className="font-bold text-slate-800">{displayBatch}</p>
                </div>

                <div className="col-span-2 bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-1">
                  <span className="text-slate-400 font-bold uppercase text-[9px] block">Course Program</span>
                  <p className="font-bold text-[#0057B8] text-sm">{displayCourse}</p>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-1">
                  <span className="text-slate-400 font-bold uppercase text-[9px] block">Academic Session</span>
                  <p className="font-semibold text-slate-700">{profile.academicYear || "2026-27"}</p>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-1">
                  <span className="text-slate-400 font-bold uppercase text-[9px] block">Admission Date</span>
                  <p className="font-semibold text-slate-700">{formatDateDisplay(profile.createdAt)}</p>
                </div>
              </div>

              <p className="text-[11px] text-slate-400 italic pt-2">
                Note: Academic details, course assignments, and batch timings are managed directly by the Veezna Administration.
              </p>
            </div>

            {/* SECTION 3: PARENT / GUARDIAN INFORMATION */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4 lg:col-span-2">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h2 className="text-base font-bold text-[#0057B8] flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#0057B8]" />
                  Parent & Guardian Information
                </h2>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Contact
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Parent / Guardian Name</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.parentName}
                      onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-[#0057B8]"
                    />
                  ) : (
                    <p className="font-semibold text-slate-800">{profile.parentName || "—"}</p>
                  )}
                </div>

                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Relationship</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.relationship}
                      onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
                      placeholder="Father / Mother / Guardian"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-[#0057B8]"
                    />
                  ) : (
                    <p className="font-semibold text-slate-800">{profile.relationship || "Father"}</p>
                  )}
                </div>

                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Parent Mobile Number</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.parentMobile}
                      onChange={(e) => setFormData({ ...formData, parentMobile: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-[#0057B8]"
                    />
                  ) : (
                    <p className="font-semibold text-slate-800">{profile.parentMobile || "—"}</p>
                  )}
                </div>

                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Emergency Contact</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.emergencyContact}
                      onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-[#0057B8]"
                    />
                  ) : (
                    <p className="font-semibold text-slate-800">{profile.emergencyContact || profile.parentMobile || "—"}</p>
                  )}
                </div>
              </div>
            </div>

          </div>

          {/* EDIT MODE FOOTER CONTROLS */}
          {isEditing && (
            <div className="pt-4 flex items-center justify-end gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <button
                type="button"
                onClick={handleCancelEdit}
                disabled={isSaving}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-md transition disabled:opacity-50"
              >
                {isSaving ? "Saving Profile..." : "Save Profile Changes"}
              </button>
            </div>
          )}
        </form>

      </div>
    </div>
  );
}