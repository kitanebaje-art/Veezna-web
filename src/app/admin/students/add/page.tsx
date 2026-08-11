
// src/app/admin/students/add/page.tsx

'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';

interface SuccessData {
  success: boolean;
  message: string;
  student: {
    studentId: string;
    uid: string;
    loginEmail: string;
    defaultPassword: string;
  };
}

export default function AddStudentPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<SuccessData | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    email: '',
    password: '',
    dob: '',
    gender: 'male',
    parentName: '',
    parentMobile: '',
    address: '',
    academicClass: 'Class 10',
    courseId: 'CRS-GENERIC',
    batchId: 'BATCH-2026-A',
    totalFee: '15000',
    registrationFeePaid: '2000',
    paymentMethod: 'cash',
    transactionId: '',
    notes: '',
  });

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (loading) return;

    setLoading(true);
    setError(null);
    setSuccessData(null);

    try {
      // -------------------------------------------------------
      // 1. Get Firebase authentication token
      // -------------------------------------------------------

      const currentUser = auth.currentUser;

      let token = 'admin-session-token';

      if (currentUser) {
        token = await currentUser.getIdToken(true);
      }

      // -------------------------------------------------------
      // 2. Send request to Admin API
      // -------------------------------------------------------

      const res = await fetch('/api/admin/create-student', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      // -------------------------------------------------------
      // 3. Read response as TEXT first
      //
      // This prevents:
      // "Unexpected end of JSON input"
      // -------------------------------------------------------

      const responseText = await res.text();

      console.log(
        '[Create Student] HTTP Status:',
        res.status
      );

      console.log(
        '[Create Student] Raw Response:',
        responseText
      );

      let data: any = null;

      if (responseText.trim()) {
        try {
          data = JSON.parse(responseText);
        } catch (parseError) {
          console.error(
            '[Create Student] Invalid JSON response:',
            parseError
          );

          throw new Error(
            `Server returned an invalid response. HTTP ${res.status}`
          );
        }
      }

      // -------------------------------------------------------
      // 4. Handle empty server response
      // -------------------------------------------------------

      if (!responseText.trim()) {
        throw new Error(
          `Server returned an empty response. HTTP ${res.status}`
        );
      }

      // -------------------------------------------------------
      // 5. Handle API errors
      // -------------------------------------------------------

      if (!res.ok) {
        const serverError =
          data?.error ||
          data?.message ||
          `Student creation failed. HTTP ${res.status}`;

        console.error(
          '[Create Student] API Error:',
          data
        );

        throw new Error(serverError);
      }

      // -------------------------------------------------------
      // 6. Validate success response
      // -------------------------------------------------------

      if (!data?.success) {
        console.error(
          '[Create Student] Unexpected API response:',
          data
        );

        throw new Error(
          data?.error ||
            'Student creation failed. The server did not confirm success.'
        );
      }

      // -------------------------------------------------------
      // 7. Validate student information
      // -------------------------------------------------------

      if (!data?.student?.studentId) {
        console.error(
          '[Create Student] Missing student data:',
          data
        );

        throw new Error(
          'Student was processed, but the server did not return student details.'
        );
      }

      // -------------------------------------------------------
      // 8. Success
      // -------------------------------------------------------

      console.log(
        '[Create Student] SUCCESS:',
        data
      );

      setSuccessData(data as SuccessData);
    } catch (err: unknown) {
      console.error(
        '[Create Student] ERROR:',
        err
      );

      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(
          'An unexpected error occurred during student creation.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-12">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-md overflow-hidden border border-gray-200 p-8">

        {/* Header */}
        <div className="flex justify-between items-center mb-8 border-b pb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Add New Student (Offline Admission)
            </h1>

            <p className="text-sm text-gray-500">
              Create student profile, record initial fee, and provision login credentials.
            </p>
          </div>

          <button
            type="button"
            onClick={() => router.back()}
            className="text-sm px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition"
          >
            ← Back
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            <div className="font-semibold mb-1">
              Student Creation Failed
            </div>

            <div>{error}</div>
          </div>
        )}

       {/* Success Message */}
{successData && (
  <div className="mb-8 p-6 bg-emerald-50 border border-emerald-200 rounded-lg">

    <h3 className="text-lg font-bold text-emerald-800 mb-2">
      🎉 Student Account Created!
    </h3>

    <p className="text-sm text-emerald-700 mb-4">
      {successData.message}
    </p>

    <div className="bg-white p-4 rounded border border-emerald-200 text-sm text-gray-900 space-y-2 shadow-sm">

      <div>
        <strong className="text-gray-900 font-semibold">Student ID:</strong>{' '}
        <span className="text-gray-900">{successData.student.studentId}</span>
      </div>

      <div>
        <strong className="text-gray-900 font-semibold">Login Email / Mobile:</strong>{' '}
        <span className="text-gray-900">{successData.student.loginEmail}</span>
      </div>

      <div>
        <strong className="text-gray-900 font-semibold">Default Password:</strong>{' '}
        <span className="text-gray-900 font-mono bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">{successData.student.defaultPassword}</span>
      </div>

    </div>
  </div>
)}
        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="space-y-8"
        >

          {/* Section 1 */}
          <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-4 pb-1 border-b">
              1. Personal Details
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              {/* Name */}
             <div>
  <label className="block text-xs font-semibold text-gray-600 mb-1">
    Full Name *
  </label>

  <input
    type="text"
    name="name"
    required
    value={formData.name}
    onChange={handleChange}
    placeholder="e.g. Rahul Sharma"
    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 bg-white placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
  />
</div>

             {/* Mobile */}
<div>
  <label className="block text-xs font-semibold text-gray-600 mb-1">
    Mobile Number *
  </label>

  <input
    type="tel"
    name="mobile"
    required
    value={formData.mobile}
    onChange={handleChange}
    placeholder="9876543210"
    inputMode="numeric"
    className="w-full px-3 py-2 border border-gray-300 bg-white text-gray-900 placeholder-gray-400 rounded-md text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
  />
</div>

{/* Email */}
<div>
  <label className="block text-xs font-semibold text-gray-600 mb-1">
    Email (Optional)
  </label>

  <input
    type="email"
    name="email"
    value={formData.email}
    onChange={handleChange}
    placeholder="rahul@example.com"
    className="w-full px-3 py-2 border border-gray-300 bg-white text-gray-900 placeholder-gray-400 rounded-md text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
  />
</div>

{/* DOB */}
<div>
  <label className="block text-xs font-semibold text-gray-600 mb-1">
    Date of Birth
  </label>

  <input
    type="date"
    name="dob"
    value={formData.dob}
    onChange={handleChange}
    className="w-full px-3 py-2 border border-gray-300 bg-white text-gray-900 rounded-md text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
  />
</div>

{/* Gender */}
<div>
  <label className="block text-xs font-semibold text-gray-600 mb-1">
    Gender
  </label>

  <select
    name="gender"
    value={formData.gender}
    onChange={handleChange}
    className="w-full px-3 py-2 border border-gray-300 bg-white text-gray-900 rounded-md text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
  >
    <option value="male">Male</option>
    <option value="female">Female</option>
    <option value="other">Other</option>
  </select>
</div>

{/* Parent */}
<div>
  <label className="block text-xs font-semibold text-gray-600 mb-1">
    Parent / Guardian Name
  </label>

  <input
    type="text"
    name="parentName"
    value={formData.parentName}
    onChange={handleChange}
    placeholder="Parent Name"
    className="w-full px-3 py-2 border border-gray-300 bg-white text-gray-900 placeholder-gray-400 rounded-md text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
  />
</div>

{/* Parent Mobile */}
<div>
  <label className="block text-xs font-semibold text-gray-600 mb-1">
    Parent Mobile
  </label>

  <input
    type="tel"
    name="parentMobile"
    value={formData.parentMobile}
    onChange={handleChange}
    placeholder="Parent Contact"
    inputMode="numeric"
    className="w-full px-3 py-2 border border-gray-300 bg-white text-gray-900 placeholder-gray-400 rounded-md text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
  />
</div>

{/* Address */}
<div className="md:col-span-2">
  <label className="block text-xs font-semibold text-gray-600 mb-1">
    Address
  </label>

  <textarea
    name="address"
    rows={2}
    value={formData.address}
    onChange={handleChange}
    placeholder="Complete Address"
    className="w-full px-3 py-2 border border-gray-300 bg-white text-gray-900 placeholder-gray-400 rounded-md text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
  />
</div>

</div>
</div>

{/* Section 2 */}
<div>
  <h2 className="text-lg font-semibold text-gray-800 mb-4 pb-1 border-b">
    2. Academic Information
  </h2>

  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

    {/* Class */}
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1">
        Class *
      </label>

      <select
        name="academicClass"
        value={formData.academicClass}
        onChange={handleChange}
        required
        className="w-full px-3 py-2 border border-gray-300 bg-white text-gray-900 rounded-md text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
      >
        <option value="Class 6">Class 6</option>
        <option value="Class 7">Class 7</option>
        <option value="Class 8">Class 8</option>
        <option value="Class 9">Class 9</option>
        <option value="Class 10">Class 10</option>
        <option value="Class 11">Class 11</option>
        <option value="Class 12">Class 12</option>
      </select>
    </div>

    {/* Course */}
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1">
        Course Code *
      </label>

      <input
        type="text"
        name="courseId"
        required
        value={formData.courseId}
        onChange={handleChange}
        className="w-full px-3 py-2 border border-gray-300 bg-white text-gray-900 placeholder-gray-400 rounded-md text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
      />
    </div>

    {/* Batch */}
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1">
        Batch Code *
      </label>

      <input
        type="text"
        name="batchId"
        required
        value={formData.batchId}
        onChange={handleChange}
        className="w-full px-3 py-2 border border-gray-300 bg-white text-gray-900 placeholder-gray-400 rounded-md text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
      />
    </div>

  </div>
</div>

{/* Section 3 */}
<div>
  <h2 className="text-lg font-semibold text-gray-800 mb-4 pb-1 border-b">
    3. Fee & Payment Information
  </h2>

  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

    {/* Total Fee */}
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1">
        Total Course Fee (₹)
      </label>

      <input
        type="number"
        name="totalFee"
        min="0"
        value={formData.totalFee}
        onChange={handleChange}
        className="w-full px-3 py-2 border border-gray-300 bg-white text-gray-900 placeholder-gray-400 rounded-md text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
      />
    </div>

    {/* Amount Paid */}
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1">
        Amount Paid Now (₹)
      </label>

      <input
        type="number"
        name="registrationFeePaid"
        min="0"
        value={formData.registrationFeePaid}
        onChange={handleChange}
        className="w-full px-3 py-2 border border-gray-300 bg-white text-gray-900 placeholder-gray-400 rounded-md text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
      />
    </div>

    {/* Payment Method */}
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1">
        Payment Method
      </label>

      <select
        name="paymentMethod"
        value={formData.paymentMethod}
        onChange={handleChange}
        className="w-full px-3 py-2 border border-gray-300 bg-white text-gray-900 rounded-md text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
      >
        <option value="cash">Cash</option>
        <option value="upi">UPI</option>
        <option value="bank_transfer">
          Bank Transfer
        </option>
        <option value="online">Online</option>
      </select>
    </div>

    {/* Transaction ID */}
    <div className="md:col-span-3">
      <label className="block text-xs font-semibold text-gray-600 mb-1">
        Transaction ID / Notes
      </label>

      <input
        type="text"
        name="transactionId"
        value={formData.transactionId}
        onChange={handleChange}
        placeholder="UPI Txn Ref / Receipt Notes"
        className="w-full px-3 py-2 border border-gray-300 bg-white text-gray-900 placeholder-gray-400 rounded-md text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
      />
    </div>

  </div>
</div>

{/* Submit */}
<div className="pt-4 border-t flex justify-end gap-3">

  <button
    type="button"
    onClick={() => router.back()}
    disabled={loading}
    className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition disabled:opacity-50"
  >
    Cancel
  </button>

  <button
    type="submit"
    disabled={loading}
    className="px-8 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition shadow-md disabled:opacity-50"
  >
    {loading
      ? 'Creating Account & Registering...'
      : 'Save & Provision Account'}
  </button>

</div>

</form>
</div>
</div>
);
}

