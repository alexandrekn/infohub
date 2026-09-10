import "dotenv/config";

function obrigatorio(nome: string, padrao?: string): string {
  const valor = process.env[nome] ?? padrao;
  if (valor === undefined) {
    throw new Error(`Variável de ambiente ausente: ${nome}`);
  }
  return valor;
}

export const env = {
  PORT: Number(process.env.PORT ?? 3333),
  JWT_SECRET: obrigatorio("JWT_SECRET", "dev-secret-troque-em-producao"),
  JWT_EXPIRES_IN: obrigatorio("JWT_EXPIRES_IN", "7d"),
  CORS_ORIGIN: obrigatorio("CORS_ORIGIN", "http://localhost:5173"),
};
