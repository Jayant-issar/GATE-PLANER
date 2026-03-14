import mongoose, { Document, Schema } from 'mongoose';

export type TopicStatus = 'not_started' | 'learning' | 'revised' | 'mastered';

export interface ITopic extends Document {
  userId: mongoose.Types.ObjectId;
  subjectId: mongoose.Types.ObjectId;
  name: string;
  status: TopicStatus;
  displayOrder: number;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const TopicSchema = new Schema<ITopic>(
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
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['not_started', 'learning', 'revised', 'mastered'],
      default: 'not_started',
    },
    displayOrder: {
      type: Number,
      default: 0,
      min: 0,
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

TopicSchema.index({ userId: 1, subjectId: 1, name: 1 }, { unique: true });

export default mongoose.models.Topic || mongoose.model<ITopic>('Topic', TopicSchema);
