import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import {
  Plus, Search, Pencil, Trash2, X, Loader2, LogOut,
  Users, CreditCard, Camera, BookMarked, CheckCircle2, ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogDescription
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import NavBar from "@/components/NavBar";
import type { Student } from "@shared/schema";

const API = (path: string, opts?: RequestInit) =>
  fetch(path, { headers: { "Content-Type": "application/json" }, ...opts }).then(r => r.json());

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: number; color: string }) {
  return (
    <div className="bg-card border border-border rounded-xl p-5 flex items-center gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

function PayBadge({ s }: { s: Student }) {
  const paid = s.amountPaid >= s.totalPrice;
  const partial = s.amountPaid > 0 && !paid;
  if (paid) return <Badge className="status-paid">Paid</Badge>;
  if (partial) return <Badge className="status-partial">Partial</Badge>;
  return <Badge className="status-unpaid">Unpaid</Badge>;
}

const photoOpts = ["pending", "scheduled", "completed"];
const claimOpts = ["unavailable", "ready", "claimed"];
const photoLabels: Record<string, string> = { pending: "Pending", scheduled: "Scheduled", completed: "Completed" };
const claimLabels: Record<string, string> = { unavailable: "Not Available", ready: "Ready", claimed: "Claimed" };

const emptyForm = {
  studentId: "", name: "", section: "", email: "",
  totalPrice: 600, amountPaid: 0,
  photoStatus: "pending", photoScheduledDate: "",
  claimStatus: "unavailable", claimedAt: "", notes: "",
};

export default function AdminDashboard() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [editStudent, setEditStudent] = useState<Student | null>(null);
  const [form, setForm] = useState({ ...emptyForm });

  // Guard: redirect if not logged in
  useEffect(() => {
    if (!(window as any).__adminSession) navigate("/admin");
  }, []);

  const displayName = (window as any).__adminSession?.displayName || "Admin";

  const { data: students = [], isLoading } = useQuery<Student[]>({
    queryKey: ["/api/admin/students", search],
    queryFn: () => API(`/api/admin/students${search ? `?q=${encodeURIComponent(search)}` : ""}`),
  });

  // Stats
  const totalStudents = students.length;
  const fullyPaid = students.filter(s => s.amountPaid >= s.totalPrice).length;
  const photosDone = students.filter(s => s.photoStatus === "completed").length;
  const readyToClaim = students.filter(s => s.claimStatus === "ready").length;

  const createMutation = useMutation({
    mutationFn: (data: any) => API("/api/admin/students", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/admin/students"] }); setModalOpen(false); toast({ title: "Student added" }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      API(`/api/admin/students/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/admin/students"] }); setModalOpen(false); toast({ title: "Student updated" }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => API(`/api/admin/students/${id}`, { method: "DELETE" }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/admin/students"] }); toast({ title: "Student deleted" }); },
  });

  const openAdd = () => { setEditStudent(null); setForm({ ...emptyForm }); setModalOpen(true); };
  const openEdit = (s: Student) => {
    setEditStudent(s);
    setForm({
      studentId: s.studentId, name: s.name, section: s.section, email: s.email || "",
      totalPrice: s.totalPrice, amountPaid: s.amountPaid,
      photoStatus: s.photoStatus, photoScheduledDate: s.photoScheduledDate || "",
      claimStatus: s.claimStatus, claimedAt: s.claimedAt || "", notes: s.notes || "",
    });
    setModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...form,
      totalPrice: Number(form.totalPrice),
      amountPaid: Number(form.amountPaid),
      photoScheduledDate: form.photoScheduledDate || null,
      claimedAt: form.claimedAt || null,
      email: form.email || null,
      notes: form.notes || null,
    };
    if (editStudent) updateMutation.mutate({ id: editStudent.id, data: payload });
    else createMutation.mutate(payload);
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const logout = () => {
    (window as any).__adminSession = null;
    navigate("/");
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Admin Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md border-b bg-background/90 border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-lg font-bold text-indigo-700 dark:text-indigo-400">YearbookTrack</span>
            <Badge variant="outline" className="text-xs hidden sm:inline-flex">Admin</Badge>
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="hidden sm:inline">Logged in as <strong className="text-foreground">{displayName}</strong></span>
            <Button variant="ghost" size="sm" onClick={logout} className="gap-1.5 text-muted-foreground hover:text-foreground" data-testid="button-logout">
              <LogOut className="w-4 h-4" /> Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 w-full flex-1">
        {/* Page title */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-bold text-foreground">Student Records</h1>
            <p className="text-sm text-muted-foreground">Manage yearbook payments, photos, and claim statuses</p>
          </div>
          <Button onClick={openAdd} className="gap-2 bg-indigo-600 hover:bg-indigo-700" data-testid="button-add-student">
            <Plus className="w-4 h-4" /> Add Student
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard icon={Users} label="Total Students" value={totalStudents} color="bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400" />
          <StatCard icon={CreditCard} label="Fully Paid" value={fullyPaid} color="bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400" />
          <StatCard icon={Camera} label="Photos Done" value={photosDone} color="bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400" />
          <StatCard icon={BookMarked} label="Ready to Claim" value={readyToClaim} color="bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400" />
        </div>

        {/* Search */}
        <div className="relative mb-4 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, ID, or section..."
            className="pl-9"
            data-testid="input-search"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Table */}
        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
          ) : students.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              {search ? "No students match your search." : "No students yet. Add one to get started."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 border-b border-border">
                  <tr>
                    {["Student ID", "Name", "Section", "Balance", "Photo", "Claim Status", "Actions"].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {students.map(s => (
                    <tr key={s.id} className="hover:bg-muted/30 transition-colors" data-testid={`row-student-${s.id}`}>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{s.studentId}</td>
                      <td className="px-4 py-3 font-medium text-foreground whitespace-nowrap">{s.name}</td>
                      <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">{s.section}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          <PayBadge s={s} />
                          <span className="text-xs text-muted-foreground">₱{s.amountPaid}/{s.totalPrice}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={`status-${s.photoStatus}`}>{photoLabels[s.photoStatus]}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={`status-${s.claimStatus}`}>{claimLabels[s.claimStatus]}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-indigo-600" onClick={() => openEdit(s)} data-testid={`button-edit-${s.id}`}>
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-rose-600" onClick={() => setDeleteId(s.id)} data-testid={`button-delete-${s.id}`}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Add/Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editStudent ? "Edit Student" : "Add Student"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Student ID *</Label>
                <Input value={form.studentId} onChange={e => setForm(f => ({ ...f, studentId: e.target.value }))} placeholder="2024-001" required data-testid="input-form-student-id" />
              </div>
              <div className="space-y-1.5">
                <Label>Full Name *</Label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Maria Santos" required data-testid="input-form-name" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Section *</Label>
                <Input value={form.section} onChange={e => setForm(f => ({ ...f, section: e.target.value }))} placeholder="Grade 12 - STEM A" required data-testid="input-form-section" />
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="student@school.edu" type="email" data-testid="input-form-email" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Total Price (₱)</Label>
                <Input value={form.totalPrice} onChange={e => setForm(f => ({ ...f, totalPrice: Number(e.target.value) }))} type="number" min="0" step="0.01" data-testid="input-form-total-price" />
              </div>
              <div className="space-y-1.5">
                <Label>Amount Paid (₱)</Label>
                <Input value={form.amountPaid} onChange={e => setForm(f => ({ ...f, amountPaid: Number(e.target.value) }))} type="number" min="0" step="0.01" data-testid="input-form-amount-paid" />
              </div>
            </div>

            {/* Photo */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Photo Status</Label>
                <Select value={form.photoStatus} onValueChange={v => setForm(f => ({ ...f, photoStatus: v }))}>
                  <SelectTrigger data-testid="select-photo-status"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {photoOpts.map(o => <SelectItem key={o} value={o}>{photoLabels[o]}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Photo Date (if scheduled)</Label>
                <Input value={form.photoScheduledDate} onChange={e => setForm(f => ({ ...f, photoScheduledDate: e.target.value }))} type="date" data-testid="input-form-photo-date" />
              </div>
            </div>

            {/* Claim */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Claim Status</Label>
                <Select value={form.claimStatus} onValueChange={v => setForm(f => ({ ...f, claimStatus: v }))}>
                  <SelectTrigger data-testid="select-claim-status"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {claimOpts.map(o => <SelectItem key={o} value={o}>{claimLabels[o]}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Claimed At</Label>
                <Input value={form.claimedAt} onChange={e => setForm(f => ({ ...f, claimedAt: e.target.value }))} type="date" data-testid="input-form-claimed-at" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Optional notes for this student" data-testid="input-form-notes" />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700" disabled={isSaving} data-testid="button-save-student">
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                {isSaving ? "Saving..." : editStudent ? "Update" : "Add Student"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={deleteId !== null} onOpenChange={open => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete student?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone. The student's record will be permanently deleted.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-rose-600 hover:bg-rose-700"
              onClick={() => { if (deleteId) { deleteMutation.mutate(deleteId); setDeleteId(null); } }}
              data-testid="button-confirm-delete"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
