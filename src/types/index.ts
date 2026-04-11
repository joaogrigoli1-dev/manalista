// ═══════════════════════════════════════════════════
//  MAnalista — Tipos Centrais
// ═══════════════════════════════════════════════════

export type AgentId =
  | "mediator"
  | "psi-infantil"
  | "psi-parentalidade"
  | "neuropsico"
  | "neuropediatra"
  | "bcba";

export type Theme = "dark" | "clinic" | "aurora";
export type Lang  = "pt" | "en";

export interface AgentProfile {
  id: AgentId;
  emoji: string;
  color: string;
  colorLight: string;
  namePt: string;
  nameEn: string;
  rolePt: string;
  roleEn: string;
  credentialsPt: string;
  credentialsEn: string;
  bioShortPt: string;
  bioShortEn: string;
  bioLongPt: string;
  bioLongEn: string;
  tools: string[];
  focusPt: string;
  focusEn: string;
  approachPt: string;
  approachEn: string;
  isMediator?: boolean;
}

export interface ChildData {
  // Dados Pessoais
  name: string;
  birthdate: string;
  ageYears: number;
  ageMonths: number;
  sex: "M" | "F" | "outro";
  // Queixas Principais
  mainComplaints: string;
  complaintDuration: string;
  // Desenvolvimento
  gestationalAge: string;
  birthComplications: string;
  motorMilestones: string;
  languageMilestones: string;
  socialMilestones: string;
  // Comportamento
  behaviorHome: string;
  behaviorSchool: string;
  sleepPattern: string;
  feedingPattern: string;
  // Histórico
  familyHistory: string;
  previousDiagnoses: string;
  currentMedications: string;
  therapiesInProgress: string;
  // Contexto Familiar
  familyStructure: string;
  parentingChallenges: string;
}

export interface DebateMessage {
  id: string;
  agentId: AgentId;
  content: string;
  timestamp: Date;
  type: "analysis" | "debate" | "question" | "response" | "consensus" | "summary";
  isStreaming?: boolean;
}

export interface AgentResponse {
  parentFriendlyText: string;
  technicalAnalysis: string;
  confidence: number;
  detectedPatterns: string[];
  recommendedSpecialist?: string;
  recommendedReason?: string;
  needsMoreInfo?: boolean;
  questions?: string[];
}

export interface AgentAnalysis {
  agentId: AgentId;
  hypothesis: string;
  confidence: "alta" | "moderada" | "baixa";
  indicators: string[];
  differentials: string[];
  isReady: boolean;
}

export interface DiagnosticSuggestion {
  primaryPathology: string;
  icd11Code: string;
  dsm5Code: string;
  confidence: "alta" | "moderada" | "baixa";
  supportingAgents: AgentId[];
  treatmentSuggestions: TreatmentSuggestion[];
  scientificRefs: ScientificRef[];
  disclaimer: string;
}

export interface TreatmentSuggestion {
  modality: string;
  description: string;
  evidenceLevel: "A" | "B" | "C";
  references: string[];
}

export interface ScientificRef {
  authors: string;
  title: string;
  journal: string;
  year: number;
  doi?: string;
}

export interface AnalysisSession {
  id: string;
  childData: ChildData;
  status: "intake" | "consent" | "analyzing" | "debating" | "consolidating" | "complete";
  agentAnalyses: Partial<Record<AgentId, AgentAnalysis>>;
  debateMessages: DebateMessage[];
  pendingQuestions: string[];
  diagnosticResult?: DiagnosticSuggestion[];
  createdAt: Date;
}
