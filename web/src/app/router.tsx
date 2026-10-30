import { lazy, Suspense, useEffect } from 'react'
import { createBrowserRouter, Link, Navigate, useLocation, useRouteError } from 'react-router-dom'
import { ArrowLeft, GraduationCap, LoaderCircle, RefreshCw } from 'lucide-react'
import { useDemo } from './demo-context'
import { currentPage } from './navigation'
import { school } from '../lib/config'
import { AppLayout } from '../layouts/app-layout'
import { Button } from '../components/ui/button'

const LoginPage = lazy(() => import('../features/auth/login-page'))
const DashboardPage = lazy(() => import('../features/dashboard/dashboard-page'))
const BoardingOverview = lazy(() =>
  import('../features/boarding/overview').then((m) => ({ default: m.BoardingOverviewPage })),
)
const Menus = lazy(() =>
  import('../features/boarding/menus').then((m) => ({ default: m.MenusPage })),
)
const MenuApproval = lazy(() =>
  import('../features/boarding/menus').then((m) => ({ default: m.MenuApprovalPage })),
)
const Duties = lazy(() =>
  import('../features/boarding/operations').then((m) => ({ default: m.DutiesPage })),
)
const Inspections = lazy(() =>
  import('../features/boarding/operations').then((m) => ({ default: m.InspectionsPage })),
)
const Meals = lazy(() =>
  import('../features/boarding/operations').then((m) => ({ default: m.MealsPage })),
)
const BoardingReports = lazy(() =>
  import('../features/boarding/reports').then((m) => ({ default: m.BoardingReportsPage })),
)
const TeachingOverview = lazy(() =>
  import('../features/teaching/overview').then((m) => ({ default: m.TeachingOverviewPage })),
)
const TeachingApproval = lazy(() =>
  import('../features/teaching/overview').then((m) => ({ default: m.TeachingApprovalPage })),
)
const Assignments = lazy(() =>
  import('../features/teaching/assignments').then((m) => ({ default: m.AssignmentsPage })),
)
const AssignmentEditor = lazy(() =>
  import('../features/teaching/assignments').then((m) => ({ default: m.AssignmentEditorPage })),
)
const Timetable = lazy(() =>
  import('../features/teaching/scheduling').then((m) => ({ default: m.TimetablePage })),
)
const Substitutions = lazy(() =>
  import('../features/teaching/scheduling').then((m) => ({ default: m.SubstitutionsPage })),
)
const TeachingReconciliation = lazy(() =>
  import('../features/teaching/reconciliation').then((m) => ({
    default: m.TeachingReconciliationPage,
  })),
)

function LoadingPage() {
  return (
    <div className="page-loading" role="status">
      <LoaderCircle className="spin" size={26} />
      <span>Đang mở không gian làm việc...</span>
    </div>
  )
}
function ProtectedApp() {
  const { authenticated } = useDemo()
  const location = useLocation()
  useEffect(() => {
    document.title = `${currentPage(location.pathname)?.title ?? 'EduSmart'} · ${school.name}`
  }, [location.pathname])
  return authenticated ? (
    <AppLayout />
  ) : (
    <Navigate
      to="/login"
      replace
      state={{
        from: location.pathname === '/' ? '/dashboard' : location.pathname + location.search,
      }}
    />
  )
}
function SystemPage({ forbidden = false }: { forbidden?: boolean }) {
  return (
    <div className="system-page">
      <span className="system-page-code">{forbidden ? '403' : '404'}</span>
      <GraduationCap size={40} />
      <h1>
        {forbidden ? 'Bạn chưa có quyền truy cập' : 'Trang này chưa có trong không gian làm việc'}
      </h1>
      <p>
        {forbidden
          ? 'Quyền truy cập thực tế chưa được tích hợp trong bản demo. Vui lòng liên hệ quản trị viên nhà trường.'
          : 'Đường dẫn có thể đã thay đổi hoặc không tồn tại. Hãy trở về trang tổng quan để tiếp tục.'}
      </p>
      <Button asChild>
        <Link to="/dashboard">
          <ArrowLeft size={16} />
          Về trang tổng quan
        </Link>
      </Button>
    </div>
  )
}
function RouteError() {
  const error = useRouteError()
  console.error(error)
  return (
    <div className="system-page">
      <GraduationCap size={40} />
      <h1>Không thể hiển thị trang</h1>
      <p>Hãy tải lại ứng dụng. Dữ liệu mô phỏng sẽ được khôi phục.</p>
      <Button onClick={() => window.location.reload()}>
        <RefreshCw size={16} />
        Tải lại ứng dụng
      </Button>
    </div>
  )
}
const suspense = (page: React.ReactNode) => <Suspense fallback={<LoadingPage />}>{page}</Suspense>
export const router = createBrowserRouter([
  { path: '/login', element: suspense(<LoginPage />), errorElement: <RouteError /> },
  {
    path: '/',
    element: <ProtectedApp />,
    errorElement: <RouteError />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: suspense(<DashboardPage />) },
      { path: 'boarding/overview', element: suspense(<BoardingOverview />) },
      { path: 'boarding/menus', element: suspense(<Menus />) },
      { path: 'boarding/menu-approvals/:menuId', element: suspense(<MenuApproval />) },
      { path: 'boarding/duties', element: suspense(<Duties />) },
      { path: 'boarding/inspections', element: suspense(<Inspections />) },
      { path: 'boarding/meals', element: suspense(<Meals />) },
      { path: 'boarding/reports', element: suspense(<BoardingReports />) },
      { path: 'teaching/overview', element: suspense(<TeachingOverview />) },
      { path: 'teaching/assignments', element: suspense(<Assignments />) },
      { path: 'teaching/assignments/new', element: suspense(<AssignmentEditor />) },
      { path: 'teaching/assignments/:assignmentId/edit', element: suspense(<AssignmentEditor />) },
      { path: 'teaching/approvals/:planId', element: suspense(<TeachingApproval />) },
      { path: 'teaching/timetable', element: suspense(<Timetable />) },
      { path: 'teaching/substitutions', element: suspense(<Substitutions />) },
      { path: 'teaching/reconciliation', element: suspense(<TeachingReconciliation />) },
      { path: '403', element: <SystemPage forbidden /> },
      { path: '*', element: <SystemPage /> },
    ],
  },
])
