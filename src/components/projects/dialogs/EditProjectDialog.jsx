/**
 * Edit Project Dialog
 * Dialog for editing existing project details
 */

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { patch } from '@/lib/api';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { useOrgUnits } from '@/hooks/useOrgUnits';
import { useUsers } from '@/hooks/useUsers';
import { PROJECT_STATUSES, PRIORITIES, STATUS_LABELS, PRIORITY_LABELS } from '@/lib/projectConstants';

export function EditProjectDialog({ project, open, onOpenChange }) {
  const queryClient = useQueryClient();
  const { data: orgUnitsData } = useOrgUnits();
  const { data: usersData } = useUsers();

  const form = useForm({
    defaultValues: {
      name: project?.name || '',
      description: project?.description || '',
      status: project?.status || 'planning',
      priority: project?.priority || 'medium',
      start_date: project?.start_date || '',
      end_date: project?.end_date || '',
      budget_amount: project?.budget_amount || '',
      project_manager_id: project?.project_manager_id || '',
      branch_id: project?.branch_id || '',
    },
  });

  useEffect(() => {
    if (project) {
      form.reset({
        name: project.name || '',
        description: project.description || '',
        status: project.status || 'planning',
        priority: project.priority || 'medium',
        start_date: project.start_date || '',
        end_date: project.end_date || '',
        budget_amount: project.budget_amount || '',
        project_manager_id: project.project_manager_id || '',
        branch_id: project.branch_id || '',
      });
    }
  }, [project, form]);

  const updateProjectMutation = useMutation({
    mutationFn: (data) => patch(\`/api/projects/\${project.id}\`, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['projects']);
      queryClient.invalidateQueries(['project', project.id]);
      toast.success('Project updated successfully');
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update project');
    },
  });

  const onSubmit = (data) => {
    const cleanedData = Object.entries(data).reduce((acc, [key, value]) => {
      if (value !== '' && value !== null && value !== undefined) {
        acc[key] = value;
      }
      return acc;
    }, {});
    updateProjectMutation.mutate(cleanedData);
  };

  const branches = orgUnitsData?.organizational_units?.filter((unit) => unit.type === 'branch') || [];
  const managers = usersData?.users?.filter((user) => user.is_active) || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Project</DialogTitle>
          <DialogDescription>Update project details and settings.</DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Project Name *</Label>
            <Input id="name" {...form.register('name', { required: true })} placeholder="Enter project name" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" {...form.register('description')} placeholder="Enter project description" rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={form.watch('status')} onValueChange={(value) => form.setValue('status', value)}>
                <SelectTrigger id="status"><SelectValue placeholder="Select status" /></SelectTrigger>
                <SelectContent>
                  {PROJECT_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>{STATUS_LABELS[status]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select value={form.watch('priority')} onValueChange={(value) => form.setValue('priority', value)}>
                <SelectTrigger id="priority"><SelectValue placeholder="Select priority" /></SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((priority) => (
                    <SelectItem key={priority} value={priority}>{PRIORITY_LABELS[priority]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">Start Date</Label>
              <Input id="start_date" type="date" {...form.register('start_date')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_date">End Date</Label>
              <Input id="end_date" type="date" {...form.register('end_date')} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="budget_amount">Budget Amount</Label>
            <Input id="budget_amount" type="number" step="0.01" {...form.register('budget_amount')} placeholder="0.00" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="project_manager_id">Project Manager *</Label>
            <Select value={form.watch('project_manager_id')} onValueChange={(value) => form.setValue('project_manager_id', value)}>
              <SelectTrigger id="project_manager_id"><SelectValue placeholder="Select project manager" /></SelectTrigger>
              <SelectContent>
                {managers.map((user) => (
                  <SelectItem key={user.id} value={user.id}>{user.first_name} {user.last_name} ({user.email})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="branch_id">Branch</Label>
            <Select value={form.watch('branch_id')} onValueChange={(value) => form.setValue('branch_id', value)}>
              <SelectTrigger id="branch_id"><SelectValue placeholder="Select branch" /></SelectTrigger>
              <SelectContent>
                {branches.map((branch) => (
                  <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={updateProjectMutation.isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateProjectMutation.isPending}>
              {updateProjectMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
