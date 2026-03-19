/* Framer source: nodeId fxPhAsuNv (Reviews)
   Container: maxWidth=1072px, gap=56px
   BigReview: maxWidth=900px — Testimonials style (64px medium centered), name + role
   DesktopTicker: height=288px, speed=40 → 40s CSS, direction=left, gap=24px, hoverFactor=0.5
   ReviewsCard: width=395px, bg=rgba(255,255,255,0.7), borderRadius=24px, padding=32px, gap=32px */

const reviews = [
  {
    quote:
      "As a fast-moving design team, we needed a tool that matched our pace. From client onboarding to getting paid, this just works — clean, fast, and beautifully built.",
    name: "Leah Daniel",
    role: "Design Ops Lead, Teamwork",
    initials: "LD",
    color: "#9DC8DE",
  },
  {
    quote:
      "Dreelio replaced four different tools for me. Now I manage proposals, contracts, invoices, and time tracking all in one place. It's changed how I run my studio.",
    name: "Marcus Obi",
    role: "Founder, Obi Creative Studio",
    initials: "MO",
    color: "#F4B8A0",
  },
  {
    quote:
      "The invoice-to-payment flow is so smooth. Clients love the branded experience and I love getting paid on time. Finally a tool built for real freelancers.",
    name: "Sophie Tremblay",
    role: "Brand Designer, Freelance",
    initials: "ST",
    color: "#B5D4A0",
  },
  {
    quote:
      "I've tried every agency tool on the market. Dreelio is the first one that actually feels like it was designed for creatives. The interface is stunning.",
    name: "Raj Mehta",
    role: "Creative Director, Pixels & Co.",
    initials: "RM",
    color: "#C4AADC",
  },
  {
    quote:
      "Client portal is a game-changer. My clients can see project progress, approve deliverables, and pay invoices all in one place. Looks completely professional.",
    name: "Ana Leal",
    role: "UX Consultant, Freelance",
    initials: "AL",
    color: "#F4D4A0",
  },
  {
    quote:
      "Time tracking used to be the thing I hated most about freelancing. Dreelio makes it so effortless — it just runs in the background and the reports are beautiful.",
    name: "Tom Weiss",
    role: "Motion Designer, Studio Nine",
    initials: "TW",
    color: "#A0C4DC",
  },
  {
    quote:
      "Switched from three separate tools and saved $120/month. Everything integrates perfectly and the support team actually responds. Highly recommend.",
    name: "Nia Okafor",
    role: "Web Developer, Freelance",
    initials: "NO",
    color: "#D4C4A0",
  },
  {
    quote:
      "The proposals feature sealed more deals for me in the first month than any other platform. Clients see a professional, branded document and trust goes up immediately.",
    name: "James Park",
    role: "Strategy Consultant",
    initials: "JP",
    color: "#F0B4B4",
  },
];

function ReviewCard({
  quote,
  name,
  role,
  initials,
  color,
}: {
  quote: string;
  name: string;
  role: string;
  initials: string;
  color: string;
}) {
  return (
    <div
      className="flex flex-col justify-between shrink-0"
      style={{
        width: 395,
        backgroundColor: "rgba(255, 255, 255, 0.7)",
        borderRadius: 24,
        padding: 32,
        gap: 32,
      }}
    >
      {/* Stars */}
      <div className="flex gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <svg key={i} viewBox="0 0 16 16" className="w-4 h-4" fill="#1a1615">
            <path d="M8 1l1.85 3.74L14 5.5l-3 2.92.71 4.12L8 10.4l-3.71 2.14.71-4.12L2 5.5l4.15-.76L8 1z" />
          </svg>
        ))}
      </div>
      {/* Quote */}
      <p
        className="leading-[150%] flex-1"
        style={{ fontSize: 18, color: "var(--neutral-20)" }}
      >
        {quote}
      </p>
      {/* User info */}
      <div className="flex items-center gap-4">
        <div
          className="shrink-0 flex items-center justify-center rounded-full text-white font-semibold text-[14px]"
          style={{ width: 56, height: 56, backgroundColor: color }}
        >
          {initials}
        </div>
        <div className="flex flex-col">
          <span
            className="font-medium leading-[150%]"
            style={{ fontSize: 16, color: "var(--neutral-30)" }}
          >
            {name}
          </span>
          <span
            className="leading-[150%]"
            style={{ fontSize: 14, color: "var(--neutral-10)" }}
          >
            {role}
          </span>
        </div>
      </div>
    </div>
  );
}

export function Reviews() {
  const doubled = [...reviews, ...reviews];

  return (
    <section className="w-full flex flex-col items-center px-6 py-0">
      {/* Inner container — maxWidth 1072px */}
      <div
        className="flex flex-col items-center w-full"
        style={{ maxWidth: 1072, gap: 56 }}
      >
        {/* BigReview — maxWidth 900px */}
        <div
          className="flex flex-col items-center gap-8 text-center w-full"
          style={{ maxWidth: 900 }}
        >
          {/* Stars */}
          <div className="flex gap-1 justify-center">
            {Array.from({ length: 5 }).map((_, i) => (
              <svg key={i} viewBox="0 0 20 20" className="w-6 h-6" fill="var(--neutral-30)">
                <path d="M10 1.5l2.3 4.65 5.13.75-3.72 3.62.88 5.12L10 13.27l-4.59 2.37.88-5.12L2.57 6.9l5.13-.75L10 1.5z" />
              </svg>
            ))}
          </div>
          {/* Quote — Testimonials style: 64px, Medium */}
          <blockquote
            className="font-medium leading-[145%] tracking-[-0.03em]"
            style={{
              fontSize: "clamp(28px, 5vw, 64px)",
              color: "var(--neutral-30)",
            }}
          >
            "Dreelio is by far the best agency tool I have ever used"
          </blockquote>
          {/* Author */}
          <div className="flex items-center gap-4">
            <div
              className="shrink-0 flex items-center justify-center rounded-full text-white font-semibold text-[14px]"
              style={{
                width: 64,
                height: 64,
                backgroundColor: "var(--blue-30)",
              }}
            >
              MP
            </div>
            <div className="flex flex-col text-left">
              <span
                className="font-medium leading-[150%]"
                style={{ fontSize: 16, color: "var(--neutral-30)" }}
              >
                Martha Punla
              </span>
              <span
                className="leading-[150%]"
                style={{ fontSize: 14, color: "var(--neutral-10)" }}
              >
                VP Marketing, Meta
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Full-width reviews ticker — height 288px, bleeds outside container */}
      <div
        className="relative w-full overflow-hidden mt-14"
        style={{ height: 288 }}
      >
        {/* Left/right fades */}
        <div
          className="absolute left-0 top-0 bottom-0 w-24 z-10 pointer-events-none"
          style={{
            background: "linear-gradient(to right, var(--bg-white), transparent)",
          }}
        />
        <div
          className="absolute right-0 top-0 bottom-0 w-24 z-10 pointer-events-none"
          style={{
            background: "linear-gradient(to left, var(--bg-white), transparent)",
          }}
        />

        {/* Scrolling track */}
        <div
          className="flex items-center h-full reviews-ticker-track"
          style={{ gap: 24, paddingLeft: 24 }}
        >
          {doubled.map((review, i) => (
            <ReviewCard key={i} {...review} />
          ))}
        </div>
      </div>
    </section>
  );
}
