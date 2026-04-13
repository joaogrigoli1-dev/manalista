"use client";
import { useState } from "react";
import type { ChildData, Lang } from "@/types";

// ── Helpers ────────────────────────────────────────────────────────────────
function calcAge(birthdate: string) {
  if (!birthdate) return { years: 0, months: 0 };
  const diff = Date.now() - new Date(birthdate).getTime();
  const total = Math.floor(diff / (1000 * 60 * 60 * 24 * 30.44));
  return { years: Math.floor(total / 12), months: total % 12 };
}

// ── Data ───────────────────────────────────────────────────────────────────
const CONCERNS = [
  { id: "attention",    pt: "Dificuldade de atenção / concentração",          en: "Attention / concentration difficulty" },
  { id: "hyperactivity",pt: "Hiperatividade ou agitação excessiva",           en: "Hyperactivity or excessive agitation" },
  { id: "impulsivity",  pt: "Impulsividade / age sem pensar",                  en: "Impulsivity / acts without thinking" },
  { id: "repetitive",  pt: "Comportamentos repetitivos ou estereotipias",     en: "Repetitive behaviors or stereotypies" },
  { id: "speech",       pt: "Atraso ou dificuldade na fala / linguagem",       en: "Speech or language delay / difficulty" },
  { id: "social",       pt: "Dificuldade de interação social ou contato visual",en: "Social interaction or eye contact difficulty" },
  { id: "tantrums",     pt: "Birras intensas ou difíceis de controlar",        en: "Intense or hard-to-manage tantrums" },
  { id: "anxiety",      pt: "Ansiedade, medos excessivos ou fobias",           en: "Anxiety, excessive fears or phobias" },
  { id: "learning",     pt: "Dificuldade no aprendizado escolar",              en: "School learning difficulty" },
  { id: "aggression",   pt: "Agressividade (com pessoas ou objetos)",          en: "Aggression (with people or objects)" },
  { id: "sleep",        pt: "Problemas de sono",                               en: "Sleep problems" },
  { id: "feeding",      pt: "Seletividade alimentar extrema",                  en: "Extreme food selectivity" },
  { id: "sensory",      pt: "Sensibilidade sensorial (sons, luz, texturas)",   en: "Sensory sensitivity (sounds, light, textures)" },
  { id: "regression",   pt: "Regressão de habilidades já adquiridas",          en: "Regression of previously acquired skills" },
];

const WALKED = [
  { id: "before12",  pt: "Antes dos 12 meses",   en: "Before 12 months" },
  { id: "12to15",    pt: "12 a 15 meses",         en: "12 to 15 months" },
  { id: "15to18",    pt: "15 a 18 meses",         en: "15 to 18 months" },
  { id: "after18",   pt: "Após 18 meses",         en: "After 18 months" },
  { id: "unknown",   pt: "Não sei / Não lembro",  en: "Don't know / Don't remember" },
];
const FIRST_WORDS = [
  { id: "before12",  pt: "Antes dos 12 meses",   en: "Before 12 months" },
  { id: "12to18",    pt: "12 a 18 meses",         en: "12 to 18 months" },
  { id: "after18",   pt: "Após 18 meses",         en: "After 18 months" },
  { id: "unknown",   pt: "Não sei / Não lembro",  en: "Don't know / Don't remember" },
];
const FIRST_SENTENCES = [
  { id: "before24",  pt: "Antes dos 24 meses",   en: "Before 24 months" },
  { id: "24to36",    pt: "24 a 36 meses",         en: "24 to 36 months" },
  { id: "after36",   pt: "Após 36 meses",         en: "After 36 months" },
  { id: "unknown",   pt: "Não sei / Não lembro",  en: "Don't know / Don't remember" },
];
const EYE_CONTACT = [
  { id: "normal",    pt: "Normal — olha nos olhos com frequência",  en: "Normal — makes eye contact frequently" },
  { id: "reduced",   pt: "Reduzido — pouco contato visual",          en: "Reduced — little eye contact" },
  { id: "minimal",   pt: "Mínimo — quase não olha nos olhos",        en: "Minimal — rarely makes eye contact" },
  { id: "unknown",   pt: "Não sei",                                   en: "Don't know" },
];
const GESTATION = [
  { id: "extreme_pre",  pt: "Muito prematuro (< 28 sem)",     en: "Very premature (< 28 wks)" },
  { id: "pre",          pt: "Prematuro (28–36 sem)",           en: "Premature (28–36 wks)" },
  { id: "term",         pt: "A termo (37–41 sem)",             en: "Full term (37–41 wks)" },
  { id: "post",         pt: "Pós-termo (≥ 42 sem)",           en: "Post-term (≥ 42 wks)" },
  { id: "unknown",      pt: "Não sei",                          en: "Don't know" },
];
const SCHOOL_BEHAVIOR = [
  { id: "teacher_concern",   pt: "Professores já relataram preocupações",         en: "Teachers have expressed concerns" },
  { id: "peer_difficulty",   pt: "Dificuldade de relacionamento com colegas",     en: "Difficulty relating to peers" },
  { id: "school_refusal",    pt: "Recusa ir para a escola / ansiedade escolar",   en: "School refusal / school anxiety" },
  { id: "discipline",        pt: "Problemas disciplinares frequentes",            en: "Frequent disciplinary issues" },
  { id: "underperforming",   pt: "Rendimento escolar abaixo do esperado",         en: "Academic performance below expected" },
  { id: "not_enrolled",      pt: "Não está em idade escolar / não vai à escola",  en: "Not school-age / not in school" },
];
const HOME_BEHAVIOR = [
  { id: "rules",       pt: "Grande dificuldade em seguir regras",      en: "Great difficulty following rules" },
  { id: "calm",        pt: "Muito difícil de acalmar quando frustrado", en: "Very hard to calm when frustrated" },
  { id: "routine",     pt: "Rotinas muito rígidas / resistência a mudanças", en: "Very rigid routines / resistance to change" },
  { id: "self_harm",   pt: "Comportamentos autolesivos",                en: "Self-injurious behaviors" },
  { id: "meltdown",    pt: "Crises intensas / 'apagões' de comportamento",  en: "Intense meltdowns / behavioral shutdowns" },
];
const FAMILY_HISTORY = [
  { id: "adhd",        pt: "TDAH na família",                           en: "ADHD in family" },
  { id: "asd",         pt: "TEA (autismo) na família",                  en: "ASD (autism) in family" },
  { id: "anxiety_dep", pt: "Ansiedade ou depressão na família",         en: "Anxiety or depression in family" },
  { id: "learning",    pt: "Dificuldades de aprendizagem na família",   en: "Learning difficulties in family" },
  { id: "bipolar",     pt: "Transtorno bipolar ou psicose na família",  en: "Bipolar disorder or psychosis in family" },
  { id: "none",        pt: "Nenhum histórico conhecido",                 en: "No known history" },
];
const DIAGNOSES = [
  { id: "adhd",        pt: "TDAH",                    en: "ADHD" },
  { id: "asd",         pt: "TEA / Autismo",           en: "ASD / Autism" },
  { id: "anxiety",     pt: "Ansiedade",               en: "Anxiety" },
  { id: "depression",  pt: "Depressão",               en: "Depression" },
  { id: "dcd",         pt: "Transtorno do Desenvolvimento da Coordenação", en: "Developmental Coordination Disorder" },
  { id: "dyslexia",    pt: "Dislexia ou dificuldade de leitura",  en: "Dyslexia or reading difficulty" },
  { id: "none",        pt: "Sem diagnóstico anterior", en: "No previous diagnosis" },
];
const THERAPIES = [
  { id: "psychologist",  pt: "Psicólogo(a)",             en: "Psychologist" },
  { id: "speech",        pt: "Fonoaudiólogo(a)",          en: "Speech therapist" },
  { id: "ot",            pt: "Terapeuta Ocupacional",     en: "Occupational therapist" },
  { id: "psychiatrist",  pt: "Psiquiatra infantil",       en: "Child psychiatrist" },
  { id: "neuropediatric",pt: "Neuropediatra",             en: "Neuropediatrician" },
  { id: "aba",           pt: "ABA / Analista do Comportamento", en: "ABA / Behavior analyst" },
  { id: "none",          pt: "Sem acompanhamento",        en: "No current follow-up" },
];
const DURATION = [
  { id: "lt6",    pt: "Menos de 6 meses",        en: "Less than 6 months" },
  { id: "6to12",  pt: "6 a 12 meses",            en: "6 to 12 months" },
  { id: "1to2",   pt: "1 a 2 anos",              en: "1 to 2 years" },
  { id: "gt2",    pt: "Mais de 2 anos",           en: "More than 2 years" },
  { id: "always", pt: "Desde que nasceu / sempre", en: "Since birth / always" },
  { id: "unknown",pt: "Não sei precisar",         en: "Not sure" },
];

// ── Styles ────────────────────────────────────────────────────────────────
const S = {
  label: {
    display: "block" as const,
    fontSize: "0.7rem",
    fontWeight: 700,
    color: "var(--text-muted)",
    textTransform: "uppercase" as const,
    letterSpacing: "0.1em",
    marginBottom: "0.4rem",
  },
  error: { fontSize: "0.72rem", color: "#E5725C", marginTop: "0.3rem" },
  sectionTitle: {
    fontSize: "0.72rem",
    fontWeight: 700,
    color: "var(--text-muted)",
    textTransform: "uppercase" as const,
    letterSpacing: "0.12em",
    marginBottom: "0.75rem",
    paddingBottom: "0.4rem",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
  },
};

// ── Checkbox item ─────────────────────────────────────────────────────────
function CheckItem({ label, checked, onChange, color = "var(--accent-brand)" }: {
  label: string; checked: boolean; onChange: () => void; color?: string;
}) {
  return (
    <label style={{
      display: "flex", alignItems: "flex-start", gap: "0.55rem",
      cursor: "pointer", padding: "0.5rem 0.6rem", borderRadius: "0.6rem",
      background: checked ? `${color}10` : "transparent",
      border: `1px solid ${checked ? `${color}40` : "rgba(255,255,255,0.04)"}`,
      transition: "all 0.2s ease",
    }}>
      <div style={{
        width: 16, height: 16, borderRadius: 4, flexShrink: 0, marginTop: 2,
        border: `2px solid ${checked ? color : "rgba(255,255,255,0.2)"}`,
        background: checked ? color : "transparent",
        display: "flex", alignItems: "center", justifyContent: "center",
        transition: "all 0.15s ease",
      }}>
        {checked && <span style={{ color: "#fff", fontSize: "0.6rem", fontWeight: 900, lineHeight: 1 }}>✓</span>}
      </div>
      <input type="checkbox" checked={checked} onChange={onChange} style={{ display: "none" }} />
      <span style={{ fontSize: "0.82rem", color: checked ? "var(--text-primary)" : "var(--text-secondary)", lineHeight: 1.4, transition: "color 0.2s" }}>
        {label}
      </span>
    </label>
  );
}

// ── Radio item ─────────────────────────────────────────────────────────────
function RadioItem({ label, selected, onChange, color = "var(--accent-brand)" }: {
  label: string; selected: boolean; onChange: () => void; color?: string;
}) {
  return (
    <label style={{
      display: "flex", alignItems: "center", gap: "0.55rem",
      cursor: "pointer", padding: "0.45rem 0.6rem", borderRadius: "0.6rem",
      background: selected ? `${color}12` : "transparent",
      border: `1px solid ${selected ? `${color}45` : "rgba(255,255,255,0.04)"}`,
      transition: "all 0.2s ease",
    }}>
      <div style={{
        width: 16, height: 16, borderRadius: "50%", flexShrink: 0,
        border: `2px solid ${selected ? color : "rgba(255,255,255,0.2)"}`,
        background: "transparent",
        display: "flex", alignItems: "center", justifyContent: "center",
        transition: "all 0.15s ease",
      }}>
        {selected && <div style={{ width: 7, height: 7, borderRadius: "50%", background: color }} />}
      </div>
      <input type="radio" checked={selected} onChange={onChange} style={{ display: "none" }} />
      <span style={{ fontSize: "0.82rem", color: selected ? "var(--text-primary)" : "var(--text-secondary)", lineHeight: 1.3, transition: "color 0.2s" }}>
        {label}
      </span>
    </label>
  );
}

// ── Step indicator ─────────────────────────────────────────────────────────
function StepBar({ step, total, pt }: { step: number; total: number; pt: boolean }) {
  const labels = pt
    ? ["Identificação", "Desenvolvimento", "Histórico"]
    : ["Identification", "Development", "History"];
  return (
    <div style={{ display: "flex", gap: "0.35rem", marginBottom: "1.75rem", alignItems: "center" }}>
      {Array.from({ length: total }, (_, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.35rem", flex: i < total - 1 ? 1 : undefined }}>
          <div style={{
            display: "flex", alignItems: "center", gap: "0.35rem",
            opacity: i <= step ? 1 : 0.35,
          }}>
            <div style={{
              width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
              background: i < step ? "#10B981" : i === step ? "var(--accent-brand)" : "rgba(255,255,255,0.08)",
              border: `2px solid ${i < step ? "#10B981" : i === step ? "var(--accent-brand)" : "rgba(255,255,255,0.12)"}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "0.62rem", fontWeight: 800, color: "#fff",
              transition: "all 0.3s ease",
            }}>
              {i < step ? "✓" : i + 1}
            </div>
            <span style={{ fontSize: "0.65rem", fontWeight: 600, color: i === step ? "var(--text-primary)" : "var(--text-muted)", whiteSpace: "nowrap" }}>
              {labels[i]}
            </span>
          </div>
          {i < total - 1 && (
            <div style={{ flex: 1, height: 1, background: i < step ? "#10B981" : "rgba(255,255,255,0.08)", transition: "background 0.3s ease" }} />
          )}
        </div>
      ))}
    </div>
  );
}

// ── Internal form state ────────────────────────────────────────────────────
interface FormState {
  // Step 1
  name: string;
  birthdate: string;
  sex: "M" | "F" | "outro";
  concerns: string[];
  complaintDuration: string;
  // Step 2
  walked: string;
  firstWords: string;
  firstSentences: string;
  eyeContact: string;
  gestation: string;
  birthComplication: string;
  schoolBehavior: string[];
  homeBehavior: string[];
  familyHistory: string[];
  // Step 3
  previousDiagnoses: string[];
  diagnosisOther: string;
  therapies: string[];
  useMedication: string;
  medicationName: string;
  freeText: string;
}

const EMPTY_STATE: FormState = {
  name: "", birthdate: "", sex: "M",
  concerns: [], complaintDuration: "",
  walked: "", firstWords: "", firstSentences: "", eyeContact: "",
  gestation: "", birthComplication: "",
  schoolBehavior: [], homeBehavior: [], familyHistory: [],
  previousDiagnoses: [], diagnosisOther: "",
  therapies: [], useMedication: "", medicationName: "", freeText: "",
};

// ── Serialize form state to ChildData ──────────────────────────────────────
function serialize(f: FormState): ChildData {
  const { years, months } = calcAge(f.birthdate);

  const concernLabels = CONCERNS.filter(c => f.concerns.includes(c.id)).map(c => `• ${c.pt}`).join("\n");
  const durationLabel = DURATION.find(d => d.id === f.complaintDuration)?.pt ?? f.complaintDuration;

  const mainComplaints = [
    concernLabels ? `PREOCUPAÇÕES IDENTIFICADAS:\n${concernLabels}` : "",
    durationLabel ? `Tempo de duração: ${durationLabel}` : "",
    f.freeText.trim() ? `\nOBSERVAÇÕES ADICIONAIS:\n${f.freeText.trim()}` : "",
  ].filter(Boolean).join("\n\n");

  const motorMilestones = [
    f.walked ? `Andou sozinho: ${WALKED.find(w => w.id === f.walked)?.pt ?? f.walked}` : "",
  ].filter(Boolean).join(". ");

  const languageMilestones = [
    f.firstWords ? `Primeiras palavras: ${FIRST_WORDS.find(w => w.id === f.firstWords)?.pt ?? f.firstWords}` : "",
    f.firstSentences ? `Primeiras frases: ${FIRST_SENTENCES.find(w => w.id === f.firstSentences)?.pt ?? f.firstSentences}` : "",
  ].filter(Boolean).join(". ");

  const socialMilestones = f.eyeContact
    ? `Contato visual: ${EYE_CONTACT.find(e => e.id === f.eyeContact)?.pt ?? f.eyeContact}`
    : "";

  const gestAge = GESTATION.find(g => g.id === f.gestation)?.pt ?? f.gestation;

  const behaviorSchool = SCHOOL_BEHAVIOR.filter(s => f.schoolBehavior.includes(s.id)).map(s => `• ${s.pt}`).join("\n");
  const behaviorHome = HOME_BEHAVIOR.filter(s => f.homeBehavior.includes(s.id)).map(s => `• ${s.pt}`).join("\n");
  const familyHist = FAMILY_HISTORY.filter(s => f.familyHistory.includes(s.id)).map(s => `• ${s.pt}`).join("\n");

  const diagnoses = [
    ...DIAGNOSES.filter(d => f.previousDiagnoses.includes(d.id)).map(d => d.pt),
    f.diagnosisOther.trim(),
  ].filter(Boolean).join(", ");

  const therapiesList = THERAPIES.filter(t => f.therapies.includes(t.id)).map(t => t.pt).join(", ");
  const meds = f.useMedication === "yes"
    ? (f.medicationName.trim() ? f.medicationName.trim() : "Sim (medicação não especificada)")
    : f.useMedication === "no" ? "Nenhuma" : "";

  return {
    name: f.name,
    birthdate: f.birthdate,
    ageYears: years,
    ageMonths: months,
    sex: f.sex,
    mainComplaints,
    complaintDuration: durationLabel,
    gestationalAge: gestAge,
    birthComplications: f.birthComplication,
    motorMilestones,
    languageMilestones,
    socialMilestones,
    behaviorHome,
    behaviorSchool,
    sleepPattern: f.concerns.includes("sleep") ? "Relatado pelos pais como problema" : "",
    feedingPattern: f.concerns.includes("feeding") ? "Seletividade alimentar relatada" : "",
    familyHistory: familyHist,
    previousDiagnoses: diagnoses,
    currentMedications: meds,
    therapiesInProgress: therapiesList,
    familyStructure: "",
    parentingChallenges: "",
  };
}

// ── Card wrapper ───────────────────────────────────────────────────────────
function FormCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="card" style={{ padding: "0.375rem", marginBottom: "1rem" }}>
      <div style={{
        borderRadius: "calc(var(--radius-card) - 0.375rem)",
        padding: "1.5rem",
        background: "var(--bg-card)",
        boxShadow: "inset 0 1px 1px rgba(255,255,255,0.06)",
      }}>
        {children}
      </div>
    </div>
  );
}

interface ChildFormProps { lang: Lang; onSubmit: (data: ChildData) => void; }

// ── Main component ────────────────────────────────────────────────────────
export function ChildForm({ lang, onSubmit }: ChildFormProps) {
  const [form, setForm] = useState<FormState>(EMPTY_STATE);
  const [step, setStep] = useState(0);
  const [showErrors, setShowErrors] = useState(false);
  const pt = lang === "pt";

  const { years, months } = calcAge(form.birthdate);

  function toggle(field: "concerns" | "schoolBehavior" | "homeBehavior" | "familyHistory" | "previousDiagnoses" | "therapies", id: string) {
    setForm(prev => {
      const arr = prev[field] as string[];
      return { ...prev, [field]: arr.includes(id) ? arr.filter(x => x !== id) : [...arr, id] };
    });
  }

  // ── Validation per step ──
  function canAdvance() {
    if (step === 0) return !!form.name.trim() && !!form.birthdate && form.concerns.length >= 1;
    if (step === 1) return true; // all optional in step 2
    return true;
  }

  function handleNext() {
    if (!canAdvance()) { setShowErrors(true); return; }
    setShowErrors(false);
    setStep(s => s + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleSubmit() {
    setShowErrors(false);
    onSubmit(serialize(form));
  }

  // ── Shared input style ──
  const inputStyle = (err?: boolean): React.CSSProperties => ({
    borderColor: err ? "#E5725C" : undefined,
  });

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 0 — Identificação + Preocupações
  // ─────────────────────────────────────────────────────────────────────────
  const step0 = (
    <>
      <FormCard>
        <p style={S.sectionTitle}>{pt ? "Dados básicos" : "Basic information"}</p>
        <div style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
          {/* Name */}
          <div>
            <label style={S.label}>{pt ? "Nome da criança *" : "Child's name *"}</label>
            <input
              value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              placeholder={pt ? "Nome completo" : "Full name"}
              style={inputStyle(showErrors && !form.name.trim())}
            />
            {showErrors && !form.name.trim() && <p style={S.error}>⚠ {pt ? "Nome é obrigatório" : "Name is required"}</p>}
          </div>

          {/* Birthdate + Sex */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <label style={S.label}>{pt ? "Data de nascimento *" : "Date of birth *"}</label>
              <input
                type="date"
                value={form.birthdate}
                onChange={e => setForm(p => ({ ...p, birthdate: e.target.value }))}
                style={inputStyle(showErrors && !form.birthdate)}
              />
              {years > 0 && (
                <p style={{ fontSize: "0.72rem", color: "var(--accent-brand)", marginTop: "0.3rem", fontWeight: 600 }}>
                  ✓ {years}a {months}m
                </p>
              )}
              {showErrors && !form.birthdate && <p style={S.error}>⚠ {pt ? "Data obrigatória" : "Date required"}</p>}
            </div>
            <div>
              <label style={S.label}>{pt ? "Sexo biológico" : "Biological sex"}</label>
              <select value={form.sex} onChange={e => setForm(p => ({ ...p, sex: e.target.value as "M" | "F" | "outro" }))}>
                <option value="M">{pt ? "Masculino" : "Male"}</option>
                <option value="F">{pt ? "Feminino" : "Female"}</option>
                <option value="outro">{pt ? "Outro / Não informado" : "Other / Not informed"}</option>
              </select>
            </div>
          </div>
        </div>
      </FormCard>

      <FormCard>
        <p style={S.sectionTitle}>{pt ? "Principais preocupações *" : "Main concerns *"}</p>
        <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: "0.85rem", lineHeight: 1.5 }}>
          {pt ? "Marque todos que se aplicam ao comportamento da criança:" : "Mark all that apply to the child's behavior:"}
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.4rem" }}>
          {CONCERNS.map(c => (
            <CheckItem
              key={c.id}
              label={pt ? c.pt : c.en}
              checked={form.concerns.includes(c.id)}
              onChange={() => toggle("concerns", c.id)}
            />
          ))}
        </div>
        {showErrors && form.concerns.length === 0 && (
          <p style={{ ...S.error, marginTop: "0.5rem" }}>⚠ {pt ? "Selecione ao menos uma preocupação" : "Select at least one concern"}</p>
        )}
        {form.concerns.length > 0 && (
          <div style={{ marginTop: "1.1rem" }}>
            <label style={S.label}>{pt ? "Há quanto tempo essas preocupações existem?" : "How long have these concerns existed?"}</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.4rem" }}>
              {DURATION.map(d => (
                <RadioItem
                  key={d.id}
                  label={pt ? d.pt : d.en}
                  selected={form.complaintDuration === d.id}
                  onChange={() => setForm(p => ({ ...p, complaintDuration: d.id }))}
                />
              ))}
            </div>
          </div>
        )}
      </FormCard>
    </>
  );

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 1 — Desenvolvimento + Comportamento
  // ─────────────────────────────────────────────────────────────────────────
  const step1 = (
    <>
      <FormCard>
        <p style={S.sectionTitle}>{pt ? "Marcos do desenvolvimento" : "Development milestones"}</p>
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {/* Motor */}
          <div>
            <label style={{ ...S.label, color: "var(--accent-brand)" }}>{pt ? "Andou sozinho (sem apoio)" : "Walked independently (without support)"}</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.4rem" }}>
              {WALKED.map(w => (
                <RadioItem key={w.id} label={pt ? w.pt : w.en} selected={form.walked === w.id} onChange={() => setForm(p => ({ ...p, walked: w.id }))} />
              ))}
            </div>
          </div>
          {/* First words */}
          <div>
            <label style={{ ...S.label, color: "var(--accent-brand)" }}>{pt ? "Primeiras palavras com sentido" : "First meaningful words"}</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.4rem" }}>
              {FIRST_WORDS.map(w => (
                <RadioItem key={w.id} label={pt ? w.pt : w.en} selected={form.firstWords === w.id} onChange={() => setForm(p => ({ ...p, firstWords: w.id }))} />
              ))}
            </div>
          </div>
          {/* First sentences */}
          <div>
            <label style={{ ...S.label, color: "var(--accent-brand)" }}>{pt ? "Primeiras frases (2+ palavras)" : "First sentences (2+ words)"}</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.4rem" }}>
              {FIRST_SENTENCES.map(w => (
                <RadioItem key={w.id} label={pt ? w.pt : w.en} selected={form.firstSentences === w.id} onChange={() => setForm(p => ({ ...p, firstSentences: w.id }))} />
              ))}
            </div>
          </div>
          {/* Eye contact */}
          <div>
            <label style={{ ...S.label, color: "var(--accent-brand)" }}>{pt ? "Contato visual e interação" : "Eye contact and interaction"}</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.4rem" }}>
              {EYE_CONTACT.map(e => (
                <RadioItem key={e.id} label={pt ? e.pt : e.en} selected={form.eyeContact === e.id} onChange={() => setForm(p => ({ ...p, eyeContact: e.id }))} />
              ))}
            </div>
          </div>
          {/* Gestation */}
          <div>
            <label style={{ ...S.label, color: "var(--accent-brand)" }}>{pt ? "Nascimento" : "Birth"}</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.4rem" }}>
              {GESTATION.map(g => (
                <RadioItem key={g.id} label={pt ? g.pt : g.en} selected={form.gestation === g.id} onChange={() => setForm(p => ({ ...p, gestation: g.id }))} />
              ))}
            </div>
            {(form.gestation === "pre" || form.gestation === "extreme_pre") && (
              <div style={{ marginTop: "0.6rem" }}>
                <input
                  placeholder={pt ? "Complicações no nascimento (opcional)" : "Birth complications (optional)"}
                  value={form.birthComplication}
                  onChange={e => setForm(p => ({ ...p, birthComplication: e.target.value }))}
                />
              </div>
            )}
          </div>
        </div>
      </FormCard>

      <FormCard>
        <p style={S.sectionTitle}>{pt ? "Comportamento na escola" : "School behavior"}</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.4rem" }}>
          {SCHOOL_BEHAVIOR.map(s => (
            <CheckItem key={s.id} label={pt ? s.pt : s.en} checked={form.schoolBehavior.includes(s.id)} onChange={() => toggle("schoolBehavior", s.id)} />
          ))}
        </div>
      </FormCard>

      <FormCard>
        <p style={S.sectionTitle}>{pt ? "Comportamento em casa" : "Home behavior"}</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.4rem" }}>
          {HOME_BEHAVIOR.map(s => (
            <CheckItem key={s.id} label={pt ? s.pt : s.en} checked={form.homeBehavior.includes(s.id)} onChange={() => toggle("homeBehavior", s.id)} />
          ))}
        </div>
      </FormCard>

      <FormCard>
        <p style={S.sectionTitle}>{pt ? "Histórico familiar" : "Family history"}</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.4rem" }}>
          {FAMILY_HISTORY.map(f => (
            <CheckItem key={f.id} label={pt ? f.pt : f.en} checked={form.familyHistory.includes(f.id)} onChange={() => toggle("familyHistory", f.id)} />
          ))}
        </div>
      </FormCard>
    </>
  );

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 2 — Histórico clínico + Texto livre + Submit
  // ─────────────────────────────────────────────────────────────────────────
  const step2 = (
    <>
      <FormCard>
        <p style={S.sectionTitle}>{pt ? "Diagnósticos anteriores" : "Previous diagnoses"}</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.4rem" }}>
          {DIAGNOSES.map(d => (
            <CheckItem key={d.id} label={pt ? d.pt : d.en} checked={form.previousDiagnoses.includes(d.id)} onChange={() => toggle("previousDiagnoses", d.id)} />
          ))}
        </div>
        {!form.previousDiagnoses.includes("none") && (
          <div style={{ marginTop: "0.65rem" }}>
            <input
              placeholder={pt ? "Outro diagnóstico (opcional)" : "Other diagnosis (optional)"}
              value={form.diagnosisOther}
              onChange={e => setForm(p => ({ ...p, diagnosisOther: e.target.value }))}
            />
          </div>
        )}
      </FormCard>

      <FormCard>
        <p style={S.sectionTitle}>{pt ? "Acompanhamentos atuais" : "Current follow-ups"}</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.4rem" }}>
          {THERAPIES.map(t => (
            <CheckItem key={t.id} label={pt ? t.pt : t.en} checked={form.therapies.includes(t.id)} onChange={() => toggle("therapies", t.id)} />
          ))}
        </div>
      </FormCard>

      <FormCard>
        <p style={S.sectionTitle}>{pt ? "Medicação" : "Medication"}</p>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          {[
            { id: "no",  pt: "Não usa medicação", en: "Not on medication" },
            { id: "yes", pt: "Usa medicação", en: "On medication" },
          ].map(opt => (
            <RadioItem
              key={opt.id}
              label={pt ? opt.pt : opt.en}
              selected={form.useMedication === opt.id}
              onChange={() => setForm(p => ({ ...p, useMedication: opt.id }))}
            />
          ))}
        </div>
        {form.useMedication === "yes" && (
          <div style={{ marginTop: "0.65rem" }}>
            <input
              placeholder={pt ? "Qual medicação e dosagem?" : "Which medication and dosage?"}
              value={form.medicationName}
              onChange={e => setForm(p => ({ ...p, medicationName: e.target.value }))}
            />
          </div>
        )}
      </FormCard>

      <FormCard>
        <p style={S.sectionTitle}>{pt ? "Observações adicionais (opcional)" : "Additional notes (optional)"}</p>
        <p style={{ fontSize: "0.77rem", color: "var(--text-muted)", marginBottom: "0.65rem", lineHeight: 1.5 }}>
          {pt
            ? "Acrescente qualquer informação importante não contemplada acima: episódios marcantes, contexto familiar, escola, tratamentos tentados, etc."
            : "Add any important information not covered above: notable episodes, family context, school, treatments tried, etc."}
        </p>
        <textarea
          rows={5}
          value={form.freeText}
          onChange={e => setForm(p => ({ ...p, freeText: e.target.value }))}
          placeholder={pt ? "Escreva aqui... (opcional)" : "Write here... (optional)"}
          style={{ resize: "vertical" }}
        />
      </FormCard>
    </>
  );

  const steps = [step0, step1, step2];

  // ── Summary of what's been filled ──
  const filled = [
    form.concerns.length > 0 ? `${form.concerns.length} preocupações` : null,
    form.walked ? "Marcos motores" : null,
    form.previousDiagnoses.length > 0 ? "Diagnósticos" : null,
    form.therapies.length > 0 ? "Acompanhamentos" : null,
  ].filter(Boolean);

  return (
    <div style={{ maxWidth: 660, margin: "0 auto" }}>
      <StepBar step={step} total={3} pt={pt} />

      {steps[step]}

      {/* Navigation */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.5rem" }}>
        {step > 0 ? (
          <button
            type="button"
            onClick={() => { setStep(s => s - 1); window.scrollTo({ top: 0, behavior: "smooth" }); }}
            style={{
              padding: "0.65rem 1.4rem", borderRadius: "9999px",
              border: "1px solid rgba(255,255,255,0.1)",
              background: "transparent", color: "var(--text-secondary)",
              fontFamily: "inherit", fontWeight: 600, fontSize: "0.85rem", cursor: "pointer",
            }}
          >
            ← {pt ? "Anterior" : "Back"}
          </button>
        ) : <div />}

        {step < 2 ? (
          <button
            type="button"
            onClick={handleNext}
            style={{
              padding: "0.75rem 2rem", borderRadius: "9999px", border: "none",
              background: canAdvance() ? "var(--accent-brand)" : "var(--border-subtle)",
              color: canAdvance() ? "#fff" : "var(--text-muted)",
              fontFamily: "inherit", fontWeight: 700, fontSize: "0.95rem",
              cursor: canAdvance() ? "pointer" : "not-allowed",
              boxShadow: canAdvance() ? "var(--shadow-button)" : "none",
              transition: "all 0.3s ease",
              opacity: canAdvance() ? 1 : 0.7,
            }}
          >
            {pt ? "Continuar →" : "Continue →"}
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            style={{
              padding: "0.75rem 2.2rem", borderRadius: "9999px", border: "none",
              background: "var(--accent-brand)", color: "#fff",
              fontFamily: "inherit", fontWeight: 700, fontSize: "0.95rem",
              cursor: "pointer", boxShadow: "var(--shadow-button)", transition: "all 0.3s ease",
            }}
          >
            🔬 {pt ? "Iniciar Análise" : "Start Analysis"}
          </button>
        )}
      </div>

      {/* Progress summary */}
      {filled.length > 0 && step < 2 && (
        <p style={{ textAlign: "center", fontSize: "0.68rem", color: "var(--text-muted)", marginTop: "1rem" }}>
          ✓ {filled.join(" · ")}
        </p>
      )}
    </div>
  );
}
