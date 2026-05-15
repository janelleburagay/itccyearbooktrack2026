import {
  collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc,
  query, where, orderBy, limit, setDoc
} from "firebase/firestore";
import { db } from "./firebase";
import type { Student, InsertStudent, Subscriber, InsertSubscriber, Receipt, InsertReceipt } from "@shared/schema";

const STUDENTS = "students";
const ADMINS = "admins";
const SUBSCRIBERS = "subscribers";
const RECEIPTS = "receipts";

// ─── Seed on startup ──────────────────────────────────────────────────────────
async function seedIfEmpty() {
  try {
    const snap = await getDocs(query(collection(db, STUDENTS), limit(1)));
    if (!snap.empty) return;
    const demos = [
      { studentId: "20260000001", lastName: "Santos", firstName: "Maria", middleName: "Cruz", middleInitial: "C", college: "College of Computer Studies", course: "Bachelor of Science in Computer Science", yearOfGraduation: "2026", email: "maria@email.com", totalPrice: 600, amountPaid: 0, photoStatus: "completed", photoScheduledDate: null, claimStatus: "ready", claimedAt: null, notes: null },
      { studentId: "20260000002", lastName: "dela Cruz", firstName: "Juan", middleName: "Reyes", middleInitial: "R", college: "College of Computer Studies", course: "Bachelor of Science in Information Technology", yearOfGraduation: "2026", email: "juan@email.com", totalPrice: 600, amountPaid: 0, photoStatus: "completed", photoScheduledDate: null, claimStatus: "unavailable", claimedAt: null, notes: null },
      { studentId: "20260000003", lastName: "Reyes", firstName: "Ana", middleName: "Lim", middleInitial: "L", college: "College of Computer Studies", course: "Bachelor of Science in Information Systems", yearOfGraduation: "2026", email: "ana@email.com", totalPrice: 600, amountPaid: 0, photoStatus: "scheduled", photoScheduledDate: "2026-06-15", claimStatus: "unavailable", claimedAt: null, notes: null },
      { studentId: "20260000004", lastName: "Mendoza", firstName: "Carlo", middleName: null, middleInitial: null, college: "College of Computer Studies", course: "Bachelor of Science in Entertainment and Multimedia Computing", yearOfGraduation: "2027", email: "carlo@email.com", totalPrice: 600, amountPaid: 0, photoStatus: "pending", photoScheduledDate: null, claimStatus: "unavailable", claimedAt: null, notes: null },
      { studentId: "20260000005", lastName: "Lim", firstName: "Sofia", middleName: "Torres", middleInitial: "T", college: "College of Computer Studies", course: "Bachelor of Science in Computer Science", yearOfGraduation: "2026", email: "sofia@email.com", totalPrice: 600, amountPaid: 0, photoStatus: "completed", photoScheduledDate: null, claimStatus: "claimed", claimedAt: "2026-04-10", notes: null },
      { studentId: "20260000006", lastName: "Torres", firstName: "Miguel", middleName: "Garcia", middleInitial: "G", college: "College of Computer Studies", course: "Bachelor of Science in Information Technology", yearOfGraduation: "2027", email: "miguel@email.com", totalPrice: 600, amountPaid: 0, photoStatus: "pending", photoScheduledDate: null, claimStatus: "unavailable", claimedAt: null, notes: null },
    ];
    for (const d of demos) await addDoc(collection(db, STUDENTS), d);
    console.log("Seeded demo students");
  } catch (e) { console.error("Seed error:", e); }
}

async function seedAdmin() {
  try {
    const snap = await getDocs(query(collection(db, ADMINS), where("username", "==", "admin"), limit(1)));
    if (!snap.empty) return;
    await addDoc(collection(db, ADMINS), { username: "admin", password: "yearbook2024", displayName: "Yearbook Staff" });
    console.log("Seeded admin");
  } catch (e) { console.error("Admin seed error:", e); }
}

seedIfEmpty();
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
    college: data.college ?? "College of Computer Studies",
    course: data.course ?? "Bachelor of Science in Information Technology",
    yearOfGraduation: data.yearOfGraduation ?? "2026",
    email: data.email ?? null,
    totalPrice: data.totalPrice,
    amountPaid: data.amountPaid,
    photoStatus: data.photoStatus,
    photoScheduledDate: data.photoScheduledDate ?? null,
    claimStatus: data.claimStatus,
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
    college: data.college ?? "College of Computer Studies",
    course: data.course ?? "Bachelor of Science in Information Technology",
    yearOfGraduation: data.yearOfGraduation ?? "2026",
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
    return snap.docs.map(docToStudent).filter(s => s.name.toLowerCase().includes(lq) || s.studentId.toLowerCase().includes(lq) || s.section.toLowerCase().includes(lq));
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

  // ── Subscribers ─────────────────────────────────────────────────────────────
  async getSubscriberByEmail(email: string): Promise<Subscriber | undefined> {
    const snap = await getDocs(query(collection(db, SUBSCRIBERS), where("email", "==", email), limit(1)));
    return snap.empty ? undefined : docToSubscriber(snap.docs[0]);
  }
  async getSubscriberByStudentId(studentId: string): Promise<Subscriber | undefined> {
    const snap = await getDocs(query(collection(db, SUBSCRIBERS), where("studentId", "==", studentId), limit(1)));
    return snap.empty ? undefined : docToSubscriber(snap.docs[0]);
  }
  async createSubscriber(data: InsertSubscriber): Promise<Subscriber> {
    const payload = { ...data, createdAt: new Date().toISOString() };
    const ref = await addDoc(collection(db, SUBSCRIBERS), payload);
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
