import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Heart, Activity, Droplet, Brain, Calendar, FileText, ArrowRight, Sparkles, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppShell } from "@/components/app-shell";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Mediq" }] }),
  component: Dashboard,
});

type SymptomCheck = { id: string; created_at: string; urgency: string | null; ai_diagnosis: { summary?: string } | null };

function Dashboard() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const [recent, setRecent] = useState<SymptomCheck[]>([]);

  useEffect(() => {
    if (!loading && !user) nav({ to: "/auth" });
  }, [loading, user, nav]);

  useEffect(() => {
    if (!user) return;
    supabase.from("symptom_checks").select("id,created_at,urgency,ai_diagnosis").order("created_at", { ascending: false }).limit(4)
      .then(({ data }) => setRecent((data ?? []) as SymptomCheck[]));
  }, [user]);

  if (loading || !user) return <div className="flex min-h-screen items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>;

  const metrics = [
    { label: "Heart rate", value: "72", unit: "bpm", icon: Heart, trend: "+2", color: "from-rose-400/20 to-rose-500/10", iconColor: "text-rose-500" },
    { label: "Blood pressure", value: "118/76", unit: "mmHg", icon: Activity, trend: "Normal", color: "from-blue-400/20 to-blue-500/10", iconColor: "text-blue-500" },
    { label: "Glucose", value: "94", unit: "mg/dL", icon: Droplet, trend: "Stable", color: "from-amber-400/20 to-amber-500/10", iconColor: "text-amber-500" },
    { label: "Wellness score", value: "87", unit: "/100", icon: TrendingUp, trend: "+3", color: "from-emerald-400/20 to-emerald-500/10", iconColor: "text-emerald-500" },
  ];

  const appointments = [
    { date: "Tomorrow", time: "10:30 AM", doctor: "Dr. Sarah Chen", specialty: "Cardiology", type: "Video" },
    { date: "Apr 30", time: "2:00 PM", doctor: "Dr. Liu Wei", specialty: "Family Medicine", type: "In-person" },
  ];

  const records = [
    { title: "Annual blood panel", date: "Apr 12, 2026", type: "Lab report" },
    { title: "Chest X-ray", date: "Mar 28, 2026", type: "Imaging" },
    { title: "Vaccination — Flu", date: "Oct 14, 2025", type: "Immunization" },
  ];

  return (
    <AppShell>
      <div className="container mx-auto px-4 py-8 md:px-8">
        <div className="mb-8 animate-fade-in-up">
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Hi, {user.email?.split("@")[0]} 👋</h1>
          <p className="mt-1 text-muted-foreground">Here's a snapshot of your health today.</p>
        </div>

        {/* Metrics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {metrics.map((m, i) => (
            <div key={m.label} className="glass rounded-2xl p-5 transition hover:shadow-elegant hover:-translate-y-0.5 animate-fade-in-up" style={{ animationDelay: `${i * 60}ms` }}>
              <div className="flex items-start justify-between">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${m.color}`}><m.icon className={`h-5 w-5 ${m.iconColor}`} /></div>
                <span className="rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-medium text-success">{m.trend}</span>
              </div>
              <div className="mt-4"><div className="text-xs text-muted-foreground">{m.label}</div><div className="mt-0.5 text-2xl font-bold">{m.value}<span className="ml-1 text-sm font-normal text-muted-foreground">{m.unit}</span></div></div>
            </div>
          ))}
        </div>

        {/* Symptom AI widget + Appointments */}
        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 relative overflow-hidden rounded-3xl gradient-primary p-8 text-primary-foreground shadow-elegant">
            <div className="absolute inset-0 opacity-25" style={{ background: "radial-gradient(circle at 80% 20%, oklch(0.72 0.14 215 / 0.7), transparent 50%)" }} />
            <div className="relative">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur"><Sparkles className="h-3.5 w-3.5" /> AI symptom triage</div>
              <h2 className="mt-4 text-2xl font-bold md:text-3xl">Not feeling 100%?</h2>
              <p className="mt-2 max-w-md text-primary-foreground/85">Run a 30-second AI assessment. We'll triage urgency and suggest next steps.</p>
              <Button asChild size="lg" className="mt-6 bg-white text-primary hover:bg-white/95 h-11 rounded-xl"><Link to="/symptoms">Start check-up <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
            </div>
          </div>

          <div className="glass rounded-3xl p-6">
            <div className="mb-4 flex items-center justify-between"><h3 className="font-semibold">Upcoming</h3><Calendar className="h-4 w-4 text-muted-foreground" /></div>
            <div className="space-y-3">
              {appointments.map((a) => (
                <div key={a.doctor} className="rounded-xl border p-3 transition hover:bg-sidebar-accent/40">
                  <div className="flex items-center justify-between text-xs"><span className="font-medium text-accent">{a.date} · {a.time}</span><span className="rounded-full bg-accent/10 px-2 py-0.5">{a.type}</span></div>
                  <div className="mt-1.5 text-sm font-medium">{a.doctor}</div>
                  <div className="text-xs text-muted-foreground">{a.specialty}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent symptom checks + records */}
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="glass rounded-3xl p-6">
            <div className="mb-4 flex items-center justify-between"><h3 className="font-semibold flex items-center gap-2"><Brain className="h-4 w-4 text-accent" /> Recent AI checks</h3><Button asChild variant="ghost" size="sm"><Link to="/symptoms">New <ArrowRight className="ml-1 h-3 w-3" /></Link></Button></div>
            {recent.length === 0 ? (
              <div className="rounded-xl border border-dashed py-10 text-center text-sm text-muted-foreground">No checks yet. <Link to="/symptoms" className="text-accent underline">Start your first one</Link>.</div>
            ) : (
              <div className="space-y-2">
                {recent.map((r) => (
                  <div key={r.id} className="flex items-start gap-3 rounded-xl border p-3">
                    <div className={`mt-1 h-2 w-2 rounded-full ${r.urgency === "emergency" ? "bg-destructive" : r.urgency === "urgent" ? "bg-warning" : "bg-success"}`} />
                    <div className="flex-1 min-w-0"><div className="text-sm font-medium capitalize">{r.urgency ?? "Pending"}</div><div className="truncate text-xs text-muted-foreground">{r.ai_diagnosis?.summary ?? "—"}</div></div>
                    <div className="text-xs text-muted-foreground whitespace-nowrap">{new Date(r.created_at).toLocaleDateString()}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="glass rounded-3xl p-6">
            <div className="mb-4 flex items-center justify-between"><h3 className="font-semibold flex items-center gap-2"><FileText className="h-4 w-4 text-accent" /> Medical records</h3></div>
            <ol className="relative space-y-4 border-l border-border pl-5">
              {records.map((r) => (
                <li key={r.title} className="relative">
                  <span className="absolute -left-[1.45rem] top-1.5 h-3 w-3 rounded-full gradient-primary ring-4 ring-background" />
                  <div className="text-sm font-medium">{r.title}</div>
                  <div className="text-xs text-muted-foreground">{r.type} · {r.date}</div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
