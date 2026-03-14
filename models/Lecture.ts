import mongoose, { Schema, Document } from 'mongoose';

export interface ILecture extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  subjectId: string;
  topicId: string;
  durationMinutes: number;
  status: 'not_started' | 'in_progress' | 'completed';
  dateCompleted?: Date;
  notesUrl?: string;
  needsRevision: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const LectureSchema: Schema = new Schema(
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
    subjectId: {
      type: String,
      required: true,
    },
    topicId: {
      type: String,
      required: true,
    },
    durationMinutes: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['not_started', 'in_progress', 'completed'],
      default: 'not_started',
    },
    dateCompleted: {
      type: Date,
    },
    notesUrl: {
      type: String,
    },
    needsRevision: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Lecture || mongoose.model<ILecture>('Lecture', LectureSchema);
