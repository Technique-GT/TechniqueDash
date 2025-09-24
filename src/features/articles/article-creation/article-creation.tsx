import { useMemo, useState } from "react";
import type { SerializedEditorState } from "lexical";

import { Editor } from "@/components/blocks/editor-00/editor";
import { TagInput } from "@/components/form/tag-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

import categoriesData from "@/data/categories.json";
import tagData from "@/data/tags.json";

export default function ArticleCreation() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState<SerializedEditorState | undefined>();
  const [category, setCategory] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isPublished, setIsPublished] = useState(false);
  const availableTags = useMemo(() => tagData as string[], []);

  const serializedContent = useMemo(
    () => (content ? JSON.stringify(content) : ""),
    [content],
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log({
      title,
      content: serializedContent,
      category,
      tags: selectedTags,
      isPublished,
    });
    // Handle article creation logic here
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
                required
              />
            </div>

            <div className="space-y-2">
              <Label id="content-label">Content</Label>
              <div role="group" aria-labelledby="content-label">
                <Editor onSerializedChange={setContent} />
              </div>
              <input type="hidden" name="content" value={serializedContent} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-6">
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
                <input type="hidden" name="tags" value={selectedTags.join(",")} />
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
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
