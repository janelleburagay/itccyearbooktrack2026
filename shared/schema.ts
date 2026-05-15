import { z } from "zod";

export const COURSES = [
  "Bachelor of Science in Computer Science",
  "Bachelor of Science in Information Systems",
  "Bachelor of Science in Information Technology",
  "Bachelor of Science in Entertainment and Multimedia Computing",
] as const;

export const COLLEGES = [
  "College of Computer Studies",
] as const;

// Keep for backward compat
export const COLLEGE = "College of Computer Studies";

export const GRAD_YEARS = ["2026", "2027", "2028", "2029", "2030"] as const;

// ─── Student ─────────────────────────────────────────────────────────────────
export const insertStudentSchema = z.object({
  studentId: z.string().min(1),
  lastName: z.string().min(1),
  firstName: z.string().min(1),
  middleName: z.string().nullable().optional(),
  middleInitial: z.string().nullable().optional(),
  college: z.enum(COLLEGES),
  course: z.enum(COURSES),
  yearOfGraduation: z.string().min(4),
  email: z.string().email().nullable().optional(),
  totalPrice: z.number().min(0).default(600),
  amountPaid: z.number().min(0).default(0),
  photoStatus: z.enum(["pending", "scheduled", "completed"]).default("pending"),
  photoScheduledDate: z.string().nullable().optional(),
  claimStatus: z.enum(["unavailable", "ready", "claimed"]).default("unavailable"),
  claimedAt: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export type InsertStudent = z.infer<typeof insertStudentSchema>;

export type Student = InsertStudent & {
  id: string;
};

// Helper: full name from parts
export function fullName(s: { firstName: string; middleInitial?: string | null; lastName: string }) {
  const mi = s.middleInitial ? ` ${s.middleInitial}.` : "";
  return `${s.firstName}${mi} ${s.lastName}`;
}

// ─── Subscriber Account ───────────────────────────────────────────────────────
export const insertSubscriberSchema = z.object({
  studentId: z.string().min(1, "Student ID is required"),
  lastName: z.string().min(1, "Last name is required"),
  firstName: z.string().min(1, "First name is required"),
  middleName: z.string().nullable().optional(),
  middleInitial: z.string().nullable().optional(),
  college: z.enum(COLLEGES, { errorMap: () => ({ message: "Please select a college" }) }),
  course: z.enum(COURSES, { errorMap: () => ({ message: "Please select a course" }) }),
  yearOfGraduation: z.string().min(4, "Select graduation year"),
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export type InsertSubscriber = z.infer<typeof insertSubscriberSchema>;

export type Subscriber = InsertSubscriber & {
  id: string;
  createdAt: string;
};

// ─── Receipt ──────────────────────────────────────────────────────────────────
export type Receipt = {
  id: string;
  subscriberId: string;
  studentId: string;
  studentName: string;
  imageBase64: string;
  imageType: string;
  uploadedAt: string;
  verifiedStatus: "pending" | "partial" | "fully_paid" | "rejected";
  verifiedAt: string | null;
  verifiedNote: string | null;
  amountVerified: number | null;
};

export type InsertReceipt = Omit<Receipt, "id" | "verifiedAt" | "verifiedNote" | "verifiedStatus" | "amountVerified">;
