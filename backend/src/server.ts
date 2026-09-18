import { app } from "./app";
import { env } from "./config/env";
import { iniciarJobDeLembretes } from "./jobs/lembretes.job";

app.listen(env.PORT, () => {
  console.log(`InfoHub API rodando em http://localhost:${env.PORT}`);
  console.log(`CORS liberado para: ${env.CORS_ORIGIN}`);
  console.log(
    env.RESEND_API_KEY
      ? "E-mail: Resend configurado — envios reais ativados."
      : "E-mail: RESEND_API_KEY não configurada — envios só serão simulados no console."
  );
});

iniciarJobDeLembretes(env.INTERVALO_LEMBRETES_MIN);
