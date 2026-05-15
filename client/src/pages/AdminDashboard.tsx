import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  Plus, Search, Pencil, Trash2, X, Loader2, LogOut,
  Users, CreditCard, Camera, BookMarked, CheckCircle2,
  Receipt, Eye, ThumbsUp, ThumbsDown, AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import type { Student, Receipt as ReceiptType } from "@shared/schema";
import { COURSES, COLLEGE, GRAD_YEARS, fullName } from "@shared/schema";

const photoOpts = ["pending", "scheduled", "completed"];
const claimOpts = ["unavailable", "ready", "claimed"];
const photoLabels: Record<string, string> = { pending: "Pending", scheduled: "Scheduled", completed: "Completed" };
const claimLabels: Record<string, string> = { unavailable: "Not Available", ready: "Ready", claimed: "Claimed" };
const emptyForm = {
  studentId: "",
  lastName: "",
  firstName: "",
  middleName: "",
  college: COLLEGE,
  course: "" as typeof COURSES[number] | "",
  yearOfGraduation: "",
  email: "",
  totalPrice: 600,
  amountPaid: 0,
  photoStatus: "pending",
  photoScheduledDate: "",
  claimStatus: "unavailable",
  claimedAt: "",
  notes: "",
};

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: number; color: string }) {
  return (
    <div className="bg-card border border-border rounded-xl p-5 flex items-center gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}><Icon className="w-5 h-5" /></div>
      <div><p className="text-2xl font-bold">{value}</p><p className="text-xs text-muted-foreground">{label}</p></div>
    </div>
  );
}

function ReceiptStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = { pending: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400", partial: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400", fully_paid: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400", rejected: "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400" };
  const labels: Record<string, string> = { pending: "Pending", partial: "Partial", fully_paid: "Fully Paid", rejected: "Rejected" };
  return <Badge className={map[status] || map.pending}>{labels[status] || status}</Badge>;
}

export default function AdminDashboard() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editStudent, setEditStudent] = useState<Student | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  // Receipt verify modal
  const [verifyReceipt, setVerifyReceipt] = useState<ReceiptType | null>(null);
  const [verifyStatus, setVerifyStatus] = useState<string>("fully_paid");
  const [verifyAmount, setVerifyAmount] = useState<string>("");
  const [verifyNote, setVerifyNote] = useState("");

  useEffect(() => { if (!(window as any).__adminSession) navigate("/admin"); }, []);
  const displayName = (window as any).__adminSession?.displayName || "Admin";

  const { data: students = [], isLoading } = useQuery<Student[]>({
    queryKey: ["/api/admin/students", search],
    queryFn: async () => { const res = await apiRequest("GET", `/api/admin/students${search ? `?q=${encodeURIComponent(search)}` : ""}`); return res.json(); },
  });

  const { data: receipts = [], isLoading: loadingReceipts } = useQuery<ReceiptType[]>({
    queryKey: ["/api/admin/receipts"],
    queryFn: async () => { const res = await apiRequest("GET", "/api/admin/receipts"); return res.json(); },
  });

  const pendingReceipts = receipts.filter(r => r.verifiedStatus === "pending");

  const totalStudents = students.length;
  const fullyPaid = students.filter(s => s.amountPaid >= s.totalPrice).length;
  const photosDone = students.filter(s => s.photoStatus === "completed").length;
  const readyToClaim = students.filter(s => s.claimStatus === "ready").length;

  const createMutation = useMutation({
    mutationFn: async (data: any) => { const res = await apiRequest("POST", "/api/admin/students", data); if (!res.ok) { const d = await res.json(); throw new Error(d.error?.formErrors?.join(", ") || "Error"); } return res.json(); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/admin/students"] }); setModalOpen(false); toast({ title: "Student added" }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => { const res = await apiRequest("PATCH", `/api/admin/students/${id}`, data); return res.json(); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/admin/students"] }); setModalOpen(false); toast({ title: "Updated" }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { await apiRequest("DELETE", `/api/admin/students/${id}`); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/admin/students"] }); toast({ title: "Deleted" }); },
  });

  const verifyMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => { const res = await apiRequest("PATCH", `/api/admin/receipts/${id}`, data); if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Error"); } return res.json(); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/receipts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/students"] });
      setVerifyReceipt(null);
      toast({ title: "Receipt verified", description: "Student payment has been updated." });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const openAdd = () => { setEditStudent(null); setForm({ ...emptyForm }); setModalOpen(true); };
  const openEdit = (s: Student) => {
    setEditStudent(s);
    setForm({
      studentId: s.studentId,
      lastName: s.lastName,
      firstName: s.firstName,
      middleName: s.middleName || "",
      college: s.college || COLLEGE,
      course: (s.course as typeof COURSES[number]) || "",
      yearOfGraduation: s.yearOfGraduation || "",
      email: s.email || "",
      totalPrice: s.totalPrice,
      amountPaid: s.amountPaid,
      photoStatus: s.photoStatus,
      photoScheduledDate: s.photoScheduledDate || "",
      claimStatus: s.claimStatus,
      claimedAt: s.claimedAt || "",
      notes: s.notes || "",
    });
    setModalOpen(true);
  };

  const handleStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...form,
      college: COLLEGE,
      totalPrice: Number(form.totalPrice),
      amountPaid: Number(form.amountPaid),
      photoScheduledDate: form.photoScheduledDate || null,
      claimedAt: form.claimedAt || null,
      email: form.email || null,
      notes: form.notes || null,
      middleName: form.middleName || null,
    };
    if (editStudent) updateMutation.mutate({ id: editStudent.id, data: payload });
    else createMutation.mutate(payload);
  };

  const handleVerify = () => {
    if (!verifyReceipt) return;
    verifyMutation.mutate({
      id: verifyReceipt.id,
      data: { verifiedStatus: verifyStatus, verifiedNote: verifyNote || null, amountVerified: verifyStatus !== "rejected" ? Number(verifyAmount) : null },
    });
  };

  const openVerify = (r: ReceiptType) => {
    setVerifyReceipt(r);
    setVerifyStatus("fully_paid");
    setVerifyAmount(String(students.find(s => s.studentId === r.studentId)?.totalPrice || ""));
    setVerifyNote("");
  };

  const logout = () => { (window as any).__adminSession = null; navigate("/"); };
  const isSaving = createMutation.isPending || updateMutation.isPending;

  const getStudentDisplayName = (s: Student) => {
    try { return fullName(s); } catch { return s.firstName + " " + s.lastName; }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="sticky top-0 z-50 backdrop-blur-md border-b bg-background/90 border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-lg font-bold text-indigo-700 dark:text-indigo-400">YearbookTrack</span>
            <Badge variant="outline" className="text-xs hidden sm:inline-flex">Admin</Badge>
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="hidden sm:inline">Logged in as <strong className="text-foreground">{displayName}</strong></span>
            <Button variant="ghost" size="sm" onClick={logout} className="gap-1.5" data-testid="button-logout"><LogOut className="w-4 h-4" /> Logout</Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 w-full flex-1">
        <div className="mb-6">
          <h1 className="text-xl font-bold">Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground">Manage students, receipts, and payment verification</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard icon={Users} label="Total Students" value={totalStudents} color="bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400" />
          <StatCard icon={CreditCard} label="Fully Paid" value={fullyPaid} color="bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400" />
          <StatCard icon={Camera} label="Photos Done" value={photosDone} color="bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400" />
          <StatCard icon={Receipt} label="Pending Receipts" value={pendingReceipts.length} color="bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400" />
        </div>

        <Tabs defaultValue="students">
          <TabsList className="mb-5">
            <TabsTrigger value="students">Students</TabsTrigger>
            <TabsTrigger value="receipts" className="gap-2">
              Receipts
              {pendingReceipts.length > 0 && <span className="bg-amber-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">{pendingReceipts.length}</span>}
            </TabsTrigger>
          </TabsList>

          {/* Students Tab */}
          <TabsContent value="students">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <div className="relative max-w-sm flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, ID, course..." className="pl-9" data-testid="input-search" />
                {search && <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>}
              </div>
              <Button onClick={openAdd} className="gap-2 bg-indigo-600 hover:bg-indigo-700" data-testid="button-add-student"><Plus className="w-4 h-4" /> Add Student</Button>
            </div>
            <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
              {isLoading ? (
                <div className="flex items-center justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>
              ) : students.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">{search ? "No students match." : "No students yet."}</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 border-b border-border">
                      <tr>{["Student ID", "Name", "Course", "Year", "Balance", "Photo", "Claim", "Actions"].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">{h}</th>)}</tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {students.map(s => {
                        const paid = s.amountPaid >= s.totalPrice; const partial = s.amountPaid > 0 && !paid;
                        const displayN = getStudentDisplayName(s);
                        // Short course abbreviation for table
                        const shortCourse = s.course?.replace("Bachelor of Science in ", "BS ") || "—";
                        return (
                          <tr key={s.id} className="hover:bg-muted/30 transition-colors" data-testid={`row-student-${s.id}`}>
                            <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{s.studentId}</td>
                            <td className="px-4 py-3 font-medium whitespace-nowrap">{displayN}</td>
                            <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap max-w-[160px] truncate" title={s.course}>{shortCourse}</td>
                            <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">{s.yearOfGraduation || "—"}</td>
                            <td className="px-4 py-3">
                              <Badge className={paid ? "status-paid" : partial ? "status-partial" : "status-unpaid"}>{paid ? "Paid" : partial ? "Partial" : "Unpaid"}</Badge>
                              <div className="text-xs text-muted-foreground mt-0.5">₱{s.amountPaid}/{s.totalPrice}</div>
                            </td>
                            <td className="px-4 py-3"><Badge className={`status-${s.photoStatus}`}>{photoLabels[s.photoStatus]}</Badge></td>
                            <td className="px-4 py-3"><Badge className={`status-${s.claimStatus}`}>{claimLabels[s.claimStatus]}</Badge></td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1">
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-indigo-600" onClick={() => openEdit(s)} data-testid={`button-edit-${s.id}`}><Pencil className="w-3.5 h-3.5" /></Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-rose-600" onClick={() => setDeleteId(s.id)} data-testid={`button-delete-${s.id}`}><Trash2 className="w-3.5 h-3.5" /></Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Receipts Tab */}
          <TabsContent value="receipts">
            <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
              {loadingReceipts ? (
                <div className="flex items-center justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>
              ) : receipts.length === 0 ? (
                <p className="text-center py-16 text-muted-foreground">No receipts submitted yet.</p>
              ) : (
                <div className="divide-y divide-border">
                  {receipts.map(r => (
                    <div key={r.id} className="p-5 flex items-start gap-5 flex-wrap" data-testid={`row-receipt-${r.id}`}>
                      <img src={`data:${r.imageType};base64,${r.imageBase64}`} alt="Receipt" className="w-20 h-20 rounded-xl object-cover border border-border shrink-0 cursor-pointer hover:opacity-80" onClick={() => window.open(`data:${r.imageType};base64,${r.imageBase64}`, "_blank")} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-semibold text-sm">{r.studentName}</span>
                          <span className="text-xs text-muted-foreground font-mono">{r.studentId}</span>
                          <ReceiptStatusBadge status={r.verifiedStatus} />
                        </div>
                        <p className="text-xs text-muted-foreground">Submitted {new Date(r.uploadedAt).toLocaleString()}</p>
                        {r.amountVerified != null && <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400 mt-1">₱{r.amountVerified.toFixed(2)} verified</p>}
                        {r.verifiedNote && <p className="text-xs text-muted-foreground mt-1">Note: {r.verifiedNote}</p>}
                      </div>
                      {r.verifiedStatus === "pending" && (
                        <Button size="sm" onClick={() => openVerify(r)} className="bg-indigo-600 hover:bg-indigo-700 gap-1.5 shrink-0" data-testid={`button-verify-${r.id}`}>
                          <Eye className="w-3.5 h-3.5" /> Verify
                        </Button>
                      )}
                      {r.verifiedStatus !== "pending" && (
                        <Button size="sm" variant="outline" onClick={() => openVerify(r)} className="gap-1.5 shrink-0" data-testid={`button-re-verify-${r.id}`}>
                          <Pencil className="w-3.5 h-3.5" /> Update
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Student add/edit modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editStudent ? "Edit Student" : "Add Student"}</DialogTitle></DialogHeader>
          <form onSubmit={handleStudentSubmit} className="space-y-4 py-2">
            {/* Student ID */}
            <div className="space-y-1.5">
              <Label>Student ID *</Label>
              <Input
                value={form.studentId}
                onChange={e => setForm(f => ({ ...f, studentId: e.target.value }))}
                placeholder="20260000000"
                required
                data-testid="input-form-student-id"
              />
              <p className="text-xs text-muted-foreground">Format: 20260000000 (11 digits starting with 2026)</p>
            </div>

            {/* Name fields */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Last Name *</Label>
                <Input value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} placeholder="Santos" required data-testid="input-form-last-name" />
              </div>
              <div className="space-y-1.5">
                <Label>First Name *</Label>
                <Input value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} placeholder="Maria" required data-testid="input-form-first-name" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Middle Name</Label>
              <Input value={form.middleName} onChange={e => setForm(f => ({ ...f, middleName: e.target.value }))} placeholder="Cruz" data-testid="input-form-middle-name" />
            </div>

            {/* College (read-only display) */}
            <div className="space-y-1.5">
              <Label>College</Label>
              <Input value={COLLEGE} readOnly className="bg-muted text-muted-foreground cursor-not-allowed" data-testid="input-form-college" />
            </div>

            {/* Course dropdown */}
            <div className="space-y-1.5">
              <Label>Course *</Label>
              <Select value={form.course} onValueChange={v => setForm(f => ({ ...f, course: v as typeof COURSES[number] }))}>
                <SelectTrigger data-testid="select-form-course"><SelectValue placeholder="Select course" /></SelectTrigger>
                <SelectContent>
                  {COURSES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Year of Graduation */}
            <div className="space-y-1.5">
              <Label>Year of Graduation *</Label>
              <Select value={form.yearOfGraduation} onValueChange={v => setForm(f => ({ ...f, yearOfGraduation: v }))}>
                <SelectTrigger data-testid="select-form-grad-year"><SelectValue placeholder="Select year" /></SelectTrigger>
                <SelectContent>
                  {GRAD_YEARS.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="student@email.com" type="email" data-testid="input-form-email" />
              <p className="text-xs text-muted-foreground">Use personal E-mail</p>
            </div>

            {/* Payment */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Total Price (₱)</Label><Input value={form.totalPrice} onChange={e => setForm(f => ({ ...f, totalPrice: Number(e.target.value) }))} type="number" min="0" step="0.01" data-testid="input-form-total-price" /></div>
              <div className="space-y-1.5"><Label>Amount Paid (₱)</Label><Input value={form.amountPaid} onChange={e => setForm(f => ({ ...f, amountPaid: Number(e.target.value) }))} type="number" min="0" step="0.01" data-testid="input-form-amount-paid" /></div>
            </div>

            {/* Photo & Claim */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Photo Status</Label><Select value={form.photoStatus} onValueChange={v => setForm(f => ({ ...f, photoStatus: v }))}><SelectTrigger data-testid="select-photo-status"><SelectValue /></SelectTrigger><SelectContent>{photoOpts.map(o => <SelectItem key={o} value={o}>{photoLabels[o]}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-1.5"><Label>Photo Date</Label><Input value={form.photoScheduledDate} onChange={e => setForm(f => ({ ...f, photoScheduledDate: e.target.value }))} type="date" data-testid="input-form-photo-date" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Claim Status</Label><Select value={form.claimStatus} onValueChange={v => setForm(f => ({ ...f, claimStatus: v }))}><SelectTrigger data-testid="select-claim-status"><SelectValue /></SelectTrigger><SelectContent>{claimOpts.map(o => <SelectItem key={o} value={o}>{claimLabels[o]}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-1.5"><Label>Claimed At</Label><Input value={form.claimedAt} onChange={e => setForm(f => ({ ...f, claimedAt: e.target.value }))} type="date" data-testid="input-form-claimed-at" /></div>
            </div>
            <div className="space-y-1.5"><Label>Notes</Label><Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Optional notes" data-testid="input-form-notes" /></div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700" disabled={isSaving} data-testid="button-save-student">
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                {isSaving ? "Saving..." : editStudent ? "Update" : "Add"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Verify receipt modal */}
      <Dialog open={!!verifyReceipt} onOpenChange={open => !open && setVerifyReceipt(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Verify Receipt</DialogTitle></DialogHeader>
          {verifyReceipt && (
            <div className="space-y-4 py-2">
              <div className="flex gap-3 items-start">
                <img src={`data:${verifyReceipt.imageType};base64,${verifyReceipt.imageBase64}`} alt="Receipt" className="w-24 h-24 rounded-xl object-cover border border-border cursor-pointer" onClick={() => window.open(`data:${verifyReceipt.imageType};base64,${verifyReceipt.imageBase64}`, "_blank")} />
                <div>
                  <p className="font-semibold">{verifyReceipt.studentName}</p>
                  <p className="text-sm text-muted-foreground">{verifyReceipt.studentId}</p>
                  <p className="text-xs text-muted-foreground mt-1">Tap image to view full size</p>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Payment Status</Label>
                <Select value={verifyStatus} onValueChange={setVerifyStatus}>
                  <SelectTrigger data-testid="select-verify-status"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fully_paid">Fully Paid</SelectItem>
                    <SelectItem value="partial">Partially Paid</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {verifyStatus !== "rejected" && (
                <div className="space-y-1.5">
                  <Label>Amount Verified (₱)</Label>
                  <Input value={verifyAmount} onChange={e => setVerifyAmount(e.target.value)} type="number" min="0" step="0.01" placeholder="Enter amount" data-testid="input-verify-amount" />
                </div>
              )}
              <div className="space-y-1.5">
                <Label>Note (optional)</Label>
                <Input value={verifyNote} onChange={e => setVerifyNote(e.target.value)} placeholder="e.g. Receipt verified via GCash screenshot" data-testid="input-verify-note" />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setVerifyReceipt(null)}>Cancel</Button>
            <Button onClick={handleVerify} className="bg-indigo-600 hover:bg-indigo-700 gap-2" disabled={verifyMutation.isPending} data-testid="button-confirm-verify">
              {verifyMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <ThumbsUp className="w-4 h-4" />}
              {verifyMutation.isPending ? "Saving..." : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={deleteId !== null} onOpenChange={open => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete student?</AlertDialogTitle><AlertDialogDescription>This cannot be undone.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-rose-600 hover:bg-rose-700" onClick={() => { if (deleteId) { deleteMutation.mutate(deleteId); setDeleteId(null); } }} data-testid="button-confirm-delete">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
