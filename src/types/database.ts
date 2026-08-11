// types/database.ts

export type UserRole = 'admin' | 'teacher' | 'student' | 'parent' | 'counsellor';

export type AccountStatus = 'active' | 'inactive' | 'suspended';

export interface UserDocument {
  uid: string;
  email: string | null;
  mobile: string;
  role: UserRole;
  status: AccountStatus;
  createdAt: string;
  updatedAt: string;
}

export interface StudentDocument {
  studentId: string;
  uid: string;
  name: string;
  mobile: string;
  email?: string;
  dob: string;
  gender: 'male' | 'female' | 'other';
  parentName: string;
  parentMobile: string;
  address: string;
  profilePhotoUrl?: string;
  academicClass: string;
  status: AccountStatus;
  createdAt: string;
  updatedAt: string;
}

export type AdmissionSource = 'online' | 'offline';
export type AdmissionStatus = 'pending_payment' | 'pending_approval' | 'approved' | 'rejected' | 'cancelled';

export interface AdmissionDocument {
  admissionId: string;
  studentId: string;
  source: AdmissionSource;
  courseId: string;
  batchId: string;
  admissionDate: string;
  status: AdmissionStatus;
  totalFee: number;
  registrationFeePaid: number;
  approvedBy?: string;
  approvedAt?: string;
  remarks?: string;
  createdAt: string;
}

export type EnrollmentStatus = 'active' | 'completed' | 'paused' | 'cancelled';

export interface EnrollmentDocument {
  enrollmentId: string;
  studentId: string;
  courseId: string;
  batchId: string;
  admissionId: string;
  status: EnrollmentStatus;
  startDate: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
}

export type PaymentMethod = 'online' | 'upi' | 'cash' | 'bank_transfer';
export type PaymentStatus = 'completed' | 'pending' | 'failed' | 'refunded';

export interface PaymentDocument {
  paymentId: string;
  studentId: string;
  enrollmentId: string;
  admissionId?: string;
  amount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  paymentDate: string;
  transactionId?: string;
  receiptNumber: string;
  recordedBy: string;
  notes?: string;
  createdAt: string;
}

export interface CourseDocument {
  courseId: string;
  title: string;
  code: string;
  description: string;
  academicClass: string;
  isActive: boolean;
  totalFee: number;
  createdAt: string;
  updatedAt: string;
}

export interface BatchDocument {
  batchId: string;
  courseId: string;
  name: string;
  startDate: string;
  endDate?: string;
  maxCapacity: number;
  currentEnrollmentCount: number;
  isActive: boolean;
  createdAt: string;
}