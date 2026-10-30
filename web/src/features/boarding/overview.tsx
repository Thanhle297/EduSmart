import {
  AlertTriangle,
  ArrowRight,
  BedDouble,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock3,
  FileCheck2,
  Plus,
  Soup,
  Utensils,
  UsersRound,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import type { ColumnDef } from '@tanstack/react-table'
import { useDemo } from '../../app/demo-context'
import { DataTable } from '../../components/data-table/data-table'
import {
  Alert,
  Avatar,
  Badge,
  Metric,
  PageHeader,
  Panel,
  TextLink,
} from '../../components/shared/ui'
import { Button } from '../../components/ui/button'
import { dateLabel } from '../../lib/utils'
import { mealTotals } from '../../mocks/selectors'
import type { Duty } from '../../mocks/types'
import {
  boardingKindLabel,
  boardingPerson,
  getBoardingDuties,
  getBoardingMeals,
  getBoardingGroups,
} from '../../mocks/boarding'
import { BoardingDatePicker } from './boarding-date-picker'

export function BoardingOverviewPage() {
  const { state, mutate, busy } = useDemo()
  const totals = mealTotals(state)
  const duties = getBoardingDuties(state)
  const meals = getBoardingMeals(state)
  const groups = getBoardingGroups(state)
  const confirmed = duties.filter((row) => row.confirmed).length
  const pendingMenus = state.menus.filter((row) => row.status === 'pending')
  const issues = meals.filter((row) => !row.resolved).length + pendingMenus.length
  const columns: ColumnDef<Duty>[] = [
    {
      header: 'NHÂN SỰ TRỰC',
      accessorFn: (row) => boardingPerson(state, row.teacherId).name,
      cell: ({ row }) => {
        const teacher = boardingPerson(state, row.original.teacherId)
        return (
          <div className="person-cell">
            <Avatar name={teacher.name} tone={teacher.color} />
            <div>
              <strong>{teacher.name}</strong>
              <small>{teacher.department}</small>
            </div>
          </div>
        )
      },
    },
    {
      header: 'CA TRỰC',
      accessorKey: 'kind',
      cell: ({ row }) => (
        <div className="cell-stack">
          <strong>{boardingKindLabel[row.original.kind]}</strong>
          <small>
            {row.original.start
              ? `${row.original.start}–${row.original.end}`
              : 'Chưa có giờ trong nguồn'}
          </small>
        </div>
      ),
    },
    { header: 'KHU VỰC', accessorKey: 'area' },
    {
      header: 'TRẠNG THÁI',
      accessorKey: 'confirmed',
      cell: ({ row }) => (
        <Badge tone={row.original.confirmed ? 'green' : 'amber'}>
          {row.original.confirmed ? 'Đã xác nhận' : 'Chờ xác nhận'}
        </Badge>
      ),
    },
    {
      id: 'actions',
      header: 'THAO TÁC',
      cell: ({ row }) =>
        row.original.confirmed ? (
          <span className="green-text">
            <Check size={16} />
          </span>
        ) : (
          <Button
            size="sm"
            variant="soft"
            disabled={busy}
            onClick={() =>
              mutate(
                { type: 'duty.confirm', id: row.original.id },
                'Đã xác nhận ca trực trong bản demo.',
              )
            }
          >
            Xác nhận demo
          </Button>
        ),
    },
  ]
  const steps = [
    {
      icon: FileCheck2,
      title: 'Kiểm tra thực đơn bữa trưa',
      status: pendingMenus.length ? 'Cần duyệt' : 'Đã hoàn tất',
      text: pendingMenus.length
        ? 'Thực đơn tuần hiện tại đang chờ Ban Giám hiệu xem xét.'
        : 'Thực đơn đã được phê duyệt trong dữ liệu demo.',
      done: !pendingMenus.length,
      route: '/boarding/menu-approvals/menu-w44',
    },
    {
      icon: Soup,
      title: 'Giao nhận & đối soát suất ăn',
      status: totals.pending
        ? `${totals.pending} lớp chưa nhập`
        : totals.difference
          ? `Chênh lệch ${totals.difference} suất`
          : 'Đã ghi nhận bàn giao',
      text: totals.recorded
        ? `Đã ghi nhận ${totals.received} suất; dự kiến ${totals.expected} suất. Theo dõi bàn giao theo từng lớp.`
        : `Dự kiến ${totals.expected} suất theo lịch học; chưa ghi nhận bàn giao.`,
      done: meals.length > 0 && meals.every((row) => row.resolved),
      route: '/boarding/meals',
    },
    {
      icon: UsersRound,
      title: 'Theo dõi giáo viên trực',
      status: `${confirmed}/${duties.length} đã xác nhận`,
      text: 'Đối chiếu lịch trực ăn và trực ngủ để bảo đảm bàn giao ca đầy đủ.',
      done: confirmed === duties.length,
      route: '/boarding/duties',
    },
    {
      icon: BedDouble,
      title: 'Giám sát an toàn & nền nếp',
      status: 'Đang theo dõi',
      text: 'Kết quả kiểm tra, minh chứng và biện pháp xử lý được cập nhật trong sổ kiểm tra.',
      done: false,
      route: '/boarding/inspections',
    },
    {
      icon: CheckCircle2,
      title: 'Chốt báo cáo bán trú ngày',
      status: state.mealsClosed ? 'Đã chốt' : 'Chưa chốt',
      text: 'Hoàn tất xác minh số liệu trước khi chốt đối soát và tổng hợp báo cáo.',
      done: state.mealsClosed,
      route: '/boarding/reports',
    },
  ]
  return (
    <>
      <PageHeader
        eyebrow="VẬN HÀNH & BÁO CÁO / BÁN TRÚ"
        title="Quản lý bán trú"
        description="Theo dõi bữa ăn, lịch trực và chất lượng chăm sóc học sinh mỗi ngày."
        badge={<Badge tone="green">Đang vận hành</Badge>}
        actions={
          <>
            <span className="date-label">
              <CalendarDays size={16} />
              {dateLabel(state.boardingDate, true)}
            </span>
            <Button asChild>
              <Link to="/boarding/menus">
                <Plus size={17} />
                Quản lý thực đơn
              </Link>
            </Button>
          </>
        }
      />
      <BoardingDatePicker />
      <div className="metrics-grid metrics-five">
        <Metric
          label="Đăng ký bán trú"
          value={totals.registered}
          detail={`${state.classes.length} lớp trong dữ liệu demo`}
          icon={UsersRound}
          tone="blue"
        />
        <Metric
          label="Suất ăn dự kiến"
          value={totals.expected}
          detail="Đã trừ suất báo nghỉ hợp lệ"
          icon={Clock3}
          tone="purple"
        />
        <Metric
          label="Suất ăn thực nhận"
          value={totals.recorded ? totals.received : '—'}
          detail={
            totals.pending
              ? `${totals.pending} lớp chưa ghi nhận`
              : `Chênh lệch ${totals.difference} so với dự kiến`
          }
          icon={Soup}
          tone="teal"
        />
        <Metric
          label="Nhân sự trực"
          value={`${confirmed}/${duties.length}`}
          detail="Ca hôm nay đã xác nhận"
          icon={UsersRound}
          tone="green"
        />
        <Metric
          label="Vấn đề cần xử lý"
          value={issues}
          detail="Hồ sơ duyệt & chênh lệch"
          icon={AlertTriangle}
          tone="amber"
        />
      </div>
      <Panel title="Phòng ngủ và điều phối trong ngày">
        <div className="boarding-group-counts">
          <span>
            Nhóm ngủ<strong>{groups.length}</strong>
          </span>
          <span>
            Học sinh dự kiến
            <strong>{groups.reduce((sum, group) => sum + group.expectedCount, 0)}</strong>
          </span>
          <span>
            Học sinh sau điều phối
            <strong>{groups.reduce((sum, group) => sum + group.count, 0)}</strong>
          </span>
        </div>
        <p className="boarding-source-note">
          {groups.filter((group) => group.count === 0).length} nhóm không có học sinh theo lịch hiện
          tại vẫn giữ nhiệm vụ trực để tiếp nhận hoặc hỗ trợ phòng khác.{' '}
          <Link to="/boarding/duties">Mở phân công và điều phối</Link>
        </p>
      </Panel>
      <div className="dashboard-columns">
        <div className="dashboard-primary">
          <Panel
            title="Tiến trình vận hành hôm nay"
            description="Từ kế hoạch thực đơn đến chốt số liệu trong ngày"
            action={
              <Badge tone="blue" dot={false}>
                NGÀY DEMO
              </Badge>
            }
          >
            <div className="operation-timeline">
              {steps.map((step, i) => (
                <div key={step.title} className={step.done ? 'step done' : 'step'}>
                  <span className="operation-icon">
                    {step.done ? <Check size={18} /> : <step.icon size={18} />}
                  </span>
                  <div>
                    <div className="operation-title">
                      <h3>
                        {i + 1}. {step.title}
                      </h3>
                      <Badge tone={step.done ? 'green' : 'amber'}>{step.status}</Badge>
                    </div>
                    <p>{step.text}</p>
                    <TextLink to={step.route}>Xem chi tiết</TextLink>
                  </div>
                </div>
              ))}
            </div>
          </Panel>
          <Panel
            title="Danh sách phân công trực hôm nay"
            action={<TextLink to="/boarding/duties">Xem bảng tuần</TextLink>}
          >
            <DataTable data={duties} columns={columns} searchable={false} />
          </Panel>
        </div>
        <aside className="dashboard-secondary">
          <Panel title="Cảnh báo cần chú ý" icon={AlertTriangle}>
            {pendingMenus.map((menu) => (
              <Alert key={menu.id} title={`${menu.name} chưa duyệt`} tone="amber">
                Nhà bếp đang chờ xác nhận kế hoạch.
                <Link className="alert-link" to={`/boarding/menu-approvals/${menu.id}`}>
                  Duyệt ngay <ArrowRight size={12} />
                </Link>
              </Alert>
            ))}
            {meals.some((row) => !row.resolved) && (
              <Alert
                title={`${meals.filter((row) => !row.resolved).length} lớp chưa hoàn tất bàn giao suất ăn`}
                tone="amber"
              >
                Ghi nhận thực nhận và xác minh chênh lệch với bộ phận nhà bếp.
                <Link className="alert-link" to="/boarding/meals">
                  Kiểm tra đối soát <ArrowRight size={12} />
                </Link>
              </Alert>
            )}
            {issues === 0 && (
              <div className="success-state">
                <CheckCircle2 size={27} />
                <p>Không còn cảnh báo cần xử lý.</p>
              </div>
            )}
          </Panel>
          <Panel title="Thao tác nhanh">
            <div className="quick-links">
              {[
                ['/boarding/menus', 'Tạo thực đơn tuần', 'Lên kế hoạch bữa ăn & dinh dưỡng'],
                ['/boarding/duties', 'Phân công trực', 'Điều phối lịch giáo viên bán trú'],
                ['/boarding/inspections', 'Kiểm tra bán trú', 'An toàn thực phẩm & nền nếp'],
                ['/boarding/reports', 'Xem báo cáo', 'Tổng hợp hoạt động trong kỳ'],
              ].map(([path, title, text]) => (
                <Link to={path} key={path}>
                  <span className="quick-link-icon">
                    <Utensils size={18} />
                  </span>
                  <span>
                    <strong>{title}</strong>
                    <small>{text}</small>
                  </span>
                  <ArrowRight size={16} />
                </Link>
              ))}
            </div>
          </Panel>
          <div className="soft-info-card">
            <ShieldIcon />
            <h3>Chăm sóc từ những điều nhỏ nhất</h3>
            <p>Mỗi bữa ăn an toàn, mỗi giấc ngủ trọn vẹn là nền tảng cho một ngày học tốt.</p>
          </div>
        </aside>
      </div>
    </>
  )
}
function ShieldIcon() {
  return (
    <span className="soft-card-icon">
      <CheckCircle2 size={25} />
    </span>
  )
}
