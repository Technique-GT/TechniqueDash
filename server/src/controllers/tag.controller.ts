import { Request, Response } from 'express';
import Tag, { ITag } from '../models/Tag';
import mongoose from 'mongoose';

// Helper function to validate and convert string to ObjectId
const toObjectId = (id: string | undefined): mongoose.Types.ObjectId | null => {
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return null;
  }
  return new mongoose.Types.ObjectId(id);
};

export const createTag = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description, color } = req.body;
    const userId = (req as any).user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
      return;
    }

    // Check if tag already exists
    const existingTag = await Tag.findOne({ 
      name: { $regex: new RegExp(`^${name}$`, 'i') }
    });

    if (existingTag) {
      res.status(409).json({
        success: false,
        message: 'Tag with this name already exists'
      });
      return;
    }

    const tag: ITag = new Tag({
      name: name.trim(),
      description,
      color: color || '#6B7280',
      userId: new mongoose.Types.ObjectId(userId)
    });

    await tag.save();
    
    res.status(201).json({
      success: true,
      message: 'Tag created successfully',
      data: tag
    });
  } catch (error: any) {
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err: any) => err.message);
      res.status(400).json({
        success: false,
        message: 'Validation error',
        errors
      });
    } else if (error.code === 11000) {
      res.status(409).json({
        success: false,
        message: 'Tag with this name already exists'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Server error',
        error: error.message
      });
    }
  }
};

export const getTags = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    const { search } = req.query;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
      return;
    }

    let query: any = { userId: new mongoose.Types.ObjectId(userId) };

    // Add search filter
    if (search && typeof search === 'string') {
      const searchRegex = new RegExp(search, 'i');
      query.name = searchRegex;
    }

    const tags = await Tag.find(query)
      .sort({ articleCount: -1, name: 1 })
      .select('-__v');

    res.status(200).json({
      success: true,
      data: tags,
      count: tags.length
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error fetching tags',
      error: error.message
    });
  }
};

export const getTagById = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    const objectId = toObjectId(req.params.id);

    if (!objectId) {
      res.status(400).json({
        success: false,
        message: 'Invalid tag ID'
      });
      return;
    }

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
      return;
    }

    const tag = await Tag.findOne({ 
      _id: objectId, 
      userId: new mongoose.Types.ObjectId(userId) 
    });
    
    if (!tag) {
      res.status(404).json({
        success: false,
        message: 'Tag not found'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: tag
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error fetching tag',
      error: error.message
    });
  }
};

export const updateTag = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    const objectId = toObjectId(req.params.id);
    const { name, description, color } = req.body;

    if (!objectId) {
      res.status(400).json({
        success: false,
        message: 'Invalid tag ID'
      });
      return;
    }

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
      return;
    }

    // Check if new name conflicts with existing tags
    if (name) {
      const existingTag = await Tag.findOne({
        name: { $regex: new RegExp(`^${name}$`, 'i') },
        _id: { $ne: objectId }
      });

      if (existingTag) {
        res.status(409).json({
          success: false,
          message: 'Tag with this name already exists'
        });
        return;
      }
    }

    const updateData: any = {};
    if (name) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description;
    if (color) updateData.color = color;

    const tag = await Tag.findOneAndUpdate(
      { _id: objectId, userId: new mongoose.Types.ObjectId(userId) },
      updateData,
      { new: true, runValidators: true }
    );

    if (!tag) {
      res.status(404).json({
        success: false,
        message: 'Tag not found'
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Tag updated successfully',
      data: tag
    });
  } catch (error: any) {
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err: any) => err.message);
      res.status(400).json({
        success: false,
        message: 'Validation error',
        errors
      });
    } else if (error.code === 11000) {
      res.status(409).json({
        success: false,
        message: 'Tag with this name already exists'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Error updating tag',
        error: error.message
      });
    }
  }
};

export const deleteTag = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    const objectId = toObjectId(req.params.id);

    if (!objectId) {
      res.status(400).json({
        success: false,
        message: 'Invalid tag ID'
      });
      return;
    }

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
      return;
    }

    const tag = await Tag.findOneAndDelete({ 
      _id: objectId, 
      userId: new mongoose.Types.ObjectId(userId) 
    });
    
    if (!tag) {
      res.status(404).json({
        success: false,
        message: 'Tag not found'
      });
      return;
    }

    // Here you would typically update articles that use this tag
    // For example: await Article.updateMany({ tags: objectId }, { $pull: { tags: objectId } });

    res.status(200).json({
      success: true,
      message: 'Tag deleted successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error deleting tag',
      error: error.message
    });
  }
};

export const bulkDeleteTags = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    const { tagIds } = req.body;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
      return;
    }

    if (!Array.isArray(tagIds) || tagIds.length === 0) {
      res.status(400).json({
        success: false,
        message: 'Tag IDs array is required'
      });
      return;
    }

    const objectIds = tagIds.map(id => toObjectId(id)).filter(id => id !== null);

    if (objectIds.length === 0) {
      res.status(400).json({
        success: false,
        message: 'No valid tag IDs provided'
      });
      return;
    }

    const result = await Tag.deleteMany({
      _id: { $in: objectIds },
      userId: new mongoose.Types.ObjectId(userId)
    });

    res.status(200).json({
      success: true,
      message: `${result.deletedCount} tags deleted successfully`
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error deleting tags',
      error: error.message
    });
  }
};