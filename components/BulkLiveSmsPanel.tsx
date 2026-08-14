import React, { useMemo, useState } from "react";
import {
  buildLiveBroadcastMessage,
  LiveLinkMode,
} from "../lib/sms";
import { estimateSms } from "../lib/smsEncoding";
import SmsCampaignLauncher from "./SmsCampaignLauncher";

interface BulkLiveSmsPanelProps {
  registrationIds: string[];
  audienceLabel: string;
}

const BulkLiveSmsPanel: React.FC<BulkLiveSmsPanelProps> = ({
  registrationIds,
  audienceLabel,
}) => {
  const [mode, setMode] = useState<LiveLinkMode>("single");
  const [sharedUrl, setSharedUrl] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [facebookUrl, setFacebookUrl] = useState("");
  const [tiktokUrl, setTiktokUrl] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);

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
              onClick={() => setMode("single")}
              className={`h-10 rounded-lg text-xs font-bold transition-all ${mode === "single" ? "bg-brand text-white shadow-sm" : "text-brand hover:bg-white/70"}`}
            >
              One Link for All
            </button>
            <button
              type="button"
              aria-pressed={mode === "platforms"}
              onClick={() => setMode("platforms")}
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
                onChange={(event) => setSharedUrl(event.target.value)}
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
                    onChange={(event) => platform.setter(event.target.value)}
                  />
                </label>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4 items-stretch">
            <div className="rounded-xl bg-[#f8f3ef] border border-brand/10 p-4">
              <div className="flex items-center justify-between gap-3 mb-3">
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-brand/65">SMS Preview</p>
                {messageResult.message && (() => {
                  const estimate = estimateSms(messageResult.message);
                  return <p className="text-[10px] text-brand/45">{estimate.characters} characters · {estimate.parts} part{estimate.parts === 1 ? "" : "s"} · {estimate.encoding}</p>;
                })()}
              </div>
              <p className={`whitespace-pre-wrap text-sm leading-relaxed ${messageResult.message ? "text-brand-dark" : "text-brand/40"}`}>
                {messageResult.message || messageResult.error}
              </p>
            </div>

            <SmsCampaignLauncher
              kind="live"
              message={messageResult.message}
              registrationIds={registrationIds}
              audienceLabel={audienceLabel}
              tone="brand"
              buttonLabel="Review & Send"
            />
          </div>

        </div>
      )}
    </section>
  );
};

export default BulkLiveSmsPanel;
