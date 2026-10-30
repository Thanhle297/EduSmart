export type WorkflowStatus = 'draft' | 'pending' | 'approved' | 'revision_requested'
export type Tone = 'blue' | 'green' | 'amber' | 'red' | 'purple' | 'slate' | 'teal'
export interface Teacher {
  id: string
  name: string
  department: string
  subject: string
  subjects?: string[]
  quota: number
  allowance: number
  color: Tone
}
export interface SchoolClass {
  id: string
  name: string
  grade: string
  students: number
  room: string
  homeroomTeacher?: string
}
export interface MenuDay {
  date: string
  main: string
  side: string
  vegetable: string
  soup: string
  dessert: string
  calories: number
  protein: number
}
export interface Menu {
  id: string
  name: string
  startDate: string
  status: WorkflowStatus
  version: number
  author: string
  days: MenuDay[]
}
export interface Duty {
  id: string
  teacherId: string
  date: string
  kind: 'meal' | 'rest' | 'floor' | 'medical' | 'support'
  area: string
  start: string
  end: string
  confirmed: boolean
  originalTeacherId?: string
  versionId?: string
  groupId?: string
  roomId?: string
  classIds?: string[]
  shift?: 1 | 2 | 3
  note?: string
  originDutyId?: string
}
export interface BoardingPerson {
  id: string
  name: string
  teacherId?: string
  role: 'teacher' | 'staff' | 'unresolved'
}
export interface BoardingClass {
  classId: string
  boys: number
  girls: number
  personId: string
  daysOff: number[]
}
export interface BoardingGroup {
  id: string
  roomId: string
  room: string
  aliases: string[]
  gender: 'boys' | 'girls'
  members: { classId: string; count: number }[]
  personIds: string[]
  sourceCount: number
  note: string
  availableFrom?: string
}
export interface BoardingVersion {
  id: string
  effectiveFrom: string
  source: string
  sourceMealTotal: number
  sourceSleepTotal: number
  sourceRoomTotal: number
  classes: BoardingClass[]
  groups: BoardingGroup[]
  services: {
    id: string
    personId: string
    kind: 'floor' | 'medical'
    area: string
    note: string
  }[]
  notes: string[]
}
export interface BoardingTransfer {
  id: string
  date: string
  fromGroupId: string
  toGroupId: string
  classId: string
  count: number
  time: string
  note: string
}
export interface BoardingSupport {
  id: string
  date: string
  dutyId: string
  personId: string
  toGroupId: string
  start: string
  end: string
  note: string
}
export interface BoardingAbsence {
  id: string
  date: string
  groupId: string
  classId: string
  count: number
  note: string
}
export interface Inspection {
  id: string
  title: string
  date: string
  time: string
  area: string
  inspector: string
  result: 'pass' | 'fail' | 'in_progress'
  note: string
  followUp: string
  evidence: string
}
export interface MealRecord {
  id: string
  classId: string
  registered: number
  expected: number
  received: number
  reason: string
  resolved: boolean
  refundEligible: number
  date?: string
  actualRecorded?: boolean
}
export interface Assignment {
  id: string
  teacherId: string
  subject: string
  classIds: string[]
  periods: number
  status: WorkflowStatus
  startDate: string
  endDate: string
  note: string
  additionalDuties?: { name: string; periods: number }[]
}
export interface TimetableEntry {
  id: string
  day: number
  period: number
  teacherId: string
  classId: string
  subject: string
  room: string
  source?: string
  sourceText?: string
  note?: string
  effectiveFrom?: string
}
export interface Substitution {
  id: string
  date: string
  period: number
  classId: string
  subject: string
  absentId: string
  replacementId: string
  reason: string
  status: 'unassigned' | 'assigned' | 'confirmed'
}
export interface TeachingConfirmation {
  id: string
  teacherId: string
  sourceId: string
  kind: 'regular' | 'substitute' | 'makeup'
  periods: number
}
export interface WorkflowEvent {
  id: string
  entityId: string
  title: string
  note: string
  time: string
  date?: string
  scope?: 'boarding'
}
export interface Task {
  id: string
  title: string
  subtitle: string
  owner: string
  deadline: string
  priority: 'high' | 'medium'
  complete: boolean
  route?: string
}
export interface DemoState {
  teachers: Teacher[]
  classes: SchoolClass[]
  menus: Menu[]
  duties: Duty[]
  boardingDate: string
  boardingPeople: BoardingPerson[]
  boardingTransfers: BoardingTransfer[]
  boardingSupports: BoardingSupport[]
  boardingAbsences: BoardingAbsence[]
  boardingExtraGroups: (BoardingGroup & { date: string })[]
  boardingClosedDates: string[]
  boardingReportStatuses: Record<string, WorkflowStatus>
  inspections: Inspection[]
  meals: MealRecord[]
  mealsClosed: boolean
  assignments: Assignment[]
  timetable: TimetableEntry[]
  substitutions: Substitution[]
  confirmations: TeachingConfirmation[]
  reconciledTeacherIds: string[]
  planStatus: WorkflowStatus
  reportStatus: WorkflowStatus
  events: WorkflowEvent[]
  tasks: Task[]
}
export type Command =
  | { type: 'menu.save'; menu: Menu }
  | { type: 'menu.submit'; id: string }
  | { type: 'menu.decide'; id: string; decision: 'approved' | 'revision_requested'; note: string }
  | { type: 'duty.save'; duty: Duty }
  | { type: 'duty.replace'; id: string; absentId: string; teacherId: string }
  | { type: 'duty.confirm'; id: string }
  | { type: 'duty.copy-week'; from: string; to: string }
  | { type: 'boarding.date'; date: string }
  | { type: 'boarding.transfer'; transfer: BoardingTransfer }
  | { type: 'boarding.support'; support: BoardingSupport }
  | { type: 'boarding.person-link'; personId: string; teacherId: string }
  | { type: 'boarding.transfer-delete'; id: string }
  | { type: 'boarding.support-delete'; id: string }
  | { type: 'boarding.absence'; absence: BoardingAbsence }
  | { type: 'boarding.absence-delete'; id: string }
  | { type: 'boarding.group-add'; group: BoardingGroup & { date: string }; duty?: Duty }
  | { type: 'inspection.save'; inspection: Inspection }
  | { type: 'meal.resolve'; id: string; received: number; reason: string }
  | { type: 'meal.close' }
  | { type: 'assignment.save'; assignment: Assignment }
  | { type: 'assignment.delete'; id: string }
  | {
      type: 'plan.decide'
      decision: 'approved' | 'revision_requested'
      note: string
      acknowledge: boolean
    }
  | { type: 'substitution.assign'; id: string; teacherId: string }
  | { type: 'substitution.confirm'; id: string }
  | { type: 'substitution.create'; substitution: Substitution }
  | { type: 'teaching.reconcile'; teacherId: string }
  | { type: 'report.submit' }
