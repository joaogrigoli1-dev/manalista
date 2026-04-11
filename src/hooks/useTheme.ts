"use client";
import { useState, useEffect, useCallback } from "react";
import type { Theme } from "@/types";

const STORAGE_KEY = "manalista-theme";

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>("dark");

  // Carrega preferência salva
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as Theme | null;
    if (saved === "dark" || saved === "clinic") {
      setThemeState(saved);
      document.documentElement.setAttribute("data-theme", saved);
    } else {
      document.documentElement.setAttribute("data-theme", "dark");
    }
  }, []);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    document.documentElement.setAttribute("data-theme", t);
    localStorage.setItem(STORAGE_KEY, t);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === "dark" ? "clinic" : "dark");
  }, [theme, setTheme]);

  return { theme, setTheme, toggleTheme };
}
