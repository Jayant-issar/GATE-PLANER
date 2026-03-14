import mongoose, { Document, Schema } from 'mongoose';

export type RevisionStatus = 'pending' | 'completed' | 'overdue';

export interface IRevisionSchedule extends Document {
  userId: mongoose.Types.ObjectId;
  lectureId?: mongoose.Types.ObjectId;
  topicId?: mongoose.Types.ObjectId;
  subjectId?: mongoose.Types.ObjectId;
  nextRevisionDate: Date;
  intervalLevel: number;
  status: RevisionStatus;
  createdAt: Date;
  updatedAt: Date;
}

const RevisionScheduleSchema = new Schema<IRevisionSchedule>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    lectureId: {
      type: Schema.Types.ObjectId,
      ref: 'Lecture',
    },
    topicId: {
      type: Schema.Types.ObjectId,
      ref: 'Topic',
    },
    subjectId: {
      type: Schema.Types.ObjectId,
      ref: 'Subject',
    },
    nextRevisionDate: {
      type: Date,
      required: true,
      index: true,
    },
    intervalLevel: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'overdue'],
      default: 'pending',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

RevisionScheduleSchema.index({ userId: 1, lectureId: 1 }, { unique: true, sparse: true });

export default mongoose.models.RevisionSchedule ||
  mongoose.model<IRevisionSchedule>('RevisionSchedule', RevisionScheduleSchema);
