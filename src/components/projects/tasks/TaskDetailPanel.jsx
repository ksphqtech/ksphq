import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  X,
  Edit2,
  Calendar,
  Clock,
  User,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Plus,
  Trash2,
  MessageSquare,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { useUpdateTask, useTask } from '@/hooks/useTasks';
import { toast } from 'sonner';

/**
 * Get initials from name
 */
function getInitials(name) {
  if (!name) return '?';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Status badge variants
 */
const statusVariants = {
  pending: 'bg-gray-100 text-gray-800 border-gray-300',
  in_progress: 'bg-blue-100 text-blue-800 border-blue-300',
  blocked: 'bg-red-100 text-red-800 border-red-300',
  completed: 'bg-green-100 text-green-800 border-green-300',
};

/**
 * Priority badge variants
 */
const priorityVariants = {
  low: 'bg-slate-100 text-slate-700 border-slate-300',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  high: 'bg-orange-100 text-orange-800 border-orange-300',
  urgent: 'bg-red-100 text-red-800 border-red-300',
};

/**
 * EditableSection Component
 * Reusable section with inline edit capability
 */
function EditableSection({ title, isEditing, onEdit, onSave, onCancel, children, editContent }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-sm">{title}</h4>
        {!isEditing ? (
          <Button variant="ghost" size="sm" onClick={onEdit}>
            <Edit2 className="h-3 w-3" />
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={onCancel}>
              Cancel
            </Button>
            <Button size="sm" onClick={onSave}>
              Save
            </Button>
          </div>
        )}
      </div>
      {isEditing ? editContent : children}
    </div>
  );
}

/**
 * TaskDetailPanel Component
 * Right sidebar showing detailed task information
 * Includes sections for basic info, description, dependencies, checklist, and comments
 *
 * @param {string} taskId - Selected task ID
 * @param {function} onClose - Callback to close panel
 * @param {string} className - Additional CSS classes
 */
export function TaskDetailPanel({ taskId, onClose, className }) {
  const { data: taskData, isLoading } = useTask(taskId);
  const task = taskData?.task;
  const updateTask = useUpdateTask();

  const [editingSection, setEditingSection] = useState(null);
  const [editValues, setEditValues] = useState({});
  const [expandedSections, setExpandedSections] = useState({
    basic: true,
    description: true,
    dependencies: false,
    checklist: true,
    comments: false,
  });

  if (isLoading) {
    return (
      <Card className={cn('h-full', className)}>
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!task) {
    return (
      <Card className={cn('h-full', className)}>
        <CardContent className="p-8">
          <div className="flex flex-col items-center justify-center text-center space-y-2">
            <AlertCircle className="h-12 w-12 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Task not found</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleEdit = (section, initialValues = {}) => {
    setEditingSection(section);
    setEditValues(initialValues);
  };

  const handleCancel = () => {
    setEditingSection(null);
    setEditValues({});
  };

  const handleSave = async (section, data) => {
    try {
      await updateTask.mutateAsync({ taskId: task.id, updates: data });
      setEditingSection(null);
      setEditValues({});
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const calculateProgress = () => {
    if (!task.checklist || task.checklist.length === 0) return 0;
    const completed = task.checklist.filter((item) => item.completed).length;
    return Math.round((completed / task.checklist.length) * 100);
  };

  return (
    <Card className={cn('h-full flex flex-col', className)}>
      <CardHeader className="flex-row items-start justify-between space-y-0 pb-4">
        <div className="space-y-1 flex-1">
          <CardTitle className="text-xl">{task.title}</CardTitle>
          <div className="flex items-center gap-2">
            <Badge className={cn('text-xs', statusVariants[task.status])}>
              {task.status.replace('_', ' ')}
            </Badge>
            <Badge className={cn('text-xs', priorityVariants[task.priority])}>
              {task.priority}
            </Badge>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto space-y-4">
        {/* Basic Info Section */}
        <Collapsible
          open={expandedSections.basic}
          onOpenChange={() => toggleSection('basic')}
        >
          <CollapsibleTrigger className="flex items-center gap-2 w-full">
            {expandedSections.basic ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
            <h3 className="font-semibold">Basic Information</h3>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-4 space-y-4">
            {/* Assigned User */}
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Assigned to:</span>
              {task.assigned_user ? (
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={task.assigned_user.avatar_url} />
                    <AvatarFallback className="text-xs">
                      {getInitials(task.assigned_user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm">{task.assigned_user.name}</span>
                </div>
              ) : (
                <span className="text-sm text-muted-foreground">Unassigned</span>
              )}
            </div>

            {/* Dates */}
            {task.start_date && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Start:</span>
                <span className="text-sm">{format(parseISO(task.start_date), 'MMM d, yyyy')}</span>
              </div>
            )}

            {task.due_date && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Due:</span>
                <span className="text-sm">{format(parseISO(task.due_date), 'MMM d, yyyy')}</span>
              </div>
            )}

            {/* Estimated Hours */}
            {task.estimated_hours && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Estimated:</span>
                <span className="text-sm">{task.estimated_hours} hours</span>
              </div>
            )}

            {/* Progress */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Progress</span>
                <span className="text-muted-foreground">{calculateProgress()}%</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 transition-all"
                  style={{ width: `${calculateProgress()}%` }}
                />
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        <Separator />

        {/* Description Section */}
        <Collapsible
          open={expandedSections.description}
          onOpenChange={() => toggleSection('description')}
        >
          <CollapsibleTrigger className="flex items-center gap-2 w-full">
            {expandedSections.description ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
            <h3 className="font-semibold">Description</h3>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-4">
            <EditableSection
              title=""
              isEditing={editingSection === 'description'}
              onEdit={() => handleEdit('description', { description: task.description || '' })}
              onSave={() => handleSave('description', { description: editValues.description })}
              onCancel={handleCancel}
              editContent={
                <Textarea
                  value={editValues.description || ''}
                  onChange={(e) => setEditValues({ ...editValues, description: e.target.value })}
                  rows={6}
                  placeholder="Enter task description..."
                />
              }
            >
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {task.description || 'No description provided.'}
              </p>
            </EditableSection>
          </CollapsibleContent>
        </Collapsible>

        <Separator />

        {/* Dependencies Section */}
        <Collapsible
          open={expandedSections.dependencies}
          onOpenChange={() => toggleSection('dependencies')}
        >
          <CollapsibleTrigger className="flex items-center gap-2 w-full">
            {expandedSections.dependencies ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
            <h3 className="font-semibold">Dependencies</h3>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-4 space-y-3">
            {task.dependencies && task.dependencies.length > 0 ? (
              <div className="space-y-2">
                {task.dependencies.map((dep) => (
                  <div
                    key={dep.id}
                    className="flex items-center justify-between p-2 bg-muted rounded text-sm"
                  >
                    <span>{dep.title}</span>
                    <Badge variant="outline" className="text-xs">
                      {dep.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No dependencies</p>
            )}
            <Button variant="outline" size="sm" className="w-full">
              <Plus className="h-3 w-3 mr-1" />
              Add Dependency
            </Button>
          </CollapsibleContent>
        </Collapsible>

        <Separator />

        {/* Checklist Section */}
        <Collapsible
          open={expandedSections.checklist}
          onOpenChange={() => toggleSection('checklist')}
        >
          <CollapsibleTrigger className="flex items-center gap-2 w-full">
            {expandedSections.checklist ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
            <h3 className="font-semibold">Checklist</h3>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-4 space-y-3">
            {task.checklist && task.checklist.length > 0 ? (
              <div className="space-y-2">
                {task.checklist.map((item) => (
                  <div key={item.id} className="flex items-center gap-2">
                    <Checkbox checked={item.completed} />
                    <span
                      className={cn(
                        'text-sm flex-1',
                        item.completed && 'line-through text-muted-foreground'
                      )}
                    >
                      {item.title}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No checklist items</p>
            )}
            <Button variant="outline" size="sm" className="w-full">
              <Plus className="h-3 w-3 mr-1" />
              Add Item
            </Button>
          </CollapsibleContent>
        </Collapsible>

        <Separator />

        {/* Comments Section */}
        <Collapsible
          open={expandedSections.comments}
          onOpenChange={() => toggleSection('comments')}
        >
          <CollapsibleTrigger className="flex items-center gap-2 w-full">
            {expandedSections.comments ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
            <h3 className="font-semibold">Comments</h3>
            {task.comments && task.comments.length > 0 && (
              <Badge variant="outline" className="ml-2">
                {task.comments.length}
              </Badge>
            )}
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-4 space-y-3">
            {task.comments && task.comments.length > 0 ? (
              <div className="space-y-3">
                {task.comments.map((comment) => (
                  <div key={comment.id} className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs">
                          {getInitials(comment.user?.name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium">{comment.user?.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {format(parseISO(comment.created_at), 'MMM d, yyyy HH:mm')}
                      </span>
                    </div>
                    <p className="text-sm ml-8">{comment.content}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No comments yet</p>
            )}
            <div className="space-y-2">
              <Textarea placeholder="Add a comment..." rows={3} />
              <Button size="sm" className="w-full">
                <MessageSquare className="h-3 w-3 mr-1" />
                Post Comment
              </Button>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}
