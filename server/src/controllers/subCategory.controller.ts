import { Request, Response } from 'express';
import SubCategory from '../models/Subcategory'; // Remove unused ISubCategory import
import Category from '../models/Category';
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

export const createSubCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description, slug, isActive, category } = req.body;

    if (!name || name.trim().length === 0) {
      res.status(400).json({
        success: false,
        message: 'Sub-category name is required'
      });
      return;
    }

    // Validate parent category
    const categoryId = toObjectId(category);
    if (!categoryId) {
      res.status(400).json({
        success: false,
        message: 'Invalid category ID'
      });
      return;
    }

    const parentCategory = await Category.findById(categoryId);
    if (!parentCategory) {
      res.status(404).json({
        success: false,
        message: 'Parent category not found'
      });
      return;
    }

    if (!parentCategory.isActive) {
      res.status(400).json({
        success: false,
        message: 'Cannot create sub-category for inactive category'
      });
      return;
    }

    // Generate slug if not provided
    const subCategorySlug = slug || generateSlug(name);

    // Check if sub-category already exists by slug
    const existingSubCategory = await SubCategory.findOne({
      slug: subCategorySlug
    });

    if (existingSubCategory) {
      res.status(409).json({
        success: false,
        message: 'Sub-category with this slug already exists'
      });
      return;
    }

    const subCategoryData = {
      name: name.trim(),
      slug: subCategorySlug,
      description: description?.trim(),
      isActive: isActive !== undefined ? isActive : true,
      category: categoryId
    };

    const subCategory = new SubCategory(subCategoryData);
    await subCategory.save();
    
    // Populate the saved sub-category
    const populatedSubCategory = await SubCategory.findById(subCategory._id)
      .populate('category', 'name slug');

    res.status(201).json({
      success: true,
      message: 'Sub-category created successfully',
      data: populatedSubCategory
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
        message: 'Sub-category with this slug already exists'
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

export const getSubCategories = async (req: Request, res: Response): Promise<void> => {
  try {
    const { search, isActive, category, page = 1, limit = 10 } = req.query;

    let query: any = {};

    // Add search filter
    if (search && typeof search === 'string') {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { name: searchRegex },
        { description: searchRegex },
        { slug: searchRegex }
      ];
    }

    // Filter by active status
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    // Filter by category
    if (category) {
      const categoryId = toObjectId(category as string);
      if (categoryId) {
        query.category = categoryId;
      } else {
        res.status(400).json({
          success: false,
          message: 'Invalid category ID'
        });
        return;
      }
    }

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const [subCategories, total] = await Promise.all([
      SubCategory.find(query)
        .populate('category', 'name slug isActive')
        .sort({ name: 1 })
        .skip(skip)
        .limit(limitNum)
        .select('-__v'),
      SubCategory.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      data: subCategories,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error fetching sub-categories',
      error: error.message
    });
  }
};

export const getSubCategoryById = async (req: Request, res: Response): Promise<void> => {
  try {
    const objectId = toObjectId(req.params.id);

    if (!objectId) {
      res.status(400).json({
        success: false,
        message: 'Invalid sub-category ID'
      });
      return;
    }

    const subCategory = await SubCategory.findById(objectId)
      .populate('category', 'name slug isActive');
    
    if (!subCategory) {
      res.status(404).json({
        success: false,
        message: 'Sub-category not found'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: subCategory
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error fetching sub-category',
      error: error.message
    });
  }
};

export const getSubCategoryBySlug = async (req: Request, res: Response): Promise<void> => {
  try {
    const { slug } = req.params;

    const subCategory = await SubCategory.findOne({ slug })
      .populate('category', 'name slug isActive');
    
    if (!subCategory) {
      res.status(404).json({
        success: false,
        message: 'Sub-category not found'
      });
      return;
    }

    res.status(200).json({
      success: true, // Fixed: was 'false'
      data: subCategory
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error fetching sub-category',
      error: error.message
    });
  }
};

export const updateSubCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const objectId = toObjectId(req.params.id);
    const { name, description, slug, isActive, category } = req.body;

    if (!objectId) {
      res.status(400).json({
        success: false,
        message: 'Invalid sub-category ID'
      });
      return;
    }

    // Check if sub-category exists
    const existingSubCategory = await SubCategory.findById(objectId);
    if (!existingSubCategory) {
      res.status(404).json({
        success: false,
        message: 'Sub-category not found'
      });
      return;
    }

    // Generate new slug if name is being updated and slug is not provided
    let subCategorySlug = slug;
    if (name && !slug) {
      subCategorySlug = generateSlug(name);
    }

    // Check if new slug conflicts with existing sub-categories
    if (subCategorySlug && subCategorySlug !== existingSubCategory.slug) {
      const slugConflict = await SubCategory.findOne({
        slug: subCategorySlug,
        _id: { $ne: objectId }
      });

      if (slugConflict) {
        res.status(409).json({
          success: false,
          message: 'Sub-category with this slug already exists'
        });
        return;
      }
    }

    // Validate category if provided
    if (category) {
      const categoryId = toObjectId(category);
      if (!categoryId) {
        res.status(400).json({
          success: false,
          message: 'Invalid category ID'
        });
        return;
      }

      const parentCategory = await Category.findById(categoryId);
      if (!parentCategory) {
        res.status(404).json({
          success: false,
          message: 'Category not found'
        });
        return;
      }
    }

    const updateData: any = {};
    if (name) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description;
    if (subCategorySlug) updateData.slug = subCategorySlug;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (category) updateData.category = category;

    const subCategory = await SubCategory.findByIdAndUpdate(
      objectId,
      updateData,
      { new: true, runValidators: true }
    )
    .populate('category', 'name slug isActive');

    if (!subCategory) {
      res.status(404).json({
        success: false,
        message: 'Sub-category not found after update'
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Sub-category updated successfully',
      data: subCategory
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
        message: 'Sub-category with this slug already exists'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Error updating sub-category',
        error: error.message
      });
    }
  }
};

export const deleteSubCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const objectId = toObjectId(req.params.id);

    if (!objectId) {
      res.status(400).json({
        success: false,
        message: 'Invalid sub-category ID'
      });
      return;
    }

    const subCategory = await SubCategory.findById(objectId);
    
    if (!subCategory) {
      res.status(404).json({
        success: false,
        message: 'Sub-category not found'
      });
      return;
    }

    // Instead of deleting, deactivate the sub-category
    await SubCategory.findByIdAndUpdate(objectId, { isActive: false });

    res.status(200).json({
      success: true,
      message: 'Sub-category deactivated successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error deleting sub-category',
      error: error.message
    });
  }
};

export const hardDeleteSubCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const objectId = toObjectId(req.params.id);

    if (!objectId) {
      res.status(400).json({
        success: false,
        message: 'Invalid sub-category ID'
      });
      return;
    }

    const subCategory = await SubCategory.findByIdAndDelete(objectId);

    if (!subCategory) {
      res.status(404).json({
        success: false,
        message: 'Sub-category not found'
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Sub-category permanently deleted successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error deleting sub-category',
      error: error.message
    });
  }
};

export const getSubCategoriesByCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { categoryId } = req.params;
    const { isActive = 'true' } = req.query;

    const categoryObjectId = toObjectId(categoryId);
    if (!categoryObjectId) {
      res.status(400).json({
        success: false,
        message: 'Invalid category ID'
      });
      return;
    }

    // Check if category exists
    const category = await Category.findById(categoryObjectId);
    if (!category) {
      res.status(404).json({
        success: false,
        message: 'Category not found'
      });
      return;
    }

    const query: any = {
      category: categoryObjectId,
      isActive: isActive === 'true'
    };

    const subCategories = await SubCategory.find(query)
      .populate('category', 'name slug')
      .sort({ name: 1 })
      .select('-__v');

    res.status(200).json({
      success: true,
      data: subCategories,
      category: {
        _id: category._id,
        name: category.name,
        slug: category.slug
      },
      count: subCategories.length
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error fetching sub-categories',
      error: error.message
    });
  }
};

export const getSubCategoryStats = async (_req: Request, res: Response): Promise<void> => {
  try {
    const stats = await SubCategory.aggregate([
      {
        $lookup: {
          from: 'articles',
          localField: '_id',
          foreignField: 'subcategory',
          as: 'articles'
        }
      },
      {
        $project: {
          name: 1,
          slug: 1,
          isActive: 1,
          articleCount: { $size: '$articles' },
          publishedCount: {
            $size: {
              $filter: {
                input: '$articles',
                as: 'article',
                cond: { $eq: ['$$article.isPublished', true] }
              }
            }
          },
          totalViews: { $sum: '$articles.views' }
        }
      },
      {
        $sort: { articleCount: -1 }
      }
    ]);

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error: any) {
    console.error('Get subcategory stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching subcategory statistics',
      error: error.message
    });
  }
};