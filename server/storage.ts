import {
  collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc,
  query, where, orderBy, limit, writeBatch
} from "firebase/firestore";
import { db } from "./firebase";
import type { Student, InsertStudent } from "@shared/schema";

const STUDENTS = "students";
const ADMINS = "admins";

// ─── Seed on startup ──────────────────────────────────────────────────────────
async function seedIfEmpty() {
  try {
    const snap = await getDocs(query(collection(db, STUDENTS), limit(1)));
    if (!snap.empty) return;

    const demos = [
      { studentId: "2024-001", name: "Maria Santos", section: "Grade 12 - STEM A", email: "maria@school.edu", totalPrice: 600, amountPaid: 600, photoStatus: "completed", photoScheduledDate: null, claimStatus: "ready", claimedAt: null, notes: null },
      { studentId: "2024-002", name: "Juan dela Cruz", section: "Grade 12 - STEM A", email: "juan@school.edu", totalPrice: 600, amountPaid: 300, photoStatus: "completed", photoScheduledDate: null, claimStatus: "unavailable", claimedAt: null, notes: null },
      { studentId: "2024-003", name: "Ana Reyes", section: "Grade 12 - ABM B", email: "ana@school.edu", totalPrice: 600, amountPaid: 600, photoStatus: "scheduled", photoScheduledDate: "2024-03-15", claimStatus: "unavailable", claimedAt: null, notes: null },
      { studentId: "2024-004", name: "Carlo Mendoza", section: "Grade 12 - HUMSS C", email: "carlo@school.edu", totalPrice: 600, amountPaid: 0, photoStatus: "pending", photoScheduledDate: null, claimStatus: "unavailable", claimedAt: null, notes: null },
      { studentId: "2024-005", name: "Sofia Lim", section: "Grade 12 - ABM B", email: "sofia@school.edu", totalPrice: 600, amountPaid: 600, photoStatus: "completed", photoScheduledDate: null, claimStatus: "claimed", claimedAt: "2024-04-10", notes: null },
      { studentId: "2024-006", name: "Miguel Torres", section: "Grade 12 - STEM B", email: "miguel@school.edu", totalPrice: 600, amountPaid: 450, photoStatus: "pending", photoScheduledDate: null, claimStatus: "unavailable", claimedAt: null, notes: null },
    ];

    for (const d of demos) {
      await addDoc(collection(db, STUDENTS), d);
    }
    console.log("Seeded demo students to Firestore");
  } catch (e) {
    console.error("Seed error:", e);
  }
}

async function seedAdmin() {
  try {
    const snap = await getDocs(query(collection(db, ADMINS), where("username", "==", "admin"), limit(1)));
    if (!snap.empty) return;
    await addDoc(collection(db, ADMINS), { username: "admin", password: "yearbook2024", displayName: "Yearbook Staff" });
    console.log("Seeded admin to Firestore");
  } catch (e) {
    console.error("Admin seed error:", e);
  }
}

seedIfEmpty();
seedAdmin();

// ─── Helper ───────────────────────────────────────────────────────────────────
function docToStudent(docSnap: any): Student {
  const d = docSnap.data();
  return {
    id: docSnap.id,
    studentId: d.studentId,
    name: d.name,
    section: d.section,
    email: d.email ?? null,
    totalPrice: d.totalPrice,
    amountPaid: d.amountPaid,
    photoStatus: d.photoStatus,
    photoScheduledDate: d.photoScheduledDate ?? null,
    claimStatus: d.claimStatus,
    claimedAt: d.claimedAt ?? null,
    notes: d.notes ?? null,
  };
}

export interface IStorage {
  getStudentByStudentId(studentId: string): Promise<Student | undefined>;
  getAllStudents(): Promise<Student[]>;
  searchStudents(query: string): Promise<Student[]>;
  createStudent(data: InsertStudent): Promise<Student>;
  updateStudent(id: string, data: Partial<InsertStudent>): Promise<Student | undefined>;
  deleteStudent(id: string): Promise<void>;
  getAdminByUsername(username: string): Promise<{ displayName: string; password: string } | undefined>;
}

export class Storage implements IStorage {
  async getStudentByStudentId(studentId: string) {
    const q = query(collection(db, STUDENTS), where("studentId", "==", studentId), limit(1));
    const snap = await getDocs(q);
    if (snap.empty) return undefined;
    return docToStudent(snap.docs[0]);
  }

  async getAllStudents() {
    const snap = await getDocs(collection(db, STUDENTS));
    return snap.docs.map(docToStudent).sort((a, b) => a.studentId.localeCompare(b.studentId));
  }

  async searchStudents(queryStr: string) {
    const snap = await getDocs(collection(db, STUDENTS));
    const q = queryStr.toLowerCase();
    return snap.docs
      .map(docToStudent)
      .filter(s =>
        s.name.toLowerCase().includes(q) ||
        s.studentId.toLowerCase().includes(q) ||
        s.section.toLowerCase().includes(q)
      );
  }

  async createStudent(data: InsertStudent) {
    const ref = await addDoc(collection(db, STUDENTS), data);
    const snap = await getDoc(ref);
    return docToStudent(snap);
  }

  async updateStudent(id: string, data: Partial<InsertStudent>) {
    const ref = doc(db, STUDENTS, id);
    // Remove undefined values
    const clean = Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined));
    await updateDoc(ref, clean);
    const snap = await getDoc(ref);
    if (!snap.exists()) return undefined;
    return docToStudent(snap);
  }

  async deleteStudent(id: string) {
    await deleteDoc(doc(db, STUDENTS, id));
  }

  async getAdminByUsername(username: string) {
    const q = query(collection(db, ADMINS), where("username", "==", username), limit(1));
    const snap = await getDocs(q);
    if (snap.empty) return undefined;
    const d = snap.docs[0].data();
    return { displayName: d.displayName, password: d.password };
  }
}

export const storage = new Storage();
