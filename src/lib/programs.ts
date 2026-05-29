import * as React from "react";
import { supabase } from "./supabaseClient";

export type Program = {
  id: string;
  program: string;
  manager: string;
  entity_types: string[];
  territory: string[];
  sector: string;                 // Added: Maps to scraped thematic sectors
  core_activity: string;          // Added: Maps to scraped operational scopes
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
  "University",
  "Cooperative",
  "Education",
  "Public Administration",
  "Sports Centers",
  "Informal Youth Group",
  "Social Enterprise",
  "Company",
];

export const TERRITORIES = [
  "Valencia",
  "Murcia",
  "Catalonia",
  "Spain",
  "Europe - other",
  "Global",
];

export function usePrograms(): Program[] {
  const [programs, setPrograms] = React.useState<Program[]>([]);

  React.useEffect(() => {
    supabase
      .from("programs")
      .select("*")
      .eq("is_active", true)
      .then(({ data }) => {
        if (data) setPrograms(data as Program[]);
      });
  }, []);

  return programs;
}

// import * as React from "react";
// import { supabase } from "./supabaseClient";

// export type Program = {
//   id: string;
//   program: string;
//   manager: string;
//   entity_types: string[];
//   territory: string[];
//   eu_partners_required: boolean;
//   works_with_youth: boolean;
//   can_host_individuals: boolean;
//   can_mobilize_5_plus_youth: boolean;
//   coordinator_available: boolean;
//   previous_experience_required: "none" | "some" | "extensive";
//   approx_funding: number;
//   project_duration: string;
//   call_deadline: string;
//   difficulty_level: "low" | "medium" | "high";
//   is_active: boolean;
//   short_description: string;
//   in_a_nutshell: string;
// };

// export const ENTITY_TYPES = [
//   "NGO",
//   "Association",
//   "Foundation",
//   "University",
//   "Cooperative",
//   "Education",
//   "Public Administration",
//   "Sports Centers",
//   "Informal Youth Group",
//   "Social Enterprise",
//   "Company",
// ];

// export const TERRITORIES = [
//   "Valencia",
//   "Murcia",
//   "Catalonia",
//   "Spain",
//   "Europe - other",
//   "Global",
// ];

// export function usePrograms(): Program[] {
//   const [programs, setPrograms] = React.useState<Program[]>([]);

//   React.useEffect(() => {
//     supabase
//       .from("programs")
//       .select("*")
//       .eq("is_active", true)
//       .then(({ data }) => {
//         if (data) setPrograms(data as Program[]);
//       });
//   }, []);

//   return programs;
// }
