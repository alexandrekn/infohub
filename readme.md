# InfoHub → InovAMF

Projeto completo: frontend (React) nesta pasta raiz + backend (Express) em `backend/`.

## Guia rápido — rodando os três serviços do zero

### 1. PostgreSQL

Instale o PostgreSQL (se ainda não tiver) e crie o banco:

```sql
CREATE DATABASE infohub;
```

### 2. Backend (terminal 1)

```bash
cd backend
npm install
cp .env.example .env
```

Edite o `.env` do backend e confira o `DATABASE_URL` (usuário/senha do seu Postgres).

```bash
npm run db:schema
npm run db:seed
npm run dev
```

Deve aparecer "InfoHub API rodando em http://localhost:3333". Detalhes completos: `backend/README.md`.

### 3. Frontend (terminal 2, na raiz do projeto)

```bash
npm install
npm run dev
```

Abra http://localhost:5173 e entre com qualquer conta de teste da tela de
login (senha `senha123` para todas).

---

Frontend conectado à API real (Express + TS, projeto `infohub-backend`). Todas
as telas fazem requisições HTTP de verdade — nada de dados mockados por padrão.

⚠️ **Precisa do backend rodando** em `http://localhost:3333` (ver o README da
pasta `backend/`) — e o backend, por sua vez, precisa de um PostgreSQL local
com o schema aplicado e populado. Sem os dois no ar, a tela de login não vai
autenticar.

## Rodando

```bash
npm install
npm run dev
```

Abra http://localhost:5173 — a tela de login mostra as contas de teste do
backend (admin, mentor, aluno líder, aluno integrante), todas com senha
**`senha123`**.

Se o backend estiver em outro endereço/porta, crie um `.env` na raiz do
projeto com `VITE_API_URL=http://seu-endereco/api` (por padrão já aponta
para `http://localhost:3333/api`, então normalmente não precisa criar nada).

## Estrutura

```
src/
  components/
    ui/        Button, Input, Card, Badge, StageTracker (trilha da jornada)
    layout/    Sidebar, Topbar, DashboardLayout (por perfil)
    auth/      AuthLayout (tela dividida de login/cadastro)
    equipes/   EquipeCard
  context/     AuthContext (sessão + perfil, fala com services/auth.service)
  hooks/       useAuth
  services/
    api.ts               instância axios (token automático, redireciona pro
                          login em 401)
    auth.service.ts       login, cadastro-ideia, esqueci-senha
    cursos.service.ts     GET /cursos
    data.service.ts       equipes, tarefas, anotações, usuários — o "miolo"
                          que fala com quase toda a API
    mock/                 authService.mock e dataService.mock ainda existem
                          aqui, sem uso — dá pra voltar ao modo demo trocando
                          as importações de volta, caso precise apresentar
                          sem o backend no ar
  pages/
    auth/      LoginPage, CadastroIdeiaPage (Etapa 1 — envio da ideia,
               com e-mail de cada integrante para criação de conta),
               EsqueciSenhaPage
    admin/     AdminDashboardPage (kanban + busca/filtros + exportar CSV),
               EquipeDetalhePage (avançar/retroceder etapa, histórico,
               criar tarefa, aprovar/reprovar, anotações internas),
               AdminUsuariosPage (RF-03 — contas de admin/mentor)
    aluno/     AlunoDashboardPage (jornada, tarefas pendentes/concluídas,
               link para anexar entrega)
    mentor/    MentorDashboardPage (equipes sob mentoria)
  routes/      AppRoutes, ProtectedRoute (checa perfil)
  types/       espelha as tabelas do banco (usuario, equipe, tarefa,
               entregavel, anotacao, lembrete, etc.) e o contrato da API
```

## O que o backend já devolve pronto

Pra simplificar o frontend, a API já populua algumas relações direto na
resposta (em vez de o front precisar cruzar listas separadas):

- `equipe.mentores` — array com os mentores completos (não só os IDs em `equipe.id_mentores`)
- `equipe.integrantes[].usuario` — dados do integrante já dentro da equipe
- `anotacao.autor` — quem escreveu a anotação

## Voltando ao modo mockado (sem backend)

Se precisar demonstrar sem o backend no ar, troque:
- `@/services/auth.service` → `@/services/mock/authService.mock` (em `AuthContext.tsx` e `EsqueciSenhaPage.tsx`)
- `@/services/data.service` → `@/services/mock/dataService.mock` (nas páginas de admin/aluno/mentor)

As assinaturas das funções são as mesmas, então a troca é só na importação.
