import { canCoverDuty } from '../mocks/selectors'
import type { DemoState, Duty } from '../mocks/types'
import { addDays } from './utils'
import type { BoardingSubstitutionAiInput } from './boarding-substitution-ai-contract'
import { substitutionAiResultSchema } from './substitution-ai-contract'
import {
  boardingDutyMinutes,
  boardingPerson,
  boardingPersonKey,
  getBoardingDuties,
  getBoardingGroups,
  getBoardingMeals,
} from '../mocks/boarding'

export function buildBoardingSubstitutionAiInput(
  state: DemoState,
  duty: Duty,
  preferences: string,
): BoardingSubstitutionAiInput {
  const day = (new Date(`${duty.date}T12:00:00Z`).getUTCDay() + 6) % 7
  const weekStart = addDays(duty.date, -day)
  const weekEnd = addDays(weekStart, 6)
  const historyWindowStart = addDays(weekStart, -28)
  const weekDutiesAll = Array.from({ length: 5 }, (_, i) =>
    getBoardingDuties(state, addDays(weekStart, i)),
  ).flat()
  const pastDutiesAll = Array.from({ length: 28 }, (_, i) => addDays(historyWindowStart, i))
    .filter((date) => date < duty.date)
    .flatMap((date) => getBoardingDuties(state, date))
  const group = getBoardingGroups(state, duty.date).find((row) => row.id === duty.groupId)
  const knownPerson = Boolean(boardingPerson(state, duty.teacherId).teacherId)
  return {
    request: {
      id: duty.id,
      date: duty.date,
      kind: duty.kind === 'meal' ? 'meal' : 'rest',
      area: duty.area,
      start: duty.start,
      end: duty.end,
      classIds:
        group?.actualMembers.filter((row) => row.count > 0).map((row) => row.classId) ??
        duty.classIds ??
        [],
      students:
        group?.count ??
        getBoardingMeals(state, duty.date)
          .filter((row) => duty.classIds?.includes(row.classId))
          .reduce((sum, row) => sum + row.expected, 0),
      unlinkedPeople: state.boardingPeople.filter((row) => row.role !== 'staff' && !row.teacherId)
        .length,
      historyWindowStart,
    },
    preferences: preferences.trim(),
    candidates: state.teachers
      .filter((teacher) => knownPerson && canCoverDuty(state, teacher, duty))
      .map((teacher) => {
        const weekDuties = weekDutiesAll.filter(
          (row) => row.id !== duty.id && boardingPersonKey(state, row.teacherId) === teacher.id,
        )
        const pastDuties = pastDutiesAll.filter(
          (row) => boardingPersonKey(state, row.teacherId) === teacher.id,
        )
        const replacements = state.substitutions.filter((row) => row.replacementId === teacher.id)
        return {
          teacherId: teacher.id,
          dutiesThisWeek: weekDuties.length,
          dutyMinutesThisWeek: weekDuties.reduce(
            (sum, row) => sum + boardingDutyMinutes(state, row),
            0,
          ),
          dutiesOnDay: weekDuties.filter((row) => row.date === duty.date).length,
          sameAreaDuties: pastDuties.filter((row) => row.area === duty.area).length,
          sameKindDuties: pastDuties.filter((row) => row.kind === duty.kind).length,
          teachingPeriodsThisWeek:
            state.assignments
              .filter(
                (row) =>
                  row.teacherId === teacher.id &&
                  row.startDate <= duty.date &&
                  row.endDate >= duty.date,
              )
              .reduce((sum, row) => sum + row.periods * row.classIds.length, 0) +
            replacements.filter((row) => row.date >= weekStart && row.date <= weekEnd).length,
          teachingPeriodsOnDay:
            state.timetable.filter(
              (row) =>
                row.teacherId === teacher.id &&
                row.day === day &&
                (!row.effectiveFrom || row.effectiveFrom <= duty.date),
            ).length + replacements.filter((row) => row.date === duty.date).length,
        }
      }),
  }
}

export async function suggestBoardingSubstitutes(
  input: BoardingSubstitutionAiInput,
  signal: AbortSignal,
) {
  const response = await fetch('/api/ai/boarding-substitutions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
    signal,
  })
  const payload: unknown = await response.json().catch(() => null)
  if (!response.ok) {
    const message =
      payload &&
      typeof payload === 'object' &&
      'error' in payload &&
      typeof payload.error === 'string'
        ? payload.error
        : 'Không thể nhận gợi ý AI. Vui lòng thử lại.'
    throw new Error(message)
  }
  const result = substitutionAiResultSchema.safeParse(payload)
  if (!result.success) throw new Error('Phản hồi AI không hợp lệ. Vui lòng phân tích lại.')
  const allowed = new Set(input.candidates.map((row) => row.teacherId))
  const ids = result.data.recommendations.map((row) => row.teacherId)
  if (new Set(ids).size !== ids.length || ids.some((id) => !allowed.has(id)))
    throw new Error('Gợi ý AI không khớp danh sách giáo viên khả dụng. Vui lòng phân tích lại.')
  return result.data
}
