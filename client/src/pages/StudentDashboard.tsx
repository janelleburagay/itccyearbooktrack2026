import { useParams, useLocation, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, CreditCard, Camera, BookMarked, CheckCircle2, Clock, AlertCircle, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import NavBar from "@/components/NavBar";
import type { Student } from "@shared/schema";

function StatusBadge({ status, type }: { status: string; type: "photo" | "claim" | "payment" }) {
  if (type === "payment") {
    if (status === "paid") return <Badge className="status-paid">Fully Paid</Badge>;
    if (status === "partial") return <Badge className="status-partial">Partial</Badge>;
    return <Badge className="status-unpaid">Unpaid</Badge>;
  }
  const map: Record<string, { className: string; label: string }> = {
    completed: { className: "status-completed", label: "Completed" },
    scheduled: { className: "status-scheduled", label: "Scheduled" },
    pending: { className: "status-pending", label: "Pending" },
    ready: { className: "status-ready", label: "Ready to Claim" },
    claimed: { className: "status-claimed", label: "Claimed" },
    unavailable: { className: "status-unavailable", label: "Not Available" },
  };
  const m = map[status] || { className: "status-pending", label: status };
  return <Badge className={m.className}>{m.label}</Badge>;
}

function StatusIcon({ status }: { status: string }) {
  if (["completed", "paid", "claimed"].includes(status)) return <CheckCircle2 className="w-6 h-6 text-emerald-500" />;
  if (["scheduled", "ready"].includes(status)) return <Clock className="w-6 h-6 text-blue-500" />;
  if (status === "partial") return <AlertCircle className="w-6 h-6 text-amber-500" />;
  return <XCircle className="w-6 h-6 text-gray-400" />;
}

export default function StudentDashboard() {
  const { studentId } = useParams<{ studentId: string }>();
  const [, navigate] = useLocation();

  const { data: student, isLoading, isError } = useQuery<Student>({
    queryKey: ["/api/student", studentId],
    queryFn: async () => {
      const res = await fetch(`/api/student/${studentId}`);
      if (!res.ok) throw new Error("Not found");
      return res.json();
    },
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <NavBar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mx-auto mb-3" />
            <p className="text-muted-foreground">Looking up your record...</p>
          </div>
        </div>
      </div>
    );
  }

  if (isError || !student) {
    return (
      <div className="min-h-screen flex flex-col">
        <NavBar />
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="text-center max-w-sm">
            <div className="w-16 h-16 rounded-2xl bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-8 h-8 text-rose-500" />
            </div>
            <h2 className="text-xl font-bold mb-2">Student Not Found</h2>
            <p className="text-muted-foreground mb-6">
              No record found for Student ID <strong>{studentId}</strong>. Please check your ID and try again.
            </p>
            <Button onClick={() => navigate("/")} className="gap-2 bg-indigo-600 hover:bg-indigo-700">
              <ArrowLeft className="w-4 h-4" /> Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const remaining = student.totalPrice - student.amountPaid;
  const paidPct = Math.round((student.amountPaid / student.totalPrice) * 100);
  const paymentStatus = student.amountPaid >= student.totalPrice ? "paid" : student.amountPaid > 0 ? "partial" : "unpaid";

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <NavBar />

      {/* Hero banner */}
      <div className="gradient-navy text-white py-10 px-4">
        <div className="max-w-3xl mx-auto">
          <button
            onClick={() => navigate("/")}
            className="inline-flex items-center gap-1.5 text-sm text-indigo-300 hover:text-white mb-5 transition-colors"
            data-testid="button-back"
          >
            <ArrowLeft className="w-4 h-4" /> Back to lookup
          </button>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="text-indigo-300/70 text-sm mb-1">Student ID: {student.studentId}</p>
              <h1 className="text-3xl sm:text-4xl font-bold mb-1" data-testid="text-student-name">{student.name}</h1>
              <p className="text-indigo-200/70">{student.section}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-indigo-300/60 mb-1">Overall Status</p>
              {paymentStatus === "paid" && student.photoStatus === "completed" && student.claimStatus !== "unavailable"
                ? <span className="inline-flex items-center gap-1.5 bg-emerald-400/20 border border-emerald-400/30 text-emerald-300 text-sm px-3 py-1 rounded-full"><CheckCircle2 className="w-3.5 h-3.5" /> All Clear</span>
                : <span className="inline-flex items-center gap-1.5 bg-amber-400/20 border border-amber-400/30 text-amber-300 text-sm px-3 py-1 rounded-full"><AlertCircle className="w-3.5 h-3.5" /> Action Needed</span>
              }
            </div>
          </div>
        </div>
      </div>

      {/* Status Cards */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 w-full flex-1">
        <div className="grid grid-cols-1 md:grid-cols-1 gap-5">

          {/* Payment Card */}
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm" data-testid="card-payment">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-semibold text-foreground">Payment Balance</h2>
                  <p className="text-xs text-muted-foreground">Yearbook fee tracking</p>
                </div>
              </div>
              <StatusBadge status={paymentStatus} type="payment" />
            </div>

            <div className="space-y-3 mb-5">
              {[
                { label: "Total Yearbook Price", value: `₱${student.totalPrice.toFixed(2)}`, highlight: false },
                { label: "Amount Paid", value: `₱${student.amountPaid.toFixed(2)}`, highlight: true, color: "text-emerald-600 dark:text-emerald-400" },
                { label: "Remaining Balance", value: `₱${remaining.toFixed(2)}`, highlight: remaining > 0, color: remaining > 0 ? "text-rose-600 dark:text-rose-400" : "text-muted-foreground" },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex justify-between items-center py-2 border-b border-border last:border-0">
                  <span className="text-sm text-muted-foreground">{label}</span>
                  <span className={`font-semibold ${color || ""}`} data-testid={`text-${label.toLowerCase().replace(/\s+/g, '-')}`}>{value}</span>
                </div>
              ))}
            </div>

            <div>
              <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                <span>Payment Progress</span>
                <span data-testid="text-payment-percent">{paidPct}%</span>
              </div>
              <Progress value={paidPct} className="h-2" />
            </div>

            {remaining > 0 && (
              <div className="mt-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/40 rounded-lg p-3 text-sm text-amber-800 dark:text-amber-300">
                You have a remaining balance of <strong>₱{remaining.toFixed(2)}</strong>. Please settle this with your yearbook coordinator.
              </div>
            )}
          </div>

          {/* Photo + Claim side-by-side */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

            {/* Photo Card */}
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm" data-testid="card-photo">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400">
                    <Camera className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-foreground">Photo Status</h2>
                    <p className="text-xs text-muted-foreground">Yearbook photo</p>
                  </div>
                </div>
                <StatusIcon status={student.photoStatus} />
              </div>

              <StatusBadge status={student.photoStatus} type="photo" />

              <div className="mt-4 text-sm text-muted-foreground">
                {student.photoStatus === "completed" && "Your yearbook photo has been submitted successfully."}
                {student.photoStatus === "scheduled" && (
                  <>Your photo session is scheduled{student.photoScheduledDate ? ` for ${student.photoScheduledDate}` : ""}. Please be on time.</>
                )}
                {student.photoStatus === "pending" && "Your photo has not been taken yet. Please contact the yearbook staff to schedule a session."}
              </div>
            </div>

            {/* Claim Card */}
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm" data-testid="card-claim">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center text-purple-600 dark:text-purple-400">
                    <BookMarked className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-foreground">Claim Status</h2>
                    <p className="text-xs text-muted-foreground">Yearbook availability</p>
                  </div>
                </div>
                <StatusIcon status={student.claimStatus} />
              </div>

              <StatusBadge status={student.claimStatus} type="claim" />

              <div className="mt-4 text-sm text-muted-foreground">
                {student.claimStatus === "unavailable" && "Your yearbook is not yet ready for claiming. You will be notified when it's available."}
                {student.claimStatus === "ready" && "Your yearbook is ready! Please visit the yearbook office to claim it. Bring your valid ID."}
                {student.claimStatus === "claimed" && (
                  <>Yearbook successfully claimed{student.claimedAt ? ` on ${student.claimedAt}` : ""}. Enjoy your memories!</>
                )}
              </div>
            </div>
          </div>

          {student.notes && (
            <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-700/40 rounded-xl p-5">
              <p className="text-sm font-medium text-indigo-800 dark:text-indigo-300 mb-1">Staff Notes</p>
              <p className="text-sm text-indigo-700 dark:text-indigo-400" data-testid="text-notes">{student.notes}</p>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-8">
          Information is updated in real time by the yearbook staff. For concerns, contact your yearbook coordinator.
        </p>
      </main>
    </div>
  );
}
