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
import { ticketData } from '@/data/mockData'
import { useToolNavigation } from '@/hooks/useNavigation'

export function HQTickets() {
  const toolConfig = useToolNavigation('tickets')

  const getStatusVariant = (status) => {
    switch (status.toLowerCase()) {
      case 'open':
        return 'default'
      case 'in progress':
        return 'secondary'
      case 'resolved':
        return 'outline'
      default:
        return 'outline'
    }
  }

  const getPriorityVariant = (priority) => {
    switch (priority.toLowerCase()) {
      case 'critical':
        return 'destructive'
      case 'high':
        return 'destructive'
      case 'medium':
        return 'default'
      case 'low':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  return (
    <ToolLayout
      navItems={toolConfig.subPages}
      toolName="HQ Tickets"
    >
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Tickets
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{ticketData.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Open
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {ticketData.filter(t => t.status === 'Open').length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                In Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {ticketData.filter(t => t.status === 'In Progress').length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Resolved
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {ticketData.filter(t => t.status === 'Resolved').length}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Tickets</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ticket #</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted By</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ticketData.map((ticket) => (
                  <TableRow key={ticket.id}>
                    <TableCell className="font-medium">{ticket.ticketNumber}</TableCell>
                    <TableCell>{ticket.subject}</TableCell>
                    <TableCell>{ticket.category}</TableCell>
                    <TableCell>
                      <Badge variant={getPriorityVariant(ticket.priority)}>
                        {ticket.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(ticket.status)}>
                        {ticket.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{ticket.submittedBy}</TableCell>
                    <TableCell>{ticket.assignedTo}</TableCell>
                    <TableCell>{ticket.createdDate}</TableCell>
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
