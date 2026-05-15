import { Link } from "wouter";
import { BookOpen, Cloud, ShieldCheck, Smartphone, BookMarked, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import NavBar from "@/components/NavBar";
import Logo from "@/components/Logo";

export default function Home() {
  const features = [
    { icon: BookOpen, title: "Balance Tracking", desc: "View your total yearbook price, amount paid, and remaining balance instantly." },
    { icon: Receipt, title: "Receipt Upload", desc: "Upload your payment receipt directly so staff can verify your payment." },
    { icon: BookMarked, title: "Photo & Claim Status", desc: "Know if your photo is done and whether your yearbook is ready for pickup." },
    { icon: ShieldCheck, title: "Admin Verification", desc: "Staff reviews uploaded receipts and marks your payment as partial or fully paid." },
    { icon: Cloud, title: "Cloud-Powered", desc: "All data stored securely on Google Firebase — updated in real time." },
    { icon: Smartphone, title: "Any Device", desc: "Access your yearbook status from your phone, tablet, or computer anytime." },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <NavBar variant="dark" />

      {/* Hero */}
      <section className="gradient-navy text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-indigo-500/10 -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-purple-500/10 translate-y-1/2 -translate-x-1/4 pointer-events-none" />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20 md:py-28 relative z-10">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-sm text-indigo-200 mb-6">
              <Cloud className="w-3.5 h-3.5" />
              Cloud-Based Yearbook Tracking System
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-tight mb-4">
              Yearbook<br />
              <span className="text-indigo-300">Tracking</span> System
            </h1>
            <p className="text-lg text-indigo-100/80 mb-10 max-w-lg">
              Check your payment balance, upload receipts, track your photo status, and claim your yearbook — all in one place.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/login">
                <a data-testid="link-login">
                  <Button size="lg" className="h-12 bg-indigo-400 hover:bg-indigo-300 text-indigo-950 font-semibold w-full sm:w-auto">
                    Log In
                  </Button>
                </a>
              </Link>
              <Link href="/signup">
                <a data-testid="link-signup">
                  <Button size="lg" variant="outline" className="h-12 border-white/30 text-white hover:bg-white/10 w-full sm:w-auto">
                    Create Account
                  </Button>
                </a>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="flex-1 bg-background py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">Everything you need to know</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Sign up with your Student ID to access your full yearbook status and submit payment receipts.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-card border border-border rounded-xl p-6 hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-700 transition-all duration-200">
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
            <span>YearbookTrack</span>
          </div>
          <span>Cloud-Based Yearbook Tracking System © 2026</span>
        </div>
      </footer>
    </div>
  );
}
