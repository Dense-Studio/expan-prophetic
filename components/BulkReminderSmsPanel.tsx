import React, { useMemo, useState } from "react";
import { sendBulkReminderSms } from "../lib/sms";

interface BulkReminderSmsPanelProps {
  phoneNumbers: string[];
  audienceLabel: string;
}

const DEFAULT_REMINDER_MESSAGE = `EXPAN is happening tonight!

Join us for the August edition of EXPAN All-Night 2026.

Venue: Thea Villa Events Hub, Tadisco Down, Takoradi
Time: 8 PM prompt

Come expectant for an intimate time with God. We can't wait to welcome you!`;

const BulkReminderSmsPanel: React.FC<BulkReminderSmsPanelProps> = ({
  phoneNumbers,
  audienceLabel,
}) => {
  const [message, setMessage] = useState(DEFAULT_REMINDER_MESSAGE);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const uniquePhoneNumbers = useMemo(
    () => [...new Set(phoneNumbers.map((phone) => phone.replace(/\D/g, "")).filter(Boolean))],
    [phoneNumbers],
  );

  const trimmedMessage = message.trim();
  const smsParts = trimmedMessage.length === 0
    ? 0
    : trimmedMessage.length <= 160
      ? 1
      : Math.ceil(trimmedMessage.length / 153);

  const handleSend = async () => {
    setSendError("");
    setSuccessMessage("");

    if (!trimmedMessage) {
      setSendError("Enter the reminder message you want to send.");
      return;
    }
    if (uniquePhoneNumbers.length === 0) {
      setSendError("There are no recipients in the current admin filters.");
      return;
    }

    const estimatedMessages = uniquePhoneNumbers.length * smsParts;
    const confirmed = window.confirm(
      `Send this programme reminder to ${uniquePhoneNumbers.length} unique recipient${uniquePhoneNumbers.length === 1 ? "" : "s"}?\n\nEstimated SMS units: ${estimatedMessages.toLocaleString()}`,
    );
    if (!confirmed) return;

    setIsSending(true);
    try {
      await sendBulkReminderSms(uniquePhoneNumbers, trimmedMessage);
      setSuccessMessage(
        `Programme reminder sent to ${uniquePhoneNumbers.length} recipient${uniquePhoneNumbers.length === 1 ? "" : "s"}.`,
      );
    } catch (error) {
      setSendError(
        error instanceof Error ? error.message : "The programme reminder could not be sent.",
      );
    } finally {
      setIsSending(false);
    }
  };

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
          <label className="block">
            <span className="flex items-center justify-between gap-3 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-brand/70">Reminder Message</span>
              <button
                type="button"
                onClick={() => { setMessage(DEFAULT_REMINDER_MESSAGE); setSendError(""); setSuccessMessage(""); }}
                className="text-[11px] font-bold text-brand hover:text-brand-dark transition-colors"
              >
                Restore Template
              </button>
            </span>
            <textarea
              value={message}
              onChange={(event) => { setMessage(event.target.value); setSendError(""); setSuccessMessage(""); }}
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
                  <span>{trimmedMessage.length} characters</span>
                  <span>•</span>
                  <span>{smsParts} SMS part{smsParts === 1 ? "" : "s"}</span>
                </div>
              </div>
              <p className={`whitespace-pre-wrap text-sm leading-relaxed ${trimmedMessage ? "text-brand-dark" : "text-brand/40"}`}>
                {trimmedMessage || "Your reminder preview will appear here."}
              </p>
            </div>

            <div className="rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 p-4 text-white flex flex-col justify-between shadow-sm">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/65">Recipients</p>
                <p className="text-3xl font-extrabold mt-1">{uniquePhoneNumbers.length.toLocaleString()}</p>
                <p className="text-xs text-white/75 mt-1 leading-relaxed">{audienceLabel}</p>
                <p className="text-[10px] text-white/55 mt-2">Uses all records matching the current filters—not only the visible page.</p>
              </div>
              <button
                type="button"
                onClick={() => void handleSend()}
                disabled={isSending || !trimmedMessage || uniquePhoneNumbers.length === 0}
                className="mt-5 w-full h-12 rounded-xl bg-white text-amber-700 font-bold text-sm hover:bg-cream transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSending ? <><span className="spinner spinner-dark" />Sending...</> : <><span className="material-symbols-outlined text-lg">send</span>Send Reminder</>}
              </button>
            </div>
          </div>

          {sendError && (
            <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 px-4 py-3 rounded-xl border border-red-200">
              <span className="material-symbols-outlined text-lg">error</span>{sendError}
            </div>
          )}
          {successMessage && (
            <div className="flex items-center gap-2 text-emerald-700 text-sm bg-emerald-50 px-4 py-3 rounded-xl border border-emerald-200">
              <span className="material-symbols-outlined text-lg">check_circle</span>{successMessage}
            </div>
          )}
        </div>
      )}
    </section>
  );
};

export default BulkReminderSmsPanel;
