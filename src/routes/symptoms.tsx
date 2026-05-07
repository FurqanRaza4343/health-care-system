import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  Brain,
  ArrowRight,
  ArrowLeft,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Activity,
  Sparkles,
  Stethoscope,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { SiteHeader } from "@/components/site-header";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/symptoms")({
  head: () => ({
    meta: [
      { title: "AI Symptom Checker — Mediq" },
      {
        name: "description",
        content: "Get an instant AI triage of your symptoms in under 30 seconds.",
      },
    ],
  }),
  component: Symptoms,
});

const BODY_AREAS = [
  "Head",
  "Eyes",
  "Ears",
  "Nose",
  "Throat",
  "Chest",
  "Abdomen",
  "Back",
  "Arms",
  "Legs",
  "Skin",
  "Joints",
];
const DURATIONS = ["< 1 hour", "Few hours", "1 day", "2-3 days", "1 week", "> 1 week"];

type Diagnosis = {
  urgency: "emergency" | "urgent" | "routine" | "self-care";
  summary: string;
  possible_conditions: {
    name: string;
    likelihood: "high" | "medium" | "low";
    description: string;
  }[];
  recommendations: string[];
  recommended_specialists: string[];
  red_flags: string[];
};

function Symptoms() {
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [areas, setAreas] = useState<string[]>([]);
  const [severity, setSeverity] = useState([5]);
  const [duration, setDuration] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Diagnosis | null>(null);

  const totalSteps = 4;
  const canNext = [areas.length > 0, !!duration, severity[0] >= 1, description.trim().length >= 10][
    step
  ];

  const toggleArea = (a: string) =>
    setAreas((prev) => (prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]));

  const submit = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("diagnose-symptoms-mistral", {
        body: {
          symptoms: description,
          bodyAreas: areas,
          severity: severity[0],
          duration,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const dx = data?.diagnosis as Diagnosis;
      if (!dx?.urgency) throw new Error("Invalid AI response");

      setResult(dx);

      if (user) {
        await supabase.from("symptom_checks").insert({
          patient_id: user.id,
          symptoms: { description },
          body_areas: areas,
          severity: severity[0],
          duration,
          ai_diagnosis: dx,
          urgency: dx.urgency,
        });
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "AI is unavailable. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setStep(0);
    setAreas([]);
    setSeverity([5]);
    setDuration("");
    setDescription("");
    setResult(null);
  };

  if (result) return <ResultView result={result} onReset={reset} />;

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <div className="container mx-auto max-w-3xl px-4 py-12">
        <div className="mb-8 animate-fade-in-up">
          <div className="inline-flex items-center gap-2 rounded-full glass px-3 py-1 text-xs font-medium">
            <Sparkles className="h-3 w-3 text-accent" /> AI Triage
          </div>
          <h1 className="mt-4 text-3xl font-bold tracking-tight md:text-4xl">
            Tell us how you're feeling
          </h1>
          <p className="mt-1 text-muted-foreground">
            This is not a diagnosis. We'll help triage urgency and suggest next steps.
          </p>
        </div>

        <div className="mb-6 flex items-center gap-3">
          <Progress value={((step + 1) / totalSteps) * 100} className="h-2" />
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            Step {step + 1} / {totalSteps}
          </span>
        </div>

        <div className="glass-strong rounded-3xl p-6 md:p-8 shadow-elegant">
          {step === 0 && (
            <div className="animate-fade-in-up">
              <h2 className="text-lg font-semibold">Where do you feel symptoms?</h2>
              <p className="mt-1 text-sm text-muted-foreground">Select all that apply.</p>
              <div className="mt-5 flex flex-wrap gap-2">
                {BODY_AREAS.map((a) => (
                  <button
                    key={a}
                    onClick={() => toggleArea(a)}
                    className={`rounded-full border px-4 py-2 text-sm transition ${
                      areas.includes(a)
                        ? "gradient-primary border-transparent text-primary-foreground shadow-glow"
                        : "hover:bg-sidebar-accent"
                    }`}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="animate-fade-in-up">
              <h2 className="text-lg font-semibold">How long have you had these symptoms?</h2>
              <div className="mt-5 grid gap-2 sm:grid-cols-2">
                {DURATIONS.map((d) => (
                  <button
                    key={d}
                    onClick={() => setDuration(d)}
                    className={`rounded-2xl border p-4 text-left text-sm transition ${
                      duration === d
                        ? "gradient-primary border-transparent text-primary-foreground shadow-glow"
                        : "hover:bg-sidebar-accent"
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="animate-fade-in-up">
              <h2 className="text-lg font-semibold">How intense is the discomfort?</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                1 = barely noticeable · 10 = worst imaginable
              </p>
              <div className="mt-8 text-center">
                <div className="text-6xl font-bold text-gradient">{severity[0]}</div>
              </div>
              <Slider
                value={severity}
                onValueChange={setSeverity}
                min={1}
                max={10}
                step={1}
                className="mt-6"
              />
              <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                <span>Mild</span>
                <span>Severe</span>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="animate-fade-in-up">
              <h2 className="text-lg font-semibold">Describe what you're experiencing</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Include onset, triggers, and anything that helps or worsens it.
              </p>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Sharp pain in lower right abdomen since this morning, worse when I press on it…"
                rows={6}
                className="mt-4 resize-none"
                maxLength={1500}
              />
              <div className="mt-1 text-right text-xs text-muted-foreground">
                {description.length}/1500
              </div>
            </div>
          )}

          <div className="mt-8 flex items-center justify-between border-t pt-5">
            <Button
              variant="ghost"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0 || loading}
            >
              <ArrowLeft className="mr-1.5 h-4 w-4" /> Back
            </Button>
            {step < totalSteps - 1 ? (
              <Button
                onClick={() => setStep((s) => s + 1)}
                disabled={!canNext}
                className="gradient-primary text-primary-foreground hover:opacity-90"
              >
                Next <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={submit}
                disabled={!canNext || loading}
                className="gradient-primary text-primary-foreground hover:opacity-90"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyzing…
                  </>
                ) : (
                  <>
                    Get AI assessment <Brain className="ml-1.5 h-4 w-4" />
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        {!user && (
          <p className="mt-4 text-center text-xs text-muted-foreground">
            <Link to="/auth" className="text-accent underline">
              Create an account
            </Link>{" "}
            to save your symptom history.
          </p>
        )}
      </div>
    </div>
  );
}

function ResultView({ result, onReset }: { result: Diagnosis; onReset: () => void }) {
  const cfg = {
    emergency: {
      label: "Emergency — seek care now",
      color: "from-destructive/30 to-destructive/10",
      border: "border-destructive/40",
      icon: AlertTriangle,
      iconColor: "text-destructive",
    },
    urgent: {
      label: "Urgent — see a doctor today",
      color: "from-warning/30 to-warning/10",
      border: "border-warning/40",
      icon: AlertTriangle,
      iconColor: "text-warning",
    },
    routine: {
      label: "Routine — schedule a visit",
      color: "from-accent/25 to-accent/5",
      border: "border-accent/30",
      icon: Stethoscope,
      iconColor: "text-accent",
    },
    "self-care": {
      label: "Self-care recommended",
      color: "from-success/25 to-success/5",
      border: "border-success/30",
      icon: CheckCircle2,
      iconColor: "text-success",
    },
  }[result.urgency];

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <div className="container mx-auto max-w-3xl px-4 py-12">
        {result.urgency === "emergency" && (
          <div className="mb-6 flex items-center gap-3 rounded-2xl border border-destructive/50 bg-destructive/10 p-4 animate-fade-in-up">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive text-destructive-foreground animate-pulse-ring">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <div className="font-semibold text-destructive">Possible emergency</div>
              <div className="text-sm">
                call in this number +923132194343 AND EMAIL IS furqanraza978@gmail.com
              </div>
            </div>
          </div>
        )}

        <div
          className={`relative overflow-hidden rounded-3xl border ${cfg.border} bg-gradient-to-br ${cfg.color} p-8 animate-fade-in-up`}
        >
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl glass-strong">
              <cfg.icon className={`h-6 w-6 ${cfg.iconColor}`} />
            </div>
            <div className="flex-1">
              <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                AI assessment
              </div>
              <h1 className="mt-1 text-2xl font-bold md:text-3xl">{cfg.label}</h1>
              <p className="mt-3 text-base leading-relaxed">{result.summary}</p>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <Section title="Possible conditions" icon={Brain}>
            <div className="space-y-3">
              {result.possible_conditions.map((c) => (
                <div key={c.name} className="rounded-xl border p-3">
                  <div className="flex items-center justify-between">
                    <div className="font-medium text-sm">{c.name}</div>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        c.likelihood === "high"
                          ? "bg-warning/20 text-warning"
                          : c.likelihood === "medium"
                            ? "bg-accent/20 text-accent"
                            : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {c.likelihood}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                    {c.description}
                  </p>
                </div>
              ))}
            </div>
          </Section>

          <Section title="Recommended actions" icon={CheckCircle2}>
            <ul className="space-y-2">
              {result.recommendations.map((r, i) => (
                <li key={i} className="flex gap-2 text-sm">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" /> <span>{r}</span>
                </li>
              ))}
            </ul>
          </Section>

          <Section title="See a specialist" icon={Stethoscope}>
            <div className="flex flex-wrap gap-2">
              {result.recommended_specialists.map((s) => (
                <span
                  key={s}
                  className="rounded-full bg-accent/15 px-3 py-1 text-xs font-medium text-accent"
                >
                  {s}
                </span>
              ))}
            </div>
          </Section>

          <Section title="Watch for these red flags" icon={AlertTriangle}>
            <ul className="space-y-2">
              {result.red_flags.map((r, i) => (
                <li key={i} className="flex gap-2 text-sm">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />{" "}
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </Section>
        </div>

        <div className="mt-6 rounded-2xl border bg-muted/40 p-4 text-xs text-muted-foreground">
          <strong className="text-foreground">Disclaimer:</strong> This AI assessment is for
          informational purposes only and does not replace professional medical advice, diagnosis,
          or treatment.
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Button onClick={onReset} variant="outline">
            New assessment
          </Button>
          <Button asChild className="gradient-primary text-primary-foreground hover:opacity-90">
            <Link to="/dashboard">
              Go to dashboard <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: typeof Activity;
  children: React.ReactNode;
}) {
  return (
    <div className="glass rounded-3xl p-6">
      <h3 className="mb-4 flex items-center gap-2 font-semibold">
        <Icon className="h-4 w-4 text-accent" /> {title}
      </h3>
      {children}
    </div>
  );
}
