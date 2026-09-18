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
  DATABASE_URL: obrigatorio("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/infohub"),

  // RF-17/18/19/20 — e-mail transacional. Sem RESEND_API_KEY, os e-mails só
  // são registrados no console (modo simulado), sem quebrar o resto do app.
  RESEND_API_KEY: process.env.RESEND_API_KEY ?? "",
  RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL ?? "InfoHub <onboarding@resend.dev>",
  APP_URL: process.env.APP_URL ?? "http://localhost:5173",

  // Frequência (em minutos) da checagem de lembretes/prazos vencidos — RF-17/18.
  INTERVALO_LEMBRETES_MIN: Number(process.env.INTERVALO_LEMBRETES_MIN ?? 60),
};
