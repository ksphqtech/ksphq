import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { orgUnitApi } from '@/lib/orgUnitApi';
import { UserMultiSelect } from '@/components/branches/UserMultiSelect';
import { useToast } from '@/hooks/use-toast';

export function BranchDialog({ branch, open, onOpenChange, onSave }) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    is_active: true,
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (branch) {
      setFormData({
        name: branch.name,
        code: branch.code,
        is_active: branch.is_active,
      });
    } else {
      setFormData({ name: '', code: '', is_active: true });
    }
  }, [branch]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.code) {
      toast({
        title: 'Validation Error',
        description: 'Branch name and code are required',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      if (branch) {
        await orgUnitApi.update(branch.id, {
          ...formData,
          type: 'branch',
        });
        toast({
          title: 'Success',
          description: 'Branch updated successfully',
        });
      } else {
        await orgUnitApi.create({
          ...formData,
          type: 'branch',
        });
        toast({
          title: 'Success',
          description: 'Branch created successfully',
        });
      }

      onSave();
    } catch (error) {
      console.error('Failed to save branch:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save branch',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {branch ? 'Edit Branch' : 'Create Branch'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Branch Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Headquarters"
                required
              />
            </div>

            <div>
              <Label htmlFor="code">Branch Code *</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="e.g., HQ"
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                Short code used for identification (2-6 characters recommended)
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label htmlFor="is_active">Active Status</Label>
            </div>
          </div>

          {branch && (
            <div>
              <Label>Manage Users</Label>
              <p className="text-xs text-muted-foreground mb-2">
                Assign users to this branch from the Users page
              </p>
              <UserMultiSelect branchId={branch.id} />
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
