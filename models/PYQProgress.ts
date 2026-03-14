import mongoose, { Document, Schema } from 'mongoose';

export interface IPYQProgress extends Document {
  userId: mongoose.Types.ObjectId;
  subjectId: mongoose.Types.ObjectId;
  topicId: mongoose.Types.ObjectId;
  totalQuestions: number;
  solvedQuestions: number;
  correctQuestions: number;
  incorrectQuestions: number;
  bookmarkedQuestions: number;
  totalTimeMinutes: number;
  createdAt: Date;
  updatedAt: Date;
}

const PYQProgressSchema = new Schema<IPYQProgress>(
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
    totalQuestions: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    solvedQuestions: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    correctQuestions: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    incorrectQuestions: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    bookmarkedQuestions: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    totalTimeMinutes: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

PYQProgressSchema.index({ userId: 1, topicId: 1 }, { unique: true });

export default mongoose.models.PYQProgress ||
  mongoose.model<IPYQProgress>('PYQProgress', PYQProgressSchema);
