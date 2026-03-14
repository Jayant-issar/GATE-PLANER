import mongoose, { Schema, Document } from 'mongoose';

export interface ILecture extends Document {
  userId: mongoose.Types.ObjectId;
  subjectId: mongoose.Types.ObjectId;
  topicId?: mongoose.Types.ObjectId;
  title: string;
  durationMinutes: number;
  status: 'pending' | 'in_progress' | 'completed';
  dateCompleted?: Date;
  notes?: string;
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
      type: Schema.Types.ObjectId,
      ref: 'Subject',
      required: true,
    },
    topicId: {
      type: Schema.Types.ObjectId,
      ref: 'Topic',
    },
    durationMinutes: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed'],
      default: 'pending',
    },
    dateCompleted: {
      type: Date,
    },
    notes: {
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
