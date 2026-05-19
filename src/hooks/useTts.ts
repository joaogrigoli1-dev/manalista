"use client";
import { useState, useEffect, useCallback, useRef } from "react";

export type TtsStatus = "idle" | "playing" | "paused" | "error" | "unsupported";

export interface UseTtsOptions {
  lang?: string;
  rate?: number;    // 0.1 - 10, default 1
  pitch?: number;   // 0 - 2, default 1
  volume?: number;  // 0 - 1, default 1
}

export function useTts(options: UseTtsOptions = {}) {
  const { lang = "pt-BR", rate = 0.95, pitch = 1, volume = 1 } = options;
  const [status, setStatus] = useState<TtsStatus>("idle");
  const [progress, setProgress] = useState(0); // 0–100
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const textRef = useRef<string>("");
  const isSupported = typeof window !== "undefined" && "speechSynthesis" in window;

  // Limpar ao desmontar
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const speak = useCallback((text: string) => {
    if (!isSupported) {
      setStatus("unsupported");
      return;
    }

    // Cancelar qualquer fala em andamento
    window.speechSynthesis.cancel();

    // Limpar texto: remover markdown, emojis excessivos e formatação
    const clean = text
      .replace(/#{1,6}\s/g, "")           // headings markdown
      .replace(/\*\*(.*?)\*\*/g, "$1")    // bold
      .replace(/\*(.*?)\*/g, "$1")        // itálico
      .replace(/`(.*?)`/g, "$1")          // code inline
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // links
      .replace(/^[-*+]\s/gm, "")          // listas
      .replace(/\n{3,}/g, "\n\n")         // quebras excessivas
      .trim();

    textRef.current = clean;

    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.lang = lang;
    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.volume = volume;

    utterance.onstart = () => {
      setStatus("playing");
      setProgress(0);
    };

    utterance.onboundary = (e) => {
      if (e.name === "word" && clean.length > 0) {
        setProgress(Math.round((e.charIndex / clean.length) * 100));
      }
    };

    utterance.onend = () => {
      setStatus("idle");
      setProgress(100);
      setTimeout(() => setProgress(0), 1000);
    };

    utterance.onerror = (e) => {
      // "interrupted" não é erro real (usuário parou)
      if (e.error !== "interrupted" && e.error !== "canceled") {
        setStatus("error");
      } else {
        setStatus("idle");
      }
    };

    utterance.onpause = () => setStatus("paused");
    utterance.onresume = () => setStatus("playing");

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [isSupported, lang, rate, pitch, volume]);

  const pause = useCallback(() => {
    if (isSupported && window.speechSynthesis.speaking) {
      window.speechSynthesis.pause();
    }
  }, [isSupported]);

  const resume = useCallback(() => {
    if (isSupported && window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }
  }, [isSupported]);

  const stop = useCallback(() => {
    if (isSupported) {
      window.speechSynthesis.cancel();
      setStatus("idle");
      setProgress(0);
    }
  }, [isSupported]);

  return {
    speak,
    pause,
    resume,
    stop,
    status,
    progress,
    isSupported,
    isPlaying: status === "playing",
    isPaused: status === "paused",
  };
}
