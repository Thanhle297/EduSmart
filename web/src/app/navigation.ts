import {
  CalendarDays,
  CalendarRange,
  ClipboardCheck,
  ClipboardList,
  CookingPot,
  FileBarChart2,
  GraduationCap,
  LayoutDashboard,
  ListChecks,
  NotebookPen,
  RefreshCw,
  ShieldCheck,
  Soup,
  UsersRound,
  Utensils,
  type LucideIcon,
} from 'lucide-react'

export interface PageLink {
  title: string
  path: string
  group: string
  icon: LucideIcon
}
export const pages: PageLink[] = [
  { title: 'Tổng quan điều hành', path: '/dashboard', group: 'Điều hành', icon: LayoutDashboard },
  { title: 'Tổng quan bán trú', path: '/boarding/overview', group: 'Bán trú', icon: Utensils },
  { title: 'Quản lý thực đơn', path: '/boarding/menus', group: 'Bán trú', icon: CookingPot },
  {
    title: 'Duyệt thực đơn',
    path: '/boarding/menu-approvals/menu-w44',
    group: 'Bán trú',
    icon: ShieldCheck,
  },
  { title: 'Phân công trực bán trú', path: '/boarding/duties', group: 'Bán trú', icon: UsersRound },
  {
    title: 'Kiểm tra bán trú',
    path: '/boarding/inspections',
    group: 'Bán trú',
    icon: ClipboardCheck,
  },
  { title: 'Suất ăn & đối soát', path: '/boarding/meals', group: 'Bán trú', icon: Soup },
  { title: 'Báo cáo bán trú', path: '/boarding/reports', group: 'Bán trú', icon: FileBarChart2 },
  {
    title: 'Tổng quan giảng dạy',
    path: '/teaching/overview',
    group: 'Chuyên môn',
    icon: GraduationCap,
  },
  {
    title: 'Bảng phân công chuyên môn',
    path: '/teaching/assignments',
    group: 'Chuyên môn',
    icon: ClipboardList,
  },
  {
    title: 'Tạo phân công',
    path: '/teaching/assignments/new',
    group: 'Chuyên môn',
    icon: NotebookPen,
  },
  {
    title: 'Phê duyệt phân công',
    path: '/teaching/approvals/plan-hk1',
    group: 'Chuyên môn',
    icon: ShieldCheck,
  },
  {
    title: 'Thời khóa biểu',
    path: '/teaching/timetable',
    group: 'Chuyên môn',
    icon: CalendarRange,
  },
  {
    title: 'Phân công dạy thay',
    path: '/teaching/substitutions',
    group: 'Chuyên môn',
    icon: RefreshCw,
  },
  {
    title: 'Đối soát tiết giảng dạy',
    path: '/teaching/reconciliation',
    group: 'Chuyên môn',
    icon: ListChecks,
  },
]
export const calendarIcon = CalendarDays
export function currentPage(pathname: string): PageLink | undefined {
  if (/\/teaching\/assignments\/[^/]+\/edit$/.test(pathname))
    return { title: 'Chỉnh sửa phân công', path: pathname, group: 'Chuyên môn', icon: NotebookPen }
  if (pathname.startsWith('/boarding/menu-approvals/'))
    return { title: 'Duyệt thực đơn', path: pathname, group: 'Bán trú', icon: ShieldCheck }
  if (pathname.startsWith('/teaching/approvals/'))
    return { title: 'Phê duyệt phân công', path: pathname, group: 'Chuyên môn', icon: ShieldCheck }
  return pages.find((page) => page.path === pathname)
}
