import type { Program } from "./programs";

export type UserProfile = {
  organization_type: string;
  sector: string;
  country: string;
  works_with_youth: boolean;
  can_mobilize_5_plus_youth: boolean;
  can_host_individuals: boolean;
  has_eu_partners: boolean;
  coordinator_available: boolean;
  previous_experience: "none" | "some" | "extensive";
  budget_target: number; // requested funding
  preferred_duration: "short" | "medium" | "long"; // <6m / 6-18m / >18m
};

// Weights sum to 100
const W = {
  territory: 25,
  entity: 25,
  experience: 15,
  duration: 15,
  capabilities: 20,
};

function durationBucket(d: string): "short" | "medium" | "long" {
  const m = d.match(/(\d+)/g);
  if (!m) return "medium";
  const max = Math.max(...m.map(Number));
  if (d.includes("day") || max <= 6) return "short";
  if (max <= 18) return "medium";
  return "long";
}

const EXP_RANK = { none: 0, some: 1, extensive: 2 } as const;

export function scoreProgram(p: Program, u: UserProfile): number {
  let s = 0;

  // Territory match
  if (
    p.territory.includes(u.country) ||
    p.territory.includes("EU-wide") ||
    p.territory.includes("Global")
  ) {
    s += W.territory;
  }

  // Entity type match
  if (p.entity_types.includes(u.organization_type)) {
    s += W.entity;
  }

  // Experience: user must meet or exceed required level
  if (EXP_RANK[u.previous_experience] >= EXP_RANK[p.previous_experience_required]) {
    s += W.experience;
  } else if (EXP_RANK[u.previous_experience] + 1 === EXP_RANK[p.previous_experience_required]) {
    s += W.experience / 2;
  }

  // Duration alignment
  if (durationBucket(p.project_duration) === u.preferred_duration) {
    s += W.duration;
  }

  // Capability checks (each contributes proportionally when required)
  const caps: Array<[boolean, boolean]> = [
    [p.eu_partners_required, u.has_eu_partners],
    [p.works_with_youth, u.works_with_youth],
    [p.can_mobilize_5_plus_youth, u.can_mobilize_5_plus_youth],
    [p.can_host_individuals, u.can_host_individuals],
  ];
  const required = caps.filter(([req]) => req);
  if (required.length === 0) {
    s += W.capabilities;
  } else {
    const met = required.filter(([, ok]) => ok).length;
    s += (W.capabilities * met) / required.length;
  }

  // Bonus for coordinator if needed for hard programs
  if (p.difficulty_level === "high" && u.coordinator_available) s += 2;

  return Math.min(100, Math.round(s));
}

export function matchPrograms(programs: Program[], u: UserProfile) {
  return programs
    .filter((p) => p.is_active)
    .map((p) => ({ program: p, score: scoreProgram(p, u) }))
    .sort((a, b) => b.score - a.score);
}
