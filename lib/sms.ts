/**
 * SMS Service (Arkesel)
 * Sends SMS messages via the Arkesel API.
 */
const WHATSAPP_CHANNEL =
  "https://whatsapp.com/channel/0029VbCkkB01t90ZSMp8m13a";

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

function eventWelcomeMessage(firstName: string): string {
  return `Hi ${firstName}! \n\nSo glad you made it for the August edition of EXPAN 2026! Welcome to church.\nSettle in with an open heart and expect an intimate time with God.\n\nDon’t forget to follow our WhatsApp channel to stay connected and updated.\n${WHATSAPP_CHANNEL}`;
}

export async function sendWelcomeSms(
  phoneNumber: string,
  firstName: string,
): Promise<void> {
  const formattedPhone = formatGhanaPhone(phoneNumber);

  const body = {
    sender: "EXPAN",
    message: eventWelcomeMessage(firstName),
    recipients: [formattedPhone],
  };

  const response = await fetch("/api/sms", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("❌ SMS send failed:", errorText);
    throw new Error(`SMS error: ${response.status}`);
  }

  console.log("✅ Welcome SMS sent successfully");
}

export async function sendBulkReminderSms(
  phoneNumbers: string[],
  message: string,
): Promise<void> {
  const formattedPhones = [
    ...new Set(phoneNumbers.map((phone) => formatGhanaPhone(phone))),
  ];

  if (formattedPhones.length === 0) return;

  const body = {
    sender: "EXPAN",
    message: message,
    recipients: formattedPhones,
  };

  const response = await fetch("/api/sms", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("❌ Bulk SMS send failed:", errorText);
    throw new Error(`SMS error: ${response.status}`);
  }

  console.log(`✅ Bulk SMS sent successfully to ${formattedPhones.length} recipients`);
}

export async function sendCheckInSms(
  phoneNumber: string,
  firstName: string,
): Promise<void> {
  const formattedPhone = formatGhanaPhone(phoneNumber);

  const body = {
    sender: "EXPAN",
    message: eventWelcomeMessage(firstName),
    recipients: [formattedPhone],
  };

  const response = await fetch("/api/sms", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("❌ Check-in SMS send failed:", errorText);
    throw new Error(`SMS error: ${response.status}`);
  }

  console.log("✅ Check-in SMS sent successfully");
}

function formatGhanaPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("233")) return digits;
  if (digits.startsWith("0")) return "233" + digits.slice(1);
  return "233" + digits;
}
