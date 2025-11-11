import { useState, useEffect } from "react";
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
import { Search, MoreHorizontal, Plus, Edit, Trash2, Eye, RefreshCw } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";

interface Article {
  _id: string;
  title: string;
  authors: string[];
  category: string;
  subcategory?: string;
  status: "published" | "draft";
  publishedAt?: string;
  views: number;
  excerpt: string;
  tags: string[];
  featuredMedia: {
    id: string;
    url: string;
    alt?: string;
  };
  createdAt: string;
  updatedAt: string;
}

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

  useEffect(() => {
    fetchArticles();
  }, []);

  // Get unique categories for filter
  const categories = Array.from(new Set(articles.map(article => article.category)));

  // Filter articles based on search and filters
  const filteredArticles = articles.filter(article => {
    const matchesSearch = article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         article.authors.some(author => author.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === "all" || 
                         (statusFilter === "published" && article.status === "published") ||
                         (statusFilter === "draft" && article.status === "draft");
    const matchesCategory = categoryFilter === "all" || article.category === categoryFilter;
    
    return matchesSearch && matchesStatus && matchesCategory;
  });

  // Handle editing an article
  const handleEdit = (article: Article) => {
    setCurrentArticle(article);
    setEditedArticle({ ...article });
    setEditDialogOpen(true);
  };

  // Handle saving edited article
  const handleSaveEdit = async () => {
    if (!currentArticle || !editedArticle) return;

    try {
      const response = await fetch(`http://localhost:5050/api/articles/${currentArticle._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editedArticle),
      });

      const result = await response.json();

      if (result.success) {
        setMessage({ type: 'success', text: 'Article updated successfully!' });
        fetchArticles(); // Refresh the list
        setEditDialogOpen(false);
        setCurrentArticle(null);
        setEditedArticle(null);
      } else {
        setMessage({ type: 'error', text: result.message || 'Failed to update article' });
      }
    } catch (error) {
      console.error('Error updating article:', error);
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    }
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

  // Handle creating new article - using TanStack Router navigation
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
                {categories.map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
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
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredArticles.map((article) => (
                      <TableRow key={article._id}>
                        <TableCell className="font-medium max-w-xs truncate">
                          {article.title}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {article.authors.slice(0, 2).map((author, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {author}
                              </Badge>
                            ))}
                            {article.authors.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{article.authors.length - 2} more
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{article.category}</TableCell>
                        <TableCell>
                          <Badge variant={getStatusVariant(article.status)}>
                            {article.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDate(article.createdAt)}</TableCell>
                        <TableCell>{article.views}</TableCell>
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

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Article</DialogTitle>
            <DialogDescription>
              Make changes to your article here. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          {editedArticle && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={editedArticle.title || ""}
                  onChange={(e) => setEditedArticle({ ...editedArticle, title: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="authors">Authors (comma separated)</Label>
                <Input
                  id="authors"
                  value={editedArticle.authors?.join(", ") || ""}
                  onChange={(e) => setEditedArticle({ 
                    ...editedArticle, 
                    authors: e.target.value.split(',').map(author => author.trim()).filter(Boolean)
                  })}
                  placeholder="John Doe, Jane Smith"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={editedArticle.category || ""}
                  onChange={(e) => setEditedArticle({ ...editedArticle, category: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={editedArticle.status || "draft"}
                  onValueChange={(value) => setEditedArticle({ ...editedArticle, status: value as "published" | "draft" })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="excerpt">Excerpt</Label>
                <Textarea
                  id="excerpt"
                  value={editedArticle.excerpt || ""}
                  onChange={(e) => setEditedArticle({ ...editedArticle, excerpt: e.target.value })}
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit}>Save changes</Button>
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
                    {currentArticle.authors.map((author, index) => (
                      <Badge key={index} variant="secondary">
                        {author}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Category</Label>
                  <p>{currentArticle.category}</p>
                </div>
              </div>
              {currentArticle.subcategory && (
                <div>
                  <Label className="text-muted-foreground">Subcategory</Label>
                  <p>{currentArticle.subcategory}</p>
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
                    {currentArticle.tags.map((tag, index) => (
                      <Badge key={index} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground">Excerpt</Label>
                <p className="mt-1 text-sm">{currentArticle.excerpt}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}