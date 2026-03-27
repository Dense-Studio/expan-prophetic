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
    message: `Hi ${firstName}! \n\nSo glad you made it to EXPAN 2026! Welcome to church.\nSettle in with an open heart and expect an intimate time with God.\n\nDon’t forget to follow our WhatsApp channel to stay connected and updated.\nhttps://whatsapp.com/channel/0029VbCkkB01t90ZSMp8m13a`,
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
    message: `Hi ${firstName}! 🙏\n\nSo glad you made it to EXPAN 2026! Welcome to church.\nSettle in with an open heart and expect an intimate time with God.\n\nDon’t forget to follow our WhatsApp channel to stay connected and updated.\nhttps://whatsapp.com/channel/0029VbCkkB01t90ZSMp8m13a`,
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
