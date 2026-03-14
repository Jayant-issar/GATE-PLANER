import mongoose, { Document, Schema } from 'mongoose';

export interface IStudySession extends Document {
  userId: mongoose.Types.ObjectId;
  subjectId: mongoose.Types.ObjectId;
  topicId: mongoose.Types.ObjectId;
  weeklyTaskId?: mongoose.Types.ObjectId;
  title: string;
  notes?: string;
  studyMinutes: number;
  breakMinutes: number;
  totalPeriods: number;
  startedAt: Date;
  endedAt?: Date | null;
  durationMinutes: number;
  createdAt: Date;
  updatedAt: Date;
}

const StudySessionSchema = new Schema<IStudySession>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    subjectId: {
      type: Schema.Types.ObjectId,
      ref: 'Subject',
      required: true,
    },
    topicId: {
      type: Schema.Types.ObjectId,
      ref: 'Topic',
      required: true,
    },
    weeklyTaskId: {
      type: Schema.Types.ObjectId,
      ref: 'WeeklyTask',
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    studyMinutes: {
      type: Number,
      required: true,
      min: 1,
    },
    breakMinutes: {
      type: Number,
      required: true,
      min: 0,
    },
    totalPeriods: {
      type: Number,
      required: true,
      min: 1,
    },
    startedAt: {
      type: Date,
      required: true,
      index: true,
    },
    endedAt: {
      type: Date,
      default: null,
      index: true,
    },
    durationMinutes: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

StudySessionSchema.index(
  { userId: 1, endedAt: 1 },
  { partialFilterExpression: { endedAt: null } }
);

export default mongoose.models.StudySession ||
  mongoose.model<IStudySession>('StudySession', StudySessionSchema);
