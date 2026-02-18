/**
 * Send a welcome SMS via the Arkesel API (proxied through Vite dev server).
 *
 * The Vite proxy at `/api/sms` forwards the request to
 * `https://sms.arkesel.com/api/v2/sms/send` and injects the API key header,
 * so no secrets are exposed to the browser.
 */
export async function sendWelcomeSms(
  phoneNumber: string,
  firstName: string,
): Promise<void> {
  const formattedPhone = formatGhanaPhone(phoneNumber);

  const body = {
    sender: "EXPAN",
    message: `Hi ${firstName}! 🙏 Welcome to the EXPAN community. We're blessed to have you. Stay tuned for updates, events, and prophetic words. God bless you!`,
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

/**
 * Convert a local Ghana phone number to international format (233...).
 * Handles formats like: 0241234567, 241234567, 233241234567
 */
function formatGhanaPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");

  if (digits.startsWith("233")) {
    return digits;
  }
  if (digits.startsWith("0")) {
    return "233" + digits.slice(1);
  }
  return "233" + digits;
}
