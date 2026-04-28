import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Stethoscope, Users, Clock, Activity, Pill, FlaskConical, Search, Plus, X, FileText, ChevronRight, TrendingUp, ArrowLeft, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { CountUp } from "@/components/count-up";

export const Route = createFileRoute("/doctor")({
  head: () => ({ meta: [
    { title: "Doctor Hub — Mediq" },
    { name: "description", content: "Doctor command center: patient queue, records, prescriptions, lab orders, and analytics." },
  ] }),
  component: () => <AppShell><DoctorPage /></AppShell>,
});

const DRUGS = [
  "Amoxicillin 500mg", "Azithromycin 250mg", "Cephalexin 500mg", "Ciprofloxacin 500mg",
  "Paracetamol 500mg", "Ibuprofen 400mg", "Naproxen 500mg", "Aspirin 81mg",
  "Metformin 500mg", "Atorvastatin 20mg", "Lisinopril 10mg", "Amlodipine 5mg",
  "Losartan 50mg", "Omeprazole 20mg", "Pantoprazole 40mg", "Levothyroxine 50mcg",
  "Sertraline 50mg", "Fluoxetine 20mg", "Salbutamol Inhaler", "Loratadine 10mg",
  "Cetirizine 10mg", "Prednisone 5mg", "Hydrochlorothiazide 25mg", "Insulin Glargine",
];
const FREQS = ["Once daily", "Twice daily", "Three times daily", "Four times daily", "Every 6h", "As needed"];
const LAB_TESTS = ["Complete Blood Count (CBC)", "Comprehensive Metabolic Panel", "Lipid Panel", "HbA1c", "Thyroid Function (TSH)", "Liver Function Test", "Urinalysis", "Vitamin D", "Vitamin B12", "Iron Studies", "C-Reactive Protein", "ESR", "Coagulation Panel", "Troponin", "BNP"];

type Med = { name: string; dosage: string; frequency: string; duration: string };

function DoctorPage() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<Record<string, any>>({});
  const [selected, setSelected] = useState<any | null>(null);
  const [search, setSearch] = useState("");
  const [analytics, setAnalytics] = useState<{ rxCount: number; labCount: number; scanCount: number; weekly: number[] }>({ rxCount: 0, labCount: 0, scanCount: 0, weekly: [] });

  const refresh = async () => {
    if (!user) return;
    const { data: appts } = await supabase.from("appointments").select("*").order("scheduled_at", { ascending: true }).limit(50);
    setAppointments(appts ?? []);
    const { data: pts } = await supabase.from("patients").select("*").limit(50);
    setPatients(pts ?? []);
    const ids = Array.from(new Set([...(appts ?? []).map(a => a.patient_id), ...(pts ?? []).map(p => p.user_id)]));
    if (ids.length) {
      const { data: profs } = await supabase.from("profiles").select("*").in("id", ids);
      setProfiles(Object.fromEntries((profs ?? []).map(p => [p.id, p])));
    }
    const [{ count: rxCount }, { count: labCount }, { count: scanCount }] = await Promise.all([
      supabase.from("prescriptions").select("*", { count: "exact", head: true }),
      supabase.from("lab_orders").select("*", { count: "exact", head: true }),
      supabase.from("image_analyses").select("*", { count: "exact", head: true }),
    ]);
    // weekly bar from appointments
    const buckets = Array(7).fill(0);
    (appts ?? []).forEach(a => {
      const d = new Date(a.scheduled_at);
      const diff = Math.floor((Date.now() - d.getTime()) / 86400000);
      if (diff >= 0 && diff < 7) buckets[6 - diff]++;
    });
    setAnalytics({ rxCount: rxCount ?? 0, labCount: labCount ?? 0, scanCount: scanCount ?? 0, weekly: buckets });
  };

  useEffect(() => { refresh(); /* eslint-disable-next-line */ }, [user]);

  const queue = useMemo(() => appointments.filter(a => a.status === "scheduled" || a.status === "in_progress"), [appointments]);
  const filteredPatients = useMemo(() => {
    const q = search.toLowerCase();
    return patients.filter(p => {
      const name = profiles[p.user_id]?.full_name?.toLowerCase() || "";
      return !q || name.includes(q) || p.user_id.startsWith(q);
    });
  }, [patients, profiles, search]);

  const updateApptStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("appointments").update({ status, doctor_id: user?.id }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(`Appointment ${status}`);
    refresh();
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Link to="/dashboard" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-3.5 w-3.5" /> Back</Link>
            <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">Doctor <span className="text-gradient">Command Center</span></h1>
            <p className="mt-1 text-muted-foreground">Manage your queue, write prescriptions, and order labs in one place.</p>
          </div>
          <Badge variant="secondary" className="gap-1"><Stethoscope className="h-3 w-3 text-accent" /> Clinical workspace</Badge>
        </div>

        {/* KPIs */}
        <div className="grid gap-4 md:grid-cols-4">
          <Kpi icon={<Users className="h-4 w-4" />} label="Patients" value={patients.length} tone="primary" />
          <Kpi icon={<Clock className="h-4 w-4" />} label="In queue" value={queue.length} tone="accent" />
          <Kpi icon={<Pill className="h-4 w-4" />} label="Prescriptions" value={analytics.rxCount} tone="success" />
          <Kpi icon={<FlaskConical className="h-4 w-4" />} label="Lab orders" value={analytics.labCount} tone="warning" />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Queue */}
          <Card className="glass p-5 lg:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="flex items-center gap-2 font-semibold"><Clock className="h-4 w-4 text-accent" /> Patient queue</h3>
              <Badge variant="outline">{queue.length} waiting</Badge>
            </div>
            {queue.length === 0 ? (
              <div className="rounded-xl border border-dashed py-10 text-center text-sm text-muted-foreground">
                <CheckCircle2 className="mx-auto mb-2 h-8 w-8 text-success" />
                Queue empty. Enjoy the calm.
              </div>
            ) : (
              <div className="space-y-2">
                {queue.map(a => {
                  const p = profiles[a.patient_id];
                  return (
                    <div key={a.id} className="group flex items-center gap-3 rounded-xl border bg-card/60 p-3 transition hover:shadow-elegant">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full gradient-primary text-sm font-semibold text-primary-foreground">
                        {(p?.full_name?.[0] || "P").toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-semibold">{p?.full_name || "Patient"}</p>
                          <Badge variant="outline" className="text-[10px]">{a.status}</Badge>
                        </div>
                        <p className="truncate text-xs text-muted-foreground">{a.reason || "General consultation"} · {new Date(a.scheduled_at).toLocaleString()}</p>
                      </div>
                      <Button size="sm" variant="ghost" onClick={() => setSelected({ patient_id: a.patient_id, appointment_id: a.id })}>Open <ChevronRight className="ml-1 h-3 w-3" /></Button>
                      {a.status === "scheduled" && <Button size="sm" onClick={() => updateApptStatus(a.id, "in_progress")}>Start</Button>}
                      {a.status === "in_progress" && <Button size="sm" variant="outline" onClick={() => updateApptStatus(a.id, "completed")}>Complete</Button>}
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Analytics */}
          <Card className="glass p-5">
            <h3 className="mb-4 flex items-center gap-2 font-semibold"><TrendingUp className="h-4 w-4 text-accent" /> Last 7 days</h3>
            <div className="flex h-40 items-end justify-between gap-1.5">
              {analytics.weekly.map((v, i) => {
                const max = Math.max(...analytics.weekly, 1);
                return (
                  <div key={i} className="flex flex-1 flex-col items-center gap-1">
                    <div className="w-full rounded-t-md gradient-accent transition-all" style={{ height: `${(v / max) * 100}%`, minHeight: 4 }} />
                    <span className="text-[10px] text-muted-foreground">{["S","M","T","W","T","F","S"][(new Date().getDay() - 6 + i + 7) % 7]}</span>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 border-t pt-4 text-sm">
              <div><p className="text-xs text-muted-foreground">Scans reviewed</p><p className="text-lg font-bold"><CountUp to={analytics.scanCount} /></p></div>
              <div><p className="text-xs text-muted-foreground">Avg wait</p><p className="text-lg font-bold">12<span className="text-xs"> min</span></p></div>
            </div>
          </Card>
        </div>

        {/* Patients & records */}
        <Card className="glass p-5">
          <Tabs defaultValue="patients">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <TabsList>
                <TabsTrigger value="patients">Patients</TabsTrigger>
                <TabsTrigger value="appointments">All appointments</TabsTrigger>
              </TabsList>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search patients…" className="w-64 pl-8" />
              </div>
            </div>
            <TabsContent value="patients" className="m-0">
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {filteredPatients.map(p => (
                  <PatientCard key={p.user_id} p={p} profile={profiles[p.user_id]} onOpen={() => setSelected({ patient_id: p.user_id })} />
                ))}
                {filteredPatients.length === 0 && <p className="col-span-full py-8 text-center text-sm text-muted-foreground">No patients yet.</p>}
              </div>
            </TabsContent>
            <TabsContent value="appointments" className="m-0">
              <div className="space-y-2">
                {appointments.map(a => (
                  <div key={a.id} className="flex items-center justify-between rounded-lg border bg-card/60 p-3 text-sm">
                    <div>
                      <p className="font-medium">{profiles[a.patient_id]?.full_name || "Patient"}</p>
                      <p className="text-xs text-muted-foreground">{new Date(a.scheduled_at).toLocaleString()} · {a.reason || "consult"}</p>
                    </div>
                    <Badge variant="outline">{a.status}</Badge>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </Card>

        {selected && <PatientDetail open={!!selected} onClose={() => setSelected(null)} ctx={selected} doctorId={user?.id} profile={profiles[selected.patient_id]} onSaved={refresh} />}
      </div>
    </div>
  );
}

function Kpi({ icon, label, value, tone }: any) {
  const toneCls = { primary: "from-primary to-primary-glow", accent: "from-accent to-primary-glow", success: "from-success to-accent", warning: "from-warning to-accent" }[tone as string] || "from-primary to-primary-glow";
  return (
    <Card className="glass p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        <div className={`flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br ${toneCls} text-white`}>{icon}</div>
      </div>
      <p className="mt-2 text-3xl font-bold"><CountUp to={value} /></p>
    </Card>
  );
}

function PatientCard({ p, profile, onOpen }: any) {
  return (
    <button onClick={onOpen} className="group rounded-xl border bg-card/60 p-4 text-left transition hover:shadow-elegant hover:border-primary/40">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-full gradient-primary text-base font-semibold text-primary-foreground">
          {(profile?.full_name?.[0] || "P").toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="truncate font-semibold">{profile?.full_name || "Patient"}</p>
          <p className="text-xs text-muted-foreground">{p.age ? `${p.age}y` : "—"} · {p.blood_group || "blood: n/a"}</p>
        </div>
      </div>
      {p.allergies?.length > 0 && (
        <div className="mt-3 flex items-center gap-1 text-xs text-warning"><AlertTriangle className="h-3 w-3" /> {p.allergies.slice(0, 2).join(", ")}</div>
      )}
    </button>
  );
}

function PatientDetail({ open, onClose, ctx, doctorId, profile, onSaved }: any) {
  const [meds, setMeds] = useState<Med[]>([]);
  const [rxNotes, setRxNotes] = useState("");
  const [tests, setTests] = useState<string[]>([]);
  const [labInstructions, setLabInstructions] = useState("");
  const [history, setHistory] = useState<{ rx: any[]; labs: any[]; scans: any[] }>({ rx: [], labs: [], scans: [] });
  const [drugQuery, setDrugQuery] = useState("");
  const [drugOpen, setDrugOpen] = useState(false);

  useEffect(() => {
    if (!open || !ctx?.patient_id) return;
    (async () => {
      const [{ data: rx }, { data: labs }, { data: scans }] = await Promise.all([
        supabase.from("prescriptions").select("*").eq("patient_id", ctx.patient_id).order("issued_at", { ascending: false }).limit(20),
        supabase.from("lab_orders").select("*").eq("patient_id", ctx.patient_id).order("ordered_at", { ascending: false }).limit(20),
        supabase.from("image_analyses").select("*").eq("patient_id", ctx.patient_id).order("created_at", { ascending: false }).limit(20),
      ]);
      setHistory({ rx: rx ?? [], labs: labs ?? [], scans: scans ?? [] });
    })();
  }, [open, ctx]);

  const addMed = (name: string) => {
    setMeds(m => [...m, { name, dosage: "", frequency: "Once daily", duration: "5 days" }]);
    setDrugQuery(""); setDrugOpen(false);
  };
  const updateMed = (i: number, k: keyof Med, v: string) => setMeds(m => m.map((x, idx) => idx === i ? { ...x, [k]: v } : x));
  const removeMed = (i: number) => setMeds(m => m.filter((_, idx) => idx !== i));

  const savePrescription = async () => {
    if (meds.length === 0) return toast.error("Add at least one medication");
    const { error } = await supabase.from("prescriptions").insert({
      patient_id: ctx.patient_id, doctor_id: doctorId, appointment_id: ctx.appointment_id ?? null,
      medications: meds as any, notes: rxNotes,
    });
    if (error) return toast.error(error.message);
    toast.success("Prescription saved");
    setMeds([]); setRxNotes(""); onSaved?.();
  };

  const saveLab = async () => {
    if (tests.length === 0) return toast.error("Select at least one test");
    const { error } = await supabase.from("lab_orders").insert({
      patient_id: ctx.patient_id, doctor_id: doctorId, tests, instructions: labInstructions,
    });
    if (error) return toast.error(error.message);
    toast.success("Lab order placed");
    setTests([]); setLabInstructions(""); onSaved?.();
  };

  const filteredDrugs = DRUGS.filter(d => d.toLowerCase().includes(drugQuery.toLowerCase())).slice(0, 8);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full gradient-primary text-sm font-semibold text-primary-foreground">{(profile?.full_name?.[0] || "P").toUpperCase()}</div>
            <div>
              <p>{profile?.full_name || "Patient"}</p>
              <p className="text-xs font-normal text-muted-foreground">Patient ID: {ctx.patient_id?.slice(0, 8)}</p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="record">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="record">Record</TabsTrigger>
            <TabsTrigger value="rx">Prescription</TabsTrigger>
            <TabsTrigger value="lab">Lab order</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="record" className="space-y-3">
            <Card className="p-4">
              <h4 className="mb-2 text-sm font-semibold">Medical record</h4>
              <p className="text-sm text-muted-foreground">{profile?.phone || "No phone on file."}</p>
              <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <Field label="Last scan" value={history.scans[0]?.created_at ? new Date(history.scans[0].created_at).toLocaleDateString() : "—"} />
                <Field label="Last Rx" value={history.rx[0]?.issued_at ? new Date(history.rx[0].issued_at).toLocaleDateString() : "—"} />
                <Field label="Last lab" value={history.labs[0]?.ordered_at ? new Date(history.labs[0].ordered_at).toLocaleDateString() : "—"} />
                <Field label="Total visits" value={String(history.rx.length + history.labs.length)} />
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="rx" className="space-y-3">
            <Popover open={drugOpen} onOpenChange={setDrugOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start"><Plus className="mr-2 h-4 w-4" /> Add medication…</Button>
              </PopoverTrigger>
              <PopoverContent className="w-[420px] p-0">
                <Command>
                  <CommandInput placeholder="Search drugs (e.g. Amoxicillin)" value={drugQuery} onValueChange={setDrugQuery} />
                  <CommandList>
                    <CommandEmpty>No matches</CommandEmpty>
                    <CommandGroup>
                      {filteredDrugs.map(d => <CommandItem key={d} onSelect={() => addMed(d)}><Pill className="mr-2 h-3.5 w-3.5 text-accent" /> {d}</CommandItem>)}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>

            {meds.map((m, i) => (
              <div key={i} className="rounded-xl border bg-card/60 p-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{m.name}</span>
                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => removeMed(i)}><X className="h-3 w-3" /></Button>
                </div>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  <Input placeholder="Dosage e.g. 1 tab" value={m.dosage} onChange={(e) => updateMed(i, "dosage", e.target.value)} />
                  <Select value={m.frequency} onValueChange={(v) => updateMed(i, "frequency", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{FREQS.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
                  </Select>
                  <Input placeholder="Duration" value={m.duration} onChange={(e) => updateMed(i, "duration", e.target.value)} />
                </div>
              </div>
            ))}

            <Textarea value={rxNotes} onChange={(e) => setRxNotes(e.target.value)} placeholder="Notes for patient (e.g. take with food)" rows={3} />
            <Button className="w-full gradient-primary" onClick={savePrescription}><FileText className="mr-2 h-4 w-4" /> Save prescription</Button>
          </TabsContent>

          <TabsContent value="lab" className="space-y-3">
            <div className="rounded-xl border p-3">
              <p className="mb-2 text-sm font-semibold">Select tests</p>
              <div className="flex flex-wrap gap-2">
                {LAB_TESTS.map(t => {
                  const active = tests.includes(t);
                  return (
                    <button key={t} onClick={() => setTests(s => active ? s.filter(x => x !== t) : [...s, t])}
                      className={`rounded-full border px-3 py-1.5 text-xs transition ${active ? "gradient-accent text-white border-transparent" : "bg-card/60 hover:border-primary/40"}`}>
                      {t}
                    </button>
                  );
                })}
              </div>
            </div>
            <Textarea value={labInstructions} onChange={(e) => setLabInstructions(e.target.value)} placeholder="Special instructions (fasting, urgent, etc.)" rows={3} />
            <Button className="w-full gradient-primary" onClick={saveLab}><FlaskConical className="mr-2 h-4 w-4" /> Place lab order ({tests.length})</Button>
          </TabsContent>

          <TabsContent value="history" className="space-y-3">
            <Section title="Recent prescriptions" empty="No prescriptions yet" items={history.rx.map(r => ({ id: r.id, top: `${(r.medications as any[])?.length || 0} medication(s)`, sub: new Date(r.issued_at).toLocaleString(), badge: "Rx" }))} />
            <Section title="Recent lab orders" empty="No lab orders yet" items={history.labs.map(l => ({ id: l.id, top: l.tests.join(", "), sub: new Date(l.ordered_at).toLocaleString(), badge: l.status }))} />
            <Section title="Recent scans" empty="No scans yet" items={history.scans.map(s => ({ id: s.id, top: s.title || "Scan", sub: new Date(s.created_at).toLocaleString(), badge: s.urgency || "—" }))} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg bg-muted/50 p-2"><p className="text-[10px] uppercase text-muted-foreground">{label}</p><p className="font-medium">{value}</p></div>;
}
function Section({ title, items, empty }: any) {
  return (
    <div>
      <p className="mb-2 text-sm font-semibold">{title}</p>
      {items.length === 0 ? <p className="rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground">{empty}</p> :
        <div className="space-y-1.5">
          {items.map((it: any) => (
            <div key={it.id} className="flex items-center justify-between rounded-lg bg-muted/40 p-2 text-sm">
              <div className="min-w-0"><p className="truncate font-medium">{it.top}</p><p className="text-xs text-muted-foreground">{it.sub}</p></div>
              <Badge variant="outline" className="text-[10px]">{it.badge}</Badge>
            </div>
          ))}
        </div>
      }
    </div>
  );
}
