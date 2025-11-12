import { useMemo, useState, useEffect } from "react";
import { $getRoot, type SerializedEditorState } from "lexical";

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

import { MediaPicker, type MediaItem } from "@/components/media/media-picker";
// Remove hardcoded imports
// import categoriesData from "@/data/categories.json";
// import subcategoriesData from "@/data/subcategories.json";
// import tagData from "@/data/tags.json";
// import authorData from "@/data/authors.json";
import mediaLibraryData from "@/data/media-library.json";

// Define types for fetched data
interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  isActive: boolean;
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

type FieldErrorKey =
  | "title"
  | "content"
  | "featuredMedia"
  | "excerpt"
  | "authors"
  | "category"
  | "subcategory"
  | "tags";

export default function ArticleCreation() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState<SerializedEditorState | undefined>();
  const [contentText, setContentText] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [category, setCategory] = useState("");
  const [subcategory, setSubcategory] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedAuthors, setSelectedAuthors] = useState<string[]>([]);
  const [featuredMediaId, setFeaturedMediaId] = useState<string | null>(null);
  const [isPublished, setIsPublished] = useState(false);
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
    featuredMedia: MediaItem | null;
    excerpt: string;
    isPublished: boolean;
  } | null>(null);
  const [editorResetKey, setEditorResetKey] = useState(0);
  
  // State for fetched data
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [authors, setAuthors] = useState<Author[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const API_BASE_URL = 'http://localhost:5050/api';

  // Fetch data from backend
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setFetchError(null);

        // Fetch categories
        const categoriesResponse = await fetch(`${API_BASE_URL}/categories?isActive=true`);
        const categoriesData = await categoriesResponse.json();
        
        if (categoriesData.success) {
          setCategories(categoriesData.data);
        } else {
          throw new Error(categoriesData.message || 'Failed to fetch categories');
        }

        // Fetch tags
        const tagsResponse = await fetch(`${API_BASE_URL}/tags?isActive=true`);
        const tagsData = await tagsResponse.json();
        
        if (tagsData.success) {
          setTags(tagsData.data);
        } else {
          throw new Error(tagsData.message || 'Failed to fetch tags');
        }

        // Fetch users (authors) - only active users
        const usersResponse = await fetch(`${API_BASE_URL}/users?status=active&role=admin,manager,superadmin`);
        const usersData = await usersResponse.json();
        
        if (usersData.success) {
          setAuthors(usersData.data);
        } else {
          throw new Error(usersData.message || 'Failed to fetch authors');
        }

      } catch (error: any) {
        console.error('Error fetching data:', error);
        setFetchError(error.message || 'Failed to load form data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Transform data for frontend use
  const availableTags = useMemo(() => 
    tags.map(tag => tag.name), [tags]);

  const availableAuthors = useMemo(() => 
    authors.map(author => `${author.firstName} ${author.lastName}`), [authors]);

  const categoriesData = useMemo(() => 
    categories.map(cat => ({
      id: cat._id,
      name: cat.name,
      slug: cat.slug
    })), [categories]);

  const mediaLibrary = useMemo(() => mediaLibraryData as MediaItem[], []);
  
  // For now, keep subcategories hardcoded or fetch from your backend if available
  const subcategoriesBySlug = useMemo(() => {
    // You can modify this to fetch subcategories from your backend if available
    const hardcodedSubcategories: Record<string, string[]> = {
      "technology": ["Web Development", "Mobile Development", "AI/ML"],
      "business": ["Startups", "Marketing", "Finance"],
      "lifestyle": ["Health", "Travel", "Food"]
    };
    return hardcodedSubcategories;
  }, []);

  const availableSubcategories = useMemo(
    () => subcategoriesBySlug[category] ?? [],
    [category, subcategoriesBySlug],
  );
  
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
  
  const selectedMedia = useMemo(
    () => mediaLibrary.find((item) => item.id === featuredMediaId) ?? null,
    [mediaLibrary, featuredMediaId],
  );

  const serializedContent = useMemo(
    () => (content ? JSON.stringify(content) : ""),
    [content],
  );

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

    if (isSubcategoryRequired && !subcategory) {
      errors.subcategory = "Sub-category is required.";
    }

    if (selectedTags.length === 0) {
      errors.tags = "At least one tag must be selected.";
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});

    setPendingSubmission({
      title,
      content: serializedContent,
      category,
      subcategory,
      tags: selectedTags,
      authors: selectedAuthors,
      featuredMedia: selectedMedia,
      excerpt,
      isPublished,
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
      // Find the actual category and tag IDs from the selected names
      const selectedCategory = categories.find(cat => cat.slug === pendingSubmission.category);
      const selectedTagIds = tags
        .filter(tag => pendingSubmission.tags.includes(tag.name))
        .map(tag => tag._id);
      
      const selectedAuthorIds = authors
        .filter(author => pendingSubmission.authors.includes(`${author.firstName} ${author.lastName}`))
        .map(author => author._id);

      const response = await fetch(`${API_BASE_URL}/articles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: pendingSubmission.title,
          content: pendingSubmission.content,
          excerpt: pendingSubmission.excerpt,
          category: selectedCategory?._id, // Send category ID
          subcategory: pendingSubmission.subcategory,
          tags: selectedTagIds, // Send tag IDs
          authors: selectedAuthorIds, // Send author IDs
          featuredMediaId: pendingSubmission.featuredMedia?.id,
          featuredMediaUrl: pendingSubmission.featuredMedia?.url,
          isPublished: pendingSubmission.isPublished,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setSubmitMessage({
          type: 'success',
          message: `Article "${pendingSubmission.title}" has been ${pendingSubmission.isPublished ? 'published' : 'saved as draft'} successfully!`
        });

        // Reset form
        setTitle("");
        setContent(undefined);
        setContentText("");
        setExcerpt("");
        setCategory("");
        setSubcategory("");
        setSelectedTags([]);
        setSelectedAuthors([]);
        setFeaturedMediaId(null);
        setIsPublished(false);
        setEditorResetKey((prev) => prev + 1);
        setFormErrors({});
      } else {
        setSubmitMessage({
          type: 'error',
          message: result.message || "Failed to create article. Please try again."
        });
      }
    } catch (error) {
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
    if (!title.trim() || isContentEmpty || !category) {
      setSubmitMessage({
        type: 'error',
        message: "Title, content, and category are required even for drafts."
      });
      return;
    }

    setIsSubmitting(true);
    setSubmitMessage(null);

    try {
      // Find the actual category and tag IDs from the selected names
      const selectedCategory = categories.find(cat => cat.slug === category);
      const selectedTagIds = tags
        .filter(tag => selectedTags.includes(tag.name))
        .map(tag => tag._id);
      
      const selectedAuthorIds = authors
        .filter(author => selectedAuthors.includes(`${author.firstName} ${author.lastName}`))
        .map(author => author._id);

      const response = await fetch(`${API_BASE_URL}/articles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          content: serializedContent,
          excerpt,
          category: selectedCategory?._id,
          subcategory,
          tags: selectedTagIds,
          authors: selectedAuthorIds,
          featuredMediaId: selectedMedia?.id,
          featuredMediaUrl: selectedMedia?.url,
          isPublished: false,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setSubmitMessage({
          type: 'success',
          message: `Draft "${title}" has been saved successfully!`
        });

        // Reset form
        setTitle("");
        setContent(undefined);
        setContentText("");
        setExcerpt("");
        setCategory("");
        setSubcategory("");
        setSelectedTags([]);
        setSelectedAuthors([]);
        setFeaturedMediaId(null);
        setIsPublished(false);
        setEditorResetKey((prev) => prev + 1);
        setFormErrors({});
      } else {
        setSubmitMessage({
          type: 'error',
          message: result.message || "Failed to save draft. Please try again."
        });
      }
    } catch (error) {
      console.error('Error saving draft:', error);
      setSubmitMessage({
        type: 'error',
        message: "Network error. Please check your connection and try again."
      });
    } finally {
      setIsSubmitting(false);
    }
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
              <input type="hidden" name="content" value={serializedContent} required />
              {formErrors.content && (
                <p className="text-xs text-destructive">{formErrors.content}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Featured Media */}
              <div className="space-y-2">
                <Label htmlFor="featured-media" className='gap-0'><span className='text-destructive'>*</span>Featured Media</Label>
                <MediaPicker
                  value={featuredMediaId ?? undefined}
                  items={mediaLibrary}
                  onChange={(id) => {
                    setFeaturedMediaId(id);
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
                {/* Authors */}
                <div className="space-y-2">
                  <Label htmlFor="authors" className='gap-0'><span className='text-destructive'>*</span>Authors</Label>
                  <TagInput
                    id="authors"
                    value={selectedAuthors}
                    onChange={(values) => {
                      setSelectedAuthors(values);
                      if (formErrors.authors && values.length > 0) {
                        clearFieldError("authors");
                      }
                    }}
                    placeholder="Add authors"
                    normalizeTag={(tag) => tag}
                    className={cn(
                      formErrors.authors && "border-destructive focus-within:ring-destructive"
                    )}
                  />
                  {formErrors.authors && (
                    <p className="text-xs text-destructive">{formErrors.authors}</p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {availableAuthors
                      .filter((author) => !selectedAuthors.includes(author))
                      .map((author) => (
                        <Badge
                          key={author}
                          variant="outline"
                          className="cursor-pointer px-3 py-1 text-sm"
                          onClick={() =>
                            setSelectedAuthors((prev) =>
                              prev.includes(author) ? prev : [...prev, author],
                            )
                          }
                        >
                          {author}
                        </Badge>
                      ))}
                    {availableAuthors.length === 0 && (
                      <p className="text-muted-foreground">No authors available</p>
                    )}
                  </div>
                </div>
                
                {/* Category & sub-category */}
                <div className="space-y-2 flex flex-row gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category" className='gap-0'><span className='text-destructive'>*</span>Category</Label>
                    <Select
                      value={category}
                      onValueChange={(value) => {
                        setCategory(value);
                        const nextSubcategories = subcategoriesBySlug[value] ?? [];
                        setSubcategory((prev) =>
                          nextSubcategories.includes(prev) ? prev : "",
                        );
                        if (formErrors.category && value) {
                          clearFieldError("category");
                        }
                        if (formErrors.subcategory && nextSubcategories.length === 0) {
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
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categoriesData.map((category) => (
                          <SelectItem key={category.id} value={category.slug}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {formErrors.category && (
                      <p className="text-xs text-destructive">{formErrors.category}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subcategory">
                      Sub-category
                      <Tooltip>
                        <TooltipTrigger>
                          <span className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full border border-muted-foreground/50 text-[10px] text-muted-foreground cursor-help">
                            ?
                          </span>
                        </TooltipTrigger>
                        <TooltipContent className='max-w-64 flex-wrap'>
                          Values are determined by sub-categories defined per category on the frontend site. Selecting a sub-category will help classify articles within that specific sub-category on the frontend.
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
                        <SelectValue placeholder={subcategoryPlaceholder} />
                      </SelectTrigger>
                      <SelectContent>
                        {availableSubcategories.map((item) => (
                          <SelectItem key={item} value={item}>
                            {item}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {formErrors.subcategory && (
                      <p className="text-xs text-destructive">{formErrors.subcategory}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="publish"
                    checked={isPublished}
                    onCheckedChange={setIsPublished}
                  />
                  <Label htmlFor="publish">Publish immediately</Label>
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
                <TagInput
                  id="tags"
                  value={selectedTags}
                  onChange={(values) => {
                    setSelectedTags(values);
                    if (formErrors.tags && values.length > 0) {
                      clearFieldError("tags");
                    }
                  }}
                  placeholder="Select tags"
                  className={cn(
                    formErrors.tags && "border-destructive focus-within:ring-destructive"
                  )}
                />
                {formErrors.tags && (
                  <p className="text-xs text-destructive">{formErrors.tags}</p>
                )}
                <div className="flex flex-wrap gap-2">
                  {availableTags
                    .filter((tag) => !selectedTags.includes(tag))
                    .map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="cursor-pointer px-3 py-1 text-sm"
                        onClick={() =>
                          setSelectedTags((prev) =>
                            prev.includes(tag) ? prev : [...prev, tag],
                          )
                        }
                      >
                        {tag}
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