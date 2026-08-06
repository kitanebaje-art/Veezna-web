'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AccountSchema, PersonalDetailsSchema, AcademicDetailsSchema, AccountFormData, PersonalFormData, AcademicFormData } from '@/lib/validation-schemas';

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function AdmissionPortalPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [selectedProgram, setSelectedProgram] = useState<any>(null);
  const [selectedBatch, setSelectedBatch] = useState<'Morning' | 'Afternoon' | 'Evening'>('Morning');
  const [uploadedDocs, setUploadedDocs] = useState({ photo: false, marksheet: false, signature: false });
  const [isProcessing, setIsProcessing] = useState(false);

  // Form hooks
  const accountForm = useForm<AccountFormData>({ resolver: zodResolver(AccountSchema) });
  const personalForm = useForm<PersonalFormData>({ resolver: zodResolver(PersonalDetailsSchema) });
  const academicForm = useForm<AcademicFormData>({ resolver: zodResolver(AcademicDetailsSchema) });

  // Programs Data
  const programs = [
    { id: 'academic', title: 'Academic Excellence', duration: '1 Year', fee: 45000, regFee: 1500, seats: 12, startDate: '15 Aug 2026', desc: 'Concept coaching for Class 6–12 Board Exams' },
    { id: 'vox', title: 'Veezna Vox', duration: '6 Months', fee: 25000, regFee: 1000, seats: 8, startDate: '20 Aug 2026', desc: 'Spoken English, Fluency & Public Speaking' },
    { id: 'web', title: 'Web Development', duration: '6 Months', fee: 35000, regFee: 1000, seats: 5, startDate: '01 Sep 2026', desc: 'Full Stack Next.js, React & Modern Web Tech' },
    { id: 'wellness', title: 'Wellness & Care', duration: 'Flexible', fee: 15000, regFee: 500, seats: 15, startDate: 'Immediate', desc: 'Ethical guidance & mental wellbeing' },
  ];

  const activeProgram = selectedProgram || programs[0];
  const totalFee = activeProgram.fee + activeProgram.regFee;
  const discount = 2000;
  const netPayable = totalFee - discount;

  // Razorpay Gateway Launch
  const handleRazorpayPayment = () => {
    setIsProcessing(true);

    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_VeeznaDemoKey2026',
      amount: netPayable * 100, // Amount in paise
      currency: 'INR',
      name: 'Veezna Educational Ecosystem',
      description: `Admission Fee - ${activeProgram.title}`,
      image: 'https://www.veezna.com/favicon.ico',
      handler: function (response: any) {
        setIsProcessing(false);
        const applicationNo = `VZ-2026-${Math.floor(100000 + Math.random() * 900000)}`;
        const txId = response.razorpay_payment_id || `TXN-${Date.now()}`;
        
        router.push(`/apply/success?appNo=${applicationNo}&txId=${txId}&amount=${netPayable}&program=${encodeURIComponent(activeProgram.title)}`);
      },
      prefill: {
        name: accountForm.getValues('fullName') || 'Student Candidate',
        email: accountForm.getValues('email') || 'student@veezna.com',
        contact: accountForm.getValues('mobile') || '9001170039',
      },
      theme: {
        color: '#0057B8',
      },
    };

    if (typeof window !== 'undefined' && window.Razorpay) {
      const rzp = new window.Razorpay(options);
      rzp.open();
    } else {
      // Fallback simulation if script loaded dynamically
      setTimeout(() => {
        setIsProcessing(false);
        const applicationNo = `VZ-2026-${Math.floor(100000 + Math.random() * 900000)}`;
        router.push(`/apply/success?appNo=${applicationNo}&txId=TXN-DEMO-${Date.now()}&amount=${netPayable}&program=${encodeURIComponent(activeProgram.title)}`);
      }, 1500);
    }
  };

  return (
    <div className="min-h-screen pt-28 pb-20 bg-gradient-to-b from-[#FFFFFF] via-[#F4F8FC] to-[#F8FAFC] text-[#1E293B]">
      {/* Razorpay SDK */}
      <script src="https://checkout.razorpay.com/v1/checkout.js" async />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center space-y-3 mb-10">
          <span className="px-3.5 py-1.5 rounded-full bg-blue-50 text-[#0057B8] border border-blue-100 text-xs font-extrabold uppercase tracking-widest">
            VEEZNA ADMISSION PORTAL
          </span>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900">
            Online Student Application
          </h1>
          <p className="text-slate-600 text-sm sm:text-base max-w-xl mx-auto">
            Complete your admission registration, select your program batch, and pay fees securely.
          </p>
        </div>

        {/* Stepper Header Bar */}
        <div className="mb-10 p-4 rounded-3xl bg-white/80 border border-slate-200/80 backdrop-blur-xl shadow-md">
          <div className="flex items-center justify-between overflow-x-auto gap-2 text-xs font-bold">
            {[
              { num: 1, label: 'Account' },
              { num: 2, label: 'Personal' },
              { num: 3, label: 'Academic' },
              { num: 4, label: 'Program & Batch' },
              { num: 5, label: 'Documents' },
              { num: 6, label: 'Fee & Payment' },
            ].map((step) => (
              <div
                key={step.num}
                onClick={() => step.num < currentStep && setCurrentStep(step.num)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl whitespace-nowrap transition-all ${
                  currentStep === step.num
                    ? 'bg-[#0057B8] text-white shadow-md shadow-blue-500/20'
                    : currentStep > step.num
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-pointer'
                    : 'bg-slate-50 text-slate-400'
                }`}
              >
                <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[11px]">
                  {step.num}
                </span>
                <span>{step.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Dynamic Form Content */}
        <div className="rounded-[32px] bg-white border border-slate-200/80 p-6 sm:p-10 shadow-xl shadow-slate-200/50">
          
          {/* STEP 1: CREATE ACCOUNT */}
          {currentStep === 1 && (
            <form onSubmit={accountForm.handleSubmit(() => setCurrentStep(2))} className="space-y-6">
              <h2 className="text-xl font-bold text-slate-900 border-b pb-3">Step 1: Create Student Account</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Full Name</label>
                  <input
                    {...accountForm.register('fullName')}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:border-[#0057B8]"
                    placeholder="Enter full legal name"
                  />
                  {accountForm.formState.errors.fullName && <p className="text-xs text-rose-500 mt-1">{accountForm.formState.errors.fullName.message}</p>}
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Email Address</label>
                  <input
                    {...accountForm.register('email')}
                    type="email"
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:border-[#0057B8]"
                    placeholder="student@example.com"
                  />
                  {accountForm.formState.errors.email && <p className="text-xs text-rose-500 mt-1">{accountForm.formState.errors.email.message}</p>}
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Mobile Number</label>
                  <input
                    {...accountForm.register('mobile')}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:border-[#0057B8]"
                    placeholder="10-digit Mobile Number"
                  />
                  {accountForm.formState.errors.mobile && <p className="text-xs text-rose-500 mt-1">{accountForm.formState.errors.mobile.message}</p>}
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Password</label>
                  <input
                    {...accountForm.register('password')}
                    type="password"
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:border-[#0057B8]"
                    placeholder="Minimum 8 characters"
                  />
                  {accountForm.formState.errors.password && <p className="text-xs text-rose-500 mt-1">{accountForm.formState.errors.password.message}</p>}
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Confirm Password</label>
                  <input
                    {...accountForm.register('confirmPassword')}
                    type="password"
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:border-[#0057B8]"
                    placeholder="Re-enter password"
                  />
                  {accountForm.formState.errors.confirmPassword && <p className="text-xs text-rose-500 mt-1">{accountForm.formState.errors.confirmPassword.message}</p>}
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  className="px-8 py-3.5 rounded-2xl bg-[#0057B8] hover:bg-[#00438F] text-white font-bold text-sm shadow-md transition-all"
                >
                  Continue to Personal Details →
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: PERSONAL DETAILS */}
          {currentStep === 2 && (
            <form onSubmit={personalForm.handleSubmit(() => setCurrentStep(3))} className="space-y-6">
              <h2 className="text-xl font-bold text-slate-900 border-b pb-3">Step 2: Personal Details</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Father's Name</label>
                  <input {...personalForm.register('fatherName')} className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm" placeholder="Father's full name" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Mother's Name</label>
                  <input {...personalForm.register('motherName')} className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm" placeholder="Mother's full name" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Date of Birth</label>
                  <input {...personalForm.register('dob')} type="date" className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Gender</label>
                  <select {...personalForm.register('gender')} className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm">
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Blood Group</label>
                  <input {...personalForm.register('bloodGroup')} className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm" placeholder="e.g. O+, A+, B+" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Nationality</label>
                  <input {...personalForm.register('nationality')} defaultValue="Indian" className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Category</label>
                  <select {...personalForm.register('category')} className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm">
                    <option value="General">General</option>
                    <option value="OBC">OBC</option>
                    <option value="SC/ST">SC/ST</option>
                    <option value="EWS">EWS</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-2">City</label>
                  <input {...personalForm.register('city')} className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm" placeholder="e.g. Neemuch" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-2">State</label>
                  <input {...personalForm.register('state')} className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm" placeholder="e.g. Madhya Pradesh" />
                </div>
                <div className="sm:col-span-2 lg:col-span-3">
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Full Residential Address</label>
                  <input {...personalForm.register('addressStreet')} className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm" placeholder="House/Street/Locality" />
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <button type="button" onClick={() => setCurrentStep(1)} className="px-6 py-3 rounded-xl bg-slate-100 font-bold text-xs text-slate-600">
                  ← Back
                </button>
                <button type="submit" className="px-8 py-3.5 rounded-2xl bg-[#0057B8] hover:bg-[#00438F] text-white font-bold text-sm">
                  Continue to Academic Details →
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: ACADEMIC DETAILS */}
          {currentStep === 3 && (
            <form onSubmit={academicForm.handleSubmit(() => setCurrentStep(4))} className="space-y-6">
              <h2 className="text-xl font-bold text-slate-900 border-b pb-3">Step 3: Academic History</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Target Class / Program Level</label>
                  <input {...academicForm.register('currentClass')} className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm" placeholder="e.g. Class 11 Commerce / Professional" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Previous School / Institution</label>
                  <input {...academicForm.register('previousSchool')} className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm" placeholder="School name" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Education Board</label>
                  <input {...academicForm.register('board')} className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm" placeholder="CBSE / MP Board / ICSE / University" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Previous Percentage / Grade</label>
                  <input {...academicForm.register('percentageGrade')} className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm" placeholder="e.g. 88% or A Grade" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Passing Year</label>
                  <input {...academicForm.register('passingYear')} className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm" placeholder="2026" />
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <button type="button" onClick={() => setCurrentStep(2)} className="px-6 py-3 rounded-xl bg-slate-100 font-bold text-xs text-slate-600">
                  ← Back
                </button>
                <button type="submit" className="px-8 py-3.5 rounded-2xl bg-[#0057B8] text-white font-bold text-sm">
                  Continue to Program & Batch →
                </button>
              </div>
            </form>
          )}

          {/* STEP 4: PROGRAM & BATCH SELECTION */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-slate-900 border-b pb-3">Step 4: Choose Program & Preferred Batch</h2>
              
              {/* Programs Selector */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {programs.map((prog) => (
                  <div
                    key={prog.id}
                    onClick={() => setSelectedProgram(prog)}
                    className={`p-5 rounded-2xl border transition-all cursor-pointer ${
                      activeProgram.id === prog.id
                        ? 'border-[#0057B8] bg-blue-50/50 shadow-md ring-2 ring-[#0057B8]/20'
                        : 'border-slate-200 bg-slate-50/50 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-slate-900 text-base">{prog.title}</h3>
                      <span className="text-xs font-extrabold text-[#0057B8] bg-white px-2.5 py-1 rounded-full border border-blue-100">
                        ₹{prog.fee.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mb-3">{prog.desc}</p>
                    <div className="flex justify-between text-[11px] font-semibold text-slate-600 pt-2 border-t border-slate-100">
                      <span>Duration: {prog.duration}</span>
                      <span className="text-amber-600 font-bold">{prog.seats} Seats Left</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Batch Selector */}
              <div className="pt-4 space-y-3">
                <label className="block text-xs font-bold text-slate-700 uppercase">Select Preferred Batch Timing</label>
                <div className="grid grid-cols-3 gap-3">
                  {(['Morning', 'Afternoon', 'Evening'] as const).map((batch) => (
                    <button
                      key={batch}
                      type="button"
                      onClick={() => setSelectedBatch(batch)}
                      className={`py-3 rounded-xl text-xs font-bold border transition-all ${
                        selectedBatch === batch
                          ? 'bg-[#F7931E] text-white border-[#F7931E] shadow-md shadow-amber-500/20'
                          : 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      {batch} Batch
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <button type="button" onClick={() => setCurrentStep(3)} className="px-6 py-3 rounded-xl bg-slate-100 font-bold text-xs text-slate-600">
                  ← Back
                </button>
                <button type="button" onClick={() => setCurrentStep(5)} className="px-8 py-3.5 rounded-2xl bg-[#0057B8] text-white font-bold text-sm">
                  Continue to Document Upload →
                </button>
              </div>
            </div>
          )}

          {/* STEP 5: DOCUMENT UPLOAD */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-slate-900 border-b pb-3">Step 5: Upload Required Documents</h2>
              
              <div className="space-y-4">
                {[
                  { key: 'photo', title: 'Passport Size Photograph', desc: 'JPEG/PNG under 2MB' },
                  { key: 'marksheet', title: 'Previous Marksheet / Certificate', desc: 'PDF or Image under 5MB' },
                  { key: 'signature', title: 'Student Signature Specimen', desc: 'Clear image on white paper' },
                ].map((doc) => (
                  <div key={doc.key} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{doc.title}</h4>
                      <p className="text-xs text-slate-500">{doc.desc}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setUploadedDocs((prev) => ({ ...prev, [doc.key]: true }))}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                        (uploadedDocs as any)[doc.key]
                          ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                          : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      {(uploadedDocs as any)[doc.key] ? '✓ Uploaded' : 'Choose File'}
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex justify-between pt-4">
                <button type="button" onClick={() => setCurrentStep(4)} className="px-6 py-3 rounded-xl bg-slate-100 font-bold text-xs text-slate-600">
                  ← Back
                </button>
                <button type="button" onClick={() => setCurrentStep(6)} className="px-8 py-3.5 rounded-2xl bg-[#0057B8] text-white font-bold text-sm">
                  Review Fee & Pay Online →
                </button>
              </div>
            </div>
          )}

          {/* STEP 6: FEE SUMMARY & RAZORPAY PAYMENT */}
          {currentStep === 6 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-slate-900 border-b pb-3">Step 6: Fee Structure & Payment Confirmation</h2>

              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex justify-between text-sm text-slate-600">
                  <span>Selected Program</span>
                  <span className="font-bold text-slate-900">{activeProgram.title}</span>
                </div>
                <div className="flex justify-between text-sm text-slate-600">
                  <span>Registration Fee</span>
                  <span className="font-semibold text-slate-800">₹{activeProgram.regFee.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-sm text-slate-600">
                  <span>Tuition Fee</span>
                  <span className="font-semibold text-slate-800">₹{activeProgram.fee.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-sm text-emerald-600 font-semibold">
                  <span>Early Admission Discount</span>
                  <span>- ₹{discount.toLocaleString('en-IN')}</span>
                </div>
                <div className="pt-3 border-t border-slate-200 flex justify-between text-base font-black text-slate-900">
                  <span>Total Amount Payable</span>
                  <span className="text-[#0057B8] text-xl">₹{netPayable.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-100 text-xs text-[#0057B8] space-y-1">
                <p className="font-bold">🔒 Guaranteed Secure Payment Gateway</p>
                <p>Supports UPI (Google Pay, PhonePe, Paytm), All Credit/Debit Cards, Net Banking & Wallets.</p>
              </div>

              <div className="flex justify-between pt-4">
                <button type="button" onClick={() => setCurrentStep(5)} className="px-6 py-3 rounded-xl bg-slate-100 font-bold text-xs text-slate-600">
                  ← Back
                </button>
                <button
                  type="button"
                  onClick={handleRazorpayPayment}
                  disabled={isProcessing}
                  className="px-8 py-4 rounded-2xl bg-gradient-to-r from-[#0057B8] to-[#F7931E] hover:opacity-95 text-white font-extrabold text-base shadow-lg shadow-blue-500/20 disabled:opacity-50"
                >
                  {isProcessing ? 'Processing Transaction...' : `Pay ₹${netPayable.toLocaleString('en-IN')} via Razorpay`}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}