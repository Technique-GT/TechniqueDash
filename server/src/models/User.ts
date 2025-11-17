import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IUser extends Document {
  _id: Types.ObjectId;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  phoneNumber: string;
  password: string;
  status: 'active' | 'inactive' | 'invited' | 'suspended';
  role: 'superadmin' | 'admin' | 'writer' | 'editor';
  createdAt: Date;
  updatedAt: Date;
}

const userSchema: Schema = new Schema<IUser>(
  {
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
    },
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
      lowercase: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    phoneNumber: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false, // Don't return password by default
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'invited', 'suspended'],
      default: 'active',
    },
    role: {
      type: String,
      enum: ['superadmin', 'admin', 'writer', 'editor'],
      required: [true, 'Role is required'],
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
userSchema.index({ username: 1 });
userSchema.index({ email: 1 });
userSchema.index({ status: 1, role: 1 });

export default mongoose.model<IUser>('User', userSchema);