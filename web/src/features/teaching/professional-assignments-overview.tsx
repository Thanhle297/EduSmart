import { useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { ArrowRight, ClipboardList, Eye, GraduationCap, Plus, UsersRound } from 'lucide-react'
import { Link } from 'react-router-dom'
import { DataTable } from '../../components/data-table/data-table'
import { Alert, Badge, ExportButton, Metric, PageHeader, Panel } from '../../components/shared/ui'
import { Button } from '../../components/ui/button'
import { Dialog } from '../../components/ui/dialog'
import { dateLabel, downloadCsv } from '../../lib/utils'
import {
  professionalAssignmentMetadata as metadata,
  professionalAssignmentRecords as records,
  type ProfessionalAssignmentRecord,
} from '../../mocks/professional-assignment-data'

const periodsLabel = (value: number | null) => value === null ? '—' : value.toLocaleString('vi-VN')

// The source appends period counts directly to class names and grade numbers.
const readableDuty = (text: string) => text
  .replace(/([6-9]A[1-9])([1-4])/g, '$1 ($2 tiết)')
  .replace(/\b(8,9|[89])([1-3])\b/g, '$1 ($2 tiết)')

export function ProfessionalAssignmentsOverview() {
  const [subject, setSubject] = useState('all')
  const [grade, setGrade] = useState('all')
  const [category, setCategory] = useState('all')
  const [view, setView] = useState<ProfessionalAssignmentRecord | null>(null)
  const subjects = [...new Set(records.flatMap((record) => record.lessons.map((lesson) => lesson.subject)))]
  const filtered = records.filter((record) =>
    record.lessons.some((lesson) =>
      (subject === 'all' || lesson.subject === subject) &&
      (grade === 'all' || lesson.classIds.some((id) => id.startsWith(grade))),
    ) || (subject === 'all' && grade === 'all'),
  ).filter((record) => category === 'all' ||
    (category === 'review' && record.notes.length > 0) ||
    (category === 'duties' && !!record.dutyText) ||
    (category === 'leave' && !!record.statusNote),
  )
  const total = (field: 'teachingPeriods' | 'dutyPeriods' | 'totalPeriods') =>
    records.reduce((sum, record) => sum + (record[field] ?? 0), 0)
  const columns: ColumnDef<ProfessionalAssignmentRecord>[] = [
    { accessorKey: 'order', header: 'STT' },
    {
      accessorKey: 'name', header: 'HỌ VÀ TÊN',
      cell: ({ row }) => <div className="cell-stack">
        <strong>{row.original.name}</strong>
        {row.original.statusNote && <Badge tone="amber">{row.original.statusNote === 'Nghỉ TS' ? 'Nghỉ thai sản' : row.original.statusNote}</Badge>}
      </div>,
    },
    { accessorKey: 'birthYear', header: 'NĂM SINH' },
    { accessorKey: 'position', header: 'CHỨC VỤ' },
    { accessorKey: 'qualification', header: 'TRÌNH ĐỘ CHUYÊN MÔN' },
    {
      id: 'teaching', header: 'PHÂN CÔNG DẠY MÔN / LỚP',
      accessorFn: (record) => record.lessons.map((lesson) => `${lesson.subject} ${lesson.classIds.join(' ')}`).join(' ') || record.teachingText,
      cell: ({ row }) => <div className="assignment-subjects">
        {row.original.lessons.map((lesson, index) => <div key={index}>
          <strong>{lesson.subject} <small>· {periodsLabel(lesson.periods)} tiết/lớp</small></strong>
          <div className="class-chips">{lesson.classIds.map((id) => <span key={id}>{id}</span>)}</div>
        </div>)}
        {!row.original.lessons.length && <span className="muted">Không phân công lớp</span>}
        {row.original.teachingText.includes('PH2') && <small className="muted">Có ghi chú dạy PH2 · xem chi tiết</small>}
      </div>,
    },
    {
      accessorKey: 'teachingPeriods', header: 'TIẾT THỰC DẠY',
      cell: ({ row }) => <strong>{periodsLabel(row.original.teachingPeriods)}</strong>,
    },
    {
      id: 'duties', header: 'KIÊM NHIỆM, BỒI DƯỠNG VÀ CÔNG TÁC KHÁC',
      accessorFn: (record) => readableDuty(record.dutyText),
      cell: ({ getValue }) => <div className="assignment-source-text">{getValue<string>() || '—'}</div>,
    },
    {
      accessorKey: 'dutyPeriods', header: 'TIẾT KIÊM NHIỆM',
      cell: ({ row }) => periodsLabel(row.original.dutyPeriods),
    },
    {
      accessorKey: 'totalPeriods', header: 'TỔNG TIẾT / TUẦN',
      cell: ({ row }) => <strong className="teal-text">{periodsLabel(row.original.totalPeriods)}</strong>,
    },
    {
      id: 'notes', header: 'ĐỐI CHIẾU',
      accessorFn: (record) => record.notes.join(' '),
      cell: ({ row }) => row.original.notes.length
        ? <Badge tone="amber">{row.original.notes.length} lưu ý</Badge>
        : <span className="muted">—</span>,
    },
    {
      id: 'actions', header: 'CHI TIẾT',
      cell: ({ row }) => <Button variant="ghost" size="icon" aria-label={`Xem hồ sơ ${row.original.name}`} onClick={() => setView(row.original)}><Eye size={16} /></Button>,
    },
  ]
  return <>
    <PageHeader
      eyebrow="CHUYÊN MÔN / PHÂN CÔNG"
      title="Bảng phân công chuyên môn"
      description={`${metadata.school} · ${metadata.scope} · Thực hiện từ ${dateLabel(metadata.effectiveFrom)}`}
      badge={<Badge tone="teal">{metadata.semester} · {metadata.schoolYear}</Badge>}
      actions={<>
        <ExportButton onClick={() => downloadCsv(
          'phan-cong-chuyen-mon-hki-2026-2027.csv',
          ['STT', 'STT trong file', 'Họ và tên', 'Năm sinh', 'Chức vụ', 'Trình độ chuyên môn', 'Phân công dạy môn/lớp', 'Số tiết thực dạy', 'Công tác kiêm nhiệm, bồi dưỡng và công tác khác', 'Số tiết kiêm nhiệm', 'Tổng số tiết/tuần', 'Ghi chú', 'Lưu ý đối chiếu'],
          filtered.map((record) => [
            record.order, record.sourceNumber, record.name, record.birthYear, record.position,
            record.qualification,
            record.lessons.map((lesson) => `${lesson.subject}: ${lesson.classIds.join(', ')} (${periodsLabel(lesson.periods)} tiết/lớp)`).join('\n') + (record.teachingText.includes('PH2') ? `\nGhi chú gốc: ${record.teachingText}` : ''),
            record.teachingPeriods ?? '', readableDuty(record.dutyText), record.dutyPeriods ?? '',
            record.totalPeriods ?? '', record.statusNote, record.notes.join('\n'),
          ]),
        )} />
        <Button variant="secondary" asChild><Link to="/teaching/assignments?view=lessons"><ClipboardList size={16} />Chi tiết môn/lớp</Link></Button>
        <Button asChild><Link to="/teaching/assignments/new"><Plus size={16} />Thêm phân công</Link></Button>
      </>}
    />
    <div className="metrics-grid">
      <Metric label="Cán bộ, giáo viên" value={records.length} detail="Đủ hồ sơ trong file phân công" icon={UsersRound} />
      <Metric label="Tiết thực dạy / tuần" value={periodsLabel(total('teachingPeriods'))} detail="Cộng cột số tiết thực dạy trong file" icon={GraduationCap} tone="teal" />
      <Metric label="Tổng tiết / tuần" value={periodsLabel(total('totalPeriods'))} detail="Cộng cột tổng trong file; giữ nguyên chênh lệch" icon={ClipboardList} tone="purple" />
      <Metric label="Hồ sơ có lưu ý" value={records.filter((record) => record.notes.length).length} detail="Số liệu, STT hoặc ghi chú PH2 cần đối chiếu" icon={Eye} tone="amber" />
    </div>
    <Alert title="Bảng tổng hợp theo tài liệu gốc" tone="blue">
      Số tiết thực dạy, kiêm nhiệm và tổng tiết được giữ theo file Word. Dấu — là ô trống trong file.
      STT hiển thị được đánh liên tục; số thứ tự gốc và những điểm chưa khớp nằm trong chi tiết.
      Các điều chỉnh trên ứng dụng được quản lý tại mục Chi tiết môn/lớp.
    </Alert>
    <div className="toolbar-panel filter-toolbar">
      <label className="inline-field">Môn giảng dạy
        <select aria-label="Lọc môn giảng dạy" value={subject} onChange={(e) => setSubject(e.target.value)}>
          <option value="all">Tất cả môn</option>
          {subjects.map((value) => <option key={value}>{value}</option>)}
        </select>
      </label>
      <label className="inline-field">Khối lớp
        <select aria-label="Lọc khối lớp phân công" value={grade} onChange={(e) => setGrade(e.target.value)}>
          <option value="all">Tất cả khối</option>
          {['6', '7', '8', '9'].map((value) => <option key={value} value={value}>Khối {value}</option>)}
        </select>
      </label>
      <label className="inline-field">Hồ sơ
        <select aria-label="Lọc hồ sơ phân công" value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="all">Tất cả hồ sơ</option>
          <option value="duties">Có công tác kiêm nhiệm</option>
          <option value="review">Có lưu ý đối chiếu</option>
          <option value="leave">Nghỉ thai sản</option>
        </select>
      </label>
      <div className="toolbar-spacer" />
      <Button variant="ghost" size="sm" onClick={() => { setSubject('all'); setGrade('all'); setCategory('all') }}>Đặt lại bộ lọc</Button>
    </div>
    <Panel>
      <div className="professional-assignment-table">
        <DataTable key={`${subject}-${grade}-${category}`} columns={columns} data={filtered} searchPlaceholder="Tìm họ tên, môn, lớp hoặc công tác kiêm nhiệm..." pageSize={10} />
      </div>
    </Panel>
    <p className="muted assignment-provenance">Nguồn: {metadata.fileName}. Các tổ chuyên môn và định mức ở biểu mẫu điều chỉnh vẫn là thông tin demo.</p>
    <Dialog open={!!view} onOpenChange={() => setView(null)} title={view?.name ?? 'Chi tiết phân công'} description="Đối chiếu với tài liệu phân công chuyên môn gốc" drawer>
      {view && <>
        <dl className="detail-list">
          <div><dt>STT trong file</dt><dd>{view.sourceNumber}</dd></div>
          <div><dt>Năm sinh · Chức vụ</dt><dd>{view.birthYear} · {view.position}</dd></div>
          <div><dt>Trình độ chuyên môn</dt><dd>{view.qualification}</dd></div>
          <div><dt>Số tiết thực dạy</dt><dd>{periodsLabel(view.teachingPeriods)}</dd></div>
          <div><dt>Số tiết kiêm nhiệm</dt><dd>{periodsLabel(view.dutyPeriods)}</dd></div>
          <div><dt>Tổng tiết/tuần</dt><dd>{periodsLabel(view.totalPeriods)}</dd></div>
          {view.statusNote && <div><dt>Ghi chú trong file</dt><dd>{view.statusNote}</dd></div>}
        </dl>
        <h3>Phân công môn và lớp trong file</h3>
        <p className="assignment-source-text dialog-paragraph">{view.teachingText || 'Ô trống trong tài liệu gốc.'}</p>
        <h3>Kiêm nhiệm và công tác khác</h3>
        <p className="assignment-source-text dialog-paragraph">{readableDuty(view.dutyText) || 'Ô trống trong tài liệu gốc.'}</p>
        {view.notes.length > 0 && <Alert title="Lưu ý đối chiếu" tone="amber"><ul>{view.notes.map((note) => <li key={note}>{note}</li>)}</ul></Alert>}
        <div className="dialog-actions">
          <Button variant="secondary" onClick={() => setView(null)}>Đóng</Button>
          {view.lessons.length > 0 && <Button asChild><Link to={`/teaching/assignments?view=lessons&teacher=${view.teacherId}`}>Phân công môn/lớp <ArrowRight size={16} /></Link></Button>}
        </div>
      </>}
    </Dialog>
  </>
}
