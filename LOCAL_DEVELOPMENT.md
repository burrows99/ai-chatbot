# Local Development Setup

This document describes how to set up and run the AI Chatbot application using local services instead of cloud providers.

## Services

The `docker-compose.yml` file provides the following local services:

- **PostgreSQL** - Database (port 5432)
- **Redis** - Cache and session storage (port 6379)
- **Redis Insight** - Redis management UI (port 5540)
- **MinIO** - S3-compatible object storage (ports 9000 for API, 9001 for console)

## Prerequisites

- Docker and Docker Compose installed
- Node.js 20+ and pnpm installed
- (Optional) Ollama installed for local AI models

## Quick Start

1. **Start the services:**
   ```bash
   docker-compose up -d
   ```

2. **Configure environment variables:**
   Copy `.env.example` to `.env` and update the values:
   ```bash
   cp .env.example .env
   ```

   Key local development settings:
   ```env
   # Use local storage instead of Vercel Blob
   USE_VERCEL_BLOB=false
   
   # MinIO configuration
   S3_ENDPOINT=http://localhost:9000
   S3_REGION=us-east-1
   S3_ACCESS_KEY_ID=admin
   S3_SECRET_ACCESS_KEY=password123
   S3_BUCKET=uploads
   
   # PostgreSQL
   POSTGRES_URL=postgresql://app:app@localhost:5432/app
   
   # Redis
   REDIS_URL=redis://localhost:6379
   
   # Ollama (if using local AI models)
   OLLAMA_BASE_URL=http://localhost:11434
   ```

3. **Install dependencies:**
   ```bash
   pnpm install
   ```

4. **Run database migrations:**
   ```bash
   pnpm db:migrate
   ```

5. **Start the development server:**
   ```bash
   pnpm dev
   ```

## Service Details

### PostgreSQL
- **Container**: `aix_postgres`
- **Port**: 5432
- **Database**: app
- **User**: app
- **Password**: app
- **Volume**: `db_data` (persisted data)

### Redis
- **Container**: `aix_redis`
- **Port**: 6379
- **Persistence**: AOF enabled
- **Volume**: `redis_data`

### Redis Insight
- **Container**: `aix_redis_insight`
- **Port**: 5540
- **URL**: http://localhost:5540
- **Pre-configured connection** to local Redis

### MinIO
- **Container**: `aix_minio`
- **API Port**: 9000
- **Console Port**: 9001
- **Console URL**: http://localhost:9001
- **Root User**: admin
- **Root Password**: password123
- **Volume**: `minio_data`

The application will automatically create the `uploads` bucket on first use.

## Using Ollama

If you want to use local AI models instead of cloud providers:

1. **Install Ollama:**
   ```bash
   # macOS
   brew install ollama
   
   # Linux
   curl https://ollama.ai/install.sh | sh
   ```

2. **Start Ollama service:**
   ```bash
   ollama serve
   ```

3. **Pull a model:**
   ```bash
   ollama pull llama2
   # or
   ollama pull mistral
   ```

4. **Configure the application:**
   Update `lib/ai/providers.ts` to use Ollama models. The base URL is already configured via `OLLAMA_BASE_URL` environment variable.

## Storage Abstraction

The application uses `lib/storage/blob.ts` which provides a unified interface for both Vercel Blob and local MinIO storage:

- When `USE_VERCEL_BLOB=true`: Uses Vercel Blob Storage
- When `USE_VERCEL_BLOB=false` or unset: Uses local MinIO

The API is compatible with Vercel's `@vercel/blob` package, making it easy to switch between local and cloud storage.

## Managing Services

### Start services
```bash
docker-compose up -d
```

### Stop services
```bash
docker-compose down
```

### View logs
```bash
docker-compose logs -f [service_name]
```

### Remove all data (reset)
```bash
docker-compose down -v
```

## Troubleshooting

### Port conflicts
If you get port conflict errors, check if other services are using the required ports:
```bash
lsof -i :5432  # PostgreSQL
lsof -i :6379  # Redis
lsof -i :9000  # MinIO API
lsof -i :9001  # MinIO Console
```

### MinIO bucket not created
The bucket is created automatically on first upload. If you encounter issues, create it manually via the MinIO console at http://localhost:9001.

### Database connection issues
Ensure PostgreSQL is healthy:
```bash
docker-compose ps postgres
```

Check logs:
```bash
docker-compose logs postgres
```

## Production Deployment

For production deployments, continue using the cloud services (Vercel Blob, Vercel Postgres, Vercel Redis, AI Gateway). The local services are intended for development only.
