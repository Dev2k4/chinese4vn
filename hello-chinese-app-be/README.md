# Hello Chinese Backend

## Quick start

1) Copy env file

```bash
cp .env.example .env
```

2) Install deps

```bash
npm install
```

3) Prisma generate

```bash
npm run prisma:generate
```

4) Run dev server

```bash
npm run start:dev
```

Server will start at `http://localhost:4000`.

## Tech stack

- NestJS + TypeScript
- PostgreSQL (Prisma)
- MinIO for media storage

## API docs

See [API.md](API.md).
