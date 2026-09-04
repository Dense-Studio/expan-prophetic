export interface OutreachLocation {
  id: string;
  label: string;
  aliases: string[];
}

export const PROPHETIC_SUNDAYS_LOCATIONS: OutreachLocation[] = [
  { id: "kojokrom", label: "Kojokrom", aliases: ["kojokrom"] },
  { id: "mpinstin", label: "Mpinstin", aliases: ["mpinstin", "mpintsin"] },
  { id: "esipon", label: "Esipon", aliases: ["esipon"] },
  { id: "inchaban", label: "Inchaban", aliases: ["inchaban"] },
  { id: "aboadze", label: "Aboadze", aliases: ["aboadze"] },
  { id: "shama-junction", label: "Shama Junction", aliases: ["shama junction", "shama jct"] },
  { id: "shama", label: "Shama", aliases: ["shama"] },
];

export function normalizeLocationName(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\bjct\b/g, "junction")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function aliasMatchesLocation(location: string, alias: string): boolean {
  return location === alias || location.startsWith(`${alias} `) || location.endsWith(` ${alias}`);
}

export function matchOutreachLocationId(locationName: string | null | undefined): string | null {
  const normalizedLocation = normalizeLocationName(locationName || "");
  if (!normalizedLocation) return null;

  // Prefer the most specific place name so "Shama Junction" is not classified as "Shama".
  const candidates = PROPHETIC_SUNDAYS_LOCATIONS.flatMap(location =>
    location.aliases.map(alias => ({
      id: location.id,
      alias: normalizeLocationName(alias),
    })),
  ).sort((left, right) => right.alias.length - left.alias.length);

  return candidates.find(candidate => aliasMatchesLocation(normalizedLocation, candidate.alias))?.id || null;
}

