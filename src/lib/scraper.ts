import { ENTITY_TYPES, TERRITORIES } from "./programs";
import { fetchUrlMeta } from "./scrapeUrl";

export type ScrapeResult = {
  organization_type?: string;
  sector?: string;
  country?: string;
  core_activity?: string;
  works_with_youth?: boolean;
};

// Expanded to perfectly mirror your explicit entity types and map to precise target groups
const ENTITY_MATCHERS: Array<{ match: RegExp; out: string }> = [
  { match: /informal youth group|grupo informal|grupo de jóvenes/i, out: "Informal Youth Group" },
  { match: /social enterprise|empresa social/i, out: "Social Enterprise" },
  { match: /sports center|polideportivo|club deportivo|centro deportivo/i, out: "Sports Centers" },
  { match: /ngo|ongd|ong|nonprofit|non-profit|sin ánimo de lucro/i, out: "NGO" },
  { match: /asoc|associat|asociac|association/i, out: "Association" },
  { match: /fundac|foundation/i, out: "Foundation" },
  { match: /universi/i, out: "University" },
  { match: /coop/i, out: "Cooperative" },
  { match: /school|colegio|instituto|ies|escuela|education|educa/i, out: "Education" },
  { match: /\.gob\.|gov\.|ayunt|municip|deputac|diputac|consell|generalitat|public administration|administración pública/i, out: "Public Administration" },
  { match: /sl|s\.l\.|sa|s\.a\.|inc|llc|company|empresa/i, out: "Company" }
];

// Contextual Spanish indicators mapped precisely to your regional and global taxonomy targets
const REGIONAL_MATCHERS: Array<{ match: RegExp; out: string }> = [
  { match: /valencia|gva\.es|castelló|alicante|alacant/i, out: "Valencia" },
  { match: /murcia|carm\.es/i, out: "Murcia" },
  { match: /catalonia|catalunya|gencat\.cat|barcelona|tarragona|lleida|girona/i, out: "Catalonia" },
  { match: /spain|españa/i, out: "Spain" }
];

const TLD_COUNTRY: Record<string, string> = {
  es: "Spain",
  cat: "Catalonia",
  eu: "Europe - other"
};

export async function scrapeSite(url: string): Promise<ScrapeResult> {
  const normalized = url.startsWith("http") ? url : `https://${url}`;

  let host = "";
  try {
    host = new URL(normalized).hostname.toLowerCase();
  } catch {
    return {};
  }

  let pageText = host;
  try {
    const meta = await fetchUrlMeta({ data: url });
    pageText = `${host} ${meta.title || ""} ${meta.description || ""} ${(meta.keywords || [])}`.toLowerCase();
  } catch {
    // Graceful fallback to hostname parsing if fetch fails
  }

  const result: ScrapeResult = {};

  // 1. Precise Entity Typing
  for (const item of ENTITY_MATCHERS) {
    if (item.match.test(pageText)) {
      result.organization_type = item.out;
      break;
    }
  }

  // 2. Hierarchical Territory Resolution (Region takes priority over generic country/continent)
  let foundRegion = false;
  for (const item of REGIONAL_MATCHERS) {
    if (item.match.test(pageText)) {
      result.country = item.out;
      foundRegion = true;
      break;
    }
  }

  if (!foundRegion) {
    const tld = host.split(".").pop() ?? "";
    if (TLD_COUNTRY[tld]) {
      result.country = TLD_COUNTRY[tld];
    } else {
      const euroTlds = ["fr", "de", "it", "pt", "nl", "be", "at", "pl", "cz", "dk", "fi", "se", "no", "ch", "ie"];
      if (euroTlds.includes(tld)) {
        result.country = "Europe - other";
      } else if (tld === "com" || tld === "org" || tld === "net") {
        result.country = "Global";
      } else {
        result.country = "Spain";
      }
    }
  }

  // 3. Extrapolate Sector & Core Activity
  if (/climate|environment|sosten|verde|ecolog|medio ambiente/i.test(pageText)) {
    result.sector = "Climate & environment";
    result.core_activity = "Sustainability";
  } else if (/art|cultur|music|festival|teatro|museo/i.test(pageText)) {
    result.sector = "Arts & culture";
    result.core_activity = "Cultural production";
  } else if (/social|inclus|refug|migrat|poverty|vulnerable|exclusión|integración/i.test(pageText)) {
    result.sector = "Social inclusion";
    result.core_activity = "Community work";
  } else if (/sport|deporte|fitness|entrenamiento/i.test(pageText)) {
    result.sector = "Sports & Wellbeing";
    result.core_activity = "Physical education";
  } else {
    result.sector = "Social inclusion";
    result.core_activity = "Community programs";
  }

  // 4. Determine Youth Engagement Profile
  const youthRegex = /youth|joven|juven|jeune|infanc|niños|students|estudiantes|scout|esplai/i;
  result.works_with_youth = youthRegex.test(pageText);

  // 5. Strict Type Guard Sanitization against Database Configuration
  if (!result.organization_type || !ENTITY_TYPES.includes(result.organization_type)) {
    result.organization_type = "NGO";
  }
  if (!result.country || !TERRITORIES.includes(result.country)) {
    result.country = "Spain";
  }

  return result;
}

// import { ENTITY_TYPES, TERRITORIES } from "./programs";
// import { fetchUrlMeta } from "./scrapeUrl";

// export type ScrapeResult = {
//   organization_type?: string;
//   sector?: string;
//   country?: string;
//   core_activity?: string;
// };

// const KEYWORDS: Array<{ match: RegExp; out: Partial<ScrapeResult> }> = [
//   { match: /ngo|asoc|associat|fundac|foundation/i, out: { organization_type: "NGO" } },
//   { match: /univers|edu/i, out: { organization_type: "University" } },
//   { match: /coop/i, out: { organization_type: "Cooperative" } },
//   { match: /\.gob\.|gov\.|ayunt|munic/i, out: { organization_type: "Public body" } },
//   { match: /youth|jovenes|jeune/i, out: { sector: "Youth & education", core_activity: "Youth empowerment" } },
//   { match: /climate|environment|sosten|verde/i, out: { sector: "Climate & environment", core_activity: "Sustainability" } },
//   { match: /art|cultur|music|festival/i, out: { sector: "Arts & culture", core_activity: "Cultural production" } },
//   { match: /social|inclus|refug|migrat/i, out: { sector: "Social inclusion", core_activity: "Community work" } },
// ];

// const TLD_COUNTRY: Record<string, string> = {
//   es: "Spain", pt: "Portugal", fr: "France", it: "Italy", de: "Germany",
//   mx: "Latin America", ar: "Latin America", co: "Latin America", cl: "Latin America",
//   eu: "EU-wide",
// }; 

// export async function scrapeSite(url: string): Promise<ScrapeResult> {
//   const normalized = url.startsWith("http") ? url : `https://${url}`;

//   let host = "";
//   try {
//     host = new URL(normalized).hostname.toLowerCase();
//   } catch {
//     return {};
//   }

//   // Fetch real page content via server function (bypasses CORS)
//   let pageText = host;
//   try {
//     const meta = await fetchUrlMeta({ data: url });
//     pageText = `${host} ${meta.title} ${meta.description} ${meta.keywords}`.toLowerCase();
//   } catch {
//     // Fall back to hostname-only matching if the fetch fails
//   }

//   const result: ScrapeResult = {};

//   for (const { match, out } of KEYWORDS) {
//     if (match.test(pageText)) Object.assign(result, out);
//   }

//   const tld = host.split(".").pop() ?? "";
//   if (TLD_COUNTRY[tld]) result.country = TLD_COUNTRY[tld];
//   else if (!result.country) result.country = "Spain";

//   if (!result.organization_type) result.organization_type = "NGO";
//   if (!result.sector) result.sector = "Social inclusion";
//   if (!result.core_activity) result.core_activity = "Community programs";

//   if (!ENTITY_TYPES.includes(result.organization_type)) result.organization_type = "NGO";
//   if (!TERRITORIES.includes(result.country!)) result.country = "Spain";

//   return result;
// }
