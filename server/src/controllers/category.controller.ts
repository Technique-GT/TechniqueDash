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

// Helper function to generate slug
const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
};

export const createCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description, slug, isActive } = req.body;

    // Generate slug if not provided
    const categorySlug = slug || generateSlug(name);

    // Check if category already exists by name or slug
    const existingCategory = await Category.findOne({
      $or: [
        { name: { $regex: new RegExp(`^${name}$`, 'i') } },
        { slug: categorySlug }
      ]
    });

    if (existingCategory) {
      res.status(409).json({
        success: false,
        message: 'Category with this name or slug already exists'
      });
      return;
    }

    const categoryData: any = {
      name: name.trim(),
      slug: categorySlug,
      description,
      isActive: isActive !== undefined ? isActive : true
    };

    const category: ICategory = new Category(categoryData);
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
        message: 'Category with this slug already exists'
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

    const categories = await Category.find(query)
      .sort({ name: 1 })
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
    const objectId = toObjectId(req.params.id);

    if (!objectId) {
      res.status(400).json({
        success: false,
        message: 'Invalid category ID'
      });
      return;
    }

    const category = await Category.findById(objectId);
    
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

export const getCategoryBySlug = async (req: Request, res: Response): Promise<void> => {
  try {
    const { slug } = req.params;

    const category = await Category.findOne({ slug });
    
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
    const objectId = toObjectId(req.params.id);
    const { name, description, slug, isActive } = req.body;

    if (!objectId) {
      res.status(400).json({
        success: false,
        message: 'Invalid category ID'
      });
      return;
    }

    // Generate new slug if name is being updated and slug is not provided
    let categorySlug = slug;
    if (name && !slug) {
      categorySlug = generateSlug(name);
    }

    // Check if new name or slug conflicts with existing categories
    if (name || categorySlug) {
      const existingCategory = await Category.findOne({
        $or: [
          { name: name ? { $regex: new RegExp(`^${name}$`, 'i') } : undefined },
          { slug: categorySlug }
        ].filter(condition => condition !== undefined),
        _id: { $ne: objectId }
      });

      if (existingCategory) {
        res.status(409).json({
          success: false,
          message: 'Category with this name or slug already exists'
        });
        return;
      }
    }

    const updateData: any = {};
    if (name) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description;
    if (categorySlug) updateData.slug = categorySlug;
    if (isActive !== undefined) updateData.isActive = isActive;

    const category = await Category.findByIdAndUpdate(
      objectId,
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
        message: 'Category with this slug already exists'
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
    const objectId = toObjectId(req.params.id);

    if (!objectId) {
      res.status(400).json({
        success: false,
        message: 'Invalid category ID'
      });
      return;
    }

    const category = await Category.findById(objectId);
    
    if (!category) {
      res.status(404).json({
        success: false,
        message: 'Category not found'
      });
      return;
    }

    // Instead of deleting, deactivate the category
    await Category.findByIdAndUpdate(objectId, { isActive: false });

    res.status(200).json({
      success: true,
      message: 'Category deactivated successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error deleting category',
      error: error.message
    });
  }
};

export const hardDeleteCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const objectId = toObjectId(req.params.id);

    if (!objectId) {
      res.status(400).json({
        success: false,
        message: 'Invalid category ID'
      });
      return;
    }

    const category = await Category.findByIdAndDelete(objectId);

    if (!category) {
      res.status(404).json({
        success: false,
        message: 'Category not found'
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Category permanently deleted successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error deleting category',
      error: error.message
    });
  }
};

export const getCategoryStats = async (_req: Request, res: Response): Promise<void> => {
  try {
    const stats = await Category.aggregate([
      {
        $group: {
          _id: null,
          totalCategories: { $sum: 1 },
          activeCategories: {
            $sum: { $cond: ['$isActive', 1, 0] }
          },
          inactiveCategories: {
            $sum: { $cond: ['$isActive', 0, 1] }
          }
        }
      }
    ]);

    const categoryStats = stats[0] || {
      totalCategories: 0,
      activeCategories: 0,
      inactiveCategories: 0
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