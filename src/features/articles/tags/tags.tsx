import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Plus, X } from "lucide-react";

export default function Tags() {
  const [tags, setTags] = useState(["react", "javascript", "web-development", "design", "ux"]);
  const [newTag, setNewTag] = useState("");

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim().toLowerCase())) {
      setTags([...tags, newTag.trim().toLowerCase()]);
      setNewTag("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Manage Tags</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <Label htmlFor="new-tag" className="sr-only">
                  New Tag
                </Label>
                <Input
                  id="new-tag"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Enter new tag"
                  onKeyPress={(e) => e.key === "Enter" && handleAddTag()}
                />
              </div>
              <Button onClick={handleAddTag}>
                <Plus className="w-4 h-4 mr-2" />
                Add Tag
              </Button>
            </div>

            <div className="border rounded-lg p-4">
              <h3 className="text-sm font-medium mb-3">Current Tags</h3>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="px-3 py-1 text-sm"
                  >
                    {tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-2 hover:text-destructive"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
                {tags.length === 0 && (
                  <p className="text-muted-foreground">No tags yet</p>
                )}
              </div>
            </div>

            <div className="text-sm text-muted-foreground">
              <p>• Tags help organize and filter articles</p>
              <p>• Use descriptive, relevant tags</p>
              <p>• Separate multiple words with hyphens (e.g., "web-development")</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}