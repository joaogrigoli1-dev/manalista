"use client";
import { useState, useEffect, useCallback } from "react";
import { db, type SavedAnalysis } from "@/lib/db";
import { v4 as uuid } from "uuid";
import type { ChildData, DiagnosticSuggestion, DebateMessage } from "@/types";

export interface SaveAnalysisParams {
  childName: string;
  childAge: string;
  lang: "pt" | "en";
  qualityScore: number;
  detectedPathologies: string[];
  childData: ChildData;
  results: DiagnosticSuggestion[];
  debateMessages: DebateMessage[];
}

export function useAnalysisStore() {
  const [analyses, setAnalyses] = useState<SavedAnalysis[]>([]);
  const [loading, setLoading] = useState(false);

  // Carregar lista de análises salvas
  const loadAnalyses = useCallback(async () => {
    setLoading(true);
    try {
      const saved = await db.analyses
        .orderBy("createdAt")
        .reverse()
        .limit(50)
        .toArray();
      setAnalyses(saved);
    } catch (err) {
      console.error("[useAnalysisStore] loadAnalyses:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAnalyses();
  }, [loadAnalyses]);

  // Salvar análise completa
  const saveAnalysis = useCallback(
    async (params: SaveAnalysisParams): Promise<number> => {
      const id = await db.analyses.add({
        uuid: uuid(),
        createdAt: new Date(),
        childName: params.childName,
        childAge: params.childAge,
        lang: params.lang,
        qualityScore: params.qualityScore,
        detectedPathologies: params.detectedPathologies,
        childDataJson: JSON.stringify(params.childData),
        resultsJson: JSON.stringify(params.results),
        debateMessagesJson: JSON.stringify(params.debateMessages),
        status: "complete",
      });
      await loadAnalyses();
      return id as number;
    },
    [loadAnalyses],
  );

  // Deletar análise
  const deleteAnalysis = useCallback(
    async (id: number) => {
      await db.analyses.delete(id);
      await loadAnalyses();
    },
    [loadAnalyses],
  );

  // Limpar todas
  const clearAll = useCallback(async () => {
    await db.analyses.clear();
    setAnalyses([]);
  }, []);

  return {
    analyses,
    loading,
    saveAnalysis,
    deleteAnalysis,
    clearAll,
    reload: loadAnalyses,
  };
}
