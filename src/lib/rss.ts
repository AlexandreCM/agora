import type { RssImportResult } from "@/types/rss-feed";

interface ParsedRssItem {
  title: string;
  link: string;
  description: string;
  publishedAt?: string;
}

const BASIC_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
};

function decodeEntities(value: string): string {
  return value.replace(/&(#\d+|#x[\da-f]+|[a-z]+);/gi, (match, entity) => {
    if (entity.startsWith("#x")) {
      const codePoint = Number.parseInt(entity.slice(2), 16);
      return String.fromCodePoint(codePoint);
    }

    if (entity.startsWith("#")) {
      const codePoint = Number.parseInt(entity.slice(1), 10);
      return String.fromCodePoint(codePoint);
    }

    const replacement = BASIC_ENTITIES[entity.toLowerCase()];
    return replacement ?? match;
  });
}

function stripCdata(value: string): string {
  const trimmed = value.trim();
  if (trimmed.startsWith("<![CDATA[") && trimmed.endsWith("]]>")) {
    return trimmed.slice(9, -3);
  }
  return trimmed;
}

function extractTagContent(xml: string, tagName: string): string | null {
  const regex = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, "i");
  const match = xml.match(regex);
  if (!match) {
    return null;
  }

  const rawContent = stripCdata(match[1]);
  return decodeEntities(rawContent);
}

function cleanText(value: string): string {
  return value
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseItemsFromXml(xml: string): ParsedRssItem[] {
  const items: ParsedRssItem[] = [];
  const itemRegex = /<item[\s\S]*?<\/item>/gi;
  const matches = xml.match(itemRegex) ?? [];

  for (const rawItem of matches) {
    const title = extractTagContent(rawItem, "title") ?? "";
    const link = extractTagContent(rawItem, "link") ?? extractTagContent(rawItem, "guid") ?? "";
    const description = extractTagContent(rawItem, "description")
      ?? extractTagContent(rawItem, "content:encoded")
      ?? "";
    const publishedAt = extractTagContent(rawItem, "pubDate") ?? undefined;

    items.push({
      title: cleanText(title),
      link: cleanText(link),
      description: cleanText(description),
      publishedAt,
    });
  }

  return items;
}

export async function fetchRssItems(url: string): Promise<ParsedRssItem[]> {
  const response = await fetch(url, { headers: { Accept: "application/rss+xml, application/xml" } });

  if (!response.ok) {
    throw new Error(`Impossible de récupérer le flux RSS (${response.status}).`);
  }

  const body = await response.text();

  return parseItemsFromXml(body);
}

export function buildImportSummary(result: RssImportResult): string {
  const base = `${result.createdPosts} post(s) créé(s) sur ${result.processedItems} éléments traités.`;
  if (!result.errors.length) {
    return base;
  }

  return `${base} ${result.errors.length} erreur(s) rencontrée(s).`;
}

export function createImportResult(): RssImportResult {
  return {
    processedItems: 0,
    createdPosts: 0,
    errors: [],
  };
}

export function summariseDescription(description: string, fallback: string): string {
  const source = description.trim() || fallback.trim();
  if (!source) {
    return "";
  }

  const normalised = source.replace(/\s+/g, " ").trim();

  return normalised.slice(0, 250) + (normalised.length > 250 ? "…" : "");
}

export type { ParsedRssItem };
