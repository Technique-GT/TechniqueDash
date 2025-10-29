import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, X, Edit, Trash2, Search } from "lucide-react";

interface Tag {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  color: string;
  articleCount: number;
  createdAt: string;
  updatedAt: string;
}

export default function Tags() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    color: "#6B7280"
  });

  // Fetch tags on component mount
  useEffect(() => {
    fetchTags();
  }, []);

  const fetchTags = async () => {
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);

      const response = await fetch(`http://localhost:5050/api/tags?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setTags(data.data);
      }
    } catch (error) {
      console.error('Error fetching tags:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTag = async () => {
    if (formData.name.trim()) {
      try {
        const url = editingTag 
          ? `http://localhost:5050/api/tags/${editingTag._id}`
          : 'http://localhost:5050/api/tags';
        
        const method = editingTag ? 'PUT' : 'POST';

        const response = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });

        const data = await response.json();
        
        if (data.success) {
          await fetchTags();
          resetForm();
          setIsDialogOpen(false);
        } else {
          alert(data.message || `Error ${editingTag ? 'updating' : 'adding'} tag`);
        }
      } catch (error) {
        console.error(`Error ${editingTag ? 'updating' : 'adding'} tag:`, error);
        alert(`Error ${editingTag ? 'updating' : 'adding'} tag`);
      }
    }
  };

  const handleDeleteTag = async (id: string) => {
    if (!confirm('Are you sure you want to delete this tag? This action cannot be undone.')) return;

    try {
      const response = await fetch(`http://localhost:5050/api/tags/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      
      if (data.success) {
        await fetchTags();
      } else {
        alert(data.message || 'Error deleting tag');
      }
    } catch (error) {
      console.error('Error deleting tag:', error);
      alert('Error deleting tag');
    }
  };

  const openEditDialog = (tag: Tag) => {
    setFormData({
      name: tag.name,
      description: tag.description || "",
      color: tag.color
    });
    setEditingTag(tag);
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      color: "#6B7280"
    });
    setEditingTag(null);
  };

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTags();
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Manage Tags</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-32">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
                <p className="text-muted-foreground">Loading tags...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

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
                <Label htmlFor="search-tags" className="sr-only">
                  Search Tags
                </Label>
                <Input
                  id="search-tags"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search tags..."
                  className="pl-10"
                />
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              </div>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={openCreateDialog}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Tag
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {editingTag ? 'Edit Tag' : 'Add New Tag'}
                    </DialogTitle>
                    <DialogDescription>
                      {editingTag 
                        ? 'Update your tag information.' 
                        : 'Create a new tag to organize your content.'
                      }
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="name">Tag Name</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Enter tag name"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="description">Description (Optional)</Label>
                      <Input
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Enter tag description"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="color">Color</Label>
                      <div className="flex gap-2">
                        <Input
                          id="color"
                          type="color"
                          value={formData.color}
                          onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                          className="w-16 h-10 p-1"
                        />
                        <Input
                          value={formData.color}
                          onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                          placeholder="#6B7280"
                          className="flex-1"
                        />
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddTag}>
                      {editingTag ? 'Update Tag' : 'Create Tag'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <div className="border rounded-lg p-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-medium">Current Tags ({tags.length})</h3>
                {tags.length > 0 && (
                  <span className="text-sm text-muted-foreground">
                    Click on a tag to edit
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <Badge
                    key={tag._id}
                    variant="secondary"
                    className="px-3 py-1 text-sm cursor-pointer group relative"
                    style={{ backgroundColor: tag.color, color: 'white' }}
                    onClick={() => openEditDialog(tag)}
                  >
                    {tag.name}
                    {tag.articleCount > 0 && (
                      <span className="ml-1 text-xs opacity-90">
                        ({tag.articleCount})
                      </span>
                    )}
                    <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditDialog(tag);
                          }}
                          className="bg-blue-500 hover:bg-blue-600 text-white rounded-full p-1"
                        >
                          <Edit className="w-2 h-2" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteTag(tag._id);
                          }}
                          className="bg-red-500 hover:bg-red-600 text-white rounded-full p-1"
                        >
                          <Trash2 className="w-2 h-2" />
                        </button>
                      </div>
                    </div>
                  </Badge>
                ))}
                {tags.length === 0 && (
                  <div className="text-center w-full py-8">
                    <p className="text-muted-foreground">No tags found</p>
                    {searchTerm && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Try adjusting your search terms
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="text-sm text-muted-foreground space-y-1">
              <p>• Tags help organize and filter articles</p>
              <p>• Use descriptive, relevant tags</p>
              <p>• Separate multiple words with hyphens (e.g., "web-development")</p>
              <p>• Tags with article counts show how many articles use that tag</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}