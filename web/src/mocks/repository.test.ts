// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { DEMO_DATE } from '../lib/config'
import { addDays, dateLabel, intervalsOverlap, normalize } from '../lib/utils'
import { createInitialState } from './fixtures'
import { applyCommand } from './repository'
import { assignmentConflicts, canSubstitute, confirmationTotal, mealTotals } from './selectors'

describe('shared demo data', () => {
  it('derives consistent meal totals and does not refund delivery shortages', () => {
    expect(mealTotals(createInitialState())).toEqual({
      registered: 420,
      expected: 415,
      received: 410,
      refund: 175000,
      difference: -5,
    })
  })
  it('uses a real Monday and computes calendar labels', () => {
    expect(dateLabel(DEMO_DATE, true).toLowerCase()).toContain('thứ hai')
    expect(addDays(DEMO_DATE, 7)).toBe('2026-11-02')
    expect(normalize('THCS Xuân Phương')).toBe('thcs xuan phuong')
  })
  it('does not treat consecutive shifts as overlapping', () => {
    expect(intervalsOverlap('11:30', '12:00', '12:00', '13:30')).toBe(false)
    expect(intervalsOverlap('11:30', '12:05', '12:00', '13:30')).toBe(true)
  })
  it('deduplicates confirmed lessons using their source and teacher', () => {
    const state = createInitialState()
    const count = confirmationTotal(state)
    state.confirmations.push({ ...state.confirmations[0], id: 'duplicate' })
    expect(confirmationTotal(state)).toBe(count)
  })
})

describe('menu workflow', () => {
  it('approves immutably, updates tasks, and prevents duplicate decisions', () => {
    const initial = createInitialState()
    const updated = applyCommand(initial, {
      type: 'menu.decide',
      id: 'menu-w44',
      decision: 'approved',
      note: '',
    })
    expect(initial.menus[0].status).toBe('pending')
    expect(updated.menus[0].status).toBe('approved')
    expect(updated.tasks.find((t) => t.id === 'task1')?.complete).toBe(true)
    expect(updated.events[0].entityId).toBe('menu-w44')
    expect(() =>
      applyCommand(updated, {
        type: 'menu.decide',
        id: 'menu-w44',
        decision: 'approved',
        note: '',
      }),
    ).toThrow()
  })
  it('requires a reason for a revision request', () => {
    expect(() =>
      applyCommand(createInitialState(), {
        type: 'menu.decide',
        id: 'menu-w44',
        decision: 'revision_requested',
        note: '  ',
      }),
    ).toThrow('nội dung')
  })
  it('rejects direct changes to an approved menu', () => {
    const state = createInitialState()
    expect(() => applyCommand(state, { type: 'menu.save', menu: state.menus[1] })).toThrow(
      'Chỉ có thể',
    )
  })
  it('saves a revised menu as a draft and submits it again', () => {
    let state = applyCommand(createInitialState(), {
      type: 'menu.decide',
      id: 'menu-w44',
      decision: 'revision_requested',
      note: 'Bổ sung món rau',
    })
    state = applyCommand(state, {
      type: 'menu.save',
      menu: { ...state.menus[0], name: 'Thực đơn đã cập nhật' },
    })
    expect(state.menus[0].status).toBe('draft')
    state = applyCommand(state, { type: 'menu.submit', id: 'menu-w44' })
    expect(state.menus[0].status).toBe('pending')
  })
})

describe('boarding operations', () => {
  it('blocks closing unresolved meals and protects closed data', () => {
    let state = createInitialState()
    expect(() => applyCommand(state, { type: 'meal.close' })).toThrow('xác minh')
    state = applyCommand(state, {
      type: 'meal.resolve',
      id: 'm-7A3',
      received: 42,
      reason: 'Đã bàn giao bổ sung đủ 5 khay',
    })
    expect(mealTotals(state).difference).toBe(0)
    expect(mealTotals(state).refund).toBe(175000)
    state = applyCommand(state, { type: 'meal.close' })
    expect(state.mealsClosed).toBe(true)
    expect(() =>
      applyCommand(state, { type: 'meal.resolve', id: 'm-7A3', received: 40, reason: 'Sửa lại' }),
    ).toThrow('đã chốt')
  })
  it('rejects invalid meal quantities without modifying the source', () => {
    const state = createInitialState()
    for (const received of [-1, 2.5, 99])
      expect(() =>
        applyCommand(state, { type: 'meal.resolve', id: 'm-7A3', received, reason: 'Test' }),
      ).toThrow()
    expect(state.meals.find((r) => r.id === 'm-7A3')?.received).toBe(37)
  })
  it('rejects genuine duty conflicts but allows adjacent shifts', () => {
    const state = createInitialState()
    const duty = { ...state.duties[0], id: 'new-duty' }
    expect(() => applyCommand(state, { type: 'duty.save', duty })).toThrow('giao nhau')
    expect(
      applyCommand(state, { type: 'duty.save', duty: { ...duty, start: '12:00', end: '13:30' } })
        .duties,
    ).toHaveLength(21)
  })
  it('copies one week without overwriting existing assignments', () => {
    const state = applyCommand(createInitialState(), {
      type: 'duty.copy-week',
      from: DEMO_DATE,
      to: addDays(DEMO_DATE, 7),
    })
    expect(state.duties).toHaveLength(40)
    expect(state.duties.filter((d) => d.date >= '2026-11-02').every((d) => !d.confirmed)).toBe(true)
    expect(() =>
      applyCommand(state, { type: 'duty.copy-week', from: DEMO_DATE, to: addDays(DEMO_DATE, 7) }),
    ).toThrow('Không ghi đè')
  })
})

describe('teaching workflows', () => {
  it('checks subject/class conflicts on inclusive effective dates', () => {
    const state = createInitialState()
    const assignment = {
      ...state.assignments[0],
      id: 'new',
      startDate: '2027-01-15',
      endDate: '2027-01-15',
    }
    expect(assignmentConflicts(state, assignment)).toHaveLength(1)
    expect(() => applyCommand(state, { type: 'assignment.save', assignment })).toThrow(
      'đã có phân công',
    )
  })
  it('does not delete an approved assignment', () => {
    expect(() =>
      applyCommand(createInitialState(), { type: 'assignment.delete', id: 'a1' }),
    ).toThrow('bản nháp')
  })
  it('saves and deletes a new draft without changing approved assignments', () => {
    let state = createInitialState()
    const assignment = { ...state.assignments[3], id: 'new', classIds: ['8A2'] }
    state = applyCommand(state, { type: 'assignment.save', assignment })
    expect(state.assignments).toHaveLength(13)
    state = applyCommand(state, { type: 'assignment.delete', id: 'new' })
    expect(state.assignments).toHaveLength(12)
  })
  it('requires explicit acknowledgement before approving a plan', () => {
    const state = createInitialState()
    expect(() =>
      applyCommand(state, {
        type: 'plan.decide',
        decision: 'approved',
        note: '',
        acknowledge: false,
      }),
    ).toThrow('xác nhận')
    const next = applyCommand(state, {
      type: 'plan.decide',
      decision: 'approved',
      note: '',
      acknowledge: true,
    })
    expect(next.planStatus).toBe('approved')
    expect(next.assignments.some((a) => a.status === 'pending')).toBe(false)
    expect(next.assignments.filter((a) => a.status === 'draft')).toHaveLength(2)
  })
  it('finds a qualified free teacher and disallows the absent teacher', () => {
    const state = createInitialState()
    expect(
      canSubstitute(
        state,
        state.teachers.find((t) => t.id === 't8')!,
        's1',
      ),
    ).toBe(true)
    expect(
      canSubstitute(
        state,
        state.teachers.find((t) => t.id === 't2')!,
        's1',
      ),
    ).toBe(false)
    expect(canSubstitute(state, state.teachers[0], 's1')).toBe(false)
  })
  it('records a substitution once and reopens the teacher reconciliation', () => {
    let state = createInitialState()
    const total = confirmationTotal(state)
    state = applyCommand(state, { type: 'substitution.assign', id: 's1', teacherId: 't8' })
    expect(state.substitutions.find((s) => s.id === 's1')?.status).toBe('assigned')
    state = applyCommand(state, { type: 'substitution.confirm', id: 's1' })
    expect(confirmationTotal(state)).toBe(total + 1)
    expect(state.reconciledTeacherIds).not.toContain('t8')
    expect(() => applyCommand(state, { type: 'substitution.confirm', id: 's1' })).toThrow()
  })
})
