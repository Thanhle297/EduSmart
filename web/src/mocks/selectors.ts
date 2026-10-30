import { intervalsOverlap } from '../lib/utils'
import { timetablePeriodTimes } from './timetable-data'
import type { Assignment, DemoState, Duty, Teacher } from './types'
import {
  boardingDutyIntervals,
  boardingMealSummary,
  boardingPersonKey,
  getBoardingDuties,
} from './boarding'

export const getTeacher = (state: DemoState, id: string) =>
  state.teachers.find((teacher) => teacher.id === id)
export const teachingLoad = (state: DemoState, teacherId: string, excludeId?: string) =>
  state.assignments
    .filter((a) => a.teacherId === teacherId && a.id !== excludeId)
    .reduce((sum, a) => sum + a.periods * a.classIds.length, 0)
export const assignedPeriods = (assignment: Assignment) =>
  assignment.periods * assignment.classIds.length
export const assignedDutyPeriods = (assignment: Assignment) =>
  (assignment.additionalDuties ?? []).reduce((sum, duty) => sum + duty.periods, 0)
export const dutyLoad = (state: DemoState, teacherId: string, excludeId?: string) =>
  (getTeacher(state, teacherId)?.allowance ?? 0) +
  state.assignments
    .filter((assignment) => assignment.teacherId === teacherId && assignment.id !== excludeId)
    .reduce((sum, assignment) => sum + assignedDutyPeriods(assignment), 0)
export const mealTotals = boardingMealSummary
export const confirmationTotal = (state: DemoState, teacherId?: string) => {
  const unique = new Map(
    state.confirmations
      .filter((row) => !teacherId || row.teacherId === teacherId)
      .map((row) => [`${row.sourceId}-${row.teacherId}`, row]),
  )
  return [...unique.values()].reduce((sum, row) => sum + row.periods, 0)
}
export const dutyConflict = (state: DemoState, duty: Duty) =>
  getBoardingDuties(state, duty.date).some(
    (row) =>
      row.id !== duty.id &&
      boardingPersonKey(state, row.teacherId) === boardingPersonKey(state, duty.teacherId) &&
      row.date === duty.date &&
      !(row.groupId && row.groupId === duty.groupId && row.kind === duty.kind) &&
      boardingDutyIntervals(state, row).some((left) =>
        boardingDutyIntervals(state, duty).some((right) =>
          intervalsOverlap(left.start, left.end, right.start, right.end),
        ),
      ),
  )
export function boardingTeachingConflict(state: DemoState, duty: Duty) {
  const personId = boardingPersonKey(state, duty.teacherId)
  const day = (new Date(`${duty.date}T12:00:00Z`).getUTCDay() + 6) % 7
  const overlapsPeriod = (period: number) => {
    const time = timetablePeriodTimes[period - 1]
    if (!time) return true
    const [start, end] = time.split(' – ')
    return boardingDutyIntervals(state, duty).some((slot) =>
      intervalsOverlap(start, end, slot.start, slot.end),
    )
  }
  return (
    state.timetable.some(
      (row) =>
        row.teacherId === personId &&
        row.day === day &&
        (!row.effectiveFrom || row.effectiveFrom <= duty.date) &&
        overlapsPeriod(row.period),
    ) ||
    state.substitutions.some(
      (row) =>
        row.date === duty.date &&
        (row.replacementId === personId || row.absentId === personId) &&
        overlapsPeriod(row.period),
    )
  )
}
export function canCoverDuty(state: DemoState, teacher: Teacher, duty: Duty) {
  if (
    !duty.start ||
    !duty.end ||
    teacher.id === boardingPersonKey(state, duty.teacherId) ||
    dutyConflict(state, { ...duty, teacherId: teacher.id }) ||
    getBoardingDuties(state, duty.date).some(
      (row) =>
        row.id !== duty.id &&
        row.groupId === duty.groupId &&
        boardingPersonKey(state, row.teacherId) === teacher.id,
    )
  )
    return false
  return !boardingTeachingConflict(state, { ...duty, teacherId: teacher.id })
}
export const assignmentConflicts = (state: DemoState, assignment: Assignment) =>
  state.assignments.filter(
    (row) =>
      row.id !== assignment.id &&
      row.subject === assignment.subject &&
      row.classIds.some((id) => assignment.classIds.includes(id)) &&
      row.startDate <= assignment.endDate &&
      row.endDate >= assignment.startDate,
  )
export function canSubstitute(state: DemoState, teacher: Teacher, substitutionId: string) {
  const request = state.substitutions.find((row) => row.id === substitutionId)
  if (
    !request ||
    teacher.id === request.absentId ||
    !(teacher.subjects ?? [teacher.subject]).includes(request.subject)
  )
    return false
  const day = (new Date(`${request.date}T12:00:00Z`).getUTCDay() + 6) % 7
  return (
    !getBoardingDuties(state, request.date).some((duty) => {
      if (boardingPersonKey(state, duty.teacherId) !== teacher.id) return false
      const time = timetablePeriodTimes[request.period - 1]
      if (!time) return true
      const [start, end] = time.split(' – ')
      return boardingDutyIntervals(state, duty).some((slot) =>
        intervalsOverlap(start, end, slot.start, slot.end),
      )
    }) &&
    !state.timetable.some(
      (row) =>
        row.teacherId === teacher.id &&
        row.day === day &&
        row.period === request.period &&
        (!row.effectiveFrom || row.effectiveFrom <= request.date),
    ) &&
    !state.substitutions.some(
      (row) =>
        row.id !== request.id &&
        row.date === request.date &&
        row.period === request.period &&
        (row.replacementId === teacher.id || row.absentId === teacher.id),
    )
  )
}
