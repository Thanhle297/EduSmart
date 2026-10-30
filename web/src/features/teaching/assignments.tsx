import { useCallback, useRef, useState } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  ArrowLeft,
  CheckCircle2,
  ClipboardList,
  Copy,
  Edit3,
  Eye,
  GraduationCap,
  Plus,
  Save,
  Send,
  ShieldCheck,
  Trash2,
  UsersRound,
} from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'
import {
  Link,
  useBeforeUnload,
  useBlocker,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom'
import { useDemo } from '../../app/demo-context'
import { DataTable } from '../../components/data-table/data-table'
import {
  Alert,
  Avatar,
  Badge,
  DemoNote,
  EmptyState,
  ExportButton,
  Field,
  Metric,
  PageHeader,
  Panel,
  Progress,
  StatusBadge,
} from '../../components/shared/ui'
import { Button } from '../../components/ui/button'
import { Dialog } from '../../components/ui/dialog'
import { DEMO_DATE } from '../../lib/config'
import { dateLabel, downloadCsv } from '../../lib/utils'
import {
  assignedPeriods,
  assignedDutyPeriods,
  assignmentConflicts,
  dutyLoad,
  getTeacher,
  teachingLoad,
} from '../../mocks/selectors'
import type { Assignment, WorkflowStatus } from '../../mocks/types'
import { ProfessionalAssignmentsOverview } from './professional-assignments-overview'

type DisplayAssignment = Assignment & { displayClass?: string }

export function AssignmentsPage() {
  const [search] = useSearchParams()
  return search.get('view') === 'lessons'
    ? <AssignmentLessonsPage />
    : <ProfessionalAssignmentsOverview />
}

function AssignmentLessonsPage() {
  const { state, mutate, busy } = useDemo()
  const [search] = useSearchParams()
  const [teacherId, setTeacherId] = useState(search.get('teacher') ?? 'all')
  const [department, setDepartment] = useState('all')
  const [status, setStatus] = useState('all')
  const [group, setGroup] = useState('teacher')
  const [view, setView] = useState<Assignment | null>(null)
  const [deleting, setDeleting] = useState<Assignment | null>(null)
  const filtered = state.assignments.filter(
    (row) =>
      (teacherId === 'all' || row.teacherId === teacherId) &&
      (department === 'all' || getTeacher(state, row.teacherId)?.department === department) &&
      (status === 'all' || row.status === status),
  )
  const data: DisplayAssignment[] =
    group === 'class'
      ? filtered
          .flatMap((row) => row.classIds.map((displayClass) => ({ ...row, displayClass })))
          .sort((a, b) => (a.displayClass ?? '').localeCompare(b.displayClass ?? ''))
      : filtered
  const columns: ColumnDef<DisplayAssignment>[] = [
    {
      id: 'teacher',
      header: 'GIÁO VIÊN & CHỨC VỤ',
      accessorFn: (row) => getTeacher(state, row.teacherId)?.name,
      cell: ({ row }) => {
        const teacher = getTeacher(state, row.original.teacherId)!
        return (
          <div className="person-cell">
            <Avatar name={teacher.name} tone={teacher.color} />
            <div>
              <strong>{teacher.name}</strong>
              <small>{teacher.id} · {teacher.department}</small>
            </div>
          </div>
        )
      },
    },
    {
      id: 'department',
      header: 'TỔ CHUYÊN MÔN',
      accessorFn: (row) => getTeacher(state, row.teacherId)?.department,
    },
    { id: 'subject', accessorFn: (row) => row.classIds.length ? row.subject : 'Kiêm nhiệm', header: 'MÔN HỌC' },
    {
      id: 'classes',
      header: 'LỚP PHỤ TRÁCH',
      accessorFn: (row) => row.displayClass ?? row.classIds.join(', '),
      cell: ({ row }) => (
        <div className="class-chips">
          {!row.original.classIds.length && <small>Không phân công lớp</small>}
          {(row.original.displayClass ? [row.original.displayClass] : row.original.classIds).map(
            (id) => (
              <span key={id}>
                {id} <small>({row.original.periods}t)</small>
              </span>
            ),
          )}
        </div>
      ),
    },
    {
      id: 'additionalDuties',
      header: 'KIÊM NHIỆM BỔ SUNG',
      accessorFn: (row) => (row.additionalDuties ?? []).map((duty) => `${duty.name} (${duty.periods} tiết)`).join('; '),
      cell: ({ getValue }) => getValue<string>() || '—',
    },
    {
      id: 'load',
      header: 'TẢI / ĐỊNH MỨC',
      accessorFn: (row) => teachingLoad(state, row.teacherId) + dutyLoad(state, row.teacherId),
      cell: ({ row }) => {
        const teacher = getTeacher(state, row.original.teacherId)!
        const load = teachingLoad(state, teacher.id) + dutyLoad(state, teacher.id)
        return (
          <div className="cell-stack">
            <strong className={load > teacher.quota ? 'red-text' : 'teal-text'}>
              {load} / {teacher.quota} tiết
            </strong>
            <small>
              {load > teacher.quota ? `Vượt ${load - teacher.quota} tiết` : 'Tải dự kiến'}
            </small>
          </div>
        )
      },
    },
    {
      accessorKey: 'status',
      header: 'TRẠNG THÁI',
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      id: 'actions',
      header: 'THAO TÁC',
      cell: ({ row }) => {
        const value = row.original
        const editable = ['draft', 'revision_requested'].includes(value.status)
        return (
          <div className="row-actions">
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Xem phân công ${getTeacher(state, value.teacherId)?.name}`}
              onClick={() => setView(value)}
            >
              <Eye size={15} />
            </Button>
            {editable && (
              <Button variant="ghost" size="icon" asChild>
                <Link
                  aria-label="Chỉnh sửa phân công"
                  to={`/teaching/assignments/${value.id}/edit`}
                >
                  <Edit3 size={15} />
                </Link>
              </Button>
            )}
            <Button variant="ghost" size="icon" asChild>
              <Link
                aria-label="Sao chép thành phân công mới"
                to={`/teaching/assignments/new?copy=${value.id}`}
              >
                <Copy size={14} />
              </Link>
            </Button>
            {value.status === 'draft' && (
              <Button
                variant="ghost"
                size="icon"
                aria-label="Xóa bản nháp phân công"
                onClick={() => setDeleting(value)}
              >
                <Trash2 size={15} className="red-text" />
              </Button>
            )}
          </div>
        )
      },
    },
  ]
  const total = state.assignments.reduce((sum, row) => sum + assignedPeriods(row) + assignedDutyPeriods(row), 0)
  const approved = state.assignments.filter((a) => a.status === 'approved').length
  return (
    <>
      <Link className="back-link" to="/teaching/assignments">
        <ArrowLeft size={15} /> Bảng tổng hợp theo file phân công
      </Link>
      <PageHeader
        eyebrow="CHUYÊN MÔN / PHÂN CÔNG"
        title="Chi tiết phân công theo môn và lớp"
        description="Phân công từ file Word có hiệu lực 12/10/2026 và các điều chỉnh trên ứng dụng."
        badge={<Badge tone="teal">Học kỳ 1</Badge>}
        actions={
          <>
            <ExportButton
              onClick={() =>
                downloadCsv(
                  'phan-cong-chuyen-mon.csv',
                  ['Giáo viên', 'Tổ', 'Môn', 'Lớp', 'Tiết mỗi lớp', 'Tiết giảng dạy', 'Kiêm nhiệm bổ sung', 'Tiết kiêm nhiệm bổ sung', 'Trạng thái'],
                  filtered.map((a) => [
                    getTeacher(state, a.teacherId)!.name,
                    getTeacher(state, a.teacherId)!.department,
                    a.classIds.length ? a.subject : 'Kiêm nhiệm',
                    a.classIds.join('; '),
                    a.periods,
                    assignedPeriods(a),
                    (a.additionalDuties ?? []).map((duty) => `${duty.name} (${duty.periods} tiết)`).join('; '),
                    assignedDutyPeriods(a),
                    a.status,
                  ]),
                )
              }
            />
            <Button asChild>
              <Link to="/teaching/assignments/new">
                <Plus size={17} />
                Thêm phân công
              </Link>
            </Button>
          </>
        }
      />
      <div className="metrics-grid">
        <Metric
          label="Giáo viên được phân công"
          value={new Set(state.assignments.map((row) => row.teacherId)).size}
          detail="Giảng dạy và kiêm nhiệm"
          icon={UsersRound}
        />
        <Metric
          label="Tổng tiết phân công / tuần"
          value={total}
          detail="Gồm các bản phân công dự kiến"
          icon={GraduationCap}
          tone="teal"
        />
        <Metric
          label="Tiến độ phê duyệt"
          value={`${approved} / ${state.assignments.length}`}
          detail="Bản phân công đã duyệt"
          icon={ShieldCheck}
          tone="purple"
        />
        <Metric
          label="Giáo viên vượt định mức"
          value={
            state.teachers.filter((t) => teachingLoad(state, t.id) + dutyLoad(state, t.id) > t.quota).length
          }
          detail="Cần xem xét tải dự kiến"
          icon={ClipboardList}
          tone="red"
        />
      </div>
      <div className="toolbar-panel filter-toolbar">
        <label className="inline-field">
          Giáo viên
          <select value={teacherId} aria-label="Lọc giáo viên phân công" onChange={(e) => setTeacherId(e.target.value)}>
            <option value="all">Tất cả giáo viên</option>
            {state.teachers.map((teacher) => <option key={teacher.id} value={teacher.id}>{teacher.name}</option>)}
          </select>
        </label>
        <label className="inline-field">
          Tổ chuyên môn
          <select
            value={department}
            aria-label="Lọc tổ chuyên môn"
            onChange={(e) => setDepartment(e.target.value)}
          >
            <option value="all">Tất cả tổ chuyên môn</option>
            {[...new Set(state.teachers.map((t) => t.department))].map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>
        </label>
        <label className="inline-field">
          Trạng thái
          <select
            value={status}
            aria-label="Lọc trạng thái phân công"
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="draft">Bản nháp</option>
            <option value="pending">Chờ duyệt</option>
            <option value="approved">Đã duyệt</option>
            <option value="revision_requested">Yêu cầu sửa</option>
          </select>
        </label>
        <div className="toolbar-spacer" />
        <div className="segmented">
          <button
            className={group === 'teacher' ? 'selected' : ''}
            onClick={() => setGroup('teacher')}
          >
            <UsersRound size={14} />
            Theo giáo viên
          </button>
          <button className={group === 'class' ? 'selected' : ''} onClick={() => setGroup('class')}>
            <GraduationCap size={14} />
            Theo lớp
          </button>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setDepartment('all')
            setTeacherId('all')
            setStatus('all')
            setGroup('teacher')
          }}
        >
          Đặt lại bộ lọc
        </Button>
      </div>
      <Panel>
        <DataTable
          key={`${teacherId}-${department}-${status}-${group}`}
          data={data}
          columns={columns}
          searchPlaceholder="Tìm tên giáo viên, môn hoặc lớp..."
          pageSize={6}
        />
      </Panel>
      <Alert
        title="Đối chiếu định mức trước khi ban hành"
        tone="blue"
        action={
          <Button variant="secondary" size="sm" asChild>
            <Link to="/teaching/approvals/plan-hk1">Xem hồ sơ duyệt</Link>
          </Button>
        }
      >
        Tiết tại đây tính từ danh sách môn/lớp và các điều chỉnh. Bảng tổng hợp giữ nguyên số tiết,
        công tác kiêm nhiệm và các chênh lệch trong file Word; tiết PH2 chưa ghi rõ lớp không được tự phân bổ.
      </Alert>
      <Dialog
        open={!!view}
        onOpenChange={() => setView(null)}
        title="Chi tiết phân công chuyên môn"
        drawer
      >
        {view && (
          <>
            <div className="account-summary">
              <Avatar name={getTeacher(state, view.teacherId)!.name} />
              <div>
                <h3>{getTeacher(state, view.teacherId)!.name}</h3>
                <p>{view.classIds.length ? view.subject : 'Phân công kiêm nhiệm'}</p>
              </div>
            </div>
            <StatusBadge status={view.status} />
            <dl className="detail-list">
              <div>
                <dt>Lớp phụ trách</dt>
                <dd>{view.classIds.join(', ') || 'Không phân công lớp'}</dd>
              </div>
              <div>
                <dt>Số tiết mỗi lớp</dt>
                <dd>{view.periods} tiết / tuần</dd>
              </div>
              <div>
                <dt>Tổng tiết phân công</dt>
                <dd>{assignedPeriods(view)} tiết / tuần</dd>
              </div>
              <div>
                <dt>Hiệu lực</dt>
                <dd>
                  {dateLabel(view.startDate)} – {dateLabel(view.endDate)}
                </dd>
              </div>
            </dl>
            {!!view.additionalDuties?.length && <>
              <h3>Phân công kiêm nhiệm bổ sung</h3>
              <dl className="detail-list">
                {view.additionalDuties.map((duty, index) => <div key={index}>
                  <dt>{duty.name}</dt><dd>{duty.periods} tiết / tuần</dd>
                </div>)}
                <div><dt>Tổng tiết kiêm nhiệm bổ sung</dt><dd>{assignedDutyPeriods(view)} tiết / tuần</dd></div>
              </dl>
            </>}
            <p className="dialog-paragraph">{view.note || 'Chưa có ghi chú bổ sung.'}</p>
            <DemoNote>Bản đã duyệt/chờ duyệt không được chỉnh sửa trực tiếp.</DemoNote>
          </>
        )}
      </Dialog>
      <Dialog
        open={!!deleting}
        onOpenChange={() => setDeleting(null)}
        title="Xóa bản nháp phân công?"
        description="Thao tác chỉ xóa bản nháp trong phiên demo hiện tại."
      >
        <p className="dialog-paragraph">
          {deleting && getTeacher(state, deleting.teacherId)?.name} · {deleting?.subject}
        </p>
        <div className="dialog-actions">
          <Button variant="secondary" onClick={() => setDeleting(null)}>
            Giữ bản nháp
          </Button>
          <Button
            variant="danger"
            disabled={busy}
            onClick={async () => {
              if (
                deleting &&
                (await mutate({ type: 'assignment.delete', id: deleting.id }, 'Đã xóa bản nháp.'))
              )
                setDeleting(null)
            }}
          >
            <Trash2 size={16} />
            Xóa bản nháp
          </Button>
        </div>
      </Dialog>
    </>
  )
}

const schema = z
  .object({
    teacherId: z.string().min(1, 'Chọn giáo viên.'),
    subject: z.string().min(1, 'Chọn môn học.'),
    classIds: z.array(z.string()),
    periods: z
      .number()
      .multipleOf(0.5, 'Nhập theo bước 0,5 tiết.')
      .min(0.5, 'Tối thiểu 0,5 tiết.')
      .max(10, 'Tối đa 10 tiết/lớp trong bản demo.'),
    startDate: z.string().min(1, 'Chọn ngày bắt đầu.'),
    endDate: z.string().min(1, 'Chọn ngày kết thúc.'),
    note: z.string(),
    additionalDuties: z.array(z.object({
      name: z.string().trim().min(1, 'Nhập tên nhiệm vụ kiêm nhiệm.'),
      periods: z.number()
        .min(0, 'Số tiết không được âm.')
        .multipleOf(0.5, 'Nhập theo bước 0,5 tiết.'),
    })),
  })
  .refine((v) => v.classIds.length > 0 || v.additionalDuties.length > 0, {
    message: 'Chọn ít nhất một lớp hoặc thêm nhiệm vụ kiêm nhiệm.',
    path: ['classIds'],
  })
  .refine((v) => v.startDate <= v.endDate, {
    message: 'Ngày kết thúc phải sau ngày bắt đầu.',
    path: ['endDate'],
  })
type AssignmentForm = z.infer<typeof schema>

export function AssignmentEditorPage() {
  const { state, mutate, busy, notify } = useDemo()
  const { assignmentId } = useParams()
  const [search] = useSearchParams()
  const copyId = search.get('copy')
  const source = state.assignments.find((row) => row.id === (assignmentId ?? copyId))
  const navigate = useNavigate()
  const allowLeave = useRef(false)
  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isDirty },
  } = useForm<AssignmentForm>({
    resolver: zodResolver(schema),
    defaultValues: source
      ? {
          teacherId: source.teacherId,
          subject: source.subject,
          classIds: source.classIds,
          periods: source.periods,
          startDate: source.startDate,
          endDate: source.endDate,
          note: source.note,
          additionalDuties: source.additionalDuties ?? [],
        }
      : {
          teacherId: state.teachers[0].id,
          subject: state.teachers[0].subject,
          classIds: [],
          periods: 4,
          startDate: DEMO_DATE,
          endDate: '2027-01-15',
          note: '',
          additionalDuties: [],
        },
  })
  const { fields: dutyFields, append: appendDuty, remove: removeDuty } = useFieldArray({
    control,
    name: 'additionalDuties',
  })
  const values = watch()
  const teacher = getTeacher(state, values.teacherId) ?? state.teachers[0]
  const currentLoad = teachingLoad(state, teacher.id, assignmentId)
  const addedLoad = (values.classIds?.length ?? 0) * (Number(values.periods) || 0)
  const currentDutyLoad = dutyLoad(state, teacher.id, assignmentId)
  const addedDutyLoad = (values.additionalDuties ?? []).reduce((sum, duty) => sum + (Number(duty.periods) || 0), 0)
  const totalLoad = currentLoad + addedLoad + currentDutyLoad + addedDutyLoad
  const candidate: Assignment = { ...values, id: assignmentId ?? 'new', status: 'draft' }
  const conflicts = assignmentConflicts(state, candidate)
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      isDirty && !allowLeave.current && currentLocation.pathname !== nextLocation.pathname,
  )
  useBeforeUnload(
    useCallback(
      (event) => {
        if (isDirty && !allowLeave.current) {
          event.preventDefault()
          event.returnValue = ''
        }
      },
      [isDirty],
    ),
  )
  if ((assignmentId || copyId) && !source)
    return (
      <Panel>
        <EmptyState
          title="Không tìm thấy phân công"
          description="Mã phân công không tồn tại trong dữ liệu demo."
          action={
            <Button asChild>
              <Link to="/teaching/assignments">Về bảng phân công</Link>
            </Button>
          }
        />
      </Panel>
    )
  if (assignmentId && source && !['draft', 'revision_requested'].includes(source.status))
    return (
      <Panel>
        <EmptyState
          title="Phân công đang được bảo vệ"
          description="Chỉ có thể sửa bản nháp hoặc bản được yêu cầu chỉnh sửa."
          action={
            <Button asChild>
              <Link to="/teaching/assignments">Về bảng phân công</Link>
            </Button>
          }
        />
      </Panel>
    )
  const save = async (data: AssignmentForm, status: WorkflowStatus) => {
    if (
      await mutate(
        {
          type: 'assignment.save',
          assignment: { ...data, id: assignmentId ?? crypto.randomUUID(), status },
        },
        status === 'pending'
          ? 'Đã gửi phân công vào kế hoạch chờ duyệt.'
          : 'Đã lưu bản nháp phân công.',
      )
    ) {
      allowLeave.current = true
      reset(data)
      navigate(`/teaching/assignments?view=lessons&teacher=${data.teacherId}`)
    }
  }
  return (
    <>
      <Link className="back-link" to="/teaching/assignments?view=lessons">
        <ArrowLeft size={15} />
        Bảng phân công chuyên môn
      </Link>
      <PageHeader
        eyebrow={`CHUYÊN MÔN / ${assignmentId ? 'CHỈNH SỬA' : 'TẠO PHÂN CÔNG'}`}
        title="Thiết lập phân công giảng dạy"
        description="Phân công lớp giảng dạy, nhiệm vụ kiêm nhiệm và số tiết dự kiến trong học kỳ."
        badge={<Badge tone="blue">Biểu mẫu phân công</Badge>}
      />
      {copyId && (
        <Alert title="Đang sao chép thành bản phân công mới" tone="blue">
          Thay đổi lớp/môn hoặc ngày hiệu lực để tránh trùng với phân công gốc.
        </Alert>
      )}
      <form onSubmit={handleSubmit((data) => save(data, 'draft'))}>
        <div className="editor-columns">
          <Panel title="Thông tin phân công nhiệm vụ" description="Các trường có dấu * là bắt buộc">
            <div className="padded">
              <div className="form-grid">
                <Field label="Giáo viên được phân công *" error={errors.teacherId?.message}>
                  <select
                    {...register('teacherId', {
                      onChange: (e) =>
                        setValue('subject', getTeacher(state, e.target.value)?.subject ?? '', {
                          shouldDirty: true,
                        }),
                    })}
                  >
                    {state.teachers.map((row) => (
                      <option value={row.id} key={row.id}>
                        {row.name}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Tổ chuyên môn">
                  <input readOnly value={teacher.department} />
                </Field>
                <Field label="Môn học đảm nhiệm *" error={errors.subject?.message}>
                  <select {...register('subject')}>
                    {(teacher.subjects ?? [teacher.subject]).map((subject) => (
                      <option key={subject} value={subject}>{subject}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Số tiết / lớp / tuần *" error={errors.periods?.message}>
                  <input
                    type="number"
                    min={0.5}
                    step={0.5}
                    max={10}
                    {...register('periods', { valueAsNumber: true })}
                  />
                </Field>
              </div>
              <fieldset className="class-picker">
                <legend>
                  Lớp giảng dạy <span>{values.classIds?.length ?? 0} lớp đã chọn</span>
                </legend>
                <div>
                  {state.classes.map((cls) => (
                    <label key={cls.id}>
                      <input type="checkbox" value={cls.id} {...register('classIds')} />
                      <span>
                        <strong>Lớp {cls.name}</strong>
                        <small>
                          {cls.students} học sinh · Phòng {cls.room}
                        </small>
                      </span>
                      <span>{values.periods || 0}t/tuần</span>
                    </label>
                  ))}
                </div>
                {errors.classIds && <p className="field-error">{errors.classIds.message}</p>}
              </fieldset>
              <div className="calculation-strip">
                <GraduationCap size={18} />
                <span>
                  Tổng phân công dự kiến: {values.classIds?.length ?? 0} lớp × {values.periods || 0}{' '}
                  tiết
                </span>
                <strong>{addedLoad} tiết / tuần</strong>
              </div>
              <Panel title="Phân công kiêm nhiệm" description="Bổ sung nhiệm vụ và số tiết quy đổi mỗi tuần; có thể chỉ phân công kiêm nhiệm, không chọn lớp giảng dạy.">
                <div className="padded">
                  <p className="muted">Kiêm nhiệm hiện có: {currentDutyLoad} tiết/tuần. Các nhiệm vụ bên dưới được cộng thêm vào tải dự kiến.</p>
                  {dutyFields.map((field, index) => <div key={field.id} className="padded">
                    <div className="form-grid">
                      <Field label={`Nhiệm vụ kiêm nhiệm ${index + 1} *`} error={errors.additionalDuties?.[index]?.name?.message}>
                        <input {...register(`additionalDuties.${index}.name`)} placeholder="Ví dụ: Chủ nhiệm 8A1, tổ phó chuyên môn..." />
                      </Field>
                      <Field label="Số tiết quy đổi / tuần *" error={errors.additionalDuties?.[index]?.periods?.message}>
                        <input type="number" min={0} step={0.5} {...register(`additionalDuties.${index}.periods`, { valueAsNumber: true })} />
                      </Field>
                    </div>
                    <Button type="button" variant="ghost" size="sm" aria-label={`Xóa nhiệm vụ kiêm nhiệm ${index + 1}`} onClick={() => removeDuty(index)}>
                      <Trash2 size={15} />Xóa nhiệm vụ
                    </Button>
                  </div>)}
                  <Button type="button" variant="secondary" size="sm" onClick={() => appendDuty({ name: '', periods: 0 })}>
                    <Plus size={16} />Thêm nhiệm vụ kiêm nhiệm
                  </Button>
                  <div className="calculation-strip">
                    <ClipboardList size={18} /><span>Kiêm nhiệm bổ sung</span><strong>{addedDutyLoad} tiết / tuần</strong>
                  </div>
                </div>
              </Panel>
              <div className="form-grid">
                <Field label="Ngày bắt đầu hiệu lực *" error={errors.startDate?.message}>
                  <input type="date" {...register('startDate')} />
                </Field>
                <Field label="Ngày kết thúc hiệu lực *" error={errors.endDate?.message}>
                  <input type="date" {...register('endDate')} />
                </Field>
              </div>
              <Field label="Ghi chú nghiệp vụ / Phân công bổ trợ">
                <textarea
                  rows={4}
                  {...register('note')}
                  placeholder="Nhập nội dung phân công bổ trợ hoặc lưu ý..."
                />
              </Field>
            </div>
          </Panel>
          <aside>
            <Panel title="Định mức giảng dạy giáo viên">
              <div className="padded">
                <div className="account-summary">
                  <Avatar name={teacher.name} tone={teacher.color} />
                  <div>
                    <strong>{teacher.name}</strong>
                    <p>Tổ {teacher.department}</p>
                  </div>
                </div>
                <div className="workload-number">
                  <strong className={totalLoad > teacher.quota ? 'red-text' : ''}>
                    {totalLoad}
                  </strong>
                  <span>/ {teacher.quota} tiết dự kiến</span>
                </div>
                <Progress
                  value={(totalLoad / teacher.quota) * 100}
                  tone={totalLoad > teacher.quota ? 'red' : 'blue'}
                />
                <dl className="detail-list">
                  <div>
                    <dt>Đã phân công trước đó</dt>
                    <dd>{currentLoad} tiết</dd>
                  </div>
                  <div>
                    <dt>Dự kiến thêm</dt>
                    <dd>+{addedLoad} tiết</dd>
                  </div>
                  <div>
                    <dt>Kiêm nhiệm hiện có</dt>
                    <dd>{currentDutyLoad} tiết</dd>
                  </div>
                  <div>
                    <dt>Kiêm nhiệm bổ sung</dt>
                    <dd>+{addedDutyLoad} tiết</dd>
                  </div>
                </dl>
              </div>
            </Panel>
            <Panel title="Cảnh báo & ràng buộc">
              <div className="padded">
                {totalLoad > teacher.quota && (
                  <Alert title={`Vượt định mức ${totalLoad - teacher.quota} tiết`} tone="amber">
                    Cần Ban Giám hiệu xem xét tải giảng dạy dự kiến.
                  </Alert>
                )}
                {conflicts.length > 0 && (
                  <Alert title="Phát hiện trùng lớp/môn" tone="red">
                    Có {conflicts.length} phân công đang giao nhau trong khoảng hiệu lực. Vui lòng
                    điều chỉnh lớp đã chọn.
                  </Alert>
                )}
                {!conflicts.length && (
                  <Alert title="Chưa phát hiện trùng phân công" tone="green">
                    Kiểm tra lại thông tin và thời gian hiệu lực trước khi gửi duyệt.
                  </Alert>
                )}
                <DemoNote>
                  Định mức trong dữ liệu mẫu; chưa xác nhận quy định nghiệp vụ chính thức.
                </DemoNote>
              </div>
            </Panel>
          </aside>
        </div>
        <div className="form-action-bar">
          <span>
            <ShieldCheck size={15} />
            {isDirty ? 'Có thay đổi chưa lưu' : 'Sẵn sàng nhập thông tin'}
          </span>
          <div>
            <Button type="submit" variant="secondary" disabled={busy}>
              <Save size={16} />
              Lưu bản nháp
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={handleSubmit(() =>
                notify(
                  conflicts.length
                    ? 'Có trùng phân công. Hãy điều chỉnh lớp/môn.'
                    : 'Các trường bắt buộc hợp lệ. Vui lòng xem thêm cảnh báo định mức.',
                  conflicts.length ? 'error' : 'success',
                ),
              )}
            >
              <CheckCircle2 size={16} />
              Kiểm tra phân công
            </Button>
            <Button
              type="button"
              disabled={busy}
              onClick={handleSubmit((data) => save(data, 'pending'))}
            >
              <Send size={16} />
              Gửi Ban Giám hiệu duyệt
            </Button>
          </div>
        </div>
      </form>
      <Dialog
        open={blocker.state === 'blocked'}
        onOpenChange={() => blocker.state === 'blocked' && blocker.reset()}
        title="Bạn có thay đổi chưa lưu"
        description="Rời khỏi trang sẽ bỏ những thay đổi chưa được lưu trong biểu mẫu."
      >
        <div className="dialog-actions">
          <Button
            variant="secondary"
            onClick={() => blocker.state === 'blocked' && blocker.reset()}
          >
            Tiếp tục chỉnh sửa
          </Button>
          <Button variant="danger" onClick={() => blocker.state === 'blocked' && blocker.proceed()}>
            Rời trang
          </Button>
        </div>
      </Dialog>
    </>
  )
}
