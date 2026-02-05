import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
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
import { useUpdateMaterial } from '@/hooks/useMaterials';

/**
 * EditMaterialDialog Component
 * Dialog form to edit an existing material with validation
 * Pre-fills form with current material data
 *
 * @param {boolean} open - Dialog open state
 * @param {function} onOpenChange - Callback to change open state
 * @param {Object} material - Material object to edit
 */
export function EditMaterialDialog({ open, onOpenChange, material }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const updateMaterial = useUpdateMaterial();

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: '',
      description: '',
      category: '',
      quantity_needed: '',
      quantity_received: '',
      unit: '',
      unit_cost: '',
      status: 'not_ordered',
      notes: '',
    },
  });

  // Update form values when material changes
  useEffect(() => {
    if (material) {
      reset({
        name: material.name || '',
        description: material.description || '',
        category: material.category || '',
        quantity_needed: material.quantity_needed?.toString() || '',
        quantity_received: material.quantity_received?.toString() || '0',
        unit: material.unit || '',
        unit_cost: material.unit_cost?.toString() || '',
        status: material.status || 'not_ordered',
        notes: material.notes || '',
      });
    }
  }, [material, reset]);

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const updates = {
        name: data.name,
        description: data.description || null,
        category: data.category || null,
        quantity_needed: parseFloat(data.quantity_needed),
        quantity_received: data.quantity_received ? parseFloat(data.quantity_received) : 0,
        unit: data.unit,
        unit_cost: data.unit_cost ? parseFloat(data.unit_cost) : null,
        status: data.status,
        notes: data.notes || null,
      };

      await updateMaterial.mutateAsync({
        materialId: material.id,
        updates,
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to update material:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Material</DialogTitle>
          <DialogDescription>
            Update material information and tracking details.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">
              Material Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              {...register('name', { required: 'Material name is required' })}
              placeholder="e.g., 2x4 Lumber, Concrete Mix, etc."
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Additional details about the material"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Controller
                name="category"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      <SelectItem value="lumber">Lumber</SelectItem>
                      <SelectItem value="hardware">Hardware</SelectItem>
                      <SelectItem value="electrical">Electrical</SelectItem>
                      <SelectItem value="plumbing">Plumbing</SelectItem>
                      <SelectItem value="concrete">Concrete</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="status">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="not_ordered">Not Ordered</SelectItem>
                      <SelectItem value="ordered">Ordered</SelectItem>
                      <SelectItem value="received">Received</SelectItem>
                      <SelectItem value="in_use">In Use</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity_needed">
                Quantity Needed <span className="text-destructive">*</span>
              </Label>
              <Input
                id="quantity_needed"
                type="number"
                step="0.01"
                min="0"
                {...register('quantity_needed', {
                  required: 'Quantity needed is required',
                  min: { value: 0, message: 'Must be positive' },
                })}
                placeholder="0"
              />
              {errors.quantity_needed && (
                <p className="text-sm text-destructive">
                  {errors.quantity_needed.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity_received">Quantity Received</Label>
              <Input
                id="quantity_received"
                type="number"
                step="0.01"
                min="0"
                {...register('quantity_received', {
                  min: { value: 0, message: 'Must be positive' },
                })}
                placeholder="0"
              />
              {errors.quantity_received && (
                <p className="text-sm text-destructive">
                  {errors.quantity_received.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit">
                Unit <span className="text-destructive">*</span>
              </Label>
              <Input
                id="unit"
                {...register('unit', { required: 'Unit is required' })}
                placeholder="e.g., pcs, ft, lbs"
              />
              {errors.unit && (
                <p className="text-sm text-destructive">{errors.unit.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="unit_cost">Unit Cost ($)</Label>
            <Input
              id="unit_cost"
              type="number"
              step="0.01"
              min="0"
              {...register('unit_cost', {
                min: { value: 0, message: 'Must be positive' },
              })}
              placeholder="0.00"
            />
            {errors.unit_cost && (
              <p className="text-sm text-destructive">{errors.unit_cost.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              {...register('notes')}
              placeholder="Additional notes or supplier information"
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
