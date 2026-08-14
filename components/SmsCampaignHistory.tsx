import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  downloadSmsCampaignCsv,
  getSmsCampaign,
  listSmsCampaigns,
  runSmsCampaignAction,
  SmsCampaign,
  SmsCampaignCounts,
  SmsCampaignRecipient,
} from "../lib/smsCampaignApi";

const ACTIVE_STATUSES = new Set(["queued", "processing", "awaiting_delivery"]);

const STATUS_LABELS: Record<string, string> = {
  queued: "Queued",
  processing: "Sending",
  awaiting_delivery: "Awaiting delivery",
  completed: "Delivered",
  completed_with_failures: "Completed with issues",
  needs_review: "Needs review",
  paused: "Paused",
  cancelled: "Cancelled",
};

function statusClass(status: string): string {
  if (status === "completed" || status === "delivered") return "bg-emerald-100 text-emerald-700";
  if (["queued", "processing", "awaiting_delivery"].includes(status)) return "bg-sky-100 text-sky-700";
  if (["needs_review", "paused", "completed_with_failures"].includes(status)) return "bg-amber-100 text-amber-800";
  if (["failed", "not_delivered", "expired", "prohibited", "invalid"].includes(status)) return "bg-red-100 text-red-700";
  return "bg-slate-200 text-slate-700";
}

function countValue(counts: SmsCampaignCounts | undefined, key: keyof SmsCampaignCounts): number {
  return Number(counts?.[key] || 0);
}

const SmsCampaignHistory: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [campaigns, setCampaigns] = useState<SmsCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedCampaign, setSelectedCampaign] = useState<SmsCampaign | null>(null);
  const [counts, setCounts] = useState<SmsCampaignCounts | null>(null);
  const [recipients, setRecipients] = useState<SmsCampaignRecipient[]>([]);
  const [search, setSearch] = useState("");
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const loadCampaigns = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      setCampaigns(await listSmsCampaigns());
      setError("");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load SMS campaign history.");
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  const loadDetail = useCallback(async (campaignId: string, query = "") => {
    setDetailLoading(true);
    try {
      const detail = await getSmsCampaign(campaignId, query);
      setSelectedCampaign(detail.campaign);
      setCounts(detail.counts);
      setRecipients(detail.recipients);
      setError("");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load campaign details.");
    } finally {
      setDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCampaigns();
    const handleCreated = () => void loadCampaigns(true);
    window.addEventListener("expan:sms-campaign-created", handleCreated);
    return () => window.removeEventListener("expan:sms-campaign-created", handleCreated);
  }, [loadCampaigns]);

  const hasActiveCampaign = campaigns.some((campaign) => ACTIVE_STATUSES.has(campaign.status));
  useEffect(() => {
    if (!hasActiveCampaign) return;
    const interval = window.setInterval(() => {
      void loadCampaigns(true);
      if (selectedId) void loadDetail(selectedId, search);
    }, 3000);
    return () => window.clearInterval(interval);
  }, [hasActiveCampaign, loadCampaigns, loadDetail, search, selectedId]);

  useEffect(() => {
    if (!selectedId) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const close = (event: KeyboardEvent) => event.key === "Escape" && !actionLoading && setSelectedId(null);
    window.addEventListener("keydown", close);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", close);
    };
  }, [selectedId, actionLoading]);

  const openCampaign = (campaign: SmsCampaign) => {
    setSelectedId(campaign.id);
    setSelectedCampaign(campaign);
    setCounts(campaign.counts || null);
    setRecipients([]);
    setSearch("");
    void loadDetail(campaign.id);
  };

  const runAction = async (action: "cancel" | "resume" | "retry_failed") => {
    if (!selectedCampaign || actionLoading) return;
    const prompt = action === "cancel"
      ? "Cancel every recipient that has not yet been submitted? Accepted messages cannot be recalled."
      : action === "retry_failed"
        ? "Retry only NOT_DELIVERED and EXPIRED recipients?"
        : "Resume this paused SMS campaign?";
    if (!window.confirm(prompt)) return;
    setActionLoading(true);
    try {
      await runSmsCampaignAction(selectedCampaign.id, action);
      await Promise.all([loadCampaigns(true), loadDetail(selectedCampaign.id, search)]);
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "The campaign action failed.");
    } finally {
      setActionLoading(false);
    }
  };

  const retryableCount = useMemo(() => countValue(counts || undefined, "not_delivered") + countValue(counts || undefined, "expired"), [counts]);

  return (
    <section className="bg-white/75 border border-brand/10 rounded-2xl shadow-sm overflow-hidden">
      <button type="button" onClick={() => setIsExpanded((value) => !value)} className="w-full px-5 py-4 flex items-center justify-between gap-4 text-left hover:bg-white/60 transition-colors" aria-expanded={isExpanded}>
        <span className="flex items-center gap-3 min-w-0">
          <span className="w-11 h-11 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm"><span className="material-symbols-outlined">monitoring</span></span>
          <span><span className="block text-brand-dark font-bold">SMS Campaign History</span><span className="block text-xs text-brand/55 mt-0.5">Track actual delivery, review issues and safely resume campaigns.</span></span>
        </span>
        <span className={`material-symbols-outlined text-brand/50 transition-transform ${isExpanded ? "rotate-180" : ""}`}>expand_more</span>
      </button>

      {isExpanded && (
        <div className="border-t border-brand/10 p-5 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[11px] uppercase tracking-[0.13em] font-bold text-brand/60">Latest campaigns</p>
            <button type="button" onClick={() => void loadCampaigns()} className="h-9 px-3 rounded-lg border border-brand/10 bg-white text-brand text-xs font-bold flex items-center gap-1.5"><span className="material-symbols-outlined text-base">refresh</span>Refresh</button>
          </div>
          {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
          {loading ? (
            <div className="py-10 flex justify-center"><span className="spinner spinner-dark" /></div>
          ) : campaigns.length === 0 ? (
            <div className="rounded-xl border border-dashed border-brand/15 py-10 text-center text-sm text-brand/45">No bulk SMS campaigns yet.</div>
          ) : (
            <div className="space-y-3">
              {campaigns.map((campaign) => {
                const total = countValue(campaign.counts, "total") || campaign.total_recipients;
                const queued = countValue(campaign.counts, "queued") + countValue(campaign.counts, "submitting");
                const handled = Math.max(0, total - queued);
                const progress = total ? Math.round((handled / total) * 100) : 0;
                return (
                  <button key={campaign.id} type="button" onClick={() => openCampaign(campaign)} className="w-full rounded-xl border border-brand/10 bg-white p-4 text-left hover:border-brand/30 hover:shadow-sm transition-all">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2"><span className="text-sm font-bold text-brand-dark">{campaign.kind === "live" ? "Live Broadcast" : "Programme Reminder"}</span><span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${statusClass(campaign.status)}`}>{STATUS_LABELS[campaign.status] || campaign.status}</span>{campaign.sandbox && <span className="px-2 py-1 rounded-full bg-violet-100 text-violet-700 text-[10px] font-bold">SANDBOX</span>}</div>
                        <p className="text-xs text-brand/50 mt-1 truncate max-w-2xl">{campaign.audience_label} · {new Date(campaign.created_at).toLocaleString()}</p>
                      </div>
                      <div className="text-right"><p className="text-lg font-extrabold text-brand-dark">{handled.toLocaleString()} / {total.toLocaleString()}</p><p className="text-[10px] text-brand/45">{countValue(campaign.counts, "delivered").toLocaleString()} delivered</p></div>
                    </div>
                    <div className="mt-3 h-2 rounded-full bg-brand/8 overflow-hidden"><div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${progress}%` }} /></div>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-brand/50"><span>{campaign.estimated_credits.toLocaleString()} credits</span><span>{campaign.sms_parts} part{campaign.sms_parts === 1 ? "" : "s"}</span><span>{countValue(campaign.counts, "failed") + countValue(campaign.counts, "not_delivered") + countValue(campaign.counts, "expired")} failed</span><span>{countValue(campaign.counts, "needs_review")} need review</span></div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {selectedId && selectedCampaign && (
        <div className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6" onMouseDown={() => !actionLoading && setSelectedId(null)}>
          <div className="w-full max-w-5xl max-h-[92vh] rounded-3xl bg-[#fffaf6] shadow-2xl overflow-hidden flex flex-col" onMouseDown={(event) => event.stopPropagation()}>
            <div className="px-5 sm:px-7 py-5 bg-brand text-white flex items-start justify-between gap-4">
              <div><div className="flex flex-wrap items-center gap-2"><h3 className="font-serif text-2xl">SMS Campaign Details</h3><span className={`px-2 py-1 rounded-full text-[10px] font-bold ${statusClass(selectedCampaign.status)}`}>{STATUS_LABELS[selectedCampaign.status] || selectedCampaign.status}</span></div><p className="text-xs text-white/60 mt-1">{selectedCampaign.audience_label} · {new Date(selectedCampaign.created_at).toLocaleString()}</p></div>
              <button type="button" onClick={() => setSelectedId(null)} disabled={actionLoading} className="w-10 h-10 shrink-0 rounded-full hover:bg-white/10 flex items-center justify-center"><span className="material-symbols-outlined">close</span></button>
            </div>
            <div className="p-5 sm:p-7 overflow-y-auto space-y-5">
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                {(["queued", "submitting", "accepted", "delivered", "failed", "invalid", "needs_review"] as const).map((key) => <div key={key} className="rounded-xl bg-white border border-brand/10 p-3"><p className="text-[9px] uppercase tracking-wider text-brand/45 font-bold">{key.replace("_", " ")}</p><p className="text-xl font-extrabold text-brand-dark mt-1">{countValue(counts || undefined, key).toLocaleString()}</p></div>)}
              </div>
              {selectedCampaign.last_error && <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">{selectedCampaign.last_error}</div>}
              <div className="rounded-xl bg-white border border-brand/10 p-4"><p className="text-[10px] uppercase tracking-wider text-brand/45 font-bold mb-2">Message</p><p className="text-sm whitespace-pre-wrap text-brand-dark">{selectedCampaign.message}</p></div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => void downloadSmsCampaignCsv(selectedId)} className="h-10 px-4 rounded-xl border border-brand/15 bg-white text-brand text-xs font-bold flex items-center gap-1.5"><span className="material-symbols-outlined text-base">download</span>Export CSV</button>
                {["queued", "processing"].includes(selectedCampaign.status) && <button type="button" onClick={() => void runAction("cancel")} disabled={actionLoading} className="h-10 px-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold">Cancel Unsent</button>}
                {selectedCampaign.status === "paused" && <button type="button" onClick={() => void runAction("resume")} disabled={actionLoading} className="h-10 px-4 rounded-xl bg-sky-600 text-white text-xs font-bold">Resume Campaign</button>}
                {retryableCount > 0 && <button type="button" onClick={() => void runAction("retry_failed")} disabled={actionLoading} className="h-10 px-4 rounded-xl bg-amber-500 text-white text-xs font-bold">Retry {retryableCount} Failed</button>}
              </div>
              <form onSubmit={(event) => { event.preventDefault(); void loadDetail(selectedId, search); }} className="flex gap-2"><input value={search} onChange={(event) => setSearch(event.target.value)} className="clean-input flex-1 h-11 px-4" placeholder="Search phone or status" /><button type="submit" className="h-11 px-4 rounded-xl bg-brand text-white text-xs font-bold">Search</button></form>
              <div className="rounded-xl border border-brand/10 bg-white overflow-x-auto">
                {detailLoading ? <div className="py-12 flex justify-center"><span className="spinner spinner-dark" /></div> : (
                  <table className="w-full text-left text-xs min-w-[760px]"><thead className="bg-brand/5 text-brand/60 uppercase tracking-wider text-[9px]"><tr><th className="px-4 py-3">Phone</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Attempts</th><th className="px-4 py-3">Arkesel ID</th><th className="px-4 py-3">Error</th><th className="px-4 py-3">Updated</th></tr></thead><tbody className="divide-y divide-brand/5">{recipients.map((recipient) => <tr key={recipient.id}><td className="px-4 py-3 font-medium text-brand-dark">{recipient.normalized_phone || recipient.original_phone}</td><td className="px-4 py-3"><span className={`px-2 py-1 rounded-full font-bold ${statusClass(recipient.status)}`}>{recipient.status.replace("_", " ")}</span></td><td className="px-4 py-3">{recipient.attempt_count}</td><td className="px-4 py-3 font-mono text-[10px] text-brand/50">{recipient.provider_message_id || "-"}</td><td className="px-4 py-3 text-red-600 max-w-xs truncate" title={recipient.error_message || ""}>{recipient.error_code || recipient.error_message || "-"}</td><td className="px-4 py-3 text-brand/45">{new Date(recipient.updated_at).toLocaleString()}</td></tr>)}</tbody></table>
                )}
                {!detailLoading && recipients.length === 0 && <div className="py-10 text-center text-sm text-brand/45">No recipients match this search.</div>}
              </div>
              {recipients.length === 500 && <p className="text-[10px] text-brand/45 text-center">Showing the first 500 matching recipients. Export CSV for the complete report.</p>}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default SmsCampaignHistory;
