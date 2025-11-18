import mongoose, { Document, Schema } from 'mongoose';

export interface IMedia extends Document {
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  path: string;
  uploader: mongoose.Types.ObjectId;
  metadata?: {
    width?: number;
    height?: number;
    duration?: number;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const mediaSchema: Schema = new Schema<IMedia>(
  {
    filename: {
      type: String,
      required: [true, 'Filename is required'],
    },
    originalName: {
      type: String,
      required: [true, 'Original name is required'],
    },
    mimeType: {
      type: String,
      required: [true, 'MIME type is required'],
    },
    size: {
      type: Number,
      required: [true, 'File size is required'],
    },
    url: {
      type: String,
      required: [true, 'File URL is required'],
    },
    path: {
      type: String,
      required: [true, 'File path is required'],
    },
    uploader: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Uploader is required'],
    },
    metadata: {
      width: Number,
      height: Number,
      duration: Number, // for videos
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
mediaSchema.index({ uploader: 1 });
mediaSchema.index({ mimeType: 1 });
mediaSchema.index({ isActive: 1 });
mediaSchema.index({ createdAt: -1 });

export default mongoose.model<IMedia>('Media', mediaSchema);