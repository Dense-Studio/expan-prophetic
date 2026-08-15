import { randomUUID } from "node:crypto";
import { estimateSms, normalizeGhanaPhone } from "../lib/smsEncoding.js";
import {
  ArkeselHttpError,
  fetchArkeselReports,
  getArkeselBalance,
  sendArkeselBatch,
} from "./arkesel.js";
import { getSupabaseAdmin } from "./supabaseAdmin.js";

export type CampaignKind = "reminder" | "live" | "general";
export type SmsAudienceMode = "standard" | "auditorium_first" | "auditorium_only" | "new_arrivals";
export const SMS_BATCH_SIZE = 250;
export const SMS_BATCH_CONCURRENCY = 3;

export function calculateBatchCount(recipientCount: number): number {
  return recipientCount <= 0 ? 0 : Math.ceil(recipientCount / SMS_BATCH_SIZE);
}

export function isRetryableDeliveryStatus(status: string): boolean {
  return status === "not_delivered" || status === "expired";
}

interface RegistrationPhone {
  id: string;
  phone_number: string;
  event_key: string | null;
  created_at: string;
}

interface RecipientRow {
  id: string;
  campaign_id: string;
  registration_id: string | null;
  original_phone: string;
  normalized_phone: string | null;
  status: string;
  attempt_count: number;
  next_attempt_at: string;
  provider_message_id: string | null;
  provider_status: string | null;
  error_code: string | null;
  error_message: string | null;
  priority_tier: 0 | 1;
  last_attempt_at: string | null;
  accepted_at: string | null;
  delivered_at: string | null;
  created_at: string;
  updated_at: string;
}

interface CampaignRow {
  id: string;
  request_key: string;
  kind: CampaignKind;
  message: string;
  audience_label: string;
  encoding: "GSM-7" | "UCS-2";
  sms_parts: number;
  estimated_credits: number;
  total_recipients: number;
  valid_recipients: number;
  invalid_recipients: number;
  duplicate_recipients: number;
  audience_mode: SmsAudienceMode;
  priority_event_key: string | null;
  priority_cutoff: string | null;
  priority_recipients: number;
  source_campaign_id: string | null;
  status: string;
  sandbox: boolean;
  last_error: string | null;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  updated_at: string;
}

export interface CampaignPreview {
  totalSelected: number;
  validRecipients: number;
  invalidRecipients: number;
  duplicateRecipients: number;
  missingRegistrations: number;
  encoding: "GSM-7" | "UCS-2";
  characters: number;
  smsParts: number;
  estimatedCredits: number;
  availableCredits: number;
  sufficientBalance: boolean;
  batches: number;
  sandbox: boolean;
  enabled: boolean;
  audienceMode: SmsAudienceMode;
  priorityRecipients: number;
  remainingRecipients: number;
  excludedAlreadyContacted: number;
  effectiveCutoff: string | null;
  sourceCampaignId: string | null;
}

interface AudienceOptions {
  mode: SmsAudienceMode;
  eventKey: string | null;
  cutoff: string | null;
}

interface PreparedAudience {
  registrations: RegistrationPhone[];
  selectedRegistrationCount: number;
  valid: Map<string, RegistrationPhone>;
  invalid: RegistrationPhone[];
  duplicates: number;
  priorityRegistrationIds: Set<string>;
  priorityRecipients: number;
  remainingRecipients: number;
  excludedAlreadyContacted: number;
  effectiveCutoff: string | null;
  sourceCampaignId: string | null;
}

function assertCampaignInput(kind: unknown, message: unknown, registrationIds: unknown) {
  if (kind !== "reminder" && kind !== "live" && kind !== "general") throw new Error("Invalid SMS campaign type.");
  if (typeof message !== "string" || !message.trim() || message.trim().length > 2000) {
    throw new Error("Enter an SMS message between 1 and 2,000 characters.");
  }
  if (!Array.isArray(registrationIds) || registrationIds.length === 0 || registrationIds.length > 10_000) {
    throw new Error("Select between 1 and 10,000 registrations.");
  }
  if (!registrationIds.every((id) => typeof id === "string" && /^[0-9a-f-]{36}$/i.test(id))) {
    throw new Error("The campaign contains an invalid registration reference.");
  }
}

function parseAudienceOptions(input: {
  kind: unknown;
  audienceMode?: unknown;
  priorityEventKey?: unknown;
  priorityCutoff?: unknown;
}): AudienceOptions {
  if (input.kind !== "live" && input.kind !== "general") return { mode: "standard", eventKey: null, cutoff: null };
  const mode = input.audienceMode ?? "standard";
  if (!["standard", "auditorium_first", "auditorium_only", "new_arrivals"].includes(String(mode))) {
    throw new Error("Select a valid live SMS audience mode.");
  }
  if (mode === "standard") return { mode: "standard", eventKey: null, cutoff: null };
  if (typeof input.priorityEventKey !== "string" || !/^[a-z0-9-]{3,100}$/i.test(input.priorityEventKey)) {
    throw new Error("The live SMS event reference is invalid.");
  }
  if (typeof input.priorityCutoff !== "string" || Number.isNaN(Date.parse(input.priorityCutoff))) {
    throw new Error("Select a valid auditorium arrival time.");
  }
  return {
    mode: mode as SmsAudienceMode,
    eventKey: input.priorityEventKey,
    cutoff: new Date(input.priorityCutoff).toISOString(),
  };
}

async function fetchRegistrationPhones(registrationIds: string[]): Promise<RegistrationPhone[]> {
  const supabase = getSupabaseAdmin();
  const uniqueIds = [...new Set(registrationIds)];
  const registrations: RegistrationPhone[] = [];
  for (let index = 0; index < uniqueIds.length; index += 500) {
    const { data, error } = await supabase
      .from("expan_registrations")
      .select("id, phone_number, event_key, created_at")
      .in("id", uniqueIds.slice(index, index + 500));
    if (error) throw new Error(`Could not load the SMS audience: ${error.message}`);
    registrations.push(...((data || []) as RegistrationPhone[]));
  }
  return registrations;
}

function prepareRecipients(registrations: RegistrationPhone[], priorityRegistrationIds = new Set<string>()) {
  const valid = new Map<string, RegistrationPhone>();
  const invalid: RegistrationPhone[] = [];
  let duplicates = 0;

  for (const registration of registrations) {
    const normalized = normalizeGhanaPhone(registration.phone_number);
    if (!normalized) {
      invalid.push(registration);
      continue;
    }
    const existing = valid.get(normalized);
    if (existing) {
      duplicates += 1;
      if (priorityRegistrationIds.has(registration.id) && !priorityRegistrationIds.has(existing.id)) {
        valid.set(normalized, registration);
      }
      continue;
    }
    valid.set(normalized, registration);
  }
  return { valid, invalid, duplicates };
}

export function registrationMatchesArrivalWindow(
  registration: Pick<RegistrationPhone, "event_key" | "created_at">,
  eventKey: string,
  cutoff: string,
): boolean {
  return registration.event_key === eventKey && Date.parse(registration.created_at) >= Date.parse(cutoff);
}

async function fetchCheckedInRegistrationIds(registrationIds: string[], eventKey: string, cutoff: string): Promise<Set<string>> {
  const supabase = getSupabaseAdmin();
  const checkedIn = new Set<string>();
  if (registrationIds.length === 0) return checkedIn;
  for (let index = 0; index < registrationIds.length; index += 500) {
    const { data, error } = await supabase
      .from("expan_check_ins")
      .select("registration_id")
      .eq("event_key", eventKey)
      .gte("check_in_time", cutoff)
      .in("registration_id", registrationIds.slice(index, index + 500));
    if (error) throw new Error(`Could not load auditorium check-ins: ${error.message}`);
    for (const row of data || []) {
      if (typeof row.registration_id === "string") checkedIn.add(row.registration_id);
    }
  }
  return checkedIn;
}

async function findArrivalRegistrationIds(
  registrations: RegistrationPhone[],
  eventKey: string,
  cutoff: string,
): Promise<Set<string>> {
  const arrivals = new Set(
    registrations
      .filter((registration) => registrationMatchesArrivalWindow(registration, eventKey, cutoff))
      .map((registration) => registration.id),
  );
  const checkedIn = await fetchCheckedInRegistrationIds(registrations.map((registration) => registration.id), eventKey, cutoff);
  for (const id of checkedIn) arrivals.add(id);
  return arrivals;
}

async function fetchCampaignPhones(campaignIds: string[]): Promise<Set<string>> {
  const supabase = getSupabaseAdmin();
  const phones = new Set<string>();
  for (const campaignId of campaignIds) {
    for (let from = 0; ; from += 1000) {
      const { data, error } = await supabase
        .from("sms_campaign_recipients")
        .select("normalized_phone")
        .eq("campaign_id", campaignId)
        .not("normalized_phone", "is", null)
        .range(from, from + 999);
      if (error) throw new Error(`Could not load the earlier live audience: ${error.message}`);
      for (const row of data || []) {
        if (typeof row.normalized_phone === "string") phones.add(row.normalized_phone);
      }
      if ((data || []).length < 1000) break;
    }
  }
  return phones;
}

async function prepareAudience(registrationIds: string[], options: AudienceOptions, kind: CampaignKind): Promise<PreparedAudience> {
  let registrations = await fetchRegistrationPhones(registrationIds);
  const selectedRegistrationCount = registrations.length;
  let priorityRegistrationIds = new Set<string>();
  let effectiveCutoff = options.cutoff;
  let sourceCampaignId: string | null = null;
  let excludedAlreadyContacted = 0;

  if (options.mode !== "standard" && options.eventKey && options.cutoff) {
    if (options.mode === "new_arrivals") {
      const { data, error } = await getSupabaseAdmin()
        .from("sms_campaigns")
        .select("id, created_at")
        .eq("kind", kind)
        .gte("created_at", options.cutoff)
        .order("created_at", { ascending: false })
        .limit(30);
      if (error) throw new Error(`Could not find the previous live campaign: ${error.message}`);
      if (!data?.length) throw new Error("No earlier live campaign was found for a new-arrivals follow-up.");
      sourceCampaignId = data[0].id as string;
      effectiveCutoff = data[0].created_at as string;
    }

    priorityRegistrationIds = await findArrivalRegistrationIds(
      registrations,
      options.eventKey,
      effectiveCutoff || options.cutoff,
    );

    if (options.mode === "auditorium_only" || options.mode === "new_arrivals") {
      registrations = registrations.filter((registration) => priorityRegistrationIds.has(registration.id));
    }

    if (options.mode === "new_arrivals" && sourceCampaignId) {
      const previousCampaigns = await getSupabaseAdmin()
        .from("sms_campaigns")
        .select("id")
        .eq("kind", kind)
        .gte("created_at", options.cutoff)
        .lte("created_at", effectiveCutoff || options.cutoff)
        .limit(100);
      if (previousCampaigns.error) throw new Error(`Could not load earlier live campaigns: ${previousCampaigns.error.message}`);
      const previousPhones = await fetchCampaignPhones((previousCampaigns.data || []).map((campaign) => campaign.id as string));
      registrations = registrations.filter((registration) => {
        const normalized = normalizeGhanaPhone(registration.phone_number);
        if (normalized && previousPhones.has(normalized)) {
          excludedAlreadyContacted += 1;
          return false;
        }
        return true;
      });
      priorityRegistrationIds = new Set(registrations.map((registration) => registration.id));
    }
  }

  const prepared = prepareRecipients(registrations, priorityRegistrationIds);
  const priorityRecipients = [...prepared.valid.values()]
    .filter((registration) => priorityRegistrationIds.has(registration.id)).length;
  return {
    registrations,
    selectedRegistrationCount,
    ...prepared,
    priorityRegistrationIds,
    priorityRecipients,
    remainingRecipients: prepared.valid.size - priorityRecipients,
    excludedAlreadyContacted,
    effectiveCutoff,
    sourceCampaignId,
  };
}

async function waitForCampaignSnapshot(campaign: CampaignRow): Promise<CampaignRow> {
  const supabase = getSupabaseAdmin();
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const countResult = await supabase.from("sms_campaign_recipients")
      .select("id", { count: "exact", head: true }).eq("campaign_id", campaign.id);
    if (countResult.error) throw new Error(countResult.error.message);
    if ((countResult.count || 0) >= campaign.total_recipients) return campaign;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error("The existing campaign audience is still being prepared. Please retry in a moment.");
}

export async function previewCampaign(input: {
  kind: unknown;
  message: unknown;
  registrationIds: unknown;
  audienceMode?: unknown;
  priorityEventKey?: unknown;
  priorityCutoff?: unknown;
}): Promise<CampaignPreview> {
  assertCampaignInput(input.kind, input.message, input.registrationIds);
  const audienceOptions = parseAudienceOptions(input);
  const ids = [...new Set(input.registrationIds as string[])];
  const message = (input.message as string).trim();
  const prepared = await prepareAudience(ids, audienceOptions, input.kind as CampaignKind);
  const estimate = estimateSms(message);
  const estimatedCredits = prepared.valid.size * estimate.parts;
  const availableCredits = await getArkeselBalance();

  return {
    totalSelected: ids.length,
    validRecipients: prepared.valid.size,
    invalidRecipients: prepared.invalid.length,
    duplicateRecipients: prepared.duplicates,
    missingRegistrations: Math.max(0, ids.length - prepared.selectedRegistrationCount),
    encoding: estimate.encoding,
    characters: estimate.characters,
    smsParts: estimate.parts,
    estimatedCredits,
    availableCredits,
    sufficientBalance: availableCredits >= estimatedCredits,
    batches: calculateBatchCount(prepared.valid.size),
    sandbox: process.env.ARKESEL_SANDBOX === "true",
    enabled: process.env.SMS_BULK_ENABLED === "true",
    audienceMode: audienceOptions.mode,
    priorityRecipients: prepared.priorityRecipients,
    remainingRecipients: prepared.remainingRecipients,
    excludedAlreadyContacted: prepared.excludedAlreadyContacted,
    effectiveCutoff: prepared.effectiveCutoff,
    sourceCampaignId: prepared.sourceCampaignId,
  };
}

export async function createCampaign(input: {
  requestKey: unknown;
  kind: unknown;
  message: unknown;
  audienceLabel: unknown;
  registrationIds: unknown;
  audienceMode?: unknown;
  priorityEventKey?: unknown;
  priorityCutoff?: unknown;
}): Promise<CampaignRow> {
  if (process.env.SMS_BULK_ENABLED !== "true") {
    throw new Error("Reliable bulk sending is disabled until rollout configuration is complete.");
  }
  assertCampaignInput(input.kind, input.message, input.registrationIds);
  const audienceOptions = parseAudienceOptions(input);
  if (typeof input.requestKey !== "string" || !/^[0-9a-f-]{36}$/i.test(input.requestKey)) {
    throw new Error("A valid campaign request key is required.");
  }
  if (typeof input.audienceLabel !== "string" || !input.audienceLabel.trim()) {
    throw new Error("The campaign audience label is required.");
  }

  const supabase = getSupabaseAdmin();
  const existing = await supabase
    .from("sms_campaigns")
    .select("*")
    .eq("request_key", input.requestKey)
    .maybeSingle();
  if (existing.error) throw new Error(`Could not check the campaign request: ${existing.error.message}`);
  if (existing.data) return waitForCampaignSnapshot(existing.data as CampaignRow);

  const ids = [...new Set(input.registrationIds as string[])];
  const message = (input.message as string).trim();
  const prepared = await prepareAudience(ids, audienceOptions, input.kind as CampaignKind);
  const estimate = estimateSms(message);
  const estimatedCredits = prepared.valid.size * estimate.parts;
  if (prepared.valid.size === 0) throw new Error("No valid Ghana phone numbers were found in this audience.");

  const balance = await getArkeselBalance();
  if (balance < estimatedCredits) {
    throw new Error(`Insufficient Arkesel credits. Required: ${estimatedCredits.toLocaleString()}; available: ${balance.toLocaleString()}.`);
  }

  const { data: campaignData, error: campaignError } = await supabase
    .from("sms_campaigns")
    .insert({
      request_key: input.requestKey,
      kind: input.kind,
      message,
      audience_label: input.audienceLabel.trim().slice(0, 300),
      encoding: estimate.encoding,
      sms_parts: estimate.parts,
      estimated_credits: estimatedCredits,
      total_recipients: prepared.valid.size + prepared.invalid.length,
      valid_recipients: prepared.valid.size,
      invalid_recipients: prepared.invalid.length,
      duplicate_recipients: prepared.duplicates,
      audience_mode: audienceOptions.mode,
      priority_event_key: audienceOptions.eventKey,
      priority_cutoff: prepared.effectiveCutoff,
      priority_recipients: prepared.priorityRecipients,
      source_campaign_id: prepared.sourceCampaignId,
      sandbox: process.env.ARKESEL_SANDBOX === "true",
    })
    .select("*")
    .single();
  if (campaignError?.code === "23505") {
    const concurrent = await supabase.from("sms_campaigns").select("*").eq("request_key", input.requestKey).single();
    if (!concurrent.error && concurrent.data) return waitForCampaignSnapshot(concurrent.data as CampaignRow);
  }
  if (campaignError) throw new Error(`Could not create the SMS campaign: ${campaignError.message}`);
  const campaign = campaignData as CampaignRow;

  const recipientRows = [
    ...[...prepared.valid.entries()].map(([phone, registration]) => ({
      campaign_id: campaign.id,
      registration_id: registration.id,
      original_phone: registration.phone_number,
      normalized_phone: phone,
      status: "queued",
      priority_tier: prepared.priorityRegistrationIds.has(registration.id) ? 1 : 0,
    })),
    ...prepared.invalid.map((registration) => ({
      campaign_id: campaign.id,
      registration_id: registration.id,
      original_phone: registration.phone_number,
      normalized_phone: null,
      status: "invalid",
      priority_tier: prepared.priorityRegistrationIds.has(registration.id) ? 1 : 0,
      error_code: "INVALID_GHANA_PHONE",
      error_message: "The phone number could not be normalized to 233XXXXXXXXX.",
    })),
  ];

  try {
    for (let index = 0; index < recipientRows.length; index += 500) {
      const { error } = await supabase
        .from("sms_campaign_recipients")
        .insert(recipientRows.slice(index, index + 500));
      if (error) throw error;
    }
  } catch (error) {
    await supabase.from("sms_campaigns").delete().eq("id", campaign.id);
    throw new Error(`Could not snapshot the SMS audience: ${error instanceof Error ? error.message : "database error"}`);
  }

  return campaign;
}

function callbackUrl(): string {
  const appUrl = process.env.APP_URL;
  const callbackSecret = process.env.SMS_CALLBACK_SECRET;
  if (!appUrl || !callbackSecret) throw new Error("SMS callback configuration is incomplete.");
  return `${appUrl.replace(/\/$/, "")}/api/sms-delivery?secret=${encodeURIComponent(callbackSecret)}`;
}

async function saveRecipientRows(rows: RecipientRow[]) {
  if (rows.length === 0) return;
  const { error } = await getSupabaseAdmin()
    .from("sms_campaign_recipients")
    .upsert(rows, { onConflict: "id" });
  if (error) throw new Error(`Could not update SMS recipients: ${error.message}`);
}

function updatedRow(row: RecipientRow, updates: Partial<RecipientRow>): RecipientRow {
  return { ...row, ...updates, updated_at: new Date().toISOString() };
}

async function pauseCampaign(campaignId: string, message: string) {
  await getSupabaseAdmin()
    .from("sms_campaigns")
    .update({ status: "paused", last_error: message, updated_at: new Date().toISOString() })
    .eq("id", campaignId);
}

async function processBatch(campaign: CampaignRow, rows: RecipientRow[]): Promise<void> {
  const phones = rows.flatMap((row) => row.normalized_phone ? [row.normalized_phone] : []);
  if (phones.length === 0) return;

  try {
    const result = await sendArkeselBatch(phones, campaign.message, callbackUrl());
    const accepted = new Map(result.accepted.map((item) => [item.recipient, item.id]));
    const invalid = new Set(result.invalid.flatMap((phone) => {
      const normalized = normalizeGhanaPhone(phone);
      return normalized ? [normalized] : [phone.replace(/\D/g, "")];
    }));
    const now = new Date().toISOString();
    await saveRecipientRows(rows.map((row) => {
      const messageId = row.normalized_phone ? accepted.get(row.normalized_phone) : undefined;
      if (messageId) {
        return updatedRow(row, {
          status: "accepted",
          provider_message_id: messageId,
          provider_status: "ACCEPTED",
          error_code: null,
          error_message: null,
          accepted_at: now,
        });
      }
      if (row.normalized_phone && invalid.has(row.normalized_phone)) {
        return updatedRow(row, {
          status: "invalid",
          provider_status: "INVALID",
          error_code: "ARKESEL_INVALID_NUMBER",
          error_message: "Arkesel rejected this phone number as invalid.",
        });
      }
      return updatedRow(row, {
        status: "needs_review",
        error_code: "MISSING_PROVIDER_RESULT",
        error_message: "Arkesel accepted the batch but returned no result for this recipient.",
      });
    }));
  } catch (error) {
    if (error instanceof ArkeselHttpError) {
      const retryable = error.status === 429 || error.status >= 500;
      if (retryable) {
        const rowsToSave = rows.map((row) => {
          if (row.attempt_count >= 3) {
            return updatedRow(row, {
              status: "failed",
              error_code: `HTTP_${error.status}`,
              error_message: error.message,
            });
          }
          const delaySeconds = [2, 5, 10][Math.min(row.attempt_count - 1, 2)];
          return updatedRow(row, {
            status: "queued",
            next_attempt_at: new Date(Date.now() + delaySeconds * 1000).toISOString(),
            error_code: `HTTP_${error.status}`,
            error_message: error.message,
          });
        });
        await saveRecipientRows(rowsToSave);
        return;
      }

      if ([401, 402, 403, 422].includes(error.status)) {
        await saveRecipientRows(rows.map((row) => updatedRow(row, {
          status: "queued",
          error_code: `HTTP_${error.status}`,
          error_message: error.message,
        })));
        await pauseCampaign(campaign.id, error.message);
        return;
      }

      await saveRecipientRows(rows.map((row) => updatedRow(row, {
        status: "failed",
        error_code: `HTTP_${error.status}`,
        error_message: error.message,
      })));
      return;
    }

    const isTimeout = error instanceof Error && (error.name === "AbortError" || /abort|timeout/i.test(error.message));
    await saveRecipientRows(rows.map((row) => updatedRow(row, {
      status: "needs_review",
      error_code: isTimeout ? "AMBIGUOUS_TIMEOUT" : "AMBIGUOUS_PROVIDER_RESPONSE",
      error_message: error instanceof Error ? error.message : "The provider response was ambiguous.",
    })));
  }
}

export async function refreshCampaign(campaignId: string): Promise<CampaignRow> {
  const { data, error } = await getSupabaseAdmin().rpc("refresh_sms_campaign_status", {
    p_campaign_id: campaignId,
  });
  if (error) throw new Error(`Could not refresh the campaign: ${error.message}`);
  return data as CampaignRow;
}

export async function processCampaign(campaignId: string, deadlineMs = Date.now() + 240_000): Promise<void> {
  const supabase = getSupabaseAdmin();
  while (Date.now() < deadlineMs) {
    const campaignResult = await supabase.from("sms_campaigns").select("*").eq("id", campaignId).single();
    if (campaignResult.error) throw new Error(`Could not load the campaign: ${campaignResult.error.message}`);
    const campaign = campaignResult.data as CampaignRow;
    if (["paused", "cancelled", "completed", "completed_with_failures", "needs_review"].includes(campaign.status)) break;

    await supabase.from("sms_campaigns").update({
      status: "processing",
      started_at: campaign.started_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq("id", campaignId);

    const claims = await Promise.all(Array.from({ length: SMS_BATCH_CONCURRENCY }, () =>
      supabase.rpc("claim_sms_campaign_recipients", { p_campaign_id: campaignId, p_limit: SMS_BATCH_SIZE })
    ));
    const claimError = claims.find((claim) => claim.error)?.error;
    if (claimError) throw new Error(`Could not claim an SMS batch: ${claimError.message}`);
    const batches = claims.map((claim) => (claim.data || []) as RecipientRow[]).filter((rows) => rows.length > 0);
    if (batches.length === 0) break;

    await Promise.all(batches.map((rows) => processBatch(campaign, rows)));
    const refreshed = await refreshCampaign(campaignId);
    if (refreshed.status === "paused") break;
  }
  await refreshCampaign(campaignId);
}

export function mapProviderStatus(status: string): RecipientRow["status"] | null {
  switch (status.toUpperCase()) {
    case "QUEUED":
    case "SUBMITTED": return "accepted";
    case "DELIVERED": return "delivered";
    case "NOT_DELIVERED": return "not_delivered";
    case "EXPIRED": return "expired";
    case "PROHIBITED": return "prohibited";
    default: return null;
  }
}

export async function applyDeliveryStatus(messageId: string, providerStatus: string): Promise<boolean> {
  const mapped = mapProviderStatus(providerStatus);
  if (!mapped) return false;
  const supabase = getSupabaseAdmin();
  const existing = await supabase
    .from("sms_campaign_recipients")
    .select("id, campaign_id, status")
    .eq("provider_message_id", messageId)
    .maybeSingle();
  if (existing.error) throw new Error(existing.error.message);
  if (!existing.data) return false;

  const current = existing.data as { id: string; campaign_id: string; status: string };
  const terminal = new Set(["delivered", "not_delivered", "expired", "prohibited"]);
  if (current.status === "delivered" && mapped !== "delivered") return true;
  if (terminal.has(current.status) && mapped === "accepted") return true;
  const now = new Date().toISOString();
  const { error } = await supabase.from("sms_campaign_recipients").update({
    status: mapped,
    provider_status: providerStatus.toUpperCase(),
    delivered_at: mapped === "delivered" ? now : null,
    updated_at: now,
  }).eq("id", current.id);
  if (error) throw new Error(error.message);
  await refreshCampaign(current.campaign_id);
  return true;
}

export async function reconcileDeliveries(): Promise<void> {
  const supabase = getSupabaseAdmin();
  const olderThan = new Date(Date.now() - 2 * 60_000).toISOString();
  const { data, error } = await supabase
    .from("sms_campaign_recipients")
    .select("provider_message_id, campaign_id")
    .eq("status", "accepted")
    .not("provider_message_id", "is", null)
    .lt("updated_at", olderThan)
    .limit(1000);
  if (error) throw new Error(`Could not load unsettled SMS reports: ${error.message}`);
  const pending = (data || []).flatMap((row) => typeof row.provider_message_id === "string"
    ? [{ id: row.provider_message_id, campaignId: row.campaign_id as string }]
    : []);
  const ids = pending.map((row) => row.id);
  if (ids.length === 0) return;
  const reports = await fetchArkeselReports(ids);
  const affectedCampaigns = new Set<string>();
  const campaignByMessageId = new Map(pending.map((row) => [row.id, row.campaignId]));
  const groups = new Map<string, string[]>();
  for (const report of reports) {
    const mapped = mapProviderStatus(report.status);
    if (!mapped) continue;
    const values = groups.get(mapped) || [];
    values.push(report.id);
    groups.set(mapped, values);
    const campaignId = campaignByMessageId.get(report.id);
    if (campaignId) affectedCampaigns.add(campaignId);
  }

  for (const [status, messageIds] of groups) {
    for (let index = 0; index < messageIds.length; index += 100) {
      const chunk = messageIds.slice(index, index + 100);
      const updates: Record<string, unknown> = {
        status,
        provider_status: status.toUpperCase(),
        updated_at: new Date().toISOString(),
      };
      if (status === "delivered") updates.delivered_at = new Date().toISOString();
      const update = await supabase.from("sms_campaign_recipients").update(updates)
        .in("provider_message_id", chunk).eq("status", "accepted");
      if (update.error) throw new Error(`Could not reconcile SMS statuses: ${update.error.message}`);
    }
  }
  for (const campaignId of affectedCampaigns) await refreshCampaign(campaignId);
}

export async function processPendingCampaigns(): Promise<void> {
  if (process.env.SMS_BULK_ENABLED !== "true") return;
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("sms_campaigns")
    .select("id")
    .in("status", ["queued", "processing"])
    .order("created_at", { ascending: true })
    .limit(5);
  if (error) throw new Error(`Could not load pending campaigns: ${error.message}`);
  for (const campaign of data || []) await processCampaign(campaign.id, Date.now() + 220_000);
  await reconcileDeliveries();
}

export async function campaignAction(campaignId: string, action: string): Promise<CampaignRow> {
  const supabase = getSupabaseAdmin();
  const now = new Date().toISOString();

  if (action === "cancel") {
    await supabase.from("sms_campaign_recipients").update({ status: "cancelled", updated_at: now })
      .eq("campaign_id", campaignId).eq("status", "queued");
    const result = await supabase.from("sms_campaigns").update({ status: "cancelled", cancelled_at: now, updated_at: now })
      .eq("id", campaignId).select("*").single();
    if (result.error) throw new Error(result.error.message);
    return result.data as CampaignRow;
  }

  if (action === "retry_failed") {
    const { error } = await supabase.from("sms_campaign_recipients").update({
      status: "queued",
      attempt_count: 0,
      next_attempt_at: now,
      provider_message_id: null,
      provider_status: null,
      error_code: null,
      error_message: null,
      updated_at: now,
    }).eq("campaign_id", campaignId).in("status", ["not_delivered", "expired"]);
    if (error) throw new Error(error.message);
  } else if (action !== "resume") {
    throw new Error("Unsupported campaign action.");
  }

  const result = await supabase.from("sms_campaigns").update({ status: "queued", last_error: null, completed_at: null, updated_at: now })
    .eq("id", campaignId).select("*").single();
  if (result.error) throw new Error(result.error.message);
  return result.data as CampaignRow;
}

export async function listCampaigns(limit = 30): Promise<Array<CampaignRow & { counts: Record<string, number> }>> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from("sms_campaigns").select("*").order("created_at", { ascending: false }).limit(limit);
  if (error) throw new Error(`Could not load SMS campaigns: ${error.message}`);
  return Promise.all((data || []).map(async (campaign) => {
    const counts = await supabase.rpc("get_sms_campaign_counts", { p_campaign_id: campaign.id });
    if (counts.error) throw new Error(counts.error.message);
    return { ...(campaign as CampaignRow), counts: counts.data as Record<string, number> };
  }));
}

export async function getCampaignDetail(campaignId: string, search = "") {
  const supabase = getSupabaseAdmin();
  const campaignResult = await supabase.from("sms_campaigns").select("*").eq("id", campaignId).single();
  if (campaignResult.error) throw new Error("SMS campaign not found.");
  const countsResult = await supabase.rpc("get_sms_campaign_counts", { p_campaign_id: campaignId });
  if (countsResult.error) throw new Error(countsResult.error.message);

  let query = supabase.from("sms_campaign_recipients")
    .select("id, registration_id, original_phone, normalized_phone, priority_tier, status, attempt_count, provider_message_id, provider_status, error_code, error_message, updated_at")
    .eq("campaign_id", campaignId)
    .order("created_at", { ascending: true })
    .limit(500);
  if (search.trim()) {
    const safe = search.trim().replace(/[%_,()]/g, "");
    query = query.or(`original_phone.ilike.%${safe}%,normalized_phone.ilike.%${safe}%,status.ilike.%${safe}%`);
  }
  const recipients = await query;
  if (recipients.error) throw new Error(recipients.error.message);
  return { campaign: campaignResult.data as CampaignRow, counts: countsResult.data, recipients: recipients.data || [] };
}

export async function exportCampaignRecipients(campaignId: string): Promise<string> {
  const supabase = getSupabaseAdmin();
  const rows: Array<Record<string, unknown>> = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase.from("sms_campaign_recipients")
      .select("original_phone, normalized_phone, priority_tier, status, attempt_count, provider_message_id, provider_status, error_code, error_message, updated_at")
      .eq("campaign_id", campaignId).order("created_at").range(from, from + 999);
    if (error) throw new Error(error.message);
    rows.push(...(data || []));
    if (!data || data.length < 1000) break;
  }
  const headers = ["Original Phone", "Normalized Phone", "Priority", "Status", "Attempts", "Arkesel ID", "Provider Status", "Error Code", "Error", "Updated At"];
  const escape = (value: unknown) => `"${String(value ?? "").replace(/"/g, '""')}"`;
  return [headers.map(escape).join(","), ...rows.map((row) => [
    row.original_phone, row.normalized_phone, Number(row.priority_tier) === 1 ? "Auditorium" : "Standard", row.status, row.attempt_count,
    row.provider_message_id, row.provider_status, row.error_code, row.error_message, row.updated_at,
  ].map(escape).join(","))].join("\n");
}

export function createRequestKey(): string {
  return randomUUID();
}
