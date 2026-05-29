import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Sparkles, Loader2, ArrowRight, Globe, Mail, Settings, HelpCircle, MessageCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { ENTITY_TYPES, TERRITORIES, usePrograms } from "@/lib/programs";
import { matchPrograms } from "@/lib/matching";
import type { UserProfile } from "@/lib/matching";
import { scrapeSite } from "@/lib/scraper";
import { supabase } from "@/lib/supabaseClient";

export const Route = createFileRoute("/")({
  component: Index,
});

const DEFAULT_PROFILE: UserProfile = {
  organization_type: "",
  sector: "",
  core_activity: "",
  country: "",
  works_with_youth: false,
  can_mobilize_5_plus_youth: false,
  can_host_individuals: false,
  has_eu_partners: false,
  coordinator_available: false,
  previous_experience: "none",
  budget_target: 0,
  preferred_duration: "medium",
};

function Index() {
  const programs = usePrograms();
  const [url, setUrl] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [profile, setProfile] = React.useState<UserProfile>(DEFAULT_PROFILE);
  const [flashed, setFlashed] = React.useState<Set<string>>(new Set());
  const [submitted, setSubmitted] = React.useState(false);
  const [showLeadModal, setShowLeadModal] = React.useState(false);
  const resultsRef = React.useRef<HTMLDivElement>(null);

  const matches = React.useMemo(
    () => (submitted ? matchPrograms(programs, profile) : []),
    [programs, profile, submitted],
  );

  function flash(...keys: string[]) {
    setFlashed(new Set(keys));
    setTimeout(() => setFlashed(new Set()), 1700);
  }

  async function analyze() {
    if (!url.trim()) {
      toast.error("Drop a URL first");
      return;
    }
    setLoading(true);
    try {
      const res = await scrapeSite(url);
      setProfile((p) => ({
        ...p,
        organization_type: res.organization_type ?? p.organization_type,
        sector: res.sector ?? p.sector,
        country: res.country ?? p.country,
        core_activity: res.core_activity ?? p.core_activity,
        works_with_youth: res.works_with_youth ?? p.works_with_youth,
      }));
      flash("organization_type", "sector", "country", "core_activity");
      toast.success("Site analysed — fields auto-filled");
    } catch {
      toast.error("Couldn't analyse that URL");
    } finally {
      setLoading(false);
    }
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setShowLeadModal(true);
  }

  function onLeadConfirm() {
    setShowLeadModal(false);
    setSubmitted(true);
    setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  }

  return (
    <div className="min-h-screen bg-white text-black">
      <Toaster />
      <Nav />

      {/* HERO + SCRAPER */}
      <section className="border-b-2 border-black bg-hey">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="inline-block bg-black px-3 py-1 text-xs font-bold uppercase tracking-widest text-hey">
            hey! funding
          </div>
          <h1 className="mt-6 text-5xl font-black leading-[0.95] md:text-7xl">
            Find funding<br />that actually<br />fits you.
          </h1>
          <p className="mt-6 max-w-xl text-lg font-medium">
            Paste your org's website. We pre-fill your profile, you tweak it,
            and we match you against live programs — sorted by relevance.
          </p>

          <div className="mt-10 brutal-card bg-white p-4 md:p-6 max-w-3xl">
            <Label htmlFor="url" className="text-xs font-bold uppercase tracking-widest">
              Your website
            </Label>
            <div className="mt-2 flex flex-col gap-3 md:flex-row">
              <div className="flex-1 flex items-center brutal-border bg-white px-3">
                <Globe className="h-4 w-4 mr-2" />
                <Input
                  id="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://your-organization.org"
                  className="border-0 shadow-none focus-visible:ring-0 h-12 text-base px-0"
                />
              </div>
              <Button
                onClick={analyze}
                disabled={loading}
                className="h-12 px-6 bg-black text-hey hover:bg-black brutal-border brutal-shadow brutal-hover font-bold uppercase tracking-wider"
              >
                {loading ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Analyzing…</>
                ) : (
                  <><Sparkles className="h-4 w-4" /> Analyse site</>
                )}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* PROFILE FORM */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <SectionTitle index="02" title="Your profile" />
        <form onSubmit={submit} className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
          <Field label="Organization type" flash={flashed.has("organization_type")}>
            <BrutalSelect
              value={profile.organization_type}
              onChange={(v) => setProfile({ ...profile, organization_type: v })}
              options={ENTITY_TYPES}
            />
          </Field>

          <Field label="Country / territory" flash={flashed.has("country")}>
            <BrutalSelect
              value={profile.country}
              onChange={(v) => setProfile({ ...profile, country: v })}
              options={TERRITORIES}
            />
          </Field>

          <Field label="Sector" flash={flashed.has("sector")}>
            <Input
              value={profile.sector}
              onChange={(e) => setProfile({ ...profile, sector: e.target.value })}
              className="h-12 brutal-border bg-white shadow-none rounded-none"
              placeholder="e.g. Youth & education"
            />
          </Field>

          <Field label="Core activity" flash={flashed.has("core_activity")}>
            <Input
              value={profile.core_activity}
              onChange={(e) => setProfile({ ...profile, core_activity: e.target.value })}
              className="h-12 brutal-border bg-white shadow-none rounded-none"
              placeholder="What you actually do"
            />
          </Field>

          <Field label="Target budget (EUR)">
            <Input
              type="number"
              value={profile.budget_target}
              onChange={(e) =>
                setProfile({ ...profile, budget_target: Number(e.target.value) || 0 })
              }
              className="h-12 brutal-border bg-white shadow-none rounded-none"
            />
          </Field>

          <Field label="Previous experience">
            <RadioGroup
              value={profile.previous_experience}
              onValueChange={(v) =>
                setProfile({ ...profile, previous_experience: v as UserProfile["previous_experience"] })
              }
              className="flex gap-2"
            >
              {(["none", "some", "extensive"] as const).map((v) => (
                <label
                  key={v}
                  className={`flex-1 brutal-border px-4 py-3 cursor-pointer font-bold uppercase text-xs tracking-wider ${profile.previous_experience === v ? "bg-hey" : "bg-white"
                    }`}
                >
                  <RadioGroupItem value={v} className="sr-only" />
                  {v}
                </label>
              ))}
            </RadioGroup>
          </Field>

          <Field label="Preferred project duration">
            <RadioGroup
              value={profile.preferred_duration}
              onValueChange={(v) =>
                setProfile({ ...profile, preferred_duration: v as UserProfile["preferred_duration"] })
              }
              className="flex gap-2"
            >
              {[
                ["short", "<6 mo"],
                ["medium", "6–18 mo"],
                ["long", ">18 mo"],
              ].map(([v, label]) => (
                <label
                  key={v}
                  className={`flex-1 brutal-border px-4 py-3 cursor-pointer font-bold uppercase text-xs tracking-wider ${profile.preferred_duration === v ? "bg-hey" : "bg-white"
                    }`}
                >
                  <RadioGroupItem value={v} className="sr-only" />
                  {label}
                </label>
              ))}
            </RadioGroup>
          </Field>

          <div className="md:col-span-2">
            <Label className="text-xs font-bold uppercase tracking-widest">Capabilities</Label>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {([
                ["works_with_youth", "We work with young people"],
                ["can_mobilize_5_plus_youth", "Can mobilize 5+ youth"],
                ["can_host_individuals", "Can host individuals"],
                ["has_eu_partners", "We have EU partners"],
                ["coordinator_available", "Coordinator available"],
              ] as const).map(([key, label]) => (
                <label
                  key={key}
                  className="flex items-center gap-3 brutal-border bg-white px-4 py-3 cursor-pointer brutal-hover"
                >
                  <Checkbox
                    checked={profile[key] as boolean}
                    onCheckedChange={(c) =>
                      setProfile({ ...profile, [key]: Boolean(c) })
                    }
                    className="h-5 w-5 rounded-none brutal-border data-[state=checked]:bg-hey data-[state=checked]:text-black"
                  />
                  <span className="font-medium">{label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="md:col-span-2 flex justify-end">
            <Button
              type="submit"
              className="h-14 px-8 bg-black text-hey hover:bg-black brutal-border brutal-shadow brutal-hover font-bold uppercase tracking-wider text-base"
            >
              Match my org <ArrowRight className="h-5 w-5" />
            </Button>
          </div>
        </form>
      </section>

      {/* RESULTS */}
      {submitted && (
        <section ref={resultsRef} className="border-t-2 border-black bg-[#fafafa]">
          <div className="mx-auto max-w-6xl px-6 py-16">
            {(() => {
              const relevant = matches.filter((m) => m.score > 70);
              if (relevant.length === 0) {
                return (
                  <div className="brutal-card bg-white p-8 md:p-12 max-w-2xl">
                    <SectionTitle index="03" title="No matches found" />
                    <div className="mt-6 space-y-4 text-sm leading-relaxed">
                      <p>
                        We haven't found a specific program for you. We haven't identified a
                        program that clearly matches your profile right now — but that doesn't
                        mean there aren't any options.
                      </p>
                      <p>
                        Every organization is unique, and sometimes it needs to be analysed in
                        detail to find the right opportunity. We can do that analysis with you
                        free of charge and tailored to your needs.
                      </p>
                      <p className="font-bold">
                        Tell us about your organization and we'll do a free, personalised
                        analysis to find the best European option for you.
                      </p>
                    </div>
                    <a
                      href="mailto:hello@heyfunding.eu?subject=I%20want%20a%20personalised%20analysis"
                      className="mt-8 inline-flex items-center gap-2 bg-black text-hey px-5 py-3 font-bold uppercase tracking-wider text-sm brutal-border brutal-shadow brutal-hover"
                    >
                      I want a personalised analysis →
                    </a>
                  </div>
                );
              }
              return (
                <>
                  <SectionTitle index="03" title={`${relevant.length} programs matched`} />
                  <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {relevant.map(({ program, score }) => (
                      <ProgramCard key={program.id} p={program} score={score} />
                    ))}
                  </div>
                </>
              );
            })()}
          </div>
        </section>
      )}

      {showLeadModal && <LeadModal onConfirm={onLeadConfirm} />}
      <HelpButton />
      <Footer />
    </div>
  );
}

function Nav() {
  return (
    <nav className="border-b-2 border-black bg-white">
      <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <span className="bg-black text-hey px-2 py-1 font-black text-lg">hey!</span>
          <span className="font-bold tracking-tight">funding</span>
        </Link>
        <Link
          to="/admin"
          className="inline-flex items-center gap-2 brutal-border bg-white px-3 py-2 text-xs font-bold uppercase tracking-widest brutal-hover"
        >
          <Settings className="h-3.5 w-3.5" /> Admin
        </Link>
      </div>
    </nav>
  );
}

function SectionTitle({ index, title }: { index: string; title: string }) {
  return (
    <div className="flex items-end gap-4">
      <span className="text-xs font-bold uppercase tracking-widest bg-black text-hey px-2 py-1">
        {index}
      </span>
      <h2 className="text-3xl md:text-4xl font-black">{title}</h2>
    </div>
  );
}

function Field({
  label, flash, children,
}: { label: string; flash?: boolean; children: React.ReactNode }) {
  return (
    <div className={flash ? "flash-yellow p-2 -m-2" : ""}>
      <Label className="text-xs font-bold uppercase tracking-widest">{label}</Label>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function BrutalSelect({
  value, onChange, options,
}: { value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-12 brutal-border bg-white shadow-none rounded-none font-medium">
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="brutal-border rounded-none">
        {options.map((o) => (
          <SelectItem key={o} value={o} className="rounded-none">
            {o}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function ProgramCard({ p, score }: { p: import("@/lib/programs").Program; score: number }) {
  const tone =
    score >= 75 ? "bg-hey" : score >= 50 ? "bg-white" : "bg-[#f0f0f0]";
  return (
    <article className={`brutal-card p-5 flex flex-col gap-4 brutal-hover ${tone}`}>
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-xl font-black leading-tight">{p.program}</h3>
        <span className="shrink-0 bg-black text-hey px-2 py-1 text-sm font-black">
          {score}%
        </span>
      </div>
      <p className="text-sm font-medium">{p.short_description}</p>
      <dl className="grid grid-cols-2 gap-2 text-xs">
        <Meta k="Funding" v={`${p.approx_funding.toLocaleString()}`} />
        <Meta k="Duration" v={p.project_duration} />
        <Meta k="Deadline" v={p.call_deadline} />
        <Meta k="Difficulty" v={p.difficulty_level} />
      </dl>
      <div className="mt-auto pt-2 border-t-2 border-black flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider">{p.manager}</span>
        <a
          href={`mailto:hello@heyfunding.eu?subject=${encodeURIComponent(p.program)}`}
          className="inline-flex items-center gap-1 bg-black text-hey px-3 py-2 text-xs font-bold uppercase tracking-wider brutal-hover"
        >
          <Mail className="h-3 w-3" /> Contact HEY
        </a>
      </div>
    </article>
  );
}

function Meta({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <dt className="font-bold uppercase tracking-wider text-[10px] opacity-70">{k}</dt>
      <dd className="font-bold">{v}</dd>
    </div>
  );
}

function LeadModal({ onConfirm }: { onConfirm: () => void }) {
  const [orgName, setOrgName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!orgName.trim() || !email.trim()) return;
    setSubmitting(true);
    try {
      await supabase.from("user_emails").insert({
        organization_name: orgName.trim(),
        email: email.trim(),
        has_contacted_hey: false,
      });
    } catch {
      // fail-open: don't block the user if the insert fails
    } finally {
      setSubmitting(false);
      onConfirm();
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="brutal-card bg-white w-full max-w-md mx-6 p-8">
        <div className="mb-6">
          <span className="text-xs font-bold uppercase tracking-widest bg-black text-hey px-2 py-1">
            Almost there
          </span>
          <h2 className="mt-4 text-3xl font-black leading-tight">
            Who are we<br />matching?
          </h2>
          <p className="mt-2 text-sm font-medium text-black/60">
            We'll send your results and keep you updated on new programs.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="text-xs font-bold uppercase tracking-widest">
              Organisation name
            </Label>
            <Input
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              required
              placeholder="e.g. Youth Connect Spain"
              className="mt-2 h-12 brutal-border bg-white shadow-none rounded-none"
            />
          </div>
          <div>
            <Label className="text-xs font-bold uppercase tracking-widest">
              Contact email
            </Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@yourorg.eu"
              className="mt-2 h-12 brutal-border bg-white shadow-none rounded-none"
            />
          </div>
          <Button
            type="submit"
            disabled={submitting || !orgName.trim() || !email.trim()}
            className="mt-2 w-full h-12 bg-black text-hey hover:bg-black brutal-border brutal-shadow brutal-hover font-bold uppercase tracking-wider"
          >
            {submitting ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</>
            ) : (
              <>View results <ArrowRight className="h-4 w-4" /></>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}

function HelpButton() {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
      )}

      <div
        className={`fixed bottom-24 right-6 z-50 w-72 bg-white brutal-card transition-all duration-200 ${
          open ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3 pointer-events-none"
        }`}
      >
        <div className="border-b-2 border-black px-4 py-3 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-widest">Get in touch</span>
          <button
            onClick={() => setOpen(false)}
            className="h-6 w-6 flex items-center justify-center brutal-border brutal-hover"
            aria-label="Close"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
        <div className="p-4 space-y-3">
          <a
            href="https://wa.me/34614434733"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 brutal-border bg-hey px-4 py-3 brutal-hover"
          >
            <MessageCircle className="h-5 w-5 shrink-0" />
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest">WhatsApp</div>
              <div className="text-sm font-black">+34 614 43 47 33</div>
              <div className="text-[10px] font-medium uppercase tracking-wider opacity-60">Quick response</div>
            </div>
          </a>
          <a
            href="mailto:hey@hieuropeanyouth.com"
            className="flex items-center gap-3 brutal-border bg-white px-4 py-3 brutal-hover"
          >
            <Mail className="h-5 w-5 shrink-0" />
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest">E-mail</div>
              <div className="text-sm font-black">hey@hieuropeanyouth.com</div>
            </div>
          </a>
        </div>
      </div>

      <button
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-6 right-6 z-50 h-14 w-14 bg-black text-hey brutal-border brutal-shadow brutal-hover flex items-center justify-center"
        aria-label="Help and contact"
      >
        <HelpCircle className="h-6 w-6" />
      </button>
    </>
  );
}

function Footer() {
  return (
    <footer className="border-t-2 border-black bg-black text-white">
      <div className="mx-auto max-w-6xl px-6 py-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <span className="font-black text-xl"><span className="text-hey">hey!</span> funding</span>
        <span className="text-xs uppercase tracking-widest opacity-70">
          built for orgs that move fast
        </span>
      </div>
    </footer>
  );
}
