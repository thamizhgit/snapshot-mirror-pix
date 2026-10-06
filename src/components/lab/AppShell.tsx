import { Link } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { LayoutDashboard, ScanSearch, ScanFace, Brain, Fingerprint, Info, Menu, X, Aperture } from "lucide-react";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/template-matching", label: "Template Matching", icon: ScanSearch },
  { to: "/viola-jones", label: "Viola-Jones", icon: ScanFace },
  { to: "/deepface", label: "DeepFace", icon: Brain },
  { to: "/facenet", label: "FaceNet", icon: Fingerprint },
  { to: "/about", label: "About", icon: Info },
] as const;

function Brand() {
  return (
    <Link to="/" className="flex items-center gap-2.5">
      <span className="grid h-9 w-9 place-items-center rounded-lg border border-primary/30 bg-primary/10 text-primary">
        <Aperture className="h-5 w-5" />
      </span>
      <span className="leading-tight">
        <span className="block font-display text-base font-semibold tracking-wider">VISIONLAB</span>
        <span className="block text-[11px] text-muted-foreground">IVA · CV Laboratory</span>
      </span>
    </Link>
  );
}

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-1" aria-label="Main">
      {NAV.map(({ to, label, icon: Icon }) => (
        <Link
          key={to}
          to={to}
          onClick={onNavigate}
          activeOptions={{ exact: to === "/" }}
          className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-sidebar-foreground/75 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          activeProps={{ className: "!bg-primary/10 !text-primary font-medium" }}
        >
          <Icon className="h-4 w-4" />
          {label}
        </Link>
      ))}
    </nav>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="min-h-screen lg:pl-64">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-sidebar-border bg-sidebar px-4 py-6 lg:flex">
        <Brand />
        <div className="mt-8 flex-1"><NavList /></div>
        <div className="space-y-1 border-t border-sidebar-border pt-4 font-mono text-[11px] text-muted-foreground">
          <p>IVA Assignment</p><p>Computer Vision Lab</p><p>Student Project</p>
        </div>
      </aside>

      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background/90 px-4 backdrop-blur lg:hidden">
        <Brand />
        <button aria-label={open ? "Close menu" : "Open menu"} onClick={() => setOpen(!open)} className="rounded-md p-2 hover:bg-accent">
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </header>
      {open && (
        <div className="fixed inset-x-0 top-14 z-20 border-b border-border bg-sidebar p-4 lg:hidden fade-up">
          <NavList onNavigate={() => setOpen(false)} />
        </div>
      )}

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-10 lg:py-10">{children}</main>
      <footer className="mx-auto max-w-6xl border-t border-border px-4 py-6 text-xs text-muted-foreground sm:px-6 lg:px-10">
        <p className="font-display text-foreground">VISIONLAB</p>
        <p className="mt-1">Image & Video Analytics — Interactive Computer Vision Laboratory · Explore. Detect. Analyze. Understand.</p>
        <p className="mt-1">B.Tech Artificial Intelligence & Data Science · Built with React, OpenCV.js and TensorFlow.js</p>
      </footer>
    </div>
  );
}
