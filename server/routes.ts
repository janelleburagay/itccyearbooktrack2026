import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { insertStudentSchema } from "@shared/schema";

export function registerRoutes(httpServer: Server, app: Express) {
  // ─── Student Lookup (public) ──────────────────────────────────────────────
  app.get("/api/student/:studentId", async (req, res) => {
    try {
      const student = await storage.getStudentByStudentId(req.params.studentId.trim().toUpperCase());
      if (!student) return res.status(404).json({ error: "Student not found" });
      res.json(student);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // ─── Admin login ──────────────────────────────────────────────────────────
  app.post("/api/admin/login", async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: "Missing credentials" });
    try {
      const admin = await storage.getAdminByUsername(username);
      if (!admin || admin.password !== password) {
        return res.status(401).json({ error: "Invalid username or password" });
      }
      res.json({ success: true, displayName: admin.displayName });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // ─── Admin: get all students ──────────────────────────────────────────────
  app.get("/api/admin/students", async (req, res) => {
    try {
      const q = req.query.q as string | undefined;
      const list = q ? await storage.searchStudents(q) : await storage.getAllStudents();
      res.json(list);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // ─── Admin: create student ────────────────────────────────────────────────
  app.post("/api/admin/students", async (req, res) => {
    const parsed = insertStudentSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
    try {
      const student = await storage.createStudent(parsed.data);
      res.status(201).json(student);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  // ─── Admin: update student ────────────────────────────────────────────────
  app.patch("/api/admin/students/:id", async (req, res) => {
    const { id } = req.params;
    const partial = insertStudentSchema.partial().safeParse(req.body);
    if (!partial.success) return res.status(400).json({ error: partial.error.flatten() });
    try {
      const updated = await storage.updateStudent(id, partial.data);
      if (!updated) return res.status(404).json({ error: "Student not found" });
      res.json(updated);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // ─── Admin: delete student ────────────────────────────────────────────────
  app.delete("/api/admin/students/:id", async (req, res) => {
    try {
      await storage.deleteStudent(req.params.id);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });
}
