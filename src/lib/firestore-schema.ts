export interface StudentRecord {
  uid: string;
  applicationNo: string;
  studentId?: string;
  fullName: string;
  email: string;
  mobile: string;
  fatherName: string;
  motherName: string;
  dob: string;
  gender: 'Male' | 'Female' | 'Other';
  bloodGroup: string;
  nationality: string;
  category: string;
  address: {
    street: string;
    city: string;
    state: string;
    pinCode: string;
  };
  academic: {
    currentClass: string;
    previousSchool: string;
    board: string;
    percentageGrade: string;
    passingYear: string;
  };
  enrollment: {
    programId: string;
    programTitle: string;
    batchTiming: 'Morning' | 'Afternoon' | 'Evening';
    startDate: string;
  };
  documents: {
    photoUrl?: string;
    idProofUrl?: string;
    marksheetUrl?: string;
    signatureUrl?: string;
  };
  feeStructure: {
    registrationFee: number;
    courseFee: number;
    discount: number;
    scholarship: number;
    totalAmount: number;
    amountPaid: number;
    outstandingBalance: number;
  };
  status: 'Pending' | 'Approved' | 'Rejected';
  createdAt: string;
}

export interface PaymentTransaction {
  transactionId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  studentUid: string;
  applicationNo: string;
  amount: number;
  paymentMethod: string;
  status: 'Success' | 'Failed';
  timestamp: string;
}