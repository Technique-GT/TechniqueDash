import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Search, MoreHorizontal, Plus, Edit, Trash2, Eye, RefreshCw, X, Star, Pin, Send } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

// Updated interfaces to match populated backend responses
interface PopulatedCategory {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  isActive: boolean;
}

interface PopulatedSubCategory {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  isActive: boolean;
}

interface PopulatedTag {
  _id: string;
  name: string;
  slug: string;
  color?: string;
  description?: string;
  isActive: boolean;
}

interface PopulatedAuthor {
  _id: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  role: string;
  status: string;
}

interface Article {
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

const API_BASE_URL = 'http://localhost:5050/api';

export default function ArticleList() {
  const navigate = useNavigate();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [currentArticle, setCurrentArticle] = useState<Article | null>(null);
  const [editedArticle, setEditedArticle] = useState<Partial<Article> | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // State for full edit modal
  const [categories, setCategories] = useState<PopulatedCategory[]>([]);
  const [subcategories, setSubcategories] = useState<PopulatedSubCategory[]>([]);
  const [tags, setTags] = useState<PopulatedTag[]>([]);
  const [authors, setAuthors] = useState<PopulatedAuthor[]>([]);
  const [isEditLoading, setIsEditLoading] = useState(false);

  // Edit form state
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editExcerpt, setEditExcerpt] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editSubcategory, setEditSubcategory] = useState("");
  const [editSelectedTags, setEditSelectedTags] = useState<string[]>([]);
  const [editSelectedAuthors, setEditSelectedAuthors] = useState<PopulatedAuthor[]>([]);
  const [editFeaturedMediaId, setEditFeaturedMediaId] = useState("");
  const [editIsPublished, setEditIsPublished] = useState(false);
  const [editIsFeatured, setEditIsFeatured] = useState(false);
  const [editIsSticky, setEditIsSticky] = useState(false);
  const [editAuthorSearch, setEditAuthorSearch] = useState("");
  const [showAuthorResults, setShowAuthorResults] = useState(false);

  // Quick action states
  const [publishingArticle, setPublishingArticle] = useState<string | null>(null);
  const [featuringArticle, setFeaturingArticle] = useState<string | null>(null);
  const [stickingArticle, setStickingArticle] = useState<string | null>(null);

  // Fetch articles from backend
  const fetchArticles = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5050/api/articles');
      const result = await response.json();
      
      if (result.success) {
        setArticles(result.data);
      } else {
        setMessage({ type: 'error', text: 'Failed to fetch articles' });
      }
    } catch (error) {
      console.error('Error fetching articles:', error);
      setMessage({ type: 'error', text: 'Network error. Please check your connection.' });
    } finally {
      setLoading(false);
    }
  };

  // Fetch data for edit form
  const fetchEditData = async () => {
    try {
      setIsEditLoading(true);
      
      const [categoriesResponse, subcategoriesResponse, tagsResponse, authorsResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/categories?isActive=true`),
        fetch(`${API_BASE_URL}/sub-categories?isActive=true`),
        fetch(`${API_BASE_URL}/tags?isActive=true`),
        fetch(`${API_BASE_URL}/users`)
      ]);

      const [categoriesData, subcategoriesData, tagsData, authorsData] = await Promise.all([
        categoriesResponse.json(),
        subcategoriesResponse.json(),
        tagsResponse.json(),
        authorsResponse.json()
      ]);

      if (categoriesData.success) setCategories(categoriesData.data);
      if (subcategoriesData.success) setSubcategories(subcategoriesData.data);
      if (tagsData.success) setTags(tagsData.data);
      if (authorsData.success) {
        const activeAuthors = authorsData.data.filter((user: PopulatedAuthor) => 
          user.status === 'active' && 
          ['writer', 'editor', 'admin', 'superadmin'].includes(user.role)
        );
        setAuthors(activeAuthors);
      }
    } catch (error) {
      console.error('Error fetching edit data:', error);
    } finally {
      setIsEditLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
    fetchEditData();
  }, []);

  // Get unique categories for filter
  const availableCategories = Array.from(
    new Set(articles.map(article => article.category?._id))
  ).map(id => articles.find(article => article.category?._id === id)?.category)
   .filter((cat): cat is PopulatedCategory => cat !== undefined);

  // Helper function to get author display name
  const getAuthorName = (author: PopulatedAuthor) => {
    return `${author.firstName} ${author.lastName}`;
  };

  // Filter articles based on search and filters
  const filteredArticles = articles.filter(article => {
    const matchesSearch = 
      article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.authors.some(author => 
        getAuthorName(author).toLowerCase().includes(searchTerm.toLowerCase()) ||
        author.username.toLowerCase().includes(searchTerm.toLowerCase())
      );
    
    const matchesStatus = statusFilter === "all" || 
                         (statusFilter === "published" && article.status === "published") ||
                         (statusFilter === "draft" && article.status === "draft");
    
    const matchesCategory = categoryFilter === "all" || article.category?._id === categoryFilter;
    
    return matchesSearch && matchesStatus && matchesCategory;
  });

  // Quick publish/unpublish
  // Quick publish/unpublish - FIXED
const handleQuickPublish = async (article: Article) => {
  setPublishingArticle(article._id);
  try {
    const newIsPublished = !article.isPublished;
    
    const response = await fetch(`http://localhost:5050/api/articles/${article._id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        status: newIsPublished ? 'published' : 'draft',
        isFeatured: newIsPublished ? article.isFeatured : false,
        isSticky: newIsPublished ? article.isSticky : false
      }),
    });

    const result = await response.json();

    if (result.success) {
      setMessage({ 
        type: 'success', 
        text: `Article ${newIsPublished ? 'published' : 'unpublished'} successfully!` 
      });
      fetchArticles(); // Refresh the list
    } else {
      setMessage({ type: 'error', text: result.message || 'Failed to update article status' });
    }
  } catch (error) {
    console.error('Error updating article status:', error);
    setMessage({ type: 'error', text: 'Network error. Please try again.' });
  } finally {
    setPublishingArticle(null);
  }
};

// Quick feature/unfeature - FIXED
const handleQuickFeature = async (article: Article) => {
  if (article.status !== 'published') {
    setMessage({ type: 'error', text: 'Only published articles can be featured' });
    return;
  }

  setFeaturingArticle(article._id);
  try {
    const response = await fetch(`http://localhost:5050/api/articles/${article._id}/featured`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      // No body needed - it's a toggle
    });

    const result = await response.json();

    if (result.success) {
      setMessage({ 
        type: 'success', 
        text: `Article ${!article.isFeatured ? 'featured' : 'unfeatured'} successfully!` 
      });
      fetchArticles(); // Refresh the list
    } else {
      setMessage({ type: 'error', text: result.message || 'Failed to update featured status' });
    }
  } catch (error) {
    console.error('Error updating featured status:', error);
    setMessage({ type: 'error', text: 'Network error. Please try again.' });
  } finally {
    setFeaturingArticle(null);
  }
};

// Quick sticky/unsticky - FIXED
const handleQuickSticky = async (article: Article) => {
  if (article.status !== 'published') {
    setMessage({ type: 'error', text: 'Only published articles can be pinned' });
    return;
  }

  setStickingArticle(article._id);
  try {
    const response = await fetch(`http://localhost:5050/api/articles/${article._id}/sticky`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      // No body needed - it's a toggle
    });

    const result = await response.json();

    if (result.success) {
      setMessage({ 
        type: 'success', 
        text: `Article ${!article.isSticky ? 'pinned' : 'unpinned'} successfully!` 
      });
      fetchArticles(); // Refresh the list
    } else {
      setMessage({ type: 'error', text: result.message || 'Failed to update sticky status' });
    }
  } catch (error) {
    console.error('Error updating sticky status:', error);
    setMessage({ type: 'error', text: 'Network error. Please try again.' });
  } finally {
    setStickingArticle(null);
  }
};

  // Handle editing an article - full modal
  const handleEdit = async (article: Article) => {
    setCurrentArticle(article);
    
    // Populate edit form with article data
    setEditTitle(article.title);
    setEditContent(article.content);
    setEditExcerpt(article.excerpt);
    setEditCategory(article.category._id);
    setEditSubcategory(article.subcategory?._id || "");
    setEditSelectedTags(article.tags.map(tag => tag._id));
    setEditSelectedAuthors(article.authors);
    setEditFeaturedMediaId(article.featuredMedia.id);
    setEditIsPublished(article.status === 'published');
    setEditIsFeatured(article.isFeatured);
    setEditIsSticky(article.isSticky);
    
    setEditDialogOpen(true);
  };

  // Handle saving edited article
  const handleSaveEdit = async () => {
    if (!currentArticle) return;

    try {
      const articleData = {
        title: editTitle,
        content: editContent,
        excerpt: editExcerpt,
        category: editCategory,
        subcategory: editSubcategory || undefined,
        tags: editSelectedTags,
        authors: editSelectedAuthors.map(author => author._id),
        featuredImage: editFeaturedMediaId,
        status: editIsPublished ? 'published' : 'draft',
        isFeatured: editIsFeatured,
        isSticky: editIsSticky,
        allowComments: true,
      };

      const response = await fetch(`http://localhost:5050/api/articles/${currentArticle._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(articleData),
      });

      const result = await response.json();

      if (result.success) {
        setMessage({ type: 'success', text: 'Article updated successfully!' });
        fetchArticles(); // Refresh the list
        setEditDialogOpen(false);
        resetEditForm();
      } else {
        setMessage({ type: 'error', text: result.message || 'Failed to update article' });
      }
    } catch (error) {
      console.error('Error updating article:', error);
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    }
  };

  // Reset edit form
  const resetEditForm = () => {
    setEditTitle("");
    setEditContent("");
    setEditExcerpt("");
    setEditCategory("");
    setEditSubcategory("");
    setEditSelectedTags([]);
    setEditSelectedAuthors([]);
    setEditFeaturedMediaId("");
    setEditIsPublished(false);
    setEditIsFeatured(false);
    setEditIsSticky(false);
    setEditAuthorSearch("");
    setShowAuthorResults(false);
    setCurrentArticle(null);
  };

  // Handle deleting an article
  const handleDelete = (article: Article) => {
    setCurrentArticle(article);
    setDeleteDialogOpen(true);
  };

  // Confirm delete
  const confirmDelete = async () => {
    if (!currentArticle) return;

    try {
      const response = await fetch(`http://localhost:5050/api/articles/${currentArticle._id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        setMessage({ type: 'success', text: 'Article deleted successfully!' });
        fetchArticles(); // Refresh the list
        setDeleteDialogOpen(false);
        setCurrentArticle(null);
      } else {
        setMessage({ type: 'error', text: result.message || 'Failed to delete article' });
      }
    } catch (error) {
      console.error('Error deleting article:', error);
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    }
  };

  // Handle viewing an article
  const handleView = (article: Article) => {
    setCurrentArticle(article);
    setViewDialogOpen(true);
  };

  // Handle creating new article
  const handleNewArticle = () => {
    navigate({ to: '/articles' });
  };

  // Get status badge variant
  const getStatusVariant = (status: string) => {
    switch (status) {
      case "published": return "default";
      case "draft": return "secondary";
      default: return "outline";
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Author search and selection functions for edit modal
  const filteredAuthors = useMemo(() => {
    if (!editAuthorSearch.trim()) return [];
    
    const searchTerm = editAuthorSearch.toLowerCase();
    return authors.filter(author => 
      author.firstName.toLowerCase().includes(searchTerm) ||
      author.lastName.toLowerCase().includes(searchTerm) ||
      author.username.toLowerCase().includes(searchTerm) ||
      author.email.toLowerCase().includes(searchTerm)
    );
  }, [editAuthorSearch, authors]);

  const handleAuthorSearch = (searchTerm: string) => {
    setEditAuthorSearch(searchTerm);
    setShowAuthorResults(searchTerm.length > 0);
  };

  const handleAuthorSelect = (author: PopulatedAuthor) => {
    if (!editSelectedAuthors.find(a => a._id === author._id)) {
      setEditSelectedAuthors(prev => [...prev, author]);
    }
    setEditAuthorSearch("");
    setShowAuthorResults(false);
  };

  const handleAuthorRemove = (authorId: string) => {
    setEditSelectedAuthors(prev => prev.filter(a => a._id !== authorId));
  };

  // Tag selection functions for edit modal
  const handleTagSelect = (tagId: string) => {
    setEditSelectedTags((prev) =>
      prev.includes(tagId) ? prev : [...prev, tagId]
    );
  };

  const handleTagRemove = (tagId: string) => {
    setEditSelectedTags((prev) => prev.filter(id => id !== tagId));
  };

  // Get available subcategories for selected category
  const availableSubcategories = useMemo(() => {
    if (!editCategory) return [];
    
    return subcategories
      .filter(sub => sub.category._id === editCategory && sub.isActive)
      .map(sub => ({
        id: sub._id,
        name: sub.name,
        slug: sub.slug
      }));
  }, [editCategory, subcategories]);

  const isSubcategoryRequired = availableSubcategories.length > 0;
  const subcategoryPlaceholder = useMemo(() => {
    if (!editCategory) {
      return "Select a category first";
    }
    if (!isSubcategoryRequired) {
      return "No sub-categories available";
    }
    return "Select sub-category";
  }, [editCategory, isSubcategoryRequired]);

  // Transform data for frontend use
  const availableTags = useMemo(() => 
    tags.map(tag => ({
      id: tag._id,
      name: tag.name
    })), [tags]);

  const categoriesData = useMemo(() => 
    categories.map(cat => ({
      id: cat._id,
      name: cat.name,
      slug: cat.slug
    })), [categories]);

  // Clear message after 5 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Message Display */}
      {message && (
        <div className={`p-4 rounded-md ${
          message.type === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-800' 
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          {message.text}
        </div>
      )}

      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Article Management</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchArticles} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={handleNewArticle}>
            <Plus className="w-4 h-4 mr-2" />
            New Article
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Articles</CardTitle>
          <CardDescription>
            Manage your articles with full CRUD operations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search articles by title or author..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {availableCategories.map(category => (
                  <SelectItem key={category._id} value={category._id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
              <p>Loading articles...</p>
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Authors</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Views</TableHead>
                      <TableHead className="text-center">Quick Actions</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredArticles.map((article) => (
                      <TableRow key={article._id}>
                        <TableCell className="font-medium max-w-xs truncate">
                          <div className="flex items-center gap-2">
                            {article.title}
                            {article.isFeatured && (
                              <Tooltip>
                                <TooltipTrigger>
                                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                </TooltipTrigger>
                                <TooltipContent>Featured</TooltipContent>
                              </Tooltip>
                            )}
                            {article.isSticky && (
                              <Tooltip>
                                <TooltipTrigger>
                                  <Pin className="w-4 h-4 text-blue-500 fill-blue-500" />
                                </TooltipTrigger>
                                <TooltipContent>Pinned</TooltipContent>
                              </Tooltip>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {Array.isArray(article.authors) && article.authors.length > 0 ? (
                              <>
                                {article.authors.slice(0, 2).map((author) => (
                                  <Badge key={author._id} variant="outline" className="text-xs">
                                    {getAuthorName(author)}
                                  </Badge>
                                ))}
                                {article.authors.length > 2 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{article.authors.length - 2} more
                                  </Badge>
                                )}
                              </>
                            ) : (
                              <Badge variant="secondary" className="text-xs">
                                Unknown
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {article.category?.name || 'Unknown'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusVariant(article.status)}>
                            {article.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDate(article.createdAt)}</TableCell>
                        <TableCell>{article.views}</TableCell>
                        
                        {/* Quick Actions Column */}
                        <TableCell className="text-center">
                          <div className="flex justify-center gap-1">
                            {/* Publish/Unpublish Button */}
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleQuickPublish(article)}
                                  disabled={publishingArticle === article._id}
                                  className={cn(
                                    "h-8 w-8",
                                    article.status === 'published' 
                                      ? "text-green-600 hover:text-green-700 hover:bg-green-50" 
                                      : "text-gray-500 hover:text-gray-700"
                                  )}
                                >
                                  {publishingArticle === article._id ? (
                                    <RefreshCw className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <Send className="w-3 h-3" />
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                {article.status === 'published' ? 'Unpublish' : 'Publish'}
                              </TooltipContent>
                            </Tooltip>

                            {/* Feature/Unfeature Button */}
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleQuickFeature(article)}
                                  disabled={featuringArticle === article._id || article.status !== 'published'}
                                  className={cn(
                                    "h-8 w-8",
                                    article.isFeatured 
                                      ? "text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50" 
                                      : "text-gray-500 hover:text-gray-700",
                                    article.status !== 'published' && "opacity-50 cursor-not-allowed"
                                  )}
                                >
                                  {featuringArticle === article._id ? (
                                    <RefreshCw className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <Star className={cn("w-3 h-3", article.isFeatured && "fill-current")} />
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                {article.isFeatured ? 'Unfeature' : 'Feature'}
                                {article.status !== 'published' && ' (Published only)'}
                              </TooltipContent>
                            </Tooltip>

                            {/* Sticky/Unsticky Button */}
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleQuickSticky(article)}
                                  disabled={stickingArticle === article._id || article.status !== 'published'}
                                  className={cn(
                                    "h-8 w-8",
                                    article.isSticky 
                                      ? "text-blue-600 hover:text-blue-700 hover:bg-blue-50" 
                                      : "text-gray-500 hover:text-gray-700",
                                    article.status !== 'published' && "opacity-50 cursor-not-allowed"
                                  )}
                                >
                                  {stickingArticle === article._id ? (
                                    <RefreshCw className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <Pin className={cn("w-3 h-3", article.isSticky && "fill-current")} />
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                {article.isSticky ? 'Unpin' : 'Pin to top'}
                                {article.status !== 'published' && ' (Published only)'}
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        </TableCell>

                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => handleView(article)}>
                                <Eye className="w-4 h-4 mr-2" />
                                View
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEdit(article)}>
                                <Edit className="w-4 h-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              
                              {/* Add quick actions to dropdown menu as well */}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => handleQuickPublish(article)}
                                disabled={publishingArticle === article._id}
                              >
                                {publishingArticle === article._id ? (
                                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                  <Send className="w-4 h-4 mr-2" />
                                )}
                                {article.status === 'published' ? 'Unpublish' : 'Publish'}
                              </DropdownMenuItem>
                              
                              <DropdownMenuItem 
                                onClick={() => handleQuickFeature(article)}
                                disabled={featuringArticle === article._id || article.status !== 'published'}
                              >
                                <Star className={cn("w-4 h-4 mr-2", article.isFeatured && "fill-current")} />
                                {article.isFeatured ? 'Unfeature' : 'Feature'}
                              </DropdownMenuItem>
                              
                              <DropdownMenuItem 
                                onClick={() => handleQuickSticky(article)}
                                disabled={stickingArticle === article._id || article.status !== 'published'}
                              >
                                <Pin className={cn("w-4 h-4 mr-2", article.isSticky && "fill-current")} />
                                {article.isSticky ? 'Unpin' : 'Pin to top'}
                              </DropdownMenuItem>

                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => handleDelete(article)}
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {filteredArticles.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <p>No articles found matching your criteria</p>
                  {articles.length === 0 && (
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={handleNewArticle}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create your first article
                    </Button>
                  )}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Full Screen Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-none w-[98vw] h-[95vh] flex flex-col">
              <DialogHeader>
            <DialogTitle className="text-2xl">Edit Article: {currentArticle?.title}</DialogTitle>
            <DialogDescription>
              Make changes to your article. All fields are editable.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto space-y-6 py-4">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Enter article title"
                className="text-lg font-semibold"
              />
            </div>

            {/* Content */}
            <div className="space-y-2">
              <Label htmlFor="edit-content">Content</Label>
              <Textarea
                id="edit-content"
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                placeholder="Enter article content"
                rows={12}
                className="resize-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Featured Media & Excerpt */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-featured-media">Featured Media ID</Label>
                  <Input
                    id="edit-featured-media"
                    value={editFeaturedMediaId}
                    onChange={(e) => setEditFeaturedMediaId(e.target.value)}
                    placeholder="Enter featured media ID"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-excerpt">Excerpt</Label>
                  <Textarea
                    id="edit-excerpt"
                    value={editExcerpt}
                    onChange={(e) => setEditExcerpt(e.target.value)}
                    placeholder="Enter excerpt"
                    rows={3}
                  />
                </div>
              </div>

              {/* Authors */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Authors</Label>
                  <div className="flex flex-wrap gap-2 p-2 border rounded-md min-h-10">
                    {editSelectedAuthors.map((author) => (
                      <Badge
                        key={author._id}
                        variant="secondary"
                        className="px-3 py-1 text-sm flex items-center gap-1"
                      >
                        {getAuthorName(author)} ({author.role})
                        <button
                          type="button"
                          onClick={() => handleAuthorRemove(author._id)}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                    {editSelectedAuthors.length === 0 && (
                      <span className="text-muted-foreground text-sm">No authors selected</span>
                    )}
                  </div>

                  {/* Author Search */}
                  <div className="relative">
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        value={editAuthorSearch}
                        onChange={(e) => handleAuthorSearch(e.target.value)}
                        placeholder="Search for authors..."
                        className="pl-10"
                      />
                    </div>
                    
                    {/* Search Results */}
                    {showAuthorResults && (
                      <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-auto">
                        {filteredAuthors.length > 0 ? (
                          filteredAuthors.map((author) => (
                            <div
                              key={author._id}
                              className="p-3 hover:bg-muted cursor-pointer border-b last:border-b-0"
                              onClick={() => handleAuthorSelect(author)}
                            >
                              <div className="font-medium">
                                {getAuthorName(author)}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {author.username} • {author.email} • {author.role}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="p-3 text-muted-foreground text-center">
                            No authors found
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Category & Subcategory */}
                <div className="space-y-2 flex flex-row gap-4">
                  <div className="space-y-2 flex-1">
                    <Label htmlFor="edit-category">Category</Label>
                    <Select value={editCategory} onValueChange={setEditCategory}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categoriesData.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2 flex-1">
                    <Label htmlFor="edit-subcategory">
                      Sub-category
                      <Tooltip>
                        <TooltipTrigger>
                          <span className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full border border-muted-foreground/50 text-[10px] text-muted-foreground cursor-help">
                            ?
                          </span>
                        </TooltipTrigger>
                        <TooltipContent className='max-w-64 flex-wrap'>
                          {availableSubcategories.length > 0 
                            ? "Select a sub-category to further classify this article"
                            : "No sub-categories available for the selected category"
                          }
                        </TooltipContent>
                      </Tooltip>
                    </Label>
                    <Select
                      value={editSubcategory}
                      onValueChange={setEditSubcategory}
                      disabled={!isSubcategoryRequired}
                    >
                      <SelectTrigger className={!isSubcategoryRequired ? "text-muted-foreground" : ""}>
                        <SelectValue placeholder={subcategoryPlaceholder} />
                      </SelectTrigger>
                      <SelectContent>
                        {availableSubcategories.map((item) => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Tags */}
                <div className="space-y-2">
                  <Label>Tags</Label>
                  <div className="flex flex-wrap gap-2 p-2 border rounded-md min-h-10">
                    {editSelectedTags.map((tagId) => {
                      const tag = availableTags.find(t => t.id === tagId);
                      return (
                        <Badge
                          key={tagId}
                          variant="secondary"
                          className="px-3 py-1 text-sm cursor-pointer"
                          onClick={() => handleTagRemove(tagId)}
                        >
                          {tag?.name} ×
                        </Badge>
                      );
                    })}
                    {editSelectedTags.length === 0 && (
                      <span className="text-muted-foreground text-sm">No tags selected</span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {availableTags
                      .filter((tag) => !editSelectedTags.includes(tag.id))
                      .map((tag) => (
                        <Badge
                          key={tag.id}
                          variant="outline"
                          className="cursor-pointer px-3 py-1 text-sm"
                          onClick={() => handleTagSelect(tag.id)}
                        >
                          {tag.name}
                        </Badge>
                      ))}
                  </div>
                </div>

                {/* Status Controls */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="edit-publish"
                      checked={editIsPublished}
                      onCheckedChange={setEditIsPublished}
                    />
                    <Label htmlFor="edit-publish">Published</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="edit-featured"
                      checked={editIsFeatured}
                      onCheckedChange={setEditIsFeatured}
                      disabled={!editIsPublished}
                    />
                    <Label htmlFor="edit-featured" className={!editIsPublished ? "text-muted-foreground" : ""}>
                      Featured article
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="edit-sticky"
                      checked={editIsSticky}
                      onCheckedChange={setEditIsSticky}
                      disabled={!editIsPublished}
                    />
                    <Label htmlFor="edit-sticky" className={!editIsPublished ? "text-muted-foreground" : ""}>
                      Sticky article (pinned to top)
                    </Label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setEditDialogOpen(false);
              resetEditForm();
            }}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={isEditLoading}>
              {isEditLoading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the article
              "{currentArticle?.title}" from the database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{currentArticle?.title}</DialogTitle>
            <DialogDescription>
              Article details and statistics
            </DialogDescription>
          </DialogHeader>
          {currentArticle && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Authors</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {currentArticle.authors.map((author) => (
                      <Badge key={author._id} variant="secondary">
                        {getAuthorName(author)}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Category</Label>
                  <p>{currentArticle.category?.name || 'Unknown'}</p>
                </div>
              </div>
              {currentArticle.subcategory && (
                <div>
                  <Label className="text-muted-foreground">Subcategory</Label>
                  <p>{currentArticle.subcategory.name}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <Badge variant={getStatusVariant(currentArticle.status)}>
                    {currentArticle.status}
                  </Badge>
                </div>
                <div>
                  <Label className="text-muted-foreground">Created</Label>
                  <p>{formatDate(currentArticle.createdAt)}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Views</Label>
                  <p>{currentArticle.views}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Tags</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {currentArticle.tags.map((tag) => (
                      <Badge key={tag._id} variant="outline">
                        {tag.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground">Excerpt</Label>
                <p className="mt-1 text-sm">{currentArticle.excerpt}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Featured</Label>
                <p>{currentArticle.isFeatured ? 'Yes' : 'No'}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Sticky</Label>
                <p>{currentArticle.isSticky ? 'Yes' : 'No'}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}