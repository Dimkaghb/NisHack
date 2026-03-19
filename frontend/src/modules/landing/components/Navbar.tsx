"use client";

import Link from "next/link";
import { useState } from "react";

const navLinks = [
  { label: "Как это работает", href: "/#features" },
  { label: "Преимущества", href: "/#benefits" },
  { label: "Тарифы", href: "/#pricing" },
  { label: "Блог", href: "/blog" },
  { label: "Контакты", href: "/contact-us" },
];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="absolute top-0 left-0 right-0 z-50 flex justify-center px-6 pt-6">
      <nav className="w-full max-w-[1072px]">
        {/* Desktop nav */}
        <div className="hidden md:flex items-center justify-between w-full px-6 py-3">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <DreetlioLogo />
            <span
              className="text-[17px] font-semibold tracking-[-0.02em]"
              style={{ color: "var(--neutral-30)" }}
            >
              Aimaq
            </span>
          </Link>

          {/* Nav links */}
          <div className="flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="px-4 py-2 text-[15px] font-medium rounded-full transition-colors duration-150 hover:bg-black/5"
                style={{ color: "var(--neutral-20)" }}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* CTA */}
          <Link
            href="/contact-us"
            className="inline-flex items-center px-6 py-[14px] rounded-full text-[15px] font-semibold text-white transition-opacity duration-150 hover:opacity-85 shrink-0"
            style={{ backgroundColor: "var(--neutral-30)" }}
          >
            Попробовать Aimaq бесплатно
          </Link>
        </div>

        {/* Mobile nav */}
        <div className="md:hidden flex items-center justify-between px-4 py-3 rounded-2xl bg-white/80 backdrop-blur-md shadow-sm">
          <Link href="/" className="flex items-center gap-2">
            <DreetlioLogo />
            <span className="text-[16px] font-semibold" style={{ color: "var(--neutral-30)" }}>
              Aimaq
            </span>
          </Link>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 rounded-lg hover:bg-black/5 transition-colors"
            aria-label="Открыть меню"
          >
            <span className="block w-5 h-0.5 bg-neutral-800 mb-1" />
            <span className="block w-5 h-0.5 bg-neutral-800 mb-1" />
            <span className="block w-5 h-0.5 bg-neutral-800" />
          </button>
        </div>

        {mobileOpen && (
          <div className="md:hidden mt-2 p-4 rounded-2xl bg-white/95 backdrop-blur-md shadow-lg flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="px-4 py-3 text-[15px] font-medium rounded-xl hover:bg-black/5 transition-colors"
                style={{ color: "var(--neutral-20)" }}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/contact-us"
              onClick={() => setMobileOpen(false)}
              className="mt-2 inline-flex justify-center items-center px-6 py-3 rounded-full text-[15px] font-semibold text-white"
              style={{ backgroundColor: "var(--neutral-30)" }}
            >
            Попробовать Aimaq бесплатно
            </Link>
          </div>
        )}
      </nav>
    </header>
  );
}

function DreetlioLogo() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 22 22"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M11 2C11 2 4 5.5 4 12C4 15.866 7.134 19 11 19C14.866 19 18 15.866 18 12C18 8.5 15 5 11 2Z"
        fill="rgb(26, 22, 21)"
      />
      <path
        d="M11 6C11 6 7 8.5 7 12C7 14.209 8.791 16 11 16C13.209 16 15 14.209 15 12C15 9.5 13 7 11 6Z"
        fill="rgb(249, 248, 248)"
      />
    </svg>
  );
}
