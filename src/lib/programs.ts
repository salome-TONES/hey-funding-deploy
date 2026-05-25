import * as React from "react";

export type Program = {
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
  previous_experience_required: "none" | "some" | "extensive";
  approx_funding: number;
  project_duration: string;
  call_deadline: string;
  difficulty_level: "low" | "medium" | "high";
  is_active: boolean;
  short_description: string;
  in_a_nutshell: string;
};

export const ENTITY_TYPES = [
  "NGO",
  "Association",
  "Foundation",
  "Public body",
  "SME",
  "University",
  "Cooperative",
];

export const TERRITORIES = [
  "Spain",
  "Portugal",
  "France",
  "Italy",
  "Germany",
  "EU-wide",
  "Latin America",
  "Global",
];

const STORAGE_KEY = "hey_funding_programs_v1";

const SEED: Program[] = [
  {
    id: "p1",
    program: "Erasmus+ Youth Exchanges",
    manager: "SEPIE",
    entity_types: ["NGO", "Association", "Foundation"],
    territory: ["EU-wide", "Spain"],
    eu_partners_required: true,
    works_with_youth: true,
    can_host_individuals: true,
    can_mobilize_5_plus_youth: true,
    coordinator_available: false,
    previous_experience_required: "none",
    approx_funding: 30000,
    project_duration: "5–21 days",
    call_deadline: "2026-10-01",
    difficulty_level: "low",
    is_active: true,
    short_description: "Mobility projects bringing young people together across EU borders.",
    in_a_nutshell: "Easy entry. Bring 5+ youth, find one EU partner, design a 1-week exchange.",
  },
  {
    id: "p2",
    program: "ESC Solidarity Projects",
    manager: "European Solidarity Corps",
    entity_types: ["NGO", "Association"],
    territory: ["Spain", "EU-wide"],
    eu_partners_required: false,
    works_with_youth: true,
    can_host_individuals: false,
    can_mobilize_5_plus_youth: true,
    coordinator_available: false,
    previous_experience_required: "none",
    approx_funding: 6700,
    project_duration: "2–12 months",
    call_deadline: "2026-05-12",
    difficulty_level: "low",
    is_active: true,
    short_description: "Youth-led local solidarity projects with community impact.",
    in_a_nutshell: "Tiny budget, big impact. 5 young people, one local cause.",
  },
  {
    id: "p3",
    program: "CERV — Citizens Equality Rights & Values",
    manager: "European Commission",
    entity_types: ["NGO", "Foundation", "Public body"],
    territory: ["EU-wide"],
    eu_partners_required: true,
    works_with_youth: false,
    can_host_individuals: false,
    can_mobilize_5_plus_youth: false,
    coordinator_available: true,
    previous_experience_required: "some",
    approx_funding: 120000,
    project_duration: "12–24 months",
    call_deadline: "2026-04-18",
    difficulty_level: "high",
    is_active: true,
    short_description: "Promote rights, equality, democracy and EU values.",
    in_a_nutshell: "Heavier paperwork, larger grants. Needs an experienced coordinator.",
  },
  {
    id: "p4",
    program: "AECID Cooperation Grants",
    manager: "AECID",
    entity_types: ["NGO", "Foundation"],
    territory: ["Latin America", "Spain"],
    eu_partners_required: false,
    works_with_youth: false,
    can_host_individuals: false,
    can_mobilize_5_plus_youth: false,
    coordinator_available: true,
    previous_experience_required: "extensive",
    approx_funding: 300000,
    project_duration: "24–36 months",
    call_deadline: "2026-03-30",
    difficulty_level: "high",
    is_active: true,
    short_description: "Spanish development cooperation in Latin America & Africa.",
    in_a_nutshell: "Big-ticket grant. Need solid track record and local partners.",
  },
  {
    id: "p5",
    program: "Erasmus+ Small-scale Partnerships",
    manager: "SEPIE",
    entity_types: ["NGO", "Association", "SME", "Cooperative"],
    territory: ["EU-wide"],
    eu_partners_required: true,
    works_with_youth: false,
    can_host_individuals: false,
    can_mobilize_5_plus_youth: false,
    coordinator_available: false,
    previous_experience_required: "none",
    approx_funding: 60000,
    project_duration: "6–24 months",
    call_deadline: "2026-10-01",
    difficulty_level: "medium",
    is_active: true,
    short_description: "Cooperation projects for newcomers and grassroots organizations.",
    in_a_nutshell: "Friendly grant for first-timers. Two partners. Lump sums.",
  },
  {
    id: "p6",
    program: "Horizon Europe — Civil Society Cluster",
    manager: "European Commission",
    entity_types: ["University", "NGO", "SME"],
    territory: ["EU-wide", "Global"],
    eu_partners_required: true,
    works_with_youth: false,
    can_host_individuals: false,
    can_mobilize_5_plus_youth: false,
    coordinator_available: true,
    previous_experience_required: "extensive",
    approx_funding: 1500000,
    project_duration: "36 months",
    call_deadline: "2026-09-15",
    difficulty_level: "high",
    is_active: true,
    short_description: "Research & innovation projects with societal impact.",
    in_a_nutshell: "Top of the food chain. Massive grants, consortium-only.",
  },
];

// External store with localStorage persistence
function load(): Program[] {
  if (typeof window === "undefined") return SEED;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return SEED;
    return JSON.parse(raw) as Program[];
  } catch {
    return SEED;
  }
}

let state: Program[] = load();
const listeners = new Set<() => void>();

function persist() {
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }
  listeners.forEach((l) => l());
}

export const programStore = {
  get: () => state,
  subscribe: (l: () => void) => {
    listeners.add(l);
    return () => listeners.delete(l);
  },
  upsert: (p: Program) => {
    const idx = state.findIndex((x) => x.id === p.id);
    state = idx >= 0 ? state.map((x) => (x.id === p.id ? p : x)) : [...state, p];
    persist();
  },
  archive: (id: string) => {
    state = state.map((x) => (x.id === id ? { ...x, is_active: false } : x));
    persist();
  },
  restore: (id: string) => {
    state = state.map((x) => (x.id === id ? { ...x, is_active: true } : x));
    persist();
  },
  remove: (id: string) => {
    state = state.filter((x) => x.id !== id);
    persist();
  },
  reset: () => {
    state = SEED;
    persist();
  },
};

export function usePrograms(): Program[] {
  return React.useSyncExternalStore(
    programStore.subscribe,
    programStore.get,
    () => SEED,
  );
}
