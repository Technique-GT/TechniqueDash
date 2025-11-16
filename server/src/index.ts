import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import articleRoutes from './routes/article.routes';
import categoryRoutes from './routes/category.routes';
import subCategoryRoutes from './routes/subCategory.routes'; // Add this import
import tagRoutes from './routes/tag.routes';
import userRoutes from './routes/user.routes';
import mediaRoutes from './routes/media.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5050;

// Basic middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// Serve uploaded files statically
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/articles', articleRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/sub-categories', subCategoryRoutes); // Add this line
app.use('/api/tags', tagRoutes);
app.use('/api/users', userRoutes);
app.use('/api/media', mediaRoutes);

// Simple health check
app.get('/api/health', (_req, res) => {
  res.json({ 
    success: true, 
    message: 'Server is running', 
    timestamp: new Date().toISOString() 
  });
});

// Connect to MongoDB
mongoose.connect(process.env.ATLAS_URI!)
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  });