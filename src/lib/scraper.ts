// Lightweight client-side keyword heuristic "scraper".
// In a real backend this would fetch the URL and parse it; here we
// derive plausible profile hints from the URL itself + a small delay.

import { ENTITY_TYPES, TERRITORIES } from "./programs";

export type ScrapeResult = {
  organization_type?: string;
  sector?: string;
  country?: string;
  core_activity?: string;
};

const KEYWORDS: Array<{ match: RegExp; out: Partial<ScrapeResult> }> = [
  { match: /ngo|asoc|associat|fundac|foundation/i, out: { organization_type: "NGO" } },
  { match: /univers|edu/i, out: { organization_type: "University" } },
  { match: /coop/i, out: { organization_type: "Cooperative" } },
  { match: /\.gob\.|gov\.|ayunt|munic/i, out: { organization_type: "Public body" } },
  { match: /youth|jovenes|jeune/i, out: { sector: "Youth & education", core_activity: "Youth empowerment" } },
  { match: /climate|environment|sosten|verde/i, out: { sector: "Climate & environment", core_activity: "Sustainability" } },
  { match: /art|cultur|music|festival/i, out: { sector: "Arts & culture", core_activity: "Cultural production" } },
  { match: /social|inclus|refug|migrat/i, out: { sector: "Social inclusion", core_activity: "Community work" } },
];

const TLD_COUNTRY: Record<string, string> = {
  es: "Spain", pt: "Portugal", fr: "France", it: "Italy", de: "Germany",
  mx: "Latin America", ar: "Latin America", co: "Latin America", cl: "Latin America",
  eu: "EU-wide",
};

export async function scrapeSite(url: string): Promise<ScrapeResult> {
  // Simulate network delay
  await new Promise((r) => setTimeout(r, 1100));

  let host = "";
  try {
    host = new URL(url.startsWith("http") ? url : `https://${url}`).hostname.toLowerCase();
  } catch {
    return {};
  }

  const result: ScrapeResult = {};

  for (const { match, out } of KEYWORDS) {
    if (match.test(host)) Object.assign(result, out);
  }

  const tld = host.split(".").pop() ?? "";
  if (TLD_COUNTRY[tld]) result.country = TLD_COUNTRY[tld];
  else if (!result.country) result.country = "Spain";

  if (!result.organization_type) result.organization_type = "NGO";
  if (!result.sector) result.sector = "Social inclusion";
  if (!result.core_activity) result.core_activity = "Community programs";

  // Validate against allowed lists
  if (!ENTITY_TYPES.includes(result.organization_type)) result.organization_type = "NGO";
  if (!TERRITORIES.includes(result.country!)) result.country = "Spain";

  return result;
}
