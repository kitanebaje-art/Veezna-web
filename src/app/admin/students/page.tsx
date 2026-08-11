// src/app/admin/students/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, updateDoc, query, orderBy } from 'firebase/firestore';
import type { StudentDocument } from '@/types/database';

export default function AdminStudentsListPage() {
  const [students, setStudents] = useState<StudentDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'students'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const list: StudentDocument[] = [];
      querySnapshot.forEach((docSnap) => {
        list.push(docSnap.data() as StudentDocument);
      });
      setStudents(list);
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleStudentStatus = async (studentId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    try {
      await updateDoc(doc(db, 'students', studentId), {
        status: newStatus,
        updatedAt: new Date().toISOString(),
      });
      setStudents((prev) =>
        prev.map((s) => (s.studentId === studentId ? { ...s, status: newStatus } : s))
      );
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update student status.');
    }
  };

  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.mobile.includes(searchTerm) ||
      s.studentId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClass = selectedClass === 'all' || s.academicClass === selectedClass;
    const matchesStatus = selectedStatus === 'all' || s.status === selectedStatus;

    return matchesSearch && matchesClass && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-12">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-xl shadow-sm border">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Student Directory</h1>
            <p className="text-sm text-gray-500">Manage enrolled online and offline students.</p>
          </div>
          <Link
            href="/admin/students/add"
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm rounded-lg shadow transition flex items-center gap-2"
          >
            <span>+ Add Student</span>
          </Link>
        </div>

        {/* Filters & Search */}
        <div className="bg-white p-4 rounded-xl shadow-sm border grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <input
              type="text"
              placeholder="Search by Name, Mobile, or Student ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>
          <div>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
            >
              <option value="all">All Classes</option>
              <option value="Class 6">Class 6</option>
              <option value="Class 7">Class 7</option>
              <option value="Class 8">Class 8</option>
              <option value="Class 9">Class 9</option>
              <option value="Class 10">Class 10</option>
              <option value="Class 11">Class 11</option>
              <option value="Class 12">Class 12</option>
            </select>
          </div>
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        {/* Students Table */}
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-gray-500 text-sm">Loading students directory...</div>
          ) : filteredStudents.length === 0 ? (
            <div className="p-12 text-center text-gray-500 text-sm">No students found matching filters.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-600 font-semibold border-b">
                  <tr>
                    <th className="p-4">Student ID</th>
                    <th className="p-4">Name</th>
                    <th className="p-4">Mobile</th>
                    <th className="p-4">Class</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Registered</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredStudents.map((student) => (
                    <tr key={student.studentId} className="hover:bg-gray-50">
                      <td className="p-4 font-mono font-medium text-emerald-700">{student.studentId}</td>
                      <td className="p-4 font-semibold text-gray-900">{student.name}</td>
                      <td className="p-4 text-gray-600">{student.mobile}</td>
                      <td className="p-4 text-gray-600">{student.academicClass}</td>
                      <td className="p-4">
                        <span
                          className={`px-2.5 py-1 text-xs rounded-full font-semibold ${
                            student.status === 'active'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {student.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-4 text-gray-500 text-xs">
                        {new Date(student.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-4 text-right space-x-2">
                        <button
                          onClick={() => toggleStudentStatus(student.studentId, student.status)}
                          className={`px-3 py-1 rounded text-xs font-medium transition ${
                            student.status === 'active'
                              ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                              : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                          }`}
                        >
                          {student.status === 'active' ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}