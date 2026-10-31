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

## Production Deployment: Render (Free Tier)

Render offers a free tier with PostgreSQL (90 days) and web services.

### Quick Deploy with Blueprint

1. Go to https://render.com and sign up with GitHub
2. Click **New** → **Blueprint**
3. Connect your repository
4. Render will detect `render.yaml` and create all services
5. Click **Apply**

### Services Created

- **cloudshell-db**: PostgreSQL database (free tier)
- **cloudshell-backend**: Node.js API server (free tier, sleeps after 15 min)
- **cloudshell-frontend**: Static site (free tier)

### Environment Variables

Backend (auto-configured):
- `DATABASE_URL` - Connected to PostgreSQL
- `JWT_SECRET` - Auto-generated
- `NODE_ENV` - production

Frontend:
- `VITE_API_URL` - Update to backend URL after deploy

### Post-Deploy Steps

1. Copy backend URL (e.g., `https://cloudshell-backend-xxxx.onrender.com`)
2. Update frontend `VITE_API_URL` environment variable
3. Trigger frontend redeploy

### Access

- Frontend: `https://cloudshell-frontend-xxxx.onrender.com`
- Backend API: `https://cloudshell-backend-xxxx.onrender.com`

### Default Users (seeded automatically)

| Email | Password | Role |
|-------|----------|------|
| admin@cloudshell.local | admin123 | admin |
| operator@cloudshell.local | operator123 | operator |
| viewer@cloudshell.local | viewer123 | viewer |

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
