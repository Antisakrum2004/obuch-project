import { db } from './db'
import { emitEvent, EventType } from './events'

type JourneyStatus = 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELLED'
type StageStatus = 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'SKIPPED'
type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'SKIPPED'

const VALID_TRANSITIONS: Record<JourneyStatus, JourneyStatus[]> = {
  DRAFT: ['ACTIVE'],
  ACTIVE: ['PAUSED', 'COMPLETED', 'CANCELLED'],
  PAUSED: ['ACTIVE', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
}

export function canTransition(from: JourneyStatus, to: JourneyStatus): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false
}

export async function transitionJourney(
  journeyId: string,
  newStatus: JourneyStatus,
  changedBy: string
): Promise<{ success: boolean; journey?: unknown; error?: string }> {
  const journey = await db.journey.findUnique({ where: { id: journeyId } })
  if (!journey) return { success: false, error: 'Journey not found' }

  if (!canTransition(journey.status as JourneyStatus, newStatus)) {
    return { success: false, error: `Cannot transition from ${journey.status} to ${newStatus}` }
  }

  const updateData: Record<string, unknown> = { status: newStatus }
  if (newStatus === 'ACTIVE' && !journey.startedAt) updateData.startedAt = new Date()
  if (newStatus === 'COMPLETED') updateData.completedAt = new Date()

  const updated = await db.journey.update({
    where: { id: journeyId },
    data: updateData,
  })

  const eventTypeMap: Record<JourneyStatus, string> = {
    DRAFT: EventType.JOURNEY_CREATED,
    ACTIVE: EventType.JOURNEY_STARTED,
    PAUSED: EventType.JOURNEY_PAUSED,
    COMPLETED: EventType.JOURNEY_COMPLETED,
    CANCELLED: EventType.JOURNEY_CANCELLED,
  }

  const eventType = eventTypeMap[newStatus] || EventType.JOURNEY_STAGE_CHANGED

  await db.journeyEvent.create({
    data: {
      journeyId,
      type: eventType,
      payload: JSON.stringify({ from: journey.status, to: newStatus, changedBy }),
    },
  })

  emitEvent(eventType, { journeyId, from: journey.status, to: newStatus, changedBy })

  return { success: true, journey: updated }
}

export async function calculateJourneyProgress(journeyId: string): Promise<number> {
  const tasks = await db.task.findMany({
    where: { stage: { journeyId } },
  })

  if (tasks.length === 0) return 0
  const completed = tasks.filter((t) => t.status === 'COMPLETED').length
  return Math.round((completed / tasks.length) * 100)
}

export async function checkStageCompletion(stageId: string): Promise<boolean> {
  const stage = await db.stage.findUnique({
    where: { id: stageId },
    include: { tasks: true },
  })

  if (!stage) return false

  const allCompleted = stage.tasks.length > 0 && stage.tasks.every((t) => t.status === 'COMPLETED')
  if (!allCompleted) return false

  if (stage.status !== 'COMPLETED') {
    await db.stage.update({
      where: { id: stageId },
      data: { status: 'COMPLETED', completedAt: new Date() },
    })

    emitEvent(EventType.JOURNEY_STAGE_CHANGED, {
      journeyId: stage.journeyId,
      stageId,
      from: stage.status,
      to: 'COMPLETED',
    })

    await db.journeyEvent.create({
      data: {
        journeyId: stage.journeyId,
        type: EventType.JOURNEY_STAGE_CHANGED,
        payload: JSON.stringify({ stageId, from: stage.status, to: 'COMPLETED' }),
      },
    })

    // Activate next pending stage
    const nextStage = await db.stage.findFirst({
      where: { journeyId: stage.journeyId, status: 'PENDING', order: { gt: stage.order } },
      orderBy: { order: 'asc' },
    })

    if (nextStage) {
      await db.stage.update({
        where: { id: nextStage.id },
        data: { status: 'ACTIVE' },
      })

      emitEvent(EventType.JOURNEY_STAGE_CHANGED, {
        journeyId: stage.journeyId,
        stageId: nextStage.id,
        from: 'PENDING',
        to: 'ACTIVE',
      })
    }

    return true
  }

  return false
}

export async function checkJourneyCompletion(journeyId: string): Promise<boolean> {
  const stages = await db.stage.findMany({
    where: { journeyId },
  })

  const allCompleted = stages.length > 0 && stages.every((s) => s.status === 'COMPLETED' || s.status === 'SKIPPED')
  if (!allCompleted) return false

  const journey = await db.journey.findUnique({ where: { id: journeyId } })
  if (journey?.status === 'COMPLETED') return false

  await transitionJourney(journeyId, 'COMPLETED', 'system')
  return true
}

export async function completeTaskCascade(taskId: string): Promise<void> {
  const task = await db.task.findUnique({
    where: { id: taskId },
    include: { stage: true },
  })

  if (!task) return

  // Check if stage is complete
  await checkStageCompletion(task.stageId)

  // Check if journey is complete
  await checkJourneyCompletion(task.stage.journeyId)
}
