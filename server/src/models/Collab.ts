import mongoose, { Document, Schema } from 'mongoose';

export interface ICollaborator extends Document {
  name: string;
  email: string;
  role: string;
  status: 'active' | 'pending' | 'inactive';
  joinDate: Date;
  userId: mongoose.Types.ObjectId;
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
  email: {
    type: String,
    required: [true, 'Email is required'],
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
  },
  role: {
    type: String,
    required: [true, 'Role is required'],
    enum: ['Writer', 'Editor', 'Reviewer', 'Admin'],
    default: 'Writer'
  },
  status: {
    type: String,
    enum: ['active', 'pending', 'inactive'],
    default: 'pending'
  },
  joinDate: {
    type: Date,
    default: Date.now
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Compound index to ensure unique collaborators per user
CollaboratorSchema.index({ email: 1, userId: 1 }, { unique: true });

export default mongoose.model<ICollaborator>('Collaborator', CollaboratorSchema);