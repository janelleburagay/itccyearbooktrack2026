import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { insertStudentSchema, insertSubscriberSchema } from "@shared/schema";
import { z } from "zod";

export function registerRoutes(httpServer: Server, app: Express) {

  // ── Admin login ─────────────────────────────────────────────────────────────
  app.post("/api/admin/login", async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: "Missing credentials" });
    try {
      const admin = await storage.getAdminByUsername(username);
      if (!admin || admin.password !== password) return res.status(401).json({ error: "Invalid username or password" });
      res.json({ success: true, displayName: admin.displayName });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // ── Admin: students CRUD ────────────────────────────────────────────────────
  app.get("/api/admin/students", async (req, res) => {
    try {
      const q = req.query.q as string | undefined;
      res.json(q ? await storage.searchStudents(q) : await storage.getAllStudents());
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.post("/api/admin/students", async (req, res) => {
    const parsed = insertStudentSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
    try { res.status(201).json(await storage.createStudent(parsed.data)); }
    catch (e: any) { res.status(400).json({ error: e.message }); }
  });

  app.patch("/api/admin/students/:id", async (req, res) => {
    const partial = insertStudentSchema.partial().safeParse(req.body);
    if (!partial.success) return res.status(400).json({ error: partial.error.flatten() });
    try {
      const updated = await storage.updateStudent(req.params.id, partial.data);
      if (!updated) return res.status(404).json({ error: "Not found" });
      res.json(updated);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.delete("/api/admin/students/:id", async (req, res) => {
    try { await storage.deleteStudent(req.params.id); res.json({ success: true }); }
    catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // ── Admin: receipts ─────────────────────────────────────────────────────────
  app.get("/api/admin/receipts", async (req, res) => {
    try { res.json(await storage.getAllReceipts()); }
    catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.patch("/api/admin/receipts/:id", async (req, res) => {
    const schema = z.object({
      verifiedStatus: z.enum(["pending", "partial", "fully_paid", "rejected"]),
      verifiedNote: z.string().nullable().optional(),
      amountVerified: z.number().nullable().optional(),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
    try {
      const updated = await storage.updateReceipt(req.params.id, {
        verifiedStatus: parsed.data.verifiedStatus,
        verifiedNote: parsed.data.verifiedNote ?? null,
        amountVerified: parsed.data.amountVerified ?? null,
      });
      // Also update student amountPaid when verified
      if (updated && (parsed.data.verifiedStatus === "partial" || parsed.data.verifiedStatus === "fully_paid") && parsed.data.amountVerified != null) {
        const student = await storage.getStudentByStudentId(updated.studentId);
        if (student) {
          await storage.updateStudent(student.id, { amountPaid: parsed.data.amountVerified });
        }
      }
      res.json(updated);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // ── Subscriber: signup ──────────────────────────────────────────────────────
  app.post("/api/subscriber/signup", async (req, res) => {
    const parsed = insertSubscriberSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
    try {
      const student = await storage.getStudentByStudentId(parsed.data.studentId);
      if (!student) return res.status(404).json({ error: "Student ID not found in records. Please contact your yearbook coordinator." });
      const existing = await storage.getSubscriberByStudentId(parsed.data.studentId);
      if (existing) return res.status(409).json({ error: "This Student ID is already registered. Please log in instead." });
      const emailExists = await storage.getSubscriberByEmail(parsed.data.email);
      if (emailExists) return res.status(409).json({ error: "This email is already registered." });
      const subscriber = await storage.createSubscriber(parsed.data);
      const displayName = `${subscriber.firstName} ${subscriber.lastName}`;
      res.status(201).json({ id: subscriber.id, name: displayName, firstName: subscriber.firstName, lastName: subscriber.lastName, middleInitial: subscriber.middleInitial, studentId: subscriber.studentId, email: subscriber.email, course: subscriber.course, yearOfGraduation: subscriber.yearOfGraduation });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // ── Subscriber: login ───────────────────────────────────────────────────────
  app.post("/api/subscriber/login", async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Missing credentials" });
    try {
      const subscriber = await storage.getSubscriberByEmail(email);
      if (!subscriber || subscriber.password !== password) return res.status(401).json({ error: "Invalid email or password" });
      const displayName = `${subscriber.firstName} ${subscriber.lastName}`;
      res.json({ id: subscriber.id, name: displayName, firstName: subscriber.firstName, lastName: subscriber.lastName, middleInitial: subscriber.middleInitial, studentId: subscriber.studentId, email: subscriber.email, course: subscriber.course, yearOfGraduation: subscriber.yearOfGraduation });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // ── Subscriber: get own student record ──────────────────────────────────────
  app.get("/api/subscriber/student/:studentId", async (req, res) => {
    try {
      const student = await storage.getStudentByStudentId(req.params.studentId.toUpperCase());
      if (!student) return res.status(404).json({ error: "Student not found" });
      res.json(student);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // ── Subscriber: upload receipt ──────────────────────────────────────────────
  app.post("/api/subscriber/receipts", async (req, res) => {
    const { subscriberId, studentId, studentName, imageBase64, imageType } = req.body;
    if (!subscriberId || !studentId || !imageBase64 || !imageType) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    try {
      const receipt = await storage.createReceipt({
        subscriberId, studentId, studentName: studentName || "",
        imageBase64, imageType, uploadedAt: new Date().toISOString(),
      });
      res.status(201).json(receipt);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // ── Subscriber: get own receipts ─────────────────────────────────────────────
  app.get("/api/subscriber/receipts/:subscriberId", async (req, res) => {
    try { res.json(await storage.getReceiptsBySubscriberId(req.params.subscriberId)); }
    catch (e: any) { res.status(500).json({ error: e.message }); }
  });
}
