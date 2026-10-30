import { useState, type FormEvent } from 'react'
import {
  CheckCircle2,
  ClipboardCheck,
  Eye,
  FileCheck2,
  FileText,
  LockKeyhole,
  Plus,
  ShieldCheck,
  Soup,
  UsersRound,
  Wallet,
} from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'
import { useDemo } from '../../app/demo-context'
import { DataTable } from '../../components/data-table/data-table'
import {
  Alert,
  Badge,
  DemoNote,
  ExportButton,
  Field,
  Metric,
  PageHeader,
  Panel,
  Timeline,
} from '../../components/shared/ui'
import { Button } from '../../components/ui/button'
import { Dialog } from '../../components/ui/dialog'
import { DEMO_DATE } from '../../lib/config'
import { dateLabel, downloadCsv, money } from '../../lib/utils'
import { mealTotals } from '../../mocks/selectors'
import type { Inspection, MealRecord } from '../../mocks/types'
import { BoardingDatePicker } from './boarding-date-picker'
import { getBoardingMeals } from '../../mocks/boarding'

export { DutiesPage } from './duties-page'

function InspectionEditor({ onClose }: { onClose: () => void }) {
  const { mutate, busy } = useDemo()
  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const inspection: Inspection = {
      id: crypto.randomUUID(),
      title: String(form.get('title')),
      date: DEMO_DATE,
      time: String(form.get('time')),
      area: String(form.get('area')),
      inspector: 'Cô Trần Hương',
      result: form.get('result') as Inspection['result'],
      note: String(form.get('note')),
      followUp: String(form.get('followUp')),
      evidence: 'Biên bản nhập trong giao diện demo · chưa tải tệp lên hệ thống',
    }
    if (
      await mutate({ type: 'inspection.save', inspection }, 'Đã ghi nhận biên bản kiểm tra demo.')
    )
      onClose()
  }
  return (
    <Dialog open onOpenChange={onClose} title="Tạo biên bản kiểm tra">
      <form onSubmit={save}>
        <div className="form-grid">
          <Field label="Hạng mục kiểm tra *">
            <input required name="title" placeholder="Ví dụ: Vệ sinh khu vực ăn" />
          </Field>
          <Field label="Vị trí *">
            <input required name="area" placeholder="Khu vực kiểm tra" />
          </Field>
          <Field label="Thời điểm">
            <input required name="time" type="time" defaultValue="11:30" />
          </Field>
          <Field label="Kết quả">
            <select name="result">
              <option value="pass">Đạt</option>
              <option value="fail">Chưa đạt</option>
              <option value="in_progress">Đang kiểm tra</option>
            </select>
          </Field>
        </div>
        <Field label="Ghi chú & đánh giá *">
          <textarea required name="note" rows={3} />
        </Field>
        <Field label="Biện pháp xử lý">
          <textarea name="followUp" rows={2} />
        </Field>
        <DemoNote>Chưa hỗ trợ tải minh chứng thật; chỉ lưu nội dung biên bản mẫu.</DemoNote>
        <div className="dialog-actions">
          <Button type="button" variant="secondary" onClick={onClose}>
            Hủy
          </Button>
          <Button disabled={busy} type="submit">
            Lưu biên bản
          </Button>
        </div>
      </form>
    </Dialog>
  )
}

export function InspectionsPage() {
  const { state } = useDemo()
  const [filter, setFilter] = useState('all')
  const [creating, setCreating] = useState(false)
  const [detail, setDetail] = useState<Inspection | null>(null)
  const pass = state.inspections.filter((i) => i.result === 'pass').length
  const labels = { pass: 'Đạt', fail: 'Chưa đạt', in_progress: 'Đang kiểm tra' }
  const columns: ColumnDef<Inspection>[] = [
    {
      accessorKey: 'title',
      header: 'HẠNG MỤC KIỂM TRA',
      cell: ({ row }) => <strong className="table-title">{row.original.title}</strong>,
    },
    {
      accessorKey: 'area',
      header: 'THỜI ĐIỂM & VỊ TRÍ',
      cell: ({ row }) => (
        <div className="cell-stack">
          <strong>{row.original.time}</strong>
          <small>{row.original.area}</small>
        </div>
      ),
    },
    { accessorKey: 'inspector', header: 'NGƯỜI KIỂM TRA' },
    {
      accessorKey: 'result',
      header: 'KẾT QUẢ',
      cell: ({ row }) => (
        <Badge
          tone={
            row.original.result === 'pass'
              ? 'green'
              : row.original.result === 'fail'
                ? 'red'
                : 'amber'
          }
        >
          {labels[row.original.result]}
        </Badge>
      ),
    },
    {
      accessorKey: 'note',
      header: 'GHI CHÚ & ĐÁNH GIÁ',
      cell: ({ row }) => <p className="table-description">{row.original.note}</p>,
    },
    {
      id: 'actions',
      header: 'MINH CHỨNG',
      cell: ({ row }) => (
        <Button variant="soft" size="sm" onClick={() => setDetail(row.original)}>
          <Eye size={14} />
          Xem biên bản
        </Button>
      ),
    },
  ]
  return (
    <>
      <PageHeader
        eyebrow="BÁN TRÚ / GIÁM SÁT"
        title="Kiểm tra & giám sát bán trú"
        description="Ghi nhận vệ sinh thực phẩm, điều kiện sinh hoạt và nền nếp học sinh."
        actions={
          <>
            <ExportButton
              onClick={() =>
                downloadCsv(
                  'kiem-tra-ban-tru.csv',
                  ['Hạng mục', 'Ngày', 'Vị trí', 'Kết quả', 'Ghi chú'],
                  state.inspections.map((i) => [i.title, i.date, i.area, labels[i.result], i.note]),
                )
              }
            />
            <Button onClick={() => setCreating(true)}>
              <Plus size={17} />
              Tạo biên bản kiểm tra
            </Button>
          </>
        }
      />
      <div className="metrics-grid">
        <Metric
          label="Hạng mục giám sát"
          value={state.inspections.length}
          detail={`Ngày ${dateLabel(DEMO_DATE)}`}
          icon={ClipboardCheck}
        />
        <Metric
          label="Hạng mục đạt"
          value={pass}
          detail={`${Math.round((pass / state.inspections.length) * 100)}% số hạng mục đã ghi nhận`}
          icon={ShieldCheck}
          tone="green"
        />
        <Metric
          label="Cần khắc phục"
          value={state.inspections.filter((i) => i.result === 'fail').length}
          detail="Đang theo dõi xử lý"
          icon={FileCheck2}
          tone="red"
        />
        <Metric
          label="Đang kiểm tra"
          value={state.inspections.filter((i) => i.result === 'in_progress').length}
          detail="Chờ cập nhật kết quả"
          icon={ClipboardCheck}
          tone="amber"
        />
      </div>
      <Panel
        title="Chi tiết các hạng mục kiểm tra thực địa"
        action={
          <select
            aria-label="Lọc kết quả kiểm tra"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">Tất cả kết quả</option>
            <option value="pass">Đạt</option>
            <option value="fail">Chưa đạt</option>
            <option value="in_progress">Đang kiểm tra</option>
          </select>
        }
      >
        <DataTable
          data={state.inspections.filter((i) => filter === 'all' || i.result === filter)}
          columns={columns}
          pageSize={8}
          searchPlaceholder="Tìm hạng mục, vị trí hoặc người kiểm tra..."
        />
      </Panel>
      {creating && <InspectionEditor onClose={() => setCreating(false)} />}
      <Dialog
        open={!!detail}
        onOpenChange={() => setDetail(null)}
        title={detail?.title ?? 'Biên bản kiểm tra'}
        description="Minh chứng và nội dung trong bản demo, không phải hồ sơ thực tế."
        drawer
      >
        {detail && (
          <>
            <div className="evidence-placeholder">
              <FileText size={39} />
              <strong>{detail.evidence}</strong>
              <span>Không chứa ảnh hoặc dữ liệu học sinh thật.</span>
            </div>
            <dl className="detail-list">
              <div>
                <dt>Ngày, giờ</dt>
                <dd>
                  {detail.time} · {dateLabel(detail.date)}
                </dd>
              </div>
              <div>
                <dt>Vị trí</dt>
                <dd>{detail.area}</dd>
              </div>
              <div>
                <dt>Người kiểm tra</dt>
                <dd>{detail.inspector}</dd>
              </div>
              <div>
                <dt>Kết quả</dt>
                <dd>{labels[detail.result]}</dd>
              </div>
            </dl>
            <h3>Nội dung kiểm tra</h3>
            <p className="dialog-paragraph">{detail.note}</p>
            <h3>Biện pháp / Theo dõi</h3>
            <p className="dialog-paragraph">{detail.followUp || 'Không yêu cầu bổ sung.'}</p>
          </>
        )}
      </Dialog>
    </>
  )
}

function MealResolution({ record, onClose }: { record: MealRecord; onClose: () => void }) {
  const { mutate, busy } = useDemo()
  const [received, setReceived] = useState(
    record.actualRecorded === false ? '' : String(record.received),
  )
  const [reason, setReason] = useState(record.actualRecorded === false ? '' : record.reason)
  return (
    <Dialog open onOpenChange={onClose} title={`Đối soát suất ăn · Lớp ${record.classId}`}>
      <form
        onSubmit={async (e) => {
          e.preventDefault()
          if (
            await mutate(
              { type: 'meal.resolve', id: record.id, received: Number(received), reason },
              'Đã xác minh số liệu suất ăn.',
            )
          )
            onClose()
        }}
      >
        <div className="mini-stat-row">
          <span>
            Đăng ký<strong>{record.registered}</strong>
          </span>
          <span>
            Dự kiến<strong>{record.expected}</strong>
          </span>
          <span>
            Chênh lệch<strong>{received === '' ? '—' : Number(received) - record.expected}</strong>
          </span>
        </div>
        <Field label="Số suất thực nhận *">
          <input
            required
            type="number"
            min={0}
            max={record.registered}
            value={received}
            onChange={(e) => setReceived(e.target.value)}
          />
        </Field>
        <Field label="Lý do & nội dung xác minh *">
          <textarea required rows={4} value={reason} onChange={(e) => setReason(e.target.value)} />
        </Field>
        <DemoNote>
          Thiếu suất bàn giao không tự động được tính hoàn phí. Khoản điều chỉnh chỉ theo số suất đủ
          điều kiện trong dữ liệu mẫu.
        </DemoNote>
        <div className="dialog-actions">
          <Button type="button" variant="secondary" onClick={onClose}>
            Hủy
          </Button>
          <Button type="submit" disabled={busy}>
            <CheckCircle2 size={16} />
            Xác nhận số liệu
          </Button>
        </div>
      </form>
    </Dialog>
  )
}

export function MealsPage() {
  const { state, mutate, busy } = useDemo()
  const [differencesOnly, setDifferencesOnly] = useState(false)
  const [editing, setEditing] = useState<MealRecord | null>(null)
  const [closing, setClosing] = useState(false)
  const totals = mealTotals(state)
  const meals = getBoardingMeals(state)
  const unresolved = meals.filter((row) => !row.resolved).length
  const columns: ColumnDef<MealRecord>[] = [
    {
      accessorKey: 'classId',
      header: 'KHỐI / LỚP',
      cell: ({ row }) => (
        <div className="cell-stack">
          <strong className="table-title">Lớp {row.original.classId}</strong>
          <small>Khối {row.original.classId[0]}</small>
        </div>
      ),
    },
    { accessorKey: 'registered', header: 'ĐĂNG KÝ' },
    { accessorKey: 'expected', header: 'DỰ KIẾN' },
    {
      accessorKey: 'received',
      header: 'THỰC NHẬN',
      cell: ({ row }) =>
        row.original.actualRecorded === false ? 'Chưa ghi nhận' : row.original.received,
    },
    {
      id: 'difference',
      header: 'CHÊNH LỆCH',
      accessorFn: (row) => (row.actualRecorded === false ? '' : row.received - row.expected),
      cell: ({ row }) => (
        <strong
          className={
            row.original.actualRecorded === false
              ? 'muted'
              : row.original.received !== row.original.expected
                ? 'red-text'
                : 'green-text'
          }
        >
          {row.original.actualRecorded === false
            ? '—'
            : `${row.original.received - row.original.expected} suất`}
        </strong>
      ),
    },
    {
      accessorKey: 'reason',
      header: 'LÝ DO & MINH CHỨNG',
      cell: ({ row }) => <p className="table-description">{row.original.reason}</p>,
    },
    {
      id: 'status',
      header: 'TRẠNG THÁI',
      cell: ({ row }) => (
        <Badge tone={state.mealsClosed ? 'slate' : row.original.resolved ? 'green' : 'amber'}>
          {state.mealsClosed
            ? 'Đã chốt sổ'
            : row.original.resolved
              ? row.original.expected === 0 && row.original.actualRecorded === false
                ? 'Không ăn trong ngày'
                : 'Đã xác minh'
              : 'Cần kiểm tra'}
        </Badge>
      ),
    },
    {
      id: 'actions',
      header: 'THAO TÁC',
      cell: ({ row }) =>
        state.mealsClosed ? (
          <LockKeyhole size={15} className="muted" aria-label="Đã khóa" />
        ) : (
          <Button variant="soft" size="sm" onClick={() => setEditing(row.original)}>
            {row.original.resolved ? 'Chi tiết / sửa' : 'Đối soát'}
          </Button>
        ),
    },
  ]
  return (
    <>
      <PageHeader
        eyebrow="BÁN TRÚ / ĐỐI SOÁT"
        title="Quản lý suất ăn & đối soát số lượng"
        description="Đối chiếu số học sinh đăng ký, suất ăn dự kiến và số lượng thực tế bàn giao."
        badge={
          <Badge tone={state.mealsClosed ? 'green' : 'blue'}>
            {state.mealsClosed ? 'Đã chốt ngày' : 'Đang đối soát'}
          </Badge>
        }
        actions={
          <>
            <ExportButton
              onClick={() =>
                downloadCsv(
                  'doi-soat-suat-an.csv',
                  ['Lớp', 'Đăng ký', 'Dự kiến', 'Thực nhận', 'Chênh lệch', 'Lý do'],
                  meals.map((row) => [
                    row.classId,
                    row.registered,
                    row.expected,
                    row.actualRecorded === false ? 'Chưa ghi nhận' : row.received,
                    row.actualRecorded === false ? '' : row.received - row.expected,
                    row.reason,
                  ]),
                )
              }
            />
            <Button disabled={state.mealsClosed} onClick={() => setClosing(true)}>
              <LockKeyhole size={16} />
              Chốt đối soát ngày
            </Button>
          </>
        }
      />
      <BoardingDatePicker />
      {unresolved > 0 && (
        <Alert
          title={`${unresolved} lớp chưa ghi nhận hoặc chưa xác minh bàn giao`}
          tone="amber"
          action={
            <Button variant="secondary" size="sm" onClick={() => setDifferencesOnly(true)}>
              Kiểm tra ngay
            </Button>
          }
        >
          Không tự động quy đổi thiếu suất bàn giao thành khoản hoàn phí. Cần xác nhận nguyên nhân
          trước khi chốt.
        </Alert>
      )}
      <div className="metrics-grid">
        <Metric
          label="Tổng học sinh bán trú"
          value={totals.registered}
          detail={`${meals.length} lớp trong phiên bản đang xem`}
          icon={UsersRound}
        />
        <Metric
          label="Suất dự kiến hôm nay"
          value={totals.expected}
          detail="Đã trừ các lớp nghỉ theo thời khóa biểu"
          icon={Soup}
          tone="purple"
        />
        <Metric
          label="Suất thực nhận"
          value={totals.recorded ? totals.received : '—'}
          detail={
            totals.pending
              ? `Còn ${totals.pending} lớp chưa ghi nhận`
              : `Chênh lệch ${totals.difference} suất`
          }
          icon={CheckCircle2}
          tone="teal"
        />
        <Metric
          label="Điều chỉnh dự kiến"
          value={money(totals.refund)}
          detail="Theo số suất nghỉ đủ điều kiện demo"
          icon={Wallet}
          tone="amber"
        />
      </div>
      <Panel
        title={`Bảng đối soát ngày ${dateLabel(state.boardingDate)}`}
        action={
          <div className="segmented">
            <button
              className={!differencesOnly ? 'selected' : ''}
              onClick={() => setDifferencesOnly(false)}
            >
              Tất cả các lớp
            </button>
            <button
              className={differencesOnly ? 'selected' : ''}
              onClick={() => setDifferencesOnly(true)}
            >
              Có chênh lệch
            </button>
          </div>
        }
      >
        <DataTable
          data={meals.filter(
            (row) =>
              !differencesOnly ||
              !row.resolved ||
              (row.actualRecorded !== false && row.received !== row.expected),
          )}
          columns={columns}
          pageSize={8}
          searchPlaceholder="Tìm lớp hoặc lý do chênh lệch..."
        />
        <div className="reconciliation-total">
          <span>Tổng cộng ngày</span>
          <strong>{totals.registered} đăng ký</strong>
          <strong>{totals.expected} dự kiến</strong>
          <strong>{totals.recorded ? totals.received : '—'} thực nhận</strong>
          <Badge tone={totals.pending || totals.difference ? 'amber' : 'green'}>
            {totals.pending ? `${totals.pending} lớp chưa nhập` : `${totals.difference} suất`}
          </Badge>
        </div>
      </Panel>
      <div className="content-columns">
        <Panel title="Nguyên tắc đối soát mẫu" icon={ShieldCheck}>
          <ul className="policy-list">
            <li>Chênh lệch bàn giao = thực nhận − dự kiến.</li>
            <li>Suất báo nghỉ đủ điều kiện được theo dõi riêng với giá mẫu 35.000đ/suất.</li>
            <li>Chỉ chốt khi các lý do chênh lệch đã được xác minh.</li>
            <li>Sau khi chốt, dữ liệu chuyển sang chế độ chỉ đọc.</li>
          </ul>
          <DemoNote>Quy tắc minh họa; chưa thực hiện quyết toán hoặc hoàn tiền thật.</DemoNote>
        </Panel>
        <Panel title="Lịch sử đối soát" icon={FileCheck2}>
          <Timeline entityId="meals" />
        </Panel>
      </div>
      {editing && (
        <MealResolution key={editing.id} record={editing} onClose={() => setEditing(null)} />
      )}
      <Dialog
        open={closing}
        onOpenChange={setClosing}
        title="Chốt đối soát ngày?"
        description="Số liệu sẽ chuyển sang chế độ chỉ đọc trong phiên demo."
      >
        {unresolved > 0 ? (
          <Alert title={`Còn ${unresolved} lớp chưa xác minh`} tone="red">
            Hãy hoàn tất đối soát trước khi chốt ngày.
          </Alert>
        ) : (
          <p className="dialog-paragraph">
            Đã xác minh toàn bộ {meals.length} lớp. Tổng {totals.received} suất thực nhận; khoản
            điều chỉnh dự kiến {money(totals.refund)}.
          </p>
        )}
        <div className="dialog-actions">
          <Button variant="secondary" onClick={() => setClosing(false)}>
            Quay lại
          </Button>
          <Button
            disabled={busy || unresolved > 0}
            onClick={async () => {
              if (await mutate({ type: 'meal.close' }, 'Đã chốt đối soát ngày trong bản demo.'))
                setClosing(false)
            }}
          >
            <LockKeyhole size={16} />
            Xác nhận chốt ngày
          </Button>
        </div>
      </Dialog>
    </>
  )
}
