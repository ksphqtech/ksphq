import { ToolLayout } from '@/components/layout/ToolLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { filteredDocks } from '@/data/mockData'
import { useToolNavigation } from '@/hooks/useNavigation'
import { useBranchFilteredData } from '@/hooks/useBranchFilteredData'

export function DockControl() {
  const toolConfig = useToolNavigation('docks')
  const filteredDocks = useBranchFilteredData(filteredDocks)

  const getStatusVariant = (status) => {
    switch (status.toLowerCase()) {
      case 'occupied':
        return 'default'
      case 'available':
        return 'secondary'
      case 'under maintenance':
        return 'destructive'
      default:
        return 'outline'
    }
  }

  return (
    <ToolLayout
      navItems={toolConfig.subPages}
      toolName="Dock Control"
    >
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Docks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{filteredDocks.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Occupied
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {filteredDocks.filter(d => d.status === 'Occupied').length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Available
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {filteredDocks.filter(d => d.status === 'Available').length}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Dock Status Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dock</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Carrier</TableHead>
                  <TableHead>Trailer #</TableHead>
                  <TableHead>Arrival</TableHead>
                  <TableHead>Expected Departure</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDocks.map((dock) => (
                  <TableRow key={dock.id}>
                    <TableCell className="font-medium">{dock.dockNumber}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(dock.status)}>
                        {dock.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{dock.carrier}</TableCell>
                    <TableCell>{dock.trailerNumber}</TableCell>
                    <TableCell>{dock.arrivalTime}</TableCell>
                    <TableCell>{dock.expectedDeparture}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </ToolLayout>
  )
}
