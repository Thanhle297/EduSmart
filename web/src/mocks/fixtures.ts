import { DEMO_DATE } from '../lib/config'
import { addDays } from '../lib/utils'
import type { Assignment, DemoState, MenuDay } from './types'
import { schoolTimetable, timetableClasses, timetableTeachers } from './timetable-data'
import {
  professionalAssignmentMetadata,
  professionalAssignmentRecords,
} from './professional-assignment-data'
import { boardingPeople } from './boarding-assignment-data'
import { createBoardingMeals } from './boarding'

export function makeMenuDays(startDate: string): MenuDay[] {
  const dishes = [
    [
      'Thịt heo kho trứng cút',
      'Đậu phụ sốt cà chua',
      'Rau cải ngọt luộc',
      'Canh bí xanh nấu sườn',
      'Chuối tiêu',
    ],
    [
      'Gà om nấm đông cô',
      'Trứng hấp thịt băm',
      'Bắp cải xào tỏi',
      'Canh cải cúc nấu thịt',
      'Quýt ngọt',
    ],
    ['Cá basa phi lê sốt cà', 'Chả lụa rim mắm', 'Su su luộc chấm vừng', 'Canh chua cá', 'Dưa hấu'],
    ['Bò xào rau củ', 'Đậu phụ non hấp', 'Rau muống luộc', 'Canh rong biển thịt băm', 'Sữa chua'],
    [
      'Thịt gà sốt mật ong',
      'Trứng cuộn rau củ',
      'Cải thìa xào nấm',
      'Canh bí đỏ nấu sườn',
      'Thanh long',
    ],
  ]
  return dishes.map(([main, side, vegetable, soup, dessert], index) => ({
    date: addDays(startDate, index),
    main,
    side,
    vegetable,
    soup,
    dessert,
    calories: [710, 700, 695, 715, 705][index],
    protein: [30.5, 31.2, 29.8, 30.8, 32][index],
  }))
}

export function createInitialState(): DemoState {
  const teachers = timetableTeachers.map((teacher) => {
    const record = professionalAssignmentRecords.find((row) => row.teacherId === teacher.id)
    return {
      ...teacher,
      name: record?.name ?? teacher.name,
      allowance:
        record?.dutyPeriods ??
        Number(
          record?.dutyText.match(/^(?:Phụ trách CNTT|CNTT, phần mềm Hanoi check)\s+(\d+)$/)?.[1] ??
            teacher.allowance,
        ),
      subjects: [
        ...new Set([
          ...(teacher.subjects ?? [teacher.subject]),
          ...(record?.lessons.map((lesson) => lesson.subject) ?? []),
        ]),
      ],
    }
  })
  for (const record of professionalAssignmentRecords) {
    if (teachers.some((teacher) => teacher.id === record.teacherId)) continue
    const subject =
      record.order === 1 ? 'KHTN (Sinh học)' : record.order === 2 ? 'Toán học' : 'Ngữ văn'
    teachers.push({
      id: record.teacherId,
      name: record.name,
      department: record.order <= 2 ? 'Ban Giám hiệu' : 'Ngữ văn',
      subject,
      subjects: [subject],
      quota: 19,
      allowance: record.dutyPeriods ?? 0,
      color: 'purple',
    })
  }
  const classes = timetableClasses.map((cls) => ({ ...cls }))
  const timetable = schoolTimetable.map((entry) => ({ ...entry }))
  const assignments: Assignment[] = professionalAssignmentRecords.flatMap((record) =>
    record.lessons.map((lesson, index) => ({
      ...lesson,
      classIds: [...lesson.classIds],
      id: `a-pccm-${record.order}-${index + 1}`,
      teacherId: record.teacherId,
      status: 'draft',
      startDate: professionalAssignmentMetadata.effectiveFrom,
      endDate: '2027-01-15',
      note: [
        `Theo file phân công chuyên môn HKI 2026–2027, hiệu lực 12/10/2026. Trạng thái duyệt trên ứng dụng là bản nháp.`,
        ...record.notes,
      ].join('\n'),
    })),
  )
  return {
    teachers,
    classes,
    assignments,
    menus: [
      {
        id: 'menu-w44',
        name: 'Thực đơn tuần 9',
        startDate: DEMO_DATE,
        status: 'pending',
        version: 2,
        author: 'Cô Nguyễn Lan Anh',
        days: makeMenuDays(DEMO_DATE),
      },
      {
        id: 'menu-w43',
        name: 'Thực đơn tuần 8',
        startDate: addDays(DEMO_DATE, -7),
        status: 'approved',
        version: 1,
        author: 'Cô Nguyễn Lan Anh',
        days: makeMenuDays(addDays(DEMO_DATE, -7)),
      },
      {
        id: 'menu-w45',
        name: 'Thực đơn tuần 10',
        startDate: addDays(DEMO_DATE, 7),
        status: 'draft',
        version: 1,
        author: 'Cô Nguyễn Lan Anh',
        days: makeMenuDays(addDays(DEMO_DATE, 7)),
      },
    ],
    duties: [],
    boardingDate: DEMO_DATE,
    boardingPeople: boardingPeople.map((row) => ({ ...row })),
    boardingTransfers: [],
    boardingSupports: [],
    boardingAbsences: [],
    boardingExtraGroups: [],
    boardingClosedDates: [],
    boardingReportStatuses: {},
    inspections: [
      [
        'Số lượng suất ăn',
        '10:45',
        'Bếp ăn trung tâm',
        'pass',
        'Đã tiếp nhận 410/415 suất. Đang đối soát 5 suất lớp 7A3.',
        'Theo dõi bàn giao bổ sung',
      ],
      [
        'Chất lượng bữa ăn',
        '11:00',
        'Bếp ăn & bàn chia',
        'pass',
        'Món ăn đủ định lượng, cơm dẻo, canh ấm.',
        'Tiếp tục duy trì',
      ],
      [
        'Vệ sinh khu vực ăn',
        '11:10',
        'Nhà ăn tầng 1 & 2',
        'pass',
        'Bàn ăn sạch, sàn khô ráo, thùng rác có nắp.',
        'Không yêu cầu',
      ],
      [
        'Phân công giáo viên',
        '11:20',
        'Các dãy bàn ăn',
        'pass',
        'Giáo viên phụ trách đã có mặt và hướng dẫn học sinh.',
        'Theo dõi xác nhận ca ngủ',
      ],
      [
        'Nền nếp học sinh',
        '11:35',
        'Toàn khu bán trú',
        'pass',
        'Học sinh xếp hàng trật tự, vệ sinh tay trước bữa ăn.',
        'Tuyên dương khối 7',
      ],
      [
        'Công tác trông ngủ',
        '12:15',
        'Phòng ngủ B1–B4',
        'in_progress',
        'Đang ghi nhận điều kiện phòng và sĩ số.',
        'Đang kiểm tra',
      ],
      [
        'An toàn thiết bị',
        '11:40',
        'Phòng ăn 7A2',
        'fail',
        'Quạt trần có tiếng kêu bất thường, đã ngắt điện.',
        'Chuyển bộ phận kỹ thuật kiểm tra',
      ],
    ].map(([title, time, area, result, note, followUp], i) => ({
      id: `i${i + 1}`,
      title,
      date: DEMO_DATE,
      time,
      area,
      result: result as 'pass' | 'fail' | 'in_progress',
      inspector: i % 2 ? 'Y sĩ Nguyễn Thu Trà' : 'Cô Trần Hương',
      note,
      followUp,
      evidence: i % 2 ? 'Ảnh kiểm tra mẫu · dữ liệu mô phỏng' : 'Biên bản kiểm tra mẫu',
    })),
    meals: createBoardingMeals(DEMO_DATE),
    mealsClosed: false,
    timetable,
    // A timetable does not establish absences, completed teaching or reconciliation.
    substitutions: [],
    confirmations: [],
    reconciledTeacherIds: [],
    planStatus: 'draft',
    reportStatus: 'draft',
    events: [
      {
        id: 'ev-initial',
        entityId: 'menu-w44',
        title: 'Trình duyệt phiên bản 2',
        note: 'Cô Nguyễn Lan Anh đã hoàn thiện thực đơn tuần 9.',
        time: '08:30 · 26/10/2026',
      },
    ],
    tasks: [
      {
        id: 'task1',
        title: 'Duyệt thực đơn bán trú tuần 9',
        subtitle: 'Thực đơn và kế hoạch dinh dưỡng',
        owner: 'Cô Nguyễn Lan Anh',
        deadline: '10:30',
        priority: 'high',
        complete: false,
        route: '/boarding/menu-approvals/menu-w44',
      },
      {
        id: 'task3',
        title: 'Kiểm tra nền nếp bán trú',
        subtitle: 'Vệ sinh, chuyên cần và an toàn',
        owner: 'Y sĩ Nguyễn Thu Trà',
        deadline: '11:30',
        priority: 'medium',
        complete: false,
        route: '/boarding/inspections',
      },
      {
        id: 'task4',
        title: 'Thẩm định phân công học kỳ I',
        subtitle: 'Kế hoạch chuyên môn toàn trường',
        owner: 'Tổ chuyên môn',
        deadline: '16:30',
        priority: 'high',
        complete: false,
        route: '/teaching/approvals/plan-hk1',
      },
      {
        id: 'task5',
        title: 'Đối soát số lượng suất ăn',
        subtitle: 'Ghi nhận bàn giao và đối soát theo từng lớp',
        owner: 'Cô Trần Thảo',
        deadline: '13:00',
        priority: 'medium',
        complete: false,
        route: '/boarding/meals',
      },
      {
        id: 'task6',
        title: 'Tổng hợp báo cáo tuần',
        subtitle: 'Văn phòng nhà trường',
        owner: 'Văn phòng',
        deadline: '17:00',
        priority: 'medium',
        complete: false,
      },
      ...Array.from({ length: 18 }, (_, i) => ({
        id: `completed-${i}`,
        title: `Công việc tuần đã hoàn thành ${i + 1}`,
        subtitle: 'Lưu trong dữ liệu demo',
        owner: 'Văn phòng',
        deadline: '08:00',
        priority: 'medium' as const,
        complete: true,
      })),
    ],
  }
}
