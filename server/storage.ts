import {
  collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc,
  query, where, orderBy, limit, setDoc
} from "firebase/firestore";
import { db } from "./firebase";
import type { Student, InsertStudent, Subscriber, InsertSubscriber, Receipt, InsertReceipt } from "@shared/schema";

const STUDENTS = "students";
const ADMINS = "admins";
const RECEIPTS = "receipts";

// ─── Seed on startup ──────────────────────────────────────────────────────────
async function seedAdmin() {
  try {
    const snap = await getDocs(query(collection(db, ADMINS), where("username", "==", "admin"), limit(1)));
    if (!snap.empty) return;
    await addDoc(collection(db, ADMINS), { username: "admin", password: "yearbook2024", displayName: "Yearbook Staff" });
    console.log("Seeded admin");
  } catch (e) { console.error("Admin seed error:", e); }
}

seedAdmin();

// ─── Helpers ──────────────────────────────────────────────────────────────────
function docToStudent(d: any): Student {
  const data = d.data();
  return {
    id: d.id,
    studentId: data.studentId,
    lastName: data.lastName ?? data.name ?? "",
    firstName: data.firstName ?? "",
    middleName: data.middleName ?? null,
    middleInitial: data.middleInitial ?? null,
    college: data.college ?? "",
    course: data.course ?? "",
    yearOfGraduation: data.yearOfGraduation ?? "",
    email: data.email ?? null,
    totalPrice: data.totalPrice ?? 600,
    amountPaid: data.amountPaid ?? 0,
    photoStatus: data.photoStatus ?? "pending",
    photoScheduledDate: data.photoScheduledDate ?? null,
    claimStatus: data.claimStatus ?? "unavailable",
    claimedAt: data.claimedAt ?? null,
    notes: data.notes ?? null,
  };
}

function docToSubscriber(d: any): Subscriber {
  const data = d.data();
  return {
    id: d.id,
    studentId: data.studentId,
    lastName: data.lastName ?? "",
    firstName: data.firstName ?? "",
    middleName: data.middleName ?? null,
    middleInitial: data.middleInitial ?? null,
    college: data.college ?? "",
    course: data.course ?? "",
    yearOfGraduation: data.yearOfGraduation ?? "",
    email: data.email,
    password: data.password,
    createdAt: data.createdAt,
  };
}

function docToReceipt(d: any): Receipt {
  const data = d.data();
  return { id: d.id, subscriberId: data.subscriberId, studentId: data.studentId, studentName: data.studentName, imageBase64: data.imageBase64, imageType: data.imageType, uploadedAt: data.uploadedAt, verifiedStatus: data.verifiedStatus ?? "pending", verifiedAt: data.verifiedAt ?? null, verifiedNote: data.verifiedNote ?? null, amountVerified: data.amountVerified ?? null };
}

export class Storage {
  // ── Students ────────────────────────────────────────────────────────────────
  async getStudentByStudentId(studentId: string): Promise<Student | undefined> {
    const snap = await getDocs(query(collection(db, STUDENTS), where("studentId", "==", studentId), limit(1)));
    return snap.empty ? undefined : docToStudent(snap.docs[0]);
  }
  async getAllStudents(): Promise<Student[]> {
    const snap = await getDocs(collection(db, STUDENTS));
    return snap.docs.map(docToStudent).sort((a, b) => a.studentId.localeCompare(b.studentId));
  }
  async searchStudents(q: string): Promise<Student[]> {
    const snap = await getDocs(collection(db, STUDENTS));
    const lq = q.toLowerCase();
    return snap.docs.map(docToStudent).filter(s =>
      `${s.firstName} ${s.lastName}`.toLowerCase().includes(lq) ||
      s.studentId.toLowerCase().includes(lq) ||
      (s.course ?? "").toLowerCase().includes(lq)
    );
  }
  async createStudent(data: InsertStudent): Promise<Student> {
    const ref = await addDoc(collection(db, STUDENTS), data);
    return docToStudent(await getDoc(ref));
  }
  async updateStudent(id: string, data: Partial<InsertStudent>): Promise<Student | undefined> {
    const ref = doc(db, STUDENTS, id);
    const clean = Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined));
    await updateDoc(ref, clean);
    const snap = await getDoc(ref);
    return snap.exists() ? docToStudent(snap) : undefined;
  }
  async deleteStudent(id: string): Promise<void> {
    await deleteDoc(doc(db, STUDENTS, id));
  }

  // ── Admin ───────────────────────────────────────────────────────────────────
  async getAdminByUsername(username: string): Promise<{ displayName: string; password: string } | undefined> {
    const snap = await getDocs(query(collection(db, ADMINS), where("username", "==", username), limit(1)));
    if (snap.empty) return undefined;
    const d = snap.docs[0].data();
    return { displayName: d.displayName, password: d.password };
  }

  // ── Subscribers (stored in students collection) ──────────────────────────────
  async getSubscriberByEmail(email: string): Promise<Subscriber | undefined> {
    // Only return docs that have a password field (i.e. registered accounts)
    const snap = await getDocs(query(collection(db, STUDENTS), where("email", "==", email), limit(1)));
    if (snap.empty) return undefined;
    const data = snap.docs[0].data();
    if (!data.password) return undefined;
    return docToSubscriber(snap.docs[0]);
  }
  async getSubscriberByStudentId(studentId: string): Promise<Subscriber | undefined> {
    const snap = await getDocs(query(collection(db, STUDENTS), where("studentId", "==", studentId), limit(1)));
    if (snap.empty) return undefined;
    const data = snap.docs[0].data();
    if (!data.password) return undefined;
    return docToSubscriber(snap.docs[0]);
  }
  async createSubscriber(data: InsertSubscriber): Promise<Subscriber> {
    // Check if student record already exists — if so, just add auth fields
    const existing = await getDocs(query(collection(db, STUDENTS), where("studentId", "==", data.studentId), limit(1)));
    if (!existing.empty) {
      const ref = existing.docs[0].ref;
      await updateDoc(ref, {
        password: data.password,
        email: data.email,
        lastName: data.lastName,
        firstName: data.firstName,
        middleName: data.middleName ?? null,
        college: data.college,
        course: data.course,
        yearOfGraduation: data.yearOfGraduation,
        createdAt: new Date().toISOString(),
      });
      const snap = await getDoc(ref);
      return docToSubscriber(snap);
    }
    // No existing record — create a full new student+subscriber document
    const payload = {
      studentId: data.studentId,
      lastName: data.lastName,
      firstName: data.firstName,
      middleName: data.middleName ?? null,
      middleInitial: null,
      college: data.college,
      course: data.course,
      yearOfGraduation: data.yearOfGraduation,
      email: data.email,
      password: data.password,
      totalPrice: 600,
      amountPaid: 0,
      photoStatus: "pending",
      photoScheduledDate: null,
      claimStatus: "unavailable",
      claimedAt: null,
      notes: null,
      createdAt: new Date().toISOString(),
    };
    const ref = await addDoc(collection(db, STUDENTS), payload);
    return docToSubscriber(await getDoc(ref));
  }

  // ── Receipts ────────────────────────────────────────────────────────────────
  async createReceipt(data: InsertReceipt): Promise<Receipt> {
    const payload = { ...data, verifiedStatus: "pending", verifiedAt: null, verifiedNote: null, amountVerified: null };
    const ref = await addDoc(collection(db, RECEIPTS), payload);
    return docToReceipt(await getDoc(ref));
  }
  async getReceiptsBySubscriberId(subscriberId: string): Promise<Receipt[]> {
    const snap = await getDocs(query(collection(db, RECEIPTS), where("subscriberId", "==", subscriberId)));
    return snap.docs.map(docToReceipt).sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
  }
  async getAllReceipts(): Promise<Receipt[]> {
    const snap = await getDocs(collection(db, RECEIPTS));
    return snap.docs.map(docToReceipt).sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
  }
  async updateReceipt(id: string, data: { verifiedStatus: string; verifiedNote: string | null; amountVerified: number | null }): Promise<Receipt | undefined> {
    const ref = doc(db, RECEIPTS, id);
    await updateDoc(ref, { ...data, verifiedAt: new Date().toISOString() });
    const snap = await getDoc(ref);
    return snap.exists() ? docToReceipt(snap) : undefined;
  }
}

export const storage = new Storage();
