import { useState } from 'react'
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  Edit3,
  FileCheck2,
  GraduationCap,
  Plus,
  ShieldCheck,
  UsersRound,
} from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import type { ColumnDef } from '@tanstack/react-table'
import { useDemo } from '../../app/demo-context'
import { DataTable } from '../../components/data-table/data-table'
import {
  Alert,
  Avatar,
  Badge,
  DemoNote,
  Field,
  Metric,
  PageHeader,
  Panel,
  Progress,
  StatusBadge,
  TextLink,
  Timeline,
} from '../../components/shared/ui'
import { Button } from '../../components/ui/button'
import { Dialog } from '../../components/ui/dialog'
import { assignedDutyPeriods, assignedPeriods, dutyLoad, getTeacher, teachingLoad } from '../../mocks/selectors'
import type { Assignment } from '../../mocks/types'

export function TeachingOverviewPage() {
  const { state } = useDemo()
  const approved = state.assignments.filter((a) => a.status === 'approved').length
  const total = state.assignments.reduce((sum, a) => sum + assignedPeriods(a) + assignedDutyPeriods(a), 0)
  const overloaded = state.teachers.filter((t) => teachingLoad(state, t.id) + dutyLoad(state, t.id) > t.quota)
  const departments = [...new Set(state.teachers.map((t) => t.department))]
  const awaitingClasses = state.classes.filter((cls) =>
    state.assignments.some((a) => a.status === 'pending' && a.classIds.includes(cls.id)),
  )
  return (
    <>
      <PageHeader
        eyebrow="CHUYÊN MÔN / TỔNG QUAN"
        title="Phân công giảng dạy"
        description="Cân đối đội ngũ, khối lượng giảng dạy và tiến độ phân công toàn trường."
        actions={
          <>
            <Button variant="secondary" asChild>
              <Link to="/teaching/approvals/plan-hk1">
                <ShieldCheck size={16} />
                Kiểm tra & phê duyệt
              </Link>
            </Button>
            <Button asChild>
              <Link to="/teaching/assignments/new">
                <Plus size={17} />
                Tạo phân công
              </Link>
            </Button>
          </>
        }
      />
      <div className="metrics-grid metrics-five">
        <Metric
          label="Tổng giáo viên"
          value={state.teachers.length}
          detail="Trong danh mục demo"
          icon={UsersRound}
        />
        <Metric
          label="Tổng số lớp"
          value={state.classes.length}
          detail="Khối 6, 7, 8 và 9"
          icon={GraduationCap}
          tone="teal"
        />
        <Metric
          label="Đã phê duyệt"
          value={`${Math.round((approved / state.assignments.length) * 100)}%`}
          detail={`${approved}/${state.assignments.length} bản phân công`}
          icon={CheckCircle2}
          tone="green"
        />
        <Metric
          label="Tiết dự kiến / tuần"
          value={total}
          detail="Gồm cả phân công dự thảo"
          icon={ClipboardList}
          tone="purple"
        />
        <Metric
          label="Cần cân đối tải"
          value={overloaded.length}
          detail="Giáo viên vượt định mức mẫu"
          icon={AlertTriangle}
          tone="amber"
        />
      </div>
      <div className="dashboard-columns">
        <div className="dashboard-primary">
          <Panel
            title="Phân bổ giảng dạy theo tổ chuyên môn"
            description="Theo dõi định mức và tiến độ xét duyệt trong học kỳ"
            action={<TextLink to="/teaching/assignments">Xem bảng phân công</TextLink>}
          >
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>TỔ CHUYÊN MÔN</th>
                    <th>SỐ GV</th>
                    <th>ĐỊNH MỨC MẪU</th>
                    <th>ĐÃ PHÂN CÔNG</th>
                    <th>TIẾN ĐỘ DUYỆT</th>
                  </tr>
                </thead>
                <tbody>
                  {departments.map((department) => {
                    const teachers = state.teachers.filter((t) => t.department === department)
                    const rows = state.assignments.filter((a) =>
                      teachers.some((t) => t.id === a.teacherId),
                    )
                    const approvedRows = rows.filter((a) => a.status === 'approved')
                    return (
                      <tr key={department}>
                        <td>
                          <strong>{department}</strong>
                          <small>
                            {teachers
                              .map((t) => t.subject)
                              .filter((v, i, all) => all.indexOf(v) === i)
                              .join(' · ')}
                          </small>
                        </td>
                        <td>{teachers.length}</td>
                        <td>{teachers.reduce((sum, t) => sum + t.quota, 0)} tiết</td>
                        <td>
                          <strong>
                            {rows.reduce((sum, a) => sum + assignedPeriods(a) + assignedDutyPeriods(a), 0)} tiết
                          </strong>
                        </td>
                        <td>
                          <div className="table-progress">
                            <Progress
                              value={rows.length ? (approvedRows.length / rows.length) * 100 : 0}
                              tone="teal"
                            />
                            <span>
                              {approvedRows.length}/{rows.length}
                            </span>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Panel>
          <Panel
            title="Tiến độ theo từng khối lớp"
            description="Tỷ lệ bản phân công đã duyệt trong từng khối"
          >
            <div className="grade-grid">
              {['6', '7', '8', '9'].map((grade) => {
                const rows = state.assignments.filter((a) =>
                  a.classIds.some((id) => id.startsWith(grade)),
                )
                const done = rows.filter((a) => a.status === 'approved').length
                const value = rows.length ? Math.round((done / rows.length) * 100) : 0
                return (
                  <div key={grade}>
                    <span>
                      Khối {grade}
                      <Badge tone={value === 100 ? 'green' : 'blue'}>
                        {state.classes.filter((cls) => cls.grade === grade).length} lớp
                      </Badge>
                    </span>
                    <strong>{value}%</strong>
                    <Progress value={value} tone={value === 100 ? 'green' : 'blue'} />
                    <small>
                      {done}/{rows.length} bản phân công đã duyệt
                    </small>
                  </div>
                )
              })}
            </div>
          </Panel>
        </div>
        <aside className="dashboard-secondary">
          <Panel title="Cảnh báo định mức" icon={AlertTriangle}>
            <div className="workload-alert-list" role="region" aria-label="Danh sách cảnh báo định mức" tabIndex={0}>
              {overloaded.map((teacher) => (
                <Alert key={teacher.id} title={teacher.name} tone="amber">
                  Tải dự kiến {teachingLoad(state, teacher.id) + dutyLoad(state, teacher.id)}/{teacher.quota}{' '}
                  tiết mỗi tuần.
                  <Link to="/teaching/assignments" className="alert-link">
                    Đối chiếu phân công <ArrowRight size={12} />
                  </Link>
                </Alert>
              ))}
            </div>
          </Panel>
          <Panel
            title="Lớp có hồ sơ chờ duyệt"
            action={<Badge tone="amber">{awaitingClasses.length} lớp</Badge>}
          >
            <div className="pending-class-list">
              {awaitingClasses.slice(0, 5).map((cls) => (
                <Link key={cls.id} to="/teaching/approvals/plan-hk1">
                  <span className="class-icon">{cls.name}</span>
                  <span>
                    <strong>Lớp {cls.name}</strong>
                    <small>
                      {cls.students} học sinh · Phòng {cls.room}
                    </small>
                  </span>
                  <ArrowRight size={15} />
                </Link>
              ))}
            </div>
          </Panel>
          <DemoNote>Các chỉ số được tính từ cùng bộ dữ liệu với bảng phân công.</DemoNote>
        </aside>
      </div>
    </>
  )
}

export function TeachingApprovalPage() {
  const { planId } = useParams()
  const { state, mutate, busy } = useDemo()
  const [decision, setDecision] = useState<'approved' | 'revision_requested' | null>(null)
  const [note, setNote] = useState('')
  const [acknowledge, setAcknowledge] = useState(false)
  const [onlyPending, setOnlyPending] = useState(false)
  if (planId !== 'plan-hk1')
    return (
      <Panel>
        <div className="empty-state">
          <h1>Không tìm thấy kế hoạch</h1>
          <p>Mã hồ sơ không tồn tại trong dữ liệu demo.</p>
          <Button asChild>
            <Link to="/teaching/assignments">Về bảng phân công</Link>
          </Button>
        </div>
      </Panel>
    )
  const overloaded = state.teachers.filter((t) => teachingLoad(state, t.id) + dutyLoad(state, t.id) > t.quota)
  const total = state.assignments.reduce((sum, a) => sum + assignedPeriods(a) + assignedDutyPeriods(a), 0)
  const columns: ColumnDef<Assignment>[] = [
    {
      id: 'teacher',
      header: 'GIÁO VIÊN / BỘ MÔN',
      accessorFn: (a) => getTeacher(state, a.teacherId)?.name,
      cell: ({ row }) => {
        const teacher = getTeacher(state, row.original.teacherId)!
        return (
          <div className="person-cell">
            <Avatar name={teacher.name} tone={teacher.color} />
            <div>
              <strong>{teacher.name}</strong>
              <small>{row.original.subject}</small>
            </div>
          </div>
        )
      },
    },
    {
      header: 'LỚP ĐẢM NHIỆM',
      accessorFn: (a) => a.classIds.join(', '),
      id: 'classes',
      cell: ({ row }) => (
        <div className="class-chips">
          {row.original.classIds.map((id) => (
            <span key={id}>{id}</span>
          ))}
        </div>
      ),
    },
    {
      header: 'ĐỊNH MỨC MẪU',
      id: 'quota',
      accessorFn: (a) => getTeacher(state, a.teacherId)?.quota,
      cell: ({ getValue }) => `${getValue()} tiết`,
    },
    {
      header: 'TẢI DỰ KIẾN',
      id: 'load',
      accessorFn: (a) =>
        teachingLoad(state, a.teacherId) + dutyLoad(state, a.teacherId),
      cell: ({ getValue }) => <strong>{String(getValue())} tiết</strong>,
    },
    {
      header: 'KIÊM NHIỆM BỔ SUNG',
      id: 'additionalDuties',
      accessorFn: (assignment) => (assignment.additionalDuties ?? [])
        .map((duty) => `${duty.name} (${duty.periods} tiết)`).join('; ') || '—',
    },
    {
      header: 'TRẠNG THÁI',
      accessorKey: 'status',
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
  ]
  const openDecision = (value: typeof decision) => {
    setNote('')
    setAcknowledge(false)
    setDecision(value)
  }
  return (
    <>
      <PageHeader
        eyebrow="CHUYÊN MÔN / HỒ SƠ PHÊ DUYỆT"
        title="Kiểm tra & phê duyệt phân công giảng dạy"
        description="Kế hoạch học kỳ I · Người lập: Thầy Trần Văn Nam · Mã: PCGD-HK1-2026"
        badge={<StatusBadge status={state.planStatus} />}
        actions={
          state.planStatus === 'pending' ? (
            <>
              <Button variant="secondary" onClick={() => openDecision('revision_requested')}>
                <Edit3 size={16} />
                Yêu cầu chỉnh sửa
              </Button>
              <Button onClick={() => openDecision('approved')}>
                <ShieldCheck size={16} />
                Phê duyệt kế hoạch
              </Button>
            </>
          ) : undefined
        }
      />
      <div className="workflow-steps">
        {['Dự thảo', 'Chờ BGH duyệt', 'Đã phê duyệt', 'Có hiệu lực'].map((label, i) => (
          <div
            key={label}
            className={(state.planStatus === 'approved' ? i <= 2 : i <= 1) ? 'is-current' : ''}
          >
            <span>{i === 0 ? <CheckCircle2 size={17} /> : i + 1}</span>
            <strong>{label}</strong>
            <small>
              {i === 3
                ? 'Chưa ban hành thật'
                : i === 2
                  ? 'Phê duyệt mô phỏng'
                  : 'Kế hoạch học kỳ I'}
            </small>
          </div>
        ))}
      </div>
      <div className="metrics-grid metrics-three">
        <Metric
          label="Tổng tiết phân công"
          value={`${total} tiết`}
          detail="Mỗi tuần · Tải dự kiến"
          icon={GraduationCap}
        />
        <Metric
          label="Giáo viên trong kế hoạch"
          value={new Set(state.assignments.map((a) => a.teacherId)).size}
          detail="Trong bộ dữ liệu demo"
          icon={UsersRound}
          tone="teal"
        />
        <Metric
          label="Cảnh báo tải giảng dạy"
          value={overloaded.length}
          detail="Cần xem xét trước khi duyệt"
          icon={AlertTriangle}
          tone="amber"
        />
      </div>
      {overloaded.map((teacher) => (
        <Alert
          key={teacher.id}
          title={`${teacher.name} vượt định mức mẫu ${teachingLoad(state, teacher.id) + dutyLoad(state, teacher.id) - teacher.quota} tiết`}
          tone="amber"
          action={
            <Button variant="secondary" size="sm" asChild>
              <Link to="/teaching/assignments">Xem phân công</Link>
            </Button>
          }
        >
          Tải dự kiến {teachingLoad(state, teacher.id) + dutyLoad(state, teacher.id)}/{teacher.quota}{' '}
          tiết/tuần. Cần xác nhận cân đối chuyên môn; không tự suy diễn chế độ chi trả.
        </Alert>
      ))}
      <Panel
        title="Bảng đối chiếu phân công hiện tại"
        description="Dữ liệu của kế hoạch trong phiên demo, không phải so sánh với hồ sơ kỳ trước."
        action={
          <div className="segmented">
            <button
              className={!onlyPending ? 'selected' : ''}
              onClick={() => setOnlyPending(false)}
            >
              Tất cả
            </button>
            <button className={onlyPending ? 'selected' : ''} onClick={() => setOnlyPending(true)}>
              Chờ duyệt
            </button>
          </div>
        }
      >
        <DataTable
          columns={columns}
          data={state.assignments.filter((a) => !onlyPending || a.status === 'pending')}
        />
      </Panel>
      <div className="content-columns">
        <Panel title="Lịch sử xét duyệt" icon={FileCheck2}>
          <Timeline entityId="plan-hk1" />
        </Panel>
        <Panel title="Thông tin kiểm tra" icon={ShieldCheck}>
          <div className="padded">
            <Alert title="Tách biệt duyệt và ban hành" tone="blue">
              Phê duyệt trong bản demo không thực hiện ký số và không tự ban hành thời khóa biểu
              chính thức.
            </Alert>
            <DemoNote>
              Quy tắc phân công và định mức phải được nhà trường xác nhận trước tích hợp thật.
            </DemoNote>
          </div>
        </Panel>
      </div>
      <Dialog
        open={decision !== null}
        onOpenChange={() => setDecision(null)}
        title={decision === 'approved' ? 'Phê duyệt kế hoạch?' : 'Yêu cầu chỉnh sửa kế hoạch'}
      >
        <form
          onSubmit={async (e) => {
            e.preventDefault()
            if (
              decision &&
              (await mutate(
                { type: 'plan.decide', decision, note, acknowledge },
                decision === 'approved'
                  ? 'Đã phê duyệt kế hoạch trong bản demo.'
                  : 'Đã chuyển các phân công chờ duyệt sang yêu cầu sửa.',
              ))
            )
              setDecision(null)
          }}
        >
          <Field label={decision === 'approved' ? 'Ghi chú xem xét' : 'Lý do yêu cầu chỉnh sửa *'}>
            <textarea
              rows={4}
              required={decision === 'revision_requested'}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </Field>
          {decision === 'approved' && (
            <label className="checkbox-label">
              <input
                type="checkbox"
                required
                checked={acknowledge}
                onChange={(e) => setAcknowledge(e.target.checked)}
              />
              Tôi đã xem cảnh báo định mức và hiểu rằng đây là thao tác mô phỏng, không phải ký
              duyệt thực tế.
            </label>
          )}
          <div className="dialog-actions">
            <Button type="button" variant="secondary" onClick={() => setDecision(null)}>
              Hủy
            </Button>
            <Button type="submit" disabled={busy}>
              <ShieldCheck size={16} />
              {decision === 'approved' ? 'Xác nhận phê duyệt' : 'Gửi yêu cầu chỉnh sửa'}
            </Button>
          </div>
        </form>
      </Dialog>
    </>
  )
}
