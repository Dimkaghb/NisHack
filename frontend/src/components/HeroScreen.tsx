"use client";

interface HeroScreenProps {
  onStart: () => void;
}

export function HeroScreen({ onStart }: HeroScreenProps) {
  return (
    <div className="flex items-center justify-center flex-1">
      <button
        type="button"
        onClick={onStart}
        className="flex items-center gap-3 font-semibold transition-opacity hover:opacity-85"
        style={{
          padding: "18px 32px",
          fontSize: 18,
          backgroundColor: "var(--neutral-30)",
          color: "#fff",
          borderRadius: 100,
          border: "none",
          cursor: "pointer",
          boxShadow: "0 4px 24px rgba(26,22,21,0.18)",
        }}
      >
        Расскажите о своём бизнесе
        <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
}
