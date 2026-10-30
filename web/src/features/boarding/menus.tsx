import { useState, type FormEvent } from 'react'
import {
  Apple,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChefHat,
  Copy,
  Edit3,
  Flame,
  History,
  Leaf,
  Plus,
  Printer,
  Send,
  ShieldCheck,
  Soup,
  Utensils,
  Wheat,
  XCircle,
} from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useDemo } from '../../app/demo-context'
import {
  Alert,
  Badge,
  DemoNote,
  Field,
  Metric,
  PageHeader,
  Panel,
  StatusBadge,
  Timeline,
} from '../../components/shared/ui'
import { Button } from '../../components/ui/button'
import { Dialog } from '../../components/ui/dialog'
import { addDays, dateLabel } from '../../lib/utils'
import { makeMenuDays } from '../../mocks/fixtures'
import type { Menu, MenuDay } from '../../mocks/types'

export function WeeklyMenu({ menu, detailed = false }: { menu: Menu; detailed?: boolean }) {
  const items: { key: keyof MenuDay; label: string; icon: typeof Utensils }[] = [
    { key: 'main', label: 'MÓN CHÍNH', icon: ChefHat },
    { key: 'side', label: 'MÓN PHỤ', icon: Wheat },
    { key: 'vegetable', label: 'RAU XANH', icon: Leaf },
    { key: 'soup', label: 'MÓN CANH', icon: Soup },
    { key: 'dessert', label: 'TRÁNG MIỆNG', icon: Apple },
  ]
  return (
    <div className={detailed ? 'menu-grid menu-grid-detailed' : 'menu-grid'}>
      {menu.days.map((day, i) => (
        <article className="menu-day" key={day.date}>
          <div className="menu-day-header">
            <strong>{['Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu'][i]}</strong>
            <span>{dateLabel(day.date)}</span>
            <StatusBadge status={menu.status} />
          </div>
          <div className="menu-dishes">
            {items.map(({ key, label, icon: Icon }) => (
              <div className={`dish dish-${key}`} key={key}>
                <Icon size={15} />
                <div>
                  <small>{label}</small>
                  <strong>{day[key]}</strong>
                  {detailed && <span>Khẩu phần mẫu · thông tin minh họa</span>}
                </div>
              </div>
            ))}
          </div>
          <div className="menu-nutrition">
            <span>
              <Flame size={14} />
              <strong>{day.calories}</strong> kcal
            </span>
            <span>{day.protein}g đạm</span>
          </div>
        </article>
      ))}
    </div>
  )
}

function MenuEditor({
  menu,
  onClose,
  onSaved,
}: {
  menu: Menu
  onClose: () => void
  onSaved: (id: string) => void
}) {
  const { mutate, busy } = useDemo()
  const [value, setValue] = useState(menu)
  const save = async (event: FormEvent) => {
    event.preventDefault()
    if (await mutate({ type: 'menu.save', menu: value }, 'Đã lưu bản nháp thực đơn.')) {
      onSaved(value.id)
      onClose()
    }
  }
  return (
    <Dialog
      open
      onOpenChange={onClose}
      title="Thiết lập thực đơn tuần"
      description="Hoàn thiện kế hoạch 5 ngày; thông tin dinh dưỡng chỉ là dữ liệu demo."
      wide
    >
      <form onSubmit={save}>
        <div className="form-grid">
          <Field label="Tên thực đơn *">
            <input
              required
              value={value.name}
              onChange={(e) => setValue({ ...value, name: e.target.value })}
            />
          </Field>
          <Field label="Ngày bắt đầu tuần *">
            <input
              required
              type="date"
              value={value.startDate}
              onChange={(e) => {
                const startDate = e.target.value
                if (startDate)
                  setValue({
                    ...value,
                    startDate,
                    days: value.days.map((day, i) => ({ ...day, date: addDays(startDate, i) })),
                  })
              }}
            />
          </Field>
        </div>
        <div className="menu-editor-days">
          {value.days.map((day, i) => (
            <fieldset key={i}>
              <legend>{dateLabel(day.date, true)}</legend>
              <div className="form-grid">
                {(['main', 'side', 'vegetable', 'soup', 'dessert'] as const).map((key, j) => (
                  <Field
                    label={['Món chính *', 'Món phụ', 'Rau xanh', 'Canh *', 'Tráng miệng'][j]}
                    key={key}
                  >
                    <input
                      required={key === 'main' || key === 'soup'}
                      value={day[key]}
                      onChange={(e) =>
                        setValue({
                          ...value,
                          days: value.days.map((d, n) =>
                            n === i ? { ...d, [key]: e.target.value } : d,
                          ),
                        })
                      }
                    />
                  </Field>
                ))}
                <Field label="Năng lượng (kcal) *">
                  <input
                    required
                    type="number"
                    min={1}
                    max={2000}
                    value={day.calories}
                    onChange={(e) =>
                      setValue({
                        ...value,
                        days: value.days.map((d, n) =>
                          n === i ? { ...d, calories: Number(e.target.value) } : d,
                        ),
                      })
                    }
                  />
                </Field>
              </div>
            </fieldset>
          ))}
        </div>
        <div className="dialog-actions">
          <Button variant="secondary" type="button" onClick={onClose}>
            Hủy
          </Button>
          <Button disabled={busy} type="submit">
            <CheckCircle2 size={16} />
            Lưu bản nháp
          </Button>
        </div>
      </form>
    </Dialog>
  )
}

export function MenusPage() {
  const { state, mutate, busy } = useDemo()
  const [selectedId, setSelectedId] = useState('menu-w44')
  const [editing, setEditing] = useState<Menu | null>(null)
  const [sendOpen, setSendOpen] = useState(false)
  const menu = state.menus.find((row) => row.id === selectedId) ?? state.menus[0]
  const editable = menu.status === 'draft' || menu.status === 'revision_requested'
  const copyMenu = () =>
    setEditing({
      ...structuredClone(menu),
      id: crypto.randomUUID(),
      name: `${menu.name} · Bản sao`,
      startDate: addDays(menu.startDate, 7),
      days: menu.days.map((day) => ({ ...day, date: addDays(day.date, 7) })),
      status: 'draft',
      version: 1,
    })
  const editMenu = () =>
    setEditing(
      editable
        ? structuredClone(menu)
        : {
            ...structuredClone(menu),
            id: crypto.randomUUID(),
            name: `${menu.name} · Điều chỉnh`,
            status: 'draft',
            version: menu.version + 1,
          },
    )
  const average = Math.round(
    menu.days.reduce((sum, day) => sum + day.calories, 0) / menu.days.length,
  )
  return (
    <>
      <PageHeader
        eyebrow="BÁN TRÚ / THỰC ĐƠN"
        title="Quản lý thực đơn bán trú"
        description="Lập kế hoạch bữa ăn, theo dõi dinh dưỡng và quản lý phê duyệt thực đơn tuần."
        badge={<StatusBadge status={menu.status} />}
        actions={
          <>
            <Button variant="secondary" onClick={copyMenu}>
              <Copy size={16} />
              Sao chép tuần
            </Button>
            <Button variant="secondary" onClick={() => window.print()}>
              <Printer size={16} />
              In thực đơn
            </Button>
            <Button
              onClick={() =>
                setEditing({
                  id: crypto.randomUUID(),
                  name: 'Thực đơn tuần mới',
                  startDate: addDays(menu.startDate, 7),
                  days: makeMenuDays(addDays(menu.startDate, 7)),
                  status: 'draft',
                  version: 1,
                  author: 'Cô Nguyễn Lan Anh',
                })
              }
            >
              <Plus size={17} />
              Tạo thực đơn
            </Button>
          </>
        }
      />
      <div className="toolbar-panel">
        <label className="inline-field">
          Tuần thực đơn
          <select
            aria-label="Chọn tuần thực đơn"
            value={menu.id}
            onChange={(e) => setSelectedId(e.target.value)}
          >
            {state.menus.map((row) => (
              <option key={row.id} value={row.id}>
                {row.name} · {dateLabel(row.startDate)}
              </option>
            ))}
          </select>
        </label>
        <div className="toolbar-spacer" />
        <Badge tone="slate" dot={false}>
          Phiên bản {menu.version}
        </Badge>
        <Button variant="secondary" onClick={editMenu}>
          <Edit3 size={15} />
          {editable ? 'Chỉnh sửa thực đơn' : 'Tạo bản điều chỉnh'}
        </Button>
        {editable ? (
          <Button onClick={() => setSendOpen(true)}>
            <Send size={15} />
            Gửi duyệt
          </Button>
        ) : (
          <Button variant="soft" asChild>
            <Link to={`/boarding/menu-approvals/${menu.id}`}>
              Xem hồ sơ duyệt
              <ArrowRight size={14} />
            </Link>
          </Button>
        )}
      </div>
      <Panel
        title="Lịch ăn bán trú theo tuần"
        description={`${dateLabel(menu.startDate)} – ${dateLabel(addDays(menu.startDate, 4))} · Khẩu phần tiêu chuẩn (mô phỏng)`}
        action={
          <Badge tone="teal">
            <Leaf size={12} />
            Đa dạng dinh dưỡng
          </Badge>
        }
      >
        <WeeklyMenu menu={menu} />
      </Panel>
      <div className="content-columns">
        <Panel
          title="Chỉ số dinh dưỡng trung bình"
          description="Thông tin minh họa, không phải kết luận đạt chuẩn y tế."
        >
          <div className="nutrition-summary">
            <div>
              <span className="tone-amber">
                <Flame size={22} />
              </span>
              <strong>
                {average}
                <small> kcal / bữa</small>
              </strong>
              <p>Năng lượng trung bình</p>
            </div>
            <div>
              <span className="tone-teal">
                <Wheat size={22} />
              </span>
              <strong>
                {(menu.days.reduce((sum, day) => sum + day.protein, 0) / 5).toFixed(1)}
                <small> g / bữa</small>
              </strong>
              <p>Chất đạm trung bình</p>
            </div>
            <div>
              <span className="tone-green">
                <Leaf size={22} />
              </span>
              <strong>
                5<small> ngày đa dạng</small>
              </strong>
              <p>Rau xanh & trái cây</p>
            </div>
          </div>
        </Panel>
        <Panel title="Nguồn gốc & quy trình kiểm tra" icon={ShieldCheck}>
          <div className="supplier-card">
            <span className="supplier-logo">
              <Leaf size={25} />
            </span>
            <div>
              <h3>Nhà cung cấp thực phẩm mẫu</h3>
              <p>Hồ sơ truy xuất và chứng nhận sẽ được đối chiếu khi tích hợp thực tế.</p>
              <DemoNote>Chưa kết nối nhà cung cấp hoặc hồ sơ kiểm định.</DemoNote>
            </div>
          </div>
        </Panel>
      </div>
      {editing && (
        <MenuEditor
          key={editing.id}
          menu={editing}
          onClose={() => setEditing(null)}
          onSaved={setSelectedId}
        />
      )}
      <Dialog
        open={sendOpen}
        onOpenChange={setSendOpen}
        title="Gửi thực đơn để phê duyệt?"
        description="Sau khi gửi, bản này sẽ khóa chỉnh sửa cho đến khi được yêu cầu bổ sung."
      >
        <p className="dialog-paragraph">
          {menu.name} · Phiên bản {menu.version}
        </p>
        <div className="dialog-actions">
          <Button variant="secondary" onClick={() => setSendOpen(false)}>
            Hủy
          </Button>
          <Button
            disabled={busy}
            onClick={async () => {
              if (
                await mutate(
                  { type: 'menu.submit', id: menu.id },
                  'Đã gửi thực đơn đến hàng chờ duyệt demo.',
                )
              )
                setSendOpen(false)
            }}
          >
            <Send size={16} />
            Gửi duyệt
          </Button>
        </div>
      </Dialog>
    </>
  )
}

export function MenuApprovalPage() {
  const { menuId } = useParams()
  const navigate = useNavigate()
  const { state, mutate, busy } = useDemo()
  const [decision, setDecision] = useState<'approved' | 'revision_requested' | null>(null)
  const [note, setNote] = useState('')
  const menu = state.menus.find((row) => row.id === menuId)
  if (!menu)
    return (
      <Panel>
        <div className="empty-state">
          <Soup size={32} />
          <h1>Không tìm thấy thực đơn</h1>
          <p>Mã hồ sơ không tồn tại trong dữ liệu demo.</p>
          <Button asChild>
            <Link to="/boarding/menus">Về danh sách thực đơn</Link>
          </Button>
        </div>
      </Panel>
    )
  const average = Math.round(menu.days.reduce((sum, day) => sum + day.calories, 0) / 5)
  return (
    <>
      <Link className="back-link" to="/boarding/menus">
        <ArrowLeft size={15} />
        Quản lý thực đơn
      </Link>
      <PageHeader
        eyebrow={`HỒ SƠ ${menu.id.toUpperCase().slice(0, 18)} · PHIÊN BẢN ${menu.version}`}
        title={`Xét duyệt ${menu.name.toLocaleLowerCase('vi')}`}
        description={`${menu.author} trình duyệt · Phạm vi: Toàn trường · ${dateLabel(menu.startDate)} – ${dateLabel(addDays(menu.startDate, 4))}`}
        badge={<StatusBadge status={menu.status} />}
        actions={
          <>
            <Button variant="secondary" onClick={() => window.print()}>
              <Printer size={16} />
              In hồ sơ
            </Button>
            {menu.status === 'pending' && (
              <>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setNote('')
                    setDecision('revision_requested')
                  }}
                >
                  <Edit3 size={16} />
                  Yêu cầu chỉnh sửa
                </Button>
                <Button
                  onClick={() => {
                    setNote('')
                    setDecision('approved')
                  }}
                >
                  <ShieldCheck size={16} />
                  Phê duyệt thực đơn
                </Button>
              </>
            )}
          </>
        }
      />
      <div className="toolbar-panel">
        <label className="inline-field">
          Hồ sơ thực đơn
          <select
            aria-label="Chọn hồ sơ thực đơn"
            value={menu.id}
            onChange={(e) => navigate(`/boarding/menu-approvals/${e.target.value}`)}
          >
            {state.menus.map((row) => (
              <option key={row.id} value={row.id}>
                {row.name}
              </option>
            ))}
          </select>
        </label>
        <DemoNote>Phê duyệt mô phỏng · Không thực hiện ký số</DemoNote>
      </div>
      <div className="metrics-grid">
        <Metric
          label="Năng lượng trung bình"
          value={`${average} kcal`}
          detail="Mỗi khẩu phần mẫu"
          icon={Flame}
          tone="amber"
        />
        <Metric
          label="Số ngày phục vụ"
          value="5 ngày"
          detail="Từ thứ Hai đến thứ Sáu"
          icon={Utensils}
          tone="blue"
        />
        <Metric
          label="Nhóm thực phẩm"
          value="5 nhóm"
          detail="Món chính, phụ, rau, canh, quả"
          icon={Leaf}
          tone="green"
        />
        <Metric
          label="Tình trạng hồ sơ"
          value={`v${menu.version}`}
          detail="Theo phiên bản thực đơn"
          icon={History}
          tone="purple"
        />
      </div>
      <Alert title="Lưu ý về dị ứng và thông tin dinh dưỡng" tone="amber">
        Thông tin học sinh có dị ứng và suất ăn riêng phải được đối chiếu với hồ sơ y tế thực tế.
        Bản demo không chứa dữ liệu sức khỏe cá nhân.
      </Alert>
      <Panel
        title="Chi tiết thực đơn 5 ngày"
        description="Đối chiếu thành phần và khẩu phần trước khi đưa ra quyết định."
      >
        <WeeklyMenu menu={menu} detailed />
      </Panel>
      <div className="content-columns">
        <Panel title="Lịch sử xét duyệt" icon={History}>
          <Timeline entityId={menu.id} />
        </Panel>
        <Panel title="Thông tin hồ sơ" icon={ShieldCheck}>
          <dl className="detail-list">
            <div>
              <dt>Người lập</dt>
              <dd>{menu.author}</dd>
            </div>
            <div>
              <dt>Phiên bản</dt>
              <dd>{menu.version}</dd>
            </div>
            <div>
              <dt>Trạng thái</dt>
              <dd>
                <StatusBadge status={menu.status} />
              </dd>
            </div>
            <div>
              <dt>Ký số & hồ sơ pháp lý</dt>
              <dd>Chưa tích hợp</dd>
            </div>
          </dl>
        </Panel>
      </div>
      <Dialog
        open={decision !== null}
        onOpenChange={() => setDecision(null)}
        title={decision === 'approved' ? 'Phê duyệt thực đơn?' : 'Yêu cầu chỉnh sửa thực đơn'}
      >
        <form
          onSubmit={async (e) => {
            e.preventDefault()
            if (
              decision &&
              (await mutate(
                { type: 'menu.decide', id: menu.id, decision, note },
                decision === 'approved'
                  ? 'Đã phê duyệt thực đơn trong bản demo.'
                  : 'Đã gửi yêu cầu chỉnh sửa.',
              ))
            )
              setDecision(null)
          }}
        >
          <Field
            label={
              decision === 'revision_requested'
                ? 'Nội dung cần chỉnh sửa *'
                : 'Ghi chú phê duyệt (không bắt buộc)'
            }
          >
            <textarea
              required={decision === 'revision_requested'}
              rows={4}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Nhập nội dung phản hồi..."
            />
          </Field>
          <div className="dialog-actions">
            <Button type="button" variant="secondary" onClick={() => setDecision(null)}>
              Hủy
            </Button>
            <Button
              disabled={busy}
              type="submit"
              variant={decision === 'approved' ? 'primary' : 'danger'}
            >
              {decision === 'approved' ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
              {decision === 'approved' ? 'Xác nhận phê duyệt' : 'Gửi yêu cầu chỉnh sửa'}
            </Button>
          </div>
        </form>
      </Dialog>
    </>
  )
}
