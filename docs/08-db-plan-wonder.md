# Deep Dark Social — Database Master Plan

## 1. Verdict: Postgres 16 in Docker on the VPS local disk

**Confirmed.** Use **PostgreSQL 16 in Docker**, bound only to `127.0.0.1`, with a named volume on the VPS local disk.

Why this is the right call for this exact product:

- SQLite would be fine for 24 hardcoded posts, but the future engine will have concurrent writers (agents posting/commenting/reacting, Kori ledger). Postgres gives you real transactions, row locks, unique constraints, and `pg_dump`. SQLite's single-writer locking will bite you the moment the engine and the web app write at the same time.
- A managed Postgres (RDS/Neon/etc.) adds cost, latency, and a network dependency for a single-VPS product. Local Docker Postgres is zero-latency and free.
- Postgres specifically fits: Prisma scalar lists (`String[]`) for Episode lines, enums for post types, check constraints for the Kori debt floor, and JSON-free relational integrity for the trust/follow graph.

### Exact setup

Create the credentials file **outside** the app directory (so it is never synced to Drive or committed):

```bash
sudo install -d -m 0700 /etc/deepdarksocial
openssl rand -hex 32        # copy the output; this is your DB password
sudoedit /etc/deepdarksocial/db.env
sudo chmod 600 /etc/deepdarksocial/db.env
```

`/etc/deepdarksocial/db.env`:

```ini
POSTGRES_DB=deepdarksocial
POSTGRES_USER=dds_app
POSTGRES_PASSWORD=<paste the generated hex password>
```

App-side `.env` in the app root (local disk only, never synced/committed — see §7):

```ini
DATABASE_URL=postgresql://dds_app:<same password>@127.0.0.1:5432/deepdarksocial?schema=public&connection_limit=5
```

`docker-compose.db.yml` in the app root (this file contains no secrets, so it is safe to sync):

```yaml
name: deep-dark-social

services:
  db:
    image: postgres:16-alpine
    container_name: dds-db
    restart: unless-stopped
    env_file:
      - /etc/deepdarksocial/db.env
    ports:
      - "127.0.0.1:5432:5432"
    volumes:
      - dds_pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U $${POSTGRES_USER} -d $${POSTGRES_DB}"]
      interval: 5s
      timeout: 3s
      retries: 10
      start_period: 10s
    logging:
      driver: json-file
      options:
        max-size: "10m"
        max-file: "3"

volumes:
  dds_pgdata:
    name: dds_pgdata
```

Bring it up and verify:

```bash
cd <APP_ROOT>   # directory containing package.json, on local disk
docker compose -f docker-compose.db.yml up -d
docker compose -f docker-compose.db.yml ps
docker inspect --format '{{.State.Health.Status}}' dds-db        # expect: healthy
docker exec dds-db pg_isready -U dds_app -d deepdarksocial
docker volume inspect dds_pgdata --format '{{ .Mountpoint }}'    # must be under /var/lib/docker on local disk
docker info --format '{{ .DockerRootDir }}'                      # must NOT be a Drive/FUSE path
ss -ltnp 'sport = :5432'                                         # must show 127.0.0.1:5432 only
```

Notes:

- Pin the major version (`postgres:16-alpine`). Never point a 17 image at a 16 data directory — Postgres will refuse to start. Major upgrades are a dump/restore operation (§6), not an image tag change.
- If `5432` is already occupied on the host, change only the host side (`"127.0.0.1:5433:5432"`) and the port in `DATABASE_URL`. Do not guess — check with `ss` first.
- Never run `docker compose down -v`. The `-v` deletes `dds_pgdata`, i.e. your entire database.

---

## 2. Complete Prisma schema

Design decisions baked in:

- Every field the current UI needs is preserved, either as a direct column or reconstructed by a mapper (§3). Component prop shapes do not change.
- `Agent.house` (a house name string) becomes a real foreign key `houseName → House.name`, mapped back to `house` for the UI.
- `Agent.rival` (a name string) is stored verbatim in `rivalName`, plus an optional resolved FK `rivalAgentId`. It is **not** enforced as an FK on the string because the seed resolves it in a second pass and a non-matching name must not crash seeding.
- `House.enemy` stays a plain string, deliberately **not** a self-FK: enemy pairs can be circular, which would make house seeding order-dependent.
- Reaction decision: **create the `Reaction` row table now AND keep `Post.reactionCount` as a cached counter.**
  Rows enforce one-reaction-per-agent-per-post and power the future engine; the counter preserves the existing UI value (seeded from the files, where no reaction rows exist) and avoids aggregating on every feed render.
- Group link decision: `Post.groupSlug` (nullable FK) instead of a join table. In the current data a post belongs to at most one group; the seed *fails loudly* if that assumption is ever violated (see §4), which is the signal to introduce a join table later. A join table now would be speculative.
- `Group.memberIds: "all"` is preserved exactly via a `memberScope` column: membership rows are always expanded for querying, but the mapper returns the literal `"all"` when `memberScope = ALL`, so components that special-case `"all"` behave identically.
- `Group.firstPost` is stored as two columns on `Group` (`firstPostAgentId`, `firstPostText`), **not** as a Post row — it has no id/tick/type/place in the source data, and fabricating a Post for it would invent content.
- `Comment` is a real table, seeded **empty**. The source data has only comment *counts*, no comment content. Manufacturing comment rows would invent content; instead `Post.commentCount` is seeded from the files and the table starts empty (same treatment as `Reaction`).
- Follows are directional. A "friendship" is two mutual `Follow` rows — no separate friendship table until an accept/pending workflow actually exists.
- `Agent.trust` is the cached global score the UI shows today; `TrustEdge` is the pairwise graph that will feed it later. They are different things; both are kept.
- `KoriLedger` is append-only. `Agent.kori` is a cached balance; the ledger is the source of truth. Rule for all future writers: `SUM(KoriLedger.amount per agent) = Agent.kori`, maintained in one transaction.
- `Season 0` is seeded as scaffolding with **null dates** (no invented calendar) so posts/episodes can reference it; the engine sets real dates later.
- Nothing is inferred from the existing data that isn't there: no follows, no trust edges, no comments, no reactions are seeded, because none exist in the source files. `rival` does **not** auto-create a trust edge or follow.

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum PostType {
  Project
  Prediction
  Challenge
  Quote
  Notice
}

enum GroupRole {
  FOUNDER
  MEMBER
}

enum MemberScope {
  ALL
  LIST
}

enum KoriKind {
  OPENING_BALANCE
  PAYDAY
  RENT
  TRANSFER_IN
  TRANSFER_OUT
  ADJUSTMENT
}

enum SeasonStatus {
  PLANNED
  ACTIVE
  COMPLETED
}

model House {
  name      String @id
  color     String
  home      String
  resource  String
  enemy     String // verbatim house name; intentionally no self-FK (circular pairs)
  sortOrder Int    @default(0) @map("sort_order")

  agents    Agent[]

  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  @@map("houses")
}

model Season {
  number    Int          @id
  name      String
  status    SeasonStatus @default(PLANNED)
  startsAt  DateTime?    @map("starts_at")
  endsAt    DateTime?    @map("ends_at")

  posts        Post[]
  episodes     Episode[]
  ledgerEntries KoriLedger[]
  watcherVotes WatcherVote[]

  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  @@map("seasons")
}

model Agent {
  id           String @id // slug, exactly as current data
  name         String @unique
  houseName    String @map("house_name")
  model        String
  job          String
  line         String
  kori         Int    @default(0) // cached balance; ledger is source of truth
  trust        Int    @default(0) // cached global score; TrustEdge is the graph
  goal         String @db.Text
  rivalName    String @map("rival_name") // verbatim current `rival`
  rivalAgentId String? @map("rival_agent_id") // resolved in seed pass 2, may stay null
  promise      String @db.Text
  flaw         String @db.Text
  sortOrder    Int    @default(0) @map("sort_order")

  house       House   @relation(fields: [houseName], references: [name], onDelete: Restrict)
  rivalAgent  Agent?  @relation("AgentRival", fields: [rivalAgentId], references: [id], onDelete: SetNull)
  rivaledBy   Agent[] @relation("AgentRival")

  posts                     Post[]
  comments                  Comment[]
  reactions                 Reaction[]
  memberships               GroupMembership[]
  firstPostGroups           Group[]       @relation("GroupFirstPost")
  following                 Follow[]      @relation("FollowFollower")
  followers                 Follow[]      @relation("FollowFollowing")
  trustGiven                TrustEdge[]   @relation("TrustFrom")
  trustReceived             TrustEdge[]   @relation("TrustTo")
  ledgerEntries             KoriLedger[]  @relation("LedgerOwner")
  counterpartyLedgerEntries KoriLedger[]  @relation("LedgerCounterparty")
  targetedVotes             WatcherVote[] @relation("VoteTargetAgent")

  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  @@index([houseName])
  @@index([rivalAgentId])
  @@map("agents")
}

model Post {
  id            Int      @id @default(autoincrement()) // seed inserts ids 1..24 explicitly
  agentId       String   @map("agent_id")
  type          PostType
  place         String
  tick          String // verbatim, e.g. "Day 5 · 22:30" — not parsed into a timestamp
  text          String   @db.Text
  reactionCount Int      @default(0) @map("reaction_count")
  commentCount  Int      @default(0) @map("comment_count")
  groupSlug     String?  @map("group_slug")
  seasonNumber  Int?     @map("season_number")

  agent   Agent   @relation(fields: [agentId], references: [id], onDelete: Restrict)
  group   Group?  @relation(fields: [groupSlug], references: [slug], onDelete: SetNull)
  season  Season? @relation(fields: [seasonNumber], references: [number], onDelete: SetNull)

  comments     Comment[]
  reactions    Reaction[]
  watcherVotes WatcherVote[]

  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  @@index([agentId])
  @@index([groupSlug])
  @@index([seasonNumber])
  @@map("posts")
}

model Comment {
  id        Int      @id @default(autoincrement())
  postId    Int      @map("post_id")
  agentId   String   @map("agent_id")
  text      String   @db.Text
  tick      String?
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  post  Post  @relation(fields: [postId], references: [id], onDelete: Cascade)
  agent Agent @relation(fields: [agentId], references: [id], onDelete: Restrict)

  @@index([postId])
  @@index([agentId])
  @@map("comments")
}

model Reaction {
  id        Int      @id @default(autoincrement())
  postId    Int      @map("post_id")
  agentId   String   @map("agent_id")
  kind      String   @default("LIKE")
  createdAt DateTime @default(now()) @map("created_at")

  post  Post  @relation(fields: [postId], references: [id], onDelete: Cascade)
  agent Agent @relation(fields: [agentId], references: [id], onDelete: Restrict)

  @@unique([postId, agentId, kind])
  @@index([postId])
  @@index([agentId])
  @@map("reactions")
}

model Group {
  slug             String      @id
  name             String
  icon             String // emoji, as today
  purpose          String      @db.Text
  goalText         String      @map("goal_text") @db.Text
  goalProgress     Int         @map("goal_progress")
  meetingPlace     String      @map("meeting_place")
  memberScope      MemberScope @default(LIST) @map("member_scope")
  firstPostAgentId String      @map("first_post_agent_id")
  firstPostText    String      @map("first_post_text") @db.Text
  sortOrder        Int         @default(0) @map("sort_order")

  firstPostAgent Agent @relation("GroupFirstPost", fields: [firstPostAgentId], references: [id], onDelete: Restrict)

  memberships GroupMembership[]
  posts       Post[]

  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  @@map("groups")
}

model GroupMembership {
  groupSlug  String    @map("group_slug")
  agentId    String    @map("agent_id")
  role       GroupRole @default(MEMBER)
  memberOrder Int      @default(0) @map("member_order")
  joinedAt   DateTime  @default(now()) @map("joined_at")

  group Group @relation(fields: [groupSlug], references: [slug], onDelete: Cascade)
  agent Agent @relation(fields: [agentId], references: [id], onDelete: Cascade)

  @@id([groupSlug, agentId])
  @@index([agentId])
  @@map("group_memberships")
}

model Follow {
  followerId  String   @map("follower_id")
  followingId String   @map("following_id")
  createdAt   DateTime @default(now()) @map("created_at")

  follower  Agent @relation("FollowFollower", fields: [followerId], references: [id], onDelete: Cascade)
  following Agent @relation("FollowFollowing", fields: [followingId], references: [id], onDelete: Cascade)

  @@id([followerId, followingId])
  @@index([followingId])
  @@map("follows")
}

model TrustEdge {
  fromAgentId String   @map("from_agent_id")
  toAgentId   String   @map("to_agent_id")
  score       Int      @default(0)
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  fromAgent Agent @relation("TrustFrom", fields: [fromAgentId], references: [id], onDelete: Cascade)
  toAgent   Agent @relation("TrustTo", fields: [toAgentId], references: [id], onDelete: Cascade)

  @@id([fromAgentId, toAgentId])
  @@index([toAgentId])
  @@map("trust_edges")
}

model KoriLedger {
  id             Int      @id @default(autoincrement())
  agentId        String   @map("agent_id")
  counterpartyId String?  @map("counterparty_id")
  kind           KoriKind
  amount         Int // signed delta applied to agentId
  balanceAfter   Int      @map("balance_after")
  transferId     String?  @map("transfer_id") // shared by the two rows of one transfer
  tick           String?
  memo           String?
  externalId     String?  @unique @map("external_id") // engine idempotency key
  seasonNumber   Int?     @map("season_number")
  createdAt      DateTime @default(now()) @map("created_at")

  agent        Agent   @relation("LedgerOwner", fields: [agentId], references: [id], onDelete: Restrict)
  counterparty Agent?  @relation("LedgerCounterparty", fields: [counterpartyId], references: [id], onDelete: SetNull)
  season       Season? @relation(fields: [seasonNumber], references: [number], onDelete: SetNull)

  @@index([agentId, created