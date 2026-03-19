"use client";

import { useState } from "react";
import { useLocationIQStore } from "@/store/useLocationIQStore";

export function ContactModal() {
  const contactDraft = useLocationIQStore((s) => s.contactDraft);
  const setContactDraft = useLocationIQStore((s) => s.setContactDraft);
  const setAppState = useLocationIQStore((s) => s.setAppState);
  const listings = useLocationIQStore((s) => s.listings);
  const activeListingId = useLocationIQStore((s) => s.activeListingId);

  const [activeTab, setActiveTab] = useState<"ru" | "en">("ru");
  const [copied, setCopied] = useState(false);

  const activeListing = listings.find((l) => l.id === activeListingId);

  function handleClose() {
    setContactDraft(null);
    setAppState("results");
  }

  async function handleCopy() {
    if (!contactDraft) return;
    const text = activeTab === "ru" ? contactDraft.draft_ru : contactDraft.draft_en;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback: silent fail
    }
  }

  function handleMailto() {
    if (!contactDraft) return;
    const text = activeTab === "ru" ? contactDraft.draft_ru : contactDraft.draft_en;
    const subject = encodeURIComponent(
      activeTab === "ru" ? "Аренда помещения" : "Commercial Lease Inquiry"
    );
    const body = encodeURIComponent(text);
    window.open(`mailto:?subject=${subject}&body=${body}`, "_blank");
  }

  if (!contactDraft) return null;

  const draftText =
    activeTab === "ru" ? contactDraft.draft_ru : contactDraft.draft_en;

  return (
    <div
      className="fixed inset-0 z-[2000] flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}
      onClick={handleClose}
    >
      <div
        className="w-full flex flex-col rounded-2xl shadow-2xl"
        style={{
          maxWidth: 560,
          backgroundColor: "#fff",
          maxHeight: "90dvh",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-start justify-between p-5"
          style={{ borderBottom: "1px solid var(--stroke)", gap: 12 }}
        >
          <div className="flex flex-col" style={{ gap: 2 }}>
            <h2
              className="font-semibold"
              style={{ fontSize: 17, color: "var(--neutral-30)" }}
            >
              Письмо арендодателю
            </h2>
            {activeListing && (
              <p
                className="leading-snug"
                style={{ fontSize: 13, color: "var(--neutral-10)" }}
              >
                {activeListing.address}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="flex-shrink-0 flex items-center justify-center rounded-full transition-colors"
            style={{
              width: 32,
              height: 32,
              backgroundColor: "var(--beige-10)",
              border: "none",
              cursor: "pointer",
              fontSize: 18,
              color: "var(--neutral-20)",
            }}
          >
            ×
          </button>
        </div>

        {/* Tab switcher */}
        <div
          className="flex p-4"
          style={{ borderBottom: "1px solid var(--stroke)", gap: 8 }}
        >
          {(["ru", "en"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className="rounded-full font-medium transition-all"
              style={{
                padding: "6px 14px",
                fontSize: 13,
                backgroundColor:
                  activeTab === tab ? "var(--neutral-30)" : "var(--beige-10)",
                color: activeTab === tab ? "#fff" : "var(--neutral-20)",
                border: "none",
                cursor: "pointer",
              }}
            >
              {tab === "ru" ? "На русском" : "In English"}
            </button>
          ))}
        </div>

        {/* Draft textarea */}
        <div className="flex-1 overflow-auto p-4">
          <textarea
            readOnly
            value={draftText}
            className="w-full resize-none rounded-xl"
            style={{
              minHeight: 220,
              padding: "12px 14px",
              fontSize: 14,
              lineHeight: 1.65,
              color: "var(--neutral-30)",
              backgroundColor: "var(--beige-10)",
              border: "1.5px solid var(--stroke)",
              outline: "none",
              fontFamily: "inherit",
            }}
          />
        </div>

        {/* Actions */}
        <div
          className="flex flex-col p-4"
          style={{ gap: 10, borderTop: "1px solid var(--stroke)" }}
        >
          <div className="flex" style={{ gap: 8 }}>
            <button
              type="button"
              onClick={handleCopy}
              className="flex-1 rounded-xl font-semibold transition-all"
              style={{
                padding: "10px 14px",
                fontSize: 14,
                backgroundColor: copied ? "var(--accent-green)" : "var(--neutral-30)",
                color: "#fff",
                border: "none",
                cursor: "pointer",
              }}
            >
              {copied ? "Скопировано ✓" : "Скопировать"}
            </button>
            <button
              type="button"
              onClick={handleMailto}
              className="flex-1 rounded-xl font-semibold transition-colors"
              style={{
                padding: "10px 14px",
                fontSize: 14,
                backgroundColor: "transparent",
                color: "var(--accent-blue)",
                border: "1.5px solid var(--blue-30)",
                cursor: "pointer",
              }}
            >
              Открыть в почте
            </button>
          </div>
          <p
            className="text-center"
            style={{ fontSize: 12, color: "var(--neutral-10)" }}
          >
            Письмо сгенерировано ИИ — проверьте перед отправкой
          </p>
        </div>
      </div>
    </div>
  );
}
