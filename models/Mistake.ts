import mongoose, { Schema, Document } from 'mongoose';

export interface IMistake extends Document {
  userId: mongoose.Types.ObjectId;
  date: Date;
  source: string;
  subjectId: string;
  topicId?: string;
  questionDescription?: string;
  mistakeType: 'calculation' | 'conceptual' | 'silly' | 'formula' | 'misread' | 'time';
  whatWentWrong: string;
  learning: string;
  isRepeated: boolean;
  status: 'needs_review' | 'resolved';
  createdAt: Date;
  updatedAt: Date;
}

const MistakeSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    source: {
      type: String,
      required: true,
    },
    subjectId: {
      type: String,
      required: true,
    },
    topicId: {
      type: String,
    },
    questionDescription: {
      type: String,
    },
    mistakeType: {
      type: String,
      enum: ['calculation', 'conceptual', 'silly', 'formula', 'misread', 'time'],
      required: true,
    },
    whatWentWrong: {
      type: String,
      required: true,
    },
    learning: {
      type: String,
      required: true,
    },
    isRepeated: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ['needs_review', 'resolved'],
      default: 'needs_review',
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Mistake || mongoose.model<IMistake>('Mistake', MistakeSchema);
