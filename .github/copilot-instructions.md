# Copilot Instructions — Brasileirão Data Fetcher

> Arquivo lido pelo GitHub Copilot (VSCode) para guiar sugestões de código neste repositório.
> Coloque em `.github/copilot-instructions.md` na raiz do projeto.

## Contexto do projeto

Job diário em **Node.js + TypeScript** (sem framework web) que busca dados de partidas do
Brasileirão Série A na API football-data.org, normaliza, e persiste em banco relacional via
upsert idempotente. Executado via cron (node-cron ou GitHub Actions).

Não sugira Express, NestJS, Fastify ou qualquer framework HTTP — este projeto não expõe rotas.

---

## Arquitetura

Seguir **Clean Architecture** com fronteiras de dependência unidirecionais (de fora pra dentro):

```
src/
├── domain/           # Entidades e regras de negócio puras. Zero dependência externa.
│   ├── entities/     # Match, Team, Competition, Season (interfaces/types)
│   └── errors/       # Erros de domínio customizados
├── application/       # Casos de uso (orquestração). Depende só de domain + ports.
│   ├── use-cases/     # FetchDailyMatches, NormalizeMatch, UpsertMatch
│   └── ports/         # Interfaces (contratos) que a infra implementa
├── infrastructure/     # Implementações concretas. Depende de application + domain.
│   ├── http/          # Cliente da API football-data.org
│   ├── db/            # Repositórios (Prisma/Drizzle), migrations
│   └── scheduler/      # node-cron ou entrypoint do GitHub Actions
└── shared/            # Utilitários puros sem estado (logger, date helpers)
```

**Regra de dependência:** `domain` nunca importa de `application` ou `infrastructure`.
`application` nunca importa de `infrastructure` diretamente — só via interfaces (ports).
Se o Copilot sugerir um `import` que viola essa direção, rejeite a sugestão.

---

## Princípios SOLID aplicados a este projeto

- **SRP** — Um módulo, uma razão para mudar. `MatchApiClient` só busca dados.
  `MatchNormalizer` só transforma. `MatchRepository` só persiste. Nunca misturar
  chamada HTTP com lógica de normalização na mesma função.
- **OCP** — Novos status de partida ou novos tipos de evento devem ser tratados por
  extensão (novo handler, nova função), não editando um `switch/case` gigante existente.
- **LSP** — Qualquer implementação de `MatchRepository` (SQLite hoje, Postgres amanhã)
  deve ser substituível sem quebrar os casos de uso.
- **ISP** — Interfaces pequenas e específicas. Prefira `Readable<Match>` e
  `Writable<Match>` separadas a uma `MatchRepository` monolítica, se o consumidor só
  precisa de uma das duas operações.
- **DIP** — Casos de uso dependem de abstrações (`interface ApiClient`,
  `interface MatchRepository`), nunca da implementação concreta. A injeção acontece
  no `composition root` (ex: `src/main.ts` ou `scripts/run-daily.ts`).

---

## TypeScript — convenções obrigatórias

- `strict: true` no `tsconfig.json`. Nunca sugerir `any` — usar `unknown` + narrowing,
  ou tipar corretamente a resposta da API.
- Tipos de domínio em `type`/`interface` próprios — **nunca** usar o tipo bruto da
  resposta da API (`RawMatchResponse`) além da camada de infraestrutura. A normalização
  (Parte 2 do projeto) é a fronteira: depois dela, só existe o tipo `Match` do domínio.
- Funções de normalização e regras de negócio devem ser **puras** (mesma entrada, mesma
  saída, sem efeito colateral) — isso facilita teste unitário sem mock de rede/banco.
- Preferir `readonly` em propriedades de entidades de domínio que não devem mutar após
  criação.
- Evitar classes para lógica sem estado — usar funções. Reservar classes para onde há
  estado real a encapsular (ex: cliente HTTP com configuração interna).

---

## Performance

- **Nunca** fazer requisição à API dentro de um loop por item (ex: buscar time por
  time). Usar os endpoints de lista/filtro da API (`?dateFrom=&dateTo=`) para trazer
  o lote em uma chamada.
- Upsert em lote (transação única) em vez de uma transação por registro, quando o
  driver/ORM suportar.
- Qualquer chamada à API externa deve ter **timeout explícito** — nunca deixar a
  Promise sem controle de tempo.
- Evitar reprocessar dados que não mudaram: comparar `lastUpdated` do payload com o
  valor já persistido antes de disparar um `UPDATE` desnecessário.
- Cache em memória (simples `Map`) para dados quase-estáticos da execução (ex:
  `competitions`, `teams`) dentro de uma mesma rodada do job, evitando múltiplas
  leituras ao banco para o mesmo registro.

---

## Tratamento de erros

- Erros de domínio (ex: `InvalidMatchDataError`) são classes próprias que estendem
  `Error`, lançadas na camada de `application`/`domain`.
- Erros de infraestrutura (timeout HTTP, erro de conexão com banco) são capturados na
  própria camada de infraestrutura e traduzidos para um erro de domínio antes de subir
  — a camada de aplicação não deve conhecer detalhes de Axios, Prisma, etc.
- Nunca engolir erro silenciosamente (`catch {}` vazio). Sempre logar ou relançar.
- Falha em um único item do lote (ex: um jogo com dado inconsistente) não deve
  interromper o processamento dos demais — logar e continuar, reportando o total de
  falhas ao final da execução.

---

## Testes

- Casos de uso e funções de normalização devem ter testes unitários sem I/O real
  (mockar `ApiClient` e `MatchRepository` via suas interfaces).
- Não sugerir testes que batem na API real do football-data.org — usar fixtures
  (JSON de exemplo salvo em `__fixtures__/`).

---

## O que o Copilot NÃO deve sugerir neste projeto

- Frameworks web (Express/NestJS/Fastify) — não há servidor HTTP aqui.
- `any` ou `// @ts-ignore` como solução de tipagem.
- Lógica de negócio dentro de arquivos de `infrastructure/`.
- Chamadas de API em loop (`for` disparando `fetch` por item).
- Dependência direta de `infrastructure` dentro de `domain` ou `application`.
