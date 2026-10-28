# UI Agent
**Modelo:** `claude-sonnet-4-6`
**Fase:** BLOCO 1 — FASE 1A
**Especialidade:** Tailwind v4, tokens OKLCH, design system healthcare, shadcn/ui

---

## CONTEXTO RECEBIDO DO ORQUESTRADOR

- **Repo:** `~/Documents/DEV/manalista`
- **Stack atual:** Tailwind 3.4.17 + CSS inline maciço + dark theme hard-coded
- **Skills disponíveis:** `ds-healthcare`, `high-end-visual-design`, `myclinicsoft-layout`
- **Filosofia:** healthcare como fundação, premium como camada — WCAG AAA onde possível
- **Pré-requisito:** Bloco 0 concluído (CI rodando, código limpo)

---

## TAREFAS — FASE 1A

### 1A.1 — Migrar Tailwind v3 → v4 (1 semana)

**Instalar:**
```bash
cd ~/Documents/DEV/manalista
npm uninstall tailwindcss postcss autoprefixer
npm install tailwindcss@next @tailwindcss/vite --save-dev
# ou via PostCSS (verificar como Next.js 15 prefere):
npm install tailwindcss@4 postcss --save-dev
```

**Verificar documentação Tailwind v4 + Next.js App Router** antes de instalar (pode precisar de `@tailwindcss/postcss`).

**Nova configuração (`tailwind.config.ts` vira CSS puro):**

Tailwind v4 usa CSS-first. Criar `src/styles/tailwind.css`:

```css
@import "tailwindcss";

/* ── Design Tokens — Healthcare + Premium ── */
@layer base {
  :root {
    /* Backgrounds */
    --bg-base:     oklch(98% 0.005 240);
    --bg-card:     oklch(100% 0 0);
    --bg-tinted:   oklch(96% 0.012 200);

    /* Ink (textos) */
    --ink-primary:   oklch(22% 0.04 250);   /* contraste 14.8:1 */
    --ink-secondary: oklch(40% 0.03 240);   /* 7.5:1 */
    --ink-muted:     oklch(55% 0.02 240);   /* 4.6:1 — só ≥ 16px */

    /* Brand */
    --brand-primary: oklch(58% 0.13 195);   /* teal médico */
    --brand-soft:    oklch(58% 0.13 195 / 0.10);
    --brand-glow:    oklch(58% 0.13 195 / 0.32);

    /* Semânticas */
    --success: oklch(58% 0.14 155);   /* emerald-700 */
    --warn:    oklch(60% 0.15 60);    /* amber-700 */
    --danger:  oklch(55% 0.20 25);    /* red-700 */
    --info:    oklch(55% 0.15 250);   /* blue-700 */

    /* Diagnósticos (KPI gauges) */
    --diag-tea:      oklch(40% 0.20 290);  /* violet-700 */
    --diag-tdah:     oklch(40% 0.15 250);  /* blue-700 */
    --diag-ansi:     oklch(45% 0.15 60);   /* amber-700 */
    --diag-atraso:   oklch(40% 0.14 155);  /* emerald-700 */

    /* Tipografia */
    --font-sans: "Plus Jakarta Sans Variable", system-ui, sans-serif;
    --font-mono: "Geist Mono", ui-monospace, monospace;

    /* Raio */
    --radius-sm:  0.375rem;
    --radius-md:  0.625rem;
    --radius-lg:  1rem;
    --radius-xl:  1.5rem;

    /* Sombras */
    --shadow-card:    0 0 0 1px oklch(0% 0 0 / 0.06), 0 4px 12px oklch(0% 0 0 / 0.08);
    --shadow-cta:     0 1px 0 inset oklch(100% 0 0 / 0.20), 0 4px 24px var(--brand-glow);
    --shadow-dialog:  0 0 0 1px oklch(0% 0 0 / 0.08), 0 24px 48px oklch(0% 0 0 / 0.20);
  }

  /* Dark mode — refinamento do tema atual */
  [data-theme="dark"] {
    --bg-base:     oklch(13% 0.01 250);
    --bg-card:     oklch(18% 0.01 250);
    --bg-tinted:   oklch(22% 0.01 240);

    --ink-primary:   oklch(96% 0.005 240);
    --ink-secondary: oklch(82% 0.01 240);
    --ink-muted:     oklch(58% 0.01 240);  /* subir de 30% para 42% de branco */

    --brand-primary: oklch(65% 0.13 195);
  }

  /* Tipografia base */
  body {
    background-color: var(--bg-base);
    color: var(--ink-primary);
    font-family: var(--font-sans);
    font-size: 1.0625rem;    /* 17px */
    line-height: 1.65;
    -webkit-font-smoothing: antialiased;
  }

  /* Foco visível universal */
  *:focus-visible {
    outline: 2px solid var(--brand-primary);
    outline-offset: 2px;
    border-radius: var(--radius-sm);
  }

  /* Skip-to-content */
  .skip-link {
    position: absolute;
    top: -100%;
    left: 1rem;
    z-index: 9999;
    padding: 0.5rem 1rem;
    background: var(--brand-primary);
    color: white;
    border-radius: var(--radius-md);
    font-weight: 700;
    text-decoration: none;
  }
  .skip-link:focus {
    top: 1rem;
  }
}

/* ── Animações — respeitar prefers-reduced-motion ── */
@layer utilities {
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }
}
```

### 1A.2 — Configurar shadcn/ui com tema healthcare

```bash
cd ~/Documents/DEV/manalista
npx shadcn@latest init
# Escolher: New York style · CSS variables · src/ dir
```

**Editar `src/components/ui/globals.css` gerado pelo shadcn** para usar os tokens acima:
- Mapear `--primary` → `var(--brand-primary)`
- Mapear `--background` → `var(--bg-base)`
- Mapear `--foreground` → `var(--ink-primary)`
- Mapear `--card` → `var(--bg-card)`
- Mapear `--muted-foreground` → `var(--ink-muted)`
- Mapear `--radius` → `var(--radius-md)`

**Instalar componentes base:**
```bash
npx shadcn@latest add button card dialog sheet form toast avatar progress tooltip badge tabs
```

### 1A.3 — Customizar variantes dos componentes principais

**Button (`src/components/ui/button.tsx`):**
```typescript
// Adicionar variant="primary" com brand-primary e shadow-cta
// Adicionar variant="quiet" (ghost minimalista)
// Touch target mínimo: min-h-[48px] no mobile
```

**Card com Double-Bezel:**
```typescript
// src/components/ui/card-bezel.tsx
// Card externo com padding 4-6px + radius xl
// Card interno com bg-card + radius lg
// Sombra shadow-card
```

### 1A.4 — Documentar tokens em arquivo de referência

```typescript
// src/lib/tokens.ts
// Exportar todos os tokens como constantes TS
// Útil para uso em Framer Motion e componentes não-CSS
export const tokens = {
  colors: {
    brandPrimary: "oklch(58% 0.13 195)",
    // ...
  },
  animation: {
    stagger: 80, // ms entre cards
    duration: 240, // ms padrão
  },
} as const;
```

### 1A.5 — Modo claro como default

**O tema atual é dark hard-coded** no `layout.tsx`. Mudar para light-first com toggle:

```typescript
// src/app/layout.tsx
// Remover className="dark" do <html>
// Adicionar data-theme="" por default (= light)
// Toggle vai setar data-theme="dark" via localStorage

// src/hooks/useTheme.ts — já existe, verificar e adaptar
// Garantir que o hook lê de localStorage e aplica data-theme no <html>
```

---

## VERIFICAÇÕES FINAIS

```bash
cd ~/Documents/DEV/manalista
npm run check    # 0 erros TypeScript
npm run lint     # 0 warnings críticos
npm run build    # build funciona

# Visual: abrir localhost:3000 e verificar
# - Modo claro como default
# - Tokens OKLCH aplicados
# - shadcn components renderizando
# - Foco visível em Tab
# - prefers-reduced-motion respeitado
```

**Lighthouse no localhost:**
```bash
npx lighthouse http://localhost:3000 --only-categories=accessibility --view
# Alvo: 100 em Accessibility
```

---

## COMMITS SEQUENCIAIS

```
feat(ui): migrar para Tailwind v4 com tokens OKLCH healthcare
feat(ui): configurar shadcn/ui com tema healthcare-first
feat(ui): adicionar Card Double-Bezel e variantes de Button
chore(ui): light mode como default com toggle dark/light
```

---

## REPORTAR AO ORQUESTRADOR

- [ ] Tailwind v4 instalado e build passa
- [ ] Tokens OKLCH definidos e documentados
- [ ] shadcn/ui configurado (button, card, dialog, sheet, form, toast, avatar, progress, tooltip, badge, tabs)
- [ ] Modo claro como default
- [ ] prefers-reduced-motion respeitado globalmente
- [ ] Lighthouse Accessibility: 100
- [ ] Nenhum CSS inline novo introduzido (reduzir CSS inline existente progressivamente)
