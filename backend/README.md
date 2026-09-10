# InfoHub → InovAMF — Backend (Express + TS)

API REST em Node.js + Express + TypeScript. **Sem banco de dados ainda** — os
dados vivem em memória (`src/data/store.ts`), com exatamente os mesmos nomes
de campo do `banco.sql`, prontos para virar Prisma + MySQL depois: cada
`export const algo: Tipo[] = [...]` vira uma tabela, e os `services` trocam
de "mexer no array" para "chamar `prisma.algo.metodo()`" sem mudar rotas ou
controllers.

⚠️ Os dados resetam a cada reinício do servidor (`npm run dev`).

## Rodando

```bash
npm install
cp .env.example .env
npm run dev
```

Sobe em `http://localhost:3333`. Teste com `curl http://localhost:3333/health`.

### Contas de teste

Todas com senha **`senha123`**:

| Perfil | E-mail |
|---|---|
| Admin | bruna.admin@infohub.edu.br |
| Mentor | rafael.mentor@infohub.edu.br |
| Mentor | camila.mentor@infohub.edu.br |
| Aluno (líder da NutriRota) | gustavo@aluno.edu.br |
| Aluno (integrante da NutriRota) | larissa@aluno.edu.br |

## Estrutura

```
src/
  server.ts              ponto de entrada
  app.ts                 monta o Express (middlewares + rotas)
  config/env.ts          variáveis de ambiente
  data/store.ts          dados em memória — futura fonte do schema Prisma
  types/index.ts          espelha o banco.sql
  middlewares/
    auth.middleware.ts    autenticar (JWT) + permitirPerfis(...)
    error.middleware.ts   captura ApiError, erros de validação Zod e 404
  utils/
    ApiError.ts, jwt.ts, asyncHandler.ts
  modules/
    auth/         login, cadastro-ideia (RF-02/05), esqueci-senha
    cursos/       GET /api/cursos
    etapas/       GET /api/etapas
    equipes/      kanban+filtros (RF-06/07), detalhe (RF-08),
                  avançar/retroceder etapa (RF-09), histórico
    tarefas/      criar com modelos+lembretes (RF-11/17), aprovar/reprovar
                  (RF-15), alterar prazo (só mentor), entregas com
                  versionamento (RF-14/16)
    anotacoes/    RF-10 — nunca exposto ao aluno
    usuarios/     RF-03 — admin cria/desativa contas de admin/mentor
```

## Rotas

Todas sob `/api`, exceto `/health`. Autenticadas com `Authorization: Bearer <token>`
(obtido em `/api/auth/login`), exceto as de `auth`.

| Método | Rota | Quem pode |
|---|---|---|
| POST | `/auth/login` | público |
| POST | `/auth/cadastro-ideia` | público |
| POST | `/auth/esqueci-senha` | público |
| GET | `/cursos` | qualquer autenticado |
| GET | `/etapas` | qualquer autenticado |
| GET | `/equipes` | admin (filtros: `busca`, `area`, `turma`, `idMentor`, `idCurso`, `statusTarefa`) |
| GET | `/equipes/minhas` | aluno ou mentor (usa o token, sem precisar de id) |
| GET | `/equipes/:id` | admin, mentor da equipe, ou integrante da equipe |
| PATCH | `/equipes/:id/avancar-etapa` | admin ou mentor da equipe |
| PATCH | `/equipes/:id/retroceder-etapa` | admin ou mentor da equipe |
| GET | `/equipes/:id/historico-etapas` | quem acessa a equipe |
| GET/POST | `/equipes/:id/tarefas` | ver/criar tarefas da equipe |
| GET/POST | `/equipes/:id/anotacoes` | só admin/mentor |
| PATCH | `/tarefas/:id/aprovar` | admin ou mentor da equipe |
| PATCH | `/tarefas/:id/reprovar` | admin ou mentor da equipe (aceita `comentario`) |
| PATCH | `/tarefas/:id/prazo` | **só o mentor da equipe** |
| GET/POST | `/tarefas/:id/entregaveis` | ver: quem acessa a equipe; enviar: só integrante |
| GET/POST | `/usuarios` | só admin |
| PATCH | `/usuarios/:id/alternar-ativo` | só admin |

## Testado manualmente

Login, filtros do kanban, avançar/retroceder etapa, autorização por perfil
(admin/mentor/aluno, incluindo tentativas negadas), criar tarefa, alterar
prazo (confirmado que só mentor consegue), anexar entrega com versionamento,
aprovar/reprovar com anotação automática, cadastro de ideia criando conta +
equipe na Etapa 1, e-mail duplicado rejeitado, criar/desativar/reativar
conta de admin/mentor. Tudo respondendo como esperado.

## Conectando ao frontend

✅ Já conectado — o projeto `infohub-frontend` usa `services/auth.service.ts`
e `services/data.service.ts`, que falam com esta API (`VITE_API_URL` aponta
para `http://localhost:3333/api` por padrão). Suba os dois ao mesmo tempo
(este backend numa porta, `npm run dev` do frontend na 5173) e o login já
funciona de ponta a ponta.

Dois pontos que o frontend depende e que valem lembrar se mexer na API:
- `GET /equipes` e `/equipes/minhas` retornam `mentores` (array completo,
  não só `id_mentores`) e `integrantes[].usuario` já populados.
- `GET /equipes/:id/anotacoes` retorna `autor` (o usuário que escreveu)
  em cada anotação.

## Próximos passos (fora do escopo desta etapa)

- Trocar `src/data/store.ts` por Prisma + MySQL (schema já existe em `banco.sql`,
  falta só a tabela de junção `equipe_mentor` para suportar múltiplos mentores).
- E-mail transacional real via Resend (RF-17/18/19) — hoje os lembretes são
  só registrados, sem disparo.
- Upload de arquivo de verdade para RF-14 (hoje só aceita URL/link).
