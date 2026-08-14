import React, { useState } from "react";
import { estimateSms } from "../lib/smsEncoding";
import { REMINDER_TEMPLATES } from "../lib/smsTemplates";
import SmsCampaignLauncher from "./SmsCampaignLauncher";

interface BulkReminderSmsPanelProps {
  registrationIds: string[];
  audienceLabel: string;
}

const DEFAULT_REMINDER_MESSAGE = REMINDER_TEMPLATES.morning.message;

const BulkReminderSmsPanel: React.FC<BulkReminderSmsPanelProps> = ({
  registrationIds,
  audienceLabel,
}) => {
  const [message, setMessage] = useState(DEFAULT_REMINDER_MESSAGE);
  const [isExpanded, setIsExpanded] = useState(false);

  const trimmedMessage = message.trim();
  const smsEstimate = estimateSms(trimmedMessage);

  return (
    <section className="bg-white/75 border border-brand/10 rounded-2xl shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setIsExpanded((current) => !current)}
        className="w-full px-5 py-4 flex items-center justify-between gap-4 text-left hover:bg-white/60 transition-colors"
        aria-expanded={isExpanded}
      >
        <span className="flex items-center gap-3 min-w-0">
          <span className="w-11 h-11 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm">
            <span className="material-symbols-outlined">notifications_active</span>
          </span>
          <span className="min-w-0">
            <span className="block text-brand-dark font-bold">Programme Reminder SMS</span>
            <span className="block text-xs text-brand/55 mt-0.5">
              Edit and send a normal reminder before the programme.
            </span>
          </span>
        </span>
        <span className={`material-symbols-outlined text-brand/50 transition-transform ${isExpanded ? "rotate-180" : ""}`}>expand_more</span>
      </button>

      {isExpanded && (
        <div className="border-t border-brand/10 p-5 space-y-5 animate-fade-in">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-brand/70 mb-2">Choose Template</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Object.entries(REMINDER_TEMPLATES).map(([key, template]) => {
                const isActive = message === template.message;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setMessage(template.message)}
                    className={`rounded-xl border px-4 py-3 text-left transition-all ${
                      isActive
                        ? "border-amber-500 bg-amber-50 text-amber-900 ring-2 ring-amber-500/10"
                        : "border-brand/10 bg-white text-brand-dark hover:border-amber-300 hover:bg-amber-50/50"
                    }`}
                    aria-pressed={isActive}
                  >
                    <span className="flex items-center justify-between gap-3">
                      <span>
                        <span className="block text-sm font-bold">{template.label}</span>
                        <span className="block text-[11px] opacity-60 mt-0.5">{template.description}</span>
                      </span>
                      <span className="material-symbols-outlined text-xl">
                        {isActive ? "check_circle" : key === "morning" ? "wb_sunny" : "schedule"}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <label className="block">
            <span className="flex items-center justify-between gap-3 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-brand/70">Reminder Message</span>
              <button
                type="button"
                onClick={() => setMessage(DEFAULT_REMINDER_MESSAGE)}
                className="text-[11px] font-bold text-brand hover:text-brand-dark transition-colors"
              >
                Reset to Morning
              </button>
            </span>
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              rows={9}
              maxLength={918}
              className="w-full resize-y rounded-xl border border-brand/15 bg-white px-4 py-3 text-sm leading-relaxed text-brand-dark placeholder:text-brand/35 focus:outline-none focus:border-brand/50 focus:ring-2 focus:ring-brand/10 transition-all"
              placeholder="Type the programme reminder..."
            />
          </label>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4 items-stretch">
            <div className="rounded-xl bg-[#f8f3ef] border border-brand/10 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-brand/65">SMS Preview</p>
                <div className="flex items-center gap-2 text-[10px] text-brand/45">
                  <span>{smsEstimate.characters} characters</span>
                  <span>•</span>
                  <span>{smsEstimate.parts} SMS part{smsEstimate.parts === 1 ? "" : "s"} · {smsEstimate.encoding}</span>
                </div>
              </div>
              <p className={`whitespace-pre-wrap text-sm leading-relaxed ${trimmedMessage ? "text-brand-dark" : "text-brand/40"}`}>
                {trimmedMessage || "Your reminder preview will appear here."}
              </p>
            </div>

            <SmsCampaignLauncher
              kind="reminder"
              message={trimmedMessage}
              registrationIds={registrationIds}
              audienceLabel={audienceLabel}
              tone="amber"
              buttonLabel="Review & Send"
            />
          </div>
        </div>
      )}
    </section>
  );
};

export default BulkReminderSmsPanel;
