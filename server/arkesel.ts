export interface ArkeselAcceptedRecipient {
  recipient: string;
  id: string;
}

export interface ArkeselBatchSuccess {
  accepted: ArkeselAcceptedRecipient[];
  invalid: string[];
}

export class ArkeselHttpError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly responseBody: string,
  ) {
    super(message);
  }
}

function apiKey(): string {
  const value = process.env.ARKESEL_API_KEY;
  if (!value) throw new Error("ARKESEL_API_KEY is not configured.");
  return value;
}

async function arkeselFetch(url: string, init: RequestInit, timeoutMs = 20_000): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        "api-key": apiKey(),
        ...init.headers,
      },
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

export async function getArkeselBalance(): Promise<number> {
  const response = await arkeselFetch(
    "https://sms.arkesel.com/api/v2/clients/balance-details",
    { method: "GET" },
  );
  const text = await response.text();
  if (!response.ok) throw new ArkeselHttpError("Could not retrieve Arkesel balance.", response.status, text);

  const parsed = JSON.parse(text) as { data?: { sms_balance?: string | number } };
  const balance = Number(parsed.data?.sms_balance);
  if (!Number.isFinite(balance)) throw new Error("Arkesel returned an invalid SMS balance.");
  return balance;
}

export async function sendArkeselBatch(
  recipients: string[],
  message: string,
  callbackUrl?: string,
): Promise<ArkeselBatchSuccess> {
  const payload: Record<string, unknown> = {
    sender: "EXPAN",
    message,
    recipients,
  };
  if (callbackUrl) payload.callback_url = callbackUrl;
  if (process.env.ARKESEL_SANDBOX === "true") payload.sandbox = true;

  const response = await arkeselFetch(
    "https://sms.arkesel.com/api/v2/sms/send",
    { method: "POST", body: JSON.stringify(payload) },
  );
  const text = await response.text();
  if (!response.ok) {
    throw new ArkeselHttpError(`Arkesel rejected the SMS batch (${response.status}).`, response.status, text);
  }

  const parsed = JSON.parse(text) as {
    status?: string;
    data?: Array<Record<string, unknown>>;
  };
  if (parsed.status !== "success" || !Array.isArray(parsed.data)) {
    throw new Error("Arkesel returned an unexpected SMS response.");
  }

  const accepted: ArkeselAcceptedRecipient[] = [];
  const invalid: string[] = [];
  for (const item of parsed.data) {
    if (typeof item.recipient === "string" && typeof item.id === "string") {
      accepted.push({ recipient: item.recipient.replace(/\D/g, ""), id: item.id });
    }
    const invalidNumbers = item["invalid numbers"];
    if (Array.isArray(invalidNumbers)) {
      invalid.push(...invalidNumbers.filter((value): value is string => typeof value === "string"));
    }
  }
  return { accepted, invalid };
}

export async function sendTransactionalSms(phone: string, message: string): Promise<void> {
  const result = await sendArkeselBatch([phone], message);
  if (result.accepted.length !== 1) throw new Error("Arkesel did not accept the confirmation SMS.");
}

export interface ArkeselDeliveryReport {
  id: string;
  status: string;
  recipient?: string;
}

export async function fetchArkeselReports(ids: string[]): Promise<ArkeselDeliveryReport[]> {
  if (ids.length === 0) return [];
  const response = await arkeselFetch(
    "https://sms.arkesel.com/api/v2/sms/message-reports",
    { method: "POST", body: JSON.stringify({ msg_ids: ids.slice(0, 1000) }) },
  );
  const text = await response.text();
  if (!response.ok) throw new ArkeselHttpError("Could not reconcile SMS delivery reports.", response.status, text);
  const parsed = JSON.parse(text) as { data?: unknown };
  const rows = Array.isArray(parsed.data) ? parsed.data : [];
  return rows.flatMap((row): ArkeselDeliveryReport[] => {
    if (!row || typeof row !== "object") return [];
    const value = row as Record<string, unknown>;
    const id = value.id ?? value.ID ?? value.sms_id;
    if (typeof id !== "string" || typeof value.status !== "string") return [];
    return [{ id, status: value.status, recipient: typeof value.recipient === "string" ? value.recipient : undefined }];
  });
}
