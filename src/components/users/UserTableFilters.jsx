/**
 * User Table Filters
 * Search and filter controls for the user table
 */

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, X, Filter } from 'lucide-react';
import { useRoles } from '@/hooks/useRoles';
import { useOrgUnits } from '@/hooks/useOrgUnits';

export function UserTableFilters({ filters, onFiltersChange }) {
  const { data: rolesData } = useRoles();
  const { data: orgUnitsData } = useOrgUnits();

  const roles = Array.isArray(rolesData?.roles) ? rolesData.roles : [];
  const units = Array.isArray(orgUnitsData?.units) ? orgUnitsData.units : [];
  const branches = units.filter(u => u.type === 'branch');
  const departments = units.filter(u => u.type === 'department');
  const teams = units.filter(u => u.type === 'team');

  const updateFilter = (key, value) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearFilter = (key) => {
    const newFilters = { ...filters };
    delete newFilters[key];
    onFiltersChange(newFilters);
  };

  const clearAllFilters = () => {
    onFiltersChange({});
  };

  const activeFilterCount = Object.keys(filters).filter(
    key => filters[key] && key !== 'page' && key !== 'limit'
  ).length;

  return (
    <div className="space-y-4">
      {/* Search and Main Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, phone, or employee ID..."
            value={filters.search || ''}
            onChange={(e) => updateFilter('search', e.target.value)}
            className="pl-9"
          />
          {filters.search && (
            <Button
              size="sm"
              variant="ghost"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
              onClick={() => clearFilter('search')}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>

        {/* Clear All Filters */}
        {activeFilterCount > 0 && (
          <Button variant="outline" onClick={clearAllFilters} className="whitespace-nowrap">
            <X className="h-4 w-4 mr-2" />
            Clear All ({activeFilterCount})
          </Button>
        )}
      </div>

      {/* Dropdown Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Role Filter */}
        <Select
          value={filters.role_id || 'all'}
          onValueChange={(value) => value === 'all' ? clearFilter('role_id') : updateFilter('role_id', value)}
        >
          <SelectTrigger>
            <div className="flex items-center gap-2">
              <Filter className="h-3 w-3" />
              <SelectValue placeholder="All Roles" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            {roles.map(role => (
              <SelectItem key={role.id} value={role.id}>
                {role.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Branch Filter */}
        <Select
          value={filters.branch_id || 'all'}
          onValueChange={(value) => value === 'all' ? clearFilter('branch_id') : updateFilter('branch_id', value)}
        >
          <SelectTrigger>
            <div className="flex items-center gap-2">
              <Filter className="h-3 w-3" />
              <SelectValue placeholder="All Branches" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Branches</SelectItem>
            {branches.map(branch => (
              <SelectItem key={branch.id} value={branch.id}>
                {branch.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Department Filter */}
        <Select
          value={filters.department_id || 'all'}
          onValueChange={(value) => value === 'all' ? clearFilter('department_id') : updateFilter('department_id', value)}
        >
          <SelectTrigger>
            <div className="flex items-center gap-2">
              <Filter className="h-3 w-3" />
              <SelectValue placeholder="All Departments" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            {departments.map(dept => (
              <SelectItem key={dept.id} value={dept.id}>
                {dept.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Team Filter */}
        <Select
          value={filters.team_id || 'all'}
          onValueChange={(value) => value === 'all' ? clearFilter('team_id') : updateFilter('team_id', value)}
        >
          <SelectTrigger>
            <div className="flex items-center gap-2">
              <Filter className="h-3 w-3" />
              <SelectValue placeholder="All Teams" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Teams</SelectItem>
            {teams.map(team => (
              <SelectItem key={team.id} value={team.id}>
                {team.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Applied Filters as Chips */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {filters.search && (
            <Badge variant="secondary" className="gap-1">
              Search: {filters.search}
              <button onClick={() => clearFilter('search')} className="ml-1">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.role_id && (
            <Badge variant="secondary" className="gap-1">
              Role: {roles.find(r => r.id === filters.role_id)?.name || 'Unknown'}
              <button onClick={() => clearFilter('role_id')} className="ml-1">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.branch_id && (
            <Badge variant="secondary" className="gap-1">
              Branch: {branches.find(b => b.id === filters.branch_id)?.name || 'Unknown'}
              <button onClick={() => clearFilter('branch_id')} className="ml-1">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.department_id && (
            <Badge variant="secondary" className="gap-1">
              Department: {departments.find(d => d.id === filters.department_id)?.name || 'Unknown'}
              <button onClick={() => clearFilter('department_id')} className="ml-1">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.team_id && (
            <Badge variant="secondary" className="gap-1">
              Team: {teams.find(t => t.id === filters.team_id)?.name || 'Unknown'}
              <button onClick={() => clearFilter('team_id')} className="ml-1">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
