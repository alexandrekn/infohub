/**
 * As 6 etapas padrão do funil InfoHub → InovAMF. Copiadas para cada equipe
 * no momento em que ela é criada — depois disso, cada equipe tem seu
 * próprio conjunto de etapas, e o mentor pode acrescentar ou remover
 * etapas de uma equipe específica sem afetar as demais.
 */
export const ETAPAS_PADRAO = [
  { nome: "Envio da ideia", descricao: "Aluno preenche o formulário inicial contando a ideia." },
  { nome: "Contato com a equipe", descricao: "Equipe InfoHub analisa a proposta e agenda o 1º encontro." },
  { nome: "Encontro 1 — Entendendo a ideia", descricao: "Problema, público-alvo e solução inicial." },
  { nome: "Encontro 2 — Proposta de valor", descricao: "Construção do Value Proposition Design." },
  { nome: "Encontro 3 — Modelo de negócio", descricao: "Construção do Business Model Canvas." },
  { nome: "Encontro 4 — Pitch e inscrição", descricao: "Revisão geral, Pitch Vídeo e conferência de documentos." },
] as const;
