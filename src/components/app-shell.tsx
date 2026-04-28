import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { Activity, LayoutDashboard, Brain, FileScan, Calendar, MessageSquare, Pill, Settings, LogOut, Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/symptoms", label: "Symptom AI", icon: Brain },
  { to: "/dashboard", label: "Image Analyzer", icon: FileScan, soon: true },
  { to: "/dashboard", label: "Appointments", icon: Calendar, soon: true },
  { to: "/dashboard", label: "Messages", icon: MessageSquare, soon: true },
  { to: "/dashboard", label: "Prescriptions", icon: Pill, soon: true },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const loc = useLocation();
  const nav2 = useNavigate();
  const { user, signOut } = useAuth();

  return (
    <div className="flex min-h-screen">
      {/* Mobile top bar */}
      <div className="fixed top-0 left-0 right-0 z-30 flex h-14 items-center justify-between px-4 glass-strong md:hidden">
        <Link to="/" className="flex items-center gap-2 font-semibold"><div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-primary text-primary-foreground"><Activity className="h-4 w-4" /></div>Mediq</Link>
        <Button size="icon" variant="ghost" onClick={() => setOpen((v) => !v)}>{open ? <X /> : <Menu />}</Button>
      </div>

      {/* Sidebar */}
      <aside className={cn("fixed inset-y-0 left-0 z-20 flex w-72 flex-col glass-strong border-r transition-transform md:translate-x-0", open ? "translate-x-0" : "-translate-x-full md:translate-x-0")}>
        <div className="flex h-16 items-center gap-2 border-b px-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl gradient-primary text-primary-foreground shadow-glow"><Activity className="h-5 w-5" /></div>
          <span className="text-lg font-semibold">Mediq<span className="text-accent">.</span></span>
        </div>
        <nav className="flex-1 space-y-1 p-4">
          {nav.map((n) => {
            const active = loc.pathname === n.to && !n.soon;
            return (
              <Link key={n.label} to={n.to} onClick={() => setOpen(false)}
                className={cn("group flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition", active ? "gradient-primary text-primary-foreground shadow-glow" : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground")}>
                <span className="flex items-center gap-3"><n.icon className="h-4 w-4" /> {n.label}</span>
                {n.soon && <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-semibold text-accent">SOON</span>}
              </Link>
            );
          })}
        </nav>
        <div className="border-t p-4 space-y-2">
          <div className="flex items-center gap-3 rounded-xl bg-sidebar-accent/50 p-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full gradient-primary text-sm font-semibold text-primary-foreground">{(user?.email?.[0] || "?").toUpperCase()}</div>
            <div className="min-w-0 flex-1"><div className="truncate text-sm font-medium">{user?.email ?? "Guest"}</div><div className="text-xs text-muted-foreground">Patient</div></div>
          </div>
          <Button variant="ghost" size="sm" className="w-full justify-start" onClick={async () => { await signOut(); nav2({ to: "/" }); }}>
            <LogOut className="mr-2 h-4 w-4" /> Sign out
          </Button>
        </div>
      </aside>

      <main className="flex-1 md:pl-72">
        <div className="mt-14 md:mt-0">{children}</div>
      </main>
    </div>
  );
}
