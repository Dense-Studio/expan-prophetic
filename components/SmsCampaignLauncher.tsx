import React, { useState } from "react";
import { createSmsCampaign, previewSmsCampaign, SmsAudienceOptions, SmsCampaignPreview } from "../lib/smsCampaignApi";

interface SmsCampaignLauncherProps {
  kind: "reminder" | "live" | "general";
  message: string;
  registrationIds: string[];
  audienceLabel: string;
  tone?: "amber" | "brand";
  buttonLabel: string;
  audienceOptions?: SmsAudienceOptions;
}

const SmsCampaignLauncher: React.FC<SmsCampaignLauncherProps> = ({
  kind,
  message,
  registrationIds,
  audienceLabel,
  tone = "brand",
  buttonLabel,
  audienceOptions,
}) => {
  const [preview, setPreview] = useState<SmsCampaignPreview | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [requestKey, setRequestKey] = useState("");

  const openPreview = async () => {
    setError("");
    setSuccess("");
    setIsPreviewing(true);
    try {
      setPreview(await previewSmsCampaign({ kind, message: message.trim(), registrationIds, ...audienceOptions }));
      setRequestKey(crypto.randomUUID());
    } catch (previewError) {
      setError(previewError instanceof Error ? previewError.message : "Could not prepare the SMS campaign.");
    } finally {
      setIsPreviewing(false);
    }
  };

  const confirmCampaign = async () => {
    if (!preview || preview.validRecipients === 0 || !preview.sufficientBalance || !preview.enabled || !requestKey) return;
    setIsCreating(true);
    setError("");
    try {
      const campaign = await createSmsCampaign({
        requestKey,
        kind,
        message: message.trim(),
        audienceLabel,
        registrationIds,
        ...audienceOptions,
      });
      setPreview(null);
      setSuccess(`Campaign queued for ${campaign.valid_recipients.toLocaleString()} valid recipients.`);
      window.dispatchEvent(new CustomEvent("expan:sms-campaign-created", { detail: campaign.id }));
    } catch (campaignError) {
      setError(campaignError instanceof Error ? campaignError.message : "Could not start the SMS campaign.");
    } finally {
      setIsCreating(false);
    }
  };

  const isAmber = tone === "amber";
  return (
    <>
      <div className={`rounded-xl p-4 text-white flex flex-col justify-between shadow-sm ${isAmber ? "bg-gradient-to-br from-amber-500 to-amber-600" : "bg-brand"}`}>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/60">Selected records</p>
          <p className="text-3xl font-extrabold mt-1">{registrationIds.length.toLocaleString()}</p>
          <p className="text-xs text-white/75 mt-1 leading-relaxed">{audienceLabel}</p>
          <p className="text-[10px] text-white/55 mt-2">The server validates, deduplicates and snapshots this audience before sending.</p>
        </div>
        <button
          type="button"
          onClick={() => void openPreview()}
          disabled={isPreviewing || !message.trim() || registrationIds.length === 0}
          className={`mt-5 w-full h-12 rounded-xl bg-white font-bold text-sm hover:bg-cream transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${isAmber ? "text-amber-700" : "text-brand"}`}
        >
          {isPreviewing ? <><span className="spinner spinner-dark" />Checking...</> : <><span className="material-symbols-outlined text-lg">fact_check</span>{buttonLabel}</>}
        </button>
      </div>

      {error && <div className="lg:col-span-2 flex items-center gap-2 text-red-600 text-sm bg-red-50 px-4 py-3 rounded-xl border border-red-200"><span className="material-symbols-outlined text-lg">error</span>{error}</div>}
      {success && <div className="lg:col-span-2 flex items-center gap-2 text-emerald-700 text-sm bg-emerald-50 px-4 py-3 rounded-xl border border-emerald-200"><span className="material-symbols-outlined text-lg">check_circle</span>{success}</div>}

      {preview && (
        <div className="fixed inset-0 z-[100] bg-black/55 backdrop-blur-sm flex items-center justify-center p-4" onMouseDown={() => !isCreating && setPreview(null)}>
          <div className="w-full max-w-lg rounded-3xl bg-[#fffaf6] shadow-2xl border border-brand/10 overflow-hidden" onMouseDown={(event) => event.stopPropagation()}>
            <div className="px-6 py-5 bg-brand text-white flex items-center justify-between">
              <div><p className="text-[10px] uppercase tracking-[0.15em] text-white/55 font-bold">Final safety check</p><h3 className="font-serif text-2xl mt-1">Confirm SMS Campaign</h3></div>
              <button type="button" onClick={() => setPreview(null)} disabled={isCreating} className="w-10 h-10 rounded-full hover:bg-white/10 flex items-center justify-center"><span className="material-symbols-outlined">close</span></button>
            </div>
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  ["Valid recipients", preview.validRecipients.toLocaleString()],
                  ["SMS parts", preview.smsParts.toString()],
                  ["Credits required", preview.estimatedCredits.toLocaleString()],
                  ["Available credits", preview.availableCredits.toLocaleString()],
                  ["Batches", preview.batches.toString()],
                  ["Encoding", preview.encoding],
                ].map(([label, value]) => <div key={label} className="rounded-xl bg-white border border-brand/10 p-3"><p className="text-[10px] uppercase tracking-wider text-brand/45 font-bold">{label}</p><p className="text-lg font-extrabold text-brand-dark mt-1">{value}</p></div>)}
              </div>
              {preview.audienceMode !== "standard" && (
                <div className="rounded-xl bg-violet-50 border border-violet-200 p-4 text-sm text-violet-900">
                  <p className="font-bold">Auditorium-aware delivery</p>
                  <p className="mt-1">
                    {preview.priorityRecipients.toLocaleString()} auditorium recipient{preview.priorityRecipients === 1 ? "" : "s"}
                    {preview.audienceMode === "auditorium_first" && ` will be submitted before ${preview.remainingRecipients.toLocaleString()} remaining recipients.`}
                    {preview.audienceMode === "auditorium_only" && " will receive this auditorium-only campaign."}
                    {preview.audienceMode === "new_arrivals" && " joined after the previous live campaign and have not already received it."}
                  </p>
                  {preview.effectiveCutoff && <p className="text-xs text-violet-700 mt-2">Arrival window: {new Date(preview.effectiveCutoff).toLocaleString()}</p>}
                  {preview.excludedAlreadyContacted > 0 && <p className="text-xs text-violet-700 mt-1">{preview.excludedAlreadyContacted} previously contacted number{preview.excludedAlreadyContacted === 1 ? " was" : "s were"} excluded.</p>}
                </div>
              )}
              {preview.deliveryHistoryFilterApplied && (
                <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-sm text-emerald-900">
                  <p className="font-bold">Previous EXPAN delivery filter</p>
                  <p className="mt-1">
                    Including only: {preview.deliveryHistoryStatuses.map(status => status === "accepted" ? "submitted / accepted" : status.replaceAll("_", " ")).join(", ")}.
                    {` ${preview.excludedByDeliveryHistory.toLocaleString()} valid number${preview.excludedByDeliveryHistory === 1 ? " was" : "s were"} excluded.`}
                  </p>
                  <p className="text-xs text-emerald-700 mt-2">
                    {preview.deliveryHistoryCampaigns.toLocaleString()} EXPAN campaign{preview.deliveryHistoryCampaigns === 1 ? "" : "s"} checked
                    {preview.deliveryHistoryFrom && preview.deliveryHistoryTo ? ` from ${new Date(preview.deliveryHistoryFrom).toLocaleString()} to ${new Date(preview.deliveryHistoryTo).toLocaleString()}` : ""}.
                  </p>
                </div>
              )}
              {(preview.invalidRecipients > 0 || preview.duplicateRecipients > 0 || preview.missingRegistrations > 0) && (
                <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">
                  {preview.invalidRecipients} invalid, {preview.duplicateRecipients} duplicate and {preview.missingRegistrations} missing registration records will not be charged.
                </div>
              )}
              {!preview.sufficientBalance && <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-700 font-medium">Insufficient Arkesel credits. Top up before sending.</div>}
              {preview.validRecipients === 0 && <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800 font-medium">No valid recipients currently match this audience. Refresh arrivals or choose another audience mode.</div>}
              {!preview.enabled && <div className="rounded-xl bg-slate-100 border border-slate-200 p-4 text-sm text-slate-700">Bulk sending is safely disabled until the production migration, secrets and pilot are complete.</div>}
              {preview.sandbox && <div className="rounded-xl bg-sky-50 border border-sky-200 p-4 text-sm text-sky-700 font-medium">Sandbox mode is active. Arkesel will not deliver or bill these messages.</div>}
              <div className="rounded-xl bg-white border border-brand/10 p-4"><p className="text-[10px] uppercase tracking-wider text-brand/45 font-bold mb-2">Message</p><p className="text-sm whitespace-pre-wrap text-brand-dark leading-relaxed">{message.trim()}</p></div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setPreview(null)} disabled={isCreating} className="h-12 flex-1 rounded-xl border border-brand/15 text-brand font-bold">Go Back</button>
                <button type="button" onClick={() => void confirmCampaign()} disabled={isCreating || preview.validRecipients === 0 || !preview.sufficientBalance || !preview.enabled} className="h-12 flex-[1.4] rounded-xl bg-brand text-white font-bold disabled:opacity-40 flex items-center justify-center gap-2">
                  {isCreating ? <><span className="spinner" />Queuing...</> : <><span className="material-symbols-outlined text-lg">send</span>Confirm & Queue</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SmsCampaignLauncher;
