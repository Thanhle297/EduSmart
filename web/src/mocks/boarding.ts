import { addDays } from '../lib/utils'
import { boardingVersions } from './boarding-assignment-data'
import {
  diningEffectiveFrom,
  diningExceptions,
  diningSchedule,
  mealShifts,
} from './boarding-dining-data'
import type { BoardingVersion, DemoState, Duty, MealRecord, Tone } from './types'

export const boardingKindLabel: Record<Duty['kind'], string> = {
  meal: 'Trông ăn',
  rest: 'Trông ngủ',
  floor: 'Quản lý tầng',
  medical: 'Trực y tế',
  support: 'Hỗ trợ phòng',
}
export const boardingWeekday = (date: string) => new Date(`${date}T12:00:00Z`).getUTCDay() + 1
export const boardingWeekStart = (date: string) => addDays(date, -((boardingWeekday(date) + 5) % 7))
export const boardingVersion = (date: string) =>
  [...boardingVersions].reverse().find((row) => row.effectiveFrom <= date)
export const boardingClassPresent = (version: BoardingVersion, classId: string, date: string) => {
  const day = boardingWeekday(date)
  return (
    day >= 2 &&
    day <= 6 &&
    Boolean(version.classes.find((row) => row.classId === classId && !row.daysOff.includes(day)))
  )
}

export function boardingPerson(state: DemoState, id: string) {
  const person = state.boardingPeople.find((row) => row.id === id)
  const teacher = state.teachers.find((row) => row.id === (person?.teacherId ?? id))
  return {
    id,
    name: person?.name ?? teacher?.name ?? 'Chưa phân công',
    fullName: teacher?.name,
    teacherId: teacher?.id,
    department:
      teacher?.department ??
      (person?.role === 'staff' ? 'Nhân sự bán trú' : 'Chưa liên kết lịch dạy'),
    subject: teacher?.subject ?? 'Nhân sự bán trú',
    color: (teacher?.color ?? 'teal') as Tone,
    role: person?.role ?? 'teacher',
  }
}
export const boardingPersonKey = (state: DemoState, id: string) =>
  boardingPerson(state, id).teacherId ?? id
export const boardingGroupsForDate = (state: DemoState, date: string) => [
  ...(boardingVersion(date)?.groups ?? []),
  ...state.boardingExtraGroups.filter((row) => row.date === date),
]
export function diningPosition(date: string, classId: string) {
  if (date < diningEffectiveFrom) return undefined
  const day = boardingWeekday(date)
  const exception = diningExceptions.find((row) => row.day === day && row.classId === classId)
  if (exception) return { shift: exception.shift, area: exception.area, aisle: null }
  for (const [shift, aisles] of Object.entries(diningSchedule[day] ?? {})) {
    const index = aisles.findIndex((row) => row.split('+').includes(classId))
    if (index >= 0)
      return {
        shift: Number(shift) as 1 | 2 | 3,
        area: `Nhà ăn · Dãy ${index + 1}`,
        aisle: index + 1,
      }
  }
  return undefined
}

export function createBoardingDuties(date: string): Duty[] {
  const version = boardingVersion(date)
  const day = boardingWeekday(date)
  if (!version || day < 2 || day > 6) return []
  const duties: Duty[] = []
  for (const cls of version.classes.filter((row) =>
    boardingClassPresent(version, row.classId, date),
  )) {
    const position = diningPosition(date, cls.classId)
    const groupId = position ? `meal-${position.shift}-${position.area}` : `meal-${cls.classId}`
    const shared = duties.find(
      (row) => row.kind === 'meal' && row.groupId === groupId && row.teacherId === cls.personId,
    )
    if (shared) {
      shared.classIds!.push(cls.classId)
      continue
    }
    const times = position ? mealShifts[position.shift] : undefined
    duties.push({
      id: `bt-${version.id}-${date}-${groupId}-${cls.personId}`,
      teacherId: cls.personId,
      originalTeacherId: cls.personId,
      date,
      kind: 'meal',
      versionId: version.id,
      groupId,
      classIds: [cls.classId],
      area: position?.area ?? 'Chưa có vị trí ăn trong nguồn lịch sử',
      shift: position?.shift,
      start: times?.start ?? '',
      end: times?.end ?? '',
      confirmed: false,
    })
  }
  for (const group of version.groups) {
    for (const personId of group.personIds)
      duties.push({
        id: `bt-${version.id}-${date}-${group.id}-${personId}`,
        teacherId: personId,
        originalTeacherId: personId,
        date,
        kind: 'rest',
        versionId: version.id,
        groupId: group.id,
        roomId: group.roomId,
        classIds: group.members.map((row) => row.classId),
        area: group.room,
        start: '12:10',
        end: '13:25',
        confirmed: false,
        note: group.note,
      })
  }
  for (const service of version.services)
    duties.push({
      id: `bt-${version.id}-${date}-${service.id}`,
      teacherId: service.personId,
      originalTeacherId: service.personId,
      date,
      kind: service.kind,
      versionId: version.id,
      groupId: service.id,
      area: service.area,
      start: '12:10',
      end: '13:25',
      confirmed: false,
      note: service.note,
    })
  return duties
}

export function getBoardingDuties(state: DemoState, date = state.boardingDate) {
  const rows = new Map(createBoardingDuties(date).map((row) => [row.id, row]))
  const version = boardingVersion(date)
  for (const support of state.boardingSupports.filter((row) => row.date === date)) {
    const group = boardingGroupsForDate(state, date).find((row) => row.id === support.toGroupId)
    if (!group) continue
    rows.set(support.id, {
      id: support.id,
      date,
      teacherId: support.personId,
      kind: 'support',
      groupId: group.id,
      roomId: group.roomId,
      area: group.room,
      start: support.start,
      end: support.end,
      confirmed: false,
      note: support.note,
      originDutyId: support.dutyId,
      versionId: version?.id,
    })
  }
  for (const row of state.duties.filter((duty) => duty.date === date)) rows.set(row.id, row)
  return [...rows.values()]
}

// A support interval replaces that part of the person's original duty, rather than double-counting it.
export function boardingDutyIntervals(state: DemoState, duty: Duty) {
  if (!duty.start || !duty.end) return []
  let intervals = [{ start: duty.start, end: duty.end }]
  for (const support of state.boardingSupports.filter(
    (row) => row.date === duty.date && row.dutyId === duty.id && row.personId === duty.teacherId,
  )) {
    intervals = intervals.flatMap((slot) => {
      if (support.end <= slot.start || support.start >= slot.end) return [slot]
      return [
        ...(slot.start < support.start ? [{ start: slot.start, end: support.start }] : []),
        ...(support.end < slot.end ? [{ start: support.end, end: slot.end }] : []),
      ]
    })
  }
  return intervals
}
export const boardingDutyMinutes = (state: DemoState, duty: Duty) => {
  const minutes = (time: string) => Number(time.slice(0, 2)) * 60 + Number(time.slice(3))
  return boardingDutyIntervals(state, duty).reduce(
    (sum, slot) => sum + minutes(slot.end) - minutes(slot.start),
    0,
  )
}

export function getBoardingGroups(state: DemoState, date = state.boardingDate) {
  const version = boardingVersion(date)
  if (!version || boardingWeekday(date) < 2 || boardingWeekday(date) > 6) return []
  return boardingGroupsForDate(state, date).map((group) => {
    const members = new Map(
      group.members.map((row) => [
        row.classId,
        boardingClassPresent(version, row.classId, date) ? row.count : 0,
      ]),
    )
    let incoming = 0
    let outgoing = 0
    let absent = 0
    for (const row of state.boardingAbsences.filter(
      (row) => row.date === date && row.groupId === group.id,
    )) {
      members.set(row.classId, (members.get(row.classId) ?? 0) - row.count)
      absent += row.count
    }
    for (const move of state.boardingTransfers.filter((row) => row.date === date)) {
      if (move.fromGroupId === group.id) {
        members.set(move.classId, (members.get(move.classId) ?? 0) - move.count)
        outgoing += move.count
      }
      if (move.toGroupId === group.id) {
        members.set(move.classId, (members.get(move.classId) ?? 0) + move.count)
        incoming += move.count
      }
    }
    return {
      ...group,
      baseCount: group.members.reduce((sum, row) => sum + row.count, 0),
      expectedCount: group.members.reduce(
        (sum, row) => sum + (boardingClassPresent(version, row.classId, date) ? row.count : 0),
        0,
      ),
      count: [...members.values()].reduce((sum, count) => sum + count, 0),
      incoming,
      outgoing,
      absent,
      actualMembers: [...members].map(([classId, count]) => ({ classId, count })),
    }
  })
}

export function createBoardingMeals(date: string): MealRecord[] {
  const version = boardingVersion(date)
  return (
    version?.classes.map((row) => {
      const expected = boardingClassPresent(version, row.classId, date) ? row.boys + row.girls : 0
      return {
        id: `meal-${date}-${row.classId}`,
        date,
        classId: row.classId,
        registered: row.boys + row.girls,
        expected,
        received: 0,
        actualRecorded: false,
        reason: expected ? 'Chưa ghi nhận bàn giao' : 'Lớp nghỉ theo lịch học',
        resolved: expected === 0,
        refundEligible: 0,
      }
    }) ?? []
  )
}
export function getBoardingMeals(state: DemoState, date = state.boardingDate) {
  const recorded = new Map(
    state.meals
      .filter((row) => (row.date ?? state.boardingDate) === date)
      .map((row) => [row.classId, row]),
  )
  return createBoardingMeals(date).map((row) => {
    const absent = state.boardingAbsences
      .filter((absence) => absence.date === date && absence.classId === row.classId)
      .reduce((sum, absence) => sum + absence.count, 0)
    const expected = Math.max(0, row.expected - absent)
    const actual = recorded.get(row.classId)
    return {
      ...row,
      ...actual,
      registered: row.registered,
      expected,
      resolved: actual?.actualRecorded
        ? actual.resolved && actual.expected === expected
        : expected === 0,
      reason: actual?.actualRecorded
        ? actual.reason
        : expected === 0 && absent
          ? 'Học sinh đã báo nghỉ trong ngày'
          : row.reason,
    }
  })
}
export function boardingMealSummary(state: DemoState, date = state.boardingDate) {
  return getBoardingMeals(state, date).reduce(
    (sum, row) => {
      const recorded = row.actualRecorded ?? true
      return {
        registered: sum.registered + row.registered,
        expected: sum.expected + row.expected,
        received: sum.received + (recorded ? row.received : 0),
        refund: sum.refund + row.refundEligible * 35000,
        difference: sum.difference + (recorded ? row.received - row.expected : 0),
        recorded: sum.recorded + Number(recorded),
        pending: sum.pending + Number(!recorded && row.expected > 0),
        activeClasses: sum.activeClasses + Number(row.expected > 0),
      }
    },
    {
      registered: 0,
      expected: 0,
      received: 0,
      refund: 0,
      difference: 0,
      recorded: 0,
      pending: 0,
      activeClasses: 0,
    },
  )
}
export function boardingWeeklyMeals(state: DemoState) {
  return Array.from({ length: 5 }, (_, i) => {
    const date = addDays(boardingWeekStart(state.boardingDate), i)
    const totals = boardingMealSummary(state, date)
    return {
      name: ['Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu'][i],
      date,
      registered: totals.registered,
      expected: totals.expected,
      received: totals.recorded && !totals.pending ? totals.received : null,
    }
  })
}
