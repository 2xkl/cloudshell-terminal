# CloudShell - Infrastructure

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         CloudShell                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐    │
│  │   Frontend   │────▶│   Backend    │────▶│  PostgreSQL  │    │
│  │  React+Vite  │     │   Express    │     │    (RBAC)    │    │
│  │   :3000      │     │    :4000     │     │    :5432     │    │
│  └──────────────┘     └──────┬───────┘     └──────────────┘    │
│                              │                                   │
│                              ▼                                   │
│                       ┌──────────────┐     ┌──────────────┐    │
│                       │    Redis     │     │ Build Agent  │    │
│                       │  (sessions)  │     │  (RHEL-based)│    │
│                       │    :6379     │     │              │    │
│                       └──────────────┘     └──────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Services

### PostgreSQL 16 (Alpine)
- **Purpose**: Persistent storage for RBAC (users, roles, permissions) and terminal state
- **Port**: 5432
- **Credentials**: cloudshell / cloudshell_secret
- **Database**: cloudshell
- **Volume**: postgres_data (persistent)

### Redis 7 (Alpine)
- **Purpose**: Session storage, caching
- **Port**: 6379
- **Volume**: redis_data (persistent)

### Backend (Express + TypeScript)
- **Port**: 4000
- **Framework**: Express.js with TypeScript
- **ORM**: Prisma
- **Auth**: JWT tokens (24h expiry)

### Frontend (React + Vite)
- **Port**: 3000
- **Framework**: React 18 with TypeScript
- **Styling**: TailwindCSS
- **State**: Zustand + TanStack Query

### Build Agent (RHEL-based)
- **Purpose**: CI/CD build environment
- **Base**: RHEL-compatible image
- **Tools**: Node.js, GCC, Python

## Environment Variables

### Backend
```env
NODE_ENV=development
DATABASE_URL=postgresql://cloudshell:cloudshell_secret@localhost:5432/cloudshell
REDIS_URL=redis://localhost:6379
JWT_SECRET=super_secret_jwt_key_change_in_production
PORT=4000
```

### Frontend
```env
VITE_API_URL=http://localhost:4000
```

## Local Development Setup

### Prerequisites
- Docker Desktop (or Docker + Docker Compose)
- Node.js 22 LTS
- npm 10+

### Option 1: Docker Compose (Full Stack)

```bash
# Start all services
cd docker
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Option 2: Local Development (Recommended for coding)

```bash
# 1. Start only database services
cd docker
docker-compose up -d postgres redis

# 2. Install backend dependencies
cd ../src/backend
npm install

# 3. Run database migrations
npm run db:push

# 4. Seed database with demo users
npm run db:seed

# 5. Start backend (dev mode with hot reload)
npm run dev

# 6. In another terminal - install frontend dependencies
cd ../src/frontend
npm install

# 7. Start frontend (dev mode with hot reload)
npm run dev
```

### Access Points
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:4000
- **Prisma Studio**: `npm run db:studio` (port 5555)

### Demo Users (after seeding)
| Email | Password | Role |
|-------|----------|------|
| admin@cloudshell.local | admin123 | admin |
| operator@cloudshell.local | operator123 | operator |
| viewer@cloudshell.local | viewer123 | viewer |

## Database Schema

```prisma
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  password  String
  name      String
  roleId    String
  role      Role     @relation(fields: [roleId], references: [id])
  terminals Terminal[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Role {
  id          String           @id @default(uuid())
  name        String           @unique
  permissions RolePermission[]
  users       User[]
}

model Permission {
  id    String           @id @default(uuid())
  name  String           @unique  // format: "resource:action"
  roles RolePermission[]
}

model Terminal {
  id         String     @id @default(uuid())
  name       String
  status     String     @default("stopped")
  state      Json       // { workingDir, environment, fileSystem }
  userId     String
  user       User       @relation(fields: [userId], references: [id])
  snapshots  Snapshot[]
  createdAt  DateTime   @default(now())
  updatedAt  DateTime   @updatedAt
}

model Snapshot {
  id         String   @id @default(uuid())
  name       String
  state      Json
  terminalId String
  terminal   Terminal @relation(fields: [terminalId], references: [id])
  createdAt  DateTime @default(now())
}
```

## Network Architecture

All services communicate over Docker bridge network `cloudshell-network`:
- Frontend → Backend: HTTP (port 4000)
- Backend → PostgreSQL: TCP (port 5432)
- Backend → Redis: TCP (port 6379)

## Health Checks

| Service | Health Check | Interval |
|---------|--------------|----------|
| PostgreSQL | `pg_isready -U cloudshell` | 5s |
| Redis | `redis-cli ping` | 5s |

## Production Deployment: Railway (Free Tier)

Railway oferuje $5/miesiąc kredytu za darmo - wystarczy na projekt certyfikacyjny.

### Krok 1: Utwórz projekt na Railway

1. Wejdź na https://railway.app i zaloguj się przez GitHub
2. Kliknij **"New Project"** → **"Deploy from GitHub repo"**
3. Wybierz repozytorium `przeprogramowani`

### Krok 2: Dodaj PostgreSQL

1. W projekcie kliknij **"+ New"** → **"Database"** → **"PostgreSQL"**
2. Railway automatycznie utworzy zmienną `DATABASE_URL`

### Krok 3: Wdróż Backend

1. Kliknij **"+ New"** → **"GitHub Repo"** → wybierz repo
2. W ustawieniach serwisu:
   - **Root Directory**: `src/backend`
   - **Build Command**: (Railway użyje Dockerfile)
3. Dodaj zmienne środowiskowe:
   ```
   JWT_SECRET=your_secure_random_string_here
   NODE_ENV=production
   ```
4. Railway automatycznie połączy `DATABASE_URL` z PostgreSQL
5. Po deployu skopiuj URL backendu (np. `https://cloudshell-backend-xxx.up.railway.app`)

### Krok 4: Wdróż Frontend

1. Kliknij **"+ New"** → **"GitHub Repo"** → wybierz repo
2. W ustawieniach serwisu:
   - **Root Directory**: `src/frontend`
3. Dodaj zmienną środowiskową:
   ```
   VITE_API_URL=https://cloudshell-backend-xxx.up.railway.app
   ```
   (użyj URL backendu z kroku 3)

### Krok 5: Uruchom migracje i seed

W terminalu Railway (Backend service → "Connect" → "Railway CLI"):
```bash
npx prisma db push
npx tsx prisma/seed.ts
```

Lub przez Railway CLI lokalnie:
```bash
npm install -g @railway/cli
railway login
railway link
railway run -s backend npx prisma db push
railway run -s backend npx tsx prisma/seed.ts
```

### Krok 6: Wygeneruj domeny publiczne

1. Backend: Settings → Networking → Generate Domain
2. Frontend: Settings → Networking → Generate Domain

### Gotowe!

Twoja aplikacja jest dostępna pod publicznym URL:
- Frontend: `https://cloudshell-frontend-xxx.up.railway.app`
- Backend API: `https://cloudshell-backend-xxx.up.railway.app`

### Railway CLI (alternatywa)

```bash
# Instalacja
npm install -g @railway/cli

# Logowanie
railway login

# Inicjalizacja w repozytorium
cd /path/to/przeprogramowani
railway init

# Linkowanie do istniejącego projektu
railway link

# Deploy
railway up
```

## Troubleshooting

### Database connection failed
```bash
# Check if PostgreSQL is running
docker-compose ps postgres

# Check logs
docker-compose logs postgres

# Reset database
docker-compose down -v
docker-compose up -d postgres redis
```

### Port already in use
```bash
# Find process using port
lsof -i :4000
lsof -i :3000

# Kill process
kill -9 <PID>
```

### Prisma migration issues
```bash
# Reset database and regenerate
cd src/backend
npx prisma migrate reset
npm run db:seed
```
