# Research

Updated: 2026-03-25 14:30
Status: active

## Active Summary (input for /aif-plan)
<!-- aif:active-summary:start -->
Topic: Добавить Bun HTTP бекенд с API для генерации DOCX по URI параметрам

Goal:
- API эндпоинт загрузки шаблона (docx → base64 → SQLite)
- API эндпоинт генерации документа по URL: GET /api/generate/:id?param1=val&param2=val
- Один порт для фронта и бека (dev: Vite proxy, prod: Bun serve static)

Constraints:
- Один package.json (не workspace)
- Бекенд в папке server/ внутри существующего репо
- Без аутентификации (пока)
- bun:sqlite (встроен в Bun, ноль внешних зависимостей)
- Шаблоны хранятся как base64 TEXT в SQLite (поддержка docx с изображениями)

Decisions:
- Хранилище: bun:sqlite, таблица templates (id UUID, name, data base64, tags JSON, created_at)
- Логика render/extract из src/workers/mimdokk.worker.ts переиспользуется на сервере напрямую (чистый Node.js код, Web Worker обёртка не нужна)
- Dev: Vite на :5173, Bun API на :3000, vite.config.ts proxy /api → :3000
- Prod: Bun serve ./dist/ + /api/* на одном порту (3000)
- Template ID: UUID v4 (для безопасного шаринга ссылок)

Open questions:
- Нужен ли GET /api/templates/:id (получить мета шаблона без data)?
- Нужен ли DELETE /api/templates/:id?
- Нужна ли валидация параметров (неизвестные теги → ошибка или игнорировать)?

Success signals:
- GET /api/generate/:id?name=Иван&company=ACME скачивает заполненный .docx
- POST /api/templates принимает base64 docx и возвращает { id, tags }
- bun run dev запускает оба процесса, фронт работает на одном порту

Next step: /aif-plan fast bun backend with docx template API
<!-- aif:active-summary:end -->

## Sessions
<!-- aif:sessions:start -->
### 2026-03-25 14:30 — Bun backend для DOCX API
What changed: Исследована архитектура добавления Bun HTTP бекенда к существующему React+Vite фронту
Key notes:
- Проект генерирует DOCX через Docxtemplater + PizZip в Web Worker
- Worker логика (extract/render) — чистый Node.js, переиспользуется на сервере
- Один package.json, server/ папка внутри репо
- base64 в SQLite — валидный подход, SQLite без проблем хранит строки до десятков MB
- Dev: proxy через vite.config.ts; Prod: Bun serve static dist/
Links (paths):
- src/workers/mimdokk.worker.ts — логика для переиспользования на сервере
- src/lib/db.ts — IndexedDB схема (аналог для SQLite на сервере)
- vite.config.ts — добавить proxy секцию
<!-- aif:sessions:end -->
