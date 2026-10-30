import { addDays, normalize } from '../lib/utils'
import {
  assignmentConflicts,
  boardingTeachingConflict,
  canCoverDuty,
  canSubstitute,
  dutyConflict,
} from './selectors'
import type { Command, DemoState } from './types'
import {
  boardingDutyIntervals,
  boardingPerson,
  boardingPersonKey,
  boardingVersion,
  getBoardingDuties,
  getBoardingGroups,
  getBoardingMeals,
} from './boarding'

function requireCondition(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

export function applyCommand(source: DemoState, command: Command): DemoState {
  const state = structuredClone(source)
  const event = (entityId: string, title: string, note = '') =>
    state.events.unshift({
      id: crypto.randomUUID(),
      entityId,
      title,
      note,
      time: new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }),
      ...(/^(boarding\.|duty\.|meal\.|report\.)/.test(command.type)
        ? { date: state.boardingDate, scope: 'boarding' as const }
        : {}),
    })
  switch (command.type) {
    case 'boarding.date': {
      requireCondition(
        /^\d{4}-\d{2}-\d{2}$/.test(command.date) && boardingVersion(command.date),
        'Ngày chọn chưa có phân công bán trú.',
      )
      state.boardingDate = command.date
      state.mealsClosed = state.boardingClosedDates.includes(command.date)
      state.reportStatus = state.boardingReportStatuses[command.date] ?? 'draft'
      break
    }
    case 'boarding.group-add': {
      const { group, duty } = command
      const version = boardingVersion(group.date)
      requireCondition(
        group.date === state.boardingDate &&
          version &&
          group.room.trim() &&
          group.aliases.length > 0 &&
          group.members.length === 0,
        'Phòng bổ sung cần tên, ngày và được khởi tạo chưa có học sinh.',
      )
      requireCondition(
        !getBoardingGroups(state).some(
          (row) =>
            row.id === group.id ||
            row.aliases.some((alias) =>
              group.aliases.some((next) => normalize(next.trim()) === normalize(alias.trim())),
            ),
        ),
        'Phòng đã có trong phân công. Hãy điều phối vào nhóm hiện có.',
      )
      requireCondition(
        Boolean(group.availableFrom) && group.availableFrom! < '13:25',
        'Nhập giờ phòng sẵn sàng tiếp nhận trước 13:25.',
      )
      requireCondition(
        !getBoardingDuties(state).some(
          (row) =>
            row.kind === 'meal' &&
            group.aliases.some((alias) => normalize(row.area) === normalize(alias)) &&
            row.end > group.availableFrom!,
        ),
        'Phòng đang được sử dụng để ăn trước giờ sẵn sàng đã nhập. Cần chọn giờ tiếp nhận sau khi ăn xong.',
      )
      if (duty) {
        requireCondition(
          duty.kind === 'rest' &&
            duty.date === group.date &&
            duty.groupId === group.id &&
            duty.roomId === group.roomId &&
            duty.start < duty.end &&
            duty.start >= group.availableFrom! &&
            duty.area === group.room,
          'Nhiệm vụ trông phòng bổ sung không hợp lệ.',
        )
        requireCondition(
          state.boardingPeople.some((row) => row.id === duty.teacherId) ||
            state.teachers.some((row) => row.id === duty.teacherId),
          'Nhân sự phụ trách không tồn tại.',
        )
        requireCondition(
          !dutyConflict(state, duty) && !boardingTeachingConflict(state, duty),
          'Nhân sự đã có lịch giao nhau. Có thể mở phòng chờ điều phối, rồi dùng hỗ trợ theo khoảng giờ.',
        )
      }
      state.boardingExtraGroups.push(group)
      if (duty)
        state.duties.push({ ...duty, versionId: version.id, originalTeacherId: duty.teacherId })
      event(
        group.id,
        'Mở phòng ngủ bổ sung theo ngày',
        `${group.room} · ${duty ? boardingPerson(state, duty.teacherId).name : 'Chờ điều phối nhân sự'}. ${group.note}`,
      )
      break
    }
    case 'boarding.absence': {
      const value = command.absence
      requireCondition(
        value.date === state.boardingDate && !state.mealsClosed,
        'Chỉ ghi báo nghỉ trong ngày đang xem, trước khi chốt suất ăn.',
      )
      const group = getBoardingGroups(state, value.date).find((row) => row.id === value.groupId)
      requireCondition(
        group &&
          Number.isInteger(value.count) &&
          value.count > 0 &&
          value.count <=
            (group.actualMembers.find((row) => row.classId === value.classId)?.count ?? 0),
        'Số học sinh báo nghỉ vượt số đang có của lớp tại nhóm.',
      )
      requireCondition(
        value.note.trim() && !state.boardingAbsences.some((row) => row.id === value.id),
        'Ghi rõ lý do báo nghỉ; bản ghi không được trùng.',
      )
      state.boardingAbsences.push(value)
      event(
        value.id,
        'Ghi nhận học sinh nghỉ bán trú',
        `${value.classId}: ${value.count} học sinh tại ${group.room}. ${value.note}`,
      )
      break
    }
    case 'boarding.absence-delete': {
      const value = state.boardingAbsences.find((row) => row.id === command.id)
      requireCondition(
        value?.date === state.boardingDate && !state.mealsClosed,
        'Chỉ hoàn tác báo nghỉ trong ngày đang xem, trước khi chốt suất ăn.',
      )
      state.boardingAbsences = state.boardingAbsences.filter((row) => row.id !== command.id)
      event(command.id, 'Hoàn tác báo nghỉ học sinh', value.note)
      break
    }
    case 'boarding.person-link': {
      const person = state.boardingPeople.find((row) => row.id === command.personId)
      requireCondition(
        person &&
          (!command.teacherId || state.teachers.some((row) => row.id === command.teacherId)),
        'Nhân sự hoặc giáo viên không tồn tại.',
      )
      requireCondition(
        !command.teacherId ||
          !state.boardingPeople.some(
            (row) => row.id !== person.id && row.teacherId === command.teacherId,
          ),
        'Giáo viên đã được liên kết với một nhân sự bán trú khác.',
      )
      person.teacherId = command.teacherId || undefined
      event(person.id, 'Cập nhật liên kết nhân sự bán trú', boardingPerson(state, person.id).name)
      break
    }
    case 'boarding.transfer': {
      const value = command.transfer
      const groups = getBoardingGroups(state, value.date)
      const from = groups.find((row) => row.id === value.fromGroupId)
      const to = groups.find((row) => row.id === value.toGroupId)
      requireCondition(
        value.date === state.boardingDate && from && to && from.id !== to.id,
        'Chọn hai phòng khác nhau trong ngày đang xem.',
      )
      requireCondition(
        from.gender === to.gender,
        'Chọn nhóm đích cùng nhóm nam/nữ để giữ đúng thành phần nhóm ngủ.',
      )
      requireCondition(
        /^([01]\d|2[0-3]):[0-5]\d$/.test(value.time) &&
          value.time >= (to.availableFrom ?? '00:00') &&
          value.time < '13:25',
        'Giờ chuyển phải sau khi phòng nhận sẵn sàng và trước 13:25.',
      )
      requireCondition(
        getBoardingDuties(state).some(
          (row) =>
            row.groupId === to.id &&
            ['rest', 'support'].includes(row.kind) &&
            boardingDutyIntervals(state, row).some(
              (slot) => slot.start <= value.time && slot.end > value.time,
            ),
        ),
        'Phòng nhận chưa có người trực. Hãy phân công hoặc điều phối hỗ trợ trước khi chuyển học sinh.',
      )
      requireCondition(
        Number.isInteger(value.count) &&
          value.count > 0 &&
          value.count <=
            (from.actualMembers.find((row) => row.classId === value.classId)?.count ?? 0),
        'Số học sinh chuyển vượt số đang có của lớp tại phòng nguồn.',
      )
      requireCondition(value.note.trim(), 'Ghi rõ lý do điều phối.')
      requireCondition(
        !state.boardingTransfers.some((row) => row.id === value.id),
        'Điều phối đã tồn tại.',
      )
      state.boardingTransfers.push(value)
      event(
        value.id,
        'Điều phối học sinh giữa phòng ngủ',
        `${value.time} · ${value.classId}: ${value.count} học sinh, ${from.room} → ${to.room}. ${value.note}`,
      )
      break
    }
    case 'boarding.transfer-delete': {
      const move = state.boardingTransfers.find((row) => row.id === command.id)
      requireCondition(
        move?.date === state.boardingDate,
        'Điều phối không còn tồn tại trong ngày đang xem.',
      )
      state.boardingTransfers = state.boardingTransfers.filter((row) => row.id !== command.id)
      requireCondition(
        getBoardingGroups(state).every((group) =>
          group.actualMembers.every((member) => member.count >= 0),
        ),
        'Có điều phối tiếp theo sử dụng số học sinh này. Hãy hoàn tác điều phối sau trước.',
      )
      event(command.id, 'Hoàn tác điều phối học sinh', move.note)
      break
    }
    case 'boarding.support': {
      const value = command.support
      const origin = getBoardingDuties(state, value.date).find(
        (row) => row.id === value.dutyId && row.kind !== 'support' && row.kind !== 'meal',
      )
      const to = getBoardingGroups(state, value.date).find((row) => row.id === value.toGroupId)
      requireCondition(
        value.date === state.boardingDate &&
          origin &&
          to &&
          origin.groupId !== to.id &&
          origin.teacherId === value.personId,
        'Chọn đúng nhân sự, nhiệm vụ nguồn và phòng hỗ trợ.',
      )
      requireCondition(
        /^\d{2}:\d{2}$/.test(value.start) &&
          /^\d{2}:\d{2}$/.test(value.end) &&
          value.start >= origin.start &&
          value.end <= origin.end &&
          value.start < value.end &&
          value.start >= (to.availableFrom ?? '00:00'),
        'Giờ hỗ trợ phải nằm trong ca trực nguồn và sau giờ phòng sẵn sàng.',
      )
      requireCondition(value.note.trim(), 'Ghi rõ nội dung hỗ trợ.')
      requireCondition(
        !state.boardingSupports.some((row) => row.id === value.id),
        'Điều phối hỗ trợ đã tồn tại.',
      )
      state.boardingSupports.push(value)
      const duty = getBoardingDuties(state, value.date).find((row) => row.id === value.id)!
      requireCondition(
        !dutyConflict(state, duty) && !boardingTeachingConflict(state, duty),
        'Nhân sự đã có nhiệm vụ giao nhau trong khoảng hỗ trợ.',
      )
      event(
        value.id,
        'Điều phối nhân sự hỗ trợ phòng',
        `${boardingPerson(state, value.personId).name} → ${to.room}, ${value.start}–${value.end}. ${value.note}`,
      )
      break
    }
    case 'boarding.support-delete': {
      const support = state.boardingSupports.find((row) => row.id === command.id)
      requireCondition(
        support?.date === state.boardingDate,
        'Hỗ trợ không còn tồn tại trong ngày đang xem.',
      )
      state.boardingSupports = state.boardingSupports.filter((row) => row.id !== command.id)
      state.duties = state.duties.filter((row) => row.id !== command.id)
      event(command.id, 'Hoàn tác điều phối hỗ trợ', support.note)
      break
    }
    case 'menu.save': {
      const existing = state.menus.find((row) => row.id === command.menu.id)
      requireCondition(
        !existing || existing.status === 'draft' || existing.status === 'revision_requested',
        'Chỉ có thể chỉnh sửa bản nháp hoặc hồ sơ được yêu cầu sửa.',
      )
      requireCondition(
        command.menu.name.trim() &&
          command.menu.days.length === 5 &&
          command.menu.days.every((day) => day.main.trim() && day.soup.trim() && day.calories > 0),
        'Vui lòng hoàn thiện đủ 5 ngày và món ăn bắt buộc.',
      )
      requireCondition(
        command.menu.days.every((day, i) => day.date === addDays(command.menu.startDate, i)),
        'Ngày thực đơn không khớp tuần đã chọn.',
      )
      if (existing)
        state.menus = state.menus.map((row) =>
          row.id === existing.id ? { ...command.menu, status: 'draft' } : row,
        )
      else state.menus.unshift({ ...command.menu, status: 'draft' })
      event(command.menu.id, 'Lưu bản nháp thực đơn')
      break
    }
    case 'menu.submit': {
      const menu = state.menus.find((row) => row.id === command.id)
      requireCondition(
        menu && ['draft', 'revision_requested'].includes(menu.status),
        'Thực đơn không còn ở trạng thái có thể gửi duyệt.',
      )
      menu.status = 'pending'
      event(menu.id, 'Gửi Ban Giám hiệu duyệt')
      break
    }
    case 'menu.decide': {
      const menu = state.menus.find((row) => row.id === command.id)
      requireCondition(menu?.status === 'pending', 'Hồ sơ không còn ở trạng thái chờ duyệt.')
      requireCondition(
        command.decision === 'approved' || command.note.trim(),
        'Vui lòng ghi rõ nội dung cần chỉnh sửa.',
      )
      menu.status = command.decision
      event(
        menu.id,
        command.decision === 'approved'
          ? 'Đã phê duyệt thực đơn · demo'
          : 'Yêu cầu chỉnh sửa thực đơn',
        command.note,
      )
      break
    }
    case 'duty.save': {
      const duty = command.duty
      requireCondition(
        duty.kind !== 'support',
        'Nhiệm vụ hỗ trợ được cập nhật qua mục điều phối hỗ trợ.',
      )
      requireCondition(
        (state.teachers.some((t) => t.id === duty.teacherId) ||
          state.boardingPeople.some((p) => p.id === duty.teacherId)) &&
          duty.area.trim() &&
          duty.start < duty.end,
        'Thông tin ca trực không hợp lệ.',
      )
      if (duty.kind === 'rest') {
        const group = getBoardingGroups(state, duty.date).find((row) => row.id === duty.groupId)
        requireCondition(
          group &&
            duty.roomId === group.roomId &&
            duty.area === group.room &&
            duty.start >= (group.availableFrom ?? '00:00'),
          'Chọn đúng nhóm ngủ và giờ phòng sẵn sàng.',
        )
      }
      requireCondition(
        !dutyConflict(state, duty) && !boardingTeachingConflict(state, duty),
        'Nhân sự đã có ca trực hoặc lịch dạy giao nhau trong thời gian này.',
      )
      const original = getBoardingDuties(state, duty.date).find((row) => row.id === duty.id)
      requireCondition(
        !state.boardingSupports.some((row) => row.dutyId === duty.id),
        'Hãy hoàn tác điều phối hỗ trợ của ca này trước khi sửa.',
      )
      requireCondition(
        !getBoardingDuties(state, duty.date).some(
          (row) =>
            row.id !== duty.id &&
            row.groupId === duty.groupId &&
            boardingPersonKey(state, row.teacherId) === boardingPersonKey(state, duty.teacherId),
        ),
        'Nhân sự này đã được phân công cùng nhóm.',
      )
      duty.originalTeacherId = original?.originalTeacherId ?? original?.teacherId ?? duty.teacherId
      const exists = state.duties.some((row) => row.id === duty.id)
      state.duties = exists
        ? state.duties.map((row) => (row.id === duty.id ? duty : row))
        : [...state.duties, duty]
      event(duty.id, 'Cập nhật phân công trực bán trú')
      break
    }
    case 'duty.replace': {
      const duty = getBoardingDuties(state).find((row) => row.id === command.id)
      const teacher = state.teachers.find((row) => row.id === command.teacherId)
      requireCondition(
        duty &&
          duty.teacherId === command.absentId &&
          teacher &&
          canCoverDuty(state, teacher, duty),
        'Ca trực đã thay đổi hoặc giáo viên không còn khả dụng. Vui lòng chọn lại.',
      )
      requireCondition(
        !state.boardingSupports.some((row) => row.dutyId === command.id),
        'Hãy hoàn tác hỗ trợ của ca này trước khi thay người.',
      )
      const previous = boardingPerson(state, duty.teacherId)
      duty.originalTeacherId ??= duty.teacherId
      duty.teacherId = teacher.id
      duty.confirmed = false
      state.duties = [...state.duties.filter((row) => row.id !== duty.id), duty]
      event(
        duty.id,
        'Phân công trông thay bán trú · demo',
        `${previous?.name ?? command.absentId} → ${teacher.name}`,
      )
      break
    }
    case 'duty.confirm': {
      const duty = getBoardingDuties(state).find((row) => row.id === command.id)
      requireCondition(duty && !duty.confirmed, 'Ca trực đã được xác nhận hoặc không còn tồn tại.')
      duty.confirmed = true
      state.duties = [...state.duties.filter((row) => row.id !== duty.id), duty]
      event(duty.id, 'Xác nhận ca trực · demo')
      break
    }
    case 'duty.copy-week': {
      const sourceDuties = state.duties.filter(
        (row) => row.date >= command.from && row.date <= addDays(command.from, 4),
      )
      requireCondition(sourceDuties.length, 'Tuần trước chưa có lịch trực để sao chép.')
      requireCondition(
        !state.duties.some((row) => row.date >= command.to && row.date <= addDays(command.to, 4)),
        'Tuần đích đã có phân công. Không ghi đè lịch hiện tại.',
      )
      const offset = Math.round(
        (new Date(command.to).getTime() - new Date(command.from).getTime()) / 86400000,
      )
      state.duties.push(
        ...sourceDuties.map((row) => ({
          ...row,
          id: crypto.randomUUID(),
          date: addDays(row.date, offset),
          confirmed: false,
        })),
      )
      event('duties', 'Sao chép lịch trực tuần · demo')
      break
    }
    case 'inspection.save':
      requireCondition(
        command.inspection.title.trim() && command.inspection.note.trim(),
        'Cần có hạng mục và nội dung kiểm tra.',
      )
      state.inspections.unshift(command.inspection)
      event(command.inspection.id, 'Lập biên bản kiểm tra · demo')
      break
    case 'meal.resolve': {
      requireCondition(!state.mealsClosed, 'Kỳ đối soát đã chốt, không thể chỉnh sửa.')
      const meal = getBoardingMeals(state).find((row) => row.id === command.id)
      requireCondition(
        meal &&
          Number.isInteger(command.received) &&
          command.received >= 0 &&
          command.received <= meal.registered,
        'Số suất thực nhận không hợp lệ.',
      )
      requireCondition(command.reason.trim(), 'Cần ghi rõ lý do và nội dung xác minh.')
      meal.received = command.received
      meal.actualRecorded = true
      meal.reason = command.reason
      meal.resolved = true
      state.meals = [...state.meals.filter((row) => row.id !== meal.id), meal]
      event(meal.id, 'Xác nhận đối soát suất ăn · demo', command.reason)
      break
    }
    case 'meal.close':
      requireCondition(!state.mealsClosed, 'Đối soát đã được chốt.')
      requireCondition(
        getBoardingMeals(state).length > 0 && getBoardingMeals(state).every((row) => row.resolved),
        'Cần ghi nhận bàn giao và xác minh tất cả lớp trước khi chốt.',
      )
      state.mealsClosed = true
      state.boardingClosedDates.push(state.boardingDate)
      event('meals', 'Chốt đối soát ngày · demo')
      break
    case 'assignment.save': {
      const value = command.assignment
      const old = state.assignments.find((row) => row.id === value.id)
      requireCondition(
        !old || ['draft', 'revision_requested'].includes(old.status),
        'Bản phân công này không thể chỉnh sửa trực tiếp. Hãy tạo bản nháp mới.',
      )
      requireCondition(
        state.teachers.some(
          (row) =>
            row.id === value.teacherId && (row.subjects ?? [row.subject]).includes(value.subject),
        ) &&
          (value.classIds.length > 0 || (value.additionalDuties?.length ?? 0) > 0) &&
          new Set(value.classIds).size === value.classIds.length &&
          value.classIds.every((id) => state.classes.some((row) => row.id === id)),
        'Vui lòng chọn giáo viên, môn học và lớp hợp lệ.',
      )
      requireCondition(
        value.additionalDuties === undefined ||
          (Array.isArray(value.additionalDuties) &&
            value.additionalDuties.every(
              (duty) =>
                typeof duty.name === 'string' &&
                duty.name.trim().length > 0 &&
                Number.isFinite(duty.periods) &&
                duty.periods >= 0 &&
                Number.isInteger(duty.periods * 2),
            )),
        'Nhập tên nhiệm vụ kiêm nhiệm và số tiết không âm, theo bước 0,5 tiết.',
      )
      requireCondition(
        Number.isInteger(value.periods * 2) &&
          value.periods >= 0.5 &&
          value.periods <= 10 &&
          value.startDate <= value.endDate,
        'Số tiết hoặc khoảng ngày hiệu lực không hợp lệ.',
      )
      requireCondition(
        !assignmentConflicts(state, value).length,
        'Lớp/môn học đã có phân công trong khoảng ngày này.',
      )
      state.assignments = old
        ? state.assignments.map((row) => (row.id === value.id ? value : row))
        : [...state.assignments, value]
      if (value.status === 'pending') state.planStatus = 'pending'
      event('plan-hk1', value.status === 'pending' ? 'Gửi duyệt phân công' : 'Lưu nháp phân công')
      break
    }
    case 'assignment.delete': {
      const assignment = state.assignments.find((row) => row.id === command.id)
      requireCondition(assignment?.status === 'draft', 'Chỉ có thể xóa bản nháp.')
      state.assignments = state.assignments.filter((row) => row.id !== command.id)
      break
    }
    case 'plan.decide':
      requireCondition(state.planStatus === 'pending', 'Kế hoạch không còn ở trạng thái chờ duyệt.')
      if (command.decision === 'approved') {
        requireCondition(
          command.acknowledge,
          'Cần xác nhận đã xem các cảnh báo và giới hạn bản demo.',
        )
        requireCondition(
          !state.assignments
            .filter((a) => a.status === 'pending')
            .some((a) => assignmentConflicts(state, a).length),
          'Cần xử lý trùng phân công trước khi duyệt.',
        )
      } else requireCondition(command.note.trim(), 'Cần nhập lý do yêu cầu chỉnh sửa.')
      state.planStatus = command.decision
      state.assignments = state.assignments.map((row) =>
        row.status === 'pending' ? { ...row, status: command.decision } : row,
      )
      event(
        'plan-hk1',
        command.decision === 'approved'
          ? 'Phê duyệt kế hoạch · demo'
          : 'Yêu cầu chỉnh sửa kế hoạch',
        command.note,
      )
      break
    case 'substitution.assign': {
      const substitution = state.substitutions.find((row) => row.id === command.id)
      const teacher = state.teachers.find((row) => row.id === command.teacherId)
      requireCondition(
        substitution?.status !== 'confirmed' &&
          substitution &&
          teacher &&
          canSubstitute(state, teacher, command.id),
        'Giáo viên không khả dụng cho tiết dạy thay này.',
      )
      substitution.replacementId = teacher.id
      substitution.status = 'assigned'
      event(substitution.id, 'Phân công giáo viên dạy thay · demo', teacher.name)
      break
    }
    case 'substitution.confirm': {
      const substitution = state.substitutions.find((row) => row.id === command.id)
      requireCondition(
        substitution?.status === 'assigned',
        'Tiết dạy thay chưa phân công hoặc đã xác nhận.',
      )
      substitution.status = 'confirmed'
      const id = `cf-sub-${substitution.id}`
      requireCondition(
        !state.confirmations.some((row) => row.id === id),
        'Tiết dạy đã được ghi nhận.',
      )
      state.confirmations.push({
        id,
        sourceId: substitution.id,
        teacherId: substitution.replacementId,
        kind: 'substitute',
        periods: 1,
      })
      state.reconciledTeacherIds = state.reconciledTeacherIds.filter(
        (id) => id !== substitution.replacementId,
      )
      event(substitution.id, 'Xác nhận thực dạy · demo')
      break
    }
    case 'substitution.create':
      requireCondition(
        state.teachers.some((t) => t.id === command.substitution.absentId) &&
          state.classes.some((c) => c.id === command.substitution.classId) &&
          command.substitution.reason.trim(),
        'Vui lòng nhập đủ yêu cầu dạy thay.',
      )
      requireCondition(
        Number.isInteger(command.substitution.period) &&
          command.substitution.period >= 1 &&
          command.substitution.period <= 9 &&
          /^\d{4}-\d{2}-\d{2}$/.test(command.substitution.date),
        'Ngày hoặc tiết học không hợp lệ.',
      )
      requireCondition(
        !state.substitutions.some(
          (s) =>
            s.date === command.substitution.date &&
            s.period === command.substitution.period &&
            s.classId === command.substitution.classId,
        ),
        'Tiết học này đã có yêu cầu dạy thay.',
      )
      state.substitutions.unshift(command.substitution)
      break
    case 'teaching.reconcile':
      requireCondition(
        state.teachers.some((row) => row.id === command.teacherId) &&
          !state.reconciledTeacherIds.includes(command.teacherId),
        'Giáo viên không tồn tại hoặc đã chốt đối soát.',
      )
      state.reconciledTeacherIds.push(command.teacherId)
      event(command.teacherId, 'Chốt đối soát tiết giảng dạy · demo')
      break
    case 'report.submit':
      requireCondition(state.reportStatus === 'draft', 'Báo cáo đã được gửi duyệt.')
      state.reportStatus = 'pending'
      state.boardingReportStatuses[state.boardingDate] = 'pending'
      event('boarding-report', 'Gửi báo cáo bán trú · demo')
      break
  }
  state.tasks = state.tasks.map((task) => {
    if (task.id === 'task1')
      return {
        ...task,
        complete: state.menus.find((m) => m.id === 'menu-w44')?.status === 'approved',
      }
    if (task.id === 'task2')
      return {
        ...task,
        complete: state.substitutions.find((s) => s.id === 's1')?.status !== 'unassigned',
      }
    if (task.id === 'task4') return { ...task, complete: state.planStatus === 'approved' }
    if (task.id === 'task5')
      return {
        ...task,
        complete:
          getBoardingMeals(state).length > 0 && getBoardingMeals(state).every((m) => m.resolved),
      }
    return task
  })
  return state
}
