import { useState } from 'react'
import { ToolLayout } from '@/components/layout/ToolLayout'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { useToolNavigation } from '@/hooks/useNavigation'
import { useProjects } from '@/hooks/useProjects'
import { ProjectStatsCards } from '@/components/projects/ProjectStatsCards'
import { ProjectFilters } from '@/components/projects/ProjectFilters'
import { ProjectListView } from '@/components/projects/ProjectListView'
import { CreateProjectDialog } from '@/components/projects/dialogs/CreateProjectDialog'
import { ErrorAlert } from '@/components/ui/error-alert'

export function ProjectControl() {
  const toolConfig = useToolNavigation('projects')
  const [filters, setFilters] = useState({})
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  // Fetch projects using the hook
  const { data, isLoading, error } = useProjects(filters)
  const projects = Array.isArray(data?.projects) ? data.projects : []

  // Filter projects based on local filters (search, status, priority)
  const filteredProjects = projects.filter(project => {
    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      const matchesSearch =
        project.name?.toLowerCase().includes(searchLower) ||
        project.project_manager_name?.toLowerCase().includes(searchLower)
      if (!matchesSearch) return false
    }

    // Status filter
    if (filters.status && project.status !== filters.status) {
      return false
    }

    // Priority filter
    if (filters.priority && project.priority !== filters.priority) {
      return false
    }

    return true
  })

  return (
    <ToolLayout
      navItems={toolConfig.subPages}
      toolName="Project Control"
    >
      <div className="p-4 md:p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Project Control</h1>
            <p className="text-muted-foreground mt-1">
              Manage and track all your projects in one place
            </p>
          </div>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </Button>
        </div>

        {/* Error Display */}
        {error && (
          <ErrorAlert
            error={error}
            title="Failed to Load Projects"
            showRetry={true}
            onRetry={() => window.location.reload()}
          />
        )}

        {/* Stats Cards */}
        {!error && (
          <ProjectStatsCards
            projects={filteredProjects}
            isLoading={isLoading}
          />
        )}

        {/* Filters */}
        {!error && (
          <ProjectFilters
            filters={filters}
            onFiltersChange={setFilters}
          />
        )}

        {/* Project List */}
        {!error && (
          <ProjectListView
            projects={filteredProjects}
            isLoading={isLoading}
          />
        )}

        {/* Create Project Dialog */}
        <CreateProjectDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
        />
      </div>
    </ToolLayout>
  )
}
