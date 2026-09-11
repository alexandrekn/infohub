# InfoHub → InovAMF — Backend (Express + TS + PostgreSQL)

API REST em Node.js + Express + TypeScript, com **banco de dados PostgreSQL
de verdade** (via `pg`, sem ORM por enquanto — ver nota sobre Prisma no final).
Schema em `prisma/schema.sql`, baseado no `banco.sql` original + extensões
necessárias (múltiplos mentores, `ativo`, `turma`, versionamento de entrega,
histórico de etapas).

## Pré-requisito: PostgreSQL instalado e rodando

Se ainda não tem Postgres na máquina, instale (Windows: https://www.postgresql.org/download/windows/,
ou via WSL/Docker). Depois de instalado, crie o banco:

```sql
CREATE DATABASE infohub;
```

## Rodando

```bash
npm install
cp .env.example .env
```

Edite o `.env` e ajuste `DATABASE_URL` com o usuário/senha do seu Postgres
local (o padrão assume usuário `postgres`, senha `postgres`, porta `5432`).

```bash
npm run db:schema   # cria as tabelas
npm run db:seed     # popula com dados de teste
npm run dev
```

Sobe em `http://localhost:3333`. Teste com `curl http://localhost:3333/health`.

Se precisar recomeçar do zero (apaga tudo e recria): `npm run db:reset`.

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
prisma/
  schema.prisma   documentação do modelo de dados (schema Prisma — ver nota abaixo)
  schema.sql      DDL real, aplicado via `npm run db:schema`
  seed.ts         popula o banco com dados de teste via `npm run db:seed`
src/
  server.ts              ponto de entrada
  app.ts                 monta o Express (middlewares + rotas)
  config/env.ts          variáveis de ambiente (inclui DATABASE_URL)
  db/pool.ts             pool de conexão do `pg`
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

## Nota sobre Prisma

O projeto foi desenhado para usar Prisma (schema em `prisma/schema.prisma`,
mantido como documentação do modelo). Na prática, os `services` usam SQL
direto via `pg` (`src/db/pool.ts`) em vez do Prisma Client — durante o
desenvolvimento, o ambiente usado para montar e testar este backend não
conseguia baixar os binários que o Prisma precisa (bloqueio de rede
específico daquele ambiente, não relacionado à sua máquina). Como o SQL
gerado bate exatamente com `schema.prisma`, migrar para Prisma depois é
uma troca mecânica: `npx prisma generate`, apontar `DATABASE_URL`, e trocar
as queries dos `services` por `prisma.<model>.<metodo>()` — as rotas e
controllers não precisam mudar.

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

## Testado de ponta a ponta (com banco real)

Login, filtros do kanban, avançar/retroceder etapa, autorização por perfil
(admin/mentor/aluno, incluindo tentativas negadas), criar tarefa, alterar
prazo (confirmado que só mentor consegue), anexar entrega com versionamento,
aprovar/reprovar com anotação automática (autor correto), cadastro de ideia
criando conta + equipe + integrante na Etapa 1, e-mail duplicado rejeitado,
criar/desativar/reativar conta de admin/mentor, múltiplos mentores por
equipe. Tudo respondendo como esperado, direto no PostgreSQL.

## Conectando ao frontend

✅ Já conectado — o frontend usa `services/auth.service.ts` e
`services/data.service.ts`, que falam com esta API (`VITE_API_URL` aponta
para `http://localhost:3333/api` por padrão). Suba os dois ao mesmo tempo
(este backend numa porta, `npm run dev` do frontend na 5173) e o login já
funciona de ponta a ponta.

## Próximos passos (fora do escopo desta etapa)

- Migrar de `pg` para Prisma Client (ver nota acima).
- E-mail transacional real via Resend (RF-17/18/19) — hoje os lembretes são
  só registrados, sem disparo.
- Upload de arquivo de verdade para RF-14 (hoje só aceita URL/link).
