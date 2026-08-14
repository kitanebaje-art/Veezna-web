'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { PROGRAMS, GENERAL_DISCOUNT } from '@/lib/programs';
import {
  AccountDetailsSchema,
  PersonalDetailsSchema,
  AcademicDetailsSchema,
  ProgramBatchSchema,
  TextSignatureSchema,
  AccountDetails,
  PersonalDetails,
  AcademicDetails,
  ProgramBatchDetails,
  TextSignatureDetails,
} from '@/lib/validation-schemas';

function AdmissionPortalContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Primary state management across 6 steps
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [applicationId] = useState<string>(
    () => `VZ-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`
  );

  // Data Stores
  const [account, setAccount] = useState<Partial<AccountDetails>>({});
  const [personal, setPersonal] = useState<Partial<PersonalDetails>>({});
  const [academic, setAcademic] = useState<Partial<AcademicDetails>>({});
  const [programBatch, setProgramBatch] = useState<Partial<ProgramBatchDetails>>({});
  const [signatureData, setSignatureData] = useState<Partial<TextSignatureDetails>>({});

  // URL Query Param Handler: Pre-select program if passed via /apply?program=[slug_or_id]
  useEffect(() => {
    const programQuery = searchParams.get('program');
    if (programQuery) {
      const matchedProgram = PROGRAMS.find(
        (p) =>
          p.id.toLowerCase() === programQuery.toLowerCase() ||
          ('slug' in p && (p as any).slug?.toLowerCase() === programQuery.toLowerCase())
      );
      if (matchedProgram) {
        setProgramBatch((prev) => ({
          ...prev,
          programId: matchedProgram.id,
        }));
      }
    }
  }, [searchParams]);

  // Password Visibility Controls
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);

  // Form State
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [generalError, setGeneralError] = useState<string | null>(null);

  // High-Contrast 3D Input Styles
  const inputClass =
    'mt-1.5 block w-full rounded-xl border-2 border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 font-semibold text-sm shadow-[inset_0_2px_4px_rgba(0,0,0,0.06)] transition-all focus:border-[#0057B8] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#0057B8]/20';

  const selectClass =
    'mt-1.5 block w-full rounded-xl border-2 border-slate-300 bg-white px-4 py-3 text-slate-900 font-semibold text-sm shadow-[inset_0_2px_4px_rgba(0,0,0,0.06)] transition-all focus:border-[#0057B8] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#0057B8]/20';

  // STEP 1 VALIDATION & SUBMISSION
  const handleAccountSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries()) as Record<string, string>;

    const result = AccountDetailsSchema.safeParse(data);
    if (!result.success) {
      const formattedErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        if (issue.path[0]) formattedErrors[issue.path[0].toString()] = issue.message;
      });
      setErrors(formattedErrors);
      return;
    }

    setAccount(result.data);
    setCurrentStep(2);
  };

  // STEP 2 VALIDATION & SUBMISSION
  const handlePersonalSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries()) as Record<string, string>;

    const result = PersonalDetailsSchema.safeParse(data);
    if (!result.success) {
      const formattedErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        if (issue.path[0]) formattedErrors[issue.path[0].toString()] = issue.message;
      });
      setErrors(formattedErrors);
      return;
    }

    setPersonal(result.data);
    setCurrentStep(3);
  };

  // STEP 3 VALIDATION & SUBMISSION
  const handleAcademicSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries()) as Record<string, string>;

    const result = AcademicDetailsSchema.safeParse(data);
    if (!result.success) {
      const formattedErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        if (issue.path[0]) formattedErrors[issue.path[0].toString()] = issue.message;
      });
      setErrors(formattedErrors);
      return;
    }

    setAcademic(result.data);
    setCurrentStep(4);
  };

  // STEP 4 PROGRAM & BATCH SELECTION
  const handleProgramSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = ProgramBatchSchema.safeParse(programBatch);
    if (!result.success) {
      const formattedErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        if (issue.path[0]) formattedErrors[issue.path[0].toString()] = issue.message;
      });
      setErrors(formattedErrors);
      return;
    }

    setCurrentStep(5);
  };

  // STEP 5 TEXT SIGNATURE SUBMISSION
  const handleSignatureSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});
    const formData = new FormData(e.currentTarget);
    const digitalSignature = (formData.get('digitalSignature') as string) || '';
    const declarationAccepted = formData.get('declarationAccepted') === 'on';

    const result = TextSignatureSchema.safeParse({
      digitalSignature,
      declarationAccepted,
    });

    if (!result.success) {
      const formattedErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        if (issue.path[0]) formattedErrors[issue.path[0].toString()] = issue.message;
      });
      setErrors(formattedErrors);
      return;
    }

    setSignatureData(result.data);
    setCurrentStep(6);
  };

  // Calculations for Step 6
  const selectedProgramObj = PROGRAMS.find((p) => p.id === programBatch.programId);
  const totalFee = (selectedProgramObj?.fee || 0) + (selectedProgramObj?.registrationFee || 0);
  const netPayable = Math.max(0, totalFee - GENERAL_DISCOUNT);

  const stepsList = [
    { title: 'Account', desc: 'Login setup' },
    { title: 'Personal', desc: 'Identity info' },
    { title: 'Academic', desc: 'Prior history' },
    { title: 'Program', desc: 'Select course' },
    { title: 'Signature', desc: 'Verification' },
    { title: 'Payment', desc: 'Fee review' },
  ];

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-100 via-blue-50/50 to-slate-200 py-12 px-4 sm:px-6 lg:px-8 font-sans antialiased selection:bg-[#0057B8] selection:text-white">
      {/* Dynamic Ambient Glow */}
      <div className="pointer-events-none fixed inset-x-0 top-0 h-[500px] bg-gradient-to-r from-[#0057B8]/20 via-[#F7931E]/15 to-[#0057B8]/20 blur-[100px] opacity-80" />

      <div className="relative max-w-4xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-white/80 shadow-md shadow-blue-500/5 border border-blue-200/60 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-[#F7931E] animate-pulse" />
            <span className="text-[#0057B8] text-xs font-black tracking-widest uppercase">
              VEEZNA Admission Portal 2026–2027
            </span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight drop-shadow-sm">
            Online <span className="text-[#0057B8]">Admission</span> Application
          </h1>
          <p className="text-slate-600 font-semibold text-sm max-w-lg mx-auto">
            Instant Enrollment Portal. Application Ref:{' '}
            <span className="font-mono font-bold text-slate-900 bg-white px-2.5 py-1 rounded-lg border-2 border-slate-300 shadow-sm">
              {applicationId}
            </span>
          </p>
        </div>

        {/* Step Progress Bar */}
        <div className="bg-white/90 backdrop-blur-xl rounded-2xl p-4 shadow-xl shadow-slate-300/40 border border-white/80 overflow-x-auto">
          <div className="flex items-center justify-between min-w-[650px] px-2">
            {stepsList.map((st, idx) => {
              const stepNum = idx + 1;
              const isActive = currentStep === stepNum;
              const isCompleted = currentStep > stepNum;

              return (
                <div key={st.title} className="flex items-center space-x-3">
                  <div className="flex items-center space-x-3">
                    <span
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm transition-all duration-300 transform ${
                        isActive
                          ? 'bg-gradient-to-tr from-[#0057B8] to-blue-500 text-white ring-4 ring-[#0057B8]/25 scale-110 shadow-lg shadow-[#0057B8]/30'
                          : isCompleted
                          ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                          : 'bg-slate-100 text-slate-400 border border-slate-300'
                      }`}
                    >
                      {isCompleted ? '✓' : stepNum}
                    </span>
                    <div className="text-left">
                      <p
                        className={`text-xs font-black uppercase tracking-wider leading-tight ${
                          isActive
                            ? 'text-[#0057B8]'
                            : isCompleted
                            ? 'text-slate-800'
                            : 'text-slate-400'
                        }`}
                      >
                        {st.title}
                      </p>
                      <p className="text-[10px] text-slate-500 font-bold">{st.desc}</p>
                    </div>
                  </div>
                  {idx < stepsList.length - 1 && (
                    <div className="w-6 h-[3px] bg-slate-200 rounded-full" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white/95 backdrop-blur-2xl rounded-3xl shadow-2xl shadow-slate-400/30 border border-white/80 p-6 sm:p-10 relative">
          {generalError && (
            <div className="mb-6 p-4 rounded-2xl bg-red-50 border-2 border-red-300 text-red-800 text-sm font-bold flex items-center space-x-3 shadow-md">
              <span className="text-lg">⚠️</span>
              <span>{generalError}</span>
            </div>
          )}

          {/* STEP 1: ACCOUNT */}
          {currentStep === 1 && (
            <form onSubmit={handleAccountSubmit} className="space-y-6">
              <div className="border-b-2 border-slate-100 pb-4">
                <h2 className="text-2xl font-black text-slate-900">Step 1: Create Account</h2>
                <p className="text-xs text-slate-500 font-bold mt-1">
                  Primary credentials to set up student login profile.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-800">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    placeholder="Enter student's full legal name"
                    defaultValue={account.fullName || ''}
                    className={inputClass}
                  />
                  {errors.fullName && (
                    <p className="mt-1 text-xs font-bold text-red-600">{errors.fullName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-800">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    name="email"
                    placeholder="student@example.com"
                    defaultValue={account.email || ''}
                    className={inputClass}
                  />
                  {errors.email && (
                    <p className="mt-1 text-xs font-bold text-red-600">{errors.email}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-800">
                    Mobile Number *
                  </label>
                  <input
                    type="tel"
                    name="mobile"
                    placeholder="10-digit Indian mobile number"
                    defaultValue={account.mobile || ''}
                    className={inputClass}
                  />
                  {errors.mobile && (
                    <p className="mt-1 text-xs font-bold text-red-600">{errors.mobile}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-slate-800">
                      Password *
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        placeholder="Min 8 characters"
                        className={`${inputClass} pr-12`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-[22px] -translate-y-1/2 text-slate-500 hover:text-slate-900 text-base font-bold"
                      >
                        {showPassword ? '🙈' : '👁️'}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="mt-1 text-xs font-bold text-red-600">{errors.password}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-slate-800">
                      Confirm Password *
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        name="confirmPassword"
                        placeholder="Re-enter password"
                        className={`${inputClass} pr-12`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-[22px] -translate-y-1/2 text-slate-500 hover:text-slate-900 text-base font-bold"
                      >
                        {showConfirmPassword ? '🙈' : '👁️'}
                      </button>
                    </div>
                    {errors.confirmPassword && (
                      <p className="mt-1 text-xs font-bold text-red-600">
                        {errors.confirmPassword}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-6 border-t border-slate-100">
                <button
                  type="submit"
                  className="bg-[#0057B8] hover:bg-blue-700 text-white px-8 py-3.5 rounded-xl transition-all font-black text-sm shadow-xl shadow-[#0057B8]/25 hover:scale-[1.02] active:scale-95"
                >
                  Continue to Personal Details →
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: PERSONAL */}
          {currentStep === 2 && (
            <form onSubmit={handlePersonalSubmit} className="space-y-6">
              <div className="border-b-2 border-slate-100 pb-4">
                <h2 className="text-2xl font-black text-slate-900">Step 2: Personal Details</h2>
                <p className="text-xs text-slate-500 font-bold mt-1">
                  Ensure information matches official government identification.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-800">
                    Father's Name *
                  </label>
                  <input
                    type="text"
                    name="fatherName"
                    placeholder="Father's full name"
                    defaultValue={personal.fatherName || ''}
                    className={inputClass}
                  />
                  {errors.fatherName && (
                    <p className="mt-1 text-xs font-bold text-red-600">{errors.fatherName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-800">
                    Mother's Name *
                  </label>
                  <input
                    type="text"
                    name="motherName"
                    placeholder="Mother's full name"
                    defaultValue={personal.motherName || ''}
                    className={inputClass}
                  />
                  {errors.motherName && (
                    <p className="mt-1 text-xs font-bold text-red-600">{errors.motherName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-800">
                    Date of Birth *
                  </label>
                  <input
                    type="date"
                    name="dob"
                    defaultValue={personal.dob || ''}
                    className={inputClass}
                  />
                  {errors.dob && (
                    <p className="mt-1 text-xs font-bold text-red-600">{errors.dob}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-800">
                    Gender *
                  </label>
                  <select
                    name="gender"
                    defaultValue={personal.gender || 'Male'}
                    className={selectClass}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                  {errors.gender && (
                    <p className="mt-1 text-xs font-bold text-red-600">{errors.gender}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-800">
                    Blood Group <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    name="bloodGroup"
                    placeholder="e.g. O+, A+, B+"
                    defaultValue={personal.bloodGroup || ''}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-800">
                    Nationality *
                  </label>
                  <input
                    type="text"
                    name="nationality"
                    defaultValue={personal.nationality || 'Indian'}
                    className={inputClass}
                  />
                  {errors.nationality && (
                    <p className="mt-1 text-xs font-bold text-red-600">{errors.nationality}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-800">
                    Category *
                  </label>
                  <select
                    name="category"
                    defaultValue={personal.category || 'General'}
                    className={selectClass}
                  >
                    <option value="General">General</option>
                    <option value="OBC">OBC</option>
                    <option value="SC/ST">SC/ST</option>
                    <option value="EWS">EWS</option>
                  </select>
                  {errors.category && (
                    <p className="mt-1 text-xs font-bold text-red-600">{errors.category}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-800">
                    City *
                  </label>
                  <input
                    type="text"
                    name="city"
                    placeholder="Current city"
                    defaultValue={personal.city || ''}
                    className={inputClass}
                  />
                  {errors.city && (
                    <p className="mt-1 text-xs font-bold text-red-600">{errors.city}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-800">
                    State *
                  </label>
                  <input
                    type="text"
                    name="state"
                    placeholder="State name"
                    defaultValue={personal.state || ''}
                    className={inputClass}
                  />
                  {errors.state && (
                    <p className="mt-1 text-xs font-bold text-red-600">{errors.state}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-800">
                    PIN Code *
                  </label>
                  <input
                    type="text"
                    name="pinCode"
                    maxLength={6}
                    placeholder="6-digit postal code"
                    defaultValue={personal.pinCode || ''}
                    className={inputClass}
                  />
                  {errors.pinCode && (
                    <p className="mt-1 text-xs font-bold text-red-600">{errors.pinCode}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-slate-800">
                  Full Residential Address *
                </label>
                <textarea
                  name="address"
                  rows={3}
                  placeholder="Street address, apartment, house number"
                  defaultValue={personal.address || ''}
                  className={inputClass}
                />
                {errors.address && (
                  <p className="mt-1 text-xs font-bold text-red-600">{errors.address}</p>
                )}
              </div>

              <div className="flex justify-between pt-6 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="bg-slate-200 text-slate-800 px-7 py-3 rounded-xl font-extrabold text-sm hover:bg-slate-300 transition-colors"
                >
                  ← Back
                </button>
                <button
                  type="submit"
                  className="bg-[#0057B8] hover:bg-blue-700 text-white px-8 py-3.5 rounded-xl transition-all font-black text-sm shadow-xl shadow-[#0057B8]/25 hover:scale-[1.02] active:scale-95"
                >
                  Continue to Academic Details →
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: ACADEMIC */}
          {currentStep === 3 && (
            <form onSubmit={handleAcademicSubmit} className="space-y-6">
              <div className="border-b-2 border-slate-100 pb-4">
                <h2 className="text-2xl font-black text-slate-900">Step 3: Academic History</h2>
                <p className="text-xs text-slate-500 font-bold mt-1">
                  Prior academic qualifications and school credentials.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-800">
                    Current Class / Program Level *
                  </label>
                  <input
                    type="text"
                    name="currentClass"
                    placeholder="e.g. Class 10, Class 12, Graduate"
                    defaultValue={academic.currentClass || ''}
                    className={inputClass}
                  />
                  {errors.currentClass && (
                    <p className="mt-1 text-xs font-bold text-red-600">{errors.currentClass}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-800">
                    Previous School / Institution *
                  </label>
                  <input
                    type="text"
                    name="previousSchool"
                    placeholder="Name of school or college"
                    defaultValue={academic.previousSchool || ''}
                    className={inputClass}
                  />
                  {errors.previousSchool && (
                    <p className="mt-1 text-xs font-bold text-red-600">{errors.previousSchool}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-slate-800">
                      Board *
                    </label>
                    <input
                      type="text"
                      name="board"
                      placeholder="CBSE / State / ICSE"
                      defaultValue={academic.board || ''}
                      className={inputClass}
                    />
                    {errors.board && (
                      <p className="mt-1 text-xs font-bold text-red-600">{errors.board}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-slate-800">
                      Percentage / Grade *
                    </label>
                    <input
                      type="text"
                      name="percentage"
                      placeholder="e.g. 88.5% or A1"
                      defaultValue={academic.percentage || ''}
                      className={inputClass}
                    />
                    {errors.percentage && (
                      <p className="mt-1 text-xs font-bold text-red-600">{errors.percentage}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-slate-800">
                      Passing Year *
                    </label>
                    <input
                      type="text"
                      name="passingYear"
                      maxLength={4}
                      placeholder="YYYY"
                      defaultValue={academic.passingYear || ''}
                      className={inputClass}
                    />
                    {errors.passingYear && (
                      <p className="mt-1 text-xs font-bold text-red-600">{errors.passingYear}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-between pt-6 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="bg-slate-200 text-slate-800 px-7 py-3 rounded-xl font-extrabold text-sm hover:bg-slate-300 transition-colors"
                >
                  ← Back
                </button>
                <button
                  type="submit"
                  className="bg-[#0057B8] hover:bg-blue-700 text-white px-8 py-3.5 rounded-xl transition-all font-black text-sm shadow-xl shadow-[#0057B8]/25 hover:scale-[1.02] active:scale-95"
                >
                  Continue to Program & Batch →
                </button>
              </div>
            </form>
          )}

          {/* STEP 4: PROGRAM */}
          {currentStep === 4 && (
            <form onSubmit={handleProgramSubmit} className="space-y-6">
              <div className="border-b-2 border-slate-100 pb-4">
                <h2 className="text-2xl font-black text-slate-900">Step 4: Select Program & Batch</h2>
                <p className="text-xs text-slate-500 font-bold mt-1">
                  Choose your learning track and preferred time slot.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {PROGRAMS.map((prog) => {
                  const isSelected = programBatch.programId === prog.id;
                  return (
                    <div
                      key={prog.id}
                      onClick={() => setProgramBatch((prev) => ({ ...prev, programId: prog.id }))}
                      className={`relative p-5 rounded-2xl border-2 cursor-pointer transition-all transform hover:-translate-y-1 ${
                        isSelected
                          ? 'border-[#0057B8] bg-blue-50/70 shadow-lg ring-4 ring-[#0057B8]/15'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <h3 className="font-black text-slate-900 text-base">{prog.title}</h3>
                        <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 bg-amber-100 text-amber-900 rounded-full border border-amber-300">
                          {prog.seats} Seats Left
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 font-medium mt-2">{prog.description}</p>

                      <div className="mt-4 pt-3 border-t border-slate-200 flex justify-between items-center text-xs">
                        <span className="text-slate-500 font-bold">
                          Duration: <strong className="text-slate-900">{prog.duration}</strong>
                        </span>
                        <span className="text-base font-black text-[#0057B8]">
                          ₹{prog.fee.toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
              {errors.programId && (
                <p className="text-xs font-bold text-red-600">{errors.programId}</p>
              )}

              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-slate-800 mb-2">
                  Preferred Batch Timing *
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {['Morning', 'Afternoon', 'Evening'].map((b) => (
                    <button
                      type="button"
                      key={b}
                      onClick={() => setProgramBatch((prev) => ({ ...prev, batch: b as any }))}
                      className={`py-3.5 px-4 rounded-xl border-2 text-sm font-black transition-all ${
                        programBatch.batch === b
                          ? 'border-[#0057B8] bg-[#0057B8] text-white shadow-lg shadow-[#0057B8]/25 scale-105'
                          : 'border-slate-200 bg-white text-slate-800 hover:bg-slate-50'
                      }`}
                    >
                      {b}
                    </button>
                  ))}
                </div>
                {errors.batch && (
                  <p className="text-xs font-bold text-red-600 mt-1">{errors.batch}</p>
                )}
              </div>

              <div className="flex justify-between pt-6 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="bg-slate-200 text-slate-800 px-7 py-3 rounded-xl font-extrabold text-sm hover:bg-slate-300 transition-colors"
                >
                  ← Back
                </button>
                <button
                  type="submit"
                  className="bg-[#0057B8] hover:bg-blue-700 text-white px-8 py-3.5 rounded-xl transition-all font-black text-sm shadow-xl shadow-[#0057B8]/25 hover:scale-[1.02] active:scale-95"
                >
                  Continue to Digital Verification →
                </button>
              </div>
            </form>
          )}

          {/* STEP 5: DIGITAL TEXT SIGNATURE */}
          {currentStep === 5 && (
            <form onSubmit={handleSignatureSubmit} className="space-y-6">
              <div className="border-b-2 border-slate-100 pb-4">
                <h2 className="text-2xl font-black text-slate-900">Step 5: Digital Verification</h2>
                <p className="text-xs text-slate-500 font-bold mt-1">
                  Confirm application accuracy with your digital text signature.
                </p>
              </div>

              <div className="p-5 bg-gradient-to-br from-blue-50/60 to-slate-100/60 rounded-2xl border-2 border-blue-100/80 space-y-4">
                <div className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    id="declaration"
                    name="declarationAccepted"
                    defaultChecked={signatureData.declarationAccepted}
                    className="mt-1 h-5 w-5 rounded border-2 border-slate-400 text-[#0057B8] focus:ring-[#0057B8]"
                  />
                  <label htmlFor="declaration" className="text-xs text-slate-700 font-bold leading-relaxed cursor-pointer">
                    I hereby declare that all information supplied in this online admission application is true, accurate, and complete to the best of my knowledge. I agree to abide by the rules and guidelines of the VEEZNA Educational Ecosystem.
                  </label>
                </div>
                {errors.declarationAccepted && (
                  <p className="text-xs font-bold text-red-600">{errors.declarationAccepted}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-slate-800">
                  Digital Text Signature (Type Your Full Legal Name) *
                </label>
                <input
                  type="text"
                  name="digitalSignature"
                  placeholder="e.g. Aarav Sharma"
                  defaultValue={signatureData.digitalSignature || ''}
                  className={`${inputClass} font-mono text-lg tracking-wide`}
                />
                <p className="text-[11px] text-slate-500 font-semibold mt-1">
                  By typing your full name above, it serves as your binding electronic signature.
                </p>
                {errors.digitalSignature && (
                  <p className="mt-1 text-xs font-bold text-red-600">{errors.digitalSignature}</p>
                )}
              </div>

              <div className="flex justify-between pt-6 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCurrentStep(4)}
                  className="bg-slate-200 text-slate-800 px-7 py-3 rounded-xl font-extrabold text-sm hover:bg-slate-300 transition-colors"
                >
                  ← Back
                </button>
                <button
                  type="submit"
                  className="bg-[#0057B8] hover:bg-blue-700 text-white px-8 py-3.5 rounded-xl transition-all font-black text-sm shadow-xl shadow-[#0057B8]/25 hover:scale-[1.02] active:scale-95"
                >
                  Continue to Fee Review →
                </button>
              </div>
            </form>
          )}

          {/* STEP 6: DIRECT UPI PAYMENT & UTR SUBMISSION */}
          {currentStep === 6 && (
            <div className="space-y-6">
              <div className="border-b-2 border-slate-100 pb-4">
                <h2 className="text-2xl font-black text-slate-900">Step 6: Payment via UPI</h2>
                <p className="text-xs text-slate-500 font-bold mt-1">
                  Scan the QR code using any UPI app (Google Pay, PhonePe, Paytm, BHIM) and submit your 12-digit UTR/Reference number.
                </p>
              </div>

              {/* Fee Summary */}
              <div className="bg-slate-50/90 rounded-2xl p-6 space-y-3 border-2 border-slate-200">
                <div className="flex justify-between items-center text-sm border-b border-slate-200 pb-2">
                  <span className="text-slate-600 font-bold">Selected Program:</span>
                  <span className="font-black text-slate-900">{selectedProgramObj?.title}</span>
                </div>
                <div className="flex justify-between items-center text-sm border-b border-slate-200 pb-2">
                  <span className="text-slate-600 font-bold">Preferred Batch:</span>
                  <span className="font-black text-slate-900">{programBatch.batch}</span>
                </div>
                <div className="flex justify-between items-center text-base pt-2">
                  <span className="font-black text-slate-900">Total Net Payable:</span>
                  <span className="text-3xl font-black text-[#0057B8]">
                    ₹{netPayable.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Dynamic UPI QR Code & Instructions */}
              <div className="p-6 bg-gradient-to-br from-blue-50 to-slate-100 rounded-2xl border-2 border-blue-200 flex flex-col items-center text-center space-y-4">
                <p className="text-xs font-black uppercase tracking-widest text-[#0057B8]">
                  Scan QR Code to Pay
                </p>

                {/* Generate dynamic UPI QR URL */}
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=9929999225-1@okbizaxis%26pn=VEEZNA%2520Ecosystem%26am=${netPayable}%26cu=INR`}
                  alt="VEEZNA Official Payment QR Code"
                  className="w-48 h-48 rounded-xl shadow-md border-4 border-white"
                />

                <div className="text-xs font-bold text-slate-700 space-y-1">
                  <p>
                    UPI ID:{' '}
                    <span className="font-mono text-slate-900 bg-white px-2 py-0.5 rounded border">
                      veezna@upi
                    </span>
                  </p>
                  <p className="text-slate-500">Official Merchant: VEEZNA Educational Ecosystem</p>
                </div>
              </div>

              {/* UTR Input Form */}
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setIsSubmitting(true);
                  setGeneralError(null);

                  const formData = new FormData(e.currentTarget);
                  const utrNumber = (formData.get('utrNumber') as string) || '';

                  if (!/^\d{12}$/.test(utrNumber)) {
                    setGeneralError('Please enter a valid 12-digit UPI UTR / Reference Number.');
                    setIsSubmitting(false);
                    return;
                  }

                  try {
                    // Save complete record directly to Firestore
                    const appRef = doc(db, 'admissions', applicationId);
                    await setDoc(appRef, {
                      applicationId,
                      applicationNumber: applicationId,
                      status: 'under_review',
                      createdAt: serverTimestamp(),
                      updatedAt: serverTimestamp(),
                      account: {
                        fullName: account.fullName,
                        email: account.email,
                        mobile: account.mobile,
                      },
                      personal,
                      academic,
                      program: {
                        id: selectedProgramObj?.id,
                        title: selectedProgramObj?.title,
                        fee: selectedProgramObj?.fee,
                        registrationFee: selectedProgramObj?.registrationFee,
                      },
                      batch: programBatch.batch,
                      textSignature: {
                        signedName: signatureData.digitalSignature,
                        signedAt: new Date().toISOString(),
                        declarationAgreed: true,
                      },
                      payment: {
                        totalFee,
                        discount: GENERAL_DISCOUNT,
                        netPayable,
                        status: 'pending_verification',
                        utrNumber,
                        paymentMode: 'Direct UPI',
                        submittedAt: new Date().toISOString(),
                      },
                    });

                    router.push(
                      `/apply/success?appId=${applicationId}&utr=${utrNumber}&amount=${netPayable}`
                    );
                  } catch (err: any) {
                    setGeneralError(err.message || 'Failed to submit application.');
                    setIsSubmitting(false);
                  }
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-800">
                    12-Digit UPI Transaction UTR / Reference ID *
                  </label>
                  <input
                    type="text"
                    name="utrNumber"
                    maxLength={12}
                    required
                    placeholder="e.g. 423189056214"
                    className="mt-1.5 block w-full rounded-xl border-2 border-slate-300 bg-white px-4 py-3 text-slate-900 font-mono text-base font-bold shadow-sm transition-all focus:border-[#0057B8] focus:outline-none focus:ring-4 focus:ring-[#0057B8]/20"
                  />
                  <p className="text-[11px] text-slate-500 font-semibold mt-1">
                    You will find this 12-digit number in your Google Pay / PhonePe / Paytm transaction receipt.
                  </p>
                </div>

                <div className="flex justify-between pt-6 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(5)}
                    disabled={isSubmitting}
                    className="bg-slate-200 text-slate-800 px-7 py-3 rounded-xl font-extrabold text-sm hover:bg-slate-300 transition-colors disabled:opacity-50"
                  >
                    ← Back
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-[#0057B8] hover:bg-blue-700 text-white px-9 py-4 rounded-xl transition-all font-black text-base shadow-xl shadow-[#0057B8]/30 disabled:opacity-50 hover:scale-[1.02] active:scale-95"
                  >
                    {isSubmitting ? 'Submitting Application...' : 'Submit Application & Verify UTR'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdmissionPortalPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-100">
          <div className="text-center space-y-3">
            <div className="w-10 h-10 border-4 border-[#0057B8] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-slate-600 font-bold text-sm">Loading Admission Portal...</p>
          </div>
        </div>
      }
    >
      <AdmissionPortalContent />
    </Suspense>
  );
}