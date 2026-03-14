# GATE CS Planner - Architecture & Implementation Plan

## 1. System Architecture
- **Frontend**: Next.js 15+ (App Router), React 19, Tailwind CSS, Recharts (for analytics).
- **Backend**: Next.js API Routes (Serverless functions) acting as the backend.
- **Database**: MongoDB (NoSQL) hosted on MongoDB Atlas.
- **ODM**: Mongoose for schema definition and data validation.
- **Authentication**: NextAuth.js (or simple JWT-based email login) for secure access.
- **Deployment**: Vercel or Google Cloud Run (Dockerized).

## 2. Database Schema (MongoDB / Mongoose)

```javascript
// User Schema
const userSchema = new Schema({
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  name: { type: String },
  targetYear: { type: Number, default: 2027 },
  dailyStudyHoursGoal: { type: Number, default: 4 },
  createdAt: { type: Date, default: Date.now }
});

// Subject Schema
const subjectSchema = new Schema({
  name: { type: String, required: true }, // e.g., "DBMS", "Operating Systems"
  weightage: { type: Number }, // Expected marks in GATE
});

// Topic Schema
const topicSchema = new Schema({
  subjectId: { type: Schema.Types.ObjectId, ref: 'Subject' },
  name: { type: String, required: true },
  status: { type: String, enum: ['not started', 'learning', 'revised', 'mastered'], default: 'not started' },
  userId: { type: Schema.Types.ObjectId, ref: 'User' }
});

// Lecture Schema
const lectureSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  subjectId: { type: Schema.Types.ObjectId, ref: 'Subject' },
  topicId: { type: Schema.Types.ObjectId, ref: 'Topic' },
  lectureNumber: { type: Number },
  title: { type: String },
  durationMinutes: { type: Number },
  status: { type: String, enum: ['pending', 'in-progress', 'completed'], default: 'pending' },
  notes: { type: String },
  revisionNeeded: { type: Boolean, default: false }
});

// WeeklyPlan Schema
const weeklyPlanSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  goals: [{
    subjectId: { type: Schema.Types.ObjectId, ref: 'Subject' },
    targetLectures: { type: Number },
    targetPYQs: { type: Number },
    topicsToRevise: [{ type: Schema.Types.ObjectId, ref: 'Topic' }]
  }],
  status: { type: String, enum: ['active', 'completed'], default: 'active' }
});

// DailyTask Schema
const dailyTaskSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  date: { type: Date, required: true },
  title: { type: String, required: true },
  type: { type: String, enum: ['lecture', 'pyq', 'revision', 'mock_test'] },
  referenceId: { type: Schema.Types.ObjectId }, // Refers to Lecture, Topic, etc.
  estimatedMinutes: { type: Number },
  status: { type: String, enum: ['pending', 'completed'], default: 'pending' },
  order: { type: Number }
});

// PYQProgress Schema
const pyqProgressSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  subjectId: { type: Schema.Types.ObjectId, ref: 'Subject' },
  topicId: { type: Schema.Types.ObjectId, ref: 'Topic' },
  totalQuestionsAttempted: { type: Number, default: 0 },
  correctAnswers: { type: Number, default: 0 },
  timeSpentMinutes: { type: Number, default: 0 },
  mistakes: [{
    questionId: { type: String },
    type: { type: String, enum: ['concept error', 'calculation mistake', 'misread question'] },
    notes: { type: String }
  }],
  date: { type: Date, default: Date.now }
});

// MockTest Schema
const mockTestSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  title: { type: String },
  date: { type: Date, default: Date.now },
  score: { type: Number },
  totalMarks: { type: Number, default: 100 },
  questionsAttempted: { type: Number },
  correct: { type: Number },
  wrong: { type: Number },
  timeSpentMinutes: { type: Number },
  subjectAnalysis: [{
    subjectId: { type: Schema.Types.ObjectId, ref: 'Subject' },
    score: { type: Number },
    timeSpent: { type: Number }
  }]
});

// RevisionSchedule Schema
const revisionScheduleSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  topicId: { type: Schema.Types.ObjectId, ref: 'Topic' },
  nextRevisionDate: { type: Date, required: true },
  intervalLevel: { type: Number, default: 0 }, // 0: 1 day, 1: 3 days, 2: 7 days, 3: 21 days, 4: 60 days
  status: { type: String, enum: ['pending', 'completed', 'overdue'], default: 'pending' }
});

// MistakeLog Schema
const mistakeLogSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  subjectId: { type: Schema.Types.ObjectId, ref: 'Subject' },
  topicId: { type: Schema.Types.ObjectId, ref: 'Topic' },
  description: { type: String, required: true },
  solution: { type: String },
  date: { type: Date, default: Date.now },
  source: { type: String, enum: ['pyq', 'mock_test', 'coaching_material'] }
});

// StudySession Schema
const studySessionSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  startTime: { type: Date, required: true },
  endTime: { type: Date },
  durationMinutes: { type: Number },
  taskId: { type: Schema.Types.ObjectId, ref: 'DailyTask' }
});
```

## 3. API Routes (Next.js App Router)

- `POST /api/auth/login` - Authenticate user
- `POST /api/auth/register` - Register new user
- `GET /api/dashboard` - Aggregate data for the main dashboard (today's tasks, weekly progress, heatmap data)
- `GET /api/weekly-plans` - Get current and past weekly plans
- `POST /api/weekly-plans` - Create a new weekly plan
- `GET /api/daily-tasks?date=YYYY-MM-DD` - Get tasks for a specific day
- `PUT /api/daily-tasks/:id` - Update task status/order
- `GET /api/lectures` - Get lecture tracking data
- `POST /api/lectures` - Log a new lecture
- `GET /api/pyqs` - Get PYQ progress
- `POST /api/pyqs` - Log a PYQ session
- `GET /api/mock-tests` - Get mock test history
- `POST /api/mock-tests` - Submit mock test results
- `GET /api/revisions` - Get due revisions for today
- `POST /api/revisions/:id/complete` - Mark revision complete and schedule next
- `GET /api/analytics/weak-topics` - Get calculated weak topics
- `GET /api/mistakes` - Get mistake notebook entries
- `POST /api/mistakes` - Add a mistake log

## 4. UI Page Structure

- `/` (Dashboard) - Main overview
- `/weekly-planner` - Set and view weekly goals
- `/lectures` - Lecture tracker list and details
- `/pyqs` - PYQ solving tracker and statistics
- `/mock-tests` - Mock test entry and analysis
- `/revision` - Daily revision queue (Spaced Repetition)
- `/analytics` - Detailed charts and study heatmap
- `/mistakes` - Mistake notebook
- `/settings` - User preferences, study hours goal

## 5. Example Dashboard Layout

- **Sidebar (Left)**: Navigation links (Dashboard, Weekly Planner, Lectures, PYQs, Mock Tests, Revision, Analytics, Mistake Notebook, Settings).
- **Main Content (Right)**:
  - **Top Row**: Quick Stats (Hours Studied Today, Weekly Goal Completion %, Next Mock Test).
  - **Middle Row (Split)**:
    - **Left**: Today's Study Plan (Draggable list of tasks with checkboxes).
    - **Right**: Weekly Progress (Progress bars for Lectures, PYQs, Revision).
  - **Bottom Row**:
    - **Left**: Study Heatmap (GitHub-style contribution graph for study hours).
    - **Middle**: Weak Topics Alert (List of top 3 weak topics needing attention).
    - **Right**: Recent Test Scores (Small line chart showing last 5 mock test scores).

## 6. Suggested Algorithms for Weak Topic Detection

**Weighted Scoring Algorithm:**
Calculate a "Weakness Score" for each topic based on three factors:
1. **Accuracy (Weight: 50%)**: `(1 - (Correct PYQs / Total Attempted PYQs)) * 100`
2. **Mistake Frequency (Weight: 30%)**: Number of entries in `MistakeLog` for this topic in the last 30 days.
3. **Time Efficiency (Weight: 20%)**: Average time spent per question compared to the global average or expected time (e.g., if > 3 mins/question, increase weakness score).

*Formula*: `Weakness Score = (0.5 * Inaccuracy %) + (0.3 * Normalized Mistake Count) + (0.2 * Time Penalty)`
Topics with the highest Weakness Score are flagged in the "Weak Topics" section.

## 7. Daily Plan Generation Logic

**Inputs**: Available study hours (e.g., 4 hours), Weekly Goals, Due Revisions, Weak Topics.
**Process**:
1. **Allocate Revision (20% of time)**: Fetch overdue and today's pending revisions from `RevisionSchedule`. Allocate ~45 mins.
2. **Allocate Weekly Goals (60% of time)**:
   - Check pending lectures for the week. Allocate 1-2 lectures (~1.5 hours).
   - Check pending PYQ targets. Allocate a block of PYQs (~1 hour).
3. **Allocate Weak Topics (20% of time)**: Fetch top 1 weak topic. Assign a 30-45 min task to "Review [Weak Topic] concepts or solve specific PYQs".
4. **Task Ordering**:
   - 1st: Revision (Active recall early in the session).
   - 2nd: Heavy cognitive task (Lecture or Weak Topic).
   - 3rd: Practice (PYQs).
5. **Output**: Generate `DailyTask` records for the current date.
