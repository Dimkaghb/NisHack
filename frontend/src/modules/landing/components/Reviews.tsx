"use client";

/* Framer source: nodeId fxPhAsuNv (Reviews)
   Container: maxWidth=1072px, gap=56px
   BigReview: maxWidth=900px — Testimonials style (64px medium centered), name + role
   DesktopTicker: height=288px, speed=40 → 40s CSS, direction=left, gap=24px, hoverFactor=0.5
   ReviewsCard: width=395px, bg=rgba(255,255,255,0.7), borderRadius=24px, padding=32px, gap=32px */

import { FadeUp, FadeIn } from "./motion";

const reviews = [
  {
    quote:
      "Мы искали локацию для кафе неделями. Aimaq за минуту выдал рейтинг и объяснил, почему именно эти места подходят под трафик и конкуренцию.",
    name: "Leah Daniel",
    role: "Владелица кафе",
    initials: "LD",
    color: "#9DC8DE",
  },
  {
    quote:
      "Aimaq помог подобрать офис рядом с остановками и ключевыми маршрутами. Особенно понравилось, что в выборе видны цифры по транспорту и ближайшим конкурентам.",
    name: "Marcus Obi",
    role: "Руководитель офиса",
    initials: "MO",
    color: "#F4B8A0",
  },
  {
    quote:
      "Вместо бесконечного просмотра объявлений мы запустили подбор для магазина. Aimaq учёл бюджет, площадь и доступность — и показал действительно сильные варианты.",
    name: "Sophie Tremblay",
    role: "Предприниматель, магазин",
    initials: "ST",
    color: "#B5D4A0",
  },
  {
    quote:
      "Рейтинг оказался практичным: Aimaq подсветил, где конкурентов меньше, и как это влияет на шанс привлечь клиентов. В итоге мы быстрее согласовали локацию.",
    name: "Raj Mehta",
    role: "Маркетолог",
    initials: "RM",
    color: "#C4AADC",
  },
  {
    quote:
      "Aimaq дал понятный разбор по каждой локации: трафик, конкуренты и транспорт. Это помогло нам принять решение без долгих споров.",
    name: "Ana Leal",
    role: "Коммерческий директор",
    initials: "AL",
    color: "#F4D4A0",
  },
  {
    quote:
      "Черновик письма арендодателю в Aimaq сэкономил массу времени. Подбор с объяснениями помог аргументировать запрос — и мы отправили его в тот же день.",
    name: "Tom Weiss",
    role: "Собственник бизнеса",
    initials: "TW",
    color: "#A0C4DC",
  },
  {
    quote:
      "С первого раза попали в нужный район. Aimaq учитывает трафик и транспорт именно под наш формат бизнеса — поэтому итоговая выдача кажется «точной».",
    name: "Nia Okafor",
    role: "Основатель сети",
    initials: "NO",
    color: "#D4C4A0",
  },
  {
    quote:
      "Aimaq помог обосновать выбор локации: мы увидели, как факторы влияют на итоговый рейтинг. Согласования прошли быстрее, а переговоры стали проще.",
    name: "James Park",
    role: "Аналитик по локациям",
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
        {/* BigReview — fades up */}
        <FadeUp
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
            "Aimaq помог нам выбрать локацию, где трафик соответствует формату бизнеса. Впечатлило, что всё объясняется понятными цифрами."
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
                Руководитель по коммерческим локациям
              </span>
            </div>
          </div>
        </FadeUp>
      </div>

      {/* Full-width reviews ticker — height 288px, bleeds outside container */}
      <FadeIn delay={0.2} className="ticker-mask w-full overflow-hidden mt-14" style={{ height: 288 }}>
        <div
          className="flex items-center h-full reviews-ticker-track"
          style={{ gap: 24, paddingLeft: 24 }}
        >
          {doubled.map((review, i) => (
            <ReviewCard key={i} {...review} />
          ))}
        </div>
      </FadeIn>
    </section>
  );
}
