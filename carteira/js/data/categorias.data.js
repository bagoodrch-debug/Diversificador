// Classes de ativos exibidas no simulador (chave, nome, cor do token).

export const ASSETS = [
  { key: "rf", name: "Renda Fixa", color: "var(--asset-rf)" },
  { key: "acoes", name: "Ações", color: "var(--asset-acoes)" },
  { key: "exterior", name: "Ações no Exterior", color: "var(--asset-exterior)" },
  { key: "fii", name: "Fundos Imobiliários (FIIs)", color: "var(--asset-fii)" },
  { key: "ouro", name: "Ouro", color: "var(--asset-ouro)" },
];

export const DEFAULT_ALLOC = {
  rf: 20,
  acoes: 20,
  exterior: 20,
  fii: 20,
  ouro: 20,
};

export const DEFAULT_TOTAL = 10000;

export const SUGGESTION_DISCLAIMER =
  "Estas sugestões têm caráter meramente informativo e educacional. Não constituem recomendação de investimento. Rentabilidade passada não garante rentabilidade futura. Consulte um profissional certificado antes de investir.";
