import { useState } from 'react'
import {
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  CircleCheck,
  ClipboardList,
  Clock3,
  FileCheck2,
  FolderClock,
  Plus,
  RefreshCw,
  Sparkles,
  TrendingUp,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useDemo } from '../../app/demo-context'
import {
  Alert,
  Avatar,
  Badge,
  Metric,
  PageHeader,
  Panel,
  Progress,
  StatusBadge,
  TextLink,
} from '../../components/shared/ui'
import { Button } from '../../components/ui/button'
import { DEMO_DATE } from '../../lib/config'
import { dateLabel } from '../../lib/utils'

export default function DashboardPage() {
  const { state, notify } = useDemo()
  const [range, setRange] = useState('week')
  const tasks = range === 'week' ? state.tasks : state.tasks.filter((task) => !task.complete)
  const complete = tasks.filter((task) => task.complete).length
  const pendingMenus = state.menus.filter((menu) => menu.status === 'pending')
  const unassigned = state.substitutions.filter((row) => row.status === 'unassigned')
  const pendingCount = pendingMenus.length + Number(state.planStatus === 'pending')
  const failureCount = state.inspections.filter((row) => row.result === 'fail').length
  const progress = Math.round((complete / tasks.length) * 100)
  return (
    <>
      <PageHeader
        eyebrow="KHÔNG GIAN ĐIỀU HÀNH"
        title="Tổng quan điều hành"
        description="Theo dõi hoạt động và công việc nhà trường trong một không gian."
        actions={
          <>
            <div className="segmented">
              <button className={range === 'day' ? 'selected' : ''} onClick={() => setRange('day')}>
                Hôm nay
              </button>
              <button
                className={range === 'week' ? 'selected' : ''}
                onClick={() => setRange('week')}
              >
                Tuần này
              </button>
            </div>
            <Button variant="secondary" className="date-button">
              <CalendarDays size={15} />
              {dateLabel(DEMO_DATE, true)}
            </Button>
            <Button
              onClick={() =>
                notify('Giao nhiệm vụ thuộc phân hệ công việc, chưa triển khai trong bản demo.')
              }
            >
              <Plus size={17} />
              Giao nhiệm vụ
            </Button>
          </>
        }
      />
      <div className="metrics-grid metrics-five">
        <Metric
          label="Tổng nhiệm vụ"
          value={tasks.length}
          detail="Trong khoảng thời gian đã chọn"
          icon={ClipboardList}
          tone="blue"
        />
        <Metric
          label="Đã hoàn thành"
          value={complete}
          detail={`${progress}% công việc trong kỳ`}
          icon={CircleCheck}
          tone="green"
        />
        <Metric
          label="Hồ sơ chờ duyệt"
          value={pendingCount}
          detail="Cần Ban Giám hiệu xem xét"
          icon={FolderClock}
          tone="amber"
        />
        <Metric
          label="Tiết cần dạy thay"
          value={unassigned.length}
          detail="Cần điều phối giáo viên"
          icon={RefreshCw}
          tone="teal"
        />
        <Metric
          label="Sự cố chưa xử lý"
          value={failureCount}
          detail="Ưu tiên kiểm tra an toàn"
          icon={AlertTriangle}
          tone="red"
        />
      </div>
      <div className="dashboard-columns">
        <div className="dashboard-primary">
          <Panel
            title="Công việc cần xử lý"
            action={
              <Badge tone="blue">{state.tasks.filter((t) => !t.complete).length} công việc</Badge>
            }
          >
            <div className="table-scroll">
              <table className="task-table">
                <thead>
                  <tr>
                    <th>TÊN CÔNG VIỆC</th>
                    <th>NGƯỜI PHỤ TRÁCH</th>
                    <th>HẠN HOÀN THÀNH</th>
                    <th>MỨC ĐỘ</th>
                    <th>THAO TÁC</th>
                  </tr>
                </thead>
                <tbody>
                  {state.tasks
                    .filter((task) => !task.complete)
                    .slice(0, 5)
                    .map((task, i) => (
                      <tr key={task.id}>
                        <td>
                          <strong>{task.title}</strong>
                          <small>{task.subtitle}</small>
                        </td>
                        <td>
                          <div className="person-cell">
                            <Avatar name={task.owner} tone={i % 2 ? 'teal' : 'amber'} small />
                            <span>{task.owner}</span>
                          </div>
                        </td>
                        <td>
                          <strong className={task.priority === 'high' ? 'red-text' : ''}>
                            {task.deadline}
                          </strong>
                          <small>Hôm nay</small>
                        </td>
                        <td>
                          <Badge tone={task.priority === 'high' ? 'red' : 'amber'} dot={false}>
                            {task.priority === 'high' ? 'Khẩn cấp' : 'Trung bình'}
                          </Badge>
                        </td>
                        <td>
                          {task.route ? (
                            <Button variant={i < 2 ? 'soft' : 'ghost'} size="sm" asChild>
                              <Link to={task.route}>
                                {i === 0 ? 'Xét duyệt' : i === 1 ? 'Phân công' : 'Chi tiết'}
                                <ArrowRight size={13} />
                              </Link>
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => notify('Hồ sơ công việc chung chưa được kết nối.')}
                            >
                              Xem
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
            <div className="panel-bottom-note">
              <Clock3 size={13} />
              Dữ liệu nhiệm vụ tuần demo · {state.tasks.length} công việc
            </div>
          </Panel>
          <Panel
            title="Hồ sơ chờ phê duyệt"
            description="Những hồ sơ đang cần quyết định từ Ban Giám hiệu"
            action={<Badge tone="amber">{pendingCount} hồ sơ</Badge>}
          >
            <div className="approval-list">
              {pendingMenus.map((menu) => (
                <div className="approval-item" key={menu.id}>
                  <span className="approval-icon tone-blue">
                    <FileCheck2 size={23} />
                  </span>
                  <div>
                    <strong>{menu.name} · Kế hoạch dinh dưỡng</strong>
                    <p>
                      Bộ phận bán trú · {menu.author} · v{menu.version}
                    </p>
                    <StatusBadge status={menu.status} />
                  </div>
                  <Button variant="secondary" size="sm" asChild>
                    <Link to={`/boarding/menu-approvals/${menu.id}`}>
                      Xem hồ sơ
                      <ArrowRight size={14} />
                    </Link>
                  </Button>
                </div>
              ))}
              {state.planStatus === 'pending' && (
                <div className="approval-item">
                  <span className="approval-icon tone-teal">
                    <ClipboardList size={23} />
                  </span>
                  <div>
                    <strong>Kế hoạch phân công giảng dạy học kỳ I</strong>
                    <p>Tổ chuyên môn · Thầy Trần Văn Nam</p>
                    <StatusBadge status={state.planStatus} />
                  </div>
                  <Button variant="secondary" size="sm" asChild>
                    <Link to="/teaching/approvals/plan-hk1">
                      Xem hồ sơ
                      <ArrowRight size={14} />
                    </Link>
                  </Button>
                </div>
              )}
              {pendingCount === 0 && (
                <div className="success-state">
                  <CheckCircle2 size={28} />
                  <h3>Bạn đã xử lý hết hồ sơ!</h3>
                  <p>Không có hồ sơ đang chờ phê duyệt.</p>
                </div>
              )}
            </div>
          </Panel>
        </div>
        <aside className="dashboard-secondary">
          <Panel
            title="Cảnh báo cần chú ý"
            icon={AlertTriangle}
            action={<span className="red-dot" />}
            className="alerts-panel"
          >
            {unassigned.length > 0 && (
              <Alert title={`${unassigned.length} tiết chưa có giáo viên dạy thay`} tone="red">
                <span>Cần điều phối giáo viên phù hợp để bảo đảm lịch học.</span>
                <Link to="/teaching/substitutions" className="alert-link">
                  Phân công ngay <ArrowRight size={12} />
                </Link>
              </Alert>
            )}
            {!state.mealsClosed && (
              <Alert title={`Đối soát bán trú ngày ${dateLabel(state.boardingDate)} đang mở`} tone="amber">
                Kiểm tra và xác minh chênh lệch trước khi chốt ngày.
                <Link to="/boarding/meals" className="alert-link">
                  Kiểm tra số liệu <ArrowRight size={12} />
                </Link>
              </Alert>
            )}
            <div className="ai-insight">
              <span className="ai-label">
                <Sparkles size={15} />
                GÓC THÔNG TIN EDUSMART
              </span>
              <strong>Một ngày làm việc, mọi kết nối.</strong>
              <p>Lịch công tác, bán trú và giảng dạy được tập trung trong cùng không gian.</p>
              <TextLink to="/teaching/overview">Khám phá chuyên môn</TextLink>
            </div>
          </Panel>
          <Panel
            title={`Tiến độ ${range === 'week' ? 'nhiệm vụ tuần' : 'hôm nay'}`}
            action={<TrendingUp size={18} className="green-text" />}
          >
            <div className="progress-summary">
              <div>
                <span>Tỷ lệ hoàn thành chung</span>
                <strong>
                  {progress}
                  <small>%</small>
                </strong>
              </div>
              <Progress value={progress} tone="green" />
              <ul>
                <li>
                  <i className="legend-green" />
                  Hoàn thành<strong>{complete} việc</strong>
                </li>
                <li>
                  <i className="legend-blue" />
                  Đang thực hiện<strong>{tasks.length - complete} việc</strong>
                </li>
              </ul>
            </div>
          </Panel>
          <Panel title="Lịch công tác hôm nay" icon={CalendarDays}>
            <div className="agenda-list">
              {[
                ['09:30', 'Họp giao ban tổ chuyên môn', 'Phòng họp số 1 · Ban Giám hiệu'],
                ['14:00', 'Dự giờ chuyên đề KHTN', 'Lớp 7A3 · Tổ Khoa học Tự nhiên'],
                ['16:30', 'Kiểm tra thiết bị bộ môn', 'Phòng Tin học · Dãy B'],
              ].map(([time, title, room]) => (
                <div key={time}>
                  <time>{time}</time>
                  <span>
                    <strong>{title}</strong>
                    <small>{room}</small>
                  </span>
                </div>
              ))}
            </div>
          </Panel>
        </aside>
      </div>
    </>
  )
}
