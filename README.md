# GATE CS Planner

GATE CS Planner is a Next.js application for managing long-term GATE Computer Science preparation. The product combines planning, study tracking, and performance analysis in one authenticated workspace.

## Current State

The repository already contains:
- a working Next.js App Router frontend
- login and registration backed by NextAuth credentials and MongoDB
- Mongo-backed CRUD APIs for all core study-tracking modules
- authenticated pages for dashboard, weekly planner, syllabus, lectures, PYQs, mock tests, mistakes, revision, analytics, settings, and study sessions
- dashboard aggregation, weak-topic analytics, revision scheduling, and study-session tracking
- Dockerized MongoDB for local development
- Jest route-handler tests that exercise the backend APIs against a Mongo test database

Right now the app is best described as a Mongo-backed MVP with the main product surfaces implemented and tested.

## Canonical Architecture

- Frontend: Next.js 15 App Router, React 19, Tailwind CSS, Recharts
- Backend: Next.js route handlers
- Database: MongoDB with Mongoose
- Auth: NextAuth credentials provider
- Deployment target: Vercel
- Local database: Dockerized MongoDB via `docker compose up -d mongo`
- Backend tests: Jest route-handler tests against the Mongo container

## Canonical Domain Model

The backend currently uses the following entities as the source of truth.

### User
- `name`
- `email`
- `password`
- `targetYear`
- `dailyStudyHoursGoal`

### UserSettings
- `userId`
- `targetYear`
- `dailyStudyHoursGoal`
- `timezone`
- `weekStartsOn`

### Subject
- `userId`
- `name`
- `color`
- `displayOrder`
- `isArchived`

### Topic
- `userId`
- `subjectId`
- `name`
- `status`
- `displayOrder`
- `isArchived`

### Lecture
- `userId`
- `subjectId`
- `topicId`
- `title`
- `durationMinutes`
- `status`
- `dateCompleted`
- `notes`
- `needsRevision`

### WeeklyTask

This is the scheduled task entity used by the weekly planner and dashboard.

- `userId`
- `title`
- `type`
- `status`
- `scheduledFor`
- `estimatedMinutes`
- `displayOrder`
- `subjectId`
- `topicId`
- `lectureId`
- `mockTestId`

### PYQProgress
- `userId`
- `subjectId`
- `topicId`
- `totalQuestions`
- `solvedQuestions`
- `correctQuestions`
- `incorrectQuestions`
- `bookmarkedQuestions`
- `totalTimeMinutes`

### MockTest
- `userId`
- `name`
- `date`
- `type`
- `subjectIds`
- `topicIds`
- `totalMarks`
- `marksObtained`
- `totalQuestions`
- `correctQuestions`
- `wrongQuestions`
- `unattemptedQuestions`
- `accuracy`
- `durationMinutes`

### Mistake
- `userId`
- `date`
- `source`
- `subjectId`
- `topicId`
- `questionDescription`
- `mistakeType`
- `whatWentWrong`
- `learning`
- `isRepeated`
- `status`

### RevisionSchedule
- `userId`
- `subjectId`
- `topicId`
- `lectureId`
- `nextRevisionDate`
- `intervalLevel`
- `status`

### StudySession
- `userId`
- `title`
- `subjectId`
- `topicId`
- `startedAt`
- `endedAt`
- `durationMinutes`
- `notes`
- `source`

## Implemented Feature Surface

- Dashboard with backend aggregates for tasks, revisions, mock tests, study sessions, weak topics, and heatmap data
- Weekly planner backed by `WeeklyTask`
- Syllabus management backed by `Subject` and `Topic`
- Lecture tracking backed by `Lecture`
- PYQ tracking backed by `PYQProgress`
- Mock-test tracking backed by `MockTest`
- Mistake notebook backed by `Mistake`
- Revision queue backed by `RevisionSchedule`
- Weak-topic analytics backed by PYQ, mistake, and time-efficiency signals
- Settings persistence backed by `UserSettings`
- Study-session logging backed by `StudySession`

## API Surface

### Auth
- `POST /api/auth/register`
- `POST /api/auth/[...nextauth]`

### Syllabus
- `GET /api/subjects`
- `POST /api/subjects`
- `PATCH /api/subjects/:id`
- `DELETE /api/subjects/:id`
- `GET /api/topics`
- `POST /api/topics`
- `PATCH /api/topics/:id`
- `DELETE /api/topics/:id`

### Tracking
- `GET /api/lectures`
- `POST /api/lectures`
- `PATCH /api/lectures/:id`
- `DELETE /api/lectures/:id`
- `GET /api/weekly-tasks`
- `POST /api/weekly-tasks`
- `PATCH /api/weekly-tasks/:id`
- `DELETE /api/weekly-tasks/:id`
- `GET /api/pyqs`
- `POST /api/pyqs`
- `PATCH /api/pyqs/:id`
- `DELETE /api/pyqs/:id`
- `GET /api/mock-tests`
- `POST /api/mock-tests`
- `PATCH /api/mock-tests/:id`
- `DELETE /api/mock-tests/:id`
- `GET /api/mistakes`
- `POST /api/mistakes`
- `PATCH /api/mistakes/:id`
- `DELETE /api/mistakes/:id`

### Aggregation and workflows
- `GET /api/dashboard`
- `GET /api/revisions`
- `POST /api/revisions/:id/complete`
- `GET /api/analytics/weak-topics`
- `GET /api/settings`
- `PATCH /api/settings`
- `GET /api/study-sessions`
- `POST /api/study-sessions`
- `PATCH /api/study-sessions/:id`
- `DELETE /api/study-sessions/:id`

## Testing

Backend coverage is handled with Jest route-handler tests under `tests/`. The current suite covers:

- registration and auth validation
- subjects and topics CRUD
- lectures CRUD
- weekly planner tasks
- PYQs, mock tests, mistakes, and dashboard aggregation
- revision scheduling and weak-topic analytics
- settings persistence
- study-session lifecycle and dashboard integration

The test suite runs against MongoDB, using the Docker container defined in `docker-compose.yml`.

## Local Setup

1. Copy `.env.example` to `.env.local`.
2. Start MongoDB with `docker compose up -d mongo`.
3. Run the app with `npm run dev`.
4. Run backend API tests with `npm test`.

## Recommended Next Steps

1. Add automatic daily-plan generation from weekly tasks, due revisions, weak topics, and user settings.
2. Add richer analytics trends over time using study sessions, PYQ accuracy, and mock-test history.
3. Strengthen API validation with a schema validator such as `zod`.
4. Add frontend integration tests for end-to-end user flows.
