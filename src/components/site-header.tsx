import { Link } from "@tanstack/react-router";
import { Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";

export function SiteHeader() {
  const { user } = useAuth();
  return (
    <header className="sticky top-0 z-40 w-full">
      <div className="glass-strong border-0 border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2 font-semibold tracking-tight">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl gradient-primary text-primary-foreground shadow-glow">
              <Activity className="h-5 w-5" strokeWidth={2.5} />
            </div>
            <span className="text-lg">Mediq<span className="text-accent">.</span></span>
          </Link>
          <nav className="hidden items-center gap-8 md:flex">
            <Link to="/" className="text-sm text-muted-foreground transition hover:text-foreground">Home</Link>
            <a href="/#features" className="text-sm text-muted-foreground transition hover:text-foreground">Features</a>
            <a href="/#testimonials" className="text-sm text-muted-foreground transition hover:text-foreground">Reviews</a>
            <Link to="/symptoms" className="text-sm text-muted-foreground transition hover:text-foreground">Symptom AI</Link>
          </nav>
          <div className="flex items-center gap-2">
            {user ? (
              <Button asChild size="sm" className="gradient-primary text-primary-foreground hover:opacity-90">
                <Link to="/dashboard">Dashboard</Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm"><Link to="/auth">Sign in</Link></Button>
                <Button asChild size="sm" className="gradient-primary text-primary-foreground hover:opacity-90">
                  <Link to="/auth">Get started</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
