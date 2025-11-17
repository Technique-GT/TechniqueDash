export interface PopulatedCategory {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  isActive: boolean;
}

export interface PopulatedSubCategory {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  isActive: boolean;
}

export interface PopulatedTag {
  _id: string;
  name: string;
  slug: string;
  color?: string;
  description?: string;
  isActive: boolean;
}

export interface PopulatedAuthor {
  _id: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  role: string;
  status: string;
}

export interface Article {
  _id: string;
  title: string;
  content: string;
  authors: PopulatedAuthor[];
  category: PopulatedCategory;
  subcategory?: PopulatedSubCategory;
  status: "published" | "draft";
  publishedAt?: string;
  views: number;
  excerpt: string;
  tags: PopulatedTag[];
  featuredMedia: {
    id: string;
    url: string;
    alt?: string;
  };
  isFeatured: boolean;
  isSticky: boolean;
  allowComments: boolean;
  createdAt: string;
  updatedAt: string;
}

export type MessageType = { type: 'success' | 'error', text: string };