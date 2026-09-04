import React, { useMemo, useState } from "react";
import type { Registration } from "../lib/adminDb";
import { EVENT } from "../lib/event";
import { matchOutreachLocationId, PROPHETIC_SUNDAYS_LOCATIONS } from "../lib/locationTargeting";
import { SmsAudienceMode, SmsDeliveryHistoryStatus } from "../lib/smsCampaignApi";
import { estimateSms } from "../lib/smsEncoding";
import SmsCampaignLauncher from "./SmsCampaignLauncher";

interface GenericBroadcastSmsPanelProps {
  registrations: Registration[];
  audienceLabel: string;
  onRefreshAudience?: () => Promise<void>;
}

const DEFAULT_THANK_YOU_MESSAGE = "Thank you for joining us at EXPAN All-Night 2026. We are grateful you were part of this powerful encounter. May the word and presence of God continue to work in your life. Stay connected and keep expecting more from God.";
const PROPHETIC_SUNDAYS_MESSAGE = "Join Prophet Emmanuel Andoh for 3 Sundays of the Prophetic: 6th, 13th & 20th Sept at Inchaban Star Oil Filling Station, 5 PM each night. Come expectant!";
const PROPHETIC_SUNDAYS_LOCATION_IDS = PROPHETIC_SUNDAYS_LOCATIONS.map(location => location.id);

const DELIVERY_STATUS_OPTIONS: Array<[SmsDeliveryHistoryStatus, string, string]> = [
  ["delivered", "Delivered", "Confirmed delivered to the handset"],
  ["accepted", "Submitted / Accepted", "Still not confirmed after submission"],
  ["not_delivered", "Not Delivered", "The provider confirmed delivery failed"],
  ["expired", "Expired", "Delivery expired before reaching the handset"],
  ["prohibited", "Prohibited", "The provider blocked the message"],
  ["needs_review", "Needs Review", "Submission result is uncertain"],
  ["failed", "Failed", "The submission itself failed"],
];

function toGhanaIso(value: string): string {
  const parsed = Date.parse(`${value}:00Z`);
  return Number.isNaN(parsed) ? "" : new Date(parsed).toISOString();
}

const GenericBroadcastSmsPanel: React.FC<GenericBroadcastSmsPanelProps> = ({
  registrations,
  audienceLabel,
  onRefreshAudience,
}) => {
  const [message, setMessage] = useState(PROPHETIC_SUNDAYS_MESSAGE);
  const [isExpanded, setIsExpanded] = useState(false);
  const [audienceMode, setAudienceMode] = useState<SmsAudienceMode>("standard");
  const [locationTargetingEnabled, setLocationTargetingEnabled] = useState(true);
  const [selectedLocationIds, setSelectedLocationIds] = useState<string[]>(PROPHETIC_SUNDAYS_LOCATION_IDS);
  const [arrivalCutoff, setArrivalCutoff] = useState("2026-08-14T19:00");
  const [deliveryHistoryEnabled, setDeliveryHistoryEnabled] = useState(false);
  const [deliveryHistoryStatuses, setDeliveryHistoryStatuses] = useState<SmsDeliveryHistoryStatus[]>(["delivered"]);
  const [deliveryHistoryFrom, setDeliveryHistoryFrom] = useState("2026-08-14T00:00");
  const [deliveryHistoryTo, setDeliveryHistoryTo] = useState("2026-08-15T00:00");
  const [isRefreshingAudience, setIsRefreshingAudience] = useState(false);
  const trimmedMessage = message.trim();
  const estimate = estimateSms(trimmedMessage);
  const locationCounts = useMemo(() => {
    const counts = new Map(PROPHETIC_SUNDAYS_LOCATION_IDS.map(id => [id, 0]));
    registrations.forEach(registration => {
      const locationId = matchOutreachLocationId(registration.location_name);
      if (locationId) counts.set(locationId, (counts.get(locationId) || 0) + 1);
    });
    return counts;
  }, [registrations]);
  const targetedRegistrations = useMemo(() => {
    if (!locationTargetingEnabled) return registrations;
    const selected = new Set(selectedLocationIds);
    return registrations.filter(registration => {
      const locationId = matchOutreachLocationId(registration.location_name);
      return locationId !== null && selected.has(locationId);
    });
  }, [locationTargetingEnabled, registrations, selectedLocationIds]);
  const registrationIds = useMemo(() => targetedRegistrations.map(registration => registration.id), [targetedRegistrations]);
  const locationAudienceLabel = useMemo(() => {
    if (!locationTargetingEnabled) return audienceLabel;
    const labels = PROPHETIC_SUNDAYS_LOCATIONS
      .filter(location => selectedLocationIds.includes(location.id))
      .map(location => location.label);
    return `${audienceLabel}; locations: ${labels.join(", ")}`;
  }, [audienceLabel, locationTargetingEnabled, selectedLocationIds]);
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
    const deliverySuffix = deliveryHistoryEnabled
      ? `; previous delivery status: ${deliveryHistoryStatuses.join(", ")}`
      : "";
    return `${locationAudienceLabel}; ${suffix[audienceMode]}${deliverySuffix}`;
  }, [locationAudienceLabel, audienceMode, deliveryHistoryEnabled, deliveryHistoryStatuses]);

  const toggleLocation = (locationId: string) => {
    setSelectedLocationIds(current => current.includes(locationId)
      ? current.filter(id => id !== locationId)
      : [...current, locationId]);
  };

  const applyPropheticSundaysPreset = () => {
    setMessage(PROPHETIC_SUNDAYS_MESSAGE);
    setLocationTargetingEnabled(true);
    setSelectedLocationIds(PROPHETIC_SUNDAYS_LOCATION_IDS);
    setAudienceMode("standard");
    setDeliveryHistoryEnabled(false);
  };

  const toggleDeliveryStatus = (status: SmsDeliveryHistoryStatus) => {
    setDeliveryHistoryStatuses(current => {
      if (current.includes(status)) return current.length === 1 ? current : current.filter(value => value !== status);
      return [...current, status];
    });
  };

  const deliveryHistoryOptions = deliveryHistoryEnabled ? {
    deliveryHistoryEnabled: true,
    deliveryHistoryStatuses,
    deliveryHistoryFrom: toGhanaIso(deliveryHistoryFrom),
    deliveryHistoryTo: toGhanaIso(deliveryHistoryTo),
  } : { deliveryHistoryEnabled: false };

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
          <div className="rounded-2xl border border-amber-300 bg-gradient-to-br from-amber-50 to-orange-50 p-4 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div className="flex items-start gap-3">
                <span className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0"><span className="material-symbols-outlined">campaign</span></span>
                <div>
                  <p className="font-bold text-amber-950">3 Sundays of the Prophetic</p>
                  <p className="text-xs text-amber-800 mt-0.5">Prophet Emmanuel Andoh · 6th, 13th &amp; 20th September · Inchaban · 5 PM</p>
                </div>
              </div>
              <button type="button" onClick={applyPropheticSundaysPreset} className="h-10 px-4 rounded-xl bg-amber-500 text-white text-xs font-bold hover:bg-amber-600 transition-colors shrink-0">
                Load campaign preset
              </button>
            </div>
            <p className="text-[11px] leading-relaxed text-amber-800">Loads the approved invitation, selects all seven requested areas, uses normal delivery order, and removes previous-delivery restrictions.</p>
          </div>

          <div className="rounded-2xl border border-sky-200 bg-sky-50/70 p-4 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div className="flex items-start gap-3">
                <span className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center shrink-0"><span className="material-symbols-outlined">location_on</span></span>
                <div>
                  <p className="font-bold text-sky-950">Target locations</p>
                  <p className="text-xs text-sky-700 mt-0.5">Select one or more areas. Matching ignores case, punctuation, and the Mpinstin/Mpintsin spelling variation.</p>
                </div>
              </div>
              <label className="inline-flex items-center gap-2 text-xs font-bold text-sky-900 cursor-pointer shrink-0">
                <input type="checkbox" checked={locationTargetingEnabled} onChange={event => setLocationTargetingEnabled(event.target.checked)} className="w-4 h-4 accent-sky-600" />
                Limit by location
              </label>
            </div>
            <div className={`grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 ${locationTargetingEnabled ? "" : "opacity-45"}`}>
              {PROPHETIC_SUNDAYS_LOCATIONS.map(location => {
                const selected = selectedLocationIds.includes(location.id);
                const count = locationCounts.get(location.id) || 0;
                return (
                  <button key={location.id} type="button" disabled={!locationTargetingEnabled} onClick={() => toggleLocation(location.id)} aria-pressed={selected} className={`rounded-xl border px-3 py-3 text-left transition-all disabled:cursor-not-allowed ${selected ? "border-sky-600 bg-white shadow-sm ring-2 ring-sky-200" : "border-sky-200 bg-white/50 hover:bg-white"}`}>
                    <span className="flex items-center gap-1 text-xs font-bold text-sky-950"><span className="material-symbols-outlined text-base">{selected ? "check_box" : "check_box_outline_blank"}</span>{location.label}</span>
                    <span className="block text-[10px] text-sky-700 mt-1">{count.toLocaleString()} match{count === 1 ? "" : "es"}</span>
                  </button>
                );
              })}
            </div>
            {locationTargetingEnabled && (
              <div className="flex flex-wrap gap-3 text-[11px] font-bold">
                <button type="button" onClick={() => setSelectedLocationIds(PROPHETIC_SUNDAYS_LOCATION_IDS)} className="text-sky-700 hover:text-sky-950">Select all requested locations</button>
                <button type="button" onClick={() => setSelectedLocationIds([])} className="text-sky-700 hover:text-sky-950">Clear selection</button>
              </div>
            )}
            <div className="rounded-xl border border-sky-200 bg-white/80 px-4 py-3 text-xs text-sky-900">
              <strong>{registrationIds.length.toLocaleString()} recipient record{registrationIds.length === 1 ? "" : "s"} selected.</strong>{" "}
              {!locationTargetingEnabled
                ? "Location targeting is off; all records matching the dashboard filters are included."
                : selectedLocationIds.length === 0
                  ? "Choose at least one location before reviewing the campaign."
                  : `${selectedLocationIds.length} requested location${selectedLocationIds.length === 1 ? " is" : "s are"} active.`}
            </div>
          </div>

          <div className="rounded-2xl border border-violet-200 bg-violet-50/70 p-4 space-y-4">
            <div className="flex items-start gap-3">
              <span className="w-10 h-10 rounded-xl bg-violet-600 text-white flex items-center justify-center shrink-0"><span className="material-symbols-outlined">groups</span></span>
              <div>
                <p className="font-bold text-violet-950">Delivery audience</p>
                <p className="text-xs text-violet-700 mt-0.5">Choose the base audience first; the delivery-status filter below narrows it further.</p>
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

          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div className="flex items-start gap-3">
                <span className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0"><span className="material-symbols-outlined">verified</span></span>
                <div>
                  <p className="font-bold text-emerald-950">Previous EXPAN delivery status</p>
                  <p className="text-xs text-emerald-700 mt-0.5">Only include numbers matching at least one selected status during this period.</p>
                </div>
              </div>
              <label className="inline-flex items-center gap-2 text-xs font-bold text-emerald-900 cursor-pointer">
                <input type="checkbox" checked={deliveryHistoryEnabled} onChange={event => setDeliveryHistoryEnabled(event.target.checked)} className="w-4 h-4 accent-emerald-600" />
                Apply filter
              </label>
            </div>

            {deliveryHistoryEnabled && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="block">
                    <span className="block text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-700 mb-1.5">SMS sent from</span>
                    <input type="datetime-local" value={deliveryHistoryFrom} onChange={event => setDeliveryHistoryFrom(event.target.value)} className="w-full h-11 px-3 rounded-xl border border-emerald-200 bg-white text-sm text-emerald-950 focus:outline-none focus:ring-2 focus:ring-emerald-200" />
                  </label>
                  <label className="block">
                    <span className="block text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-700 mb-1.5">SMS sent before</span>
                    <input type="datetime-local" value={deliveryHistoryTo} onChange={event => setDeliveryHistoryTo(event.target.value)} className="w-full h-11 px-3 rounded-xl border border-emerald-200 bg-white text-sm text-emerald-950 focus:outline-none focus:ring-2 focus:ring-emerald-200" />
                  </label>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-700 mb-2">Include these results</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                    {DELIVERY_STATUS_OPTIONS.map(([value, label, description]) => {
                      const selected = deliveryHistoryStatuses.includes(value);
                      return (
                        <button key={value} type="button" onClick={() => toggleDeliveryStatus(value)} aria-pressed={selected} className={`rounded-xl border p-3 text-left transition-all ${selected ? "border-emerald-600 bg-white shadow-sm ring-2 ring-emerald-200" : "border-emerald-200 bg-white/60 hover:bg-white"}`}>
                          <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-950"><span className="material-symbols-outlined text-base">{selected ? "check_box" : "check_box_outline_blank"}</span>{label}</span>
                          <span className="block text-[10px] leading-relaxed text-emerald-700 mt-1">{description}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="rounded-xl border border-emerald-200 bg-white/80 px-4 py-3 text-xs text-emerald-800">
                  {deliveryHistoryStatuses.length === 1 && deliveryHistoryStatuses[0] === "delivered"
                    ? <><strong>Delivered only is currently selected.</strong> Submitted/accepted, not delivered and expired numbers will be excluded from the new campaign.</>
                    : <><strong>{deliveryHistoryStatuses.length} statuses selected.</strong> A number will be included if it matches any selected status during this period.</>}
                </div>
              </>
            )}
          </div>

          <label className="block">
            <span className="flex items-center justify-between gap-3 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-brand/70">Your message</span>
              <span className="flex items-center gap-3">
                <button type="button" onClick={() => setMessage(PROPHETIC_SUNDAYS_MESSAGE)} className="text-[11px] font-bold text-amber-700 hover:text-amber-900">Prophetic Sundays</button>
                <button type="button" onClick={() => setMessage(DEFAULT_THANK_YOU_MESSAGE)} className="text-[11px] font-bold text-brand hover:text-brand-dark">EXPAN thank-you</button>
              </span>
            </span>
            <textarea value={message} onChange={event => setMessage(event.target.value)} rows={7} maxLength={918} className="w-full resize-y rounded-xl border border-brand/15 bg-white px-4 py-3 text-sm leading-relaxed text-brand-dark placeholder:text-brand/35 focus:outline-none focus:border-brand/50 focus:ring-2 focus:ring-brand/10" placeholder="Write the message you want to send..." />
          </label>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4 items-stretch">
            <div className="rounded-xl bg-[#f8f3ef] border border-brand/10 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3"><p className="text-[11px] font-bold uppercase tracking-[0.12em] text-brand/65">SMS Preview</p><span className="text-[10px] text-brand/45">{estimate.characters} characters · {estimate.parts} part{estimate.parts === 1 ? "" : "s"} · {estimate.encoding}</span></div>
              <p className={`whitespace-pre-wrap text-sm leading-relaxed ${trimmedMessage ? "text-brand-dark" : "text-brand/40"}`}>{trimmedMessage || "Your custom broadcast preview will appear here."}</p>
            </div>
            <SmsCampaignLauncher kind="general" message={trimmedMessage} registrationIds={registrationIds} audienceLabel={priorityAudienceLabel} audienceOptions={{ audienceMode, ...(audienceMode === "standard" ? {} : { priorityEventKey: EVENT.key, priorityCutoff: arrivalCutoffIso }), ...deliveryHistoryOptions }} tone="brand" buttonLabel="Review & Send" />
          </div>
        </div>
      )}
    </section>
  );
};

export default GenericBroadcastSmsPanel;
