# GATE CS Planner

GATE CS Planner is a Next.js application for managing long-term GATE Computer Science preparation. The product combines planning, study tracking, and performance analysis in one authenticated workspace.

## Current State

The repository already contains:
- a working Next.js App Router frontend
- login and registration backed by NextAuth credentials and MongoDB
- feature pages for dashboard, weekly planner, lectures, PYQs, mock tests, mistakes, and syllabus

The repository does not yet contain:
- server-backed CRUD APIs for the study-tracking modules
- persisted syllabus, planner, lecture, PYQ, mock-test, and mistake data
- revision, analytics, and settings pages
- dashboard aggregation from backend data

Right now the app is best described as a frontend MVP with real auth and partial backend scaffolding.

## Canonical Architecture

- Frontend: Next.js 15 App Router, React 19, Tailwind CSS, Recharts
- Backend: Next.js route handlers
- Database: MongoDB with Mongoose
- Auth: NextAuth credentials provider
- Deployment target: Vercel

## Canonical Domain Model

The backend should use the following entities as the source of truth.

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
- `topicId`
- `nextRevisionDate`
- `intervalLevel`
- `status`

## Delivery Roadmap

### Phase 1: Backend foundation
- finalize canonical models
- add shared API/auth/validation utilities
- document consistent field names and route expectations

### Phase 2: Core persistence
- persist syllabus
- persist lectures
- persist weekly tasks
- connect dashboard to stored planner and lecture data

### Phase 3: Tracker persistence
- persist PYQ progress
- persist mock tests
- persist mistakes
- add dashboard aggregation endpoint

### Phase 4: Intelligent workflows
- revision queue
- analytics page
- settings page
- weak-topic scoring
- automatic daily plan generation

## Planned API Surface

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

## Immediate Next Build Order

1. Add persistent subject/topic models and APIs.
2. Rework syllabus state to fetch from the backend instead of `localStorage`.
3. Add lectures CRUD APIs and wire the lectures page to them.
4. Add weekly task CRUD APIs and unify planner/dashboard data flow.
5. Move PYQs, mock tests, and mistakes to the backend.
