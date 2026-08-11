"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

// --- TYPESCRIPT INTERFACES FOR EACH SETTINGS SECTION ---
export interface GeneralSettings {
  instituteName: string;
  brandName: string;
  tagline: string;
  phone: string;
  email: string;
  website: string;
  address: string;
  city: string;
  state: string;
  pinCode: string;
}

export interface ContactSettings {
  primaryPhone: string;
  whatsappNumber: string;
  email: string;
  supportEmail: string;
  officeHours: string;
}

export interface AcademicSettings {
  currentAcademicYear: string;
  defaultCourseDuration: string;
  defaultRegistrationFee: number;
  maxStudentsPerBatch: number;
  defaultAttendanceRequirement: number;
  workingDays: string;
}

export interface FeeSettings {
  defaultRegistrationFee: number;
  lateFee: number;
  currency: string;
  paymentReminderDay: number;
  allowPartialPayments: boolean;
  allowOfflinePayments: boolean;
}

export interface AttendanceSettings {
  minimumAttendancePercentage: number;
  allowLateMarking: boolean;
  allowAttendanceEditing: boolean;
  defaultWorkingDays: string;
}

export interface NotificationSettings {
  admissionNotifications: boolean;
  feeReminderNotifications: boolean;
  attendanceNotifications: boolean;
  courseNotifications: boolean;
  studentAccountNotifications: boolean;
}

export interface AdminPreferences {
  dashboardRefreshInterval: number;
  showInactiveCourses: boolean;
  showPendingAdmissions: boolean;
  enableAnalytics: boolean;
  enableReports: boolean;
}

// --- DEFAULT FALLBACK CONFIGURATIONS ---
const DEFAULT_GENERAL: GeneralSettings = {
  instituteName: "Veezna",
  brandName: "VEEZNA",
  tagline: "Vision Turns Into Mission",
  phone: "+91 9876543210",
  email: "info@veezna.com",
  website: "https://www.veezna.com",
  address: "Veezna Coaching & Wellness Center",
  city: "Raipur",
  state: "Chhattisgarh",
  pinCode: "492001",
};

const DEFAULT_CONTACT: ContactSettings = {
  primaryPhone: "+91 9876543210",
  whatsappNumber: "+91 9876543210",
  email: "contact@veezna.com",
  supportEmail: "support@veezna.com",
  officeHours: "Mon - Sat: 9:00 AM - 7:00 PM",
};

const DEFAULT_ACADEMIC: AcademicSettings = {
  currentAcademicYear: "2026-27",
  defaultCourseDuration: "6 Months",
  defaultRegistrationFee: 1500,
  maxStudentsPerBatch: 12,
  defaultAttendanceRequirement: 75,
  workingDays: "Monday to Saturday",
};

const DEFAULT_FEES: FeeSettings = {
  defaultRegistrationFee: 1500,
  lateFee: 200,
  currency: "INR",
  paymentReminderDay: 1,
  allowPartialPayments: true,
  allowOfflinePayments: true,
};

const DEFAULT_ATTENDANCE: AttendanceSettings = {
  minimumAttendancePercentage: 75,
  allowLateMarking: true,
  allowAttendanceEditing: true,
  defaultWorkingDays: "Mon, Tue, Wed, Thu, Fri, Sat",
};

const DEFAULT_NOTIFICATIONS: NotificationSettings = {
  admissionNotifications: true,
  feeReminderNotifications: true,
  attendanceNotifications: true,
  courseNotifications: true,
  studentAccountNotifications: true,
};

const DEFAULT_ADMIN_PREFERENCES: AdminPreferences = {
  dashboardRefreshInterval: 30,
  showInactiveCourses: true,
  showPendingAdmissions: true,
  enableAnalytics: true,
  enableReports: true,
};

export default function AdminSettingsPage() {
  // --- STATE MANAGEMENT ---
  const [general, setGeneral] = useState<GeneralSettings>(DEFAULT_GENERAL);
  const [contact, setContact] = useState<ContactSettings>(DEFAULT_CONTACT);
  const [academic, setAcademic] = useState<AcademicSettings>(DEFAULT_ACADEMIC);
  const [fees, setFees] = useState<FeeSettings>(DEFAULT_FEES);
  const [attendance, setAttendance] = useState<AttendanceSettings>(DEFAULT_ATTENDANCE);
  const [notifications, setNotifications] = useState<NotificationSettings>(DEFAULT_NOTIFICATIONS);
  const [adminPrefs, setAdminPrefs] = useState<AdminPreferences>(DEFAULT_ADMIN_PREFERENCES);

  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [lastUpdatedText, setLastUpdatedText] = useState<string>("Not updated yet");

  const [toastMessage, setToastMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // --- LOAD SETTINGS FROM FIRESTORE ---
  const loadAllSettings = useCallback(async () => {
    setLoading(true);
    try {
      const fetchDoc = async <T,>(docName: string, fallback: T): Promise<{ data: T; updatedAt?: unknown }> => {
        try {
          const docRef = doc(db, "systemSettings", docName);
          const snap = await getDoc(docRef);
          if (snap.exists()) {
            const data = snap.data();
            return {
              data: { ...fallback, ...data } as T,
              updatedAt: data.updatedAt,
            };
          }
        } catch (e) {
          console.warn(`Could not load systemSettings/${docName}:`, e);
        }
        return { data: fallback };
      };

      const [gen, con, aca, fee, att, not, adm] = await Promise.all([
        fetchDoc<GeneralSettings>("general", DEFAULT_GENERAL),
        fetchDoc<ContactSettings>("contact", DEFAULT_CONTACT),
        fetchDoc<AcademicSettings>("academic", DEFAULT_ACADEMIC),
        fetchDoc<FeeSettings>("fees", DEFAULT_FEES),
        fetchDoc<AttendanceSettings>("attendance", DEFAULT_ATTENDANCE),
        fetchDoc<NotificationSettings>("notifications", DEFAULT_NOTIFICATIONS),
        fetchDoc<AdminPreferences>("admin", DEFAULT_ADMIN_PREFERENCES),
      ]);

      setGeneral(gen.data);
      setContact(con.data);
      setAcademic(aca.data);
      setFees(fee.data);
      setAttendance(att.data);
      setNotifications(not.data);
      setAdminPrefs(adm.data);

      // Extract last timestamp if available
      const possibleTimestamps = [
        gen.updatedAt,
        con.updatedAt,
        aca.updatedAt,
        fee.updatedAt,
        att.updatedAt,
        not.updatedAt,
        adm.updatedAt,
      ].filter(Boolean);

      if (possibleTimestamps.length > 0) {
        const latestTs = possibleTimestamps[0] as { toMillis?: () => number };
        if (typeof latestTs?.toMillis === "function") {
          setLastUpdatedText(new Date(latestTs.toMillis()).toLocaleString("en-IN"));
        } else {
          setLastUpdatedText(new Date().toLocaleString("en-IN"));
        }
      }

      setHasUnsavedChanges(false);
    } catch (err) {
      console.error("Error loading system settings:", err);
      showToast("Unable to load settings from server. Showing defaults.", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllSettings();
  }, [loadAllSettings]);

  // Warn user on window close/refresh if unsaved
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // --- FORM INPUT CHANGE HANDLER ---
  const handleInputChange = (setter: React.Dispatch<React.SetStateAction<any>>) => {
    return (field: string, value: any) => {
      setter((prev: any) => ({ ...prev, [field]: value }));
      setHasUnsavedChanges(true);
    };
  };

  const updateGeneral = handleInputChange(setGeneral);
  const updateContact = handleInputChange(setContact);
  const updateAcademic = handleInputChange(setAcademic);
  const updateFees = handleInputChange(setFees);
  const updateAttendance = handleInputChange(setAttendance);
  const updateNotifications = handleInputChange(setNotifications);
  const updateAdminPrefs = handleInputChange(setAdminPrefs);

  // --- VALIDATION HELPERS ---
  const validateSettings = (): boolean => {
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (general.email && !emailRegex.test(general.email)) {
      showToast("Please enter a valid General Email address.", "error");
      return false;
    }
    if (contact.email && !emailRegex.test(contact.email)) {
      showToast("Please enter a valid Contact Email address.", "error");
      return false;
    }

    // Numbers & Percentages
    if (academic.defaultAttendanceRequirement < 0 || academic.defaultAttendanceRequirement > 100) {
      showToast("Academic attendance requirement must be between 0% and 100%.", "error");
      return false;
    }
    if (attendance.minimumAttendancePercentage < 0 || attendance.minimumAttendancePercentage > 100) {
      showToast("Minimum attendance percentage must be between 0% and 100%.", "error");
      return false;
    }

    // Fees & Days
    if (academic.defaultRegistrationFee < 0 || fees.defaultRegistrationFee < 0 || fees.lateFee < 0) {
      showToast("Fee values cannot be negative numbers.", "error");
      return false;
    }
    if (fees.paymentReminderDay < 1 || fees.paymentReminderDay > 31) {
      showToast("Payment Reminder Day must be between 1 and 31.", "error");
      return false;
    }
    if (academic.maxStudentsPerBatch <= 0) {
      showToast("Maximum Students Per Batch must be greater than 0.", "error");
      return false;
    }

    return true;
  };

  // --- SAVE MECHANISM ---
  const handleSaveAll = async () => {
    if (!validateSettings()) return;

    setSaving(true);
    try {
      const nowTs = serverTimestamp();

      const saveDoc = (docName: string, payload: Record<string, any>) => {
        const docRef = doc(db, "systemSettings", docName);
        return setDoc(docRef, { ...payload, updatedAt: nowTs }, { merge: true });
      };

      await Promise.all([
        saveDoc("general", general),
        saveDoc("contact", contact),
        saveDoc("academic", academic),
        saveDoc("fees", fees),
        saveDoc("attendance", attendance),
        saveDoc("notifications", notifications),
        saveDoc("admin", adminPrefs),
      ]);

      setHasUnsavedChanges(false);
      setLastUpdatedText(new Date().toLocaleString("en-IN"));
      showToast("Settings saved successfully.", "success");
    } catch (err) {
      console.error("Error saving settings:", err);
      showToast("Unable to save settings. Please check permissions and try again.", "error");
    } finally {
      setSaving(false);
    }
  };

  // --- RELOAD / RESET UNSAVED CHANGES ---
  const handleReload = () => {
    if (hasUnsavedChanges) {
      const confirmReset = window.confirm(
        "You have unsaved changes. Are you sure you want to discard them and reload saved settings?"
      );
      if (!confirmReset) return;
    }
    loadAllSettings();
    showToast("Settings reloaded from server.", "success");
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 p-4 sm:p-6 lg:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        
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

        {/* TOP BAR / NAVIGATION */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-[#0057B8] transition-colors bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Dashboard
            </Link>
            {hasUnsavedChanges && (
              <span className="bg-amber-100 text-amber-800 border border-amber-200 text-[11px] font-bold px-2.5 py-0.5 rounded-full animate-pulse">
                Unsaved Changes
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleReload}
              disabled={loading || saving}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-50 shadow-sm transition disabled:opacity-50"
            >
              <svg className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Reload Saved Settings
            </button>

            <button
              onClick={handleSaveAll}
              disabled={saving || loading}
              className="inline-flex items-center gap-2 px-5 py-2 bg-[#F7931E] hover:bg-amber-600 text-white rounded-xl text-xs font-semibold shadow-md transition-all disabled:opacity-50"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>{saving ? "Saving Changes..." : "Save Changes"}</span>
            </button>
          </div>
        </div>

        {/* HEADER SECTION */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0057B8] tracking-tight">
            Settings
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-light">
            Manage Veezna's system preferences, institute information and administrative controls.
          </p>
        </div>

        {loading ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200/80 shadow-sm flex flex-col items-center justify-center">
            <div className="w-8 h-8 border-3 border-[#0057B8] border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-xs text-slate-500 font-medium">Loading system configurations...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* 1. INSTITUTE INFORMATION */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
              <h2 className="text-base font-bold text-[#0057B8] border-b border-slate-100 pb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#0057B8]" />
                Institute Information
              </h2>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Institute Name</label>
                  <input
                    type="text"
                    value={general.instituteName}
                    onChange={(e) => updateGeneral("instituteName", e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-[#0057B8]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Brand Name</label>
                    <input
                      type="text"
                      value={general.brandName}
                      onChange={(e) => updateGeneral("brandName", e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-[#0057B8]"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Tagline</label>
                    <input
                      type="text"
                      value={general.tagline}
                      onChange={(e) => updateGeneral("tagline", e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-[#0057B8]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Phone Number</label>
                    <input
                      type="text"
                      value={general.phone}
                      onChange={(e) => updateGeneral("phone", e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-[#0057B8]"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Email Address</label>
                    <input
                      type="email"
                      value={general.email}
                      onChange={(e) => updateGeneral("email", e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-[#0057B8]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Website URL</label>
                  <input
                    type="text"
                    value={general.website}
                    onChange={(e) => updateGeneral("website", e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-[#0057B8]"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Address</label>
                  <input
                    type="text"
                    value={general.address}
                    onChange={(e) => updateGeneral("address", e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-[#0057B8]"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">City</label>
                    <input
                      type="text"
                      value={general.city}
                      onChange={(e) => updateGeneral("city", e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-[#0057B8]"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">State</label>
                    <input
                      type="text"
                      value={general.state}
                      onChange={(e) => updateGeneral("state", e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-[#0057B8]"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">PIN Code</label>
                    <input
                      type="text"
                      value={general.pinCode}
                      onChange={(e) => updateGeneral("pinCode", e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-[#0057B8]"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 2. CONTACT & COMMUNICATION */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
              <h2 className="text-base font-bold text-[#0057B8] border-b border-slate-100 pb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#0057B8]" />
                Contact & Communication
              </h2>

              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Primary Phone</label>
                    <input
                      type="text"
                      value={contact.primaryPhone}
                      onChange={(e) => updateContact("primaryPhone", e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-[#0057B8]"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">WhatsApp Number</label>
                    <input
                      type="text"
                      value={contact.whatsappNumber}
                      onChange={(e) => updateContact("whatsappNumber", e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-[#0057B8]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Contact Email</label>
                    <input
                      type="email"
                      value={contact.email}
                      onChange={(e) => updateContact("email", e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-[#0057B8]"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Support Email</label>
                    <input
                      type="email"
                      value={contact.supportEmail}
                      onChange={(e) => updateContact("supportEmail", e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-[#0057B8]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Office Hours</label>
                  <input
                    type="text"
                    value={contact.officeHours}
                    onChange={(e) => updateContact("officeHours", e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-[#0057B8]"
                  />
                </div>
              </div>
            </div>

            {/* 3. ACADEMIC SETTINGS */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
              <h2 className="text-base font-bold text-[#0057B8] border-b border-slate-100 pb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#0057B8]" />
                Academic Settings
              </h2>

              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Current Academic Year</label>
                    <input
                      type="text"
                      value={academic.currentAcademicYear}
                      onChange={(e) => updateAcademic("currentAcademicYear", e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-[#0057B8]"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Default Duration</label>
                    <input
                      type="text"
                      value={academic.defaultCourseDuration}
                      onChange={(e) => updateAcademic("defaultCourseDuration", e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-[#0057B8]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Default Reg. Fee (₹)</label>
                    <input
                      type="number"
                      min="0"
                      value={academic.defaultRegistrationFee}
                      onChange={(e) => updateAcademic("defaultRegistrationFee", Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-[#0057B8]"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Max / Batch</label>
                    <input
                      type="number"
                      min="1"
                      value={academic.maxStudentsPerBatch}
                      onChange={(e) => updateAcademic("maxStudentsPerBatch", Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-[#0057B8]"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Min. Attendance %</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={academic.defaultAttendanceRequirement}
                      onChange={(e) => updateAcademic("defaultAttendanceRequirement", Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-[#0057B8]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Working Days</label>
                  <input
                    type="text"
                    value={academic.workingDays}
                    onChange={(e) => updateAcademic("workingDays", e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-[#0057B8]"
                  />
                </div>
              </div>
            </div>

            {/* 4. FEE & PAYMENT SETTINGS */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
              <h2 className="text-base font-bold text-[#0057B8] border-b border-slate-100 pb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#0057B8]" />
                Fee & Payment Settings
              </h2>

              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Default Reg. Fee (₹)</label>
                    <input
                      type="number"
                      min="0"
                      value={fees.defaultRegistrationFee}
                      onChange={(e) => updateFees("defaultRegistrationFee", Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-[#0057B8]"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Late Fee (₹)</label>
                    <input
                      type="number"
                      min="0"
                      value={fees.lateFee}
                      onChange={(e) => updateFees("lateFee", Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-[#0057B8]"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Reminder Day</label>
                    <input
                      type="number"
                      min="1"
                      max="31"
                      value={fees.paymentReminderDay}
                      onChange={(e) => updateFees("paymentReminderDay", Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-[#0057B8]"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="font-medium text-slate-700">Allow Partial Payments</span>
                  <input
                    type="checkbox"
                    checked={fees.allowPartialPayments}
                    onChange={(e) => updateFees("allowPartialPayments", e.target.checked)}
                    className="w-4 h-4 text-[#0057B8] rounded focus:ring-[#0057B8]"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-700">Allow Offline Payments</span>
                  <input
                    type="checkbox"
                    checked={fees.allowOfflinePayments}
                    onChange={(e) => updateFees("allowOfflinePayments", e.target.checked)}
                    className="w-4 h-4 text-[#0057B8] rounded focus:ring-[#0057B8]"
                  />
                </div>
              </div>
            </div>

            {/* 5. ATTENDANCE SETTINGS */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
              <h2 className="text-base font-bold text-[#0057B8] border-b border-slate-100 pb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#0057B8]" />
                Attendance Settings
              </h2>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Minimum Required Percentage (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={attendance.minimumAttendancePercentage}
                    onChange={(e) => updateAttendance("minimumAttendancePercentage", Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-[#0057B8]"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Default Working Days</label>
                  <input
                    type="text"
                    value={attendance.defaultWorkingDays}
                    onChange={(e) => updateAttendance("defaultWorkingDays", e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-[#0057B8]"
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="font-medium text-slate-700">Allow Late Marking</span>
                  <input
                    type="checkbox"
                    checked={attendance.allowLateMarking}
                    onChange={(e) => updateAttendance("allowLateMarking", e.target.checked)}
                    className="w-4 h-4 text-[#0057B8] rounded focus:ring-[#0057B8]"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-700">Allow Attendance Editing</span>
                  <input
                    type="checkbox"
                    checked={attendance.allowAttendanceEditing}
                    onChange={(e) => updateAttendance("allowAttendanceEditing", e.target.checked)}
                    className="w-4 h-4 text-[#0057B8] rounded focus:ring-[#0057B8]"
                  />
                </div>
              </div>
            </div>

            {/* 6. NOTIFICATION SWITCHES */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
              <h2 className="text-base font-bold text-[#0057B8] border-b border-slate-100 pb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#0057B8]" />
                Notification Controls (Automation Toggles)
              </h2>

              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-700">Admission Notifications</span>
                  <input
                    type="checkbox"
                    checked={notifications.admissionNotifications}
                    onChange={(e) => updateNotifications("admissionNotifications", e.target.checked)}
                    className="w-4 h-4 text-[#0057B8] rounded focus:ring-[#0057B8]"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-700">Fee Reminder Notifications</span>
                  <input
                    type="checkbox"
                    checked={notifications.feeReminderNotifications}
                    onChange={(e) => updateNotifications("feeReminderNotifications", e.target.checked)}
                    className="w-4 h-4 text-[#0057B8] rounded focus:ring-[#0057B8]"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-700">Attendance Notifications</span>
                  <input
                    type="checkbox"
                    checked={notifications.attendanceNotifications}
                    onChange={(e) => updateNotifications("attendanceNotifications", e.target.checked)}
                    className="w-4 h-4 text-[#0057B8] rounded focus:ring-[#0057B8]"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-700">Course Notifications</span>
                  <input
                    type="checkbox"
                    checked={notifications.courseNotifications}
                    onChange={(e) => updateNotifications("courseNotifications", e.target.checked)}
                    className="w-4 h-4 text-[#0057B8] rounded focus:ring-[#0057B8]"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-700">Student Account Notifications</span>
                  <input
                    type="checkbox"
                    checked={notifications.studentAccountNotifications}
                    onChange={(e) => updateNotifications("studentAccountNotifications", e.target.checked)}
                    className="w-4 h-4 text-[#0057B8] rounded focus:ring-[#0057B8]"
                  />
                </div>
              </div>
            </div>

            {/* 7. ADMIN PREFERENCES */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
              <h2 className="text-base font-bold text-[#0057B8] border-b border-slate-100 pb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#0057B8]" />
                Admin Preferences
              </h2>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Dashboard Refresh Interval (Seconds)</label>
                  <input
                    type="number"
                    min="10"
                    value={adminPrefs.dashboardRefreshInterval}
                    onChange={(e) => updateAdminPrefs("dashboardRefreshInterval", Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-[#0057B8]"
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="font-medium text-slate-700">Show Inactive Courses in Dashboard</span>
                  <input
                    type="checkbox"
                    checked={adminPrefs.showInactiveCourses}
                    onChange={(e) => updateAdminPrefs("showInactiveCourses", e.target.checked)}
                    className="w-4 h-4 text-[#0057B8] rounded focus:ring-[#0057B8]"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-700">Show Pending Admissions Alert</span>
                  <input
                    type="checkbox"
                    checked={adminPrefs.showPendingAdmissions}
                    onChange={(e) => updateAdminPrefs("showPendingAdmissions", e.target.checked)}
                    className="w-4 h-4 text-[#0057B8] rounded focus:ring-[#0057B8]"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-700">Enable Analytics & Reports Modules</span>
                  <input
                    type="checkbox"
                    checked={adminPrefs.enableReports}
                    onChange={(e) => updateAdminPrefs("enableReports", e.target.checked)}
                    className="w-4 h-4 text-[#0057B8] rounded focus:ring-[#0057B8]"
                  />
                </div>
              </div>
            </div>

            {/* 8. SECURITY & ACCESS INFORMATION */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
              <h2 className="text-base font-bold text-rose-700 border-b border-slate-100 pb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-600" />
                Security & Access Information
              </h2>

              <div className="space-y-3 text-xs text-slate-600">
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
                  <p><strong className="text-slate-800">Authentication Service:</strong> Firebase Client Auth (Active)</p>
                  <p><strong className="text-slate-800">Last Settings Sync:</strong> {lastUpdatedText}</p>
                  <p><strong className="text-slate-800">Security Policy:</strong> Client-side credentials storage is strictly disabled.</p>
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <span className="text-slate-500 italic">Admin privileges controlled via Firebase Auth & Custom Claims.</span>
                  <Link
                    href="/admin/dashboard"
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-semibold text-xs transition"
                  >
                    Manage Authentication
                  </Link>
                </div>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}