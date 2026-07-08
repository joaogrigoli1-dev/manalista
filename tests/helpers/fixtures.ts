import { NextRequest } from "next/server";

/**
 * Fixtures compartilhadas entre os testes de rotas de API. Mantidas em
 * sincronia manualmente com os schemas zod de src/app/api/analise/route.ts —
 * se os campos obrigatórios de `ChildDataSchema`/`BodySchema` mudarem lá,
 * ajuste aqui também.
 */

export const USER_A_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
export const USER_B_ID = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
export const RUN_ID = "11111111-1111-4111-8111-111111111111";
export const OTHER_RUN_ID = "22222222-2222-4222-8222-222222222222";
export const ANALYSIS_ID = "33333333-3333-4333-8333-333333333333";

export function sessionFor(userId: string) {
  return {
    user: { id: userId, email: `${userId}@example.com` },
    expires: new Date(Date.now() + 3_600_000).toISOString(),
  };
}

export const validChildData = {
  name: "Criança Teste",
  birthdate: "2020-01-01",
  ageYears: 5,
  ageMonths: 60,
  sex: "M" as const,
  mainComplaints: "Atraso de linguagem",
  complaintDuration: "6 meses",
  gestationalAge: "39 semanas",
  birthComplications: "Nenhuma",
  motorMilestones: "Dentro do esperado",
  languageMilestones: "Atrasado",
  socialMilestones: "Dentro do esperado",
  behaviorHome: "Calmo",
  behaviorSchool: "Calmo",
  sleepPattern: "Regular",
  feedingPattern: "Regular",
  familyHistory: "Nenhum relevante",
  previousDiagnoses: "Nenhum",
  currentMedications: "Nenhuma",
  therapiesInProgress: "Nenhuma",
  familyStructure: "Nuclear",
  parentingChallenges: "Nenhum relevante",
};

export const validAnaliseBody = {
  agentId: "psi-infantil" as const,
  childData: validChildData,
  lang: "pt" as const,
  task: "analyze" as const,
};

export function analiseRequest(opts: {
  body?: unknown;
  headers?: Record<string, string>;
} = {}) {
  const headers = new Headers({
    "content-type": "application/json",
    "Idempotency-Key": RUN_ID,
    ...opts.headers,
  });
  return new NextRequest("http://localhost/api/analise", {
    method: "POST",
    headers,
    body: JSON.stringify(opts.body ?? validAnaliseBody),
  });
}

export function jsonRequest(url: string, body: unknown, headers: Record<string, string> = {}) {
  return new NextRequest(url, {
    method: "POST",
    headers: new Headers({ "content-type": "application/json", ...headers }),
    body: JSON.stringify(body),
  });
}
