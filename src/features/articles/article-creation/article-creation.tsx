import { useMemo, useState, useEffect } from "react";
import { $getRoot } from "lexical";

import { Editor } from "@/components/blocks/editor-00/editor";
import { TagInput } from "@/components/form/tag-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils";
import { Search, X } from "lucide-react";

import { MediaPicker, type MediaItem } from "@/components/media/media-picker";
import mediaLibraryData from "@/data/media-library.json";

// Define types for fetched data
interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  isActive: boolean;
}

interface SubCategory {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  isActive: boolean;
  category: {
    _id: string;
    name: string;
    slug: string;
  };
}

interface Tag {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  color: string;
  isActive: boolean;
}

interface Author {
  _id: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  role: string;
  status: string;
}

// Define SerializedEditorState type based on Lexical's structure
interface SerializedEditorState {
  root: {
    children: any[];
    direction: string | null;
    format: string;
    indent: number;
    type: string;
    version: number;
  };
}

type FieldErrorKey =
  | "title"
  | "content"
  | "featuredMedia"
  | "excerpt"
  | "authors"
  | "category"
  | "subcategory"
  | "tags";

const API_BASE_URL = 'http://localhost:5050/api';

export default function ArticleCreation() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState<SerializedEditorState | undefined>();
  const [contentText, setContentText] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [category, setCategory] = useState("");
  const [subcategory, setSubcategory] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedAuthors, setSelectedAuthors] = useState<Author[]>([]);
  const [featuredMediaId, setFeaturedMediaId] = useState<string>("");
  const [isPublished, setIsPublished] = useState(false);
  const [isFeatured, setIsFeatured] = useState(false);
  const [isSticky, setIsSticky] = useState(false);
  const [formErrors, setFormErrors] = useState<Partial<Record<FieldErrorKey, string>>>({});
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [pendingSubmission, setPendingSubmission] = useState<{
    title: string;
    content: string;
    category: string;
    subcategory: string;
    tags: string[];
    authors: string[];
    featuredMediaId: string;
    excerpt: string;
    isPublished: boolean;
    isFeatured: boolean;
    isSticky: boolean;
  } | null>(null);
  const [editorResetKey, setEditorResetKey] = useState(0);
  
  // State for fetched data
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<SubCategory[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [authors, setAuthors] = useState<Author[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Search functionality for authors
  const [authorSearch, setAuthorSearch] = useState("");
  const [showAuthorResults, setShowAuthorResults] = useState(false);

  // Filter authors based on search
  const filteredAuthors = useMemo(() => {
    if (!authorSearch.trim()) return [];
    
    const searchTerm = authorSearch.toLowerCase();
    return authors.filter(author => 
      author.firstName.toLowerCase().includes(searchTerm) ||
      author.lastName.toLowerCase().includes(searchTerm) ||
      author.username.toLowerCase().includes(searchTerm) ||
      author.email.toLowerCase().includes(searchTerm)
    );
  }, [authorSearch, authors]);

  // Get display names for selected items
  const selectedCategoryName = useMemo(() => {
    const found = categories.find(cat => cat._id === category);
    return found ? found.name : "";
  }, [category, categories]);

  const selectedSubcategoryName = useMemo(() => {
    const found = subcategories.find(sub => sub._id === subcategory);
    return found ? found.name : "";
  }, [subcategory, subcategories]);

  const selectedTagNames = useMemo(() => {
    return selectedTags.map(tagId => {
      const found = tags.find(tag => tag._id === tagId);
      return found ? found.name : tagId;
    });
  }, [selectedTags, tags]);

  // Fetch data from backend
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setFetchError(null);

        // Fetch categories, subcategories, and tags
        const [categoriesResponse, subcategoriesResponse, tagsResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/categories?isActive=true`),
          fetch(`${API_BASE_URL}/sub-categories?isActive=true`),
          fetch(`${API_BASE_URL}/tags?isActive=true`)
        ]);

        const [categoriesData, subcategoriesData, tagsData] = await Promise.all([
          categoriesResponse.json(),
          subcategoriesResponse.json(),
          tagsResponse.json()
        ]);

        if (categoriesData.success) {
          setCategories(categoriesData.data);
        } else {
          throw new Error(categoriesData.message || 'Failed to fetch categories');
        }

        if (subcategoriesData.success) {
          setSubcategories(subcategoriesData.data);
        } else {
          console.warn('Failed to fetch subcategories:', subcategoriesData.message);
        }

        if (tagsData.success) {
          setTags(tagsData.data);
        } else {
          throw new Error(tagsData.message || 'Failed to fetch tags');
        }

        // Fetch authors
        await fetchAuthors();

      } catch (error: unknown) {
        console.error('Error fetching data:', error);
        setFetchError(error instanceof Error ? error.message : 'Failed to load form data');
      } finally {
        setIsLoading(false);
      }
    };

    const fetchAuthors = async () => {
      try {
        console.log('Fetching authors from /api/users...');
        
        const allUsersResponse = await fetch(`${API_BASE_URL}/users`);
        const allUsersData = await allUsersResponse.json();
        
        console.log('All users response:', allUsersData);
        
        if (allUsersData.success) {
          console.log('All users found:', allUsersData.data.length);
          
          // Filter for active authors with appropriate roles
          const activeAuthors = allUsersData.data.filter((user: Author) => 
            user.status === 'active' && 
            ['writer', 'editor', 'admin', 'superadmin'].includes(user.role)
          );
          
          console.log('Filtered active authors:', activeAuthors);
          setAuthors(activeAuthors);
        } else {
          console.warn('Failed to fetch users:', allUsersData.message);
          setAuthors([]);
        }
      } catch (error: unknown) {
        console.error('Error fetching authors:', error);
        setAuthors([]);
      }
    };

    fetchData();
  }, []);

  // Get subcategories for the selected category
  const availableSubcategories = useMemo(() => {
    if (!category) return [];
    
    return subcategories
      .filter(sub => sub.category._id === category && sub.isActive)
      .map(sub => ({
        id: sub._id,
        name: sub.name,
        slug: sub.slug
      }));
  }, [category, subcategories]);

  const isSubcategoryRequired = availableSubcategories.length > 0;
  const subcategoryPlaceholder = useMemo(() => {
    if (!category) {
      return "Select a category first";
    }
    if (!isSubcategoryRequired) {
      return "No sub-categories available";
    }
    return "Select sub-category";
  }, [category, isSubcategoryRequired]);

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

  const mediaLibrary = useMemo(() => mediaLibraryData as MediaItem[], []);

  // Convert Lexical editor state to HTML
  const convertLexicalToHtml = (editorState: SerializedEditorState): string => {
    try {
      // Extract text content from Lexical state and convert to HTML paragraphs
      const extractTextFromNode = (node: any): string => {
        if (node.type === 'text') {
          return node.text || '';
        }
        
        if (node.type === 'paragraph') {
          if (node.children && Array.isArray(node.children)) {
            const paragraphContent = node.children.map(extractTextFromNode).join('');
            return paragraphContent ? `<p>${paragraphContent}</p>` : '';
          }
        }
        
        if (node.children && Array.isArray(node.children)) {
          return node.children.map(extractTextFromNode).join('');
        }
        
        return '';
      };

      if (editorState?.root?.children) {
        const htmlContent = editorState.root.children
          .map(extractTextFromNode)
          .filter(Boolean)
          .join('\n');
        
        return htmlContent || '<p></p>';
      }
      
      return '<p></p>';
    } catch (error) {
      console.error('Error converting Lexical to HTML:', error);
      return '<p></p>';
    }
  };

  const isContentEmpty = useMemo(
    () => contentText.trim().length === 0,
    [contentText],
  );

  const clearFieldError = (field: FieldErrorKey) => {
    setFormErrors((prev) => {
      if (!prev[field]) {
        return prev;
      }

      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const resetForm = () => {
    setTitle("");
    setContent(undefined);
    setContentText("");
    setExcerpt("");
    setCategory("");
    setSubcategory("");
    setSelectedTags([]);
    setSelectedAuthors([]);
    setFeaturedMediaId("");
    setIsPublished(false);
    setIsFeatured(false);
    setIsSticky(false);
    setAuthorSearch("");
    setShowAuthorResults(false);
    setEditorResetKey((prev) => prev + 1);
    setFormErrors({});
    setPendingSubmission(null);
    setConfirmOpen(false);
    setSubmitMessage(null);
  };

  const checkValidity = (e: React.FormEvent) => {
    e.preventDefault();

    const errors: Partial<Record<FieldErrorKey, string>> = {};

    if (!title.trim()) {
      errors.title = "Title is required.";
    }

    if (isContentEmpty) {
      errors.content = "Content is required.";
    }

    if (!featuredMediaId) {
      errors.featuredMedia = "Featured media is required.";
    }

    if (!excerpt.trim()) {
      errors.excerpt = "Caption is required.";
    }

    if (selectedAuthors.length === 0) {
      errors.authors = "At least one author must be selected.";
    }

    if (!category) {
      errors.category = "Category is required.";
    }

    if (selectedTags.length === 0) {
      errors.tags = "At least one tag must be selected.";
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});

    // Convert Lexical content to HTML
    let htmlContent = "";
    if (content) {
      htmlContent = convertLexicalToHtml(content);
    }

    setPendingSubmission({
      title,
      content: htmlContent, // Use HTML content instead of Lexical JSON
      category,
      subcategory,
      tags: selectedTags,
      authors: selectedAuthors.map(author => author._id), // Just author IDs
      featuredMediaId,
      excerpt,
      isPublished,
      isFeatured: isPublished ? isFeatured : false,
      isSticky: isPublished ? isSticky : false,
    });
    setConfirmOpen(true);
  };

  const handleSubmitOnConfirm = async () => {
    if (!pendingSubmission) {
      return;
    }

    setIsSubmitting(true);
    setSubmitMessage(null);

    try {
      // Prepare the article data with proper formatting
      const articleData: any = {
        title: pendingSubmission.title,
        content: pendingSubmission.content, // HTML content
        excerpt: pendingSubmission.excerpt,
        category: pendingSubmission.category, // String ID
        tags: pendingSubmission.tags, // Array of string IDs
        authors: pendingSubmission.authors, // Array of string IDs
        featuredImage: pendingSubmission.featuredMediaId, // String ID
        status: pendingSubmission.isPublished ? 'published' : 'draft',
        isSticky: pendingSubmission.isSticky,
        isFeatured: pendingSubmission.isFeatured,
        allowComments: true,
      };

      // Add subcategory if selected - use correct field name
      if (pendingSubmission.subcategory) {
        articleData.subcategory = pendingSubmission.subcategory; // String ID
      }

      console.log('Submitting article data:', articleData);

      const response = await fetch(`${API_BASE_URL}/articles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(articleData),
      });

      const result = await response.json();

      if (result.success) {
        setSubmitMessage({
          type: 'success',
          message: `Article "${pendingSubmission.title}" has been ${pendingSubmission.isPublished ? 'published' : 'saved as draft'} successfully!`
        });

        resetForm();
      } else {
        console.error('Backend error:', result);
        setSubmitMessage({
          type: 'error',
          message: result.message || result.errors?.join(', ') || "Failed to create article. Please try again."
        });
      }
    } catch (error: unknown) {
      console.error('Error creating article:', error);
      setSubmitMessage({
        type: 'error',
        message: "Network error. Please check your connection and try again."
      });
    } finally {
      setIsSubmitting(false);
      setPendingSubmission(null);
      setConfirmOpen(false);
    }
  };

  const handleSaveDraft = async () => {
    // Validate required fields for draft
    if (!title.trim() || isContentEmpty || !category || !featuredMediaId) {
      setSubmitMessage({
        type: 'error',
        message: "Title, content, category, and featured media are required even for drafts."
      });
      return;
    }

    setIsSubmitting(true);
    setSubmitMessage(null);

    try {
      // Convert Lexical content to HTML
      let htmlContent = "";
      if (content) {
        htmlContent = convertLexicalToHtml(content);
      }

      const articleData: any = {
        title,
        content: htmlContent, // HTML content
        excerpt,
        category, // String ID
        tags: selectedTags, // Array of string IDs
        authors: selectedAuthors.map(author => author._id), // Array of string IDs
        featuredImage: featuredMediaId, // String ID
        status: 'draft',
        isSticky: false,
        isFeatured: false,
        allowComments: true,
      };

      // Add subcategory if selected - use correct field name
      if (subcategory) {
        articleData.subcategory = subcategory; // String ID
      }

      console.log('Saving draft data:', articleData);

      const response = await fetch(`${API_BASE_URL}/articles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(articleData),
      });

      const result = await response.json();

      if (result.success) {
        setSubmitMessage({
          type: 'success',
          message: `Draft "${title}" has been saved successfully!`
        });

        resetForm();
      } else {
        console.error('Backend error:', result);
        setSubmitMessage({
          type: 'error',
          message: result.message || result.errors?.join(', ') || "Failed to save draft. Please try again."
        });
      }
    } catch (error: unknown) {
      console.error('Error saving draft:', error);
      setSubmitMessage({
        type: 'error',
        message: "Network error. Please check your connection and try again."
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Author search and selection functions
  const handleAuthorSearch = (searchTerm: string) => {
    setAuthorSearch(searchTerm);
    setShowAuthorResults(searchTerm.length > 0);
  };

  const handleAuthorSelect = (author: Author) => {
    if (!selectedAuthors.find(a => a._id === author._id)) {
      setSelectedAuthors(prev => [...prev, author]);
    }
    setAuthorSearch("");
    setShowAuthorResults(false);
    if (formErrors.authors) {
      clearFieldError("authors");
    }
  };

  const handleAuthorRemove = (authorId: string) => {
    setSelectedAuthors(prev => prev.filter(a => a._id !== authorId));
  };

  // Tag selection functions
  const handleTagSelect = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev : [...prev, tagId]
    );
    if (formErrors.tags && selectedTags.length > 0) {
      clearFieldError("tags");
    }
  };

  const handleTagRemove = (tagId: string) => {
    setSelectedTags((prev) => prev.filter(id => id !== tagId));
  };

  // Display functions for selected items
  const getAuthorDisplayName = (author: Author) => {
    return `${author.firstName} ${author.lastName} (${author.role})`;
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Create New Article</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-32">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
                <p className="text-muted-foreground">Loading form data...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Create New Article</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md">
              <p className="font-medium">Error loading form data</p>
              <p className="text-sm mt-1">{fetchError}</p>
              <Button 
                onClick={() => window.location.reload()} 
                className="mt-2"
                variant="outline"
                size="sm"
              >
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      {/* Success/Error Message */}
      {submitMessage && (
        <div className={`mb-4 p-4 rounded-md ${
          submitMessage.type === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-800' 
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          {submitMessage.message}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Create New Article</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={checkValidity} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title" className='gap-0'><span className='text-destructive'>*</span>Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => {
                  const value = e.target.value;
                  setTitle(value);
                  if (formErrors.title && value.trim()) {
                    clearFieldError("title");
                  }
                }}
                placeholder="Enter article title"
                className={cn(
                  "text-8xl font-semibold",
                  formErrors.title && "border-destructive focus-visible:ring-destructive"
                )}
                aria-invalid={Boolean(formErrors.title)}
              />
              {formErrors.title && (
                <p className="text-xs text-destructive">{formErrors.title}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label id="content-label" className='gap-0'><span className='text-destructive'>*</span>Content</Label>
              <div role="group" aria-labelledby="content-label">
                <Editor
                  key={editorResetKey}
                  onSerializedChange={setContent}
                  onChange={(editorState) => {
                    editorState.read(() => {
                      const text = $getRoot().getTextContent().trim();
                      setContentText(text);
                      if (formErrors.content && text.length > 0) {
                        clearFieldError("content");
                      }
                    });
                  }}
                />
              </div>
              {formErrors.content && (
                <p className="text-xs text-destructive">{formErrors.content}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Featured Media */}
              <div className="space-y-2">
                <Label htmlFor="featured-media" className='gap-0'><span className='text-destructive'>*</span>Featured Media</Label>
                <MediaPicker
                  value={featuredMediaId || undefined}
                  items={mediaLibrary}
                  onChange={(id) => {
                    setFeaturedMediaId(id || "");
                    if (formErrors.featuredMedia && id) {
                      clearFieldError("featuredMedia");
                    }
                  }}
                  placeholder="Choose featured media"
                  error={Boolean(formErrors.featuredMedia)}
                />
                {formErrors.featuredMedia && (
                  <p className="text-xs text-destructive">{formErrors.featuredMedia}</p>
                )}
              </div>
              
              {/* Caption */}
              <div className="space-y-2">
                <Label htmlFor="excerpt" className='gap-0'><span className='text-destructive'>*</span>Caption</Label>
                <Input
                  id="excerpt"
                  value={excerpt}
                  onChange={(e) => {
                    const value = e.target.value;
                    setExcerpt(value);
                    if (formErrors.excerpt && value.trim()) {
                      clearFieldError("excerpt");
                    }
                  }}
                  placeholder="Enter caption"
                  className={cn(
                    "italic",
                    formErrors.excerpt && "border-destructive focus-visible:ring-destructive"
                  )}
                  aria-invalid={Boolean(formErrors.excerpt)}
                />
                {formErrors.excerpt && (
                  <p className="text-xs text-destructive">{formErrors.excerpt}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-6">
                {/* Authors - Searchable Input */}
                <div className="space-y-2">
                  <Label htmlFor="authors" className='gap-0'><span className='text-destructive'>*</span>Authors</Label>
                  
                  {/* Selected Authors */}
                  <div className={cn(
                    "flex flex-wrap gap-2 p-2 border rounded-md min-h-10",
                    formErrors.authors && "border-destructive"
                  )}>
                    {selectedAuthors.map((author) => (
                      <Badge
                        key={author._id}
                        variant="secondary"
                        className="px-3 py-1 text-sm flex items-center gap-1"
                      >
                        {getAuthorDisplayName(author)}
                        <button
                          type="button"
                          onClick={() => handleAuthorRemove(author._id)}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                    {selectedAuthors.length === 0 && (
                      <span className="text-muted-foreground text-sm">No authors selected</span>
                    )}
                  </div>
                  {formErrors.authors && (
                    <p className="text-xs text-destructive">{formErrors.authors}</p>
                  )}

                  {/* Author Search */}
                  <div className="relative">
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        value={authorSearch}
                        onChange={(e) => handleAuthorSearch(e.target.value)}
                        placeholder="Search for authors by name, username, or email..."
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
                                {getAuthorDisplayName(author)}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {author.username} • {author.email}
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
                
                {/* Category & sub-category */}
                <div className="space-y-2 flex flex-row gap-4">
                  <div className="space-y-2 flex-1">
                    <Label htmlFor="category" className='gap-0'><span className='text-destructive'>*</span>Category</Label>
                    <Select
                      value={category}
                      onValueChange={(value) => {
                        setCategory(value);
                        setSubcategory(""); // Reset subcategory when category changes
                        if (formErrors.category && value) {
                          clearFieldError("category");
                        }
                        if (formErrors.subcategory) {
                          clearFieldError("subcategory");
                        }
                      }}
                    >
                      <SelectTrigger
                        className={cn(
                          formErrors.category && "border-destructive focus:ring-destructive"
                        )}
                        aria-invalid={Boolean(formErrors.category)}
                      >
                        <SelectValue placeholder={category ? selectedCategoryName : "Select category"} />
                      </SelectTrigger>
                      <SelectContent>
                        {categoriesData.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {formErrors.category && (
                      <p className="text-xs text-destructive">{formErrors.category}</p>
                    )}
                  </div>

                  <div className="space-y-2 flex-1">
                    <Label htmlFor="subcategory">
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
                      value={subcategory}
                      onValueChange={(value) => {
                        setSubcategory(value);
                        if (formErrors.subcategory && value) {
                          clearFieldError("subcategory");
                        }
                      }}
                      disabled={!isSubcategoryRequired}
                    >
                      <SelectTrigger
                        className={cn(
                          formErrors.subcategory &&
                            "border-destructive focus:ring-destructive",
                          !isSubcategoryRequired && "text-muted-foreground"
                        )}
                        aria-invalid={Boolean(formErrors.subcategory)}
                        disabled={!isSubcategoryRequired}
                      >
                        <SelectValue placeholder={subcategory ? selectedSubcategoryName : subcategoryPlaceholder} />
                      </SelectTrigger>
                      <SelectContent>
                        {availableSubcategories.map((item) => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {formErrors.subcategory && (
                      <p className="text-xs text-destructive">{formErrors.subcategory}</p>
                    )}
                  </div>
                </div>

                {/* New Featured and Sticky Controls */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="publish"
                      checked={isPublished}
                      onCheckedChange={setIsPublished}
                    />
                    <Label htmlFor="publish">Publish immediately</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="featured"
                      checked={isFeatured}
                      onCheckedChange={setIsFeatured}
                      disabled={!isPublished}
                    />
                    <Label htmlFor="featured" className={!isPublished ? "text-muted-foreground" : ""}>
                      Featured article
                      {!isPublished && <span className="text-xs text-muted-foreground ml-1">(requires publishing)</span>}
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="sticky"
                      checked={isSticky}
                      onCheckedChange={setIsSticky}
                      disabled={!isPublished}
                    />
                    <Label htmlFor="sticky" className={!isPublished ? "text-muted-foreground" : ""}>
                      Sticky article (pinned to top)
                      {!isPublished && <span className="text-xs text-muted-foreground ml-1">(requires publishing)</span>}
                    </Label>
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Creating..." : "Create Article"}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handleSaveDraft}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Saving..." : "Save Draft"}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags" className='gap-0'><span className='text-destructive'>*</span>Tags</Label>
                <div className={cn(
                  "flex flex-wrap gap-2 p-2 border rounded-md min-h-10",
                  formErrors.tags && "border-destructive"
                )}>
                  {selectedTagNames.map((tagName, index) => (
                    <Badge
                      key={selectedTags[index]}
                      variant="secondary"
                      className="px-3 py-1 text-sm cursor-pointer"
                      onClick={() => handleTagRemove(selectedTags[index])}
                    >
                      {tagName} ×
                    </Badge>
                  ))}
                  {selectedTags.length === 0 && (
                    <span className="text-muted-foreground text-sm">No tags selected</span>
                  )}
                </div>
                {formErrors.tags && (
                  <p className="text-xs text-destructive">{formErrors.tags}</p>
                )}
                <div className="flex flex-wrap gap-2">
                  {availableTags
                    .filter((tag) => !selectedTags.includes(tag.id))
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
                  {availableTags.length === 0 && (
                    <p className="text-muted-foreground">No tags available</p>
                  )}
                </div>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      <AlertDialog
        open={confirmOpen}
        onOpenChange={(open) => {
          setConfirmOpen(open)
          if (!open) {
            setPendingSubmission(null)
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit this article?</AlertDialogTitle>
            <AlertDialogDescription>
              Once confirmed, the article will be {pendingSubmission?.isPublished ? 'published immediately' : 'saved as draft'}.
              {pendingSubmission?.isFeatured && " It will be featured."}
              {pendingSubmission?.isSticky && " It will be pinned to the top."}
              {pendingSubmission?.subcategory && " It will be assigned to the selected sub-category."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingSubmission(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleSubmitOnConfirm}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creating..." : "Confirm submission"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}