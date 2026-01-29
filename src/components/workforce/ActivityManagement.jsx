import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  getActivities,
  saveActivity,
  updateActivity,
  deleteActivity
} from '@/lib/workforceData';

const CATEGORIES = [
  'Technical',
  'Administrative',
  'Professional Development',
  'Client Management',
  'Other'
];

export function ActivityManagement() {
  const [activities, setActivities] = useState([]);
  const [showDialog, setShowDialog] = useState(false);
  const [editingActivity, setEditingActivity] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    category: 'Technical',
    billable: true,
    status: 'active',
    description: ''
  });

  useEffect(() => {
    loadActivities();
  }, []);

  const loadActivities = () => {
    setActivities(getActivities());
  };

  const handleAdd = () => {
    setEditingActivity(null);
    setFormData({
      name: '',
      code: '',
      category: 'Technical',
      billable: true,
      status: 'active',
      description: ''
    });
    setShowDialog(true);
  };

  const handleEdit = (activity) => {
    setEditingActivity(activity);
    setFormData({
      name: activity.name,
      code: activity.code,
      category: activity.category,
      billable: activity.billable,
      status: activity.status,
      description: activity.description || ''
    });
    setShowDialog(true);
  };

  const handleDelete = (activity) => {
    if (confirm(`Are you sure you want to delete "${activity.name}"?`)) {
      deleteActivity(activity.id);
      loadActivities();
    }
  };

  const handleSave = () => {
    if (!formData.name || !formData.code) {
      alert('Name and Code are required');
      return;
    }

    if (editingActivity) {
      updateActivity(editingActivity.id, formData);
    } else {
      saveActivity(formData);
    }

    loadActivities();
    setShowDialog(false);
  };

  const handleFieldChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Activities</h3>
        <Button onClick={handleAdd}>
          <Plus className="h-4 w-4 mr-2" />
          Add Activity
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Billable</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {activities.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  No activities found. Add one to get started.
                </TableCell>
              </TableRow>
            ) : (
              activities.map(activity => (
                <TableRow key={activity.id}>
                  <TableCell className="font-medium">{activity.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{activity.code}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{activity.category}</Badge>
                  </TableCell>
                  <TableCell>
                    {activity.billable ? (
                      <Badge variant="default">Billable</Badge>
                    ) : (
                      <Badge variant="secondary">Non-billable</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={activity.status === 'active' ? 'default' : 'secondary'}>
                      {activity.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(activity)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(activity)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingActivity ? 'Edit Activity' : 'Add Activity'}
            </DialogTitle>
            <DialogDescription>
              {editingActivity
                ? 'Update activity information.'
                : 'Add a new activity to the system.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleFieldChange('name', e.target.value)}
                placeholder="Activity name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="code">Code *</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => handleFieldChange('code', e.target.value.toUpperCase())}
                placeholder="ACT_CODE"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => handleFieldChange('category', value)}
              >
                <SelectTrigger id="category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(category => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleFieldChange('description', e.target.value)}
                placeholder="Activity description..."
                rows={3}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="billable">Billable</Label>
              <Switch
                id="billable"
                checked={formData.billable}
                onCheckedChange={(checked) => handleFieldChange('billable', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="status">Active</Label>
              <Switch
                id="status"
                checked={formData.status === 'active'}
                onCheckedChange={(checked) =>
                  handleFieldChange('status', checked ? 'active' : 'inactive')
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {editingActivity ? 'Save Changes' : 'Add Activity'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
