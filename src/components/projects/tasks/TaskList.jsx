import { useState, useMemo } from 'react';
import { TaskCard } from './TaskCard';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

/**
 * Build task tree from flat array
 * Organizes tasks into a hierarchical structure based on parent_task_id
 *
 * @param {Array} tasks - Flat array of tasks
 * @returns {Array} Tree structure of tasks
 */
function buildTaskTree(tasks) {
  if (!tasks || tasks.length === 0) return [];

  // Create a map of task id to task object
  const taskMap = new Map();
  tasks.forEach((task) => {
    taskMap.set(task.id, { ...task, subtasks: [] });
  });

  // Build tree structure
  const rootTasks = [];
  taskMap.forEach((task) => {
    if (task.parent_task_id) {
      const parent = taskMap.get(task.parent_task_id);
      if (parent) {
        parent.subtasks.push(task);
      } else {
        // Parent not found, treat as root task
        rootTasks.push(task);
      }
    } else {
      rootTasks.push(task);
    }
  });

  // Sort tasks by created date (newest first)
  const sortTasks = (taskArray) => {
    taskArray.sort((a, b) => {
      // Sort by priority first (urgent > high > medium > low)
      const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;

      // Then by created date (newest first)
      return new Date(b.created_at) - new Date(a.created_at);
    });

    taskArray.forEach((task) => {
      if (task.subtasks.length > 0) {
        sortTasks(task.subtasks);
      }
    });
  };

  sortTasks(rootTasks);
  return rootTasks;
}

/**
 * Render task tree recursively
 */
function renderTaskTree(tasks, selectedTaskId, onTaskClick, expandedTasks, onToggleExpand, level = 0) {
  return tasks.map((task) => (
    <TaskCard
      key={task.id}
      task={task}
      isSelected={selectedTaskId === task.id}
      onClick={onTaskClick}
      isExpanded={expandedTasks.has(task.id)}
      onToggleExpand={onToggleExpand}
      level={level}
    >
      {task.subtasks.length > 0 &&
        renderTaskTree(
          task.subtasks,
          selectedTaskId,
          onTaskClick,
          expandedTasks,
          onToggleExpand,
          level + 1
        )}
    </TaskCard>
  ));
}

/**
 * TaskList Component
 * Displays tasks in a tree structure with support for nested subtasks
 * Includes expand/collapse functionality and task selection
 *
 * @param {Array} tasks - Array of tasks to display
 * @param {string} selectedTaskId - ID of currently selected task
 * @param {function} onTaskSelect - Callback when task is selected
 * @param {boolean} loading - Loading state
 */
export function TaskList({ tasks, selectedTaskId, onTaskSelect, loading }) {
  const [expandedTasks, setExpandedTasks] = useState(new Set());

  // Build task tree from flat array
  const taskTree = useMemo(() => buildTaskTree(tasks), [tasks]);

  const handleToggleExpand = (taskId) => {
    setExpandedTasks((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!tasks || tasks.length === 0) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex flex-col items-center justify-center text-center space-y-2">
            <AlertCircle className="h-12 w-12 text-muted-foreground" />
            <h3 className="font-semibold text-lg">No tasks yet</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              Get started by creating your first task for this project.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {renderTaskTree(taskTree, selectedTaskId, onTaskSelect, expandedTasks, handleToggleExpand)}
    </div>
  );
}
