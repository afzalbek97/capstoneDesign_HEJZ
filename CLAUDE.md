# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**U-STAR (유스타)** is a generative AI-based music generation and emotion-linked dance choreography recommendation community platform for middle/high school students. The repo is a monorepo with two independently-runnable apps:

- `HEJZ_front/` — React Native (TypeScript, Expo) mobile app
- `HEJZ_back/` — Spring Boot 3.3 (Java 17) REST API

External services: **SUNO API** (music generation), **OpenAI GPT** (lyrics emotion analysis), **AWS S3** (file storage), **MySQL 8** (database).

## Commands

### Frontend (`HEJZ_front/`)
```bash
npm start           # Start Metro dev server
npm run android     # Build & run on Android emulator
npm run ios         # Build & run on iOS simulator
npm run lint        # ESLint
npm test            # Jest
```

### Backend (`HEJZ_back/`)
```bash
./gradlew build -x test   # Build JAR (skip tests)
./gradlew test            # Run JUnit tests
./gradlew bootRun         # Run locally (requires MySQL running)

# Docker (from HEJZ_back/)
docker-compose up -d      # Start MySQL + Spring Boot (needs .env)
docker-compose down
```

The backend requires a `.env` file alongside `docker-compose.yml` with: `MYSQL_DATABASE`, `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_ROOT_PASSWORD`, `OPENAI_API_KEY`, `OPENAI_API_MODEL`, `SUNO_API_KEY`, `AWS_ACCESS_KEY`, `AWS_SECRET_KEY`, `CLOUD_AWS_S3_BUCKET`, `CLOUD_AWS_REGION_STATIC`, `JWT_SECRET`, `JWT_EXPIRES_MS`.

## Architecture

### Frontend
- **Navigation**: React Navigation (native-stack + bottom-tabs) with three main domains: Song, Dance, Community
- **API layer**: `src/api/` — thin wrappers over `http.ts` (base fetch) with `baseUrl.ts` pointing to `BASE_URL` from `.env`
- **Auth**: JWT stored via AsyncStorage, injected as `Authorization: Bearer` header by the HTTP layer
- **Local persistence**: SQLite via `src/db/` for offline data; AsyncStorage for preferences/token
- **State**: React Context (`src/context/`) — no Redux/Zustand

### Backend
Domain-driven package layout under `com.HEJZ.HEJZ_back`:

| Package | Responsibility |
|---|---|
| `domain/music` | SUNO API orchestration, saved song CRUD |
| `domain/dance` | GPT emotion analysis of lyrics → dance motion recommendation |
| `domain/community/feed` | Posts, likes, scheduled feed recommendations |
| `domain/community/user` | Auth (JWT issue/validate), user profiles |
| `domain/community/follow` | Follow relationships |
| `domain/community/file` | S3 upload/download |
| `domain/community/search` | Search |
| `domain/community/recommendation` | Event-driven like → recommendation pipeline |
| `global/` | Security config, JWT filter, CORS, Swagger, S3 config, exception handlers, `ApiResponse` wrapper |

**Key architectural patterns:**
- All responses are wrapped in `ApiResponse` (data + message + status)
- JWT is stateless; `JwtAuthenticationFilter` validates every request
- Feed recommendations run on a Spring `@Scheduled` task; individual like events fire Spring application events caught by a listener in `domain/community/recommendation`
- Dance choreography data is loaded from CSV via `CsvLoader` utility at startup
- Active Spring profile is `dev`; `application-dev.yml` holds DB, JPA, Swagger, AWS, and JWT config

### API Communication
- Backend listens on port `8080`; frontend `BASE_URL` is typically `http://[LAN_IP]:8080` during development
- Key REST prefixes: `/song/*`, `/suno/*`, `/motion/*`, `/emotion/*`, `/selection/*`, `/feed/*`, `/user/*`, `/follow/*`, `/search/*`, `/like/*`, `/file/*`
- MySQL is exposed on host port `3310` (mapped from container `3306`)
