"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Mode = "login" | "signup";

const EASE = [0.22, 1, 0.36, 1] as const;

export function AuthForm() {
  const [mode, setMode] = useState<Mode>("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  async function handleGoogleLogin() {
    if (!supabase) {
      setError(
        "Сервер не настроен: задайте NEXT_PUBLIC_SUPABASE_URL и NEXT_PUBLIC_SUPABASE_ANON_KEY (например в Vercel → Environment Variables)."
      );
      return;
    }
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent("/dashboard")}`,
      },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    }
  }

  async function handleLogin(formData: FormData) {
    if (!supabase) {
      setError(
        "Сервер не настроен: задайте NEXT_PUBLIC_SUPABASE_URL и NEXT_PUBLIC_SUPABASE_ANON_KEY."
      );
      return;
    }
    setLoading(true);
    setError(null);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
  }

  async function handleSignup(formData: FormData) {
    if (!supabase) {
      setError(
        "Сервер не настроен: задайте NEXT_PUBLIC_SUPABASE_URL и NEXT_PUBLIC_SUPABASE_ANON_KEY."
      );
      return;
    }
    setLoading(true);
    setError(null);
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (password !== confirmPassword) {
      setError("Пароли не совпадают");
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent("/dashboard")}`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setError(null);
    setLoading(false);
    alert("Проверьте email для подтверждения регистрации.");
  }

  return (
    <div
      className="relative z-10 w-full flex flex-col"
      style={{ maxWidth: 440, gap: 24 }}
    >
      <div
        className="flex flex-col w-full shadow-xl"
        style={{
          backgroundColor: "rgba(255,255,255,0.72)",
          borderRadius: 24,
          padding: 32,
          gap: 28,
        }}
      >
        <div className="flex flex-col text-center" style={{ gap: 8 }}>
          <span
            className="text-[13px] font-semibold tracking-[0.12em] uppercase"
            style={{ color: "var(--neutral-10)" }}
          >
            Aimaq
          </span>
          <h1
            className="font-semibold leading-[125%] tracking-[-0.02em]"
            style={{ fontSize: "clamp(20px, 2.4vw, 28px)", color: "var(--neutral-30)" }}
          >
            {mode === "login" ? "С возвращением" : "Создайте аккаунт"}
          </h1>
          <p className="leading-[150%]" style={{ fontSize: 15, color: "var(--neutral-20)" }}>
            {mode === "login"
              ? "Войдите, чтобы продолжить подбор локаций."
              : "Зарегистрируйтесь и сохраняйте сценарии подбора."}
          </p>
        </div>

        <div
          className="flex p-1 rounded-full w-full"
          style={{ backgroundColor: "rgba(26,22,21,0.07)" }}
          role="tablist"
          aria-label="Режим"
        >
          <TogglePill active={mode === "login"} onClick={() => { setMode("login"); setError(null); }}>
            Вход
          </TogglePill>
          <TogglePill active={mode === "signup"} onClick={() => { setMode("signup"); setError(null); }}>
            Регистрация
          </TogglePill>
        </div>

        <GoogleButton onClick={handleGoogleLogin} disabled={loading || !supabase} />

        <div className="flex items-center" style={{ gap: 12 }}>
          <div className="flex-1 h-px" style={{ backgroundColor: "var(--stroke)" }} />
          <span className="text-[13px]" style={{ color: "var(--neutral-10)" }}>или</span>
          <div className="flex-1 h-px" style={{ backgroundColor: "var(--stroke)" }} />
        </div>

        {error && (
          <p className="text-[14px] text-center" style={{ color: "#e53e3e" }}>
            {error}
          </p>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={mode}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0, transition: { duration: 0.25, ease: EASE } }}
            exit={{ opacity: 0, y: -6, transition: { duration: 0.15 } }}
          >
            {mode === "login" ? (
              <LoginFields onSubmit={handleLogin} loading={loading} disabled={!supabase} />
            ) : (
              <SignupFields onSubmit={handleSignup} loading={loading} disabled={!supabase} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <p className="text-center leading-[150%]" style={{ fontSize: 14, color: "var(--neutral-10)" }}>
        Продолжая, вы соглашаетесь с условиями сервиса и политикой конфиденциальности.
      </p>
    </div>
  );
}

function GoogleButton({ onClick, disabled }: { onClick: () => void; disabled: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="w-full flex items-center justify-center font-semibold text-[15px] transition-all hover:opacity-85 disabled:opacity-50"
      style={{
        backgroundColor: "rgba(255,255,255,0.85)",
        border: "1px solid var(--stroke)",
        borderRadius: 100,
        padding: "14px 24px",
        color: "var(--neutral-30)",
        gap: 10,
      }}
    >
      <svg width="20" height="20" viewBox="0 0 48 48">
        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
        <path fill="#FBBC05" d="M10.53 28.59a14.5 14.5 0 0 1 0-9.18l-7.98-6.19a24.0 24.0 0 0 0 0 21.56l7.98-6.19z" />
        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
      </svg>
      Продолжить с Google
    </button>
  );
}

function TogglePill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className="flex-1 py-2.5 rounded-full text-[15px] font-semibold transition-colors duration-200"
      style={{
        backgroundColor: active ? "var(--neutral-30)" : "transparent",
        color: active ? "#fff" : "var(--neutral-20)",
      }}
    >
      {children}
    </button>
  );
}

function inputClassName() {
  return "w-full px-4 py-3.5 rounded-2xl text-[16px] leading-[150%] outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-[var(--blue-30)] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent";
}

function LoginFields({
  onSubmit,
  loading,
  disabled,
}: {
  onSubmit: (fd: FormData) => void;
  loading: boolean;
  disabled?: boolean;
}) {
  return (
    <form
      className="flex flex-col"
      style={{ gap: 20 }}
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(new FormData(e.currentTarget));
      }}
    >
      <Field label="Email" htmlFor="auth-email-login">
        <input
          id="auth-email-login"
          name="email"
          type="email"
          autoComplete="email"
          required
          className={inputClassName()}
          style={{
            color: "var(--neutral-30)",
            backgroundColor: "rgba(255,255,255,0.85)",
            border: "1px solid var(--stroke)",
            boxShadow: "0 0 0 0 transparent",
          }}
          placeholder="you@company.com"
        />
      </Field>
      <Field label="Пароль" htmlFor="auth-password-login">
        <input
          id="auth-password-login"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          minLength={8}
          className={inputClassName()}
          style={{
            color: "var(--neutral-30)",
            backgroundColor: "rgba(255,255,255,0.85)",
            border: "1px solid var(--stroke)",
          }}
          placeholder="••••••••"
        />
      </Field>
      <button
        type="submit"
        disabled={loading || disabled}
        className="w-full font-semibold text-[16px] text-white transition-opacity hover:opacity-85 disabled:opacity-50 mt-1"
        style={{ backgroundColor: "var(--neutral-30)", borderRadius: 100, padding: "18px 24px" }}
      >
        {loading ? "Загрузка..." : "Войти"}
      </button>
    </form>
  );
}

function SignupFields({
  onSubmit,
  loading,
  disabled,
}: {
  onSubmit: (fd: FormData) => void;
  loading: boolean;
  disabled?: boolean;
}) {
  return (
    <form
      className="flex flex-col"
      style={{ gap: 20 }}
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(new FormData(e.currentTarget));
      }}
    >
      <Field label="Имя" htmlFor="auth-name">
        <input
          id="auth-name"
          name="name"
          type="text"
          autoComplete="name"
          required
          className={inputClassName()}
          style={{
            color: "var(--neutral-30)",
            backgroundColor: "rgba(255,255,255,0.85)",
            border: "1px solid var(--stroke)",
          }}
          placeholder="Как к вам обращаться"
        />
      </Field>
      <Field label="Email" htmlFor="auth-email-signup">
        <input
          id="auth-email-signup"
          name="email"
          type="email"
          autoComplete="email"
          required
          className={inputClassName()}
          style={{
            color: "var(--neutral-30)",
            backgroundColor: "rgba(255,255,255,0.85)",
            border: "1px solid var(--stroke)",
          }}
          placeholder="you@company.com"
        />
      </Field>
      <Field label="Пароль" htmlFor="auth-password-signup">
        <input
          id="auth-password-signup"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          className={inputClassName()}
          style={{
            color: "var(--neutral-30)",
            backgroundColor: "rgba(255,255,255,0.85)",
            border: "1px solid var(--stroke)",
          }}
          placeholder="Не менее 8 символов"
        />
      </Field>
      <Field label="Повторите пароль" htmlFor="auth-password-confirm">
        <input
          id="auth-password-confirm"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          className={inputClassName()}
          style={{
            color: "var(--neutral-30)",
            backgroundColor: "rgba(255,255,255,0.85)",
            border: "1px solid var(--stroke)",
          }}
          placeholder="••••••••"
        />
      </Field>
      <button
        type="submit"
        disabled={loading || disabled}
        className="w-full font-semibold text-[16px] text-white transition-opacity hover:opacity-85 disabled:opacity-50 mt-1"
        style={{ backgroundColor: "var(--neutral-30)", borderRadius: 100, padding: "18px 24px" }}
      >
        {loading ? "Загрузка..." : "Зарегистрироваться"}
      </button>
    </form>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col w-full" style={{ gap: 8 }}>
      <label
        htmlFor={htmlFor}
        className="text-[13px] font-semibold leading-[140%]"
        style={{ color: "var(--neutral-30)" }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}
