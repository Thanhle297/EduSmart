import { canSubstitute, teachingLoad } from '../mocks/selectors'
import type { DemoState, Substitution } from '../mocks/types'
import { addDays } from './utils'
import {
  substitutionAiResultSchema,
  type SubstitutionAiInput,
} from './substitution-ai-contract'

export function buildSubstitutionAiInput(
  state: DemoState,
  request: Substitution,
  preferences: string,
): SubstitutionAiInput {
  const day = (new Date(`${request.date}T12:00:00Z`).getUTCDay() + 6) % 7
  const weekStart = addDays(request.date, -day)
  const weekEnd = addDays(weekStart, 6)
  const homeroom = state.classes.find((cls) => cls.id === request.classId)?.homeroomTeacher

  return {
    // Names, the absence reason and the original Excel text stay in the browser.
    request: {
      id: request.id,
      subject: request.subject,
      classId: request.classId,
      date: request.date,
      period: request.period,
    },
    preferences: preferences.trim(),
    candidates: state.teachers
      .filter((teacher) => canSubstitute(state, teacher, request.id))
      .map((teacher) => {
        const assigned = state.substitutions.filter((row) =>
          row.id !== request.id && row.replacementId === teacher.id,
        )
        return {
          teacherId: teacher.id,
          plannedPeriods: teachingLoad(state, teacher.id),
          allowance: teacher.allowance,
          quota: teacher.quota,
          substitutePeriodsThisWeek: assigned.filter((row) =>
            row.date >= weekStart && row.date <= weekEnd,
          ).length,
          periodsOnDay: state.timetable.filter((row) =>
            row.teacherId === teacher.id && row.day === day &&
            (!row.effectiveFrom || row.effectiveFrom <= request.date),
          ).length + assigned.filter((row) => row.date === request.date).length,
          teachesClass: state.assignments.some((row) =>
            row.teacherId === teacher.id && row.classIds.includes(request.classId) &&
            row.startDate <= request.date && row.endDate >= request.date,
          ),
          isHomeroomTeacher: homeroom === teacher.name,
        }
      }),
  }
}

export async function suggestSubstitutes(input: SubstitutionAiInput, signal: AbortSignal) {
  const response = await fetch('/api/ai/substitutions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
    signal,
  })
  const payload: unknown = await response.json().catch(() => null)
  if (!response.ok) {
    const message = payload && typeof payload === 'object' && 'error' in payload &&
      typeof payload.error === 'string' ? payload.error : 'Không thể nhận gợi ý AI. Vui lòng thử lại.'
    throw new Error(message)
  }
  const result = substitutionAiResultSchema.safeParse(payload)
  if (!result.success) throw new Error('Phản hồi AI không hợp lệ. Vui lòng phân tích lại.')
  const allowed = new Set(input.candidates.map((candidate) => candidate.teacherId))
  const ids = result.data.recommendations.map((row) => row.teacherId)
  if (new Set(ids).size !== ids.length || ids.some((id) => !allowed.has(id))) {
    throw new Error('Gợi ý AI không khớp danh sách giáo viên khả dụng. Vui lòng phân tích lại.')
  }
  return result.data
}
