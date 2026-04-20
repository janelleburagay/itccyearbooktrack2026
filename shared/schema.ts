import { z } from "zod";

// ─── Student ─────────────────────────────────────────────────────────────────
export const insertStudentSchema = z.object({
  studentId: z.string().min(1),
  name: z.string().min(1),
  section: z.string().min(1),
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
  id: string; // Firestore document ID
};
