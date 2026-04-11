"use client";
import Link from "next/link";
import { useTheme } from "@/hooks/useTheme";
import type { Lang } from "@/types";

interface NavbarProps {
  lang: Lang;
  onLangChange: (l: Lang) => void;
}

export function Navbar({ lang, onLangChange }: NavbarProps) {
  const { theme, toggleTheme } = useTheme();
  const isClinic = theme === "clinic";

  return (
    <nav
      style={{
        position: "fixed", top: "1.25rem", left: "50%",
        transform: "translateX(-50%)", zIndex: 100,
        display: "flex", alignItems: "center", gap: "0.35rem",
        padding: "0.4rem 0.6rem", borderRadius: "9999px",
        background: "var(--nav-bg)",
        backdropFilter: "blur(24px) saturate(1.5)",
        border: "1px solid var(--border-subtle)",
        boxShadow: "var(--shadow-card)",
        whiteSpace: "nowrap",
      }}
    >
      {/* Logo pill */}
      <Link href="/" style={{
        display: "flex", alignItems: "center", gap: "0.5rem",
        padding: "0.3rem 0.75rem 0.3rem 0.4rem",
        borderRadius: "9999px",
        background: "var(--accent-brand-soft)",
        color: "var(--accent-brand)",
        textDecoration: "none", fontWeight: 800, fontSize: "0.82rem",
      }}>
        <span style={{
          width: 26, height: 26, borderRadius: "50%",
          background: "var(--accent-brand)",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "#fff", fontSize: "0.7rem", fontWeight: 800,
        }}>M</span>
        MAnalista
      </Link>

      {/* Separator */}
      <div style={{ width: 1, height: 20, background: "var(--border-subtle)", margin: "0 0.2rem" }} />

      {/* Theme toggle */}
      <button
        type="button" onClick={toggleTheme}
        title={isClinic ? "Tema Escuro" : "Tema Clínico"}
        className="nav-btn"
        style={{
          padding: "0.35rem 0.7rem", borderRadius: "9999px",
          border: "1px solid var(--border-subtle)",
          background: "var(--bg-glass)",
          color: "var(--text-secondary)",
          fontSize: "0.72rem", fontWeight: 600,
          cursor: "pointer", fontFamily: "inherit",
          transition: "all 0.25s ease",
          display: "flex", alignItems: "center", gap: "0.35rem",
        }}
      >
        {isClinic ? "🌙 Dark" : "🏥 Clinic"}
      </button>

      {/* Lang toggle */}
      <button
        type="button" onClick={() => onLangChange(lang === "pt" ? "en" : "pt")}
        className="nav-btn"
        style={{
          padding: "0.35rem 0.7rem", borderRadius: "9999px",
          border: "1px solid var(--border-subtle)",
          background: "var(--bg-glass)",
          color: "var(--text-secondary)",
          fontSize: "0.68rem", fontWeight: 700,
          cursor: "pointer", fontFamily: "inherit",
          letterSpacing: "0.08em",
          transition: "all 0.25s ease",
        }}
      >
        {lang === "pt" ? "EN" : "PT"}
      </button>
    </nav>
  );
}
