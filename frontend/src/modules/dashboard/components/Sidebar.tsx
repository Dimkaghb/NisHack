"use client";

import { useState } from "react";
import Link from "next/link";

function AimaqLogo() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
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

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const MAIN_NAV: NavItem[] = [
  {
    label: "Home",
    href: "/dashboard",
    icon: (
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    label: "Clients",
    href: "/dashboard/clients",
    icon: (
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    label: "Projects",
    href: "/dashboard/projects",
    icon: (
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    label: "Time tracking",
    href: "/dashboard/time",
    icon: (
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
  },
];

const TOOLS_NAV: NavItem[] = [
  {
    label: "Invoices",
    href: "/dashboard/invoices",
    icon: (
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    ),
  },
  {
    label: "Contracts",
    href: "/dashboard/contracts",
    icon: (
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <path d="M14 2v6h6" />
        <line x1="12" y1="18" x2="12" y2="12" />
        <line x1="9" y1="15" x2="15" y2="15" />
      </svg>
    ),
  },
  {
    label: "Balance",
    href: "/dashboard/balance",
    icon: (
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
  },
  {
    label: "Accounting",
    href: "/dashboard/accounting",
    icon: (
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="18" rx="2" />
        <line x1="2" y1="9" x2="22" y2="9" />
        <line x1="10" y1="9" x2="10" y2="21" />
      </svg>
    ),
  },
  {
    label: "Taxes",
    href: "/dashboard/taxes",
    icon: (
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
        <line x1="4" y1="22" x2="4" y2="15" />
      </svg>
    ),
  },
];

function getAdminNav(displayName: string): NavItem[] {
  return [
    {
      label: "Support",
      href: "/dashboard/support",
      icon: (
        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      ),
    },
    {
      label: displayName,
      href: "/dashboard/profile",
      icon: (
        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      ),
    },
  ];
}

function NavLink({
  item,
  active,
}: {
  item: NavItem;
  active: boolean;
}) {
  return (
    <Link
      href={item.href}
      className="flex items-center gap-3 rounded-xl transition-colors"
      style={{
        padding: "10px 12px",
        fontSize: 15,
        fontWeight: active ? 500 : 400,
        color: active ? "var(--neutral-30)" : "var(--neutral-20)",
        backgroundColor: active ? "var(--beige-20)" : "transparent",
      }}
    >
      <span style={{ color: active ? "var(--neutral-30)" : "var(--neutral-10)", flexShrink: 0 }}>
        {item.icon}
      </span>
      {item.label}
    </Link>
  );
}

function SectionLabel({ label }: { label: string }) {
  return (
    <span
      className="text-[11px] font-semibold uppercase tracking-[0.12em]"
      style={{ color: "var(--neutral-10)", padding: "4px 12px" }}
    >
      {label}
    </span>
  );
}

interface SidebarProps {
  userName?: string;
}

export function Sidebar({ userName }: SidebarProps) {
  const [activePath] = useState("/dashboard");

  return (
    <aside
      className="flex flex-col flex-shrink-0 h-full overflow-y-auto"
      style={{
        width: 200,
        backgroundColor: "var(--beige-10)",
        borderRight: "1px solid var(--stroke)",
      }}
    >
      {/* Logo row */}
      <div
        className="flex items-center justify-between flex-shrink-0"
        style={{ padding: "16px 14px 8px" }}
      >
        <Link href="/" className="flex items-center gap-2">
          <AimaqLogo />
          <span
            className="font-semibold tracking-[-0.02em]"
            style={{ fontSize: 16, color: "var(--neutral-30)" }}
          >
            Aimaq
          </span>
        </Link>
        <button
          type="button"
          className="flex items-center justify-center rounded-full transition-colors hover:bg-black/5"
          style={{
            width: 26,
            height: 26,
            border: "1.5px solid var(--stroke)",
            backgroundColor: "rgba(255,255,255,0.72)",
            cursor: "pointer",
            color: "var(--neutral-10)",
          }}
        >
          <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      </div>

      {/* Main nav */}
      <nav className="flex flex-col flex-1" style={{ padding: "4px 8px", gap: 2 }}>
        <div className="flex flex-col" style={{ gap: 1 }}>
          {MAIN_NAV.map((item) => (
            <NavLink key={item.label} item={item} active={activePath === item.href} />
          ))}
        </div>

        {/* Find places CTA */}
        <Link
          href="/app"
          className="flex items-center gap-2.5 rounded-xl font-semibold transition-opacity hover:opacity-85"
          style={{
            padding: "10px 12px",
            marginTop: 14,
            fontSize: 14,
            color: "#fff",
            backgroundColor: "var(--neutral-30)",
          }}
        >
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          Find places
        </Link>

        {/* Tools */}
        <div className="flex flex-col" style={{ gap: 1, marginTop: 20 }}>
          <SectionLabel label="Tools" />
          {TOOLS_NAV.map((item) => (
            <NavLink key={item.label} item={item} active={activePath === item.href} />
          ))}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Admin */}
        <div className="flex flex-col" style={{ gap: 1, marginBottom: 12 }}>
          <SectionLabel label="Administration" />
          {getAdminNav(userName ?? "Profile").map((item) => (
            <NavLink key={item.label} item={item} active={activePath === item.href} />
          ))}
        </div>
      </nav>
    </aside>
  );
}
