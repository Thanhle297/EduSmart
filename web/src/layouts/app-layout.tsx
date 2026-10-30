import { useEffect, useState } from 'react'
import {
  Bell,
  Building2,
  CalendarDays,
  ChartNoAxesCombined,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Command,
  Headset,
  LogOut,
  Menu,
  Megaphone,
  PanelLeftClose,
  PanelLeftOpen,
  RotateCcw,
  Search,
  Settings2,
  ShieldCheck,
  Sparkles,
  UsersRound,
  Utensils,
  type LucideIcon,
} from 'lucide-react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useDemo } from '../app/demo-context'
import { currentPage, pages } from '../app/navigation'
import { Avatar, Badge, Brand, DemoNote, TextLink } from '../components/shared/ui'
import { Button } from '../components/ui/button'
import { Dialog } from '../components/ui/dialog'
import { school } from '../lib/config'
import { cn, normalize } from '../lib/utils'

export function AppLayout() {
  const { state, signOut, reset, notify } = useDemo()
  const location = useLocation()
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [boardingOpen, setBoardingOpen] = useState(location.pathname.startsWith('/boarding'))
  const [teachingOpen, setTeachingOpen] = useState(location.pathname.startsWith('/teaching'))
  const [dialog, setDialog] = useState<
    'search' | 'notifications' | 'help' | 'account' | 'reset' | null
  >(null)
  const [query, setQuery] = useState('')
  useEffect(() => {
    if (location.pathname.startsWith('/boarding')) setBoardingOpen(true)
    if (location.pathname.startsWith('/teaching')) setTeachingOpen(true)
  }, [location.pathname])
  useEffect(() => {
    const shortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setDialog((current) => (current === 'search' ? null : 'search'))
      }
    }
    window.addEventListener('keydown', shortcut)
    return () => window.removeEventListener('keydown', shortcut)
  }, [])
  const current = currentPage(location.pathname)
  const pending =
    state.menus.filter((menu) => menu.status === 'pending').length +
    Number(state.planStatus === 'pending')
  const unavailable = (label: string) =>
    notify(`${label}: phân hệ chưa triển khai trong bản demo này.`)
  const navLink = (to: string, label: string, Icon: LucideIcon, count?: number) => (
    <NavLink
      key={to}
      to={to}
      end
      onClick={() => setMobileOpen(false)}
      title={collapsed ? label : undefined}
      className={({ isActive }) => cn('nav-link', isActive && 'active')}
    >
      <Icon size={18} />
      <span>{label}</span>
      {!!count && <b className="nav-count">{count}</b>}
    </NavLink>
  )
  const sidebar = (
    <>
      <div className="sidebar-brand">
        <Link to="/dashboard" aria-label="EduSmart — Trang chủ">
          <Brand compact={collapsed && !mobileOpen} />
        </Link>
        <button
          className="sidebar-toggle"
          aria-label={collapsed ? 'Mở rộng thanh điều hướng' : 'Thu gọn thanh điều hướng'}
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}
        </button>
      </div>
      <div className="sidebar-scroll">
        <div className="nav-group-label">ĐIỀU HÀNH</div>
        {navLink('/dashboard', 'Tổng quan', pages[0].icon)}
        <button className="nav-link" onClick={() => unavailable('Công việc & nhiệm vụ')}>
          <ClipboardIcon />
          <span>Công việc & nhiệm vụ</span>
          <b className="nav-count muted-count">6</b>
        </button>
        <button className="nav-link" onClick={() => unavailable('Lịch công tác')}>
          <CalendarDays size={18} />
          <span>Lịch công tác</span>
        </button>
        <div className="nav-group-label">CHUYÊN MÔN</div>
        <button
          className={cn(
            'nav-link',
            location.pathname.startsWith('/teaching/assignments') ||
              location.pathname === '/teaching/overview'
              ? 'group-active'
              : '',
          )}
          aria-expanded={teachingOpen}
          onClick={() => {
            if (collapsed) {
              navigate('/teaching/overview')
              setCollapsed(false)
            }
            setTeachingOpen(!teachingOpen)
          }}
        >
          <UsersRound size={18} />
          <span>Phân công giảng dạy</span>
          <ChevronDown size={14} className={cn('nav-chevron', teachingOpen && 'expanded')} />
        </button>
        {teachingOpen && !collapsed && (
          <div className="nav-subitems">
            {pages
              .filter((p) => ['/teaching/overview', '/teaching/assignments'].includes(p.path))
              .map((page) => (
                <NavLink end key={page.path} to={page.path} onClick={() => setMobileOpen(false)}>
                  {page.title}
                </NavLink>
              ))}
          </div>
        )}
        {navLink('/teaching/approvals/plan-hk1', 'Hồ sơ chờ duyệt', ShieldCheck, pending)}
        {pages
          .filter((p) =>
            ['/teaching/timetable', '/teaching/substitutions', '/teaching/reconciliation'].includes(
              p.path,
            ),
          )
          .map((page) =>
            navLink(
              page.path,
              page.title === 'Đối soát tiết giảng dạy' ? 'Ngày công – Giờ công' : page.title,
              page.icon,
              page.path.includes('substitutions')
                ? state.substitutions.filter((s) => s.status === 'unassigned').length
                : undefined,
            ),
          )}
        <div className="nav-group-label">VẬN HÀNH & BÁO CÁO</div>
        <button
          className={cn('nav-link', location.pathname.startsWith('/boarding') && 'group-active')}
          aria-expanded={boardingOpen}
          onClick={() => {
            if (collapsed) {
              navigate('/boarding/overview')
              setCollapsed(false)
            }
            setBoardingOpen(!boardingOpen)
          }}
        >
          <Utensils size={18} />
          <span>Bán trú</span>
          <b className="nav-count muted-count">
            {state.menus.filter((m) => m.status === 'pending').length}
          </b>
          <ChevronDown size={14} className={cn('nav-chevron', boardingOpen && 'expanded')} />
        </button>
        {boardingOpen && !collapsed && (
          <div className="nav-subitems">
            {pages
              .filter((page) => page.group === 'Bán trú')
              .map((page) => (
                <NavLink end key={page.path} to={page.path} onClick={() => setMobileOpen(false)}>
                  {page.title}
                </NavLink>
              ))}
          </div>
        )}
        {navLink('/boarding/reports', 'Báo cáo & thống kê', ChartNoAxesCombined)}
        <button className="nav-link" onClick={() => unavailable('Truyền thông')}>
          <Megaphone size={18} />
          <span>Truyền thông</span>
        </button>
        <div className="nav-group-label">CÔNG CỤ & HỆ THỐNG</div>
        <button className="nav-link" onClick={() => unavailable('Trợ lý AI')}>
          <Sparkles size={18} className="purple-text" />
          <span>Trợ lý AI</span>
          <Badge tone="purple" dot={false}>
            AI
          </Badge>
        </button>
        <button className="nav-link" onClick={() => unavailable('Quản trị hệ thống')}>
          <Settings2 size={18} />
          <span>Quản trị hệ thống</span>
        </button>
      </div>
      <div className="sidebar-bottom">
        <button className="support-card" onClick={() => setDialog('help')}>
          <Headset size={22} />
          <span>
            <small>Bạn cần hỗ trợ?</small>
            <strong>Chúng tôi luôn sẵn sàng</strong>
          </span>
          <ChevronRight size={15} />
        </button>
        <div className="sidebar-bottom-actions">
          <button onClick={() => setDialog('help')}>
            <CircleHelp size={16} />
            <span>Trợ giúp</span>
          </button>
          <button onClick={signOut} aria-label="Đăng xuất bản demo" title="Đăng xuất">
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </>
  )
  return (
    <div className={cn('app-shell', collapsed && 'sidebar-collapsed')}>
      <a href="#main-content" className="skip-link">
        Đến nội dung chính
      </a>
      <aside className="sidebar" aria-label="Điều hướng chính">
        {sidebar}
      </aside>
      {mobileOpen && (
        <Dialog
          open
          onOpenChange={setMobileOpen}
          title="Điều hướng EduSmart"
          description={school.fullName}
          drawer
        >
          <nav className="mobile-sidebar" aria-label="Điều hướng di động">
            {sidebar}
          </nav>
        </Dialog>
      )}
      <div className="workspace">
        <header className="app-header">
          <div className="header-left">
            <Button
              size="icon"
              variant="ghost"
              className="mobile-menu-toggle"
              aria-label="Mở menu điều hướng"
              onClick={() => setMobileOpen(true)}
            >
              <Menu size={21} />
            </Button>
            <span className="school-symbol">
              <Building2 size={20} />
            </span>
            <div className="school-title">
              <strong>{school.fullName}</strong>
              <span>Không gian điều hành nhà trường</span>
            </div>
            <span className="header-divider" />
            <span className="school-year">
              Năm học <strong>{school.year}</strong>
              <ChevronDown size={12} />
            </span>
          </div>
          <div className="header-actions">
            <button
              className="global-search"
              onClick={() => setDialog('search')}
              aria-label="Tìm kiếm trang"
            >
              <Search size={15} />
              <span>Tìm kiếm trong EduSmart...</span>
              <kbd>
                <Command size={10} /> K
              </kbd>
            </button>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Thông báo"
              onClick={() => setDialog('notifications')}
              className="notification-button"
            >
              <Bell size={19} />
              {pending > 0 && <span className="notification-dot" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Trợ giúp"
              onClick={() => setDialog('help')}
              className="header-help"
            >
              <CircleHelp size={19} />
            </Button>
            <span className="header-divider" />
            <button className="user-menu" onClick={() => setDialog('account')}>
              <Avatar name={school.principal} />
              <span>
                <strong>{school.principal}</strong>
                <small>{school.role}</small>
              </span>
              <ChevronDown size={13} />
            </button>
          </div>
        </header>
        <main id="main-content" className="main-content" tabIndex={-1}>
          <div className="breadcrumb">
            <Link to="/dashboard">Trang chủ</Link>
            <ChevronRight size={12} />
            {current?.group !== 'Điều hành' && (
              <>
                <span>{current?.group ?? 'Hệ thống'}</span>
                <ChevronRight size={12} />
              </>
            )}
            <span>{current?.title ?? 'Không tìm thấy trang'}</span>
          </div>
          <Outlet />
        </main>
        <footer className="app-footer">
          <span>© 2026 EduSmart · {school.name}</span>
          <span>
            <i />
            Bản demo giao diện<span className="footer-divider">|</span>v0.1.0
          </span>
        </footer>
      </div>
      <Dialog
        open={dialog === 'search'}
        onOpenChange={() => setDialog(null)}
        title="Bạn muốn tìm gì?"
        description="Tìm nhanh các trang trong không gian làm việc."
      >
        <label className="search-input search-large">
          <Search size={19} />
          <input
            autoFocus
            placeholder="Ví dụ: thực đơn, thời khóa biểu..."
            aria-label="Tìm trang"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <div className="search-results">
          {pages
            .filter((page) => normalize(page.title).includes(normalize(query)))
            .map((page) => (
              <Link
                key={page.path}
                to={page.path}
                onClick={() => {
                  setDialog(null)
                  setQuery('')
                }}
              >
                <page.icon size={18} />
                <span>
                  <strong>{page.title}</strong>
                  <small>{page.group}</small>
                </span>
                <ChevronRight size={16} />
              </Link>
            ))}
        </div>
      </Dialog>
      <Dialog
        open={dialog === 'notifications'}
        onOpenChange={() => setDialog(null)}
        title="Thông báo & công việc"
        description="Các hồ sơ và phân công trong dữ liệu demo."
      >
        <div className="notification-list">
          {state.menus
            .filter((m) => m.status === 'pending')
            .map((menu) => (
              <div key={menu.id}>
                <span className="notification-icon">
                  <Utensils size={20} />
                </span>
                <div>
                  <strong>{menu.name} đang chờ duyệt</strong>
                  <p>Nhà bếp đã gửi kế hoạch dinh dưỡng tuần.</p>
                  <Link to={`/boarding/menu-approvals/${menu.id}`} onClick={() => setDialog(null)}>
                    Xem hồ sơ →
                  </Link>
                </div>
              </div>
            ))}
          {state.substitutions
            .filter((s) => s.status === 'unassigned')
            .map((row) => (
              <div key={row.id}>
                <span className="notification-icon tone-amber">
                  <UsersRound size={20} />
                </span>
                <div>
                  <strong>Lớp {row.classId} cần giáo viên dạy thay</strong>
                  <p>
                    {row.subject} · Tiết {row.period}
                  </p>
                  <Link to="/teaching/substitutions" onClick={() => setDialog(null)}>
                    Phân công ngay →
                  </Link>
                </div>
              </div>
            ))}
        </div>
      </Dialog>
      <Dialog
        open={dialog === 'help'}
        onOpenChange={() => setDialog(null)}
        title="Chào bạn, EduSmart có thể giúp gì?"
        description={`Không gian làm việc của ${school.fullName}.`}
      >
        <div className="help-content">
          <div className="help-hero">
            <Headset size={35} />
            <h3>Đồng hành cùng nhà trường</h3>
            <p>
              Đây là bản giao diện demo. Hãy sử dụng thanh tìm kiếm để mở các trang, hoặc liên hệ
              quản trị viên nhà trường khi cần hỗ trợ nghiệp vụ.
            </p>
          </div>
          <DemoNote />
          <p>
            Thông tin học sinh, phê duyệt, ký số, thông báo và giao dịch tài chính thực tế chưa được
            kết nối.
          </p>
          <TextLink to="/dashboard">Về trang tổng quan</TextLink>
        </div>
      </Dialog>
      <Dialog
        open={dialog === 'account'}
        onOpenChange={() => setDialog(null)}
        title="Tài khoản demo"
        description={school.fullName}
      >
        <div className="account-summary">
          <Avatar name={school.principal} />
          <div>
            <h3>{school.principal}</h3>
            <p>{school.role} · Phiên mô phỏng</p>
          </div>
        </div>
        <div className="account-options">
          <Button variant="secondary" onClick={() => setDialog('reset')}>
            <RotateCcw size={16} />
            Khôi phục dữ liệu demo
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              setDialog(null)
              signOut()
            }}
          >
            <LogOut size={16} />
            Đăng xuất
          </Button>
        </div>
      </Dialog>
      <Dialog
        open={dialog === 'reset'}
        onOpenChange={() => setDialog(null)}
        title="Khôi phục dữ liệu ban đầu?"
        description="Các thay đổi trong phiên demo sẽ được thay bằng bộ dữ liệu mẫu ban đầu."
      >
        <div className="dialog-actions">
          <Button variant="secondary" onClick={() => setDialog(null)}>
            Giữ thay đổi
          </Button>
          <Button
            onClick={() => {
              reset()
              setDialog(null)
            }}
          >
            <RotateCcw size={16} />
            Khôi phục
          </Button>
        </div>
      </Dialog>
    </div>
  )
}
function ClipboardIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      aria-hidden="true"
    >
      <rect x="6" y="4" width="14" height="17" rx="2" />
      <path d="M10 4V2h6v4h-6M3 7v13a3 3 0 0 0 3 3m4-12h6m-6 4h6" />
    </svg>
  )
}
