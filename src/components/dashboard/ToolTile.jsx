import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Lock } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

export function ToolTile({ title, description, icon: Icon, href, permission }) {
  const navigate = useNavigate()
  const { hasPermission, user } = useAuth()

  const canAccess = hasPermission(permission)

  const handleClick = () => {
    if (canAccess) {
      navigate(href)
    }
  }

  return (
    <Card
      className={cn(
        'transition-all hover:shadow-lg hover:border-primary',
        canAccess ? 'cursor-pointer' : 'opacity-60 cursor-not-allowed'
      )}
      onClick={handleClick}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              'flex h-12 w-12 items-center justify-center rounded-lg',
              canAccess ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            )}>
              <Icon className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-lg">{title}</CardTitle>
              {!canAccess && (
                <Badge variant="outline" className="mt-1">
                  <Lock className="h-3 w-3 mr-1" />
                  No Access
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <CardDescription>{description}</CardDescription>
      </CardContent>
    </Card>
  )
}

function cn(...inputs) {
  return inputs.filter(Boolean).join(' ')
}
