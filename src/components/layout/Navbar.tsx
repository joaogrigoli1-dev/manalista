"use client";
import Link from "next/link";
import type { Lang } from "@/types";

interface NavbarProps {
  lang: Lang;
  onLangChange: (l: Lang) => void;
}

export function Navbar({ lang, onLangChange }: NavbarProps) {
  return (
    <nav
      style={{
        position: "fixed", top: "1.25rem", left: "50%",
        transform: "translateX(-50%)", zIndex: 100,
        display: "flex", alignItems: "center", gap: "0.35rem",
        padding: "0.4rem 0.6rem", borderRadius: "9999px",
        background: "rgba(10,10,14,0.8)",
        backdropFilter: "blur(24px) saturate(1.6)",
        border: "1px solid rgba(255,255,255,0.07)",
        boxShadow: "0 0 0 1px rgba(255,255,255,0.04), 0 8px 32px rgba(0,0,0,0.6)",
        whiteSpace: "nowrap",
      }}
    >
      {/* Logo pill */}
      <Link href="/" style={{
        display: "flex", alignItems: "center", gap: "0.5rem",
        padding: "0.3rem 0.75rem 0.3rem 0.4rem",
        borderRadius: "9999px",
        background: "rgba(124,92,252,0.14)",
        color: "#7C5CFC",
        textDecoration: "none", fontWeight: 800, fontSize: "0.82rem",
        letterSpacing: "-0.01em",
      }}>
        <span style={{
          width: 26, height: 26, borderRadius: "50%",
          background: "#7C5CFC",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "#fff", fontSize: "0.7rem", fontWeight: 800,
          boxShadow: "0 0 12px rgba(124,92,252,0.5)",
        }}>M</span>
        MAnalista
      </Link>

      {/* Separator */}
      <div style={{ width: 1, height: 20, background: "rgba(255,255,255,0.07)", margin: "0 0.15rem" }} />

      {/* Language toggle */}
      <button
        type="button"
        onClick={() => onLangChange(lang === "pt" ? "en" : "pt")}
        className="nav-btn"
        style={{
          padding: "0.35rem 0.75rem", borderRadius: "9999px",
          border: "1px solid rgba(255,255,255,0.08)",
          background: "rgba(255,255,255,0.04)",
          color: "rgba(255,255,255,0.55)",
          fontSize: "0.68rem", fontWeight: 700,
          cursor: "pointer", fontFamily: "inherit",
          letterSpacing: "0.08em",
          transition: "all 0.25s cubic-bezier(0.32,0.72,0,1)",
        }}
      >
        {lang === "pt" ? "EN" : "PT"}
      </button>
    </nav>
  );
}
