// src/lib/scrapeUrl.ts
import { createServerFn } from "@tanstack/react-start";

type UrlMeta = {
  title: string;
  description: string;
  keywords: string;
};

function getMeta(html: string, property: string): string {
  const a = html.match(
    new RegExp(
      `<meta[^>]+(?:property|name)=["']${property}["'][^>]+content=["']([^"']*?)["']`,
      "i",
    ),
  );
  if (a?.[1]) return a[1];
  const b = html.match(
    new RegExp(
      `<meta[^>]+content=["']([^"']*?)["'][^>]+(?:property|name)=["']${property}["']`,
      "i",
    ),
  );
  return b?.[1] ?? "";
}

// Corrected TanStack Start API execution syntax
export const fetchUrlMeta = createServerFn({ method: "POST" })
  .inputValidator((url: unknown) => {
    if (typeof url !== "string") throw new Error("URL must be a string");
    return url;
  })
  .handler(async ({ data: url }): Promise<UrlMeta> => {
    const normalized = url.startsWith("http") ? url : `https://${url}`;

    const response = await fetch(normalized, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; HeyFunding/1.0; +https://heyfunding.com)",
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const html = await response.text();

    return {
      title: getMeta(html, "og:title") || getMeta(html, "title") || "",
      description: getMeta(html, "og:description") || getMeta(html, "description") || "",
      keywords: getMeta(html, "keywords") || "",
    };
  });