import mongoose, { Schema, Document } from 'mongoose';

export interface IMockTest extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  date: Date;
  type: 'full' | 'partial';
  subjectIds: mongoose.Types.ObjectId[];
  topicIds: mongoose.Types.ObjectId[];
  totalMarks: number;
  marksObtained: number;
  totalQuestions: number;
  correctQuestions: number;
  wrongQuestions: number;
  unattemptedQuestions: number;
  accuracy: number;
  durationMinutes: number;
  createdAt: Date;
  updatedAt: Date;
}

const MockTestSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    type: {
      type: String,
      enum: ['full', 'partial'],
      required: true,
    },
    subjectIds: {
      type: [
        {
          type: Schema.Types.ObjectId,
          ref: 'Subject',
        },
      ],
      default: [],
    },
    topicIds: {
      type: [
        {
          type: Schema.Types.ObjectId,
          ref: 'Topic',
        },
      ],
      default: [],
    },
    totalMarks: {
      type: Number,
      required: true,
    },
    marksObtained: {
      type: Number,
      required: true,
    },
    totalQuestions: {
      type: Number,
      required: true,
    },
    correctQuestions: {
      type: Number,
      required: true,
      default: 0,
    },
    wrongQuestions: {
      type: Number,
      required: true,
      default: 0,
    },
    unattemptedQuestions: {
      type: Number,
      required: true,
      default: 0,
    },
    accuracy: {
      type: Number,
      required: true,
      default: 0,
    },
    durationMinutes: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.MockTest || mongoose.model<IMockTest>('MockTest', MockTestSchema);
