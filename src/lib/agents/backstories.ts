import type { AgentId } from "@/types";
import type { AgentBackstory } from "@/components/agents/CharacterModal";

export const AGENT_BACKSTORIES: Record<AgentId, AgentBackstory> = {
  "psi-infantil": {
    originName: "Sofia Vygotski",
    originDescription: "Homenagem a Lev Vygotski, pioneiro da psicologia do desenvolvimento. O nome Sofia remete à sabedoria grega, refletindo a abordagem científica que busca entender o contexto cultural do desenvolvimento infantil.",
    whyChosen: "Fundamental para avaliar o desenvolvimento emocional e comportamental. Sofia realiza avaliação psicológica estruturada, observação clínica e aplica instrumentos padronizados internacionais. É a porta de entrada para entender as manifestações emocionais e comportamentais da criança.",
    fictionalBio: "Formada em Psicologia com especialização em Psicologia do Desenvolvimento pela USP (fictícia). 12 anos de experiência em avaliação de crianças de 0 a 18 anos, com ênfase em transtornos do neurodesenvolvimento, ansiedade infantil, depressão e problemas de conduta.",
    expertiseRefs: [
      { type: "book", author: "Vygotski, L. S.", year: 1978, title: "Mind in Society: The Development of Higher Psychological Processes" },
      { type: "paper", author: "Goodman, R.", year: 1997, title: "The Strengths and Difficulties Questionnaire (SDQ): A research note" },
      { type: "book", author: "Achenbach, T. M.", year: 2009, title: "The CBCL/6-18 for the Assessment of Behavioral/Emotional Problems in Children" },
    ],
    clinicalApproach: "Utiliza abordagem integrativa combinando observação clínica lúdica, entrevista estruturada e instrumentos padronizados como M-CHAT-R/F, SDQ e CBCL. Realiza 4-6 sessões de avaliação com a criança e responsável, observando o comportamento em contexto, interação, afeto e regulação emocional.",
  },
  "psi-parentalidade": {
    originName: "Victor Winnicott",
    originDescription: "Homenagem a Donald Winnicott, psicanalista que revolucionou a compreensão do vínculo pais-filhos e o conceito de 'mãe suficientemente boa'. Victor remete à vitória da compreensão empática sobre o julgamento.",
    whyChosen: "Crucial para entender como o ambiente familiar e os estilos parentais impactam no desenvolvimento. Victor avalia a qualidade do vínculo, responsividade parental e padrões de interação que moldam o comportamento e emocionalidade da criança.",
    fictionalBio: "Psicólogo especializado em Psicologia Familiar e Parentalidade com pós-graduação em Terapia Familiar Sistêmica. 9 anos de experiência em avaliação de dinâmica familiar, estilos parentais (autoritativo, autoritário, permissivo) e seu impacto no desenvolvimento infantil.",
    expertiseRefs: [
      { type: "book", author: "Winnicott, D. W.", year: 1960, title: "The Theory of the Parent-Infant Relationship" },
      { type: "paper", author: "Baumrind, D.", year: 1991, title: "The influence of parenting style on adolescent competence and substance use" },
      { type: "book", author: "Patterson, G. R.", year: 2016, title: "Coercive Family Process: A Social Learning Approach to Family Intervention" },
    ],
    clinicalApproach: "Análise observacional de interações pais-filhos, videogravação e codificação de padrões de responsividade, disciplina e afeto. Utiliza instrumentos como BASC-3 PRQ, PSDQ e observação diádica estruturada para mapear a qualidade do vínculo.",
  },
  "neuropsico": {
    originName: "Helena Luria",
    originDescription: "Homenagem a Alexander Luria, neurologista que desenvolveu o teste de Luria-Nebraska e revolucionou a neuropsicologia. Helena remete à heliocentrismo, simbolizando o mapeamento do universo cognitivo da criança.",
    whyChosen: "Especialista em mapeamento cognitivo abrangente. Helena realiza bateria neuropsicológica completa que avalia inteligência, memória, atenção, funções executivas e velocidade de processamento, essencial para diagnosticar discrepâncias e déficits específicos.",
    fictionalBio: "Neuropsicopediatra com título em Neuropsicologia Infantil. 15 anos de experiência em avaliação abrangente de crianças de 2 a 16 anos, especializada em mapeamento cognitivo, identificação de déficits específicos e diagnóstico diferencial.",
    expertiseRefs: [
      { type: "book", author: "Luria, A. R.", year: 1966, title: "Human Brain and Psychological Processes" },
      { type: "book", author: "Wechsler, D.", year: 2014, title: "WISC-V: Escala Wechsler de Inteligência para Crianças" },
      { type: "paper", author: "Delis, D. C., Kramer, J. H.", year: 2019, title: "Neuropsychological Assessment and the New DSM-5" },
    ],
    clinicalApproach: "Bateria neuropsicológica abrangente (8-12 horas) incluindo WISC-V, NEPSY-II, testes de memória, atenção, funções executivas e velocidade de processamento. Inclui observação qualitativa durante testagem e análise de perfil de força/fraqueza cognitiva.",
  },
  "neuropediatra": {
    originName: "Marco Cajal",
    originDescription: "Homenagem a Santiago Ramón y Cajal, prêmio Nobel que mapeou a estrutura do sistema nervoso. Marco remete ao traçado detalhado, simbolizando o exame neurológico minucioso da criança.",
    whyChosen: "Essencial para avaliação neurológica objetiva. Marco realiza exame neurológico pediátrico estruturado, avalia marcos neuromotores e identifica sinais neurológicos que podem indicar condições médicas subjacentes ou disfunções neuromotoras.",
    fictionalBio: "Neuropediatra com residência em Neurologia Pediátrica. 11 anos de experiência em avaliação neurológica de crianças, com foco em transtornos do neurodesenvolvimento, epilepsia infantil e disfunções neuromotoras.",
    expertiseRefs: [
      { type: "book", author: "Cajal, S. R.", year: 2010, title: "Structure and Connections of Neurons (Neuron Doctrine)" },
      { type: "book", author: "Iancu, D. R.", year: 2018, title: "Clinical Assessment of the Pediatric Neurologic Exam" },
      { type: "paper", author: "Hadders-Algra, M.", year: 2014, title: "Early diagnosis and early intervention in cerebral palsy" },
    ],
    clinicalApproach: "Exame neurológico pediátrico padronizado incluindo avaliação de tônus, reflexos, nervos cranianos, coordenação, marcha e postura. Análise de marcos neuromotores com Denver-II ou Bayley-III, indicação criteriosa de EEG ou neuroimagem quando pertinente.",
  },
  "bcba": {
    originName: "Íris Skinner",
    originDescription: "Homenagem a B. F. Skinner, pai do behaviorismo experimental. Íris remete à deusa grega da verdade, simbolizando a medição objetiva e baseada em dados dos comportamentos.",
    whyChosen: "Especialista em análise funcional do comportamento. Íris avalia habilidades verbais, comportamentos-alvo funcionais, autonomia e analisa causas de comportamentos problema, fornecendo dados objetivos para intervenção comportamental.",
    fictionalBio: "Analista do Comportamento Certificada (BCBA) com especialização em intervenção precoce para TEA e atrasos do desenvolvimento. 8 anos de experiência em avaliação funcional, análise de comportamento-problema e planejamento de intervenção ABA.",
    expertiseRefs: [
      { type: "book", author: "Skinner, B. F.", year: 1957, title: "Verbal Behavior" },
      { type: "book", author: "Sundberg, M. L.", year: 2015, title: "VB-MAPP: Verbal Behavior Milestones Assessment and Placement Program" },
      { type: "paper", author: "Hanley, G. P., Iwata, B. A.", year: 2001, title: "A microswitched sensory analysis of vocal stereotypy in children with developmental disabilities" },
    ],
    clinicalApproach: "Avaliação baseada em marcos comportamentais (VB-MAPP), análise funcional do comportamento-problema (FBA), coleta sistemática de dados ABC, avaliação de habilidades linguísticas verbais e funcionais para definir objetivos de intervenção ABA.",
  },
  "mediator": {
    originName: "Coord. Atlas",
    originDescription: "Referência ao Titã Atlas que sustentava o mundo. O sistema mediador sustenta o diálogo multiprofissional, garantindo que todas as perspectivas sejam integradas harmoniosamente no diagnóstico final.",
    whyChosen: "O agente mediador é a inteligência central que orquestra o debate multiprofissional. Recebe as análises de todos os especialistas, facilita o diálogo, consolida perspectivas e produz um diagnóstico integrado que respeita as contribuições de cada profissional.",
    fictionalBio: "Sistema de IA desenvolvido para orquestração multiprofissional em diagnóstico infantil. Integra análises de psicólogos, neuropsicopediatras, neuropediatras e analistas do comportamento em uma síntese diagnóstica coerente e fundamentada.",
    expertiseRefs: [
      { type: "paper", author: "American Academy of Pediatrics", year: 2019, title: "Identifying Infants and Young Children with Developmental Disorders in the Medical Home" },
      { type: "book", author: "DSM-5 Task Force", year: 2013, title: "Diagnostic and Statistical Manual of Mental Disorders (DSM-5)" },
      { type: "book", author: "World Health Organization", year: 2022, title: "International Classification of Diseases, 11th Revision (ICD-11)" },
    ],
    clinicalApproach: "Orquestração sistemática da análise multiprofissional: distribui tarefas de avaliação, modera debate profissional, identifica consensos e discordâncias, e consolida diagnóstico final que integra perspectivas de todas as áreas avaliadas.",
  },
};
