import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, MessageSquare, Eye, EyeOff, Trash2, User, FileText, Calendar, ThumbsUp, ThumbsDown, Reply } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Comment {
  _id: string;
  content: string;
  author: {
    name: string;
    email: string;
    avatar?: string;
  };
  article: {
    _id: string;
    title: string;
    slug: string;
  };
  parentComment?: {
    _id: string;
    content: string;
    author: {
      name: string;
    };
  };
  status: 'approved' | 'pending' | 'spam' | 'rejected';
  isEdited: boolean;
  likes: number;
  dislikes: number;
  replyCount?: number;
  createdAt: string;
  updatedAt: string;
}

interface CommentStats {
  totalComments: number;
  approved: number;
  pending: number;
  spam: number;
  rejected: number;
}

export default function CommentsManagement() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<CommentStats>({
    totalComments: 0,
    approved: 0,
    pending: 0,
    spam: 0,
    rejected: 0
  });

  // Fetch comments and stats on component mount
  useEffect(() => {
    fetchComments();
    fetchStats();
  }, [searchTerm, statusFilter]);

  const fetchComments = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter !== 'all') params.append('status', statusFilter);

      const response = await fetch(`http://localhost:5050/api/comments?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setComments(data.data);
      } else {
        setError(data.message || 'Failed to fetch comments');
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
      setError('Network error. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('http://localhost:5050/api/comments/stats');
      const data = await response.json();
      
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Error fetching comment stats:', error);
    }
  };

  const updateCommentStatus = async (commentId: string, newStatus: string) => {
    try {
      const response = await fetch(`http://localhost:5050/api/comments/${commentId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();
      
      if (data.success) {
        await fetchComments();
        await fetchStats();
      } else {
        alert(data.message || 'Error updating comment status');
      }
    } catch (error) {
      console.error('Error updating comment status:', error);
      alert('Error updating comment status');
    }
  };

  const deleteComment = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment? This action cannot be undone.')) return;

    try {
      const response = await fetch(`http://localhost:5050/api/comments/${commentId}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      
      if (data.success) {
        await fetchComments();
        await fetchStats();
      } else {
        alert(data.message || 'Error deleting comment');
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      alert('Error deleting comment');
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'approved': return 'default';
      case 'pending': return 'secondary';
      case 'spam': return 'destructive';
      case 'rejected': return 'outline';
      default: return 'outline';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'text-green-600 bg-green-50 border-green-200';
      case 'pending': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'spam': return 'text-red-600 bg-red-50 border-red-200';
      case 'rejected': return 'text-gray-600 bg-gray-50 border-gray-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const truncateContent = (content: string, maxLength: number = 100) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  // Filter comments based on search term and status
  const filteredComments = comments.filter(comment => {
    const matchesSearch = !searchTerm || 
      comment.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comment.author.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comment.author.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comment.article.title.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || comment.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchComments();
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, statusFilter]);

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Comments Management</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-32">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
                <p className="text-muted-foreground">Loading comments...</p>
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Comments</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalComments}</div>
            <p className="text-xs text-muted-foreground">All comments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
            <p className="text-xs text-muted-foreground">Visible to public</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <EyeOff className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">Awaiting approval</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Spam</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.spam}</div>
            <p className="text-xs text-muted-foreground">Marked as spam</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <EyeOff className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{stats.rejected}</div>
            <p className="text-xs text-muted-foreground">Manually rejected</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle>Manage Comments</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Search and Filter Controls */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Label htmlFor="search-comments" className="sr-only">
                  Search comments
                </Label>
                <Input
                  id="search-comments"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by comment content, author, or article title..."
                  className="pl-10"
                />
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="spam">Spam</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Comments Table */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Author</TableHead>
                    <TableHead>Comment</TableHead>
                    <TableHead>Article</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Engagement</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredComments.map((comment) => (
                    <TableRow key={comment._id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={comment.author.avatar} alt={comment.author.name} />
                            <AvatarFallback className="text-xs">
                              {getInitials(comment.author.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium text-sm">{comment.author.name}</div>
                            <div className="text-xs text-muted-foreground">{comment.author.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[300px]">
                          <div className="text-sm mb-1">
                            {truncateContent(comment.content, 150)}
                          </div>
                          {comment.parentComment && (
                            <Badge variant="outline" className="text-xs">
                              <Reply className="w-3 h-3 mr-1" />
                              Reply
                            </Badge>
                          )}
                          {comment.isEdited && (
                            <Badge variant="secondary" className="text-xs ml-1">
                              Edited
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[200px]">
                          <div className="font-medium text-sm flex items-center gap-1">
                            <FileText className="w-3 h-3" />
                            {truncateContent(comment.article.title, 50)}
                          </div>
                          <div className="text-xs text-muted-foreground font-mono">
                            {comment.article.slug}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={getStatusVariant(comment.status)}
                          className={getStatusColor(comment.status)}
                        >
                          {comment.status.charAt(0).toUpperCase() + comment.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-1 text-green-600">
                            <ThumbsUp className="w-3 h-3" />
                            {comment.likes}
                          </div>
                          <div className="flex items-center gap-1 text-red-600">
                            <ThumbsDown className="w-3 h-3" />
                            {comment.dislikes}
                          </div>
                          {comment.replyCount > 0 && (
                            <div className="flex items-center gap-1 text-blue-600">
                              <Reply className="w-3 h-3" />
                              {comment.replyCount}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground">
                          {formatDate(comment.createdAt)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {/* Approve/Reject buttons for pending comments */}
                          {comment.status === 'pending' && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updateCommentStatus(comment._id, 'approved')}
                                title="Approve comment"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updateCommentStatus(comment._id, 'rejected')}
                                title="Reject comment"
                              >
                                <EyeOff className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                          
                          {/* Mark as spam for approved comments */}
                          {comment.status === 'approved' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateCommentStatus(comment._id, 'spam')}
                              title="Mark as spam"
                            >
                              <MessageSquare className="w-4 h-4" />
                            </Button>
                          )}

                          {/* Restore buttons for spam/rejected comments */}
                          {(comment.status === 'spam' || comment.status === 'rejected') && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateCommentStatus(comment._id, 'approved')}
                              title="Approve comment"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          )}

                          {/* Delete button */}
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => deleteComment(comment._id)}
                            title="Delete comment permanently"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  
                  {filteredComments.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <div className="text-center">
                          <MessageSquare className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                          <p className="text-muted-foreground">No comments found</p>
                          {searchTerm && (
                            <p className="text-sm text-muted-foreground mt-1">
                              Try adjusting your search terms
                            </p>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}