import { Request, Response } from 'express';
import Article, { IArticle } from '../models/Article';

interface CreateArticleRequest extends Request {
  body: {
    title: string;
    content: string;
    excerpt: string;
    category: string;
    subcategory: string;
    tags: string[];
    authors: string[];
    featuredMediaId: string;
    featuredMediaUrl: string;
    isPublished: boolean;
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
      featuredMediaId,
      featuredMediaUrl,
      isPublished,
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


    // Build article data with explicit undefined handling
    const articleData: Partial<IArticle> = {
      title,
      content,
      excerpt,
      category,
      tags,
      authors,
      featuredMedia: {
        id: featuredMediaId,
        url: featuredMediaUrl
      },
      isPublished,
      slug
    };

    // Add optional fields only if they have values
    if (subcategory) {
      articleData.subcategory = subcategory;
    }

    if (seoTitle) {
      articleData.seoTitle = seoTitle;
    }

    if (seoDescription) {
      articleData.seoDescription = seoDescription;
    }

    const article = new Article(articleData);
    await article.save();

    res.status(201).json({
      success: true,
      message: 'Article created successfully',
      data: article
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
    const articles = await Article.find()
      .sort({ createdAt: -1 })
      .select('-content'); // Exclude content for list view

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
    
    const article = await Article.findById(id);
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
    
    const article = await Article.findOne({ slug });
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
      featuredMediaId,
      featuredMediaUrl,
      isPublished,
      seoTitle,
      seoDescription
    } = req.body;

    // Build update object with explicit undefined handling
    const updateData: Partial<IArticle> = {
      title,
      content,
      excerpt,
      category,
      tags,
      authors,
      featuredMedia: {
        id: featuredMediaId,
        url: featuredMediaUrl
      },
      isPublished
    };

    // Add optional fields only if they are provided
    if (subcategory !== undefined) {
      updateData.subcategory = subcategory;
    }

    if (seoTitle !== undefined) {
      updateData.seoTitle = seoTitle;
    }

    if (seoDescription !== undefined) {
      updateData.seoDescription = seoDescription;
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

    res.json({
      success: true,
      message: 'Article updated successfully',
      data: article
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
    const articles = await Article.find({ isPublished: true })
      .sort({ publishedAt: -1 })
      .select('-content');

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

export const getArticlesByCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { category } = req.params;
    
    const articles = await Article.find({ 
      category,
      isPublished: true 
    })
    .sort({ publishedAt: -1 })
    .select('-content');

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