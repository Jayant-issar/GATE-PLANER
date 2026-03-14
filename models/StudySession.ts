import mongoose, { Document, Schema } from 'mongoose';

export interface IStudySession extends Document {
  userId: mongoose.Types.ObjectId;
  subjectId?: mongoose.Types.ObjectId;
  topicId?: mongoose.Types.ObjectId;
  weeklyTaskId?: mongoose.Types.ObjectId;
  title: string;
  notes?: string;
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
    },
    topicId: {
      type: Schema.Types.ObjectId,
      ref: 'Topic',
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
