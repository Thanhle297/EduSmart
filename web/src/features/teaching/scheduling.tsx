import { Fragment, useState, type FormEvent } from 'react'
import {
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Eye,
  GraduationCap,
  Plus,
  Printer,
  Send,
  Sparkles,
  Sun,
  Sunset,
  UserRoundPlus,
  UsersRound,
} from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'
import { Link } from 'react-router-dom'
import { useDemo } from '../../app/demo-context'
import { DataTable } from '../../components/data-table/data-table'
import {
  Alert,
  Avatar,
  Badge,
  DemoNote,
  ExportButton,
  Field,
  Metric,
  PageHeader,
  Panel,
} from '../../components/shared/ui'
import { Button } from '../../components/ui/button'
import { Dialog } from '../../components/ui/dialog'
import { DEMO_DATE } from '../../lib/config'
import { addDays, dateLabel, downloadCsv } from '../../lib/utils'
import { canSubstitute, getTeacher } from '../../mocks/selectors'
import type { Substitution, TimetableEntry } from '../../mocks/types'
import { timetableMetadata, timetablePeriodTimes as periodTimes } from '../../mocks/timetable-data'
import { SubstitutionAssistant } from './substitution-assistant'

const timetableSessions = [
  { id: 'morning', label: 'Buổi sáng', time: '07:30 – 11:45', periods: [1, 2, 3, 4, 5], Icon: Sun },
  { id: 'afternoon', label: 'Buổi chiều', time: '13:45 – 17:05', periods: [6, 7, 8, 9], Icon: Sunset },
] as const
const localPeriod = (period: number) => period <= 5 ? period : period - 5
const periodLabel = (period: number) => `${period <= 5 ? 'Sáng' : 'Chiều'} · Tiết ${localPeriod(period)}`
type SessionFilter = 'all' | 'morning' | 'afternoon'
type DisplayEntry = TimetableEntry & { request?: Substitution }

export function TimetablePage() {
  const { state } = useDemo()
  const [mode, setMode] = useState('class')
  const [entity, setEntity] = useState('8A2')
  const [week, setWeek] = useState(0)
  const [session, setSession] = useState<SessionFilter>('all')
  const [detail, setDetail] = useState<DisplayEntry | null>(null)
  const start = addDays(DEMO_DATE, week * 7)
  const dates = Array.from({ length: 6 }, (_, i) => addDays(start, i))
  const requests = state.substitutions.filter((row) => dates.includes(row.date))
  const entries: DisplayEntry[] = state.timetable
    .filter((entry) => !entry.effectiveFrom || dates[entry.day] >= entry.effectiveFrom)
    .map((entry) => ({
          ...entry,
          request: requests.find(
            (s) =>
              s.classId === entry.classId &&
              s.period === entry.period &&
              s.date === dates[entry.day],
          ),
        }))
  for (const request of requests) {
    const day = dates.indexOf(request.date)
    if (
      !entries.some(
        (row) =>
          row.classId === request.classId && row.period === request.period && row.day === day,
      )
    )
      entries.push({
        id: `sub-${request.id}`,
        day,
        period: request.period,
        classId: request.classId,
        subject: request.subject,
        teacherId: request.absentId,
        room: state.classes.find((c) => c.id === request.classId)?.room ?? 'Chưa xác định',
        request,
      })
  }
  const effective = (row: DisplayEntry) => row.request?.replacementId || row.teacherId
  const filtered = entries.filter((row) =>
    mode === 'class'
      ? row.classId === entity
      : mode === 'teacher'
        ? effective(row) === entity
        : row.room === entity,
  )
  const morningCount = filtered.filter((row) => row.period <= 5).length
  const afternoonCount = filtered.filter((row) => row.period > 5).length
  const visibleEntries = filtered.filter((row) =>
    session === 'all' ? true : session === 'morning' ? row.period <= 5 : row.period > 5,
  )
  const options =
    mode === 'class'
      ? state.classes.map((c) => ({ id: c.id, label: `Lớp ${c.name}${c.homeroomTeacher ? ` · GVCN ${c.homeroomTeacher}` : ''}` }))
      : mode === 'teacher'
        ? state.teachers.map((t) => ({ id: t.id, label: t.name }))
        : [...new Set(state.timetable.map((r) => r.room))].sort((a, b) => a.localeCompare(b, 'vi', { numeric: true })).map((room) => ({
            id: room,
            label: room,
          }))
  const changeMode = (value: string) => {
    setMode(value)
    setEntity(
      value === 'class'
        ? '8A2'
        : value === 'teacher'
          ? state.teachers[0].id
          : state.timetable[0].room,
    )
  }
  return (
    <>
      <PageHeader
        eyebrow="CHUYÊN MÔN / THỜI KHÓA BIỂU"
        title="Thời khóa biểu"
        description="Theo dõi lịch học sáng, chiều và những thay đổi trong tuần."
        badge={<Badge tone="blue">Học kỳ 1 · 2026–2027</Badge>}
        actions={
          <>
            <ExportButton
              onClick={() =>
                downloadCsv(
                  'thoi-khoa-bieu.csv',
                  ['Ngày', 'Buổi', 'Tiết', 'Thời gian', 'Lớp', 'Môn', 'Giáo viên', 'Phòng', 'Ghi chú', 'Ô nguồn'],
                  visibleEntries.map((r) => [
                    dates[r.day],
                    r.period <= 5 ? 'Sáng' : 'Chiều',
                    localPeriod(r.period),
                    periodTimes[r.period - 1],
                    r.classId,
                    r.subject,
                    getTeacher(state, effective(r))?.name ?? 'Chưa ghi giáo viên',
                    r.room,
                    r.note ?? '',
                    r.source ?? '',
                  ]),
                )
              }
            />
            <Button variant="secondary" onClick={() => window.print()}>
              <Printer size={16} />
              In thời khóa biểu
            </Button>
          </>
        }
      />
      {filtered.some((row) => row.request?.status === 'unassigned') && (
        <Alert
          title="Có tiết học đang cần bố trí giáo viên dạy thay"
          tone="amber"
          action={
            <Button variant="secondary" size="sm" asChild>
              <Link to="/teaching/substitutions">
                Xem yêu cầu
                <ArrowRight size={14} />
              </Link>
            </Button>
          }
        >
          Kiểm tra danh sách điều phối trước khi đối chiếu lịch.
        </Alert>
      )}
      <div className="toolbar-panel timetable-toolbar">
        <div className="segmented" role="group" aria-label="Xem thời khóa biểu theo">
          {[
            ['class', 'Theo lớp'],
            ['teacher', 'Theo giáo viên'],
            ['room', 'Theo phòng'],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              aria-pressed={mode === value}
              className={mode === value ? 'selected' : ''}
              onClick={() => changeMode(value)}
            >
              {label}
            </button>
          ))}
        </div>
        <select
          aria-label="Đối tượng thời khóa biểu"
          value={entity}
          onChange={(e) => setEntity(e.target.value)}
        >
          {mode === 'class' ? ['6', '7', '8', '9'].map((grade) => (
            <optgroup key={grade} label={`Khối ${grade}`}>
              {options.filter((option) => option.id.startsWith(grade)).map((option) => (
                <option key={option.id} value={option.id}>{option.label}</option>
              ))}
            </optgroup>
          )) : options.map((option) => (
            <option key={option.id} value={option.id}>{option.label}</option>
          ))}
        </select>
        <div className="toolbar-spacer" />
        <div className="week-picker">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Xem tuần trước"
            onClick={() => setWeek(week - 1)}
          >
            <ChevronLeft size={17} />
          </Button>
          <span>
            {dateLabel(start)} – {dateLabel(dates[5])}
          </span>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Xem tuần sau"
            onClick={() => setWeek(week + 1)}
          >
            <ChevronRight size={17} />
          </Button>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setWeek(0)}>
          Tuần hiện tại
        </Button>
      </div>
      <Panel className="timetable-panel">
        <div className="timetable-overview">
          <div className="timetable-entity">
            <span className="timetable-entity-icon"><CalendarDays size={21} /></span>
            <div>
              <h2>{options.find((option) => option.id === entity)?.label.split(' · ')[0]}</h2>
              <p>{filtered.length} tiết trong tuần <span>·</span> Thứ Hai – Thứ Bảy</p>
            </div>
          </div>
          <div className="timetable-session-tabs" role="group" aria-label="Lọc theo buổi học">
            {([
              ['all', 'Cả ngày', filtered.length],
              ['morning', 'Sáng', morningCount],
              ['afternoon', 'Chiều', afternoonCount],
            ] as const).map(([value, label, count]) => (
              <button
                key={value}
                type="button"
                aria-pressed={session === value}
                className={session === value ? 'selected' : ''}
                onClick={() => setSession(value)}
              >
                {value === 'morning' && <Sun size={14} />}
                {value === 'afternoon' && <Sunset size={14} />}
                {label}<span>{count}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="table-scroll">
          <table className="timetable" aria-label="Thời khóa biểu sáng và chiều trong tuần">
            <thead>
              <tr>
                <th scope="col">Tiết / Giờ học</th>
                {dates.map((date, i) => (
                  <th scope="col" key={date} className={date === DEMO_DATE ? 'today-column' : ''}>
                    <strong>
                      {['Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'][i]}
                    </strong>
                    <span>{dateLabel(date).slice(0, 5)}{date === DEMO_DATE && <em>Ngày mẫu</em>}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {timetableSessions.filter((item) => session === 'all' || item.id === session).map(({ id, label, time, periods, Icon }) => (
                <Fragment key={id}>
                  {id === 'afternoon' && session === 'all' && (
                    <tr className="timetable-lunch">
                      <td colSpan={7}><Clock3 size={13} /> Nghỉ trưa <span>11:45 – 13:45</span></td>
                    </tr>
                  )}
                  <tr className={`timetable-section session-${id}`}>
                    <td colSpan={7}>
                      <div>
                        <span><Icon size={17} /><strong>{label}</strong><small>{time}</small></span>
                        <span>{id === 'morning' ? morningCount : afternoonCount} tiết học</span>
                      </div>
                    </td>
                  </tr>
              {periods.map((period) => (
                <tr key={period}>
                  <th scope="row" className="period-label">
                    <strong>Tiết {localPeriod(period)}</strong>
                    <small>{periodTimes[period - 1]}</small>
                  </th>
                  {dates.map((date, day) => {
                    const rows = filtered.filter((r) => r.day === day && r.period === period)
                    return (
                      <td key={date} className={date === DEMO_DATE ? 'timetable-reference-day' : ''}>
                        {rows.length ? (
                          rows.map((entry) => (
                            <button
                              key={entry.id}
                              type="button"
                              onClick={() => setDetail(entry)}
                              className={`lesson-card ${entry.request?.status === 'unassigned' ? 'lesson-warning' : entry.request ? 'lesson-substitute' : ''}`}
                            >
                              <strong>{entry.subject}</strong>
                              {entry.request && (
                                <Badge
                                  tone={entry.request.status === 'unassigned' ? 'red' : 'teal'}
                                >
                                  {entry.request.status === 'unassigned'
                                    ? 'Cần dạy thay'
                                    : 'Dạy thay'}
                                </Badge>
                              )}
                              <span>{getTeacher(state, effective(entry))?.name ?? 'Chưa ghi giáo viên'}</span>
                              <small>
                                {mode !== 'class' ? `Lớp ${entry.classId} · ` : ''}
                                {entry.room}
                              </small>
                              {entry.note && <small>{entry.note}</small>}
                            </button>
                          ))
                        ) : (
                          <span className="empty-lesson">Trống tiết</span>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
        <div className="schedule-bottom">
          <span>
            <i className="legend-blue" />
            Tiết tiêu chuẩn
          </span>
          <span>
            <i className="legend-teal" />
            Giáo viên dạy thay
          </span>
          <span>
            <i className="legend-amber" />
            Cần điều phối
          </span>
          <strong>{visibleEntries.length} tiết đang hiển thị</strong>
        </div>
      </Panel>
      <DemoNote>
        Lịch {timetableMetadata.classCount} lớp thuộc 4 khối từ Excel: sáng 5 tiết, chiều 4 tiết.
        Lịch sáng áp dụng từ {dateLabel(timetableMetadata.morningEffectiveFrom)}, lịch chiều từ{' '}
        {dateLabel(timetableMetadata.afternoonEffectiveFrom)}. Hoạt động theo tuần hoặc lớp ghép
        được ghi chú trên từng tiết; không tự suy diễn tuần áp dụng.
      </DemoNote>
      <Dialog open={!!detail} onOpenChange={() => setDetail(null)} title="Chi tiết tiết học" drawer>
        {detail && (
          <>
            <div className="lesson-detail-title">
              <GraduationCap size={32} />
              <h3>{detail.subject}</h3>
              <p>
                Lớp {detail.classId} · {periodLabel(detail.period)}
              </p>
            </div>
            <dl className="detail-list">
              <div>
                <dt>Ngày học</dt>
                <dd>{dateLabel(dates[detail.day], true)}</dd>
              </div>
              <div>
                <dt>Thời gian</dt>
                <dd>{periodTimes[detail.period - 1]}</dd>
              </div>
              <div>
                <dt>Giáo viên</dt>
                <dd>{getTeacher(state, effective(detail))?.name ?? 'Chưa ghi giáo viên'}</dd>
              </div>
              {detail.note && (
                <div><dt>Ghi chú lịch học</dt><dd>{detail.note}</dd></div>
              )}
              {detail.source && (
                <div><dt>Ô nguồn Excel</dt><dd>{detail.source}</dd></div>
              )}
              {detail.sourceText && (
                <div><dt>Nội dung gốc</dt><dd style={{ whiteSpace: 'pre-line' }}>{detail.sourceText}</dd></div>
              )}
              <div>
                <dt>Phòng học</dt>
                <dd>{detail.room}</dd>
              </div>
              {detail.request && (
                <div>
                  <dt>Thông tin điều phối</dt>
                  <dd>{detail.request.reason}</dd>
                </div>
              )}
            </dl>
            <DemoNote>
              Lịch được nhập từ file Excel. Sĩ số, định mức và tổ chuyên môn vẫn là thông tin
              mô phỏng; chưa ghi nhận thực dạy từ sổ đầu bài.
            </DemoNote>
          </>
        )}
      </Dialog>
    </>
  )
}

function SubstitutePicker({ request, onClose }: { request: Substitution; onClose: () => void }) {
  const { state, mutate, busy } = useDemo()
  const candidates = state.teachers.filter(
    (t) => (t.subjects ?? [t.subject]).includes(request.subject) && t.id !== request.absentId,
  )
  const [selected, setSelected] = useState(
    candidates.find((t) => t.id === request.replacementId && canSubstitute(state, t, request.id))?.id ?? '',
  )
  return (
    <Dialog
      open
      onOpenChange={onClose}
      title="AI hỗ trợ & phân công dạy thay"
      description={`${request.subject} · Lớp ${request.classId} · ${periodLabel(request.period)} · ${dateLabel(request.date)}`}
      drawer
    >
      <SubstitutionAssistant request={request} selectedId={selected} onSelect={setSelected} />
      <h3 className="substitution-manual-heading">Danh sách giáo viên cùng môn</h3>
      <div className="teacher-candidates">
        {candidates.length ? (
          candidates.map((teacher) => {
            const available = canSubstitute(state, teacher, request.id)
            return (
              <label
                key={teacher.id}
                className={!available ? 'unavailable' : selected === teacher.id ? 'chosen' : ''}
              >
                <input
                  type="radio"
                  name="replacement"
                  value={teacher.id}
                  disabled={!available}
                  checked={selected === teacher.id}
                  onChange={() => setSelected(teacher.id)}
                />
                <Avatar name={teacher.name} tone={teacher.color} />
                <span>
                  <strong>{teacher.name}</strong>
                  <small>
                    {teacher.department} · {teacher.subject}
                  </small>
                  <Badge tone={available ? 'green' : 'red'}>
                    {available ? 'Trống tiết · có thể phân công' : 'Có lịch hoặc đã báo vắng trong khung giờ'}
                  </Badge>
                </span>
              </label>
            )
          })
        ) : (
          <p className="muted">Chưa có giáo viên phù hợp trong danh mục demo.</p>
        )}
      </div>
      <div className="dialog-actions">
        <Button variant="secondary" onClick={onClose}>
          Hủy bỏ
        </Button>
        <Button
          disabled={busy || !candidates.some((teacher) => teacher.id === selected && canSubstitute(state, teacher, request.id))}
          onClick={async () => {
            if (
              await mutate(
                { type: 'substitution.assign', id: request.id, teacherId: selected },
                'Đã phân công dạy thay trong bản demo. Chưa gửi thông báo thật.',
              )
            )
              onClose()
          }}
        >
          <Send size={16} />
          Xác nhận phân công
        </Button>
      </div>
    </Dialog>
  )
}

function NewSubstitution({ onClose }: { onClose: () => void }) {
  const { state, mutate, busy } = useDemo()
  const [absent, setAbsent] = useState(state.teachers[0].id)
  const absentTeacher = getTeacher(state, absent)!
  const create = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const substitution: Substitution = {
      id: crypto.randomUUID(),
      date: String(form.get('date')),
      period: Number(form.get('period')),
      classId: String(form.get('classId')),
      absentId: absent,
      subject: String(form.get('subject')),
      reason: String(form.get('reason')),
      replacementId: '',
      status: 'unassigned',
    }
    if (await mutate({ type: 'substitution.create', substitution }, 'Đã tạo yêu cầu dạy thay.'))
      onClose()
  }
  return (
    <Dialog open onOpenChange={onClose} title="Tạo yêu cầu dạy thay">
      <form onSubmit={create}>
        <div className="form-grid">
          <Field label="Giáo viên vắng *">
            <select value={absent} onChange={(e) => setAbsent(e.target.value)}>
              {state.teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Môn học">
            <select name="subject" key={absent} defaultValue={absentTeacher.subject}>
              {(absentTeacher.subjects ?? [absentTeacher.subject]).map((subject) => (
                <option key={subject} value={subject}>{subject}</option>
              ))}
            </select>
          </Field>
          <Field label="Ngày dạy *">
            <input required name="date" type="date" defaultValue={DEMO_DATE} />
          </Field>
          <Field label="Tiết học *">
            <select name="period">
              {timetableSessions.map(({ id, label, periods }) => (
                <optgroup key={id} label={label}>
                  {periods.map((n) => (
                    <option key={n} value={n}>{periodLabel(n)} · {periodTimes[n - 1]}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </Field>
          <Field label="Lớp học *">
            <select name="classId">
              {state.classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="Lý do dạy thay *">
          <textarea required name="reason" rows={3} />
        </Field>
        <div className="dialog-actions">
          <Button type="button" variant="secondary" onClick={onClose}>
            Hủy
          </Button>
          <Button type="submit" disabled={busy}>
            Tạo yêu cầu
          </Button>
        </div>
      </form>
    </Dialog>
  )
}

export function SubstitutionsPage() {
  const { state, mutate, busy } = useDemo()
  const [status, setStatus] = useState('all')
  const [time, setTime] = useState('all')
  const [request, setRequest] = useState<Substitution | null>(null)
  const [creating, setCreating] = useState(false)
  const [confirm, setConfirm] = useState<Substitution | null>(null)
  const [view, setView] = useState<Substitution | null>(null)
  const pending = state.substitutions.filter((s) => s.status === 'unassigned')
  const labels = {
    unassigned: 'Chưa phân công',
    assigned: 'Chờ xác nhận',
    confirmed: 'Đã xác nhận thực dạy',
  }
  const data = state.substitutions.filter(
    (s) =>
      (status === 'all' || s.status === status) &&
      (time === 'all' ||
        (time === 'today'
          ? s.date === DEMO_DATE
          : s.date >= DEMO_DATE && s.date <= addDays(DEMO_DATE, 5))),
  )
  const columns: ColumnDef<Substitution>[] = [
    {
      accessorKey: 'date',
      header: 'NGÀY & TIẾT',
      cell: ({ row }) => (
        <div className="cell-stack">
          <strong>{dateLabel(row.original.date)}</strong>
          <small>
            {periodLabel(row.original.period)} · {periodTimes[row.original.period - 1]}
          </small>
        </div>
      ),
    },
    {
      accessorKey: 'classId',
      header: 'LỚP / MÔN HỌC',
      cell: ({ row }) => (
        <div className="cell-stack">
          <strong>Lớp {row.original.classId}</strong>
          <small>{row.original.subject}</small>
        </div>
      ),
    },
    {
      id: 'absent',
      header: 'GIÁO VIÊN VẮNG',
      accessorFn: (s) => getTeacher(state, s.absentId)?.name,
      cell: ({ row }) => (
        <div className="cell-stack">
          <strong>{getTeacher(state, row.original.absentId)?.name}</strong>
          <small>{row.original.reason}</small>
        </div>
      ),
    },
    {
      id: 'replacement',
      header: 'GIÁO VIÊN DẠY THAY',
      accessorFn: (s) => getTeacher(state, s.replacementId)?.name ?? 'Chưa gán',
      cell: ({ row }) =>
        row.original.replacementId ? (
          <div className="person-cell">
            <Avatar name={getTeacher(state, row.original.replacementId)!.name} small />
            <span>{getTeacher(state, row.original.replacementId)!.name}</span>
          </div>
        ) : (
          <span className="muted">Chưa chỉ định</span>
        ),
    },
    {
      accessorKey: 'status',
      header: 'TRẠNG THÁI',
      cell: ({ row }) => (
        <Badge
          tone={
            row.original.status === 'confirmed'
              ? 'green'
              : row.original.status === 'assigned'
                ? 'blue'
                : 'amber'
          }
        >
          {labels[row.original.status]}
        </Badge>
      ),
    },
    {
      id: 'actions',
      header: 'ĐIỀU PHỐI',
      cell: ({ row }) =>
        row.original.status === 'confirmed' ? (
          <Button size="sm" variant="ghost" onClick={() => setView(row.original)}>
            <Eye size={14} />
            Xem xác nhận
          </Button>
        ) : row.original.status === 'assigned' ? (
          <div className="row-actions">
            <Button size="sm" variant="soft" onClick={() => setConfirm(row.original)}>
              Xác nhận demo
            </Button>
            <Button
              size="icon"
              variant="ghost"
              aria-label="Đổi giáo viên dạy thay"
              onClick={() => setRequest(row.original)}
            >
              <UserRoundPlus size={16} />
            </Button>
          </div>
        ) : (
          <Button size="sm" variant="soft" onClick={() => setRequest(row.original)}>
            <Sparkles size={14} />
            AI hỗ trợ phân công
          </Button>
        ),
    },
  ]
  return (
    <>
      <PageHeader
        eyebrow="CHUYÊN MÔN / ĐIỀU PHỐI"
        title="Quản lý & phân công dạy thay"
        description="AI gợi ý giáo viên theo chuyên môn, lịch trống và tải giảng dạy; theo dõi phân công và xác nhận thực dạy."
        badge={<Badge tone="amber">{pending.length} tiết cần điều phối</Badge>}
        actions={
          <Button onClick={() => setCreating(true)}>
            <Plus size={17} />
            Tạo yêu cầu dạy thay
          </Button>
        }
      />
      {pending.length > 0 && (
        <Alert
          title={`Cần điều phối: ${pending[0].subject} · Lớp ${pending[0].classId} · ${periodLabel(pending[0].period)}`}
          tone="amber"
          action={
            <Button size="sm" variant="secondary" onClick={() => setRequest(pending[0])}>
              Phân công ngay
              <ArrowRight size={14} />
            </Button>
          }
        >
          {getTeacher(state, pending[0].absentId)?.name} · {pending[0].reason} ·{' '}
          {dateLabel(pending[0].date)}.
        </Alert>
      )}
      <div className="metrics-grid">
        <Metric
          label="Chưa phân công"
          value={pending.length}
          detail="Cần tìm giáo viên phù hợp"
          icon={AlertTriangle}
          tone="amber"
        />
        <Metric
          label="Đã phân công"
          value={state.substitutions.filter((s) => s.status === 'assigned').length}
          detail="Chờ xác nhận thực dạy"
          icon={UsersRound}
        />
        <Metric
          label="Đã xác nhận thực dạy"
          value={state.substitutions.filter((s) => s.status === 'confirmed').length}
          detail="Được đưa vào đối soát demo"
          icon={CheckCircle2}
          tone="green"
        />
        <Metric
          label="Tổng yêu cầu"
          value={state.substitutions.length}
          detail="Toàn bộ dữ liệu mẫu"
          icon={Clock3}
          tone="teal"
        />
      </div>
      <Panel
        title="Danh sách yêu cầu dạy thay"
        action={
          <select
            aria-label="Lọc thời gian dạy thay"
            value={time}
            onChange={(e) => setTime(e.target.value)}
          >
            <option value="all">Tất cả thời gian</option>
            <option value="today">Hôm nay (ngày demo)</option>
            <option value="week">Tuần demo hiện tại</option>
          </select>
        }
      >
        <div className="tabs-toolbar">
          {[
            ['all', 'Tất cả'],
            ['unassigned', 'Chưa phân công'],
            ['assigned', 'Đã phân công'],
            ['confirmed', 'Đã xác nhận'],
          ].map(([value, label]) => (
            <button
              key={value}
              className={status === value ? 'active' : ''}
              onClick={() => setStatus(value)}
            >
              {label}
              <span>
                {value === 'all'
                  ? state.substitutions.length
                  : state.substitutions.filter((s) => s.status === value).length}
              </span>
            </button>
          ))}
        </div>
        <DataTable
          key={`${time}-${status}`}
          data={data}
          columns={columns}
          searchPlaceholder="Tìm lớp, môn hoặc giáo viên..."
        />
      </Panel>
      {request && (
        <SubstitutePicker key={request.id} request={request} onClose={() => setRequest(null)} />
      )}
      {creating && <NewSubstitution onClose={() => setCreating(false)} />}
      <Dialog
        open={!!confirm}
        onOpenChange={() => setConfirm(null)}
        title="Xác nhận đã thực dạy?"
        description="Chỉ ghi nhận một lần vào dữ liệu đối soát demo, không ký sổ đầu bài thật."
      >
        <p className="dialog-paragraph">
          {confirm && getTeacher(state, confirm.replacementId)?.name} · Lớp {confirm?.classId} ·
          {confirm && periodLabel(confirm.period)}.
        </p>
        <div className="dialog-actions">
          <Button variant="secondary" onClick={() => setConfirm(null)}>
            Hủy
          </Button>
          <Button
            disabled={busy}
            onClick={async () => {
              if (
                confirm &&
                (await mutate(
                  { type: 'substitution.confirm', id: confirm.id },
                  'Đã ghi nhận thực dạy một lần vào đối soát demo.',
                ))
              )
                setConfirm(null)
            }}
          >
            <CheckCircle2 size={16} />
            Xác nhận thực dạy
          </Button>
        </div>
      </Dialog>
      <Dialog open={!!view} onOpenChange={() => setView(null)} title="Xác nhận thực dạy mô phỏng">
        <div className="success-state">
          <CheckCircle2 size={32} />
          <h3>Đã ghi nhận tiết dạy thay</h3>
          <p>
            {view && getTeacher(state, view.replacementId)?.name} · Lớp {view?.classId} ·{' '}
            {view && periodLabel(view.period)}
          </p>
          <DemoNote>Không có chữ ký số hoặc minh chứng thực tế trong bản demo.</DemoNote>
        </div>
      </Dialog>
    </>
  )
}
