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

// Helper function to generate slug
const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
};

export const createTag = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description, color, slug } = req.body;

    // Generate slug if not provided
    const tagSlug = slug || generateSlug(name);

    // Check if tag already exists by name or slug
    const existingTag = await Tag.findOne({
      $or: [
        { name: { $regex: new RegExp(`^${name}$`, 'i') } },
        { slug: tagSlug }
      ]
    });

    if (existingTag) {
      res.status(409).json({
        success: false,
        message: 'Tag with this name or slug already exists'
      });
      return;
    }

    const tagData: any = {
      name: name.trim(),
      slug: tagSlug,
      description,
      color: color || '#6B7280',
      isActive: true
    };

    const tag: ITag = new Tag(tagData);
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
        message: 'Tag with this slug already exists'
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
    const { search, isActive } = req.query;

    let query: any = {};

    // Add search filter
    if (search && typeof search === 'string') {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { name: searchRegex },
        { description: searchRegex }
      ];
    }

    // Filter by active status
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    const tags = await Tag.find(query)
      .sort({ name: 1 })
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
    const objectId = toObjectId(req.params.id);

    if (!objectId) {
      res.status(400).json({
        success: false,
        message: 'Invalid tag ID'
      });
      return;
    }

    const tag = await Tag.findById(objectId);
    
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

export const getTagBySlug = async (req: Request, res: Response): Promise<void> => {
  try {
    const { slug } = req.params;

    const tag = await Tag.findOne({ slug });
    
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
    const objectId = toObjectId(req.params.id);
    const { name, description, color, slug, isActive } = req.body;

    if (!objectId) {
      res.status(400).json({
        success: false,
        message: 'Invalid tag ID'
      });
      return;
    }

    // Generate new slug if name is being updated and slug is not provided
    let tagSlug = slug;
    if (name && !slug) {
      tagSlug = generateSlug(name);
    }

    // Check if new name or slug conflicts with existing tags
    if (name || tagSlug) {
      const existingTag = await Tag.findOne({
        $or: [
          { name: name ? { $regex: new RegExp(`^${name}$`, 'i') } : undefined },
          { slug: tagSlug }
        ].filter(condition => condition !== undefined),
        _id: { $ne: objectId }
      });

      if (existingTag) {
        res.status(409).json({
          success: false,
          message: 'Tag with this name or slug already exists'
        });
        return;
      }
    }

    const updateData: any = {};
    if (name) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description;
    if (color) updateData.color = color;
    if (tagSlug) updateData.slug = tagSlug;
    if (isActive !== undefined) updateData.isActive = isActive;

    const tag = await Tag.findByIdAndUpdate(
      objectId,
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
        message: 'Tag with this slug already exists'
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
    const objectId = toObjectId(req.params.id);

    if (!objectId) {
      res.status(400).json({
        success: false,
        message: 'Invalid tag ID'
      });
      return;
    }

    const tag = await Tag.findById(objectId);
    
    if (!tag) {
      res.status(404).json({
        success: false,
        message: 'Tag not found'
      });
      return;
    }

    // Instead of deleting, deactivate the tag
    await Tag.findByIdAndUpdate(objectId, { isActive: false });

    res.status(200).json({
      success: true,
      message: 'Tag deactivated successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error deleting tag',
      error: error.message
    });
  }
};

export const hardDeleteTag = async (req: Request, res: Response): Promise<void> => {
  try {
    const objectId = toObjectId(req.params.id);

    if (!objectId) {
      res.status(400).json({
        success: false,
        message: 'Invalid tag ID'
      });
      return;
    }

    const tag = await Tag.findByIdAndDelete(objectId);

    if (!tag) {
      res.status(404).json({
        success: false,
        message: 'Tag not found'
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Tag permanently deleted successfully'
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
    const { tagIds } = req.body;

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

    // Deactivate tags instead of hard deleting
    const result = await Tag.updateMany(
      { _id: { $in: objectIds } },
      { isActive: false }
    );

    res.status(200).json({
      success: true,
      message: `${result.modifiedCount} tags deactivated successfully`
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error deleting tags',
      error: error.message
    });
  }
};

export const getTagStats = async (_req: Request, res: Response): Promise<void> => {
  try {
    const stats = await Tag.aggregate([
      {
        $group: {
          _id: null,
          totalTags: { $sum: 1 },
          activeTags: {
            $sum: { $cond: ['$isActive', 1, 0] }
          },
          inactiveTags: {
            $sum: { $cond: ['$isActive', 0, 1] }
          }
        }
      }
    ]);

    const tagStats = stats[0] || {
      totalTags: 0,
      activeTags: 0,
      inactiveTags: 0
    };

    res.status(200).json({
      success: true,
      data: tagStats
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error fetching tag stats',
      error: error.message
    });
  }
};