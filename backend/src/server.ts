import { app } from "./app";
import { env } from "./config/env";

app.listen(env.PORT, () => {
  console.log(`InfoHub API rodando em http://localhost:${env.PORT}`);
  console.log(`CORS liberado para: ${env.CORS_ORIGIN}`);
});
