import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Search, Edit, Trash2, Mail, UserPlus } from "lucide-react";

interface Collaborator {
  _id: string;
  name: string;
  email: string;
  role: string;
  status: "active" | "pending" | "inactive";
  joinDate: string;
}

export default function Collaborators() {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [newCollaborator, setNewCollaborator] = useState({
    name: "",
    email: "",
    role: "Writer",
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Fetch collaborators on component mount
  useEffect(() => {
    fetchCollaborators();
  }, []);

  const fetchCollaborators = async () => {
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter !== 'all') params.append('status', statusFilter);

      const response = await fetch(`http://localhost:5050/api/collaborators?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setCollaborators(data.data);
      }
    } catch (error) {
      console.error('Error fetching collaborators:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddCollaborator = async () => {
    if (newCollaborator.name && newCollaborator.email) {
      try {
        const response = await fetch('http://localhost:5050/api/collaborators', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(newCollaborator),
        });

        const data = await response.json();
        
        if (data.success) {
          await fetchCollaborators();
          setNewCollaborator({ name: "", email: "", role: "Writer" });
          setIsDialogOpen(false);
        } else {
          alert(data.message || 'Error adding collaborator');
        }
      } catch (error) {
        console.error('Error adding collaborator:', error);
        alert('Error adding collaborator');
      }
    }
  };

  const handleDeleteCollaborator = async (id: string) => {
    if (!confirm('Are you sure you want to delete this collaborator?')) return;

    try {
      const response = await fetch(`http://localhost:5050/api/collaborators/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      
      if (data.success) {
        await fetchCollaborators();
      } else {
        alert(data.message || 'Error deleting collaborator');
      }
    } catch (error) {
      console.error('Error deleting collaborator:', error);
      alert('Error deleting collaborator');
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      const response = await fetch(`http://localhost:5050/api/collaborators/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      const data = await response.json();
      
      if (data.success) {
        await fetchCollaborators();
      } else {
        alert(data.message || 'Error updating status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Error updating status');
    }
  };

  const handleResendInvitation = async (id: string) => {
    try {
      const response = await fetch(`http://localhost:5050/api/collaborators/${id}/resend-invitation`, {
        method: 'POST',
      });

      const data = await response.json();
      
      if (data.success) {
        alert('Invitation resent successfully');
        await fetchCollaborators();
      } else {
        alert(data.message || 'Error resending invitation');
      }
    } catch (error) {
      console.error('Error resending invitation:', error);
      alert('Error resending invitation');
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "active": return "default";
      case "pending": return "secondary";
      case "inactive": return "outline";
      default: return "outline";
    }
  };

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCollaborators();
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, statusFilter]);

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center min-h-96">
        <div className="text-center">
          <UserPlus className="w-12 h-12 animate-pulse mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Loading collaborators...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Collaborators</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="w-4 h-4 mr-2" />
              Add Collaborator
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Collaborator</DialogTitle>
              <DialogDescription>
                Invite someone to collaborate on your content.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={newCollaborator.name}
                  onChange={(e) => setNewCollaborator({ ...newCollaborator, name: e.target.value })}
                  placeholder="Enter full name"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newCollaborator.email}
                  onChange={(e) => setNewCollaborator({ ...newCollaborator, email: e.target.value })}
                  placeholder="Enter email address"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="role">Role</Label>
                <Select
                  value={newCollaborator.role}
                  onValueChange={(value) => setNewCollaborator({ ...newCollaborator, role: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Writer">Writer</SelectItem>
                    <SelectItem value="Editor">Editor</SelectItem>
                    <SelectItem value="Reviewer">Reviewer</SelectItem>
                    <SelectItem value="Admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleAddCollaborator}>Send Invitation</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
          <CardDescription>
            Manage your content collaborators and their permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search collaborators..."
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
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Join Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {collaborators.map((collaborator) => (
                <TableRow key={collaborator._id}>
                  <TableCell className="font-medium">{collaborator.name}</TableCell>
                  <TableCell>{collaborator.email}</TableCell>
                  <TableCell>{collaborator.role}</TableCell>
                  <TableCell>
                    <Select
                      value={collaborator.status}
                      onValueChange={(value) => handleUpdateStatus(collaborator._id, value)}
                    >
                      <SelectTrigger className="w-[130px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>{new Date(collaborator.joinDate).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleResendInvitation(collaborator._id)}
                      >
                        <Mail className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteCollaborator(collaborator._id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}