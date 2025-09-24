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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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

import { MediaPicker, type MediaItem } from "@/components/media/media-picker";
import categoriesData from "@/data/categories.json";
import tagData from "@/data/tags.json";
import authorData from "@/data/authors.json";
import mediaLibraryData from "@/data/media-library.json";

export default function ArticleCreation() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState<SerializedEditorState | undefined>();
  const [contentText, setContentText] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [category, setCategory] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedAuthors, setSelectedAuthors] = useState<string[]>([]);
  const [featuredMediaId, setFeaturedMediaId] = useState<string | null>(null);
  const [isPublished, setIsPublished] = useState(false);
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingSubmission, setPendingSubmission] = useState<{
    title: string;
    content: string;
    category: string;
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const errors: string[] = [];

    if (!title.trim()) {
      errors.push("Title is required.");
    }

    if (isContentEmpty) {
      errors.push("Content is required.");
    }

    if (!featuredMediaId) {
      errors.push("Featured media is required.");
    }

    if (!excerpt.trim()) {
      errors.push("Caption is required.");
    }

    if (selectedAuthors.length === 0) {
      errors.push("At least one author must be selected.");
    }

    if (!category) {
      errors.push("Category is required.");
    }

    if (selectedTags.length === 0) {
      errors.push("At least one tag must be selected.");
    }

    if (errors.length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors([]);

    setPendingSubmission({
      title,
      content: serializedContent,
      category,
      tags: selectedTags,
      authors: selectedAuthors,
      featuredMedia: selectedMedia,
      excerpt,
      isPublished,
    });
    setConfirmOpen(true);
  };

  const handleConfirmSubmit = () => {
    if (!pendingSubmission) {
      return;
    }

    console.log(pendingSubmission);
    // Handle article creation logic here

    setTitle("");
    setContent(undefined);
    setContentText("");
    setExcerpt("");
    setCategory("");
    setSelectedTags([]);
    setSelectedAuthors([]);
    setFeaturedMediaId(null);
    setIsPublished(false);
    setEditorResetKey((prev) => prev + 1);
    setPendingSubmission(null);
    setConfirmOpen(false);
  };

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Create New Article</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter article title"
                className='text-8xl font-semibold'
              />
            </div>

            <div className="space-y-2">
              <Label id="content-label">Content</Label>
              <div role="group" aria-labelledby="content-label">
                <Editor
                  key={editorResetKey}
                  onSerializedChange={setContent}
                  onChange={(editorState) => {
                    editorState.read(() => {
                      setContentText($getRoot().getTextContent().trim());
                    });
                  }}
                />
              </div>
              <input type="hidden" name="content" value={serializedContent} required />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Featured Media */}
              <div className="space-y-2">
                <Label htmlFor="featured-media">Featured Media</Label>
                <MediaPicker
                  value={featuredMediaId ?? undefined}
                  items={mediaLibrary}
                  onChange={setFeaturedMediaId}
                  placeholder="Choose featured media"
                />
                <input
                  type="hidden"
                  name="featuredMediaId"
                  value={featuredMediaId ?? ""}
                  required
                />
                <input
                  type="hidden"
                  name="featuredMediaUrl"
                  value={selectedMedia?.url ?? ""}
                  required
                />
              </div>
              
              {/* Caption */}
              <div className="space-y-2">
                <Label htmlFor="excerpt">Caption</Label>
                <Input
                  id="excerpt"
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  placeholder="Enter caption"
                  className='italic'
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-6">
                {/* Authors */}
                <div className="space-y-2">
                  <Label htmlFor="authors">Authors</Label>
                  <TagInput
                    id="authors"
                    value={selectedAuthors}
                    onChange={setSelectedAuthors}
                    placeholder="Add authors"
                    normalizeTag={(tag) => tag}
                  />
                  <input
                    type="hidden"
                    name="authors"
                    value={selectedAuthors.join(",")}
                    required
                  />
                  <div className="flex flex-wrap gap-2">
                    {availableAuthors.map((author) => (
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
                
                {/* Category */}
                <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
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
                <input type="hidden" name="category" value={category} required />
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
                  <Button type="submit">Create Article</Button>
                  <Button type="button" variant="outline">
                    Save Draft
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags">Tags</Label>
                <TagInput
                  id="tags"
                  value={selectedTags}
                  onChange={setSelectedTags}
                  placeholder="Select tags"
                />
                {/* for form submission, selected tags sent as a single string */}
                <input type="hidden" name="tags" value={selectedTags.join(",")} required />
                <div className="flex flex-wrap gap-2">
                  {availableTags.map((tag) => (
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

            {formErrors.length > 0 && (
              <Alert variant="destructive">
                <AlertTitle>Missing information</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc space-y-1 pl-4">
                    {formErrors.map((error) => (
                      <li key={error}>{error}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
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
              Once confirmed, the article will be submitted with the details shown above.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingSubmission(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmSubmit}>
              Confirm submission
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
