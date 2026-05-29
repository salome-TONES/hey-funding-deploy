import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus, Pencil, Archive, ArchiveRestore, Trash2, Lock, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";

// Centralized connection client file
import { supabase } from "@/lib/supabaseClient";

const ENTITY_TYPES = ["NGO", "Education", "Company", "Public Administration", "Sports Centers", "Association", "Informal Youth Group", "Social Enterprise"];
const TERRITORIES = ["Spain", "Valencia", "Murcia", "Catalonia", "EU Countries", "Associated Third Countries"];

export interface Program {
  id: string;
  program: string;
  manager: string;
  entity_types: string[];
  territory: string[];
  eu_partners_required: boolean;
  works_with_youth: boolean;
  can_host_individuals: boolean;
  can_mobilize_5_plus_youth: boolean;
  coordinator_available: boolean;
  previous_experience_required: string;
  approx_funding: string | number;
  project_duration: string;
  call_deadline: string;
  difficulty_level: string;
  is_active: boolean;
  short_description: string;
  in_a_nutshell: string;
}

export const Route = createFileRoute("/admin")({
  component: Admin,
});

function Admin() {
  const [sessionUser, setSessionUser] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let isMounted = true;
    let subscription: any = null;

    async function initializeAuth() {
      try {
        // Fallback protection if client configuration keys aren't loaded or fully resolved
        if (!supabase || !supabase.auth) {
          throw new Error("Supabase client failed initialization. Verify your project .env configurations.");
        }

        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;

        if (isMounted) {
          setSessionUser(session?.user ?? null);
        }

        // Setup secure subscription listener loops 
        const { data } = supabase.auth.onAuthStateChange((_event, session) => {
          if (isMounted) {
            setSessionUser(session?.user ?? null);
          }
        });
        subscription = data?.subscription;

      } catch (err: any) {
        console.error("Auth Loop Exception:", err);
        toast.error(`Configuration Error: ${err.message || "Failed to link auth profile."}`);

        // Safety Valve: Force loader to false on runtime failure so dashboard layouts don't lock permanently
        if (isMounted) setSessionUser(null);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    initializeAuth();

    return () => {
      isMounted = false;
      if (subscription && typeof subscription.unsubscribe === "function") {
        subscription.unsubscribe();
      }
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-hey">
        <div className="text-center space-y-4">
          <h1 className="text-xl font-black uppercase tracking-widest animate-pulse">Loading Dashboard...</h1>
          <p className="text-xs opacity-60">Connecting to secure database pipelines...</p>
        </div>
      </div>
    );
  }

  if (!sessionUser) return <Login />;
  return <Dashboard onLogout={async () => await supabase.auth.signOut()} />;
}

function Login() {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      toast.success("Welcome back, Clara!");
      setSubmitting(false);
    } catch (err: any) {
      toast.error(err.message || "Invalid login credentials.");
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen grid place-items-center bg-hey p-6">
      <Toaster />
      <form onSubmit={submit} className="brutal-card bg-white p-8 w-full max-w-md">
        <div className="flex items-center gap-2 mb-6">
          <Lock className="h-5 w-5" />
          <h1 className="text-2xl font-black">Clara's dashboard</h1>
        </div>

        <div className="space-y-4">
          <div>
            <Label className="text-xs font-bold uppercase tracking-widest">Admin Email</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-2 h-12 brutal-border rounded-none shadow-none"
              placeholder="Admin email"
              required
              autoFocus
            />
          </div>

          <div>
            <Label className="text-xs font-bold uppercase tracking-widest">Password</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-2 h-12 brutal-border rounded-none shadow-none"
              placeholder="••••••••"
              required
            />
          </div>
        </div>

        <Button
          type="submit"
          disabled={submitting}
          className="mt-6 w-full h-12 bg-black text-hey hover:bg-black brutal-border brutal-shadow brutal-hover font-bold uppercase tracking-wider disabled:opacity-50"
        >
          {submitting ? "Authenticating..." : "Enter"}
        </Button>
        <Link to="/" className="block mt-4 text-center text-xs underline">← Back to site</Link>
      </form>
    </div>
  );
}

type AnalyticsEvent = {
  id: string;
  created_at: string;
  event_name: string;
  metadata: Record<string, unknown> | null;
};

type Lead = {
  id: string;
  created_at: string;
  organization_name: string;
  email: string;
  has_contacted_hey: boolean;
};

function AnalyticsDashboard() {
  const [events, setEvents] = React.useState<AnalyticsEvent[]>([]);
  const [leads, setLeads] = React.useState<Lead[]>([]);
  const [range, setRange] = React.useState<7 | 30 | 0>(7);
  const [loadingEvents, setLoadingEvents] = React.useState(true);
  const [loadingLeads, setLoadingLeads] = React.useState(true);

  React.useEffect(() => {
    async function fetchEvents() {
      setLoadingEvents(true);
      let query = supabase
        .from("analytics_events")
        .select("*")
        .order("created_at", { ascending: false });
      if (range > 0) {
        const since = new Date();
        since.setDate(since.getDate() - range);
        query = query.gte("created_at", since.toISOString());
      }
      const { data, error } = await query;
      if (!error && data) setEvents(data as AnalyticsEvent[]);
      setLoadingEvents(false);
    }
    fetchEvents();
  }, [range]);

  React.useEffect(() => {
    async function fetchLeads() {
      setLoadingLeads(true);
      const { data, error } = await supabase
        .from("user_emails")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (!error && data) setLeads(data as Lead[]);
      setLoadingLeads(false);
    }
    fetchLeads();
  }, []);

  async function toggleContacted(id: string, current: boolean) {
    const { error } = await supabase
      .from("user_emails")
      .update({ has_contacted_hey: !current })
      .eq("id", id);
    if (!error) {
      setLeads((prev) => prev.map((l) => l.id === id ? { ...l, has_contacted_hey: !current } : l));
    }
  }

  function count(name: string) {
    return events.filter((e) => e.event_name === name).length;
  }

  function pct(a: number, b: number) {
    if (b === 0) return "—";
    return Math.round((a / b) * 100) + "%";
  }

  const pageViews = count("page_view");
  const analysed = count("analyse_site");
  const matched = count("match_submitted");
  const captured = count("lead_captured");

  const programCounts: Record<string, number> = {};
  events
    .filter((e) => e.event_name === "program_contact" && e.metadata?.program)
    .forEach((e) => {
      const name = e.metadata!.program as string;
      programCounts[name] = (programCounts[name] || 0) + 1;
    });
  const topPrograms = Object.entries(programCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);

  return (
    <main className="mx-auto max-w-7xl px-6 py-10 space-y-12">
      {/* Time filter */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold uppercase tracking-widest mr-1">Period:</span>
        {([7, 30, 0] as const).map((r) => (
          <button
            key={r}
            onClick={() => setRange(r)}
            className={`brutal-border px-3 py-1.5 text-xs font-bold uppercase tracking-wider brutal-hover ${range === r ? "bg-black text-hey" : "bg-white"}`}
          >
            {r === 0 ? "All time" : `${r}d`}
          </button>
        ))}
      </div>

      {/* Funnel */}
      <section>
        <div className="flex items-end gap-3 mb-5">
          <span className="text-xs font-bold uppercase tracking-widest bg-black text-hey px-2 py-1">01</span>
          <h2 className="text-2xl font-black">User funnel</h2>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Page views", value: pageViews, prev: null },
            { label: "Site analysed", value: analysed, prev: pageViews },
            { label: "Match submitted", value: matched, prev: analysed },
            { label: "Lead captured", value: captured, prev: matched },
          ].map(({ label, value, prev }) => (
            <div key={label} className="brutal-card bg-white p-5">
              <div className="text-5xl font-black">{loadingEvents ? "—" : value}</div>
              <div className="mt-2 text-[10px] font-bold uppercase tracking-widest opacity-60">{label}</div>
              {prev !== null && !loadingEvents && (
                <div className="mt-3 inline-block bg-hey px-2 py-0.5 text-xs font-black">
                  {pct(value, prev)} conv.
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Contact events */}
      <section>
        <div className="flex items-end gap-3 mb-5">
          <span className="text-xs font-bold uppercase tracking-widest bg-black text-hey px-2 py-1">02</span>
          <h2 className="text-2xl font-black">Contact clicks</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="brutal-card bg-white p-5">
            <div className="text-5xl font-black">{loadingEvents ? "—" : count("help_whatsapp")}</div>
            <div className="mt-2 text-[10px] font-bold uppercase tracking-widest opacity-60">WhatsApp taps</div>
          </div>
          <div className="brutal-card bg-white p-5">
            <div className="text-5xl font-black">{loadingEvents ? "—" : count("help_email")}</div>
            <div className="mt-2 text-[10px] font-bold uppercase tracking-widest opacity-60">Email clicks</div>
          </div>
          <div className="brutal-card bg-white p-5">
            <div className="text-5xl font-black">{loadingEvents ? "—" : count("program_contact")}</div>
            <div className="mt-2 text-[10px] font-bold uppercase tracking-widest opacity-60">Program contacts</div>
          </div>
        </div>
        {topPrograms.length > 0 && (
          <div className="mt-4 brutal-card bg-white p-5">
            <div className="text-[10px] font-bold uppercase tracking-widest mb-4">Top programs clicked</div>
            <div className="space-y-2">
              {topPrograms.map(([name, n]) => (
                <div key={name} className="flex items-center justify-between border-b border-black/10 pb-2 last:border-0 last:pb-0">
                  <span className="text-sm font-bold">{name}</span>
                  <span className="bg-hey px-2 py-0.5 text-xs font-black">{n}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Leads table */}
      <section>
        <div className="flex items-end gap-3 mb-5">
          <span className="text-xs font-bold uppercase tracking-widest bg-black text-hey px-2 py-1">03</span>
          <h2 className="text-2xl font-black">Recent leads</h2>
        </div>
        <div className="border-2 border-black overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-black bg-[#fafafa]">
                <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest">Date</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest">Organisation</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest">Email</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest">Contacted</th>
              </tr>
            </thead>
            <tbody>
              {loadingLeads ? (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-xs opacity-40">Loading…</td></tr>
              ) : leads.length === 0 ? (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-xs opacity-40">No leads yet</td></tr>
              ) : leads.map((l) => (
                <tr key={l.id} className="border-b border-black/10 hover:bg-[#fafafa]">
                  <td className="px-4 py-3 text-xs opacity-50 whitespace-nowrap">
                    {new Date(l.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 font-bold">{l.organization_name}</td>
                  <td className="px-4 py-3">{l.email}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleContacted(l.id, l.has_contacted_hey)}
                      className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider brutal-border brutal-hover ${l.has_contacted_hey ? "bg-hey" : "bg-white"}`}
                    >
                      {l.has_contacted_hey ? "✓ Done" : "Pending"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

function Dashboard({ onLogout }: { onLogout: () => void }) {
  const [programs, setPrograms] = React.useState<Program[]>([]);
  const [editing, setEditing] = React.useState<Program | null>(null);
  const [open, setOpen] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<"programs" | "analytics">("programs");

  const fetchPrograms = React.useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("programs")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      if (data) setPrograms(data as Program[]);
    } catch (err: any) {
      toast.error("Database connection failed: " + err.message);
    }
  }, []);

  React.useEffect(() => {
    fetchPrograms();
  }, [fetchPrograms]);

  function startNew() {
    setEditing(blankProgram());
    setOpen(true);
  }

  function startEdit(p: Program) {
    setEditing(p);
    setOpen(true);
  }

  async function saveProgram(p: Program) {
    const isNew = !p.id || p.id.startsWith("p_");
    const payload = { ...p };
    if (isNew) delete (payload as any).id;

    try {
      const { error } = await supabase.from("programs").upsert(payload);
      if (error) throw error;

      toast.success("Program successfully updated!");
      setOpen(false);
      fetchPrograms();
    } catch (err: any) {
      toast.error("Data tracking write error: " + err.message);
    }
  }

  async function toggleActiveStatus(id: string, currentStatus: boolean) {
    try {
      const { error } = await supabase
        .from("programs")
        .update({ is_active: !currentStatus })
        .eq("id", id);

      if (error) throw error;
      toast.success(!currentStatus ? "Program Restored" : "Program Archived");
      fetchPrograms();
    } catch (err: any) {
      toast.error("Status state transaction failure: " + err.message);
    }
  }

  async function deleteProgram(id: string) {
    try {
      const { error } = await supabase.from("programs").delete().eq("id", id);
      if (error) throw error;

      toast.success("Program deleted successfully");
      fetchPrograms();
    } catch (err: any) {
      toast.error("Deletion rejected: " + err.message);
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <Toaster />
      <header className="border-b-2 border-black bg-hey">
        <div className="mx-auto max-w-7xl px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" className="bg-black text-hey px-2 py-1 font-black">hey!</Link>
            <h1 className="text-xl font-black">Admin</h1>
            <div className="flex gap-1">
              {(["programs", "analytics"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider brutal-border brutal-hover ${activeTab === tab ? "bg-black text-hey" : "bg-white"}`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {activeTab === "programs" && (
              <Button
                onClick={startNew}
                className="bg-black text-hey hover:bg-black brutal-border brutal-shadow brutal-hover font-bold uppercase tracking-wider"
              >
                <Plus className="h-4 w-4" /> New program
              </Button>
            )}
            <Button
              onClick={onLogout}
              variant="outline"
              className="brutal-border brutal-shadow brutal-hover bg-white font-bold uppercase tracking-wider rounded-none"
            >
              <LogOut className="h-4 w-4" /> Logout
            </Button>
          </div>
        </div>
      </header>

      {activeTab === "analytics" ? <AnalyticsDashboard /> : (<>
      <main className="mx-auto max-w-7xl px-6 py-10">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {programs.map((p) => (
            <div
              key={p.id}
              className={`brutal-card p-4 flex flex-col gap-3 ${p.is_active ? "" : "opacity-60"}`}
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-black">{p.program}</h3>
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 ${p.is_active ? "bg-hey" : "bg-[#eee]"
                    }`}
                >
                  {p.is_active ? "Active" : "Archived"}
                </span>
              </div>
              <p className="text-xs opacity-70">{p.manager} · {p.approx_funding}</p>
              <p className="text-sm line-clamp-3">{p.short_description}</p>
              <div className="mt-auto pt-2 border-t-2 border-black flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => startEdit(p)}
                  className="brutal-border rounded-none shadow-none bg-white"
                >
                  <Pencil className="h-3 w-3" /> Edit
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => toggleActiveStatus(p.id, p.is_active)}
                  className="brutal-border rounded-none shadow-none bg-white"
                >
                  {p.is_active ? (
                    <>
                      <Archive className="h-3 w-3 mr-1" /> Archive
                    </>
                  ) : (
                    <>
                      <ArchiveRestore className="h-3 w-3 mr-1" /> Restore
                    </>
                  )}
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    if (confirm(`Delete "${p.program}"? This cannot be undone.`)) {
                      deleteProgram(p.id);
                    }
                  }}
                  className="brutal-border rounded-none shadow-none bg-white text-red-600 ml-auto"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </main>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="brutal-border rounded-none shadow-[6px_6px_0_0_#000] max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black">
              {editing?.id && !editing.id.startsWith("p_") ? "Edit program" : "New program"}
            </DialogTitle>
          </DialogHeader>
          {editing && (
            <ProgramForm
              initial={editing}
              onSave={saveProgram}
              onCancel={() => setOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
      </>)}
    </div>
  );
}

function blankProgram(): Program {
  return {
    id: `p_${Date.now()}`,
    program: "",
    manager: "",
    entity_types: [],
    territory: [],
    eu_partners_required: false,
    works_with_youth: false,
    can_host_individuals: false,
    can_mobilize_5_plus_youth: false,
    coordinator_available: false,
    previous_experience_required: "None",
    approx_funding: "",
    project_duration: "",
    call_deadline: "",
    difficulty_level: "Medium",
    is_active: true,
    short_description: "",
    in_a_nutshell: "",
  };
}

function ProgramForm({
  initial, onSave, onCancel,
}: { initial: Program; onSave: (p: Program) => void; onCancel: () => void }) {
  const [p, setP] = React.useState<Program>(initial);

  function up<K extends keyof Program>(k: K, v: Program[K]) {
    setP((prev) => ({ ...prev, [k]: v }));
  }

  function toggleArr(key: "entity_types" | "territory", val: string) {
    const cur = p[key];
    up(key, cur.includes(val) ? cur.filter((x) => x !== val) : [...cur, val]);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!p.program.trim()) {
      toast.error("Program name required");
      return;
    }
    onSave(p);
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Fld label="Program name">
          <Input value={p.program} onChange={(e) => up("program", e.target.value)}
            className="brutal-border rounded-none shadow-none h-11" required />
        </Fld>
        <Fld label="Manager">
          <Input value={p.manager} onChange={(e) => up("manager", e.target.value)}
            className="brutal-border rounded-none shadow-none h-11" />
        </Fld>
        <Fld label="Funding (Text format supported)">
          <Input value={p.approx_funding}
            onChange={(e) => up("approx_funding", e.target.value)}
            className="brutal-border rounded-none shadow-none h-11" placeholder="e.g. up to €60,000" />
        </Fld>
        <Fld label="Duration">
          <Input value={p.project_duration} onChange={(e) => up("project_duration", e.target.value)}
            className="brutal-border rounded-none shadow-none h-11" placeholder="e.g. 6–18 months" />
        </Fld>
        <Fld label="Deadline">
          <Input value={p.call_deadline}
            onChange={(e) => up("call_deadline", e.target.value)}
            className="brutal-border rounded-none shadow-none h-11" placeholder="e.g. Open all year round" />
        </Fld>
        <Fld label="Difficulty">
          <select
            value={p.difficulty_level}
            onChange={(e) => up("difficulty_level", e.target.value)}
            className="brutal-border rounded-none h-11 px-3 w-full bg-white font-medium"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </Fld>
        <Fld label="Experience required">
          <select
            value={p.previous_experience_required}
            onChange={(e) => up("previous_experience_required", e.target.value)}
            className="brutal-border rounded-none h-11 px-3 w-full bg-white font-medium"
          >
            <option value="none">None</option>
            <option value="some">Some</option>
            <option value="extensive">Extensive</option>
          </select>
        </Fld>
        <Fld label="Active">
          <label className="flex items-center gap-2 brutal-border px-3 h-11 bg-white cursor-pointer">
            <Checkbox checked={p.is_active}
              onCheckedChange={(c) => up("is_active", Boolean(c))}
              className="rounded-none brutal-border data-[state=checked]:bg-hey data-[state=checked]:text-black"
            />
            <span className="font-medium">Visible in matches</span>
          </label>
        </Fld>
      </div>

      <Fld label="Entity types">
        <div className="flex flex-wrap gap-2">
          {ENTITY_TYPES.map((t) => (
            <Chip key={t} active={p.entity_types?.includes(t)} onClick={() => toggleArr("entity_types", t)}>
              {t}
            </Chip>
          ))}
        </div>
      </Fld>

      <Fld label="Territory">
        <div className="flex flex-wrap gap-2">
          {TERRITORIES.map((t) => (
            <Chip key={t} active={p.territory?.includes(t)} onClick={() => toggleArr("territory", t)}>
              {t}
            </Chip>
          ))}
        </div>
      </Fld>

      <Fld label="Requirements">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {([
            ["eu_partners_required", "Requires EU partners"],
            ["works_with_youth", "Works with youth"],
            ["can_mobilize_5_plus_youth", "Needs 5+ youth"],
            ["can_host_individuals", "Can host individuals"],
            ["coordinator_available", "Coordinator available"],
          ] as const).map(([k, label]) => (
            <label key={k} className="flex items-center gap-2 brutal-border bg-white px-3 py-2 cursor-pointer">
              <Checkbox
                checked={p[k] as boolean}
                onCheckedChange={(c) => up(k, Boolean(c) as never)}
                className="rounded-none brutal-border data-[state=checked]:bg-hey data-[state=checked]:text-black"
              />
              <span className="text-sm font-medium">{label}</span>
            </label>
          ))}
        </div>
      </Fld>

      <Fld label="Short description">
        <Textarea value={p.short_description}
          onChange={(e) => up("short_description", e.target.value)}
          className="brutal-border rounded-none shadow-none" rows={2} />
      </Fld>

      <Fld label="In a nutshell">
        <Textarea value={p.in_a_nutshell}
          onChange={(e) => up("in_a_nutshell", e.target.value)}
          className="brutal-border rounded-none shadow-none" rows={2} />
      </Fld>

      <DialogFooter className="pt-2">
        <Button type="button" variant="outline" onClick={onCancel}
          className="brutal-border rounded-none shadow-none bg-white">
          Cancel
        </Button>
        <Button type="submit"
          className="bg-black text-hey hover:bg-black brutal-border brutal-shadow brutal-hover font-bold uppercase tracking-wider">
          Save program
        </Button>
      </DialogFooter>
    </form>
  );
}

function Fld({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="text-xs font-bold uppercase tracking-widest">{label}</Label>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function Chip({
  active, onClick, children,
}: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`brutal-border px-3 py-1.5 text-xs font-bold uppercase tracking-wider brutal-hover ${active ? "bg-hey" : "bg-white"
        }`}
    >
      {children}
    </button>
  );
}