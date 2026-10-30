import { Children, cloneElement, isValidElement, useEffect, useId, type ReactNode } from 'react'
import {
  AlertCircle,
  ArrowRight,
  ArrowUpRight,
  Check,
  CheckCircle2,
  CircleHelp,
  Download,
  FileSearch,
  GraduationCap,
  Info,
  X,
  type LucideIcon,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useDemo, type Notice } from '../../app/demo-context'
import { cn, initials } from '../../lib/utils'
import type { Tone, WorkflowStatus } from '../../mocks/types'
import { Button } from '../ui/button'

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="brand">
      <span className="brand-mark">
        <GraduationCap size={23} strokeWidth={1.8} />
      </span>
      {!compact && (
        <span>
          <strong>
            EduSmart<span className="brand-dot">.</span>
          </strong>
          <small>Quản lý trường học</small>
        </span>
      )}
    </div>
  )
}
export function Avatar({
  name,
  tone = 'blue',
  small = false,
}: {
  name: string
  tone?: Tone
  small?: boolean
}) {
  return (
    <span aria-hidden="true" className={cn('avatar', `tone-${tone}`, small && 'avatar-small')}>
      {initials(name)}
    </span>
  )
}
export function Badge({
  children,
  tone = 'slate',
  dot = true,
}: {
  children: ReactNode
  tone?: Tone
  dot?: boolean
}) {
  return (
    <span className={cn('badge', `tone-${tone}`)}>
      {dot && <span className="badge-dot" />}
      {children}
    </span>
  )
}
const statuses: Record<WorkflowStatus, [string, Tone]> = {
  draft: ['Bản nháp', 'slate'],
  pending: ['Chờ phê duyệt', 'amber'],
  approved: ['Đã phê duyệt', 'green'],
  revision_requested: ['Yêu cầu chỉnh sửa', 'red'],
}
export function StatusBadge({ status }: { status: WorkflowStatus }) {
  const [label, tone] = statuses[status]
  return <Badge tone={tone}>{label}</Badge>
}
export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  badge,
}: {
  eyebrow?: string
  title: string
  description: string
  actions?: ReactNode
  badge?: ReactNode
}) {
  return (
    <header className="page-heading">
      {eyebrow && <div className="eyebrow">{eyebrow}</div>}
      <div className="page-heading-row">
        <div>
          <div className="title-row">
            <h1>{title}</h1>
            {badge}
          </div>
          <p>{description}</p>
        </div>
        {actions && <div className="page-actions">{actions}</div>}
      </div>
    </header>
  )
}
export function Panel({
  title,
  description,
  action,
  children,
  className,
  icon: Icon,
}: {
  title?: string
  description?: string
  action?: ReactNode
  children: ReactNode
  className?: string
  icon?: LucideIcon
}) {
  return (
    <section className={cn('panel', className)}>
      {title && (
        <div className="panel-heading">
          <div>
            <h2>
              {Icon && <Icon size={18} />} {title}
            </h2>
            {description && <p>{description}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  )
}
export function Metric({
  label,
  value,
  detail,
  icon: Icon,
  tone = 'blue',
  trend,
}: {
  label: string
  value: ReactNode
  detail: string
  icon: LucideIcon
  tone?: Tone
  trend?: string
}) {
  return (
    <div className="metric-card">
      <div className="metric-top">
        <span>{label}</span>
        <span className={cn('metric-icon', `tone-${tone}`)}>
          <Icon size={19} />
        </span>
      </div>
      <strong className="metric-value">{value}</strong>
      <div className="metric-detail">
        {trend && (
          <span className="metric-trend">
            <ArrowUpRight size={13} />
            {trend}
          </span>
        )}
        <span>{detail}</span>
      </div>
    </div>
  )
}
export function Alert({
  title,
  children,
  tone = 'amber',
  action,
}: {
  title: string
  children?: ReactNode
  tone?: Tone
  action?: ReactNode
}) {
  return (
    <div className={cn('alert', `tone-${tone}`)}>
      <AlertCircle size={20} />
      <div>
        <strong>{title}</strong>
        {children && <p>{children}</p>}
      </div>
      {action}
    </div>
  )
}
export function Field({
  label,
  children,
  error,
  hint,
  className,
}: {
  label: string
  children: ReactNode
  error?: string
  hint?: string
  className?: string
}) {
  const id = useId()
  const descriptionId = error || hint ? `${id}-description` : undefined
  return (
    <div className={cn('field', className)}>
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      {connectField(children, id, descriptionId, !!error)}
      {error && (
        <small id={descriptionId} className="field-error">
          {error}
        </small>
      )}
      {hint && !error && <small id={descriptionId}>{hint}</small>}
    </div>
  )
}
function connectField(
  children: ReactNode,
  id: string,
  descriptionId: string | undefined,
  invalid: boolean,
): ReactNode {
  return Children.map(children, (child) => {
    if (
      !isValidElement<{
        children?: ReactNode
        id?: string
        'aria-describedby'?: string
        'aria-invalid'?: boolean
      }>(child)
    )
      return child
    if (typeof child.type === 'string' && ['input', 'select', 'textarea'].includes(child.type))
      return cloneElement(child, { id, 'aria-describedby': descriptionId, 'aria-invalid': invalid })
    return child.props.children
      ? cloneElement(child, {
          children: connectField(child.props.children, id, descriptionId, invalid),
        })
      : child
  })
}
export function EmptyState({
  title = 'Không có dữ liệu phù hợp',
  description = 'Hãy thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.',
  action,
}: {
  title?: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="empty-state">
      <span>
        <FileSearch size={28} />
      </span>
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  )
}
export function Progress({ value, tone = 'blue' }: { value: number; tone?: Tone }) {
  return (
    <div
      className="progress"
      role="progressbar"
      aria-label="Tiến độ hoàn thành"
      aria-valuenow={Math.round(value)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <span
        className={`progress-${tone}`}
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  )
}
export function TextLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link className="text-link" to={to}>
      {children}
      <ArrowRight size={14} />
    </Link>
  )
}
export function DemoNote({ children }: { children?: ReactNode }) {
  return (
    <p className="demo-note">
      <Info size={14} />
      {children ?? 'Dữ liệu mô phỏng · Không kết nối hệ thống nghiệp vụ thực tế.'}
    </p>
  )
}
export function ExportButton({
  onClick,
  label = 'Xuất CSV',
}: {
  onClick: () => void
  label?: string
}) {
  return (
    <Button variant="secondary" onClick={onClick}>
      <Download size={16} />
      {label}
    </Button>
  )
}
export function PendingFeatureButton({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  const { notify } = useDemo()
  return (
    <Button
      variant="ghost"
      className={className}
      onClick={() => notify('Tính năng này chưa tích hợp trong bản giao diện demo.')}
    >
      <CircleHelp size={16} />
      {children}
    </Button>
  )
}
function NoticeItem({ notice }: { notice: Notice }) {
  const { dismiss } = useDemo()
  useEffect(() => {
    const timer = window.setTimeout(() => dismiss(notice.id), 5500)
    return () => clearTimeout(timer)
  }, [notice.id, dismiss])
  const Icon =
    notice.tone === 'success' ? CheckCircle2 : notice.tone === 'error' ? AlertCircle : Info
  return (
    <div
      className={cn('toast', `toast-${notice.tone}`)}
      role={notice.tone === 'error' ? 'alert' : 'status'}
    >
      <Icon size={20} />
      <span>{notice.text}</span>
      <button onClick={() => dismiss(notice.id)} aria-label="Đóng thông báo">
        <X size={16} />
      </button>
    </div>
  )
}
export function Notices() {
  const { notices } = useDemo()
  return (
    <div className="toast-stack">
      {notices.map((notice) => (
        <NoticeItem key={notice.id} notice={notice} />
      ))}
    </div>
  )
}
export function Timeline({ entityId }: { entityId: string }) {
  const { state } = useDemo()
  const events = state.events.filter((row) => row.entityId === entityId)
  return events.length ? (
    <ol className="timeline">
      {events.map((event) => (
        <li key={event.id}>
          <span className="timeline-dot">
            <Check size={12} />
          </span>
          <div>
            <strong>{event.title}</strong>
            <small>{event.time}</small>
            {event.note && <p>{event.note}</p>}
          </div>
        </li>
      ))}
    </ol>
  ) : (
    <p className="muted padded">Chưa có thao tác trong phiên demo này.</p>
  )
}
