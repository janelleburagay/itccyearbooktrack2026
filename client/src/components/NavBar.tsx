import { Link } from "wouter";
import { Moon, Sun, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/ThemeProvider";
import Logo from "@/components/Logo";

interface NavBarProps {
  variant?: "light" | "dark";
  showAdmin?: boolean;
}

export default function NavBar({ variant = "light", showAdmin = true }: NavBarProps) {
  const { theme, toggle } = useTheme();

  const isDark = variant === "dark";

  return (
    <header
      className={`sticky top-0 z-50 backdrop-blur-md border-b ${
        isDark
          ? "bg-[hsl(232,58%,15%)]/90 border-white/10 text-white"
          : "bg-background/90 border-border text-foreground"
      }`}
      data-testid="navbar"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <Link href="/">
          <a className="flex items-center gap-2 font-bold text-lg hover:opacity-80 transition-opacity" data-testid="link-home">
            <span className={isDark ? "text-indigo-300" : "text-indigo-700"}>
              <Logo size={28} />
            </span>
            <span>YearbookTrack</span>
          </a>
        </Link>

        <div className="flex items-center gap-2">
          {showAdmin && (
            <Link href="/admin">
              <a data-testid="link-admin">
                <Button variant="ghost" size="sm" className={`gap-1.5 text-sm ${isDark ? "text-white/70 hover:text-white hover:bg-white/10" : ""}`}>
                  <Shield className="w-4 h-4" />
                  <span className="hidden sm:inline">Staff Login</span>
                </Button>
              </a>
            </Link>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggle}
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            className={isDark ? "text-white/70 hover:text-white hover:bg-white/10" : ""}
            data-testid="button-theme-toggle"
          >
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    </header>
  );
}
