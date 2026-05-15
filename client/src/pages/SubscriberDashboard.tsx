import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  CreditCard, Camera, BookMarked, CheckCircle2, Clock, AlertCircle,
  XCircle, Loader2, Upload, ImageIcon, LogOut, Receipt
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import NavBar from "@/components/NavBar";
import type { Student, Receipt as ReceiptType } from "@shared/schema";

function openImage(base64: string, mimeType: string) {
  const byteChars = atob(base64);
  const byteArr = new Uint8Array(byteChars.length);
  for (let i = 0; i < byteChars.length; i++) byteArr[i] = byteChars.charCodeAt(i);
  const blob = new Blob([byteArr], { type: mimeType });
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank");
}

function StatusIcon({ status }: { status: string }) {
  if (["completed", "paid", "claimed", "fully_paid"].includes(status)) return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
  if (["scheduled", "ready", "partial"].includes(status)) return <Clock className="w-5 h-5 text-blue-500" />;
  if (status === "rejected") return <XCircle className="w-5 h-5 text-rose-500" />;
  return <XCircle className="w-5 h-5 text-gray-400" />;
}

function verifyBadge(status: string) {
  const map: Record<string, string> = {
    pending: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
    partial: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
    fully_paid: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
    rejected: "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400",
  };
  const labels: Record<string, string> = { pending: "Pending Review", partial: "Partially Paid", fully_paid: "Fully Paid", rejected: "Rejected" };
  return <Badge className={map[status] || map.pending}>{labels[status] || "Pending"}</Badge>;
}

export default function SubscriberDashboard() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imageType, setImageType] = useState<string>("");

  const session = (window as any).__subscriberSession;

  useEffect(() => {
    if (!session) navigate("/login");
  }, []);

  if (!session) return null;

  const { data: student, isLoading: loadingStudent } = useQuery<Student>({
    queryKey: ["/api/subscriber/student", session.studentId],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/subscriber/student/${session.studentId}`);
      return res.json();
    },
  });

  const { data: receipts = [], isLoading: loadingReceipts } = useQuery<ReceiptType[]>({
    queryKey: ["/api/subscriber/receipts", session.id],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/subscriber/receipts/${session.id}`);
      return res.json();
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!imageBase64) throw new Error("No image selected");
      const res = await apiRequest("POST", "/api/subscriber/receipts", {
        subscriberId: session.id,
        studentId: session.studentId,
        studentName: session.name,
        imageBase64,
        imageType,
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Upload failed"); }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subscriber/receipts", session.id] });
      setPreview(null); setImageBase64(null);
      toast({ title: "Receipt uploaded!", description: "Staff will review and verify your payment soon." });
    },
    onError: (e: any) => toast({ title: "Upload failed", description: e.message, variant: "destructive" }),
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast({ title: "File too large", description: "Max 5MB", variant: "destructive" }); return; }
    const reader = new FileReader();
    reader.onload = ev => {
      const result = ev.target?.result as string;
      setPreview(result);
      setImageBase64(result.split(",")[1]);
      setImageType(file.type);
    };
    reader.readAsDataURL(file);
  };

  const logout = () => { (window as any).__subscriberSession = null; navigate("/"); };

  const remaining = student ? student.totalPrice - student.amountPaid : 0;
  const paidPct = student ? Math.round((student.amountPaid / student.totalPrice) * 100) : 0;
  const paymentStatus = student ? (student.amountPaid >= student.totalPrice ? "paid" : student.amountPaid > 0 ? "partial" : "unpaid") : "unpaid";

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md border-b bg-background/90 border-border">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <span className="font-bold text-indigo-700 dark:text-indigo-400">YearbookTrack</span>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="hidden sm:inline font-medium text-foreground">{session.name}</span>
            <Button variant="ghost" size="sm" onClick={logout} className="gap-1.5" data-testid="button-logout">
              <LogOut className="w-4 h-4" /> Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Hero strip */}
      <div className="gradient-navy text-white py-8 px-4">
        <div className="max-w-3xl mx-auto">
          <p className="text-indigo-300/70 text-sm mb-1">Student ID: {session.studentId}</p>
          <h1 className="text-2xl sm:text-3xl font-bold" data-testid="text-student-name">{session.name}</h1>
          <p className="text-indigo-200/70 text-sm">{session.course} &middot; Class of {session.yearOfGraduation}</p>
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 w-full flex-1 space-y-5">
        {loadingStudent ? (
          <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>
        ) : student ? (
          <>
            {/* Payment card */}
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm" data-testid="card-payment">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-semibold">Payment Balance</h2>
                    <p className="text-xs text-muted-foreground">Yearbook fee</p>
                  </div>
                </div>
                <Badge className={paymentStatus === "paid" ? "status-paid" : paymentStatus === "partial" ? "status-partial" : "status-unpaid"}>
                  {paymentStatus === "paid" ? "Fully Paid" : paymentStatus === "partial" ? "Partial" : "Unpaid"}
                </Badge>
              </div>
              <div className="space-y-2 mb-4">
                {[
                  { label: "Total Price", value: `₱${student.totalPrice.toFixed(2)}` },
                  { label: "Amount Paid", value: `₱${student.amountPaid.toFixed(2)}`, color: "text-emerald-600 dark:text-emerald-400" },
                  { label: "Remaining", value: `₱${remaining.toFixed(2)}`, color: remaining > 0 ? "text-rose-600 dark:text-rose-400" : "" },
                ].map(({ label, value, color }) => (
                  <div key={label} className="flex justify-between items-center py-1.5 border-b border-border last:border-0">
                    <span className="text-sm text-muted-foreground">{label}</span>
                    <span className={`font-semibold text-sm ${color || ""}`}>{value}</span>
                  </div>
                ))}
              </div>
              <div>
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>Progress</span><span>{paidPct}%</span>
                </div>
                <Progress value={paidPct} className="h-2" />
              </div>
            </div>

            {/* Photo + Claim */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="bg-card border border-border rounded-xl p-5 shadow-sm" data-testid="card-photo">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400"><Camera className="w-4 h-4" /></div>
                    <div><p className="font-semibold text-sm">Photo Status</p><p className="text-xs text-muted-foreground">Yearbook photo</p></div>
                  </div>
                  <StatusIcon status={student.photoStatus} />
                </div>
                <Badge className={`status-${student.photoStatus}`}>{student.photoStatus === "completed" ? "Completed" : student.photoStatus === "scheduled" ? "Scheduled" : "Pending"}</Badge>
                <p className="text-xs text-muted-foreground mt-2">
                  {student.photoStatus === "completed" && "Your photo has been submitted."}
                  {student.photoStatus === "scheduled" && `Scheduled${student.photoScheduledDate ? ` for ${student.photoScheduledDate}` : ""}.`}
                  {student.photoStatus === "pending" && "Contact staff to schedule your photo."}
                </p>
              </div>
              <div className="bg-card border border-border rounded-xl p-5 shadow-sm" data-testid="card-claim">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-lg bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center text-purple-600 dark:text-purple-400"><BookMarked className="w-4 h-4" /></div>
                    <div><p className="font-semibold text-sm">Claim Status</p><p className="text-xs text-muted-foreground">Yearbook</p></div>
                  </div>
                  <StatusIcon status={student.claimStatus} />
                </div>
                <Badge className={`status-${student.claimStatus}`}>{student.claimStatus === "ready" ? "Ready to Claim" : student.claimStatus === "claimed" ? "Claimed" : "Not Available"}</Badge>
                <p className="text-xs text-muted-foreground mt-2">
                  {student.claimStatus === "unavailable" && "Not yet available for pickup."}
                  {student.claimStatus === "ready" && "Visit the yearbook office to claim. Bring your ID."}
                  {student.claimStatus === "claimed" && `Claimed${student.claimedAt ? ` on ${student.claimedAt}` : ""}.`}
                </p>
              </div>
            </div>
          </>
        ) : null}

        {/* Receipt Upload */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm" data-testid="card-receipt-upload">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-semibold">Upload Payment Receipt</h2>
              <p className="text-xs text-muted-foreground">Staff will verify and update your balance</p>
            </div>
          </div>

          {/* Drop zone */}
          <div
            onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-border hover:border-indigo-400 dark:hover:border-indigo-500 rounded-xl p-6 flex flex-col items-center gap-3 cursor-pointer transition-colors mb-4"
            data-testid="zone-upload"
          >
            {preview ? (
              <img src={preview} alt="Receipt preview" className="max-h-48 rounded-lg object-contain" />
            ) : (
              <>
                <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-400">
                  <ImageIcon className="w-6 h-6" />
                </div>
                <p className="text-sm text-muted-foreground text-center">Click to select a receipt image<br /><span className="text-xs">JPG, PNG, WEBP — max 5MB</span></p>
              </>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} data-testid="input-file" />

          {preview && (
            <div className="flex gap-2">
              <Button onClick={() => uploadMutation.mutate()} disabled={uploadMutation.isPending} className="flex-1 bg-indigo-600 hover:bg-indigo-700 gap-2" data-testid="button-upload">
                {uploadMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {uploadMutation.isPending ? "Uploading..." : "Submit Receipt"}
              </Button>
              <Button variant="outline" onClick={() => { setPreview(null); setImageBase64(null); }} data-testid="button-cancel-upload">Cancel</Button>
            </div>
          )}
        </div>

        {/* Receipt history */}
        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-border">
            <h2 className="font-semibold text-sm">Receipt History</h2>
          </div>
          {loadingReceipts ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-indigo-500" /></div>
          ) : receipts.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm py-8">No receipts uploaded yet.</p>
          ) : (
            <div className="divide-y divide-border">
              {receipts.map(r => (
                <div key={r.id} className="p-4 flex items-start gap-4" data-testid={`row-receipt-${r.id}`}>
                  <img src={`data:${r.imageType};base64,${r.imageBase64}`} alt="Receipt" className="w-16 h-16 rounded-lg object-cover border border-border shrink-0 cursor-pointer hover:opacity-80" onClick={() => openImage(r.imageBase64, r.imageType)} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {verifyBadge(r.verifiedStatus)}
                      <span className="text-xs text-muted-foreground">{new Date(r.uploadedAt).toLocaleDateString()}</span>
                    </div>
                    {r.amountVerified != null && (
                      <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-1 font-medium">₱{r.amountVerified.toFixed(2)} verified</p>
                    )}
                    {r.verifiedNote && <p className="text-xs text-muted-foreground mt-1">{r.verifiedNote}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
