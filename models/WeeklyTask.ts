import mongoose, { Schema, Document } from 'mongoose';

export interface IWeeklyTask extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  type: 'lecture' | 'pyq' | 'revision' | 'mock_test';
  durationMinutes: number;
  completed: boolean;
  date: Date;
  subjectId?: string;
  topicId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const WeeklyTaskSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['lecture', 'pyq', 'revision', 'mock_test'],
      required: true,
    },
    durationMinutes: {
      type: Number,
      required: true,
    },
    completed: {
      type: Boolean,
      default: false,
    },
    date: {
      type: Date,
      required: true,
    },
    subjectId: {
      type: String,
    },
    topicId: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.WeeklyTask || mongoose.model<IWeeklyTask>('WeeklyTask', WeeklyTaskSchema);
