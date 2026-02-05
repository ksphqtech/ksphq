/**
 * Branch Locations List Component
 * Displays and manages all locations for a branch
 */

import { useState } from 'react';
import { MapPin, MoreVertical, Pencil, Trash2, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useBranchLocations, useDeleteLocation, useSetPrimaryLocation } from '@/hooks/useBranchLocations';
import { BranchLocationDialog } from './BranchLocationDialog';

export function BranchLocationsList({ branchId }) {
  const { data: locations = [], isLoading, error } = useBranchLocations(branchId);
  const deleteMutation = useDeleteLocation();
  const setPrimaryMutation = useSetPrimaryLocation();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);

  const handleEdit = (location) => {
    setSelectedLocation(location);
    setDialogOpen(true);
  };

  const handleDelete = async (locationId) => {
    if (window.confirm('Are you sure you want to delete this location?')) {
      try {
        await deleteMutation.mutateAsync(locationId);
      } catch (error) {
        // Error handled by mutation hook
      }
    }
  };

  const handleSetPrimary = async (locationId) => {
    try {
      await setPrimaryMutation.mutateAsync(locationId);
    } catch (error) {
      // Error handled by mutation hook
    }
  };

  const handleAddNew = () => {
    setSelectedLocation(null);
    setDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-muted-foreground">Loading locations...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-destructive">Failed to load locations</p>
      </div>
    );
  }

  if (locations.length === 0) {
    return (
      <div className="text-center py-8 space-y-4">
        <MapPin className="w-12 h-12 mx-auto text-muted-foreground" />
        <div>
          <h3 className="text-lg font-medium">No locations yet</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Get started by adding your first location for this branch.
          </p>
        </div>
        <Button onClick={handleAddNew}>Add First Location</Button>
        <BranchLocationDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          branchId={branchId}
          location={selectedLocation}
          onSuccess={() => setSelectedLocation(null)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          {locations.length} {locations.length === 1 ? 'location' : 'locations'}
        </p>
        <Button onClick={handleAddNew}>Add Location</Button>
      </div>

      <div className="grid gap-4">
        {locations.map((location) => (
          <Card key={location.id}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base">{location.location_name}</CardTitle>
                    {location.is_primary && (
                      <Badge variant="default" className="gap-1">
                        <Star className="w-3 h-3" />
                        Primary
                      </Badge>
                    )}
                  </div>
                  <CardDescription className="flex items-start gap-1.5">
                    <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>
                      {location.address_line1}
                      {location.address_line2 && `, ${location.address_line2}`}
                      <br />
                      {location.city}
                      {location.state_province && `, ${location.state_province}`}
                      {location.postal_code && ` ${location.postal_code}`}
                      <br />
                      {location.country}
                    </span>
                  </CardDescription>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleEdit(location)}>
                      <Pencil className="w-4 h-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    {!location.is_primary && (
                      <DropdownMenuItem onClick={() => handleSetPrimary(location.id)}>
                        <Star className="w-4 h-4 mr-2" />
                        Set as Primary
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      onClick={() => handleDelete(location.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>

            {(location.notes || location.latitude || location.longitude) && (
              <CardContent className="pt-0">
                {location.notes && (
                  <p className="text-sm text-muted-foreground">{location.notes}</p>
                )}
                {(location.latitude || location.longitude) && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Coordinates: {location.latitude || 'N/A'}, {location.longitude || 'N/A'}
                  </p>
                )}
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      <BranchLocationDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        branchId={branchId}
        location={selectedLocation}
        onSuccess={() => setSelectedLocation(null)}
      />
    </div>
  );
}
