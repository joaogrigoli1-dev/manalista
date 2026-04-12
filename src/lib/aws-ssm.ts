import { SSMClient, GetParameterCommand } from "@aws-sdk/client-ssm";

const SSM_PARAM_NAME = "/IA_Equipe_P/claude-api-key";

let cachedKey: string | null = null;
let cacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

export async function getClaudeApiKey(): Promise<string> {
  // 1. Cache em memória (evita chamadas repetidas ao SSM)
  if (cachedKey && Date.now() - cacheTime < CACHE_TTL) {
    return cachedKey;
  }

  // 2. Fallback para variável de ambiente local (dev sem AWS)
  if (process.env.ANTHROPIC_API_KEY) {
    return process.env.ANTHROPIC_API_KEY;
  }

  // 3. Busca no AWS SSM Parameter Store
  try {
    const client = new SSMClient({
      region: process.env.AWS_REGION ?? "us-east-1",
    });
    const cmd = new GetParameterCommand({
      Name: SSM_PARAM_NAME,
      WithDecryption: true,
    });
    const response = await client.send(cmd);
    const value = response.Parameter?.Value;
    if (!value) throw new Error("SSM parameter empty");
    cachedKey = value;
    cacheTime = Date.now();
    return value;
  } catch (err) {
    console.error("[SSM] Erro ao buscar API key:", err);
    throw new Error(
      "Não foi possível carregar a chave da API. " +
      "Configure AWS_REGION + credentials ou defina ANTHROPIC_API_KEY."
    );
  }
}
