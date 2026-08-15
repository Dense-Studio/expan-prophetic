import React, { useMemo, useState } from "react";
import { EVENT } from "../lib/event";
import { SmsAudienceMode } from "../lib/smsCampaignApi";
import { estimateSms } from "../lib/smsEncoding";
import SmsCampaignLauncher from "./SmsCampaignLauncher";

interface GenericBroadcastSmsPanelProps {
  registrationIds: string[];
  audienceLabel: string;
  onRefreshAudience?: () => Promise<void>;
}

const DEFAULT_THANK_YOU_MESSAGE = "Thank you for joining us at EXPAN All-Night 2026. We are grateful you were part of this powerful encounter. May the word and presence of God continue to work in your life. Stay connected and keep expecting more from God.";

const GenericBroadcastSmsPanel: React.FC<GenericBroadcastSmsPanelProps> = ({
  registrationIds,
  audienceLabel,
  onRefreshAudience,
}) => {
  const [message, setMessage] = useState(DEFAULT_THANK_YOU_MESSAGE);
  const [isExpanded, setIsExpanded] = useState(false);
  const [audienceMode, setAudienceMode] = useState<SmsAudienceMode>("auditorium_only");
  const [arrivalCutoff, setArrivalCutoff] = useState("2026-08-14T19:00");
  const [isRefreshingAudience, setIsRefreshingAudience] = useState(false);
  const trimmedMessage = message.trim();
  const estimate = estimateSms(trimmedMessage);
  const arrivalCutoffIso = useMemo(() => {
    const parsed = Date.parse(`${arrivalCutoff}:00Z`);
    return Number.isNaN(parsed) ? EVENT.checkInOpensAt : new Date(parsed).toISOString();
  }, [arrivalCutoff]);
  const priorityAudienceLabel = useMemo(() => {
    const suffix: Record<SmsAudienceMode, string> = {
      standard: "normal delivery order",
      auditorium_first: "tonight's auditorium arrivals first",
      auditorium_only: "tonight's auditorium attendees only",
      new_arrivals: "new arrivals since the previous generic broadcast",
    };
    return `${audienceLabel}; ${suffix[audienceMode]}`;
  }, [audienceLabel, audienceMode]);

  return (
    <section className="bg-white/75 border border-brand/10 rounded-2xl shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setIsExpanded(current => !current)}
        className="w-full px-5 py-4 flex items-center justify-between gap-4 text-left hover:bg-white/60 transition-colors"
        aria-expanded={isExpanded}
      >
        <span className="flex items-center gap-3 min-w-0">
          <span className="w-11 h-11 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
            <span className="material-symbols-outlined">forum</span>
          </span>
          <span className="min-w-0">
            <span className="block text-brand-dark font-bold">Generic Broadcast SMS</span>
            <span className="block text-xs text-brand/55 mt-0.5">Write a custom message for your chosen audience.</span>
          </span>
        </span>
        <span className={`material-symbols-outlined text-brand/50 transition-transform ${isExpanded ? "rotate-180" : ""}`}>expand_more</span>
      </button>

      {isExpanded && (
        <div className="border-t border-brand/10 p-5 space-y-5 animate-fade-in">
          <div className="rounded-2xl border border-violet-200 bg-violet-50/70 p-4 space-y-4">
            <div className="flex items-start gap-3">
              <span className="w-10 h-10 rounded-xl bg-violet-600 text-white flex items-center justify-center shrink-0"><span className="material-symbols-outlined">groups</span></span>
              <div>
                <p className="font-bold text-violet-950">Delivery audience</p>
                <p className="text-xs text-violet-700 mt-0.5">This thank-you message defaults to people recorded in the auditorium only.</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
              {([
                ["auditorium_only", "Auditorium Only", "Thank only recorded attendees"],
                ["auditorium_first", "Auditorium First", "Attendees first, then everyone else"],
                ["new_arrivals", "New Arrivals", "Follow up after an earlier generic send"],
                ["standard", "Normal Order", "Use the current filtered audience"],
              ] as Array<[SmsAudienceMode, string, string]>).map(([value, label, description]) => (
                <button key={value} type="button" onClick={() => setAudienceMode(value)} aria-pressed={audienceMode === value} className={`rounded-xl border p-3 text-left transition-all ${audienceMode === value ? "border-violet-600 bg-white shadow-sm ring-2 ring-violet-200" : "border-violet-200 bg-white/60 hover:bg-white"}`}>
                  <span className="block text-xs font-bold text-violet-950">{label}</span>
                  <span className="block text-[10px] leading-relaxed text-violet-600 mt-1">{description}</span>
                </button>
              ))}
            </div>
            {audienceMode !== "standard" && (
              <div className="flex flex-col sm:flex-row sm:items-end gap-3">
                <label className="block max-w-sm flex-1">
                  <span className="block text-[10px] font-bold uppercase tracking-[0.12em] text-violet-700 mb-1.5">Arrival window starts</span>
                  <input type="datetime-local" value={arrivalCutoff} onChange={event => setArrivalCutoff(event.target.value)} className="w-full h-11 px-3 rounded-xl border border-violet-200 bg-white text-sm text-violet-950 focus:outline-none focus:ring-2 focus:ring-violet-200" />
                  <span className="block text-[10px] text-violet-600 mt-1">Ghana time. Check-ins and new August registrations from this time qualify.</span>
                </label>
                {onRefreshAudience && <button type="button" disabled={isRefreshingAudience} onClick={async () => { setIsRefreshingAudience(true); try { await onRefreshAudience(); } finally { setIsRefreshingAudience(false); } }} className="h-11 px-4 rounded-xl border border-violet-300 bg-white text-violet-800 text-xs font-bold flex items-center justify-center gap-1.5 disabled:opacity-50"><span className={`material-symbols-outlined text-base ${isRefreshingAudience ? "animate-spin" : ""}`}>refresh</span>Refresh arrivals</button>}
              </div>
            )}
          </div>

          <label className="block">
            <span className="flex items-center justify-between gap-3 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-brand/70">Your message</span>
              <button type="button" onClick={() => setMessage(DEFAULT_THANK_YOU_MESSAGE)} className="text-[11px] font-bold text-brand hover:text-brand-dark">Reset thank-you message</button>
            </span>
            <textarea value={message} onChange={event => setMessage(event.target.value)} rows={7} maxLength={918} className="w-full resize-y rounded-xl border border-brand/15 bg-white px-4 py-3 text-sm leading-relaxed text-brand-dark placeholder:text-brand/35 focus:outline-none focus:border-brand/50 focus:ring-2 focus:ring-brand/10" placeholder="Write the message you want to send..." />
          </label>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4 items-stretch">
            <div className="rounded-xl bg-[#f8f3ef] border border-brand/10 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3"><p className="text-[11px] font-bold uppercase tracking-[0.12em] text-brand/65">SMS Preview</p><span className="text-[10px] text-brand/45">{estimate.characters} characters · {estimate.parts} part{estimate.parts === 1 ? "" : "s"} · {estimate.encoding}</span></div>
              <p className={`whitespace-pre-wrap text-sm leading-relaxed ${trimmedMessage ? "text-brand-dark" : "text-brand/40"}`}>{trimmedMessage || "Your custom broadcast preview will appear here."}</p>
            </div>
            <SmsCampaignLauncher kind="general" message={trimmedMessage} registrationIds={registrationIds} audienceLabel={priorityAudienceLabel} audienceOptions={{ audienceMode, ...(audienceMode === "standard" ? {} : { priorityEventKey: EVENT.key, priorityCutoff: arrivalCutoffIso }) }} tone="brand" buttonLabel="Review & Send" />
          </div>
        </div>
      )}
    </section>
  );
};

export default GenericBroadcastSmsPanel;
