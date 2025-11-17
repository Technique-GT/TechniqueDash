import { Request, Response } from 'express';
import Article, { IArticle } from '../models/Article';
import mongoose from 'mongoose';

interface CreateArticleRequest extends Request {
  body: {
    title: string;
    content: string;
    excerpt: string;
    category: string;
    subcategory: string;
    tags: string[];
    authors: string[];
    collaborators: string[];
    featuredMediaId: string;
    featuredMediaUrl: string;
    isPublished: boolean;
    isFeatured: boolean;
    isSticky: boolean;
    seoTitle?: string;
    seoDescription?: string;
  }
}

interface UpdateArticleRequest extends Request {
  body: CreateArticleRequest['body'] & {
    id: string;
  }
}

const generateSlug = (title: string): string => {
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-') +
    '-' +
    Date.now()
  );
};

// Helper function to populate article references
const populateArticle = (query: any) => {
  return query
    .populate('category', 'name slug description isActive')
    .populate('subcategory', 'name slug description isActive')
    .populate('tags', 'name slug color description isActive')
    .populate('authors', 'firstName lastName username email role status')
    .populate('collaborators', 'name title email status joinDate');
};

export const createArticle = async (req: CreateArticleRequest, res: Response): Promise<void> => {
  try {
    const {
      title,
      content,
      excerpt,
      category,
      subcategory,
      tags,
      authors,
      collaborators = [],
      featuredMediaId,
      featuredMediaUrl,
      isPublished,
      isFeatured,
      isSticky,
      seoTitle,
      seoDescription
    } = req.body;

    // Check if article with same title already exists
    const existingArticle = await Article.findOne({ title });
    if (existingArticle) {
      res.status(400).json({
        success: false,
        message: 'An article with this title already exists'
      });
      return;
    }

    const slug = generateSlug(title);

    // Validate that only published articles can be featured or sticky
    const validatedIsFeatured = isPublished ? isFeatured : false;
    const validatedIsSticky = isPublished ? isSticky : false;

    // Convert string IDs to ObjectIds for references
    const categoryObjectId = new mongoose.Types.ObjectId(category);
    const subcategoryObjectId = subcategory ? new mongoose.Types.ObjectId(subcategory) : undefined;
    const tagObjectIds = tags.map(id => new mongoose.Types.ObjectId(id));
    const authorObjectIds = authors.map(id => new mongoose.Types.ObjectId(id));
    const collaboratorObjectIds = collaborators.map(id => new mongoose.Types.ObjectId(id));

    // Build article data
    const articleData: Partial<IArticle> = {
      title,
      content,
      excerpt,
      category: categoryObjectId as any,
      tags: tagObjectIds as any,
      authors: authorObjectIds as any,
      collaborators: collaboratorObjectIds as any,
      featuredMedia: {
        id: featuredMediaId,
        url: featuredMediaUrl
      },
      isPublished,
      isFeatured: validatedIsFeatured,
      isSticky: validatedIsSticky,
      slug
    };

    // Add optional fields
    if (subcategoryObjectId) {
      articleData.subcategory = subcategoryObjectId as any;
    }

    if (seoTitle) {
      articleData.seoTitle = seoTitle;
    }

    if (seoDescription) {
      articleData.seoDescription = seoDescription;
    }

    // Set publishedAt if publishing
    if (isPublished && !articleData.publishedAt) {
      articleData.publishedAt = new Date();
    }

    const article = new Article(articleData);
    await article.save();

    // Populate the created article before returning
    const populatedArticle = await populateArticle(Article.findById(article._id));

    res.status(201).json({
      success: true,
      message: 'Article created successfully',
      data: populatedArticle
    });
  } catch (error: any) {
    console.error('Create article error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create article',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const getArticles = async (_req: Request, res: Response): Promise<void> => {
  try {
    const articles = await populateArticle(
      Article.find()
        .sort({ createdAt: -1 })
        .select('-content')
    );

    res.json({
      success: true,
      data: articles
    });
  } catch (error: any) {
    console.error('Get articles error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch articles',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const getArticleById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const article = await populateArticle(Article.findById(id));
    
    if (!article) {
      res.status(404).json({
        success: false,
        message: 'Article not found'
      });
      return;
    }

    res.json({
      success: true,
      data: article
    });
  } catch (error: any) {
    console.error('Get article error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch article',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const getArticleBySlug = async (req: Request, res: Response): Promise<void> => {
  try {
    const { slug } = req.params;
    
    const article = await populateArticle(Article.findOne({ slug }));
    
    if (!article) {
      res.status(404).json({
        success: false,
        message: 'Article not found'
      });
      return;
    }

    // Increment views
    article.views += 1;
    await article.save();

    res.json({
      success: true,
      data: article
    });
  } catch (error: any) {
    console.error('Get article by slug error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch article',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const updateArticle = async (req: UpdateArticleRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      title,
      content,
      excerpt,
      category,
      subcategory,
      tags,
      authors,
      collaborators = [],
      featuredMediaId,
      featuredMediaUrl,
      isPublished,
      isFeatured,
      isSticky,
      seoTitle,
      seoDescription
    } = req.body;

    // Validate that only published articles can be featured or sticky
    const validatedIsFeatured = isPublished ? isFeatured : false;
    const validatedIsSticky = isPublished ? isSticky : false;

    // Convert string IDs to ObjectIds
    const categoryObjectId = new mongoose.Types.ObjectId(category);
    const subcategoryObjectId = subcategory ? new mongoose.Types.ObjectId(subcategory) : undefined;
    const tagObjectIds = tags.map(id => new mongoose.Types.ObjectId(id));
    const authorObjectIds = authors.map(id => new mongoose.Types.ObjectId(id));
    const collaboratorObjectIds = collaborators.map(id => new mongoose.Types.ObjectId(id));

    // Build update object
    const updateData: Partial<IArticle> = {
      title,
      content,
      excerpt,
      category: categoryObjectId as any,
      tags: tagObjectIds as any,
      authors: authorObjectIds as any,
      collaborators: collaboratorObjectIds as any,
      featuredMedia: {
        id: featuredMediaId,
        url: featuredMediaUrl
      },
      isPublished,
      isFeatured: validatedIsFeatured,
      isSticky: validatedIsSticky
    };

    // Add optional fields
    if (subcategoryObjectId !== undefined) {
      updateData.subcategory = subcategoryObjectId as any;
    }

    if (seoTitle !== undefined) {
      updateData.seoTitle = seoTitle;
    }

    if (seoDescription !== undefined) {
      updateData.seoDescription = seoDescription;
    }

    // Set publishedAt if publishing for the first time
    if (isPublished && !updateData.publishedAt) {
      const existingArticle = await Article.findById(id);
      if (existingArticle && !existingArticle.publishedAt) {
        updateData.publishedAt = new Date();
      }
    }

    const article = await Article.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!article) {
      res.status(404).json({
        success: false,
        message: 'Article not found'
      });
      return;
    }

    // Populate the updated article
    const populatedArticle = await populateArticle(Article.findById(article._id));

    res.json({
      success: true,
      message: 'Article updated successfully',
      data: populatedArticle
    });
  } catch (error: any) {
    console.error('Update article error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update article',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const deleteArticle = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const article = await Article.findByIdAndDelete(id);
    if (!article) {
      res.status(404).json({
        success: false,
        message: 'Article not found'
      });
      return;
    }

    res.json({
      success: true,
      message: 'Article deleted successfully'
    });
  } catch (error: any) {
    console.error('Delete article error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete article',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const getPublishedArticles = async (_req: Request, res: Response): Promise<void> => {
  try {
    const articles = await populateArticle(
      Article.find({ isPublished: true })
        .sort({ isSticky: -1, publishedAt: -1 })
        .select('-content')
    );

    res.json({
      success: true,
      data: articles
    });
  } catch (error: any) {
    console.error('Get published articles error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch published articles',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const getFeaturedArticles = async (_req: Request, res: Response): Promise<void> => {
  try {
    const articles = await populateArticle(
      Article.find({ 
        isPublished: true,
        isFeatured: true 
      })
      .sort({ publishedAt: -1 })
      .select('-content')
      .limit(10)
    );

    res.json({
      success: true,
      data: articles
    });
  } catch (error: any) {
    console.error('Get featured articles error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch featured articles',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const getStickyArticles = async (_req: Request, res: Response): Promise<void> => {
  try {
    const articles = await populateArticle(
      Article.find({ 
        isPublished: true,
        isSticky: true 
      })
      .sort({ publishedAt: -1 })
      .select('-content')
    );

    res.json({
      success: true,
      data: articles
    });
  } catch (error: any) {
    console.error('Get sticky articles error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sticky articles',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const getArticlesByCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { category } = req.params;
    
    const articles = await populateArticle(
      Article.find({ 
        category,
        isPublished: true 
      })
      .sort({ isSticky: -1, publishedAt: -1 })
      .select('-content')
    );

    res.json({
      success: true,
      data: articles
    });
  } catch (error: any) {
    console.error('Get articles by category error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch articles by category',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const toggleFeatured = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const article = await Article.findById(id);
    if (!article) {
      res.status(404).json({
        success: false,
        message: 'Article not found'
      });
      return;
    }

    if (!article.isPublished) {
      res.status(400).json({
        success: false,
        message: 'Only published articles can be featured'
      });
      return;
    }

    article.isFeatured = !article.isFeatured;
    await article.save();

    // Populate before returning
    const populatedArticle = await populateArticle(Article.findById(article._id));

    res.json({
      success: true,
      message: `Article ${article.isFeatured ? 'featured' : 'unfeatured'} successfully`,
      data: populatedArticle
    });
  } catch (error: any) {
    console.error('Toggle featured error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle featured status',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const toggleSticky = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const article = await Article.findById(id);
    if (!article) {
      res.status(404).json({
        success: false,
        message: 'Article not found'
      });
      return;
    }

    if (!article.isPublished) {
      res.status(400).json({
        success: false,
        message: 'Only published articles can be sticky'
      });
      return;
    }

    article.isSticky = !article.isSticky;
    await article.save();

    // Populate before returning
    const populatedArticle = await populateArticle(Article.findById(article._id));

    res.json({
      success: true,
      message: `Article ${article.isSticky ? 'pinned' : 'unpinned'} successfully`,
      data: populatedArticle
    });
  } catch (error: any) {
    console.error('Toggle sticky error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle sticky status',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const updateArticleStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, isFeatured, isSticky } = req.body;

    const article = await Article.findById(id);
    if (!article) {
      res.status(404).json({
        success: false,
        message: 'Article not found'
      });
      return;
    }

    const updateData: Partial<IArticle> = {};

    if (status !== undefined) {
      // SYNC BOTH FIELDS - This is the key fix!
      updateData.isPublished = status === 'published';
      updateData.status = status; // Make sure status field is updated
      
      if (status === 'published' && !article.publishedAt) {
        updateData.publishedAt = new Date();
      }
    }

    if (isFeatured !== undefined) {
      if (isFeatured && !updateData.isPublished && !article.isPublished) {
        res.status(400).json({
          success: false,
          message: 'Only published articles can be featured'
        });
        return;
      }
      updateData.isFeatured = isFeatured;
    }

    if (isSticky !== undefined) {
      if (isSticky && !updateData.isPublished && !article.isPublished) {
        res.status(400).json({
          success: false,
          message: 'Only published articles can be sticky'
        });
        return;
      }
      updateData.isSticky = isSticky;
    }

    const updatedArticle = await Article.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    // Populate before returning
    const populatedArticle = await populateArticle(Article.findById(updatedArticle!._id));

    res.json({
      success: true,
      message: 'Article status updated successfully',
      data: populatedArticle
    });
  } catch (error: any) {
    console.error('Update article status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update article status',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};