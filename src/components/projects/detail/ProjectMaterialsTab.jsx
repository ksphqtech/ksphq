import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { get, post, patch, del } from '@/lib/api';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Loader2, Package } from 'lucide-react';
import { MATERIAL_STATUSES, MATERIAL_STATUS_LABELS } from '@/lib/projectConstants';

export function ProjectMaterialsTab({ projectId }) {
  const queryClient = useQueryClient();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [materialToDelete, setMaterialToDelete] = useState(null);
  const [formData, setFormData] = useState({
    name: '', description: '', category: '', quantity_needed: '', unit: '',
    unit_cost: '', status: 'not_ordered',
  });

  const { data: materialsData, isLoading } = useQuery({
    queryKey: ['project-materials', projectId],
    queryFn: () => get(\`/api/projects/\${projectId}/materials\`),
  });

  const createMutation = useMutation({
    mutationFn: (data) => post(\`/api/projects/\${projectId}/materials\`, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['project-materials', projectId]);
      toast.success('Material added successfully');
      setShowAddDialog(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to add material');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => patch(\`/api/materials/\${id}\`, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['project-materials', projectId]);
      toast.success('Material updated successfully');
      setShowEditDialog(false);
      setEditingMaterial(null);
      resetForm();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update material');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => del(\`/api/materials/\${id}\`),
    onSuccess: () => {
      queryClient.invalidateQueries(['project-materials', projectId]);
      toast.success('Material deleted successfully');
      setMaterialToDelete(null);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete material');
    },
  });

  const resetForm = () => {
    setFormData({ name: '', description: '', category: '', quantity_needed: '', unit: '', unit_cost: '', status: 'not_ordered' });
  };

  const handleOpenAdd = () => {
    resetForm();
    setShowAddDialog(true);
  };

  const handleOpenEdit = (material) => {
    setEditingMaterial(material);
    setFormData({
      name: material.name,
      description: material.description || '',
      category: material.category || '',
      quantity_needed: material.quantity_needed,
      unit: material.unit,
      unit_cost: material.unit_cost || '',
      status: material.status,
    });
    setShowEditDialog(true);
  };

  const handleSubmitAdd = (e) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const handleSubmitEdit = (e) => {
    e.preventDefault();
    updateMutation.mutate({ id: editingMaterial.id, data: formData });
  };

  const handleDelete = () => {
    if (materialToDelete) {
      deleteMutation.mutate(materialToDelete.id);
    }
  };

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'received': return 'default';
      case 'in_transit': return 'secondary';
      case 'ordered': return 'outline';
      case 'not_ordered': return 'outline';
      default: return 'outline';
    }
  };

  const materials = materialsData?.materials || [];
  const totalCost = materials.reduce((sum, m) => sum + (m.quantity_needed * (m.unit_cost || 0)), 0);

  if (isLoading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{materials.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Materials tracked</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Cost</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">\${totalCost.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">Estimated budget</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Received</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{materials.filter(m => m.status === 'received').length}</div>
            <p className="text-xs text-muted-foreground mt-1">Materials on-site</p>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Materials</CardTitle>
              <CardDescription>Track materials and resources for this project</CardDescription>
            </div>
            <Button onClick={handleOpenAdd}>
              <Plus className="mr-2 h-4 w-4" />Add Material
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {materials.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">No materials added yet</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Material</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Unit Cost</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {materials.map((material) => (
                  <TableRow key={material.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{material.name}</div>
                        {material.category && <div className="text-sm text-muted-foreground">{material.category}</div>}
                      </div>
                    </TableCell>
                    <TableCell>{material.quantity_needed} {material.unit}</TableCell>
                    <TableCell>\${(material.unit_cost || 0).toFixed(2)}</TableCell>
                    <TableCell>\${(material.quantity_needed * (material.unit_cost || 0)).toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(material.status)}>{MATERIAL_STATUS_LABELS[material.status]}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(material)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setMaterialToDelete(material)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Material</DialogTitle>
            <DialogDescription>Add a new material to track for this project.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitAdd} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-2">
                <Label htmlFor="name">Material Name *</Label>
                <Input id="name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
              </div>
              <div className="col-span-2 space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} rows={2} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input id="category" value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
                  <SelectTrigger id="status"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {MATERIAL_STATUSES.map((status) => (
                      <SelectItem key={status} value={status}>{MATERIAL_STATUS_LABELS[status]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity *</Label>
                <Input id="quantity" type="number" step="0.01" value={formData.quantity_needed} onChange={(e) => setFormData({...formData, quantity_needed: e.target.value})} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit">Unit *</Label>
                <Input id="unit" value={formData.unit} onChange={(e) => setFormData({...formData, unit: e.target.value})} required placeholder="e.g., kg, m, pcs" />
              </div>
              <div className="col-span-2 space-y-2">
                <Label htmlFor="cost">Unit Cost</Label>
                <Input id="cost" type="number" step="0.01" value={formData.unit_cost} onChange={(e) => setFormData({...formData, unit_cost: e.target.value})} placeholder="0.00" />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)} disabled={createMutation.isPending}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Add Material
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Material</DialogTitle>
            <DialogDescription>Update material details.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitEdit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-2">
                <Label htmlFor="edit-name">Material Name *</Label>
                <Input id="edit-name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
              </div>
              <div className="col-span-2 space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea id="edit-description" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} rows={2} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-category">Category</Label>
                <Input id="edit-category" value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
                  <SelectTrigger id="edit-status"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {MATERIAL_STATUSES.map((status) => (
                      <SelectItem key={status} value={status}>{MATERIAL_STATUS_LABELS[status]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-quantity">Quantity *</Label>
                <Input id="edit-quantity" type="number" step="0.01" value={formData.quantity_needed} onChange={(e) => setFormData({...formData, quantity_needed: e.target.value})} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-unit">Unit *</Label>
                <Input id="edit-unit" value={formData.unit} onChange={(e) => setFormData({...formData, unit: e.target.value})} required />
              </div>
              <div className="col-span-2 space-y-2">
                <Label htmlFor="edit-cost">Unit Cost</Label>
                <Input id="edit-cost" type="number" step="0.01" value={formData.unit_cost} onChange={(e) => setFormData({...formData, unit_cost: e.target.value})} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowEditDialog(false)} disabled={updateMutation.isPending}>Cancel</Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={!!materialToDelete} onOpenChange={(open) => !open && setMaterialToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Material</DialogTitle>
            <DialogDescription>Are you sure you want to delete {materialToDelete?.name}?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMaterialToDelete(null)} disabled={deleteMutation.isPending}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
