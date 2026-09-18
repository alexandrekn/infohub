# Deploy do InfoHub no Coolify — 1 resource (monólito)

O projeto está preparado para ser publicado como **um único resource Dockerfile**.
O mesmo container serve o frontend React, a API Express e executa o seed obrigatório antes de subir a aplicação.

## Variáveis obrigatórias

Configure no resource do Coolify:

```env
DATABASE_URL=postgresql://USUARIO:SENHA@HOST:PORTA/BANCO
DB_SCHEMA=nome_exato_do_schema_da_dupla
JWT_SECRET=uma_chave_grande_e_aleatoria
PORT=3333
```

Recomendadas:

```env
CORS_ORIGIN=https://DOMINIO-DO-APP
APP_URL=https://DOMINIO-DO-APP
INTERVALO_LEMBRETES_MIN=60
```

`RESEND_API_KEY` pode ficar vazio para a apresentação; o sistema apenas simula os e-mails no log.

## Build pack

Escolha **Dockerfile** no Coolify. Não crie resource separado para frontend ou backend.

- Dockerfile: `./Dockerfile`
- Porta interna: `3333`
- Health check: `/health`

## O que ocorre em cada deploy/start

1. O container conecta em `DATABASE_URL`.
2. Recria **somente** `DB_SCHEMA` (o script recusa `public`).
3. Cria tipos/tabelas.
4. Insere o seed de demonstração.
5. Valida automaticamente a rubrica.
6. Só então inicia o Express, que serve API e frontend na mesma porta.

## Seed da avaliação

Senha de todas as contas seedadas: `senha123`.

- Admin: `bruna.admin@infohub.edu.br`
- Mentor que atende 2 equipes: `rafael.mentor@infohub.edu.br`
- Mentor que atende a 3ª equipe: `camila.mentor@infohub.edu.br`
- Aluno líder: `gustavo@aluno.edu.br`
- Aluno integrante: `larissa@aluno.edu.br`

O seed cria:

- 3 equipes;
- 3 integrantes por equipe, exatamente 1 líder em cada;
- 1 administrador e 4 mentores;
- Rafael em 2 equipes e Camila na terceira;
- 2 equipes com a Etapa 1 aprovada e atualmente na Etapa 2;
- 1 equipe com tarefa vencida marcada como `Atrasada`.

## Verificação rápida depois do deploy

Abra:

```text
https://SEU-DOMINIO/health
```

Depois faça login como admin e confira o funil, os 4 mentores e a tarefa atrasada.
