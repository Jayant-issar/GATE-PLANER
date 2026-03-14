import mongoose, { Schema, Document } from 'mongoose';

export interface IWeeklyTask extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  type: 'lecture' | 'pyq' | 'revision' | 'mock_test';
  status: 'pending' | 'completed';
  estimatedMinutes?: number;
  scheduledFor: Date;
  displayOrder: number;
  subjectId?: mongoose.Types.ObjectId;
  topicId?: mongoose.Types.ObjectId;
  lectureId?: mongoose.Types.ObjectId;
  mockTestId?: mongoose.Types.ObjectId;
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
    status: {
      type: String,
      enum: ['pending', 'completed'],
      default: 'pending',
    },
    estimatedMinutes: {
      type: Number,
      min: 0,
    },
    scheduledFor: {
      type: Date,
      required: true,
    },
    displayOrder: {
      type: Number,
      default: 0,
      min: 0,
    },
    subjectId: {
      type: Schema.Types.ObjectId,
      ref: 'Subject',
    },
    topicId: {
      type: Schema.Types.ObjectId,
      ref: 'Topic',
    },
    lectureId: {
      type: Schema.Types.ObjectId,
      ref: 'Lecture',
    },
    mockTestId: {
      type: Schema.Types.ObjectId,
      ref: 'MockTest',
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.WeeklyTask || mongoose.model<IWeeklyTask>('WeeklyTask', WeeklyTaskSchema);
