import { apiRequest } from "./api";

export type SmsCampaignStatus =
  | "queued" | "processing" | "awaiting_delivery" | "completed"
  | "completed_with_failures" | "needs_review" | "paused" | "cancelled";

export type SmsAudienceMode = "standard" | "auditorium_first" | "auditorium_only" | "new_arrivals";

export interface SmsAudienceOptions {
  audienceMode: SmsAudienceMode;
  priorityEventKey?: string;
  priorityCutoff?: string;
}

export interface SmsCampaignCounts {
  total: number;
  queued: number;
  submitting: number;
  accepted: number;
  delivered: number;
  not_delivered: number;
  expired: number;
  prohibited: number;
  failed: number;
  invalid: number;
  needs_review: number;
  cancelled: number;
}

export interface SmsCampaign {
  id: string;
  request_key: string;
  kind: "reminder" | "live" | "general";
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
  status: SmsCampaignStatus;
  sandbox: boolean;
  last_error: string | null;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  updated_at: string;
  counts?: SmsCampaignCounts;
}

export interface SmsCampaignPreview {
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

export interface SmsCampaignRecipient {
  id: string;
  original_phone: string;
  normalized_phone: string | null;
  status: string;
  attempt_count: number;
  provider_message_id: string | null;
  provider_status: string | null;
  priority_tier: 0 | 1;
  error_code: string | null;
  error_message: string | null;
  updated_at: string;
}

export async function previewSmsCampaign(input: {
  kind: "reminder" | "live" | "general";
  message: string;
  registrationIds: string[];
} & Partial<SmsAudienceOptions>): Promise<SmsCampaignPreview> {
  const result = await apiRequest<{ preview: SmsCampaignPreview }>("/api/admin/sms-preview", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return result.preview;
}

export async function createSmsCampaign(input: {
  requestKey: string;
  kind: "reminder" | "live" | "general";
  message: string;
  audienceLabel: string;
  registrationIds: string[];
} & Partial<SmsAudienceOptions>): Promise<SmsCampaign> {
  const result = await apiRequest<{ campaign: SmsCampaign }>("/api/admin/sms-campaigns", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return result.campaign;
}

export async function listSmsCampaigns(): Promise<SmsCampaign[]> {
  const result = await apiRequest<{ campaigns: SmsCampaign[] }>("/api/admin/sms-campaigns");
  return result.campaigns;
}

export async function getSmsCampaign(id: string, search = "") {
  const query = new URLSearchParams();
  if (search) query.set("search", search);
  const suffix = query.size ? `?${query.toString()}` : "";
  const result = await apiRequest<{
    detail: { campaign: SmsCampaign; counts: SmsCampaignCounts; recipients: SmsCampaignRecipient[] };
  }>(`/api/admin/sms-campaigns/${id}${suffix}`);
  return result.detail;
}

export async function runSmsCampaignAction(
  campaignId: string,
  action: "cancel" | "resume" | "retry_failed",
): Promise<SmsCampaign> {
  const result = await apiRequest<{ campaign: SmsCampaign }>("/api/admin/sms-campaign-action", {
    method: "POST",
    body: JSON.stringify({ campaignId, action }),
  });
  return result.campaign;
}

export async function downloadSmsCampaignCsv(campaignId: string): Promise<void> {
  const response = await fetch(`/api/admin/sms-campaigns/${campaignId}?format=csv`, { credentials: "same-origin" });
  if (!response.ok) throw new Error("Could not export the campaign report.");
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `expan-sms-campaign-${campaignId}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
