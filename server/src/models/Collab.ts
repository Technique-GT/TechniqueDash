import mongoose, { Document, Schema } from 'mongoose';

export interface ICollaborator extends Document {
  name: string;
  title: string;
  email?: string;
  status: 'active' | 'inactive';
  joinDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

const CollaboratorSchema: Schema = new Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    sparse: true, // Allows multiple null values
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  joinDate: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for better search performance
CollaboratorSchema.index({ name: 1 });
CollaboratorSchema.index({ status: 1 });

export default mongoose.model<ICollaborator>('Collaborator', CollaboratorSchema);