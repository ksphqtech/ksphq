/**
 * Organizational Units Management Page
 * Manage branches, departments, shifts, teams, and groups
 */

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, MoreVertical, Edit, Trash2, Building2, Info } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useOrgUnits, useDeleteOrgUnit } from '@/hooks/useOrgUnits';
import { OrgUnitDialog } from '@/components/org-units/OrgUnitDialog';

const ORG_UNIT_TYPES = [
  { key: 'branch', label: 'Branches', icon: Building2, description: 'Physical locations or regional offices' },
  { key: 'department', label: 'Departments', icon: Building2, description: 'Functional departments within the organization' },
  { key: 'shift', label: 'Shifts', icon: Building2, description: 'Work shifts or schedules' },
  { key: 'team', label: 'Teams', icon: Building2, description: 'Working teams or groups' },
  { key: 'group', label: 'Groups', icon: Building2, description: 'Custom groupings or categories' },
];

export function OrgUnitsPage() {
  const { user: currentUser } = useAuth();
  const [activeType, setActiveType] = useState('branch');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingUnit, setEditingUnit] = useState(null);

  const { data: orgUnitsData, isLoading, error } = useOrgUnits({ type: activeType });
  const deleteOrgUnit = useDeleteOrgUnit();

  const units = orgUnitsData?.units || [];
  const isAdmin = currentUser?.role_level >= 100;

  const handleDelete = async (unit) => {
    if (!confirm(`Are you sure you want to delete "${unit.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await deleteOrgUnit.mutateAsync(unit.id);
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleCreate = () => {
    setEditingUnit({ type: activeType }); // Pre-set type for new unit
    setShowCreateDialog(true);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const currentTypeInfo = ORG_UNIT_TYPES.find(t => t.key === activeType);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Organizational Structure</h1>
            <p className="text-muted-foreground">
              Manage branches, departments, shifts, teams, and groups
            </p>
          </div>
          {isAdmin && (
            <Button onClick={handleCreate} className="gap-2">
              <Plus className="h-4 w-4" />
              Create {currentTypeInfo?.label.slice(0, -1)}
            </Button>
          )}
        </div>

        {!isAdmin && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Only administrators can manage organizational units. Contact your administrator
              to create or modify organizational structure.
            </AlertDescription>
          </Alert>
        )}

        {/* Tabs by Type */}
        <Tabs value={activeType} onValueChange={setActiveType}>
          <TabsList className="grid w-full grid-cols-5">
            {ORG_UNIT_TYPES.map(type => (
              <TabsTrigger key={type.key} value={type.key}>
                {type.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {ORG_UNIT_TYPES.map(type => (
            <TabsContent key={type.key} value={type.key} className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <type.icon className="h-5 w-5" />
                    {type.label}
                  </CardTitle>
                  <CardDescription>{type.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  {error && (
                    <Alert variant="destructive" className="mb-4">
                      <AlertDescription>
                        Failed to load {type.label.toLowerCase()}: {error.message}
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Code</TableHead>
                          {(type.key === 'branch' || type.key === 'department') && (
                            <TableHead>Manager/Head</TableHead>
                          )}
                          <TableHead>Parent</TableHead>
                          <TableHead>Users</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Created</TableHead>
                          {isAdmin && <TableHead className="text-right">Actions</TableHead>}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {isLoading ? (
                          <TableRow>
                            <TableCell
                              colSpan={(type.key === 'branch' || type.key === 'department') ? (isAdmin ? 8 : 7) : (isAdmin ? 7 : 6)}
                              className="text-center py-8"
                            >
                              <div className="text-muted-foreground">Loading...</div>
                            </TableCell>
                          </TableRow>
                        ) : units.length === 0 ? (
                          <TableRow>
                            <TableCell
                              colSpan={(type.key === 'branch' || type.key === 'department') ? (isAdmin ? 8 : 7) : (isAdmin ? 7 : 6)}
                              className="text-center py-8"
                            >
                              <div className="text-muted-foreground">
                                No {type.label.toLowerCase()} created yet
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : (
                          units.map((unit) => (
                            <TableRow key={unit.id}>
                              <TableCell className="font-medium">
                                <div className="flex items-center gap-2">
                                  {unit.name}
                                  {type.key === 'department' && unit.is_multi_branch && (
                                    <Badge variant="secondary" className="text-xs">
                                      Org-wide
                                    </Badge>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                {unit.code ? (
                                  <Badge variant="outline">{unit.code}</Badge>
                                ) : (
                                  <span className="text-sm text-muted-foreground">-</span>
                                )}
                              </TableCell>
                              {(type.key === 'branch' || type.key === 'department') && (
                                <TableCell>
                                  {unit.manager_name ? (
                                    <div className="space-y-0.5">
                                      <div className="text-sm font-medium">{unit.manager_name}</div>
                                      {unit.manager_email && (
                                        <div className="text-xs text-muted-foreground">{unit.manager_email}</div>
                                      )}
                                    </div>
                                  ) : type.key === 'department' && unit.metadata?.contact_email ? (
                                    <div className="space-y-0.5">
                                      <div className="text-xs text-muted-foreground">
                                        {unit.metadata.contact_email}
                                      </div>
                                      {unit.metadata?.contact_phone && (
                                        <div className="text-xs text-muted-foreground">
                                          {unit.metadata.contact_phone}
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <span className="text-sm text-muted-foreground">None</span>
                                  )}
                                </TableCell>
                              )}
                              <TableCell>
                                <span className="text-sm">
                                  {unit.parent_name || (type.key === 'department' && unit.is_multi_branch ? 'Organization' : 'None')}
                                </span>
                              </TableCell>
                              <TableCell>
                                <Badge variant="secondary">{unit.user_count || 0}</Badge>
                              </TableCell>
                              <TableCell>
                                {unit.is_active ? (
                                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                    Active
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                                    Inactive
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                <span className="text-sm text-muted-foreground">
                                  {formatDate(unit.created_at)}
                                </span>
                              </TableCell>
                              {isAdmin && (
                                <TableCell className="text-right">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                        <MoreVertical className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem onClick={() => {
                                        setEditingUnit(unit);
                                        setShowCreateDialog(true);
                                      }}>
                                        <Edit className="mr-2 h-4 w-4" />
                                        Edit
                                      </DropdownMenuItem>
                                      {unit.user_count === 0 && (
                                        <DropdownMenuItem
                                          onClick={() => handleDelete(unit)}
                                          className="text-destructive focus:text-destructive"
                                        >
                                          <Trash2 className="mr-2 h-4 w-4" />
                                          Delete
                                        </DropdownMenuItem>
                                      )}
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </TableCell>
                              )}
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </div>

      {/* Create/Edit Dialog */}
      {isAdmin && (
        <OrgUnitDialog
          unit={editingUnit}
          open={showCreateDialog}
          onOpenChange={(open) => {
            setShowCreateDialog(open);
            if (!open) setEditingUnit(null);
          }}
        />
      )}
    </DashboardLayout>
  );
}
