import React, { useMemo, useState } from "react";
import {
  buildLiveBroadcastMessage,
  LiveLinkMode,
  sendBulkReminderSms,
} from "../lib/sms";

interface BulkLiveSmsPanelProps {
  phoneNumbers: string[];
  audienceLabel: string;
}

const BulkLiveSmsPanel: React.FC<BulkLiveSmsPanelProps> = ({
  phoneNumbers,
  audienceLabel,
}) => {
  const [mode, setMode] = useState<LiveLinkMode>("single");
  const [sharedUrl, setSharedUrl] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [facebookUrl, setFacebookUrl] = useState("");
  const [tiktokUrl, setTiktokUrl] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const uniquePhoneNumbers = useMemo(
    () => [...new Set(phoneNumbers.map((phone) => phone.replace(/\D/g, "")).filter(Boolean))],
    [phoneNumbers],
  );

  const messageResult = useMemo(() => {
    try {
      return {
        message: buildLiveBroadcastMessage({
          mode,
          sharedUrl,
          youtubeUrl,
          facebookUrl,
          tiktokUrl,
        }),
        error: "",
      };
    } catch (error) {
      return {
        message: "",
        error: error instanceof Error ? error.message : "Enter valid live links.",
      };
    }
  }, [mode, sharedUrl, youtubeUrl, facebookUrl, tiktokUrl]);

  const handleSend = async () => {
    setSendError("");
    setSuccessMessage("");

    if (!messageResult.message) {
      setSendError(messageResult.error);
      return;
    }

    if (uniquePhoneNumbers.length === 0) {
      setSendError("There are no recipients in the current admin filters.");
      return;
    }

    const confirmed = window.confirm(
      `Send this live broadcast SMS to ${uniquePhoneNumbers.length} unique recipient${uniquePhoneNumbers.length === 1 ? "" : "s"}?`,
    );
    if (!confirmed) return;

    setIsSending(true);
    try {
      await sendBulkReminderSms(uniquePhoneNumbers, messageResult.message);
      setSuccessMessage(
        `Live broadcast SMS sent to ${uniquePhoneNumbers.length} recipient${uniquePhoneNumbers.length === 1 ? "" : "s"}.`,
      );
    } catch (error) {
      setSendError(
        error instanceof Error ? error.message : "The bulk SMS could not be sent.",
      );
    } finally {
      setIsSending(false);
    }
  };

  const inputClass =
    "w-full h-12 px-4 text-sm text-brand-dark placeholder:text-brand/35 bg-white border border-brand/15 rounded-xl focus:outline-none focus:border-brand/50 focus:ring-2 focus:ring-brand/10 transition-all";

  return (
    <section className="bg-white/75 border border-brand/10 rounded-2xl shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setIsExpanded((current) => !current)}
        className="w-full px-5 py-4 flex items-center justify-between gap-4 text-left hover:bg-white/60 transition-colors"
        aria-expanded={isExpanded}
      >
        <span className="flex items-center gap-3 min-w-0">
          <span className="w-11 h-11 rounded-xl bg-brand text-white flex items-center justify-center shrink-0 shadow-sm">
            <span className="material-symbols-outlined">live_tv</span>
          </span>
          <span className="min-w-0">
            <span className="block text-brand-dark font-bold">Live Broadcast SMS</span>
            <span className="block text-xs text-brand/55 mt-0.5">
              Add the stream links and send the approved message in bulk.
            </span>
          </span>
        </span>
        <span className={`material-symbols-outlined text-brand/50 transition-transform ${isExpanded ? "rotate-180" : ""}`}>expand_more</span>
      </button>

      {isExpanded && (
        <div className="border-t border-brand/10 p-5 space-y-5 animate-fade-in">
          <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-brand/5">
            <button
              type="button"
              aria-pressed={mode === "single"}
              onClick={() => { setMode("single"); setSendError(""); setSuccessMessage(""); }}
              className={`h-10 rounded-lg text-xs font-bold transition-all ${mode === "single" ? "bg-brand text-white shadow-sm" : "text-brand hover:bg-white/70"}`}
            >
              One Link for All
            </button>
            <button
              type="button"
              aria-pressed={mode === "platforms"}
              onClick={() => { setMode("platforms"); setSendError(""); setSuccessMessage(""); }}
              className={`h-10 rounded-lg text-xs font-bold transition-all ${mode === "platforms" ? "bg-brand text-white shadow-sm" : "text-brand hover:bg-white/70"}`}
            >
              Separate Platform Links
            </button>
          </div>

          {mode === "single" ? (
            <label className="block">
              <span className="block text-[11px] font-bold uppercase tracking-[0.12em] text-brand/70 mb-2">Shared Live Link</span>
              <input
                type="url"
                inputMode="url"
                placeholder="Paste the live link used for all platforms"
                className={inputClass}
                value={sharedUrl}
                onChange={(event) => { setSharedUrl(event.target.value); setSendError(""); setSuccessMessage(""); }}
              />
            </label>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                { label: "YouTube Link", value: youtubeUrl, setter: setYoutubeUrl, icon: "smart_display" },
                { label: "Facebook Link", value: facebookUrl, setter: setFacebookUrl, icon: "public" },
                { label: "TikTok Link", value: tiktokUrl, setter: setTiktokUrl, icon: "music_note" },
              ].map((platform) => (
                <label key={platform.label} className="block">
                  <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-brand/70 mb-2">
                    <span className="material-symbols-outlined text-sm">{platform.icon}</span>
                    {platform.label}
                  </span>
                  <input
                    type="url"
                    inputMode="url"
                    placeholder={`Paste ${platform.label.toLowerCase()}`}
                    className={inputClass}
                    value={platform.value}
                    onChange={(event) => { platform.setter(event.target.value); setSendError(""); setSuccessMessage(""); }}
                  />
                </label>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4 items-stretch">
            <div className="rounded-xl bg-[#f8f3ef] border border-brand/10 p-4">
              <div className="flex items-center justify-between gap-3 mb-3">
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-brand/65">SMS Preview</p>
                {messageResult.message && <p className="text-[10px] text-brand/45">{messageResult.message.length} characters</p>}
              </div>
              <p className={`whitespace-pre-wrap text-sm leading-relaxed ${messageResult.message ? "text-brand-dark" : "text-brand/40"}`}>
                {messageResult.message || messageResult.error}
              </p>
            </div>

            <div className="rounded-xl bg-brand p-4 text-white flex flex-col justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/55">Recipients</p>
                <p className="text-3xl font-extrabold mt-1">{uniquePhoneNumbers.length}</p>
                <p className="text-xs text-white/65 mt-1 leading-relaxed">{audienceLabel}</p>
                <p className="text-[10px] text-white/45 mt-2">Uses the current registration filters above.</p>
              </div>
              <button
                type="button"
                onClick={() => void handleSend()}
                disabled={isSending || !messageResult.message || uniquePhoneNumbers.length === 0}
                className="mt-5 w-full h-12 rounded-xl bg-white text-brand font-bold text-sm hover:bg-cream transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSending ? <><span className="spinner spinner-dark" />Sending...</> : <><span className="material-symbols-outlined text-lg">send</span>Send Bulk SMS</>}
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

export default BulkLiveSmsPanel;
