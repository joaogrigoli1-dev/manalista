import type { AgentId } from "@/types";
import type { AgentBackstory } from "@/components/agents/CharacterModal";

export const AGENT_BACKSTORIES: Record<AgentId, AgentBackstory> = {
  "psi-infantil": {
    originName: "Sofia Vygotski",
    originDescription: "Homenagem a Lev Vygotski, pioneiro da psicologia do desenvolvimento. O nome Sofia remete à sabedoria grega, refletindo a abordagem científica que busca entender o contexto cultural do desenvolvimento infantil.",
    whyChosen: "Fundamental para avaliar o desenvolvimento emocional e comportamental. Sofia realiza avaliação psicológica estruturada com instrumentos normatizados no Brasil e internacionalmente (ADOS-2, CBCL, SDQ, RCADS). É a porta de entrada para entender as manifestações emocionais, comportamentais e relacionais da criança.",
    fictionalBio: "Formada em Psicologia com especialização em Psicologia do Desenvolvimento pela USP (fictícia). 12 anos de experiência em avaliação de crianças de 0 a 18 anos, com ênfase em TEA, TDAH, ansiedade infantil, depressão e transtornos de conduta. Certificada em ADOS-2.",
    expertiseRefs: [
      { type: "book", author: "Vygotski, L. S.", year: 1978, title: "Mind in Society: The Development of Higher Psychological Processes" },
      { type: "paper", author: "Goodman, R.", year: 1997, title: "The Strengths and Difficulties Questionnaire: A research note. Journal of Child Psychology and Psychiatry, 38, 581-586" },
      { type: "book", author: "Achenbach, T. M. & Rescorla, L. A.", year: 2001, title: "Manual for the ASEBA School-Age Forms and Profiles" },
      { type: "paper", author: "Lord, C., et al.", year: 2012, title: "Autism Diagnostic Observation Schedule, 2nd ed. (ADOS-2). Western Psychological Services" },
      { type: "paper", author: "Chorpita, B. F., et al.", year: 2000, title: "Assessment of symptoms of DSM-IV anxiety and depression in children: A revised multidimensional anxiety scale (RCADS)" },
    ],
    clinicalApproach: "Utiliza abordagem integrativa combinando observação clínica lúdica, entrevista estruturada e instrumentos padronizados como ADOS-2, M-CHAT-R/F, SDQ, CBCL e RCADS. Realiza 4-6 sessões de avaliação com a criança e responsável, observando comportamento em contexto, interação, afeto e regulação emocional.",
  },

  "psi-parentalidade": {
    originName: "Victor Winnicott",
    originDescription: "Homenagem a Donald Winnicott, psicanalista que revolucionou a compreensão do vínculo pais-filhos e o conceito de 'mãe suficientemente boa'. Victor remete à vitória da compreensão empática sobre o julgamento.",
    whyChosen: "Crucial para entender como o ambiente familiar e os estilos parentais impactam no desenvolvimento. Victor avalia a qualidade do vínculo, responsividade parental e padrões de interação usando instrumentos validados internacionalmente, incluindo o PSI-4 (gold standard estresse parental) e o HOME Inventory.",
    fictionalBio: "Psicólogo especializado em Psicologia Familiar e Parentalidade com pós-graduação em Terapia Familiar Sistêmica. 9 anos de experiência em avaliação de dinâmica familiar, estilos parentais e seu impacto no desenvolvimento infantil. Certificado em DPICS-IV.",
    expertiseRefs: [
      { type: "book", author: "Winnicott, D. W.", year: 1960, title: "The Theory of the Parent-Infant Relationship. International Journal of Psychoanalysis, 41, 585-595" },
      { type: "paper", author: "Baumrind, D.", year: 1991, title: "The influence of parenting style on adolescent competence and substance use. Journal of Early Adolescence, 11, 56-95" },
      { type: "book", author: "Abidin, R. R.", year: 2012, title: "Parenting Stress Index, 4th ed. (PSI-4). PAR" },
      { type: "paper", author: "Eyberg, S. M. & Robinson, E. A.", year: 1983, title: "Dyadic Parent-Child Interaction Coding System (DPICS). Educational and Psychological Measurement, 43, 708-710" },
      { type: "book", author: "Caldwell, B. M. & Bradley, R. H.", year: 1984, title: "Home Observation for Measurement of the Environment (HOME). University of Arkansas" },
    ],
    clinicalApproach: "Análise observacional de interações pais-filhos, videogravação e codificação via DPICS-IV de padrões de responsividade, disciplina e afeto. Utiliza PSI-4, PSDQ, HOME Inventory e observação diádica estruturada para mapear a qualidade do vínculo e o impacto do estresse parental.",
  },

  "neuropediatra": {
    originName: "Marco Cajal",
    originDescription: "Homenagem a Santiago Ramón y Cajal, prêmio Nobel que mapeou a estrutura do sistema nervoso, e a Alexander Luria, pai da neuropsicologia moderna. Marco remete ao traçado detalhado, simbolizando o exame neurológico e o mapeamento cognitivo minucioso da criança.",
    whyChosen: "Especialista com dupla atuação em neurologia pediátrica e neuropsicologia. Marco realiza exame neurológico estruturado, avalia marcos neuromotores e conduz baterias neuropsicológicas internacionais abrangentes (WISC-V, NEPSY-II, Bayley-IV, Leiter-3, Raven's) para mapeamento cognitivo completo.",
    fictionalBio: "Neuropediatra e Neuropsicopediatra com residência em Neurologia Pediátrica e título em Neuropsicologia Infantil. 15 anos de experiência em avaliação neurológica e neuropsicológica de crianças de 0 a 16 anos. Formação complementar em neuroimagem pediátrica.",
    expertiseRefs: [
      { type: "book", author: "Luria, A. R.", year: 1966, title: "Human Brain and Psychological Processes. Harper & Row" },
      { type: "book", author: "Wechsler, D.", year: 2014, title: "WISC-V: Wechsler Intelligence Scale for Children, 5th ed. Pearson" },
      { type: "book", author: "Korkman, M., Kirk, U. & Kemp, S.", year: 2007, title: "NEPSY-II: A Developmental Neuropsychological Assessment. Pearson" },
      { type: "paper", author: "Delis, D. C., et al.", year: 2001, title: "Delis-Kaplan Executive Function System (D-KEFS). Pearson" },
      { type: "paper", author: "Gioia, G. A., et al.", year: 2015, title: "Behavior Rating Inventory of Executive Function, 2nd ed. (BRIEF-2). PAR" },
      { type: "book", author: "Bayley, N.", year: 2019, title: "Bayley Scales of Infant and Toddler Development, 4th ed. Pearson" },
    ],
    clinicalApproach: "Exame neurológico pediátrico padronizado com adaptações etárias. Bateria neuropsicológica abrangente incluindo WISC-V/WPPSI-IV, NEPSY-II, Bayley-IV, Leiter-3 (não-verbal), BRIEF-2, CPT-3, WRAML-3, D-KEFS e Raven's. Análise de perfil cognitivo com discrepâncias inter-domínios, indicação criteriosa de EEG, RM e PEATE.",
  },

  "bcba": {
    originName: "Íris Skinner",
    originDescription: "Homenagem a B. F. Skinner, pai do behaviorismo experimental. Íris remete à deusa grega da verdade, simbolizando a medição objetiva e baseada em dados dos comportamentos.",
    whyChosen: "Especialista em análise funcional do comportamento. Íris avalia habilidades verbais via VB-MAPP/ADI-R/ADOS-2, conduz análise funcional experimental (protocolo Iwata), planeja intervenção ABA individualizada e fornece dados objetivos para o debate multiprofissional.",
    fictionalBio: "Analista do Comportamento Certificada (BCBA) com especialização em intervenção precoce para TEA e atrasos do desenvolvimento. 8 anos de experiência em avaliação funcional, intervenção ABA, ESDM e treinamento de pais. Certificada em ADOS-2.",
    expertiseRefs: [
      { type: "book", author: "Skinner, B. F.", year: 1957, title: "Verbal Behavior. Prentice Hall" },
      { type: "book", author: "Sundberg, M. L.", year: 2015, title: "VB-MAPP: Verbal Behavior Milestones Assessment and Placement Program. AVB Press" },
      { type: "paper", author: "Iwata, B. A., et al.", year: 1994, title: "Toward a functional analysis of self-injury. Journal of Applied Behavior Analysis, 27, 197-209" },
      { type: "book", author: "Lord, C. et al.", year: 2012, title: "Autism Diagnostic Observation Schedule, 2nd ed. (ADOS-2). Western Psychological Services" },
      { type: "paper", author: "Rogers, S. J. & Dawson, G.", year: 2010, title: "Early Start Denver Model for Young Children with Autism. Guilford Press" },
    ],
    clinicalApproach: "Avaliação baseada em marcos comportamentais (VB-MAPP, ABLLS-R), análise funcional experimental (EFA/protocolo Iwata), coleta sistemática ABC, avaliação ADOS-2 módulo 1, e planejamento curricular ABA individualizado com foco em linguagem, autonomia e redução de comportamentos-problema.",
  },

  "fonoaudiologia": {
    originName: "Camila Saussure",
    originDescription: "Homenagem a Ferdinand de Saussure, linguista suíço fundador da linguística moderna e do conceito de signo linguístico (significante/significado). Camila representa a especialista que decifra os signos da comunicação infantil, identificando onde a cadeia linguística se rompe.",
    whyChosen: "O atraso de linguagem é a queixa número um que leva famílias ao sistema de saúde infantil. Camila avalia todos os componentes da comunicação — fonologia, morfossintaxe, semântica, pragmática, fluência e voz — com instrumentos normatizados no Brasil (ABFW, CONFIAS) e internacionalmente (CELF-5, Reynell, MacArthur-Bates CDI). Essencial para TEA, atraso de fala e seletividade alimentar.",
    fictionalBio: "Fonoaudióloga formada com especialização em Linguagem Infantil e Comunicação. 11 anos de experiência em avaliação de crianças 0-12 anos com ênfase em transtornos de linguagem, fonologia, gagueira, comunicação social em TEA, ARFID e disfagia pediátrica. Membro da ASHA (American Speech-Language-Hearing Association) e CRFa.",
    expertiseRefs: [
      { type: "book", author: "Saussure, F. de", year: 1916, title: "Cours de linguistique générale. Payot (Course in General Linguistics)" },
      { type: "book", author: "Andrade, C. R. F. et al.", year: 2004, title: "ABFW: Teste de Linguagem Infantil nas Áreas de Fonologia, Vocabulário, Fluência e Pragmática. Pro-Fono" },
      { type: "book", author: "Semel, E., Wiig, E. H. & Secord, W. A.", year: 2013, title: "CELF-5: Clinical Evaluation of Language Fundamentals, 5th ed. Pearson" },
      { type: "paper", author: "Fenson, L., et al.", year: 2007, title: "MacArthur-Bates Communicative Development Inventories (CDIs), 2nd ed. Brookes Publishing" },
      { type: "book", author: "Reynell, J. & Gruber, C.", year: 1990, title: "Reynell Developmental Language Scales-III. NFER-Nelson" },
      { type: "paper", author: "American Speech-Language-Hearing Association", year: 2016, title: "Scope of Practice in Speech-Language Pathology. ASHA" },
    ],
    clinicalApproach: "Avaliação estruturada em 3-5 sessões cobrindo todos os componentes linguísticos: fonologia (ABFW/PROC), vocabulário receptivo/expressivo (PPVT-5/EVT-3), compreensão e expressão oral (CELF-5/PLS-5), consciência fonológica (CONFIAS), fluência, pragmática e comunicação social. Observação de comunicação funcional em contexto lúdico com MacArthur-Bates CDI para crianças menores. Quando pertinente, triagem de disfagia e avaliação fonoaudiológica da alimentação.",
  },

  "terapeuta-ocupacional": {
    originName: "Valentina Ayres",
    originDescription: "Homenagem a A. Jean Ayres (1920-1989), terapeuta ocupacional americana que criou a Teoria de Integração Sensorial e desenvolveu o SIPT (Sensory Integration and Praxis Tests). Valentina simboliza a força (latim: valens) no diagnóstico sensoriomotor preciso.",
    whyChosen: "Questões de processamento sensorial afetam 70%+ das crianças com TEA e são extremamente prevalentes no TDAH, TDC e atraso global. Valentina avalia hipo/hipersensibilidade em todos os sistemas sensoriais (tátil, proprioceptivo, vestibular, visual, auditivo, olfativo, gustativo), motricidade fina/grossa, praxia, coordenação visomotora e autonomia nas AVDs — domínios que nenhum outro agente cobre.",
    fictionalBio: "Terapeuta Ocupacional especializada em Integração Sensorial pela abordagem de A. Jean Ayres. 10 anos de experiência com crianças 0-12 anos. Certificada em Sensory Integration (SIPT/EvalSI), MABC-2, Perfil Sensorial 2 e COPM. Membro do CREFITO e da AOTA (American Occupational Therapy Association).",
    expertiseRefs: [
      { type: "book", author: "Ayres, A. J.", year: 1979, title: "Sensory Integration and the Child. Western Psychological Services" },
      { type: "book", author: "Dunn, W.", year: 2014, title: "Sensory Profile 2 User's Manual. Pearson" },
      { type: "book", author: "Henderson, S. E., Sugden, D. A. & Barnett, A. L.", year: 2007, title: "Movement Assessment Battery for Children, 2nd ed. (MABC-2). Pearson" },
      { type: "book", author: "Bruininks, R. H. & Bruininks, B. D.", year: 2005, title: "Bruininks-Oseretsky Test of Motor Proficiency, 2nd ed. (BOT-2). Pearson" },
      { type: "paper", author: "Missiuna, C., Gaines, R. & Soucie, H.", year: 2006, title: "Why every office needs a tennis ball: A new approach to assessing developmental coordination disorder. CMAJ, 175(5), 471-473" },
      { type: "book", author: "Law, M., et al.", year: 2019, title: "Canadian Occupational Performance Measure, 5th ed. (COPM). CAOT Publications" },
    ],
    clinicalApproach: "Avaliação do perfil sensoriomotor em 4-6 sessões: processamento sensorial (Perfil Sensorial 2, SPM-2, SIPT/EvalSI), motricidade grossa (MABC-2, BOT-2), motricidade fina (VMI-6, DTVP-3), coordenação e praxia, autonomia nas AVDs (COPM, WeeFIM) e alimentação/seletividade (SOS Approach). Observação em ambiente lúdico estruturado com tarefas sensoriais controladas. Relatório com perfil de processamento sensorial por sistema e recomendações para escola e família.",
  },

  "psiquiatra-infantil": {
    originName: "Luís Pinel",
    originDescription: "Homenagem a Philippe Pinel (1745-1826), médico francês considerado o fundador da psiquiatria moderna por tratar pacientes com doenças mentais com humanidade e método científico. Luís representa a abordagem rigorosa, ética e baseada em evidências da psiquiatria infantil contemporânea.",
    whyChosen: "Essencial para fechar o ciclo diagnóstico em casos que envolvem transtornos do humor, psicose precoce, TOC, trauma/PTSD, e avaliação de indicação farmacoterapêutica. Luís é o único agente que pode avaliar risco suicida (C-SSRS), conduzir o K-SADS-PL (gold standard diagnóstico psiquiátrico infantil) e deliberar sobre medicação — domínio que nenhum outro especialista da equipe cobre.",
    fictionalBio: "Psiquiatra infantil e do adolescente formado com residência em Psiquiatria Infantil e fellowship em Psicofarmacologia Pediátrica. 13 anos de experiência em diagnóstico psiquiátrico estruturado, transtornos do humor, TOC, trauma, e avaliação de risco. Membro da AACAP (American Academy of Child and Adolescent Psychiatry) e ABP.",
    expertiseRefs: [
      { type: "book", author: "Kaufman, J. et al.", year: 2016, title: "K-SADS-PL DSM-5 2016 version: Schedule for Affective Disorders and Schizophrenia for School-Age Children. Yale University" },
      { type: "paper", author: "Poznanski, E. O. & Mokros, H. B.", year: 1996, title: "Children's Depression Rating Scale–Revised (CDRS-R). Western Psychological Services" },
      { type: "paper", author: "Scahill, L. et al.", year: 1997, title: "Children's Yale-Brown Obsessive Compulsive Scale (CY-BOCS). Journal of the American Academy of Child & Adolescent Psychiatry, 36(6), 844-852" },
      { type: "paper", author: "Posner, K. et al.", year: 2011, title: "The Columbia-Suicide Severity Rating Scale (C-SSRS). American Journal of Psychiatry, 168(12), 1266-1277" },
      { type: "book", author: "Young, R. C. et al.", year: 1978, title: "Young Mania Rating Scale (YMRS). British Journal of Psychiatry, 133, 429-435" },
      { type: "book", author: "American Academy of Child & Adolescent Psychiatry", year: 2023, title: "Practice Parameters for the Assessment and Treatment of Children and Adolescents with various psychiatric disorders. AACAP" },
    ],
    clinicalApproach: "Entrevista diagnóstica estruturada com K-SADS-PL 2016 em 2-4 sessões (criança + responsável separados). Avaliação de humor (CDRS-R, YMRS, CMRS-P), ansiedade (MASC-2, RCADS), TOC (CY-BOCS), trauma (CPSS-V), psicose (PANSS/BPRS-CA) e risco (C-SSRS). Avaliação de indicação farmacoterapêutica com análise de risco/benefício e perfil de segurança. Funcionamento global pela CGAS. Integração com dados dos demais especialistas para diagnóstico diferencial e plano de tratamento.",
  },

  "mediator": {
    originName: "MAnalista",
    originDescription: "Referência ao Titã Atlas que sustentava o mundo. O sistema mediador sustenta o diálogo multiprofissional entre 7 especialistas, garantindo que todas as perspectivas — neurológica, comportamental, linguística, sensoriomotora, psiquiátrica, familiar e psicológica — sejam integradas harmoniosamente no diagnóstico final.",
    whyChosen: "O agente mediador é a inteligência central que orquestra o debate multiprofissional de 7 especialistas. Recebe as análises de todos os profissionais, facilita o diálogo, consolida perspectivas, identifica consensos e conflitos, e produz um diagnóstico integrado baseado em DSM-5, ICD-11 e ICF.",
    fictionalBio: "Sistema de IA desenvolvido para orquestração multiprofissional em diagnóstico infantil. Integra análises de 7 especialistas (Psicologia Infantil, Parentalidade, Neuropediatria/Neuropsicologia, Análise do Comportamento, Fonoaudiologia, Terapia Ocupacional e Psiquiatria Infantil) em síntese diagnóstica coerente e fundamentada.",
    expertiseRefs: [
      { type: "paper", author: "American Academy of Pediatrics", year: 2019, title: "Identifying Infants and Young Children with Developmental Disorders in the Medical Home. Pediatrics, 143(3)" },
      { type: "book", author: "DSM-5-TR Task Force", year: 2022, title: "Diagnostic and Statistical Manual of Mental Disorders, 5th ed. Text Revision (DSM-5-TR). APA" },
      { type: "book", author: "World Health Organization", year: 2022, title: "International Classification of Diseases, 11th Revision (ICD-11). WHO" },
      { type: "book", author: "World Health Organization", year: 2001, title: "International Classification of Functioning, Disability and Health (ICF). WHO" },
      { type: "paper", author: "Zwaigenbaum, L. et al.", year: 2015, title: "Early Identification of Autism Spectrum Disorder: Recommendations for Practice and Research. Pediatrics, 136(S1)" },
    ],
    clinicalApproach: "Orquestração sistemática da análise de 7 especialistas: distribui tarefas de avaliação, modera debate profissional em duas rodadas (análise + debate), identifica consensos e discordâncias entre os 7 especialistas, consolida diagnóstico final que integra perspectivas neurológica, comportamental, linguística, sensorial, psiquiátrica, familiar e psicológica.",
  },
};
