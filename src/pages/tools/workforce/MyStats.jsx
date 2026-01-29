import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function MyStats() {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>My Stats</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            This page is under development and will be available soon.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
