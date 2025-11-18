import { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import mongoose from 'mongoose';
import Media from '../models/Media';

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (_req: Request, _file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
    const uploadDir = 'uploads/media';
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (_req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Allow images, videos, and documents
  const allowedMimes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'video/mp4',
    'video/mpeg',
    'video/quicktime',
    'application/pdf',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type'));
  }
};

export const uploadMiddleware = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
});

// Upload media
export const uploadMedia = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({
        success: false,
        message: 'No file uploaded',
      });
      return;
    }

    const { filename, originalname, mimetype, size, path: filePath } = req.file;
    
    // Create URL for the file (adjust based on your server configuration)
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const fileUrl = `${baseUrl}/${filePath}`;

    // For now, use a dummy user ID - you can replace this with actual user authentication
    const uploaderId = new mongoose.Types.ObjectId();

    const media = await Media.create({
      filename,
      originalName: originalname,
      mimeType: mimetype,
      size,
      url: fileUrl,
      path: filePath,
      uploader: uploaderId,
      metadata: {}, // You can extract metadata here (image dimensions, video duration, etc.)
    });

    res.status(201).json({
      success: true,
      message: 'File uploaded successfully',
      data: media,
    });
  } catch (error: any) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading file',
      error: error.message,
    });
  }
};

// Get all media with pagination and filtering
export const getMedia = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      page = '1',
      limit = '12',
      search = '',
      type = '',
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    // Build filter query
    const filter: any = { isActive: true };
    
    if (search) {
      filter.$or = [
        { originalName: { $regex: search, $options: 'i' } },
        { filename: { $regex: search, $options: 'i' } },
      ];
    }

    if (type) {
      if (type === 'image') {
        filter.mimeType = { $regex: '^image/', $options: 'i' };
      } else if (type === 'video') {
        filter.mimeType = { $regex: '^video/', $options: 'i' };
      } else if (type === 'document') {
        filter.mimeType = { $regex: '^(application|text)/', $options: 'i' };
      }
    }

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Build sort object
    const sort: any = {};
    sort[sortBy as string] = sortOrder === 'asc' ? 1 : -1;

    const [media, total] = await Promise.all([
      Media.find(filter)
        .populate('uploader', 'firstName lastName username')
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Media.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: media,
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum),
        limit: limitNum,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error fetching media',
      error: error.message,
    });
  }
};

// Get single media by ID
export const getMediaById = async (req: Request, res: Response): Promise<void> => {
  try {
    const media = await Media.findById(req.params.id)
      .populate('uploader', 'firstName lastName username');

    if (!media) {
      res.status(404).json({
        success: false,
        message: 'Media not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: media,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error fetching media',
      error: error.message,
    });
  }
};

// Delete media (soft delete)
export const deleteMedia = async (req: Request, res: Response): Promise<void> => {
  try {
    const media = await Media.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!media) {
      res.status(404).json({
        success: false,
        message: 'Media not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Media deleted successfully',
      data: { id: media._id },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error deleting media',
      error: error.message,
    });
  }
};

// Hard delete media (with file removal)
export const hardDeleteMedia = async (req: Request, res: Response): Promise<void> => {
  try {
    const media = await Media.findById(req.params.id);

    if (!media) {
      res.status(404).json({
        success: false,
        message: 'Media not found',
      });
      return;
    }

    // Delete file from filesystem
    try {
      if (fs.existsSync(media.path)) {
        fs.unlinkSync(media.path);
      }
    } catch (fileError) {
      console.error('Error deleting file:', fileError);
    }

    // Delete from database
    await Media.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Media permanently deleted',
      data: { id: media._id },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error deleting media',
      error: error.message,
    });
  }
};

// Serve media files
export const serveMedia = async (req: Request, res: Response): Promise<void> => {
  try {
    const media = await Media.findById(req.params.id);

    if (!media || !media.isActive) {
      res.status(404).json({
        success: false,
        message: 'Media not found',
      });
      return;
    }

    if (!fs.existsSync(media.path)) {
      res.status(404).json({
        success: false,
        message: 'File not found',
      });
      return;
    }

    res.sendFile(path.resolve(media.path));
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error serving media',
      error: error.message,
    });
  }
};