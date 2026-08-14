import { z } from 'zod';

export const AccountDetailsSchema = z
  .object({
    fullName: z.string().min(2, 'Full name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    mobile: z
      .string()
      .regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(8, 'Confirm password is required'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const PersonalDetailsSchema = z.object({
  fatherName: z.string().min(2, "Father's name is required"),
  motherName: z.string().min(2, "Mother's name is required"),
  dob: z.string().min(1, 'Date of birth is required'),
  gender: z.enum(['Male', 'Female', 'Other'], {
    errorMap: () => ({ message: 'Select a valid gender' }),
  }),
  bloodGroup: z.string().optional(), // Now fully optional
  nationality: z.string().min(1, 'Nationality is required'),
  category: z.enum(['General', 'OBC', 'SC/ST', 'EWS'], {
    errorMap: () => ({ message: 'Select a valid category' }),
  }),
  city: z.string().min(2, 'City must be at least 2 characters'),
  state: z.string().min(2, 'State must be at least 2 characters'),
  pinCode: z.string().regex(/^\d{6}$/, 'PIN Code must be exactly 6 digits'),
  address: z.string().min(5, 'Full address must be at least 5 characters'),
});

export const AcademicDetailsSchema = z.object({
  currentClass: z.string().min(1, 'Current Class or Program Level is required'),
  previousSchool: z.string().min(2, 'Previous Institution is required'),
  board: z.string().min(1, 'Education Board is required'),
  percentage: z.string().min(1, 'Percentage or Grade is required'),
  passingYear: z.string().regex(/^\d{4}$/, 'Passing year must be a 4-digit year'),
});

export const ProgramBatchSchema = z.object({
  programId: z.string().min(1, 'Please select a program'),
  batch: z.enum(['Morning', 'Afternoon', 'Evening'], {
    errorMap: () => ({ message: 'Please select a preferred batch' }),
  }),
});

export const TextSignatureSchema = z.object({
  digitalSignature: z
    .string()
    .min(2, 'Please type your full legal name as digital signature'),
  declarationAccepted: z.literal(true, {
    errorMap: () => ({ message: 'You must accept the declaration to proceed' }),
  }),
});

export type AccountDetails = z.infer<typeof AccountDetailsSchema>;
export type PersonalDetails = z.infer<typeof PersonalDetailsSchema>;
export type AcademicDetails = z.infer<typeof AcademicDetailsSchema>;
export type ProgramBatchDetails = z.infer<typeof ProgramBatchSchema>;
export type TextSignatureDetails = z.infer<typeof TextSignatureSchema>;