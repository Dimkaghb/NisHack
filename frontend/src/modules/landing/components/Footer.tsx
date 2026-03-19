/* Framer source: nodeId B9uyFXSMa (Footer)
   Desktop: bg=rgba(255,255,255,0.25), radius=32px, padding=40px, maxWidth=1072px
   Content: gap=80px vertical
   Top: Logo+desc+social LEFT | Links columns RIGHT (Pages + Information)
   Pages: Home /  Features /#features  Pricing /#pricing  Blog /blog
   Information: Contact /contact-us  Privacy /privacy-policy  Terms /terms-of-use
   Bottom (border-top, pt=32px): copyright LEFT | "Built in Framer" RIGHT */

import Link from "next/link";

const pagesLinks = [
  { label: "Главная", href: "/" },
  { label: "Возможности", href: "/#features" },
  { label: "Тарифы", href: "/#pricing" },
  { label: "Блог", href: "/blog" },
];

const infoLinks = [
  { label: "Контакты", href: "/contact-us" },
  { label: "Конфиденциальность", href: "/privacy-policy" },
  { label: "Условия использования", href: "/terms-of-use" },
];

const XIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.261 5.632 5.903-5.632zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const LinkedInIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
);

function DreetlioLogo() {
  return (
    <div className="flex items-center gap-2.5">
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path d="M11 2C11 2 4 5.5 4 12C4 15.866 7.134 19 11 19C14.866 19 18 15.866 18 12C18 8.5 15 5 11 2Z" fill="rgb(26, 22, 21)" />
        <path d="M11 6C11 6 7 8.5 7 12C7 14.209 8.791 16 11 16C13.209 16 15 14.209 15 12C15 9.5 13 7 11 6Z" fill="rgb(249, 248, 248)" />
      </svg>
      <span className="font-semibold text-[17px] tracking-[-0.02em]" style={{ color: "var(--neutral-30)" }}>
        Aimaq
      </span>
    </div>
  );
}

export function Footer() {
  return (
    <footer className="w-full flex justify-center px-6 pb-8">
      {/* Outer card: rgba(255,255,255,0.25), radius=32px, padding=40px */}
      <div
        className="w-full flex flex-col"
        style={{
          maxWidth: 1072,
          backgroundColor: "rgba(255, 255, 255, 0.25)",
          borderRadius: 32,
          padding: 40,
          gap: 80,
        }}
      >
        {/* Top: Left info + Right link columns */}
        <div className="flex flex-wrap justify-between" style={{ gap: 48 }}>
          {/* Left — Logo + tagline + social links */}
          <div className="flex flex-col" style={{ maxWidth: 240, gap: 24 }}>
            <div className="flex flex-col gap-4">
              <DreetlioLogo />
              <p className="leading-[150%]" style={{ fontSize: 16, color: "var(--neutral-20)" }}>
                AI-помощник для подбора коммерческих локаций в вашем городе: трафик, конкуренты и транспорт в одном рейтинге.
              </p>
            </div>
            {/* Social links — 40px circles */}
            <div className="flex items-center gap-3">
              {[
                { href: "https://www.linkedin.com/in/leon-chike-39b753324/", icon: <LinkedInIcon /> },
                { href: "https://x.com/LeonC7303", icon: <XIcon /> },
              ].map(({ href, icon }) => (
                <Link
                  key={href}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center rounded-full transition-colors duration-150 hover:bg-black/5"
                  style={{
                    width: 40,
                    height: 40,
                    backgroundColor: "var(--beige-10)",
                    color: "var(--neutral-30)",
                  }}
                >
                  {icon}
                </Link>
              ))}
            </div>
          </div>

          {/* Right — link columns */}
          <div className="flex flex-wrap gap-12">
            {/* Pages column */}
            <div className="flex flex-col gap-4">
              <span
                className="font-semibold tracking-widest uppercase"
                style={{ fontSize: 12, color: "var(--neutral-10)" }}
              >
                Страницы
              </span>
              <div className="flex flex-col gap-4">
                {pagesLinks.map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    className="leading-[150%] transition-colors duration-150 hover:opacity-70"
                    style={{ fontSize: 16, color: "var(--neutral-20)" }}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Information column */}
            <div className="flex flex-col gap-4">
              <span
                className="font-semibold tracking-widest uppercase"
                style={{ fontSize: 12, color: "var(--neutral-10)" }}
              >
                Информация
              </span>
              <div className="flex flex-col gap-4">
                {infoLinks.map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    className="leading-[150%] transition-colors duration-150 hover:opacity-70"
                    style={{ fontSize: 16, color: "var(--neutral-20)" }}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom — border-top, pt=32px, space-between */}
        <div
          className="flex flex-wrap items-center justify-between gap-4 pt-8"
          style={{ borderTop: "1px solid var(--stroke)" }}
        >
          <Link
            href="https://leonchike.com"
            target="_blank"
            rel="noopener noreferrer"
            className="leading-[150%] transition-opacity hover:opacity-70"
            style={{ fontSize: 16, color: "var(--neutral-10)" }}
          >
            © 2025 Aimaq. Создано Леоном Чайком
          </Link>
          <Link
            href="https://framer.com"
            target="_blank"
            rel="noopener noreferrer"
            className="leading-[150%] transition-opacity hover:opacity-70"
            style={{ fontSize: 16, color: "var(--neutral-10)" }}
          >
            Собрано в Framer
          </Link>
        </div>
      </div>
    </footer>
  );
}
