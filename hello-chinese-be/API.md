# API spec (v1)

Base URL: `/api`

## Auth

- POST `/auth/register`
  - body: `{ email, password, username }`
- POST `/auth/login`
  - body: `{ email, password }`
- POST `/auth/refresh`
  - body: `{ refreshToken }`
- GET `/auth/profile`
  - headers: `Authorization: Bearer <token>`

## Content

- GET `/content/catalog`
  - returns: `ContentCatalogIndex`
- GET `/content/lessons/:lessonId`
  - returns: `ContentLessonBundle`
- GET `/content/mock-tests/:levelId`
  - returns: `MockTest`
- GET `/content/placement-test`
  - returns: `PlacementTest`

## Progress

- POST `/progress/lessons/:lessonId`
  - body: `{ score, totalQuestions, correctAnswers, xpEarned, mistakes }`
- GET `/progress/summary`
  - returns totals and level progress
- GET `/progress/streak`

## Reviews (SRS)

- GET `/reviews/due`
- POST `/reviews/submit`
  - body: `{ items: [{ vocabularyId, quality }] }`

## User

- GET `/users/me`
- PATCH `/users/me/settings`
  - body: `{ mode, targetMinutesPerDay, targetWordsPerDay, currentHskLevel }`

## Media

- POST `/media/presign`
  - body: `{ path, contentType }`
  - returns signed upload URL
