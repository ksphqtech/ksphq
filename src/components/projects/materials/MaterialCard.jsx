import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Package, MoreVertical, Edit2, Trash2, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Status badge variants for materials
 */
const statusVariants = {
  not_ordered: 'bg-gray-100 text-gray-800 border-gray-300',
  ordered: 'bg-blue-100 text-blue-800 border-blue-300',
  received: 'bg-green-100 text-green-800 border-green-300',
  in_use: 'bg-purple-100 text-purple-800 border-purple-300',
};

/**
 * Status display labels
 */
const statusLabels = {
  not_ordered: 'Not Ordered',
  ordered: 'Ordered',
  received: 'Received',
  in_use: 'In Use',
};

/**
 * Calculate material progress
 */
function calculateProgress(received, needed) {
  if (!needed || needed === 0) return 0;
  return Math.min(Math.round((received / needed) * 100), 100);
}

/**
 * MaterialCard Component
 * Mobile-friendly card view for displaying material information
 * Shows key details and action menu
 *
 * @param {Object} material - Material object
 * @param {function} onEdit - Callback when edit is clicked
 * @param {function} onDelete - Callback when delete is clicked
 */
export function MaterialCard({ material, onEdit, onDelete }) {
  const progress = calculateProgress(
    material.quantity_received || 0,
    material.quantity_needed
  );

  const totalCost =
    material.unit_cost && material.quantity_needed
      ? parseFloat(material.unit_cost) * parseFloat(material.quantity_needed)
      : null;

  return (
    <Card className="hover:shadow-md transition-all">
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header Row */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className="shrink-0 h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Package className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm truncate">{material.name}</h3>
                {material.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                    {material.description}
                  </p>
                )}
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(material)}>
                  <Edit2 className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onDelete(material)}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Status and Category */}
          <div className="flex items-center gap-2">
            <Badge className={cn('text-xs', statusVariants[material.status])}>
              {statusLabels[material.status]}
            </Badge>
            {material.category && (
              <span className="text-xs text-muted-foreground capitalize">
                {material.category}
              </span>
            )}
          </div>

          {/* Quantities */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Quantity</span>
              <span className="font-medium">
                {material.quantity_received || 0} / {material.quantity_needed} {material.unit}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="flex items-center gap-2">
              <Progress value={progress} className="h-2 flex-1" />
              <span className="text-xs font-medium min-w-[35px] text-right">
                {progress}%
              </span>
            </div>
          </div>

          {/* Cost Information */}
          {material.unit_cost && (
            <div className="pt-2 border-t space-y-1">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Unit Cost</span>
                <span>${parseFloat(material.unit_cost).toFixed(2)}</span>
              </div>
              {totalCost && (
                <div className="flex items-center justify-between text-sm font-medium">
                  <span>Total Cost</span>
                  <span className="flex items-center gap-1">
                    <DollarSign className="h-3 w-3" />
                    {totalCost.toFixed(2)}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          {material.notes && (
            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground line-clamp-2">
                <span className="font-medium">Notes:</span> {material.notes}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
