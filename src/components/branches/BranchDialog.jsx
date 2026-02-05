import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { orgUnitApi } from '@/lib/orgUnitApi';
import { UserMultiSelect } from '@/components/branches/UserMultiSelect';
import { BranchLocationsList } from '@/components/branches/BranchLocationsList';
import { useBranchLocations } from '@/hooks/useBranchLocations';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { get } from '@/lib/api';

export function BranchDialog({ branch, open, onOpenChange, onSave }) {
  const [activeTab, setActiveTab] = useState('basic');
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    manager_id: '',
    is_active: true,
    metadata: {
      contact_email: '',
      contact_phone: '',
      notes: '',
    },
  });
  const [isLoading, setIsLoading] = useState(false);

  // Fetch location count for the branch
  const { data: locations = [] } = useBranchLocations(branch?.id, {
    enabled: !!branch?.id && open,
  });

  // Fetch eligible managers (users with role_level >= 40)
  const { data: usersData } = useQuery({
    queryKey: ['users', 'managers'],
    queryFn: async () => {
      const response = await get('/api/users?limit=1000');
      return response.data;
    },
    enabled: !!open, // Only fetch when dialog is open
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    retry: false, // Don't retry on auth errors
  });

  const eligibleManagers =
    usersData?.users?.filter((u) => u.role_level >= 40 && u.is_active) || [];

  useEffect(() => {
    if (branch) {
      setFormData({
        name: branch.name,
        code: branch.code,
        manager_id: branch.manager_id || '',
        is_active: branch.is_active,
        metadata: {
          contact_email: branch.metadata?.contact_email || '',
          contact_phone: branch.metadata?.contact_phone || '',
          notes: branch.metadata?.notes || '',
        },
      });
    } else {
      setFormData({
        name: '',
        code: '',
        manager_id: '',
        is_active: true,
        metadata: {
          contact_email: '',
          contact_phone: '',
          notes: '',
        },
      });
    }
    // Reset to basic tab when opening
    if (open) {
      setActiveTab('basic');
    }
  }, [branch, open]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.code) {
      toast.error('Branch name and code are required');
      return;
    }

    setIsLoading(true);

    try {
      const submitData = {
        ...formData,
        type: 'branch',
        manager_id: formData.manager_id || null,
        metadata: {
          contact_email: formData.metadata.contact_email || null,
          contact_phone: formData.metadata.contact_phone || null,
          notes: formData.metadata.notes || null,
        },
      };

      if (branch) {
        await orgUnitApi.update(branch.id, submitData);
        toast.success('Branch updated successfully');
      } else {
        await orgUnitApi.create(submitData);
        toast.success('Branch created successfully');
      }

      onSave();
    } catch (error) {
      console.error('Failed to save branch:', error);
      toast.error(error.message || 'Failed to save branch');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMetadataChange = (field, value) => {
    setFormData({
      ...formData,
      metadata: {
        ...formData.metadata,
        [field]: value,
      },
    });
  };

  const locationCount = locations?.length || 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{branch ? 'Edit Branch' : 'Create Branch'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="locations" disabled={!branch}>
                Locations ({locationCount})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4 mt-4">
              {/* Branch Name */}
              <div>
                <Label htmlFor="name">
                  Branch Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Headquarters"
                  required
                />
              </div>

              {/* Branch Code */}
              <div>
                <Label htmlFor="code">
                  Branch Code <span className="text-destructive">*</span>
                </Label>
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

              {/* Branch Manager */}
              <div>
                <Label htmlFor="manager_id">Branch Manager</Label>
                <Select
                  value={formData.manager_id || 'none'}
                  onValueChange={(value) =>
                    setFormData({ ...formData, manager_id: value === 'none' ? '' : value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a manager (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {eligibleManagers.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.first_name} {user.last_name} - {user.role_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  Assign a user as the branch manager (role level 40+)
                </p>
              </div>

              {/* Contact Email */}
              <div>
                <Label htmlFor="contact_email">Contact Email</Label>
                <Input
                  id="contact_email"
                  type="email"
                  value={formData.metadata.contact_email}
                  onChange={(e) => handleMetadataChange('contact_email', e.target.value)}
                  placeholder="branch@company.com"
                />
              </div>

              {/* Contact Phone */}
              <div>
                <Label htmlFor="contact_phone">Contact Phone</Label>
                <Input
                  id="contact_phone"
                  type="tel"
                  value={formData.metadata.contact_phone}
                  onChange={(e) => handleMetadataChange('contact_phone', e.target.value)}
                  placeholder="+1 (555) 123-4567"
                />
              </div>

              {/* Notes */}
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.metadata.notes}
                  onChange={(e) => handleMetadataChange('notes', e.target.value)}
                  placeholder="Additional notes about this branch"
                  rows={3}
                />
              </div>

              {/* Active Status */}
              <div className="flex items-center gap-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_active: checked })
                  }
                />
                <Label htmlFor="is_active">Active Status</Label>
              </div>

              {/* User Management */}
              {branch && (
                <div>
                  <Label>Manage Users</Label>
                  <p className="text-xs text-muted-foreground mb-2">
                    Assign users to this branch from the Users page
                  </p>
                  <UserMultiSelect branchId={branch.id} />
                </div>
              )}
            </TabsContent>

            <TabsContent value="locations" className="mt-4">
              {branch && <BranchLocationsList branchId={branch.id} />}
            </TabsContent>
          </Tabs>

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
