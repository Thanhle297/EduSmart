import { useState } from 'react'
import {
  CheckCircle2,
  ClipboardList,
  Eye,
  FileCheck2,
  GraduationCap,
  LockKeyhole,
  Printer,
  ShieldCheck,
} from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'
import { useDemo } from '../../app/demo-context'
import { DataTable } from '../../components/data-table/data-table'
import {
  Alert,
  Avatar,
  Badge,
  DemoNote,
  ExportButton,
  Metric,
  PageHeader,
  Panel,
} from '../../components/shared/ui'
import { Button } from '../../components/ui/button'
import { Dialog } from '../../components/ui/dialog'
import { DEMO_DATE } from '../../lib/config'
import { dateLabel, downloadCsv } from '../../lib/utils'
import { assignedPeriods, confirmationTotal, teachingLoad } from '../../mocks/selectors'
import type { Teacher } from '../../mocks/types'

export function TeachingReconciliationPage() {
  const { state, mutate, busy } = useDemo()
  const [status, setStatus] = useState('all')
  const [department, setDepartment] = useState('all')
  const [detail, setDetail] = useState<Teacher | null>(null)
  const [closing, setClosing] = useState<Teacher | null>(null)
  const totalPlanned = state.assignments.reduce((sum, a) => sum + assignedPeriods(a), 0)
  const totalConfirmed = confirmationTotal(state)
  const totalSub = state.confirmations
    .filter((r) => r.kind === 'substitute')
    .reduce((sum, r) => sum + r.periods, 0)
  const countKind = (teacherId: string, kind: string) =>
    state.confirmations
      .filter((r) => r.teacherId === teacherId && r.kind === kind)
      .reduce((sum, r) => sum + r.periods, 0)
  const isClosed = (id: string) => state.reconciledTeacherIds.includes(id)
  const filtered = state.teachers.filter(
    (t) =>
      (department === 'all' || t.department === department) &&
      (status === 'all' || (status === 'closed' ? isClosed(t.id) : !isClosed(t.id))),
  )
  const columns: ColumnDef<Teacher>[] = [
    {
      accessorKey: 'name',
      header: 'GIÁO VIÊN',
      cell: ({ row }) => (
        <div className="person-cell">
          <Avatar name={row.original.name} tone={row.original.color} />
          <div>
            <strong>{row.original.name}</strong>
            <small>{row.original.department}</small>
          </div>
        </div>
      ),
    },
    { id: 'planned', header: 'PHÂN CÔNG', accessorFn: (t) => teachingLoad(state, t.id) },
    { id: 'regular', header: 'THỰC DẠY CHUẨN', accessorFn: (t) => countKind(t.id, 'regular') },
    {
      id: 'sub',
      header: 'DẠY THAY',
      accessorFn: (t) => countKind(t.id, 'substitute'),
      cell: ({ getValue }) => <strong className="teal-text">{String(getValue())}</strong>,
    },
    { id: 'makeup', header: 'DẠY BÙ', accessorFn: (t) => countKind(t.id, 'makeup') },
    {
      id: 'total',
      header: 'TỔNG GHI NHẬN',
      accessorFn: (t) => confirmationTotal(state, t.id),
      cell: ({ getValue }) => <strong className="blue-text">{String(getValue())} tiết</strong>,
    },
    {
      id: 'status',
      header: 'TRẠNG THÁI',
      cell: ({ row }) => (
        <Badge tone={isClosed(row.original.id) ? 'green' : 'amber'}>
          {isClosed(row.original.id) ? 'Đã chốt đối soát' : 'Đang đối soát'}
        </Badge>
      ),
    },
    {
      id: 'actions',
      header: 'THAO TÁC',
      cell: ({ row }) => (
        <div className="row-actions">
          <Button
            size="icon"
            variant="ghost"
            aria-label={`Chi tiết đối soát ${row.original.name}`}
            onClick={() => setDetail(row.original)}
          >
            <Eye size={16} />
          </Button>
          {isClosed(row.original.id) ? (
            <LockKeyhole size={14} className="muted" />
          ) : (
            <Button size="sm" variant="soft" onClick={() => setClosing(row.original)}>
              Chốt demo
            </Button>
          )}
        </div>
      ),
    },
  ]
  return (
    <>
      <PageHeader
        eyebrow="CHUYÊN MÔN / THỐNG KÊ"
        title="Báo cáo thống kê & đối soát tiết giảng dạy"
        description={`Kỳ minh họa: tuần bắt đầu ${dateLabel(DEMO_DATE)} · Đối chiếu phân công và các bản ghi xác nhận.`}
        actions={
          <>
            <ExportButton
              onClick={() =>
                downloadCsv(
                  'doi-soat-tiet-giang-day.csv',
                  [
                    'Giáo viên',
                    'Tổ',
                    'Phân công',
                    'Thực dạy chuẩn',
                    'Dạy thay',
                    'Tổng ghi nhận',
                    'Đã chốt',
                  ],
                  filtered.map((t) => [
                    t.name,
                    t.department,
                    teachingLoad(state, t.id),
                    countKind(t.id, 'regular'),
                    countKind(t.id, 'substitute'),
                    confirmationTotal(state, t.id),
                    isClosed(t.id) ? 'Có' : 'Chưa',
                  ]),
                )
              }
            />
            <Button variant="secondary" onClick={() => window.print()}>
              <Printer size={16} />
              In bảng đối soát
            </Button>
          </>
        }
      />
      <Alert title="Nguyên tắc ghi nhận tiết giảng dạy" tone="blue">
        Tiết trên thời khóa biểu không tự động là tiết hoàn thành. Tổng ghi nhận dựa trên bản ghi
        xác nhận riêng biệt, loại trùng theo định danh. Không tích hợp tính lương hoặc phụ cấp.
      </Alert>
      <div className="metrics-grid">
        <Metric
          label="Phân công dự kiến / tuần"
          value={`${totalPlanned} tiết`}
          detail="Tổng các bản phân công mẫu"
          icon={GraduationCap}
        />
        <Metric
          label="Thực dạy đã xác nhận"
          value={`${totalConfirmed} tiết`}
          detail="Gồm các loại thực dạy hợp lệ"
          icon={CheckCircle2}
          tone="green"
        />
        <Metric
          label="Dạy thay đã ghi nhận"
          value={`${totalSub} tiết`}
          detail="Chỉ tính khi đã xác nhận"
          icon={FileCheck2}
          tone="teal"
        />
        <Metric
          label="Giáo viên chưa chốt"
          value={state.teachers.filter((t) => !isClosed(t.id)).length}
          detail="Cần hoàn tất đối chiếu"
          icon={ClipboardList}
          tone="amber"
        />
      </div>
      <div className="toolbar-panel">
        <label className="inline-field">
          Tổ chuyên môn
          <select
            aria-label="Lọc tổ đối soát"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
          >
            <option value="all">Tất cả tổ chuyên môn</option>
            {[...new Set(state.teachers.map((t) => t.department))].map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>
        </label>
        <div className="toolbar-spacer" />
        <div className="segmented">
          {[
            ['all', 'Tất cả'],
            ['closed', 'Đã chốt'],
            ['open', 'Đang đối soát'],
          ].map(([value, label]) => (
            <button
              key={value}
              className={status === value ? 'selected' : ''}
              onClick={() => setStatus(value)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <Panel>
        <DataTable
          key={`${status}-${department}`}
          data={filtered}
          columns={columns}
          searchPlaceholder="Tìm giáo viên hoặc tổ chuyên môn..."
          pageSize={8}
        />
      </Panel>
      <DemoNote>
        Chốt đối soát chỉ ghi nhận trạng thái xem xét dữ liệu demo. Khi có xác nhận dạy thay mới,
        giáo viên liên quan sẽ được mở lại kỳ đối soát.
      </DemoNote>
      <Dialog
        open={!!detail}
        onOpenChange={() => setDetail(null)}
        title="Chi tiết đối soát tiết giảng dạy"
        drawer
      >
        {detail && (
          <>
            <div className="account-summary">
              <Avatar name={detail.name} tone={detail.color} />
              <div>
                <h3>{detail.name}</h3>
                <p>Tổ {detail.department}</p>
              </div>
            </div>
            <Badge tone={isClosed(detail.id) ? 'green' : 'amber'}>
              {isClosed(detail.id) ? 'Đã chốt đối soát' : 'Đang đối soát'}
            </Badge>
            <dl className="detail-list">
              <div>
                <dt>Phân công dự kiến</dt>
                <dd>{teachingLoad(state, detail.id)} tiết</dd>
              </div>
              <div>
                <dt>Thực dạy chuẩn</dt>
                <dd>{countKind(detail.id, 'regular')} tiết</dd>
              </div>
              <div>
                <dt>Dạy thay</dt>
                <dd>{countKind(detail.id, 'substitute')} tiết</dd>
              </div>
              <div>
                <dt>Dạy bù</dt>
                <dd>{countKind(detail.id, 'makeup')} tiết</dd>
              </div>
              <div>
                <dt>Tổng ghi nhận (loại trùng)</dt>
                <dd>{confirmationTotal(state, detail.id)} tiết</dd>
              </div>
            </dl>
            <div className="evidence-placeholder">
              <ShieldCheck size={32} />
              <strong>
                {state.confirmations.filter((r) => r.teacherId === detail.id).length} bản ghi xác
                nhận mẫu
              </strong>
              <span>Chưa kết nối minh chứng sổ đầu bài hoặc ký số thật.</span>
            </div>
          </>
        )}
      </Dialog>
      <Dialog
        open={!!closing}
        onOpenChange={() => setClosing(null)}
        title="Chốt đối soát giáo viên?"
        description="Xác nhận đã xem số liệu trong kỳ demo; không thực hiện ký số hoặc thanh toán."
      >
        <p className="dialog-paragraph">
          {closing?.name} · Tổng ghi nhận {closing ? confirmationTotal(state, closing.id) : 0} tiết.
        </p>
        <div className="dialog-actions">
          <Button variant="secondary" onClick={() => setClosing(null)}>
            Hủy
          </Button>
          <Button
            disabled={busy}
            onClick={async () => {
              if (
                closing &&
                (await mutate(
                  { type: 'teaching.reconcile', teacherId: closing.id },
                  'Đã chốt đối soát giáo viên trong bản demo.',
                ))
              )
                setClosing(null)
            }}
          >
            <LockKeyhole size={16} />
            Xác nhận chốt
          </Button>
        </div>
      </Dialog>
    </>
  )
}
