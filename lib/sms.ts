/**
 * SMS Service (Arkesel)
 * Sends SMS messages via the Arkesel API.
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
    message: `Hi ${firstName}! 🙏 Thanks for joining us for our prophetic service today! Stay blessed and have a great week ahead.`,
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
