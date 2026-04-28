import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Activity, Mail, Lock, ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Sign in — Mediq" }, { name: "description", content: "Sign in or create your Mediq account." }] }),
  component: AuthPage,
});

const schema = z.object({
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z.string().min(8, "At least 8 characters").max(72),
  fullName: z.string().trim().min(1).max(100).optional(),
});

function AuthPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");

  const handle = async (mode: "in" | "up") => {
    const parsed = schema.safeParse({ email, password, fullName: mode === "up" ? fullName : undefined });
    if (!parsed.success) { toast.error(parsed.error.issues[0]?.message ?? "Invalid input"); return; }
    setLoading(true);
    try {
      if (mode === "up") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: `${window.location.origin}/dashboard`, data: { full_name: fullName } },
        });
        if (error) throw error;
        toast.success("Account created — check your email to confirm.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back");
        navigate({ to: "/dashboard" });
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Authentication failed";
      toast.error(msg.includes("already registered") ? "Account exists — try signing in." : msg);
    } finally { setLoading(false); }
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0 gradient-hero pointer-events-none" />
      <div className="container relative mx-auto flex min-h-screen items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <Link to="/" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Back home</Link>
          <div className="glass-strong rounded-3xl p-8 shadow-elegant">
            <div className="mb-6 flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary text-primary-foreground shadow-glow"><Activity className="h-5 w-5" /></div>
              <div><div className="text-lg font-semibold">Welcome to Mediq</div><div className="text-xs text-muted-foreground">Your AI care companion</div></div>
            </div>
            <Tabs defaultValue="in" className="w-full">
              <TabsList className="grid w-full grid-cols-2"><TabsTrigger value="in">Sign in</TabsTrigger><TabsTrigger value="up">Create account</TabsTrigger></TabsList>

              <TabsContent value="in" className="mt-5 space-y-4">
                <div className="space-y-1.5"><Label htmlFor="email-in">Email</Label><div className="relative"><Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input id="email-in" type="email" autoComplete="email" placeholder="you@example.com" className="pl-9" value={email} onChange={(e) => setEmail(e.target.value)} /></div></div>
                <div className="space-y-1.5"><Label htmlFor="pass-in">Password</Label><div className="relative"><Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input id="pass-in" type="password" autoComplete="current-password" placeholder="••••••••" className="pl-9" value={password} onChange={(e) => setPassword(e.target.value)} /></div></div>
                <Button onClick={() => handle("in")} disabled={loading} className="w-full gradient-primary text-primary-foreground hover:opacity-90 h-11">{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign in"}</Button>
              </TabsContent>

              <TabsContent value="up" className="mt-5 space-y-4">
                <div className="space-y-1.5"><Label htmlFor="name-up">Full name</Label><Input id="name-up" placeholder="Jane Doe" value={fullName} onChange={(e) => setFullName(e.target.value)} /></div>
                <div className="space-y-1.5"><Label htmlFor="email-up">Email</Label><div className="relative"><Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input id="email-up" type="email" autoComplete="email" placeholder="you@example.com" className="pl-9" value={email} onChange={(e) => setEmail(e.target.value)} /></div></div>
                <div className="space-y-1.5"><Label htmlFor="pass-up">Password</Label><div className="relative"><Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input id="pass-up" type="password" autoComplete="new-password" placeholder="At least 8 characters" className="pl-9" value={password} onChange={(e) => setPassword(e.target.value)} /></div></div>
                <Button onClick={() => handle("up")} disabled={loading} className="w-full gradient-primary text-primary-foreground hover:opacity-90 h-11">{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create account"}</Button>
              </TabsContent>
            </Tabs>
            <p className="mt-5 text-center text-xs text-muted-foreground">By continuing you agree to our Terms and Privacy Policy.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
