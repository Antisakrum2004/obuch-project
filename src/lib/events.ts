import { EventEmitter2 } from 'eventemitter2'

export const EventType = {
  USER_CREATED: 'user.created',
  JOURNEY_CREATED: 'journey.created',
  JOURNEY_STARTED: 'journey.started',
  JOURNEY_STAGE_CHANGED: 'journey.stage_changed',
  JOURNEY_COMPLETED: 'journey.completed',
  JOURNEY_CANCELLED: 'journey.cancelled',
  JOURNEY_PAUSED: 'journey.paused',
  TASK_ASSIGNED: 'task.assigned',
  TASK_COMPLETED: 'task.completed',
  TASK_OVERDUE: 'task.overdue',
  TASK_FAILED: 'task.failed',
  MENTOR_ASSIGNED: 'mentor.assigned',
  MENTOR_SESSION_SCHEDULED: 'mentor.session_scheduled',
  FEEDBACK_GIVEN: 'feedback.given',
} as const

export type EventPayload = Record<string, unknown>

const emitter = new EventEmitter2({
  wildcard: true,
  delimiter: '.',
  maxListeners: 50,
})

export function emitEvent(type: string, payload: EventPayload): void {
  console.log(`[Event] ${type}`, payload)
  emitter.emit(type, payload)
}

export function onEvent(type: string, handler: (payload: EventPayload) => void): void {
  emitter.on(type, handler)
}

export { emitter }
