import { Request, Response } from 'express';
import Category, { ICategory } from '../models/Category';
import mongoose from 'mongoose';

// Helper function to validate and convert string to ObjectId
const toObjectId = (id: string | undefined): mongoose.Types.ObjectId | null => {
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return null;
  }
  return new mongoose.Types.ObjectId(id);
};

export const createCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description } = req.body;
    const userId = (req as any).user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
      return;
    }

    // Check if category already exists
    const existingCategory = await Category.findOne({ 
      name: { $regex: new RegExp(`^${name}$`, 'i') }
    });

    if (existingCategory) {
      res.status(409).json({
        success: false,
        message: 'Category with this name already exists'
      });
      return;
    }

    const category: ICategory = new Category({
      name: name.trim(),
      description,
      userId: new mongoose.Types.ObjectId(userId)
    });

    await category.save();
    
    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: category
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
        message: 'Category with this name already exists'
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

export const getCategories = async (req: Request, res: Response): Promise<void> => {
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

    const categories = await Category.find(query)
      .sort({ articleCount: -1, name: 1 })
      .select('-__v');

    res.status(200).json({
      success: true,
      data: categories,
      count: categories.length
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error fetching categories',
      error: error.message
    });
  }
};

export const getCategoryById = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    const objectId = toObjectId(req.params.id);

    if (!objectId) {
      res.status(400).json({
        success: false,
        message: 'Invalid category ID'
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

    const category = await Category.findOne({ 
      _id: objectId, 
      userId: new mongoose.Types.ObjectId(userId) 
    });
    
    if (!category) {
      res.status(404).json({
        success: false,
        message: 'Category not found'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: category
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error fetching category',
      error: error.message
    });
  }
};

export const updateCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    const objectId = toObjectId(req.params.id);
    const { name, description } = req.body;

    if (!objectId) {
      res.status(400).json({
        success: false,
        message: 'Invalid category ID'
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

    // Check if new name conflicts with existing categories
    if (name) {
      const existingCategory = await Category.findOne({
        name: { $regex: new RegExp(`^${name}$`, 'i') },
        _id: { $ne: objectId }
      });

      if (existingCategory) {
        res.status(409).json({
          success: false,
          message: 'Category with this name already exists'
        });
        return;
      }
    }

    const updateData: any = {};
    if (name) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description;

    const category = await Category.findOneAndUpdate(
      { _id: objectId, userId: new mongoose.Types.ObjectId(userId) },
      updateData,
      { new: true, runValidators: true }
    );

    if (!category) {
      res.status(404).json({
        success: false,
        message: 'Category not found'
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Category updated successfully',
      data: category
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
        message: 'Category with this name already exists'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Error updating category',
        error: error.message
      });
    }
  }
};

export const deleteCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    const objectId = toObjectId(req.params.id);

    if (!objectId) {
      res.status(400).json({
        success: false,
        message: 'Invalid category ID'
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

    const category = await Category.findOne({ 
      _id: objectId, 
      userId: new mongoose.Types.ObjectId(userId) 
    });
    
    if (!category) {
      res.status(404).json({
        success: false,
        message: 'Category not found'
      });
      return;
    }

    // Check if category has articles
    if (category.articleCount > 0) {
      res.status(400).json({
        success: false,
        message: 'Cannot delete category that has articles. Please reassign articles first.'
      });
      return;
    }

    await Category.findByIdAndDelete(objectId);

    res.status(200).json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error deleting category',
      error: error.message
    });
  }
};

export const getCategoryStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
      return;
    }

    const stats = await Category.aggregate([
      {
        $match: { userId: new mongoose.Types.ObjectId(userId) }
      },
      {
        $group: {
          _id: null,
          totalCategories: { $sum: 1 },
          totalArticles: { $sum: '$articleCount' },
          averageArticles: { $avg: '$articleCount' }
        }
      }
    ]);

    const categoryStats = stats[0] || {
      totalCategories: 0,
      totalArticles: 0,
      averageArticles: 0
    };

    res.status(200).json({
      success: true,
      data: categoryStats
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error fetching category stats',
      error: error.message
    });
  }
};