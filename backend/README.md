# InfoHub → InovAMF — Backend (Express + TS + PostgreSQL)

API REST em Node.js + Express + TypeScript, com **banco de dados PostgreSQL
de verdade** (via `pg`, sem ORM por enquanto — ver nota sobre Prisma no final).
Schema em `prisma/schema.sql`, baseado no `banco.sql` original + extensões
necessárias (múltiplos mentores, `ativo`, `turma`, versionamento de entrega,
histórico de etapas, **etapas por equipe**).

E-mail transacional (Resend) e upload de arquivo real (RF-14) já estão
implementados — ver seções próprias abaixo.

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
O `RESEND_API_KEY` pode ficar em branco — sem ele, os e-mails só são
simulados no console (ver seção de e-mail).

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

## E-mail automático (RF-17 a RF-20)

Usa o [Resend](https://resend.com) — tem plano grátis. Sem `RESEND_API_KEY`
no `.env`, o backend funciona normalmente e só imprime no console o que
seria enviado (destinatário + assunto), então dá pra testar tudo sem conta
nenhuma.

**Pra ligar o envio de verdade:**
1. Crie uma conta em https://resend.com e gere uma API key.
2. Cole em `RESEND_API_KEY` no `.env`.
3. Sem domínio verificado no Resend, o remetente padrão
   (`onboarding@resend.dev`) só consegue mandar e-mail pro endereço da
   própria conta Resend — normal para teste. Pra mandar pra qualquer
   e-mail (ex.: os alunos de verdade), verifique um domínio no Resend e
   troque `RESEND_FROM_EMAIL` no `.env`.

**O que dispara e-mail, automaticamente:**

| Evento | Quem recebe | RF |
|---|---|---|
| Aluno envia a ideia (cadastro) | Admins | RF-19 |
| Nova tarefa criada | Integrantes da equipe | RF-18 |
| Data de lembrete configurada na tarefa chega | Integrantes da equipe | RF-17/18 |
| Prazo da tarefa vence sem entrega | Integrantes da equipe + admins | RF-18/19 |
| Entrega aprovada | Integrantes da equipe | RF-18 |
| Entrega reprovada (com o comentário) | Integrantes da equipe | RF-18 |
| Arquivo entregue | Admins | RF-19 |
| Admin/mentor dispara manualmente | Integrantes da equipe | RF-20 |

Os dois primeiros da lista de "prazo" (lembrete configurado / prazo vencido)
não acontecem na hora — um job (`src/jobs/lembretes.job.ts`) roda a cada
`INTERVALO_LEMBRETES_MIN` minutos (padrão 60, configurável no `.env`) e
confere o banco. Ele também marca a tarefa como "Atrasada" automaticamente
quando o prazo vence sem entrega (RN-04). O job já roda uma vez assim que o
servidor sobe, então dá pra ver o efeito sem esperar.

## Upload de arquivo real (RF-14)

Além de colar um link (YouTube/Drive), o aluno agora pode enviar um arquivo
de verdade (PDF, imagem ou vídeo, até 50 MB — RNF-04). Os arquivos ficam em
`backend/uploads/` (fora do Git — vai pro `.gitignore`) e são servidos em
`http://localhost:3333/uploads/<arquivo>`.

```
POST /api/tarefas/:id/entregaveis/upload   (multipart/form-data, campo "arquivo")
```

## Estrutura

```
prisma/
  schema.prisma   documentação do modelo de dados (schema Prisma — ver nota abaixo)
  schema.sql      DDL real, aplicado via `npm run db:schema`
  seed.ts         popula o banco com dados de teste via `npm run db:seed`
src/
  server.ts              ponto de entrada — também inicia o job de lembretes
  app.ts                 monta o Express (middlewares + rotas + /uploads estático)
  config/env.ts          variáveis de ambiente (banco, JWT, Resend)
  db/pool.ts             pool de conexão do `pg`
  constants/etapasPadrao.ts  as 6 etapas padrão copiadas para toda equipe nova
  types/index.ts          espelha o banco.sql
  middlewares/
    auth.middleware.ts    autenticar (JWT) + permitirPerfis(...)
    upload.middleware.ts  multer — tipos/tamanho permitidos para upload (RF-14/RNF-04)
    error.middleware.ts   captura ApiError, erros de validação Zod e 404
  services/email/
    email.service.ts       cliente Resend (com modo simulado sem API key)
    email.templates.ts     o HTML de cada tipo de e-mail
    notificacoes.service.ts orquestra quem recebe cada e-mail (RF-18/19/20)
  jobs/lembretes.job.ts   checagem periódica de lembretes e prazos vencidos (RN-04)
  utils/
    ApiError.ts, jwt.ts, asyncHandler.ts
  modules/
    auth/         login, cadastro-ideia (RF-02/05, cria as 6 etapas da equipe), esqueci-senha
    cursos/       GET /api/cursos
    equipes/      kanban+filtros (RF-06/07), detalhe (RF-08),
                  avançar/retroceder etapa (RF-09) por ordem própria da equipe,
                  etapas por equipe (RF custom — ver abaixo), lembrete manual (RF-20)
    tarefas/      criar com modelos+lembretes (RF-11/17), aprovar/reprovar
                  (RF-15), alterar prazo (só mentor), entregas com
                  versionamento e upload real (RF-14/16)
    anotacoes/    RF-10 — nunca exposto ao aluno
    usuarios/     RF-03 — admin cria/desativa contas de admin/mentor
```

### Etapas por equipe

Diferente da v1 (etapas globais fixas), cada equipe tem seu **próprio**
conjunto de etapas — copiado das 6 padrão no momento do cadastro. O mentor
da equipe (ou admin) pode acrescentar ou remover etapas só para aquela
equipe, sem afetar as demais (decisão tomada em conversa com a coordenação):

```
GET    /api/equipes/:id/etapas
POST   /api/equipes/:id/etapas            { nome, descricao }
DELETE /api/equipes/:id/etapas/:idEtapa
```

Regras: não dá pra remover a etapa em que a equipe está agora, nem uma
etapa que já tem tarefa associada (o backend responde 409 nesses casos).

## Nota sobre Prisma

O projeto foi desenhado para usar Prisma (schema em `prisma/schema.prisma`,
mantido como documentação do modelo). Na prática, os `services` usam SQL
direto via `pg` (`src/db/pool.ts`) em vez do Prisma Client — durante o
desenvolvimento, o ambiente usado para montar e testar este backend não
conseguia baixar os binários que o Prisma precisa (bloqueio de rede
específico daquele ambiente, não relacionado à sua máquina). Como o SQL
gerado bate exatamente com `schema.prisma` (exceto pela extensão de etapas
por equipe, que também precisaria ser refletida lá), migrar para Prisma
depois é uma troca mecânica: `npx prisma generate`, apontar `DATABASE_URL`,
e trocar as queries dos `services` por `prisma.<model>.<metodo>()` — as
rotas e controllers não precisam mudar.

## Rotas

Todas sob `/api`, exceto `/health` e `/uploads`. Autenticadas com
`Authorization: Bearer <token>` (obtido em `/api/auth/login`), exceto as de
`auth`.

| Método | Rota | Quem pode |
|---|---|---|
| POST | `/auth/login` | público |
| POST | `/auth/cadastro-ideia` | público |
| POST | `/auth/esqueci-senha` | público |
| GET | `/cursos` | qualquer autenticado |
| GET | `/equipes` | admin (filtros: `busca`, `area`, `turma`, `idMentor`, `idCurso`, `statusTarefa`) |
| GET | `/equipes/minhas` | aluno ou mentor (usa o token, sem precisar de id) |
| GET | `/equipes/:id` | admin, mentor da equipe, ou integrante da equipe |
| PATCH | `/equipes/:id/avancar-etapa` | admin ou mentor da equipe |
| PATCH | `/equipes/:id/retroceder-etapa` | admin ou mentor da equipe |
| GET | `/equipes/:id/historico-etapas` | quem acessa a equipe |
| GET/POST | `/equipes/:id/etapas` | ver: quem acessa a equipe; adicionar: admin/mentor |
| DELETE | `/equipes/:id/etapas/:idEtapa` | admin ou mentor da equipe |
| POST | `/equipes/:id/lembrete-manual` | admin ou mentor da equipe (RF-20) |
| GET/POST | `/equipes/:id/tarefas` | ver/criar tarefas da equipe |
| GET/POST | `/equipes/:id/anotacoes` | só admin/mentor |
| PATCH | `/tarefas/:id/aprovar` | admin ou mentor da equipe |
| PATCH | `/tarefas/:id/reprovar` | admin ou mentor da equipe (aceita `comentario`) |
| PATCH | `/tarefas/:id/prazo` | **só o mentor da equipe** |
| GET/POST | `/tarefas/:id/entregaveis` | ver: quem acessa a equipe; enviar (link): só integrante |
| POST | `/tarefas/:id/entregaveis/upload` | só integrante (multipart, arquivo real) |
| GET/POST | `/usuarios` | só admin |
| PATCH | `/usuarios/:id/alternar-ativo` | só admin |

## Testado de ponta a ponta (com banco real)

Login, filtros do kanban, avançar/retroceder etapa (por ordem própria da
equipe), etapas por equipe (adicionar, remover, bloqueios de remoção),
autorização por perfil (admin/mentor/aluno, incluindo tentativas negadas),
criar tarefa, alterar prazo (confirmado que só mentor consegue), anexar
entrega por link **e por upload real** (arquivo salvo e servido de volta
com sucesso), aprovar/reprovar com anotação automática, cadastro de ideia
criando conta + equipe + integrante já com as 6 etapas, e-mail duplicado
rejeitado, criar/desativar/reativar conta de admin/mentor, múltiplos
mentores por equipe. **E-mails**: os 8 gatilhos automáticos testados um a
um em modo simulado (log no console com destinatário e assunto certos), e
o job de lembretes/atrasados testado rodando sozinho na subida do servidor.

## Conectando ao frontend

✅ Já conectado — o frontend usa `services/auth.service.ts` e
`services/data.service.ts`, que falam com esta API (`VITE_API_URL` aponta
para `http://localhost:3333/api` por padrão). Suba os dois ao mesmo tempo
(este backend numa porta, `npm run dev` do frontend na 5173) e o login já
funciona de ponta a ponta.

## Próximos passos (fora do escopo desta etapa)

- Migrar de `pg` para Prisma Client (ver nota acima).
- Verificar um domínio no Resend para enviar e-mail a qualquer aluno (hoje,
  sem isso, só chega no e-mail da própria conta Resend usada para testar).
- Aumentar o limite de upload (hoje 50 MB) se algum entregável precisar.
