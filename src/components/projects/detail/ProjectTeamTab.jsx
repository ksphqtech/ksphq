import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { get, post, del } from '@/lib/api';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Mail, Loader2 } from 'lucide-react';
import { useUsers } from '@/hooks/useUsers';
import { PROJECT_ROLES, PROJECT_ROLE_LABELS } from '@/lib/projectConstants';

export function ProjectTeamTab({ project }) {
  const queryClient = useQueryClient();
  const [showAddMemberDialog, setShowAddMemberDialog] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState(null);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedRole, setSelectedRole] = useState('member');

  const { data: usersData } = useUsers();
  const { data: membersData, isLoading } = useQuery({
    queryKey: ['project-members', project.id],
    queryFn: () => get(\`/api/projects/\${project.id}/members\`),
  });

  const addMemberMutation = useMutation({
    mutationFn: (data) => post(\`/api/projects/\${project.id}/members\`, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['project-members', project.id]);
      toast.success('Team member added successfully');
      setShowAddMemberDialog(false);
      setSelectedUserId('');
      setSelectedRole('member');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to add team member');
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: (memberId) => del(\`/api/projects/\${project.id}/members/\${memberId}\`),
    onSuccess: () => {
      queryClient.invalidateQueries(['project-members', project.id]);
      toast.success('Team member removed successfully');
      setMemberToRemove(null);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to remove team member');
    },
  });

  const getInitials = (name) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '??';
  };

  const handleAddMember = () => {
    if (!selectedUserId) {
      toast.error('Please select a user');
      return;
    }
    addMemberMutation.mutate({ user_id: selectedUserId, role: selectedRole });
  };

  const handleRemoveMember = () => {
    if (memberToRemove) {
      removeMemberMutation.mutate(memberToRemove.user_id);
    }
  };

  const getRoleBadgeVariant = (role) => {
    switch (role?.toLowerCase()) {
      case 'owner': return 'default';
      case 'manager': return 'secondary';
      case 'member': return 'outline';
      case 'viewer': return 'outline';
      default: return 'outline';
    }
  };

  const teamMembers = membersData?.members || [];
  const availableUsers = usersData?.users?.filter(
    user => user.is_active && !teamMembers.some(m => m.user_id === user.id)
  ) || [];

  if (isLoading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Team Size</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teamMembers.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Active members</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Project Manager</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarFallback className="text-xs">{getInitials(project.project_manager_name)}</AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium">{project.project_manager_name || 'Not assigned'}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Roles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{new Set(teamMembers.map(m => m.role)).size}</div>
            <p className="text-xs text-muted-foreground mt-1">Different roles</p>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Team Members</CardTitle>
              <CardDescription>Manage project team members and their roles</CardDescription>
            </div>
            <Button onClick={() => setShowAddMemberDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />Add Member
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teamMembers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No team members assigned yet.</TableCell>
                </TableRow>
              ) : (
                teamMembers.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>{getInitials(member.user_name)}</AvatarFallback>
                        </Avatar>
                        <div className="font-medium">{member.user_name}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="h-4 w-4" />{member.user_email}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getRoleBadgeVariant(member.role)}>{PROJECT_ROLE_LABELS[member.role] || member.role}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => setMemberToRemove(member)} disabled={member.role === 'owner'}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Dialog open={showAddMemberDialog} onOpenChange={setShowAddMemberDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Team Member</DialogTitle>
            <DialogDescription>Add a new member to the project team.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="user">Select User *</Label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger id="user"><SelectValue placeholder="Select a user" /></SelectTrigger>
                <SelectContent>
                  {availableUsers.map((user) => (
                    <SelectItem key={user.id} value={user.id}>{user.first_name} {user.last_name} ({user.email})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role *</Label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger id="role"><SelectValue placeholder="Select a role" /></SelectTrigger>
                <SelectContent>
                  {PROJECT_ROLES.filter(r => r !== 'owner').map((role) => (
                    <SelectItem key={role} value={role}>{PROJECT_ROLE_LABELS[role]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddMemberDialog(false)} disabled={addMemberMutation.isPending}>Cancel</Button>
            <Button onClick={handleAddMember} disabled={addMemberMutation.isPending || !selectedUserId}>
              {addMemberMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Add Member
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={!!memberToRemove} onOpenChange={(open) => !open && setMemberToRemove(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Team Member</DialogTitle>
            <DialogDescription>Are you sure you want to remove {memberToRemove?.user_name} from this project?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMemberToRemove(null)} disabled={removeMemberMutation.isPending}>Cancel</Button>
            <Button variant="destructive" onClick={handleRemoveMember} disabled={removeMemberMutation.isPending}>
              {removeMemberMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Remove Member
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
