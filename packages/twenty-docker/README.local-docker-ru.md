# Как запустить Twenty локально через Docker (очень подробный гайд)

Ниже — инструкция «для новичка», чтобы запустить систему локально без ручной установки Node.js/PostgreSQL/Redis.

## Что мы будем запускать

В Docker Compose для Twenty поднимаются 4 сервиса:

- `server` — веб-приложение (открывается в браузере на `http://localhost:3000`)
- `worker` — фоновый обработчик задач
- `db` — PostgreSQL база данных
- `redis` — Redis для очередей/кеша

Это уже описано в `docker-compose.yml`, поэтому вручную собирать архитектуру не нужно.

## 0) Что нужно заранее установить

1. **Docker Desktop** (Windows/macOS) или Docker Engine + Docker Compose plugin (Linux).
2. Доступ к терминалу:
   - Windows: PowerShell / Windows Terminal
   - macOS: Terminal
   - Linux: любой shell
3. (Опционально) Git, чтобы клонировать репозиторий.

### Как быстро проверить, что Docker установлен

Откройте терминал и выполните:

```bash
docker --version
docker compose version
```

Если команды выводят версии — всё хорошо.

---

## 1) Склонировать репозиторий и перейти в папку Docker-конфигурации

```bash
git clone https://github.com/twentyhq/twenty.git
cd twenty/packages/twenty-docker
```

> Если репозиторий уже скачан, просто перейдите в `packages/twenty-docker`.

---

## 2) Создать файл `.env` из примера

В папке `packages/twenty-docker` есть файл `.env.example` с базовыми переменными.

Создайте рабочий `.env`:

```bash
cp .env.example .env
```

Для Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

### Минимально важные переменные

Откройте `.env` в любом редакторе и проверьте:

```env
TAG=latest
SERVER_URL=http://localhost:3000
STORAGE_TYPE=local
```

Для локального старта этого достаточно.

### Очень желательно: задать `APP_SECRET`

Сгенерируйте секрет:

```bash
openssl rand -base64 32
```

И добавьте в `.env` строку:

```env
APP_SECRET=<вставьте_сгенерированное_значение>
```

> В `docker-compose.yml` есть fallback `APP_SECRET=replace_me_with_a_random_string`, но в реальной работе лучше задать свой секрет явно.

---

## 3) Запустить контейнеры

В той же папке (`packages/twenty-docker`) выполните:

```bash
docker compose up -d
```

Что произойдёт:

- Docker скачает нужные образы (если их нет локально)
- создаст volume для БД и локальных данных
- запустит `db`, `redis`, затем `server`, затем `worker`

Первый запуск обычно дольше, потому что тянутся образы.

---

## 4) Проверить, что всё поднялось

### Статус контейнеров

```bash
docker compose ps
```

Ожидаемо: сервисы в состоянии `running`/`healthy`.

### Логи (если нужно понять, что происходит)

```bash
docker compose logs -f server
docker compose logs -f worker
docker compose logs -f db
```

Остановить просмотр логов: `Ctrl + C`.

### Проверка health endpoint

```bash
curl http://localhost:3000/healthz
```

Если сервис готов, endpoint должен отвечать без ошибки.

---

## 5) Открыть приложение в браузере

Перейдите на:

- `http://localhost:3000`

Если видите интерфейс Twenty — запуск успешен.

---

## 6) Как остановить/перезапустить

Остановить и удалить контейнеры (данные в volumes сохранятся):

```bash
docker compose down
```

Остановить и удалить контейнеры **вместе с volumes** (осторожно, удалит локальные данные БД):

```bash
docker compose down -v
```

Перезапуск:

```bash
docker compose restart
```

---

## 7) Частые проблемы и что делать

### Проблема: порт `3000` занят

Симптом: ошибка вида `port is already allocated`.

Что делать:

1. Освободить порт 3000 (закрыть другой процесс/контейнер).
2. Или изменить проброс порта у `server` в `docker-compose.yml`, например `3001:3000`, и открывать `http://localhost:3001`.

### Проблема: контейнер `server` постоянно перезапускается

Что проверить:

1. Логи: `docker compose logs -f server`
2. Корректность `.env` (`SERVER_URL`, `APP_SECRET`, БД параметры)
3. Что `db` в состоянии `healthy`: `docker compose ps`

### Проблема: «чистый старт» не помог

Сброс окружения:

```bash
docker compose down -v
docker compose up -d
```

> Это удалит локальные данные в volumes.

---

## 8) Где хранятся данные

В Compose описаны volumes:

- `db-data` — данные PostgreSQL
- `server-local-data` — локальные данные приложения

Пока вы не делаете `docker compose down -v`, эти данные сохраняются между перезапусками.

## 8.1) Передаются ли мои данные «владельцу репозитория»?

Короткий ответ: **нет, автоматически ваши записи из БД не отправляются владельцу репозитория**.

Что происходит на практике:

- База данных (`db`) хранится в Docker volume `db-data` **локально на вашем компьютере**.
- Данные приложения (`server-local-data`) тоже лежат локально в Docker volume.
- Контейнеры сами по себе не «реплицируют» вашу БД кому-то в интернет.

Что всё же может использовать сеть:

- Docker скачивает образы (`twentycrm/twenty`, `postgres`, `redis`) из registry — это нормально и происходит при установке/обновлении.
- Если вы вручную включите внешние интеграции (SMTP, Google/Microsoft OAuth, S3 и т.д.), тогда соответствующие данные могут уходить в эти сервисы, потому что вы сами их подключили.
- Любое ПО внутри контейнера может делать исходящие запросы по своему коду. Если вам нужен строгий офлайн-режим, ограничивайте исходящий трафик правилами фаервола/сетевыми политиками.

Итого: при стандартном локальном запуске из этого `docker-compose.yml` ваши данные остаются у вас локально, а не отправляются «автору GitHub-репозитория» автоматически.

---

## 9) Быстрый «чек-лист» запуска

1. Установить Docker
2. `cd twenty/packages/twenty-docker`
3. `cp .env.example .env`
4. (желательно) задать `APP_SECRET`
5. `docker compose up -d`
6. `docker compose ps`
7. открыть `http://localhost:3000`

Готово ✅
