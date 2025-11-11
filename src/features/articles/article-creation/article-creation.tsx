import { useMemo, useState } from "react";
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
import categoriesData from "@/data/categories.json";
import subcategoriesData from "@/data/subcategories.json";
import tagData from "@/data/tags.json";
import authorData from "@/data/authors.json";
import mediaLibraryData from "@/data/media-library.json";

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
  
  const availableTags = useMemo(() => tagData as string[], []);
  const availableAuthors = useMemo(() => authorData as string[], []);
  const mediaLibrary = useMemo(() => mediaLibraryData as MediaItem[], []);
  const subcategoriesBySlug = useMemo(() => {
    const entries = Object.entries(subcategoriesData as Record<string, string[]>);
    return entries.reduce<Record<string, string[]>>((acc, [categoryName, subcategories]) => {
      const matchedCategory = categoriesData.find((cat) => cat.name === categoryName);
      if (matchedCategory) {
        acc[matchedCategory.slug] = subcategories;
      }
      return acc;
    }, {});
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
      const response = await fetch('http://localhost:5050/api/articles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: pendingSubmission.title,
          content: pendingSubmission.content,
          excerpt: pendingSubmission.excerpt,
          category: pendingSubmission.category,
          subcategory: pendingSubmission.subcategory,
          tags: pendingSubmission.tags,
          authors: pendingSubmission.authors,
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
      const response = await fetch('http://localhost:5050/api/articles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          content: serializedContent,
          excerpt,
          category,
          subcategory,
          tags: selectedTags,
          authors: selectedAuthors,
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