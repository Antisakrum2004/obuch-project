'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  BookOpen,
  HelpCircle,
  Users,
  FileText,
  ListChecks,
  Settings2,
  CheckCircle2,
  Clock,
  Loader2,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/auth-store';
import { apiClient } from '@/lib/api-client';
import { useJourneyStore, type Task, type Feedback } from '@/stores/journey-store';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const typeConfig: Record<
  string,
  { label: string; icon: typeof BookOpen; colorClass: string }
> = {
  LESSON: {
    label: 'Lesson',
    icon: BookOpen,
    colorClass: 'text-blue-600 dark:text-blue-400',
  },
  QUIZ: {
    label: 'Quiz',
    icon: HelpCircle,
    colorClass: 'text-purple-600 dark:text-purple-400',
  },
  MEETING: {
    label: 'Meeting',
    icon: Users,
    colorClass: 'text-emerald-600 dark:text-emerald-400',
  },
  DOCUMENT: {
    label: 'Document',
    icon: FileText,
    colorClass: 'text-amber-600 dark:text-amber-400',
  },
  CHECKLIST: {
    label: 'Checklist',
    icon: ListChecks,
    colorClass: 'text-teal-600 dark:text-teal-400',
  },
  CUSTOM: {
    label: 'Custom',
    icon: Settings2,
    colorClass: 'text-muted-foreground',
  },
};

const statusConfig: Record<
  string,
  { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive'; extraClass?: string }
> = {
  PENDING: { label: 'Pending', variant: 'secondary' },
  IN_PROGRESS: {
    label: 'In Progress',
    variant: 'default',
    extraClass: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-0',
  },
  COMPLETED: {
    label: 'Completed',
    variant: 'default',
    extraClass: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-0',
  },
  FAILED: { label: 'Failed', variant: 'destructive' },
  SKIPPED: { label: 'Skipped', variant: 'outline' },
};

interface TaskCardProps {
  task: Task;
  onComplete?: () => void;
}

export function TaskCard({ task, onComplete }: TaskCardProps) {
  const [isCompleting, setIsCompleting] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const { token } = useAuthStore();

  const typeInfo = typeConfig[task.type] ?? typeConfig.CUSTOM;
  const statusInfo = statusConfig[task.status] ?? statusConfig.PENDING;
  const TypeIcon = typeInfo.icon;
  const canComplete =
    task.status === 'PENDING' || task.status === 'IN_PROGRESS';

  const handleComplete = async () => {
    setIsCompleting(true);
    try {
      await apiClient('POST', `/api/tasks/${task.id}/complete`, undefined, token);
      toast.success('Task completed!');
      onComplete?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to complete task');
    } finally {
      setIsCompleting(false);
    }
  };

  return (
    <Card className="rounded-xl transition-all hover:shadow-md">
      <CardContent className="p-4">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full text-left"
        >
          <div className="flex items-start gap-3">
            {/* Type icon */}
            <div
              className={cn(
                'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted',
                typeInfo.colorClass
              )}
            >
              <TypeIcon className="h-4 w-4" />
            </div>

            {/* Title and meta */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h4 className="font-medium text-sm truncate">{task.title}</h4>
                <Badge
                  variant={statusInfo.variant}
                  className={cn('text-xs shrink-0', statusInfo.extraClass)}
                >
                  {statusInfo.label}
                </Badge>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-xs">
                  {typeInfo.label}
                </Badge>
                {task.dueDate && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {format(new Date(task.dueDate), 'MMM d, yyyy')}
                  </span>
                )}
              </div>
            </div>
          </div>
        </button>

        {/* Expanded details */}
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-3 pt-3 border-t space-y-3"
          >
            {task.description && (
              <p className="text-sm text-muted-foreground">
                {task.description}
              </p>
            )}

            {/* Complete button */}
            {canComplete && (
              <Button
                size="sm"
                onClick={handleComplete}
                disabled={isCompleting}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {isCompleting ? (
                  <>
                    <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                    Completing...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                    Mark Complete
                  </>
                )}
              </Button>
            )}

            {/* Feedback section */}
            {task.status === 'COMPLETED' && task.feedback && task.feedback.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Feedback
                </p>
                {task.feedback.map((fb: Feedback) => (
                  <div
                    key={fb.id}
                    className="rounded-lg bg-muted/50 p-3 text-sm"
                  >
                    <p>{fb.content}</p>
                    {fb.rating && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Rating: {'★'.repeat(fb.rating)}
                        {'☆'.repeat(5 - fb.rating)}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}
