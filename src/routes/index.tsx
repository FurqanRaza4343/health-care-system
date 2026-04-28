import { createFileRoute, Link } from "@tanstack/react-router";
import { Activity, Brain, Stethoscope, ShieldCheck, Sparkles, ArrowRight, Heart, FileScan, Calendar, MessageSquare, Star, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/site-header";
import { CountUp } from "@/components/count-up";
import heroImg from "@/assets/hero-medical.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Mediq — AI Medical Diagnosis & Telemedicine Platform" },
      { name: "description", content: "Trusted by 50,000+ patients. AI symptom checker, instant triage, and connect with verified doctors in seconds." },
      { property: "og:title", content: "Mediq — AI Medical Diagnosis Platform" },
      { property: "og:description", content: "AI-powered triage, image analysis, and care coordination — built with clinicians." },
    ],
  }),
  component: Landing,
});

const features = [
  { icon: Brain, title: "AI Symptom Triage", desc: "Multi-step intake powered by Gemini. Get a structured assessment with urgency level in under 30 seconds.", color: "from-[oklch(0.55_0.18_240)] to-[oklch(0.72_0.14_215)]" },
  { icon: FileScan, title: "Medical Image Analysis", desc: "Upload skin photos, X-rays, or lab reports. AI highlights areas of concern with confidence scores.", color: "from-[oklch(0.32_0.14_265)] to-[oklch(0.55_0.18_240)]" },
  { icon: Stethoscope, title: "Verified Specialists", desc: "Browse licensed doctors by specialty, rating, and availability. Book in two taps.", color: "from-[oklch(0.72_0.14_215)] to-[oklch(0.55_0.18_240)]" },
  { icon: Calendar, title: "Smart Scheduling", desc: "Live calendar with SMS reminders, video consultations, and one-click rescheduling.", color: "from-[oklch(0.65_0.18_215)] to-[oklch(0.32_0.14_265)]" },
  { icon: MessageSquare, title: "Secure Chat", desc: "End-to-end encrypted messaging with your care team. Share files, photos, and voice notes.", color: "from-[oklch(0.55_0.18_240)] to-[oklch(0.32_0.14_265)]" },
  { icon: ShieldCheck, title: "HIPAA-Aware", desc: "Bank-grade encryption, audit logs, and role-based access. Your data, your control.", color: "from-[oklch(0.32_0.14_265)] to-[oklch(0.72_0.14_215)]" },
];

const stats = [
  { value: 52000, suffix: "+", label: "Patients served" },
  { value: 1240, suffix: "+", label: "Verified doctors" },
  { value: 98, suffix: "%", label: "Satisfaction rate" },
  { value: 24, suffix: "/7", label: "AI availability" },
];

const testimonials = [
  { name: "Dr. Sarah Chen", role: "Cardiologist, Mass General", quote: "Mediq's AI triage gives me a structured pre-visit summary that saves 5–8 minutes per patient. The differential it suggests is genuinely useful." },
  { name: "Amir Patel", role: "Patient", quote: "I was anxious at 2am about chest tightness. Mediq calmly walked me through it, recommended urgent care over ER, and was right." },
  { name: "Maya Rodriguez", role: "Nurse practitioner", quote: "The image analyzer caught an atypical mole pattern I might have rescheduled. Confidence visualization is fantastic." },
  { name: "Dr. Liu Wei", role: "Family medicine", quote: "The prescription writer and drug interaction checks integrate cleanly into my workflow. Best telemedicine UI I've used." },
];

function Landing() {
  return (
    <div className="min-h-screen">
      <SiteHeader />

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-hero pointer-events-none" />
        <div className="container relative mx-auto grid gap-12 px-4 py-20 md:py-28 lg:grid-cols-2 lg:items-center">
          <div className="animate-fade-in-up">
            <div className="inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-xs font-medium">
              <Sparkles className="h-3.5 w-3.5 text-accent" />
              Powered by Gemini medical AI
            </div>
            <h1 className="mt-6 text-4xl font-bold leading-[1.1] tracking-tight md:text-6xl lg:text-7xl">
              Your health,<br />
              <span className="text-gradient">intelligently</span> guided.
            </h1>
            <p className="mt-6 max-w-xl text-lg text-muted-foreground">
              AI-powered symptom triage, medical image analysis, and instant access to verified clinicians — all in one calm, beautifully designed platform.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button asChild size="lg" className="gradient-primary text-primary-foreground shadow-glow hover:opacity-90 h-12 px-6 rounded-xl">
                <Link to="/symptoms">Try AI Symptom Checker <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="glass h-12 px-6 rounded-xl">
                <Link to="/auth">Create free account</Link>
              </Button>
            </div>
            <div className="mt-8 flex items-center gap-6 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-success" /> HIPAA-aware</div>
              <div className="flex items-center gap-1.5"><Zap className="h-4 w-4 text-accent" /> &lt;30s triage</div>
              <div className="flex items-center gap-1.5"><Star className="h-4 w-4 text-warning" /> 4.9/5 rating</div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-8 rounded-3xl bg-gradient-to-br from-primary/20 to-accent/20 blur-3xl" />
            <div className="relative glass-strong rounded-3xl p-2 shadow-elegant animate-float">
              <img src={heroImg} alt="AI medical visualization" width={1536} height={1024} className="rounded-2xl" />
            </div>
            {/* floating chips */}
            <div className="absolute -left-4 top-12 glass rounded-2xl p-3 shadow-elegant animate-float" style={{ animationDelay: "0.5s" }}>
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-success/15"><Heart className="h-5 w-5 text-success animate-pulse-ring rounded-full" /></div>
                <div><div className="text-xs text-muted-foreground">Heart rate</div><div className="text-sm font-semibold">72 bpm</div></div>
              </div>
            </div>
            <div className="absolute -right-2 bottom-10 glass rounded-2xl p-3 shadow-elegant animate-float" style={{ animationDelay: "1s" }}>
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/15"><Brain className="h-5 w-5 text-accent" /></div>
                <div><div className="text-xs text-muted-foreground">AI confidence</div><div className="text-sm font-semibold">94%</div></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="container mx-auto px-4 py-12">
        <div className="glass-strong grid grid-cols-2 gap-6 rounded-3xl p-8 md:grid-cols-4 md:p-10">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-3xl font-bold text-gradient md:text-5xl"><CountUp to={s.value} suffix={s.suffix} /></div>
              <div className="mt-2 text-xs text-muted-foreground md:text-sm">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="container mx-auto px-4 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight md:text-5xl">Everything your care team needs</h2>
          <p className="mt-4 text-muted-foreground">From the first symptom to the final prescription — built end-to-end with clinicians.</p>
        </div>
        <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <div key={f.title} className="group glass rounded-3xl p-6 transition-all duration-300 hover:shadow-elegant hover:-translate-y-1 animate-fade-in-up" style={{ animationDelay: `${i * 60}ms` }}>
              <div className={`mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${f.color} text-white shadow-glow transition group-hover:scale-110`}>
                <f.icon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section id="testimonials" className="container mx-auto px-4 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight md:text-5xl">Trusted by clinicians and patients</h2>
        </div>
        <div className="mt-14 grid gap-5 md:grid-cols-2">
          {testimonials.map((t, i) => (
            <figure key={t.name} className="glass rounded-3xl p-7 transition hover:shadow-elegant animate-fade-in-up" style={{ animationDelay: `${i * 80}ms` }}>
              <div className="mb-3 flex gap-0.5">{Array.from({ length: 5 }).map((_, k) => <Star key={k} className="h-4 w-4 fill-warning text-warning" />)}</div>
              <blockquote className="text-base leading-relaxed">"{t.quote}"</blockquote>
              <figcaption className="mt-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full gradient-primary text-sm font-semibold text-primary-foreground">{t.name.charAt(0)}</div>
                <div><div className="text-sm font-semibold">{t.name}</div><div className="text-xs text-muted-foreground">{t.role}</div></div>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-20">
        <div className="relative overflow-hidden rounded-[2rem] gradient-primary p-10 text-center shadow-elegant md:p-16">
          <div className="absolute inset-0 opacity-30" style={{ background: "radial-gradient(circle at 30% 20%, oklch(0.72 0.14 215 / 0.6), transparent 50%)" }} />
          <div className="relative">
            <h2 className="text-3xl font-bold text-primary-foreground md:text-5xl">Start a check-up in 30 seconds</h2>
            <p className="mx-auto mt-4 max-w-xl text-primary-foreground/80">Free forever for patients. No credit card. No app to install.</p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button asChild size="lg" className="bg-white text-primary hover:bg-white/95 h-12 px-7 rounded-xl">
                <Link to="/symptoms">Try Symptom Checker</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white/30 bg-white/10 text-white hover:bg-white/20 h-12 px-7 rounded-xl">
                <Link to="/auth">Create account</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t bg-card/50 py-8">
        <div className="container mx-auto flex flex-col items-center justify-between gap-3 px-4 text-sm text-muted-foreground md:flex-row">
          <div className="flex items-center gap-2"><Activity className="h-4 w-4 text-accent" /> © 2026 Mediq Health, Inc.</div>
          <div className="flex gap-6"><a href="#" className="hover:text-foreground">Privacy</a><a href="#" className="hover:text-foreground">Terms</a><a href="#" className="hover:text-foreground">Security</a></div>
        </div>
      </footer>
    </div>
  );
}
