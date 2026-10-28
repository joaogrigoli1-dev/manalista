# A11y Agent (Accessibility + TTS)
**Modelo:** `claude-sonnet-4-6`
**Fase:** BLOCO 3 — FASES 3A/3B
**Especialidade:** WCAG 2.2 AA/AAA, Web Speech API, TTS, leitura facilitada

---

## CONTEXTO RECEBIDO DO ORQUESTRADOR

- **Repo:** `~/Documents/DEV/manalista`
- **Pré-requisito:** Bloco 0 e 2 concluídos (PWA funcionando)
- **Público:** pais/cuidadores de crianças com necessidades especiais — WCAG AAA é o alvo
- **Plataformas TTS:** Web Speech API (grátis, offline) · ElevenLabs (Pro+, Bloco 5)
- **iOS:** vozes pt-BR Luciana/Felipe excelentes no iOS Safari
- **Android:** Google TTS em pt-BR muito boa

---

## FASE 3A — TTS (Text-to-Speech)

### 3A.1 — Biblioteca TTS core

```typescript
// src/lib/tts.ts
export interface TtsOptions {
  voice?: SpeechSynthesisVoice;
  rate?: number;      // 0.5 – 2.0 (default 1.0)
  pitch?: number;     // 0 – 2 (default 1.0)
  lang?: string;      // "pt-BR" | "en-US"
  onStart?: () => void;
  onEnd?: () => void;
  onBoundary?: (charIndex: number) => void;
  onError?: (error: SpeechSynthesisErrorEvent) => void;
}

// iOS Safari enrosca com textos > 32K chars — quebrar em ~200 chars por utterance
function splitForTts(text: string, maxLen = 200): string[] {
  const chunks: string[] = [];
  // Quebrar em frases (ponto final, ponto de interrogação, reticências)
  const sentences = text.split(/(?<=[.!?])\s+/);
  let current = "";
  for (const s of sentences) {
    if ((current + s).length > maxLen && current) {
      chunks.push(current.trim());
      current = s;
    } else {
      current += (current ? " " : "") + s;
    }
  }
  if (current) chunks.push(current.trim());
  return chunks;
}

export class TtsPlayer {
  private utterances: SpeechSynthesisUtterance[] = [];
  private currentIndex = 0;
  private _isPaused = false;

  get supported() {
    return "speechSynthesis" in window;
  }

  getVoices(lang?: string): SpeechSynthesisVoice[] {
    const voices = window.speechSynthesis.getVoices();
    if (!lang) return voices;
    // Priorizar vozes locais (localService=true)
    return [
      ...voices.filter(v => v.lang.startsWith(lang) && v.localService),
      ...voices.filter(v => v.lang.startsWith(lang) && !v.localService),
    ];
  }

  speak(text: string, opts: TtsOptions = {}) {
    if (!this.supported) return;
    this.stop();
    this.currentIndex = 0;

    const chunks = splitForTts(text, 200);
    const lang = opts.lang ?? "pt-BR";
    const voices = this.getVoices(lang);
    const chosen = opts.voice ?? voices[0] ?? null;

    this.utterances = chunks.map((chunk, i) => {
      const u = new SpeechSynthesisUtterance(chunk);
      u.voice = chosen;
      u.lang = lang;
      u.rate = opts.rate ?? 1.0;
      u.pitch = opts.pitch ?? 1.0;

      if (i === 0) u.onstart = () => opts.onStart?.();
      if (i === chunks.length - 1) u.onend = () => opts.onEnd?.();
      u.onboundary = (e) => opts.onBoundary?.(e.charIndex);
      u.onerror = (e) => opts.onError?.(e);

      return u;
    });

    this.utterances.forEach(u => window.speechSynthesis.speak(u));
  }

  pause() {
    window.speechSynthesis.pause();
    this._isPaused = true;
  }

  resume() {
    window.speechSynthesis.resume();
    this._isPaused = false;
  }

  stop() {
    window.speechSynthesis.cancel();
    this._isPaused = false;
  }

  get isPaused() { return this._isPaused; }
  get isSpeaking() { return window.speechSynthesis.speaking; }
}

export const ttsPlayer = new TtsPlayer();
```

### 3A.2 — Hook useTts

```typescript
// src/hooks/useTts.ts
"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { ttsPlayer, type TtsOptions } from "@/lib/tts";

export function useTts() {
  const [playing, setPlaying] = useState(false);
  const [paused, setPaused] = useState(false);
  const [currentCharIndex, setCurrentCharIndex] = useState<number | null>(null);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | undefined>();

  // Carregar vozes (pode demorar em alguns browsers)
  useEffect(() => {
    if (!ttsPlayer.supported) return;
    const load = () => {
      const ptVoices = ttsPlayer.getVoices("pt");
      const enVoices = ttsPlayer.getVoices("en");
      setVoices([...ptVoices, ...enVoices]);
      if (!selectedVoice) setSelectedVoice(ptVoices[0]);
    };
    load();
    window.speechSynthesis.addEventListener("voiceschanged", load);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", load);
  }, []);

  const speak = useCallback((text: string, opts?: Partial<TtsOptions>) => {
    ttsPlayer.speak(text, {
      voice: selectedVoice,
      lang: selectedVoice?.lang ?? "pt-BR",
      ...opts,
      onStart: () => { setPlaying(true); setPaused(false); },
      onEnd: () => { setPlaying(false); setCurrentCharIndex(null); },
      onBoundary: (idx) => setCurrentCharIndex(idx),
    });
  }, [selectedVoice]);

  const pause = useCallback(() => { ttsPlayer.pause(); setPaused(true); }, []);
  const resume = useCallback(() => { ttsPlayer.resume(); setPaused(false); }, []);
  const stop = useCallback(() => { ttsPlayer.stop(); setPlaying(false); setPaused(false); }, []);

  return {
    speak, pause, resume, stop,
    playing, paused, currentCharIndex,
    voices, selectedVoice, setSelectedVoice,
    supported: ttsPlayer.supported,
  };
}
```

### 3A.3 — Componente TtsPlayer UI

```typescript
// src/components/TtsPlayer.tsx
"use client";
import { useTts } from "@/hooks/useTts";
import { Play, Pause, Square, Volume2 } from "lucide-react";
import * as React from "react";

interface TtsPlayerProps {
  text: string;
  size?: "mini" | "full";
  label?: string;
}

export function TtsPlayer({ text, size = "full", label = "Ouvir leitura" }: TtsPlayerProps) {
  const { speak, pause, resume, stop, playing, paused, voices, selectedVoice, setSelectedVoice, supported } = useTts();
  const [rate, setRate] = React.useState(1.0);

  if (!supported) return null; // não renderizar em SSR ou browser sem suporte

  if (size === "mini") {
    return (
      <button
        onClick={() => playing && !paused ? pause() : paused ? resume() : speak(text, { rate })}
        aria-label={playing && !paused ? "Pausar leitura" : "Ouvir em voz alta"}
        aria-pressed={playing}
        className="p-1.5 rounded-md text-ink-muted hover:text-brand-primary focus-visible:ring-2"
      >
        <Volume2 size={16} />
      </button>
    );
  }

  return (
    <div role="group" aria-label="Leitura em voz alta" className="flex flex-wrap items-center gap-3">
      <button
        onClick={() => playing && !paused ? pause() : paused ? resume() : speak(text, { rate })}
        aria-label={playing && !paused ? "Pausar" : paused ? "Continuar" : label}
        aria-pressed={playing}
        className="flex items-center gap-2 rounded-full bg-brand-soft px-4 py-2 text-sm font-semibold
                   text-brand-primary hover:bg-brand-primary hover:text-white transition-colors
                   focus-visible:ring-2 focus-visible:ring-brand-primary min-h-[44px]"
      >
        {playing && !paused ? <Pause size={16} /> : <Play size={16} />}
        {playing && !paused ? "Pausar" : paused ? "Continuar" : label}
      </button>

      {(playing || paused) && (
        <button onClick={stop} aria-label="Parar leitura"
          className="rounded-full p-2 text-ink-muted hover:text-danger focus-visible:ring-2 min-h-[44px] min-w-[44px]">
          <Square size={16} />
        </button>
      )}

      {/* Selector de velocidade */}
      <select
        value={rate}
        onChange={e => setRate(Number(e.target.value))}
        aria-label="Velocidade de leitura"
        className="text-sm rounded-md border border-slate-200 px-2 py-1 min-h-[44px]"
      >
        <option value={0.75}>0.75×</option>
        <option value={1.0}>1× (normal)</option>
        <option value={1.25}>1.25×</option>
        <option value={1.5}>1.5×</option>
      </select>

      {/* Selector de voz (apenas "full") */}
      {voices.length > 1 && (
        <select
          value={selectedVoice?.name ?? ""}
          onChange={e => setSelectedVoice(voices.find(v => v.name === e.target.value))}
          aria-label="Voz"
          className="text-sm rounded-md border border-slate-200 px-2 py-1 min-h-[44px] max-w-[180px]"
        >
          {voices.map(v => (
            <option key={v.name} value={v.name}>{v.name}</option>
          ))}
        </select>
      )}
    </div>
  );
}
```

### 3A.4 — Highlight do texto sendo lido

```typescript
// src/components/HighlightedText.tsx
interface HighlightedTextProps {
  text: string;
  currentCharIndex: number | null;
}

export function HighlightedText({ text, currentCharIndex }: HighlightedTextProps) {
  if (currentCharIndex === null) return <span>{text}</span>;

  return (
    <span>
      <mark className="bg-brand-soft rounded-sm">{text.slice(0, currentCharIndex)}</mark>
      {text.slice(currentCharIndex)}
    </span>
  );
}
```

### 3A.5 — Integrar TtsPlayer nos locais certos

1. **Laudo final** (`DiagnosticReport.tsx`): botão grande "Ouvir laudo completo"
2. **Cada mensagem do debate** (`DebateMessage.tsx`): botão mini (size="mini")
3. **Landing hero** (`HeroSection.tsx`): botão "Ouvir como funciona"

**Commit:**
```
feat(tts): adicionar Web Speech API com TtsPlayer, highlight e selector de voz
```

---

## FASE 3B — WCAG 2.2 AA/AAA

### 3B.1 — Audit automatizado

```bash
npm install -D axe-core @axe-core/playwright

# Criar teste e2e de acessibilidade
# src/__tests__/e2e/a11y.test.ts
```

```typescript
// src/__tests__/e2e/a11y.test.ts
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const pages = ["/", "/analise", "/offline"];

for (const url of pages) {
  test(`${url} deve passar WCAG 2.1 AA`, async ({ page }) => {
    await page.goto(url);
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    expect(results.violations).toEqual([]);
  });
}
```

### 3B.2 — Checklist de fixes

**Contraste:**
```css
/* Subir ink-muted de 55% → 58% luminance para garantir 4.6:1 */
/* Subir text-muted em dark mode de 30% → 42% de branco */
```

**Skip-to-content:**
```typescript
// src/app/layout.tsx — PRIMEIRO elemento do body
<a href="#main-content" className="skip-link">Pular para conteúdo principal</a>
// ...
<main id="main-content">
```

**Aria live para streaming:**
```typescript
// ANTES (problemático — re-anuncia cada chunk):
<div aria-live="polite">{streamingText}</div>

// DEPOIS (correto — anuncia só quando o agente termina):
<div aria-live="off">{streamingText}</div>  {/* durante streaming */}
<div aria-live="polite">                     {/* container final */}
  {agentDone ? streamingText : null}
</div>
```

**Focus trap em modais:**
- shadcn Dialog já tem focus trap via Radix UI ✓
- Verificar CharacterModal e ConsentModal customizados → migrar para shadcn Dialog

**Tab order:**
```typescript
// Verificar: Tab → todos os elementos interativos devem ter foco visível
// Esc → fechar modais
// Enter/Space → ativar botões e checkboxes
```

**Aria labels em botões com apenas ícone:**
```typescript
// Exemplo no ChildForm — botão "→" ou "×" deve ter aria-label
<button aria-label="Avançar para próxima etapa">→</button>
<button aria-label="Fechar" aria-keyshortcuts="Escape">×</button>
```

### 3B.3 — Toggles de leitura facilitada

```typescript
// src/components/AccessibilityMenu.tsx
// Menu de preferências de leitura — acessível via ícone de acessibilidade no header

const preferences = {
  comfortableReading: false,   // aumenta fonte para 19px, line-height 1.8
  highContrast: false,         // força AAA em tudo
  reducedMotion: false,        // mesmo efeito que @media prefers-reduced-motion
  dyslexicFont: false,         // OpenDyslexic self-hosted
  wordSpacing: "normal",       // "normal" | "wide" | "wider"
};
```

```typescript
// src/hooks/useAccessibilityPrefs.ts
// Persiste no localStorage + aplica no <html> via dataset
// Ex: document.documentElement.dataset.comfortableReading = "true"
```

```css
/* src/styles/accessibility.css */
[data-comfortable-reading="true"] body {
  font-size: 1.1875rem; /* 19px */
  line-height: 1.8;
}

[data-high-contrast="true"] {
  /* Sobrescrever tokens para forçar AAA em tudo */
  --ink-muted: oklch(22% 0.04 250); /* forçar mesmo contraste do primary */
}

[data-reduced-motion="true"] *,
[data-reduced-motion="true"] *::before,
[data-reduced-motion="true"] *::after {
  animation-duration: 0.01ms !important;
  transition-duration: 0.01ms !important;
}
```

**Commit:**
```
feat(a11y): adicionar WCAG 2.2 AA+, skip-to-content, toggles de leitura e aria-live correto
```

---

## VERIFICAÇÕES FINAIS

```bash
npm run check
npm run test:e2e  # testes de acessibilidade devem passar

# Teste manual VoiceOver (iOS):
# Settings → Accessibility → VoiceOver → ON
# Navegar com gestos de deslize → verificar todas as seções anunciadas corretamente

# Teste manual TalkBack (Android):
# Settings → Accessibility → TalkBack → ON
# Navegar pela análise → debate deve ser anunciado sequencialmente

# Teste manual por teclado:
# Tab por toda a landing → cada elemento deve ter foco visível
# Esc em qualquer modal → modal fecha
# Enter em botão principal → ativa

# Lighthouse Accessibility = 100
npx lighthouse https://manalista.com.br --only-categories=accessibility
```

---

## REPORTAR AO ORQUESTRADOR

### Fase 3A — TTS:
- [ ] TtsPlayer funcionando em iOS (vozes pt-BR Luciana/Felipe)
- [ ] TtsPlayer funcionando em Android (Google TTS pt-BR)
- [ ] TtsPlayer funcionando em desktop (Chrome/Safari/Firefox)
- [ ] Chunk splitting evitando travamento no iOS
- [ ] Highlight do texto funcionando (delta ≤ 200ms)
- [ ] Velocidade 0.75x / 1x / 1.25x / 1.5x funcionando
- [ ] Selector de voz com persistência
- [ ] Botão mini em cada mensagem do debate
- [ ] Botão full no laudo final

### Fase 3B — A11y:
- [ ] axe: zero violações em todas as páginas
- [ ] Contraste WCAG AA em todo body · AAA em textos do laudo
- [ ] Skip-to-content funcionando
- [ ] Focus trap em todos os modais (Dialog, Sheet)
- [ ] aria-live correto no streaming (não repetindo)
- [ ] Navegação 100% por teclado
- [ ] VoiceOver e TalkBack: leitura correta
- [ ] prefers-reduced-motion respeitado
- [ ] Toggles de leitura facilitada implementados
- [ ] Lighthouse Accessibility: 100
