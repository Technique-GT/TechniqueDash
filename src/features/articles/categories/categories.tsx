import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Plus, Edit, Trash2, Search, FileText, Eye, EyeOff } from "lucide-react";

interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    isActive: true
  });
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalCategories: 0,
    activeCategories: 0,
    inactiveCategories: 0
  });

  // Fetch categories on component mount
  useEffect(() => {
    fetchCategories();
    fetchStats();
  }, []);

  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (showInactive) params.append('isActive', 'false');

      const response = await fetch(`http://localhost:5050/api/categories?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setCategories(data.data);
      } else {
        setError(data.message || 'Failed to fetch categories');
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      setError('Network error. Please check your connection.');
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
    if (!formData.name.trim()) {
      setError('Category name is required');
      return;
    }

    try {
      setError(null);
      const url = editingCategory 
        ? `http://localhost:5050/api/categories/${editingCategory._id}`
        : 'http://localhost:5050/api/categories';
      
      const method = editingCategory ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          isActive: formData.isActive
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        await fetchCategories();
        await fetchStats();
        resetForm();
        setIsDialogOpen(false);
      } else {
        // Show the actual error from the backend
        setError(data.message || data.errors?.join(', ') || `Error ${editingCategory ? 'updating' : 'adding'} category`);
      }
    } catch (error) {
      console.error(`Error ${editingCategory ? 'updating' : 'adding'} category:`, error);
      setError(`Error ${editingCategory ? 'updating' : 'adding'} category`);
    }
  };

  const handleDeleteCategory = async (category: Category) => {
    if (!confirm(`Are you sure you want to ${category.isActive ? 'deactivate' : 'activate'} this category?`)) return;

    try {
      const response = await fetch(`http://localhost:5050/api/categories/${category._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isActive: !category.isActive
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        await fetchCategories();
        await fetchStats();
      } else {
        alert(data.message || `Error ${category.isActive ? 'deactivating' : 'activating'} category`);
      }
    } catch (error) {
      console.error(`Error ${category.isActive ? 'deactivating' : 'activating'} category:`, error);
      alert(`Error ${category.isActive ? 'deactivating' : 'activating'} category`);
    }
  };

  const handleHardDelete = async (categoryId: string) => {
    if (!confirm('Are you sure you want to permanently delete this category? This action cannot be undone.')) return;

    try {
      const response = await fetch(`http://localhost:5050/api/categories/${categoryId}/hard`, {
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
      description: category.description || "",
      isActive: category.isActive
    });
    setEditingCategory(category);
    setError(null);
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
      isActive: true
    });
    setEditingCategory(null);
    setError(null);
  };

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCategories();
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, showInactive]);

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
      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

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
            <CardTitle className="text-sm font-medium">Active Categories</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeCategories}</div>
            <p className="text-xs text-muted-foreground">Currently active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactive Categories</CardTitle>
            <EyeOff className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inactiveCategories}</div>
            <p className="text-xs text-muted-foreground">Currently inactive</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Manage Categories</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
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
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="show-inactive"
                  checked={showInactive}
                  onCheckedChange={setShowInactive}
                />
                <Label htmlFor="show-inactive" className="text-sm">
                  Show Inactive
                </Label>
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
                  
                  {/* Show error in dialog if any */}
                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-800 px-3 py-2 rounded-md text-sm">
                      {error}
                    </div>
                  )}

                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="name">Category Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Enter category name"
                        required
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
                    {editingCategory && (
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="isActive"
                          checked={formData.isActive}
                          onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                        />
                        <Label htmlFor="isActive" className="text-sm">
                          Active Category
                        </Label>
                      </div>
                    )}
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
                  <TableHead>Status</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((category) => (
                  <TableRow key={category._id} className={!category.isActive ? "bg-muted/50" : ""}>
                    <TableCell>
                      <Badge variant={category.isActive ? "default" : "secondary"}>
                        {category.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {category.name}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground font-mono text-sm">
                      {category.slug}
                    </TableCell>
                    <TableCell className="text-muted-foreground max-w-[200px] truncate">
                      {category.description || "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(category.createdAt).toLocaleDateString()}
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
                          variant={category.isActive ? "secondary" : "default"}
                          size="sm"
                          onClick={() => handleDeleteCategory(category)}
                          title={category.isActive ? "Deactivate category" : "Activate category"}
                        >
                          {category.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleHardDelete(category._id)}
                          title="Permanently delete category"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {categories.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
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