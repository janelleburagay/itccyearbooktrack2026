import { useState } from "react";
import { useLocation } from "wouter";
import { Search, BookOpen, Cloud, ShieldCheck, Smartphone, BookMarked } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import NavBar from "@/components/NavBar";
import Logo from "@/components/Logo";

export default function StudentLookup() {
  const [studentId, setStudentId] = useState("");
  const [error, setError] = useState("");
  const [, navigate] = useLocation();

  const handleLookup = (e: React.FormEvent) => {
    e.preventDefault();
    const id = studentId.trim().toUpperCase();
    if (!id) { setError("Please enter your Student ID."); return; }
    setError("");
    navigate(`/student/${id}`);
  };

  const features = [
    { icon: BookOpen, title: "Balance Tracking", desc: "View your total yearbook price, amount paid, and remaining balance instantly." },
    { icon: BookMarked, title: "Photo Status", desc: "Know if your photo is completed, scheduled, or still needs to be taken." },
    { icon: ShieldCheck, title: "Claim Status", desc: "See if your yearbook is ready for pickup, already claimed, or not yet available." },
    { icon: Cloud, title: "Cloud-Powered", desc: "All data stored securely in the cloud — updated in real time by your yearbook staff." },
    { icon: Smartphone, title: "Any Device", desc: "Access your yearbook status from your phone, tablet, or computer anytime." },
    { icon: Search, title: "Instant Lookup", desc: "Just enter your Student ID to see your complete yearbook status in seconds." },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <NavBar variant="dark" />

      {/* Hero */}
      <section className="gradient-navy text-white relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-indigo-500/10 -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-purple-500/10 translate-y-1/2 -translate-x-1/4 pointer-events-none" />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20 md:py-28 relative z-10">
          <div className="max-w-2xl">
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-sm text-indigo-200 mb-6">
              <Cloud className="w-3.5 h-3.5" />
              Buragay, Tagubar — Class 2024
            </div>

            {/* Heading */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-tight mb-4">
              Yearbook<br />
              <span className="text-indigo-300">Tracking</span> System
            </h1>
            <p className="text-lg text-indigo-100/80 mb-10 max-w-lg">
              Check your payment balance, photo submission status, and yearbook availability — all in one place.
            </p>

            {/* Lookup form */}
            <form onSubmit={handleLookup} className="flex flex-col sm:flex-row gap-3 max-w-md">
              <div className="flex-1">
                <Input
                  value={studentId}
                  onChange={e => { setStudentId(e.target.value); setError(""); }}
                  placeholder="Enter Student ID (e.g. 2024-001)"
                  className="h-12 text-base bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:bg-white/15 focus-visible:ring-indigo-400"
                  data-testid="input-student-id"
                />
                {error && <p className="text-rose-300 text-sm mt-1.5">{error}</p>}
              </div>
              <Button
                type="submit"
                size="lg"
                className="h-12 bg-indigo-400 hover:bg-indigo-300 text-indigo-950 font-semibold gap-2 shrink-0"
                data-testid="button-lookup"
              >
                <Search className="w-4 h-4" />
                Check Status
              </Button>
            </form>

            <p className="text-sm text-white/40 mt-4">
              Demo IDs: 2024-001 · 2024-002 · 2024-003 · 2024-004 · 2024-005
            </p>
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <section className="bg-indigo-700 text-white py-4">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 grid grid-cols-3 gap-4 text-center">
          {[
            ["6", "Students Enrolled"],
            ["3", "Ready to Claim"],
            ["₱600", "Yearbook Price"],
          ].map(([val, label]) => (
            <div key={label}>
              <div className="text-2xl font-bold text-indigo-200">{val}</div>
              <div className="text-xs text-indigo-300/70 mt-0.5">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="flex-1 bg-background py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">Everything you need to know</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              No more chasing yearbook staff for updates. All your information is just a Student ID away.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="bg-card border border-border rounded-xl p-6 hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-700 transition-all duration-200"
                data-testid={`card-feature-${title.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-4">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-foreground mb-1.5">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-6">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row justify-between items-center gap-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="text-indigo-600 dark:text-indigo-400"><Logo size={18} /></span>
            <span>YearbookTrack · Buragay, Tagubar</span>
          </div>
          <span>Cloud-Based Yearbook Tracking System © 2024</span>
        </div>
      </footer>
    </div>
  );
}
