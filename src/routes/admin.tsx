import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus, Pencil, Archive, ArchiveRestore, Trash2, Lock, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import {
  ENTITY_TYPES, TERRITORIES, programStore, usePrograms, type Program,
} from "@/lib/programs";

export const Route = createFileRoute("/admin")({
  component: Admin,
});

const ADMIN_PASSWORD = "clara";
const AUTH_KEY = "hey_funding_admin_auth";

function Admin() {
  const [authed, setAuthed] = React.useState(false);

  React.useEffect(() => {
    if (typeof window !== "undefined" && sessionStorage.getItem(AUTH_KEY) === "1") {
      setAuthed(true);
    }
  }, []);

  if (!authed) return <Login onOk={() => setAuthed(true)} />;
  return <Dashboard onLogout={() => { sessionStorage.removeItem(AUTH_KEY); setAuthed(false); }} />;
}

function Login({ onOk }: { onOk: () => void }) {
  const [pw, setPw] = React.useState("");
  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (pw === ADMIN_PASSWORD) {
      sessionStorage.setItem(AUTH_KEY, "1");
      onOk();
    } else {
      toast.error("Wrong password");
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
        <Label className="text-xs font-bold uppercase tracking-widest">Password</Label>
        <Input
          type="password"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          className="mt-2 h-12 brutal-border rounded-none shadow-none"
          placeholder="••••••••"
          autoFocus
        />
        <p className="mt-2 text-xs opacity-70">Hint: <code>clara</code> (demo)</p>
        <Button
          type="submit"
          className="mt-6 w-full h-12 bg-black text-hey hover:bg-black brutal-border brutal-shadow brutal-hover font-bold uppercase tracking-wider"
        >
          Enter
        </Button>
        <Link to="/" className="block mt-4 text-center text-xs underline">← Back to site</Link>
      </form>
    </div>
  );
}

function Dashboard({ onLogout }: { onLogout: () => void }) {
  const programs = usePrograms();
  const [editing, setEditing] = React.useState<Program | null>(null);
  const [open, setOpen] = React.useState(false);

  function startNew() {
    setEditing(blankProgram());
    setOpen(true);
  }
  function startEdit(p: Program) {
    setEditing(p);
    setOpen(true);
  }

  return (
    <div className="min-h-screen bg-white">
      <Toaster />
      <header className="border-b-2 border-black bg-hey">
        <div className="mx-auto max-w-7xl px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="bg-black text-hey px-2 py-1 font-black">hey!</Link>
            <h1 className="text-xl font-black">Admin · Programs</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={startNew}
              className="bg-black text-hey hover:bg-black brutal-border brutal-shadow brutal-hover font-bold uppercase tracking-wider"
            >
              <Plus className="h-4 w-4" /> New program
            </Button>
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
                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 ${
                    p.is_active ? "bg-hey" : "bg-[#eee]"
                  }`}
                >
                  {p.is_active ? "Active" : "Archived"}
                </span>
              </div>
              <p className="text-xs opacity-70">{p.manager} · €{p.approx_funding.toLocaleString()}</p>
              <p className="text-sm">{p.short_description}</p>
              <div className="mt-auto pt-2 border-t-2 border-black flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => startEdit(p)}
                  className="brutal-border rounded-none shadow-none bg-white"
                >
                  <Pencil className="h-3 w-3" /> Edit
                </Button>
                {p.is_active ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => { programStore.archive(p.id); toast("Archived"); }}
                    className="brutal-border rounded-none shadow-none bg-white"
                  >
                    <Archive className="h-3 w-3" /> Archive
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => { programStore.restore(p.id); toast("Restored"); }}
                    className="brutal-border rounded-none shadow-none bg-white"
                  >
                    <ArchiveRestore className="h-3 w-3" /> Restore
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    if (confirm(`Delete "${p.program}"?`)) {
                      programStore.remove(p.id);
                      toast("Deleted");
                    }
                  }}
                  className="brutal-border rounded-none shadow-none bg-white text-red-600"
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
              {editing && programs.some((x) => x.id === editing.id) ? "Edit program" : "New program"}
            </DialogTitle>
          </DialogHeader>
          {editing && (
            <ProgramForm
              initial={editing}
              onSave={(p) => {
                programStore.upsert(p);
                setOpen(false);
                toast.success("Saved");
              }}
              onCancel={() => setOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
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
    previous_experience_required: "none",
    approx_funding: 0,
    project_duration: "",
    call_deadline: "",
    difficulty_level: "medium",
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
            className="brutal-border rounded-none shadow-none h-11" />
        </Fld>
        <Fld label="Manager">
          <Input value={p.manager} onChange={(e) => up("manager", e.target.value)}
            className="brutal-border rounded-none shadow-none h-11" />
        </Fld>
        <Fld label="Funding (EUR)">
          <Input type="number" value={p.approx_funding}
            onChange={(e) => up("approx_funding", Number(e.target.value) || 0)}
            className="brutal-border rounded-none shadow-none h-11" />
        </Fld>
        <Fld label="Duration">
          <Input value={p.project_duration} onChange={(e) => up("project_duration", e.target.value)}
            className="brutal-border rounded-none shadow-none h-11" placeholder="e.g. 6–18 months" />
        </Fld>
        <Fld label="Deadline">
          <Input type="date" value={p.call_deadline}
            onChange={(e) => up("call_deadline", e.target.value)}
            className="brutal-border rounded-none shadow-none h-11" />
        </Fld>
        <Fld label="Difficulty">
          <select
            value={p.difficulty_level}
            onChange={(e) => up("difficulty_level", e.target.value as Program["difficulty_level"])}
            className="brutal-border rounded-none h-11 px-3 w-full bg-white font-medium"
          >
            <option value="low">low</option>
            <option value="medium">medium</option>
            <option value="high">high</option>
          </select>
        </Fld>
        <Fld label="Experience required">
          <select
            value={p.previous_experience_required}
            onChange={(e) =>
              up("previous_experience_required", e.target.value as Program["previous_experience_required"])
            }
            className="brutal-border rounded-none h-11 px-3 w-full bg-white font-medium"
          >
            <option value="none">none</option>
            <option value="some">some</option>
            <option value="extensive">extensive</option>
          </select>
        </Fld>
        <Fld label="Active">
          <label className="flex items-center gap-2 brutal-border px-3 h-11 bg-white">
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
            <Chip key={t} active={p.entity_types.includes(t)} onClick={() => toggleArr("entity_types", t)}>
              {t}
            </Chip>
          ))}
        </div>
      </Fld>

      <Fld label="Territory">
        <div className="flex flex-wrap gap-2">
          {TERRITORIES.map((t) => (
            <Chip key={t} active={p.territory.includes(t)} onClick={() => toggleArr("territory", t)}>
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
            ["coordinator_available", "Coordinator helpful"],
          ] as const).map(([k, label]) => (
            <label key={k} className="flex items-center gap-2 brutal-border bg-white px-3 py-2">
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
      className={`brutal-border px-3 py-1.5 text-xs font-bold uppercase tracking-wider brutal-hover ${
        active ? "bg-hey" : "bg-white"
      }`}
    >
      {children}
    </button>
  );
}
