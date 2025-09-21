import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, Trash2, Reply, Flag, ThumbsUp, MessageSquare } from "lucide-react";

interface Comment {
  id: number;
  author: string;
  avatar: string;
  content: string;
  date: string;
  article: string;
  likes: number;
  status: "approved" | "pending" | "spam";
}

export default function Comments() {
  const [comments, setComments] = useState<Comment[]>([
    {
      id: 1,
      author: "Alex Johnson",
      avatar: "/avatars/01.png",
      content: "Great article! Really helped me understand the concepts better.",
      date: "2 hours ago",
      article: "React Best Practices",
      likes: 12,
      status: "approved"
    },
    {
      id: 2,
      author: "Maria Garcia",
      avatar: "/avatars/02.png",
      content: "I have a question about section 3. Could you elaborate more?",
      date: "5 hours ago",
      article: "CSS Grid Tutorial",
      likes: 5,
      status: "pending"
    },
    {
      id: 3,
      author: "David Kim",
      avatar: "/avatars/03.png",
      content: "This is spam content with promotional links.",
      date: "1 day ago",
      article: "TypeScript Basics",
      likes: 0,
      status: "spam"
    },
    {
      id: 4,
      author: "Sarah Wilson",
      avatar: "/avatars/04.png",
      content: "Thanks for sharing these insights. Very valuable!",
      date: "2 days ago",
      article: "Next.js Guide",
      likes: 8,
      status: "approved"
    },
  ]);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredComments = comments.filter(comment => {
    const matchesSearch = comment.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         comment.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         comment.article.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || comment.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleDeleteComment = (id: number) => {
    setComments(comments.filter(comment => comment.id !== id));
  };

  const handleApproveComment = (id: number) => {
    setComments(comments.map(comment => 
      comment.id === id ? { ...comment, status: "approved" } : comment
    ));
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "approved": return "default";
      case "pending": return "secondary";
      case "spam": return "destructive";
      default: return "outline";
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Comments Management</h1>
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          <Badge variant="secondary">{comments.length} comments</Badge>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Article Comments</CardTitle>
          <CardDescription>
            Manage and moderate comments across all articles
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search comments..."
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
                <SelectItem value="all">All Comments</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="spam">Spam</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            {filteredComments.map((comment) => (
              <Card key={comment.id} className={comment.status === "spam" ? "opacity-70" : ""}>
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <Avatar>
                      <AvatarImage src={comment.avatar} />
                      <AvatarFallback>{comment.author[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-semibold">{comment.author}</h4>
                          <p className="text-sm text-muted-foreground">{comment.date}</p>
                        </div>
                        <Badge variant={getStatusVariant(comment.status)}>
                          {comment.status}
                        </Badge>
                      </div>
                      <p className="mt-2">{comment.content}</p>
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>On: {comment.article}</span>
                          <span>•</span>
                          <ThumbsUp className="w-4 h-4" />
                          <span>{comment.likes}</span>
                        </div>
                        <div className="flex gap-2">
                          {comment.status === "pending" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleApproveComment(comment.id)}
                            >
                              Approve
                            </Button>
                          )}
                          <Button variant="outline" size="sm">
                            <Reply className="w-4 h-4 mr-2" />
                            Reply
                          </Button>
                          <Button variant="outline" size="sm">
                            <Flag className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteComment(comment.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredComments.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No comments found matching your criteria</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}