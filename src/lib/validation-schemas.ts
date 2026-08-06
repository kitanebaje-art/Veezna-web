import { z } from 'zod';

export const AccountSchema = z.object({
  fullName: z.string().min(2, 'Full Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  mobile: z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export const PersonalDetailsSchema = z.object({
  fatherName: z.string().min(2, "Father's Name is required"),
  motherName: z.string().min(2, "Mother's Name is required"),
  dob: z.string().min(1, 'Date of Birth is required'),
  gender: z.enum(['Male', 'Female', 'Other']),
  bloodGroup: z.string().min(1, 'Blood Group is required'),
  nationality: z.string().min(1, 'Nationality is required'),
  category: z.string().min(1, 'Category selection is required'),
  addressStreet: z.string().min(5, 'Address is required'),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  pinCode: z.string().regex(/^\d{6}$/, 'Enter a valid 6-digit PIN code'),
});

export const AcademicDetailsSchema = z.object({
  currentClass: z.string().min(1, 'Target Class / Program selection is required'),
  previousSchool: z.string().min(2, 'Previous School name is required'),
  board: z.string().min(1, 'Education Board is required'),
  percentageGrade: z.string().min(1, 'Grade / Percentage is required'),
  passingYear: z.string().regex(/^\d{4}$/, 'Enter a valid 4-digit year'),
});

export type AccountFormData = z.infer<typeof AccountSchema>;
export type PersonalFormData = z.infer<typeof PersonalDetailsSchema>;
export type AcademicFormData = z.infer<typeof AcademicDetailsSchema>;