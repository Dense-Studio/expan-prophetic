export type SmsEncoding = "GSM-7" | "UCS-2";

export interface SmsEstimate {
  characters: number;
  encoding: SmsEncoding;
  units: number;
  parts: number;
}

const GSM_BASIC = new Set(
  Array.from(
    "@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞ ÆæßÉ !\"#¤%&'()*+,-./0123456789:;<=>?¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà",
  ),
);
const GSM_EXTENSION = new Set(Array.from("^{}\\[~]|€"));

export function estimateSms(message: string): SmsEstimate {
  let gsmUnits = 0;
  let isGsm = true;

  for (const character of message) {
    if (GSM_BASIC.has(character)) gsmUnits += 1;
    else if (GSM_EXTENSION.has(character)) gsmUnits += 2;
    else {
      isGsm = false;
      break;
    }
  }

  if (isGsm) {
    return {
      characters: Array.from(message).length,
      encoding: "GSM-7",
      units: gsmUnits,
      parts: gsmUnits === 0 ? 0 : gsmUnits <= 160 ? 1 : Math.ceil(gsmUnits / 153),
    };
  }

  const ucs2Units = message.length;
  return {
    characters: Array.from(message).length,
    encoding: "UCS-2",
    units: ucs2Units,
    parts: ucs2Units === 0 ? 0 : ucs2Units <= 70 ? 1 : Math.ceil(ucs2Units / 67),
  };
}

export function normalizeGhanaPhone(phone: string): string | null {
  const digits = phone.replace(/\D/g, "");
  let normalized = digits;

  if (digits.length === 9) normalized = `233${digits}`;
  else if (digits.length === 10 && digits.startsWith("0")) normalized = `233${digits.slice(1)}`;

  return /^233[2-9]\d{8}$/.test(normalized) ? normalized : null;
}

export function normalizeUniquePhones(phoneNumbers: string[]): {
  valid: string[];
  invalid: string[];
} {
  const valid = new Set<string>();
  const invalid: string[] = [];

  for (const phone of phoneNumbers) {
    const normalized = normalizeGhanaPhone(phone);
    if (normalized) valid.add(normalized);
    else invalid.push(phone);
  }

  return { valid: [...valid], invalid };
}
