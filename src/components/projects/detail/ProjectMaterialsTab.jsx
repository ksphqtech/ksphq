import { Card, CardContent } from '@/components/ui/card';

/**
 * ProjectMaterialsTab Component
 * Main container for materials management within a project
 *
 * @param {string} projectId - Project ID to fetch materials for
 */
export function ProjectMaterialsTab({ projectId }) {
  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex-1 w-full sm:w-auto">
          <h2 className="text-2xl font-bold">Materials</h2>
          <p className="text-sm text-muted-foreground">
            Track materials and resources for this project
          </p>
        </div>
      </div>

      {/* Main Content Area */}
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          Materials tracking coming soon...
        </CardContent>
      </Card>
    </div>
  );
}
