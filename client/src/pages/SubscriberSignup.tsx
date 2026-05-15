import { useState } from "react";
import { Link, useLocation } from "wouter";
import { UserPlus, Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import NavBar from "@/components/NavBar";
import Logo from "@/components/Logo";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { COURSES, COLLEGE, GRAD_YEARS } from "@shared/schema";

const emptyForm = {
  studentId: "",
  lastName: "",
  firstName: "",
  middleName: "",
  college: COLLEGE,
  course: "" as string,
  yearOfGraduation: "",
  email: "",
  password: "",
  confirm: "",
};

export default function SubscriberSignup() {
  const [form, setForm] = useState({ ...emptyForm });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const set = (k: keyof typeof emptyForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.course) { toast({ title: "Please select a course", variant: "destructive" }); return; }
    if (!form.yearOfGraduation) { toast({ title: "Please select year of graduation", variant: "destructive" }); return; }
    if (form.password !== form.confirm) { toast({ title: "Passwords don't match", variant: "destructive" }); return; }
    if (!/^2026\d{7}$/.test(form.studentId.trim())) {
      toast({ title: "Invalid Student ID", description: "Format must be 20260000000 (11 digits starting with 2026)", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res = await apiRequest("POST", "/api/subscriber/signup", {
        studentId: form.studentId.trim(),
        lastName: form.lastName.trim(),
        firstName: form.firstName.trim(),
        middleName: form.middleName.trim() || null,
        college: COLLEGE,
        course: form.course,
        yearOfGraduation: form.yearOfGraduation,
        email: form.email.trim(),
        password: form.password,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Signup failed");
      (window as any).__subscriberSession = data;
      toast({ title: "Account created!", description: `Welcome, ${data.name}!` });
      navigate("/dashboard");
    } catch (err: any) {
      toast({ title: "Signup failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <NavBar showAdmin={false} />
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg">
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl gradient-navy flex items-center justify-center mx-auto mb-3 text-indigo-300">
              <Logo size={30} />
            </div>
            <h1 className="text-xl font-bold text-foreground">Create Account</h1>
            <p className="text-sm text-muted-foreground mt-1">Sign up to track your yearbook status</p>
          </div>

          <form onSubmit={handleSubmit} className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-5">

            {/* Student ID */}
            <div className="space-y-1.5">
              <Label htmlFor="studentId">Student ID *</Label>
              <Input
                id="studentId"
                value={form.studentId}
                onChange={set("studentId")}
                placeholder="20260000000"
                required
                maxLength={11}
                data-testid="input-student-id"
              />
              <p className="text-xs text-muted-foreground">11-digit format starting with 2026 (e.g. 20260000001)</p>
            </div>

            {/* Name — split fields */}
            <div className="space-y-3">
              <Label>Full Name *</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="lastName" className="text-xs text-muted-foreground">Last Name *</Label>
                  <Input id="lastName" value={form.lastName} onChange={set("lastName")} placeholder="Santos" required data-testid="input-last-name" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="firstName" className="text-xs text-muted-foreground">First Name *</Label>
                  <Input id="firstName" value={form.firstName} onChange={set("firstName")} placeholder="Maria" required data-testid="input-first-name" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="middleName" className="text-xs text-muted-foreground">Middle Name</Label>
                <Input id="middleName" value={form.middleName} onChange={set("middleName")} placeholder="Cruz" data-testid="input-middle-name" />
              </div>
            </div>

            {/* College — fixed */}
            <div className="space-y-1.5">
              <Label>College</Label>
              <Input value={COLLEGE} readOnly className="bg-muted text-muted-foreground cursor-not-allowed" />
            </div>

            {/* Course dropdown */}
            <div className="space-y-1.5">
              <Label>Course *</Label>
              <Select value={form.course} onValueChange={v => setForm(f => ({ ...f, course: v }))}>
                <SelectTrigger data-testid="select-course">
                  <SelectValue placeholder="Select your course" />
                </SelectTrigger>
                <SelectContent>
                  {COURSES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Year of Graduation */}
            <div className="space-y-1.5">
              <Label>Year of Graduation *</Label>
              <Select value={form.yearOfGraduation} onValueChange={v => setForm(f => ({ ...f, yearOfGraduation: v }))}>
                <SelectTrigger data-testid="select-grad-year">
                  <SelectValue placeholder="Select graduation year" />
                </SelectTrigger>
                <SelectContent>
                  {GRAD_YEARS.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={set("email")}
                placeholder="you@gmail.com"
                required
                data-testid="input-email"
              />
              <p className="text-xs text-muted-foreground">Use personal E-mail</p>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <Label htmlFor="password">Password *</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPw ? "text" : "password"}
                  value={form.password}
                  onChange={set("password")}
                  placeholder="Min. 6 characters"
                  required
                  className="pr-10"
                  data-testid="input-password"
                />
                <button type="button" onClick={() => setShowPw(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirm">Confirm Password *</Label>
              <Input
                id="confirm"
                type="password"
                value={form.confirm}
                onChange={set("confirm")}
                placeholder="Repeat password"
                required
                data-testid="input-confirm"
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 gap-2"
              disabled={loading}
              data-testid="button-signup"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
              {loading ? "Creating account..." : "Sign Up"}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login"><a className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium">Log in</a></Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
