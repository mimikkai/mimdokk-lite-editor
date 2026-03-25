# Bun Backend — DOCX Template API

**Mode:** Fast
**Created:** 2026-03-25
**Branch:** main (fast mode — no branch)

## Settings

- **Testing:** yes (bun:test)
- **Logging:** standard — console.info для запросов, console.debug для операций
- **Docs:** no

## Research Context

Topic: Добавить Bun HTTP бекенд с API для генерации DOCX по URI параметрам

Goal:
- API загрузки шаблона (docx → base64 → SQLite)
- GET /api/generate/:id?param1=val → скачать заполненный .docx

Constraints:
- Один package.json, server/ папка
- bun:sqlite (встроен), без внешней БД
- Без аутентификации
- Шаблоны как base64 TEXT в SQLite

Decisions:
- Dev: Vite :5173 + proxy /api → Bun :3000
- Prod: Bun serve dist/ + /api/* на одном порту
- UUID для template id
- Логика extract/render портируется из src/workers/mimdokk.worker.ts

## Tasks

### Phase 1: Зависимости и база данных

- [ ] Task 4 — Установить зависимости (concurrently, проверить pizzip/docxtemplater)
- [ ] Task 5 — Создать `server/db.ts` — bun:sqlite, таблица templates
- [ ] Task 6 — Создать `server/lib/docx.ts` — extract/render (порт из worker)

### Phase 2: API маршруты

- [ ] Task 7 — Создать `server/routes/templates.ts` — POST/GET /api/templates
- [ ] Task 8 — Создать `server/routes/generate.ts` — GET /api/generate/:id
- [ ] Task 9 — Создать `server/index.ts` — Bun.serve() с роутингом и static serve

### Phase 3: Dev интеграция

- [ ] Task 10 — Обновить `vite.config.ts` (proxy) и `package.json` (скрипты dev/start)

### Phase 4: Тесты

- [ ] Task 11 — `server/tests/templates.test.ts` — тесты POST/GET /api/templates
- [ ] Task 12 — `server/tests/generate.test.ts` — тесты GET /api/generate/:id

## Affected Files

| Файл | Действие |
|------|----------|
| `server/index.ts` | создать |
| `server/db.ts` | создать |
| `server/lib/docx.ts` | создать |
| `server/routes/templates.ts` | создать |
| `server/routes/generate.ts` | создать |
| `server/tests/templates.test.ts` | создать |
| `server/tests/generate.test.ts` | создать |
| `vite.config.ts` | изменить (добавить proxy) |
| `package.json` | изменить (добавить скрипты + concurrently) |
| `bun.lock` | обновить |

## Commit Plan

**Checkpoint 1** — после Task 6:
```
feat(server): initialize SQLite db and docx processing lib
```

**Checkpoint 2** — после Task 9:
```
feat(server): add templates and generate API endpoints with Bun HTTP server
```

**Checkpoint 3** — после Task 10:
```
feat: connect frontend and backend via vite proxy and dev scripts
```

**Checkpoint 4** — после Task 12:
```
test(server): add API endpoint tests with bun:test
```
