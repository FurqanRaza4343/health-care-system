import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Upload, FileScan, Loader2, AlertTriangle, CheckCircle2, Download, Share2, ZoomIn, ZoomOut, RotateCw, X, Sparkles, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/image-analyzer")({
  head: () => ({ meta: [
    { title: "Medical Image Analyzer — Mediq" },
    { name: "description", content: "Upload X-rays, MRIs, CT scans or skin photos for instant AI-powered analysis with confidence scores." },
  ] }),
  component: ImageAnalyzerPage,
});

type Finding = { label: string; description: string; confidence: number; severity: "normal" | "mild" | "moderate" | "severe"; region: string };
type Analysis = {
  modality: string; anatomy: string; overall_impression: string; confidence: number;
  urgency: "emergency" | "urgent" | "routine" | "normal";
  findings: Finding[]; differential_diagnosis: string[]; recommendations: string[]; limitations: string;
};

const TYPES = [
  { value: "xray", label: "X-Ray" },
  { value: "mri", label: "MRI" },
  { value: "ct", label: "CT Scan" },
  { value: "ultrasound", label: "Ultrasound" },
  { value: "skin", label: "Dermatology / Skin" },
  { value: "other", label: "Other" },
];

function ImageAnalyzerPage() { return <AppShell><Inner /></AppShell>; }

function Inner() {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageType, setImageType] = useState("xray");
  const [context, setContext] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState("");
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase.from("image_analyses").select("*").eq("patient_id", user.id).order("created_at", { ascending: false }).limit(6)
      .then(({ data }) => setHistory(data ?? []));
  }, [user, analysis]);

  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);

  const onFiles = (files: FileList | null) => {
    const f = files?.[0];
    if (!f) return;
    if (!f.type.startsWith("image/")) return toast.error("Please upload an image file.");
    if (f.size > 10 * 1024 * 1024) return toast.error("Max file size is 10 MB.");
    setFile(f);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(f));
    setAnalysis(null);
    setZoom(1); setRotation(0);
  };

  const reset = () => {
    setFile(null); setAnalysis(null); setProgress(0);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
  };

  const tickProgress = () => {
    const steps = [
      [15, "Uploading scan…"],
      [35, "Pre-processing image…"],
      [55, "Running vision model…"],
      [78, "Detecting anomalies…"],
      [92, "Compiling report…"],
    ] as const;
    let i = 0;
    const id = setInterval(() => {
      if (i >= steps.length) return clearInterval(id);
      setProgress(steps[i][0]); setProgressLabel(steps[i][1]); i++;
    }, 700);
    return () => clearInterval(id);
  };

  const analyze = async () => {
    if (!file || !user) return toast.error("Sign in and pick an image first.");
    setAnalyzing(true); setProgress(5); setProgressLabel("Preparing…");
    const cancel = tickProgress();
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("medical-images").upload(path, file, { upsert: false, contentType: file.type });
      if (upErr) throw upErr;
      const { data: signed } = await supabase.storage.from("medical-images").createSignedUrl(path, 60 * 60);
      const imageUrl = signed?.signedUrl;
      if (!imageUrl) throw new Error("Could not sign URL");

      const { data, error } = await supabase.functions.invoke("analyze-image", {
        body: { imageUrl, imageType, context },
      });
      cancel();
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const a = data.analysis as Analysis;
      setAnalysis(a);
      setProgress(100); setProgressLabel("Done");

      await supabase.from("image_analyses").insert({
        patient_id: user.id, title: file.name, image_url: path, image_type: imageType,
        ai_result: a as any, confidence: a.confidence, urgency: a.urgency,
      });
      toast.success("Analysis ready");
    } catch (e: any) {
      cancel();
      toast.error(e?.message || "Analysis failed");
    } finally {
      setAnalyzing(false);
    }
  };

  const downloadReport = () => {
    if (!analysis) return;
    const html = renderReportHTML(analysis, file?.name);
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `mediq-report-${Date.now()}.html`; a.click();
    URL.revokeObjectURL(url);
  };

  const share = async () => {
    if (!analysis) return;
    const text = `Mediq AI Analysis — ${analysis.overall_impression} (confidence ${(analysis.confidence * 100).toFixed(0)}%)`;
    if (navigator.share) { try { await navigator.share({ title: "Mediq Report", text }); return; } catch {} }
    await navigator.clipboard.writeText(text);
    toast.success("Summary copied to clipboard");
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Link to="/dashboard" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-3.5 w-3.5" /> Dashboard</Link>
            <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">Medical Image <span className="text-gradient">Analyzer</span></h1>
            <p className="mt-1 text-muted-foreground">AI-assisted preliminary review of X-rays, MRIs, CT scans, and skin photos.</p>
          </div>
          <Badge variant="secondary" className="hidden md:inline-flex"><Sparkles className="mr-1 h-3 w-3 text-accent" /> Gemini Vision</Badge>
        </div>

        <div className="grid gap-6 lg:grid-cols-5">
          {/* Left: upload + preview */}
          <Card className="glass p-5 lg:col-span-3">
            {!previewUrl ? (
              <div
                onDragEnter={(e) => { e.preventDefault(); setDragActive(true); }}
                onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                onDragLeave={() => setDragActive(false)}
                onDrop={(e) => { e.preventDefault(); setDragActive(false); onFiles(e.dataTransfer.files); }}
                onClick={() => fileInputRef.current?.click()}
                className={`group relative flex h-[420px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed transition ${dragActive ? "border-accent bg-accent/5 scale-[1.01]" : "border-border hover:border-primary/50 hover:bg-muted/30"}`}
              >
                <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={(e) => onFiles(e.target.files)} />
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl gradient-primary text-primary-foreground shadow-glow animate-float">
                  <Upload className="h-9 w-9" />
                </div>
                <p className="mt-5 text-lg font-semibold">Drop your medical image here</p>
                <p className="mt-1 text-sm text-muted-foreground">or click to browse · PNG, JPG, WEBP · max 10 MB</p>
                <div className="mt-6 flex flex-wrap justify-center gap-2 text-xs text-muted-foreground">
                  {TYPES.map(t => <span key={t.value} className="rounded-full border bg-card/60 px-3 py-1">{t.label}</span>)}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative overflow-hidden rounded-2xl bg-black/90" style={{ height: 420 }}>
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="h-full w-full object-contain transition-transform duration-200"
                    style={{ transform: `scale(${zoom}) rotate(${rotation}deg)` }}
                  />
                  {analyzing && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                      <div className="w-72 space-y-3 text-center text-white">
                        <Loader2 className="mx-auto h-10 w-10 animate-spin text-accent" />
                        <p className="text-sm font-medium">{progressLabel}</p>
                        <Progress value={progress} className="h-1.5" />
                      </div>
                    </div>
                  )}
                  {analysis && analysis.findings.slice(0, 4).map((f, i) => (
                    <div key={i} className="absolute rounded-lg border-2 border-accent/80 bg-accent/10 px-2 py-1 text-[10px] font-semibold text-white shadow-glow"
                      style={{ top: `${15 + i * 18}%`, left: `${20 + (i % 2) * 40}%` }}>
                      {f.label}
                    </div>
                  ))}
                  <div className="absolute right-3 top-3 flex gap-1">
                    <Button size="icon" variant="secondary" className="h-8 w-8" onClick={() => setZoom(z => Math.min(3, z + 0.2))}><ZoomIn className="h-4 w-4" /></Button>
                    <Button size="icon" variant="secondary" className="h-8 w-8" onClick={() => setZoom(z => Math.max(0.5, z - 0.2))}><ZoomOut className="h-4 w-4" /></Button>
                    <Button size="icon" variant="secondary" className="h-8 w-8" onClick={() => setRotation(r => r + 90)}><RotateCw className="h-4 w-4" /></Button>
                    <Button size="icon" variant="destructive" className="h-8 w-8" onClick={reset}><X className="h-4 w-4" /></Button>
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium">Image type</label>
                    <Select value={imageType} onValueChange={setImageType}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium">Clinical context (optional)</label>
                    <Textarea value={context} onChange={(e) => setContext(e.target.value)} placeholder="e.g. 32yo male, persistent cough 2 weeks" rows={1} />
                  </div>
                </div>

                <Button size="lg" onClick={analyze} disabled={analyzing} className="w-full gradient-primary">
                  {analyzing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyzing…</> : <><Sparkles className="mr-2 h-4 w-4" /> Run AI analysis</>}
                </Button>
              </div>
            )}
          </Card>

          {/* Right: results */}
          <div className="space-y-4 lg:col-span-2">
            {!analysis ? (
              <Card className="glass flex h-[420px] flex-col items-center justify-center p-6 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
                  <FileScan className="h-7 w-7 text-muted-foreground" />
                </div>
                <p className="mt-4 font-semibold">Awaiting analysis</p>
                <p className="mt-1 text-sm text-muted-foreground max-w-xs">Upload a scan to receive a structured AI report with findings, confidence, and recommendations.</p>
              </Card>
            ) : (
              <Card className="glass-strong overflow-hidden p-0">
                <div className={`flex items-start gap-3 p-5 ${urgencyBg(analysis.urgency)}`}>
                  {urgencyIcon(analysis.urgency)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold">{analysis.modality} · {analysis.anatomy}</h3>
                      <Badge variant="outline" className="text-[10px]">{analysis.urgency.toUpperCase()}</Badge>
                    </div>
                    <p className="mt-1 text-sm">{analysis.overall_impression}</p>
                  </div>
                </div>

                <div className="p-5">
                  <div className="mb-4">
                    <div className="mb-1.5 flex items-center justify-between text-xs font-medium">
                      <span>Overall confidence</span><span>{(analysis.confidence * 100).toFixed(0)}%</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div className="h-full gradient-accent transition-all" style={{ width: `${analysis.confidence * 100}%` }} />
                    </div>
                  </div>

                  <Tabs defaultValue="findings">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="findings">Findings</TabsTrigger>
                      <TabsTrigger value="diff">Differential</TabsTrigger>
                      <TabsTrigger value="recs">Next steps</TabsTrigger>
                    </TabsList>
                    <TabsContent value="findings" className="space-y-2">
                      {analysis.findings.length === 0 && <p className="text-sm text-muted-foreground">No discrete findings detected.</p>}
                      {analysis.findings.map((f, i) => (
                        <div key={i} className="rounded-xl border bg-card/60 p-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold">{f.label}</span>
                            <Badge className={severityCls(f.severity)}>{f.severity}</Badge>
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">{f.description}</p>
                          <div className="mt-2 flex items-center justify-between text-[11px]">
                            <span className="text-muted-foreground">{f.region}</span>
                            <span className="font-medium">{(f.confidence * 100).toFixed(0)}% confidence</span>
                          </div>
                          <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-muted">
                            <div className="h-full bg-primary" style={{ width: `${f.confidence * 100}%` }} />
                          </div>
                        </div>
                      ))}
                    </TabsContent>
                    <TabsContent value="diff" className="space-y-1.5">
                      {analysis.differential_diagnosis.map((d, i) => (
                        <div key={i} className="flex items-start gap-2 rounded-lg bg-muted/50 p-2 text-sm">
                          <span className="mt-1 h-1.5 w-1.5 rounded-full bg-accent" /> {d}
                        </div>
                      ))}
                    </TabsContent>
                    <TabsContent value="recs" className="space-y-1.5">
                      {analysis.recommendations.map((r, i) => (
                        <div key={i} className="flex items-start gap-2 rounded-lg bg-muted/50 p-2 text-sm">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 text-success" /> {r}
                        </div>
                      ))}
                      <p className="mt-3 rounded-lg border border-warning/40 bg-warning/10 p-2 text-xs text-warning-foreground">
                        <strong>Limitations:</strong> {analysis.limitations}
                      </p>
                    </TabsContent>
                  </Tabs>

                  <div className="mt-5 flex gap-2">
                    <Button variant="outline" className="flex-1" onClick={downloadReport}><Download className="mr-2 h-4 w-4" /> Report</Button>
                    <Button variant="outline" className="flex-1" onClick={share}><Share2 className="mr-2 h-4 w-4" /> Share</Button>
                  </div>
                </div>
              </Card>
            )}

            {history.length > 0 && (
              <Card className="glass p-4">
                <h4 className="mb-3 text-sm font-semibold">Recent scans</h4>
                <div className="space-y-2">
                  {history.map(h => (
                    <div key={h.id} className="flex items-center justify-between rounded-lg bg-muted/40 p-2 text-sm">
                      <span className="truncate">{h.title || "Scan"}</span>
                      <Badge variant="outline" className="text-[10px]">{h.urgency || "—"}</Badge>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Mediq AI provides preliminary analysis only and does not replace professional radiology. Always consult a licensed clinician.
        </p>
      </div>
    </div>
  );
}

function urgencyBg(u: string) {
  if (u === "emergency") return "bg-destructive/10 border-b border-destructive/30";
  if (u === "urgent") return "bg-warning/10 border-b border-warning/30";
  if (u === "routine") return "bg-accent/10 border-b border-accent/30";
  return "bg-success/10 border-b border-success/30";
}
function urgencyIcon(u: string) {
  if (u === "emergency" || u === "urgent") return <AlertTriangle className="h-6 w-6 text-warning" />;
  return <CheckCircle2 className="h-6 w-6 text-success" />;
}
function severityCls(s: string) {
  if (s === "severe") return "bg-destructive text-destructive-foreground";
  if (s === "moderate") return "bg-warning text-warning-foreground";
  if (s === "mild") return "bg-accent/20 text-accent-foreground border-accent/40";
  return "bg-success/20 text-success-foreground border-success/40";
}

function renderReportHTML(a: Analysis, name?: string) {
  return `<!doctype html><html><head><meta charset="utf-8"><title>Mediq Report</title>
<style>body{font-family:Inter,system-ui,sans-serif;max-width:780px;margin:40px auto;padding:0 24px;color:#0A2463}
h1{background:linear-gradient(135deg,#0A2463,#00B4D8);-webkit-background-clip:text;color:transparent}
.card{border:1px solid #e5e7eb;border-radius:14px;padding:18px;margin:12px 0}
.bar{height:8px;border-radius:6px;background:#eef;overflow:hidden}.bar>div{height:100%;background:linear-gradient(90deg,#0A2463,#00B4D8)}
.tag{display:inline-block;padding:2px 8px;border-radius:99px;font-size:11px;background:#eef;margin-right:4px}</style></head>
<body><h1>Mediq AI Image Report</h1>
<p><strong>${a.modality}</strong> · ${a.anatomy} · ${name ?? ""}</p>
<div class="card"><strong>Impression:</strong> ${a.overall_impression}<br><br>
<div class="bar"><div style="width:${a.confidence * 100}%"></div></div>
<small>Overall confidence: ${(a.confidence * 100).toFixed(0)}%</small></div>
<div class="card"><h3>Findings</h3>${a.findings.map(f => `<div style="margin:8px 0"><strong>${f.label}</strong> <span class="tag">${f.severity}</span><br><small>${f.region} · ${(f.confidence * 100).toFixed(0)}%</small><p>${f.description}</p></div>`).join("")}</div>
<div class="card"><h3>Differential</h3><ul>${a.differential_diagnosis.map(d => `<li>${d}</li>`).join("")}</ul></div>
<div class="card"><h3>Recommendations</h3><ul>${a.recommendations.map(r => `<li>${r}</li>`).join("")}</ul>
<p><em>${a.limitations}</em></p></div>
<p style="font-size:11px;color:#64748b">Preliminary AI analysis. Not a substitute for licensed medical review.</p>
</body></html>`;
}
