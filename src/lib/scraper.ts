import { ENTITY_TYPES, TERRITORIES } from "./programs";
import { fetchUrlMeta } from "./scrapeUrl";

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
  const normalized = url.startsWith("http") ? url : `https://${url}`;

  let host = "";
  try {
    host = new URL(normalized).hostname.toLowerCase();
  } catch {
    return {};
  }

  // Fetch real page content via server function (bypasses CORS)
  let pageText = host;
  try {
    const meta = await fetchUrlMeta({ data: url });
    pageText = `${host} ${meta.title} ${meta.description} ${meta.keywords}`.toLowerCase();
  } catch {
    // Fall back to hostname-only matching if the fetch fails
  }

  const result: ScrapeResult = {};

  for (const { match, out } of KEYWORDS) {
    if (match.test(pageText)) Object.assign(result, out);
  }

  const tld = host.split(".").pop() ?? "";
  if (TLD_COUNTRY[tld]) result.country = TLD_COUNTRY[tld];
  else if (!result.country) result.country = "Spain";

  if (!result.organization_type) result.organization_type = "NGO";
  if (!result.sector) result.sector = "Social inclusion";
  if (!result.core_activity) result.core_activity = "Community programs";

  if (!ENTITY_TYPES.includes(result.organization_type)) result.organization_type = "NGO";
  if (!TERRITORIES.includes(result.country!)) result.country = "Spain";

  return result;
}
