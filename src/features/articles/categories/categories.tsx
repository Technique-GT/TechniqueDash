import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Search, FileText } from "lucide-react";

interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  articleCount: number;
  createdAt: string;
  updatedAt: string;
}

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: ""
  });
  const [stats, setStats] = useState({
    totalCategories: 0,
    totalArticles: 0,
    averageArticles: 0
  });

  // Fetch categories on component mount
  useEffect(() => {
    fetchCategories();
    fetchStats();
  }, []);

  const fetchCategories = async () => {
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);

      const response = await fetch(`http://localhost:5050/api/categories?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setCategories(data.data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('http://localhost:5050/api/categories/stats');
      const data = await response.json();
      
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleAddCategory = async () => {
    if (formData.name.trim()) {
      try {
        const url = editingCategory 
          ? `http://localhost:5050/api/categories/${editingCategory._id}`
          : 'http://localhost:5050/api/categories';
        
        const method = editingCategory ? 'PUT' : 'POST';

        const response = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });

        const data = await response.json();
        
        if (data.success) {
          await fetchCategories();
          await fetchStats();
          resetForm();
          setIsDialogOpen(false);
        } else {
          alert(data.message || `Error ${editingCategory ? 'updating' : 'adding'} category`);
        }
      } catch (error) {
        console.error(`Error ${editingCategory ? 'updating' : 'adding'} category:`, error);
        alert(`Error ${editingCategory ? 'updating' : 'adding'} category`);
      }
    }
  };

  const handleDeleteCategory = async (id: string, articleCount: number) => {
    if (articleCount > 0) {
      alert('Cannot delete category that has articles. Please reassign articles first.');
      return;
    }

    if (!confirm('Are you sure you want to delete this category? This action cannot be undone.')) return;

    try {
      const response = await fetch(`http://localhost:5050/api/categories/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      
      if (data.success) {
        await fetchCategories();
        await fetchStats();
      } else {
        alert(data.message || 'Error deleting category');
      }
    } catch (error) {
      console.error('Error deleting category:', error);
      alert('Error deleting category');
    }
  };

  const openEditDialog = (category: Category) => {
    setFormData({
      name: category.name,
      description: category.description || ""
    });
    setEditingCategory(category);
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: ""
    });
    setEditingCategory(null);
  };

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCategories();
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Manage Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-32">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
                <p className="text-muted-foreground">Loading categories...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Categories</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCategories}</div>
            <p className="text-xs text-muted-foreground">All categories</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Articles</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalArticles}</div>
            <p className="text-xs text-muted-foreground">Across all categories</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Articles</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(stats.averageArticles)}</div>
            <p className="text-xs text-muted-foreground">Per category</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Manage Categories</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <Label htmlFor="search-categories" className="sr-only">
                  Search Categories
                </Label>
                <Input
                  id="search-categories"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search categories..."
                  className="pl-10"
                />
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              </div>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={openCreateDialog}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Category
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {editingCategory ? 'Edit Category' : 'Add New Category'}
                    </DialogTitle>
                    <DialogDescription>
                      {editingCategory 
                        ? 'Update your category information.' 
                        : 'Create a new category to organize your articles.'
                      }
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="name">Category Name</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Enter category name"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="description">Description (Optional)</Label>
                      <Input
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Enter category description"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddCategory}>
                      {editingCategory ? 'Update Category' : 'Create Category'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Articles</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((category) => (
                  <TableRow key={category._id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {category.name}
                        {category.articleCount > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            {category.articleCount}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground font-mono text-sm">
                      {category.slug}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                        <span className={category.articleCount > 0 ? "font-medium" : "text-muted-foreground"}>
                          {category.articleCount}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground max-w-[200px] truncate">
                      {category.description || "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => openEditDialog(category)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteCategory(category._id, category.articleCount)}
                          disabled={category.articleCount > 0}
                          title={category.articleCount > 0 ? "Cannot delete category with articles" : "Delete category"}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {categories.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <div className="text-center">
                        <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                        <p className="text-muted-foreground">No categories found</p>
                        {searchTerm && (
                          <p className="text-sm text-muted-foreground mt-1">
                            Try adjusting your search terms
                          </p>
                        )}
                        {!searchTerm && (
                          <Button onClick={openCreateDialog} className="mt-4">
                            <Plus className="w-4 h-4 mr-2" />
                            Create Your First Category
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}