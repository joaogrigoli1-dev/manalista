"use client";
import { useState } from "react";
import type { ChildData, Lang } from "@/types";

const EMPTY: ChildData = {
  name: "", birthdate: "", ageYears: 0, ageMonths: 0, sex: "M",
  mainComplaints: "", complaintDuration: "",
  gestationalAge: "", birthComplications: "", motorMilestones: "",
  languageMilestones: "", socialMilestones: "",
  behaviorHome: "", behaviorSchool: "", sleepPattern: "", feedingPattern: "",
  familyHistory: "", previousDiagnoses: "", currentMedications: "", therapiesInProgress: "",
  familyStructure: "", parentingChallenges: "",
};

function calcAge(birthdate: string) {
  if (!birthdate) return { years: 0, months: 0 };
  const diff = Date.now() - new Date(birthdate).getTime();
  const total = Math.floor(diff / (1000 * 60 * 60 * 24 * 30.44));
  return { years: Math.floor(total / 12), months: total % 12 };
}

interface ChildFormProps { lang: Lang; onSubmit: (data: ChildData) => void; }

export function ChildForm({ lang, onSubmit }: ChildFormProps) {
  const [data, setData] = useState<ChildData>(EMPTY);
  const [showErrors, setShowErrors] = useState(false);
  const pt = lang === "pt";

  function set(k: keyof ChildData, v: string) {
    setData((prev) => {
      const next = { ...prev, [k]: v };
      if (k === "birthdate") {
        const { years, months } = calcAge(v);
        next.ageYears = years; next.ageMonths = months;
      }
      return next;
    });
    setShowErrors(false);
  }

  const MIN_CHARS = 1000;
  const charCount = data.mainComplaints.trim().length;
  const charPct = Math.min(100, Math.round((charCount / MIN_CHARS) * 100));
  const hasEnoughChars = charCount >= MIN_CHARS;

  function handleSubmit() {
    if (!data.name.trim() || !data.birthdate || !data.mainComplaints.trim() || !hasEnoughChars) {
      setShowErrors(true);
      return;
    }
    onSubmit(data);
  }

  const labelStyle = {
    display: "block" as const,
    fontSize: "0.72rem",
    fontWeight: 700,
    color: "var(--text-muted)",
    textTransform: "uppercase" as const,
    letterSpacing: "0.1em",
    marginBottom: "0.4rem",
  };

  const errorStyle = {
    fontSize: "0.72rem",
    color: "#E5725C",
    marginTop: "0.3rem",
  };

  return (
    <div style={{ maxWidth: 640, margin: "0 auto" }}>
      <div className="card" style={{ padding: "0.375rem" }}>
        <div style={{
          borderRadius: "calc(var(--radius-card) - 0.375rem)",
          padding: "1.75rem",
          background: "var(--bg-card)",
          boxShadow: "inset 0 1px 1px rgba(255,255,255,0.06)",
        }}>
          {/* Header */}
          <div style={{ paddingLeft: "0.85rem", marginBottom: "1.75rem", borderLeft: "3px solid var(--accent-brand)" }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)" }}>
              {pt ? "Fale sobre a criança" : "Tell us about the child"}
            </h3>
            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
              {pt
                ? "Preencha os dados básicos e escreva livremente tudo que achar importante."
                : "Fill in the basic info and write freely about anything you consider important."}
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

            {/* Name */}
            <div>
              <label style={labelStyle}>{pt ? "Nome da criança *" : "Child's name *"}</label>
              <input
                value={data.name}
                onChange={e => set("name", e.target.value)}
                placeholder={pt ? "Nome completo" : "Full name"}
                style={{ borderColor: showErrors && !data.name.trim() ? "#E5725C" : undefined }}
              />
              {showErrors && !data.name.trim() && (
                <p style={errorStyle}>{pt ? "⚠ Nome é obrigatório" : "⚠ Name is required"}</p>
              )}
            </div>

            {/* Birthdate + Sex */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div>
                <label style={labelStyle}>{pt ? "Data de nascimento *" : "Date of birth *"}</label>
                <input
                  type="date"
                  value={data.birthdate}
                  onChange={e => set("birthdate", e.target.value)}
                  style={{ borderColor: showErrors && !data.birthdate ? "#E5725C" : undefined }}
                />
                {data.ageYears > 0 && (
                  <p style={{ fontSize: "0.72rem", color: "var(--accent-brand)", marginTop: "0.3rem", fontWeight: 600 }}>
                    ✓ {data.ageYears}a {data.ageMonths}m
                  </p>
                )}
                {showErrors && !data.birthdate && (
                  <p style={errorStyle}>{pt ? "⚠ Data obrigatória" : "⚠ Date is required"}</p>
                )}
              </div>
              <div>
                <label style={labelStyle}>{pt ? "Sexo biológico" : "Biological sex"}</label>
                <select value={data.sex} onChange={e => set("sex", e.target.value as "M" | "F" | "outro")}>
                  <option value="M">{pt ? "Masculino" : "Male"}</option>
                  <option value="F">{pt ? "Feminino" : "Female"}</option>
                  <option value="outro">{pt ? "Outro / Não informado" : "Other / Not informed"}</option>
                </select>
              </div>
            </div>

            {/* Free text — single big box */}
            <div>
              <label style={labelStyle}>
                {pt ? "Conte tudo sobre seu filho *" : "Tell us everything about your child *"}
              </label>
              <p style={{ fontSize: "0.76rem", color: "var(--text-muted)", marginBottom: "0.6rem", lineHeight: 1.5 }}>
                {pt
                  ? "Escreva à vontade: queixas, comportamentos em casa e na escola, desenvolvimento, sono, alimentação, histórico familiar, medicações, terapias — tudo que considerar relevante."
                  : "Write freely: complaints, behavior at home and school, development, sleep, feeding, family history, medications, therapies — anything you consider relevant."}
              </p>
              <textarea
                rows={12}
                value={data.mainComplaints}
                onChange={e => set("mainComplaints", e.target.value)}
                placeholder={
                  pt
                    ? "Ex: Meu filho tem 7 anos e apresenta dificuldade de atenção na escola. Em casa é muito agitado, dorme mal e tem birras frequentes. Nasceu de parto normal com 38 semanas. Começou a falar com 2 anos. Já faz acompanhamento com psicólogo há 6 meses..."
                    : "E.g.: My son is 7 years old and has attention difficulties at school. At home he is very restless, sleeps poorly and has frequent tantrums. He was born naturally at 38 weeks. Started talking at age 2. Has been seeing a psychologist for 6 months..."
                }
                style={{
                  borderColor: showErrors && !data.mainComplaints.trim() ? "#E5725C" : undefined,
                  resize: "vertical",
                  minHeight: "200px",
                }}
              />
              {/* Character counter bar */}
              <div style={{ marginTop: "0.5rem" }}>
                <div style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  marginBottom: "0.3rem",
                }}>
                  <span style={{
                    fontSize: "0.68rem", fontWeight: 600,
                    color: hasEnoughChars ? "#10B981" : "var(--text-muted)",
                    transition: "color 0.3s ease",
                  }}>
                    {hasEnoughChars
                      ? (pt ? "✓ Informações suficientes" : "✓ Enough information")
                      : (pt ? `Mínimo ${MIN_CHARS} caracteres` : `Minimum ${MIN_CHARS} characters`)}
                  </span>
                  <span style={{
                    fontSize: "0.68rem", fontWeight: 700,
                    fontVariantNumeric: "tabular-nums",
                    color: hasEnoughChars ? "#10B981" : charCount > 0 ? "var(--accent-brand)" : "var(--text-muted)",
                    transition: "color 0.3s ease",
                  }}>
                    {charCount}/{MIN_CHARS}
                  </span>
                </div>
                <div style={{
                  height: 4, borderRadius: 99, overflow: "hidden",
                  background: "var(--border-subtle)",
                }}>
                  <div style={{
                    height: "100%", borderRadius: 99,
                    width: `${charPct}%`,
                    background: hasEnoughChars
                      ? "#10B981"
                      : charPct > 50
                        ? "var(--accent-brand)"
                        : "rgba(245,158,11,0.7)",
                    transition: "width 0.4s cubic-bezier(0.32,0.72,0,1), background 0.4s ease",
                  }} />
                </div>
              </div>
              {showErrors && !data.mainComplaints.trim() && (
                <p style={errorStyle}>
                  {pt ? "⚠ Por favor, descreva a situação da criança" : "⚠ Please describe the child's situation"}
                </p>
              )}
              {showErrors && data.mainComplaints.trim() && !hasEnoughChars && (
                <p style={errorStyle}>
                  {pt
                    ? `⚠ Descreva com mais detalhes — faltam ${MIN_CHARS - charCount} caracteres para uma análise segura`
                    : `⚠ Please provide more detail — ${MIN_CHARS - charCount} more characters needed for a safe analysis`}
                </p>
              )}
            </div>

          </div>

          {/* Submit button */}
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1.75rem" }}>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!hasEnoughChars}
              style={{
                padding: "0.75rem 2rem",
                borderRadius: "9999px",
                border: "none",
                background: hasEnoughChars ? "var(--accent-brand)" : "var(--border-subtle)",
                color: hasEnoughChars ? "#fff" : "var(--text-muted)",
                fontFamily: "inherit",
                fontWeight: 700,
                fontSize: "0.95rem",
                cursor: hasEnoughChars ? "pointer" : "not-allowed",
                boxShadow: hasEnoughChars ? "var(--shadow-button)" : "none",
                transition: "all 0.5s cubic-bezier(0.32,0.72,0,1)",
                opacity: hasEnoughChars ? 1 : 0.6,
              }}
            >
              {hasEnoughChars
                ? (pt ? "Enviar para Análise →" : "Submit for Analysis →")
                : (pt ? `Mais ${MIN_CHARS - charCount} caracteres...` : `${MIN_CHARS - charCount} more chars...`)}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
