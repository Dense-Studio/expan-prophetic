/**
 * SMS Service (Arkesel)
 * Sends SMS messages via the Arkesel API.
 */
export type LiveLinkMode = "single" | "platforms";

export interface LiveBroadcastLinks {
  mode: LiveLinkMode;
  sharedUrl?: string;
  youtubeUrl?: string;
  facebookUrl?: string;
  tiktokUrl?: string;
}

export function normalizeLiveUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";

  const withProtocol = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  try {
    const url = new URL(withProtocol);
    if (!url.hostname) return "";
    return url.toString();
  } catch {
    return "";
  }
}

export function buildLiveBroadcastMessage(links: LiveBroadcastLinks): string {
  const intro = "Once again, welcome to EXPAN!";
  const invitation =
    "Join us wherever you are and share the live stream with your friends and family.";
  const closing =
    "Don't forget to share the link on your WhatsApp status. Let's spread the encounter!";

  if (links.mode === "single") {
    const sharedUrl = normalizeLiveUrl(links.sharedUrl || "");
    if (!sharedUrl) throw new Error("Enter a valid live-stream link.");

    return `${intro}\n\nWe are currently live on Facebook, YouTube, and TikTok.\n\n${invitation}\n\nWatch live here:\n${sharedUrl}\n\n${closing}`;
  }

  const platforms = [
    { name: "Facebook", url: normalizeLiveUrl(links.facebookUrl || "") },
    { name: "YouTube", url: normalizeLiveUrl(links.youtubeUrl || "") },
    { name: "TikTok", url: normalizeLiveUrl(links.tiktokUrl || "") },
  ].filter((platform) => platform.url);

  if (platforms.length === 0) {
    throw new Error("Enter at least one valid platform link.");
  }

  const platformNames = platforms.map((platform) => platform.name);
  const liveOn = platformNames.length === 1
    ? platformNames[0]
    : platformNames.length === 2
      ? `${platformNames[0]} and ${platformNames[1]}`
      : `${platformNames.slice(0, -1).join(", ")}, and ${platformNames.at(-1)}`;
  const platformLinks = platforms
    .map((platform) => `${platform.name}: ${platform.url}`)
    .join("\n");

  return `${intro}\n\nWe are currently live on ${liveOn}.\n\n${invitation}\n\nWatch live:\n${platformLinks}\n\n${closing}`;
}
