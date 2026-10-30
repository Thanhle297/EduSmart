import { useEffect, useState } from 'react'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import {
  ArrowRight,
  Building2,
  Check,
  Eye,
  EyeOff,
  Headset,
  Info,
  LoaderCircle,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { Navigate, useLocation } from 'react-router-dom'
import { useDemo } from '../../app/demo-context'
import { Brand, Field } from '../../components/shared/ui'
import { Button } from '../../components/ui/button'
import { Dialog } from '../../components/ui/dialog'
import { DEMO_LOGIN, school } from '../../lib/config'

const loginSchema = z.object({
  username: z.string().min(1, 'Nhập tên đăng nhập hoặc email.'),
  password: z.string().min(1, 'Nhập mật khẩu demo.'),
  remember: z.boolean(),
})
type LoginForm = z.infer<typeof loginSchema>

export default function LoginPage() {
  const { authenticated, signIn } = useDemo()
  useEffect(() => {
    document.title = `Đăng nhập · EduSmart · ${school.name}`
  }, [])
  const [visible, setVisible] = useState(false)
  const [help, setHelp] = useState(false)
  const [error, setError] = useState('')
  const location = useLocation()
  const destination =
    typeof location.state?.from === 'string' &&
    location.state.from.startsWith('/') &&
    !location.state.from.startsWith('//')
      ? location.state.from
      : '/dashboard'
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: '', password: '', remember: false },
  })
  if (authenticated) return <Navigate to={destination} replace />
  const onSubmit = async (values: LoginForm) => {
    setError('')
    await Promise.resolve()
    if (values.username !== DEMO_LOGIN.username || values.password !== DEMO_LOGIN.password) {
      setError(
        'Chỉ hỗ trợ tài khoản demo. Dùng nút “Trải nghiệm bản demo” bên dưới, không nhập mật khẩu thật.',
      )
      return
    }
    signIn(values.remember)
  }
  return (
    <main className="login-page">
      <div className="login-top">
        <Brand />
        <span>Nền tảng quản lý trường học thông minh</span>
        <Button variant="ghost" onClick={() => setHelp(true)}>
          <CircleHelpIcon />
          Bạn cần hỗ trợ?
        </Button>
      </div>
      <div className="login-card">
        <section className="login-story">
          <div className="login-story-tag">
            <Sparkles size={14} /> KẾT NỐI ĐỂ PHÁT TRIỂN
          </div>
          <h1>
            Điều hành nhà trường,
            <br />
            kết nối <span>mỗi ngày.</span>
          </h1>
          <p>
            Không gian làm việc chung cho Ban Giám hiệu,
            <br className="desktop-break" /> giáo viên và nhân viên nhà trường.
          </p>
          <SchoolIllustration />
          <div className="story-checks">
            {['Điều hành tập trung', 'Kết nối đội ngũ', 'Dữ liệu minh bạch'].map((text) => (
              <span key={text}>
                <Check size={13} />
                {text}
              </span>
            ))}
          </div>
          <div className="login-story-bottom">
            <span className="live-dot" />
            Công việc & hồ sơ <span>·</span> Lịch công tác <span>·</span> Bán trú
          </div>
        </section>
        <section className="login-form-side">
          <div className="login-school">
            <Building2 size={14} />
            {school.fullName}
          </div>
          <h2>
            Chào mừng trở lại<span> 👋</span>
          </h2>
          <p className="login-subtitle">Đăng nhập để bắt đầu một ngày làm việc hiệu quả.</p>
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <Field label="Tên đăng nhập hoặc email" error={errors.username?.message}>
              <input
                {...register('username')}
                placeholder="Nhập tên đăng nhập hoặc email"
                autoComplete="username"
                aria-invalid={!!errors.username}
              />
            </Field>
            <Field label="Mật khẩu" error={errors.password?.message}>
              <span className="password-input">
                <input
                  {...register('password')}
                  type={visible ? 'text' : 'password'}
                  placeholder="Nhập mật khẩu demo"
                  autoComplete="current-password"
                  aria-invalid={!!errors.password}
                />
                <button
                  type="button"
                  onClick={() => setVisible(!visible)}
                  aria-label={visible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                >
                  {visible ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </span>
            </Field>
            <div className="login-options">
              <label>
                <input type="checkbox" {...register('remember')} />
                Ghi nhớ phiên demo
              </label>
              <button type="button" onClick={() => setHelp(true)}>
                Quên mật khẩu?
              </button>
            </div>
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            <Button type="submit" className="login-submit" disabled={isSubmitting}>
              {isSubmitting ? <LoaderCircle size={17} className="spin" /> : null}Đăng nhập
              <ArrowRight size={17} />
            </Button>
          </form>
          <div className="login-divider">
            <span>HOẶC KHÁM PHÁ TRƯỚC</span>
          </div>
          <Button variant="secondary" className="demo-login" onClick={() => signIn(false)}>
            <Sparkles size={17} />
            Trải nghiệm bản demo
            <ArrowRight size={15} />
          </Button>
          <div className="login-demo-info">
            <Info size={16} />
            <p>
              Giao diện nguyên mẫu, chưa kết nối xác thực thực tế. Không sử dụng tài khoản hoặc mật
              khẩu thật.
            </p>
          </div>
          <div className="login-support">
            <ShieldCheck size={15} />
            <span>Tài khoản do nhà trường cấp.</span>
            <button onClick={() => setHelp(true)}>Liên hệ quản trị viên</button>
          </div>
        </section>
      </div>
      <footer className="login-footer">
        <span>© 2026 EduSmart Platform</span>
        <span>
          <button onClick={() => setHelp(true)}>Thông tin bản demo</button>
          <i />
          Dành cho {school.name}
        </span>
        <span>
          <span className="live-dot" /> Đồng hành cùng giáo dục
        </span>
      </footer>
      <Dialog
        open={help}
        onOpenChange={setHelp}
        title="Hỗ trợ truy cập EduSmart"
        description={school.fullName}
      >
        <div className="help-content">
          <Headset size={30} />
          <p>
            Đây là giao diện nguyên mẫu. Chọn “Trải nghiệm bản demo” để xem các trang với dữ liệu mô
            phỏng.
          </p>
          <p>
            Tài khoản demo: <strong>{DEMO_LOGIN.username}</strong>
            <br />
            Mật khẩu demo: <strong>{DEMO_LOGIN.password}</strong>
          </p>
          <p>
            Chức năng khôi phục mật khẩu và các chính sách vận hành thật chưa được tích hợp. Vui
            lòng liên hệ quản trị viên nhà trường khi hệ thống chính thức được triển khai.
          </p>
        </div>
      </Dialog>
    </main>
  )
}
function CircleHelpIcon() {
  return <span aria-hidden="true">ⓘ</span>
}
function SchoolIllustration() {
  return (
    <div className="school-illustration" aria-hidden="true">
      <svg viewBox="0 0 480 270" fill="none">
        <defs>
          <linearGradient id="school-fill" x1="100" y1="100" x2="350" y2="260">
            <stop stopColor="#fff" />
            <stop offset="1" stopColor="#e0ecff" />
          </linearGradient>
        </defs>
        <circle cx="382" cy="77" r="36" fill="#e0ebff" />
        <circle cx="94" cy="104" r="22" fill="#e7efff" />
        <path d="M47 239H436" stroke="#9cbafa" strokeWidth="2" />
        <rect
          x="112"
          y="127"
          width="256"
          height="111"
          rx="5"
          fill="url(#school-fill)"
          stroke="#87aafa"
          strokeWidth="1.7"
        />
        <path d="M195 125V84h90v154h-90V125Z" fill="#fff" stroke="#638cf5" strokeWidth="1.8" />
        <path d="m179 87 61-33 62 33H179Z" fill="#edf4ff" stroke="#638cf5" strokeWidth="1.8" />
        <path
          d="M229 237v-31a11 11 0 0 1 22 0v31"
          fill="#edf4ff"
          stroke="#638cf5"
          strokeWidth="1.8"
        />
        <circle cx="240" cy="103" r="11" stroke="#638cf5" strokeWidth="1.5" />
        <path
          d="M240 96v8l5 3M210 143h13v25h-13zM257 143h13v25h-13z"
          stroke="#638cf5"
          strokeWidth="1.5"
        />
        {[130, 158, 300, 329].map((x) => (
          <g key={x}>
            <rect x={x} y="143" width="14" height="23" rx="2" fill="#d8e7ff" stroke="#87aafa" />
            <rect x={x} y="184" width="14" height="23" rx="2" fill="#d8e7ff" stroke="#87aafa" />
          </g>
        ))}
        <path d="M100 238v-32m280 32v-32" stroke="#0f9b8e" strokeWidth="2" />
        <ellipse cx="100" cy="199" rx="12" ry="17" fill="#ccf3e7" stroke="#14b8a6" />
        <ellipse cx="380" cy="199" rx="12" ry="17" fill="#ccf3e7" stroke="#14b8a6" />
        <rect x="62" y="130" width="84" height="49" rx="7" fill="white" stroke="#d0e0ff" />
        <rect x="73" y="142" width="29" height="4" rx="2" fill="#8bb2fd" />
        <rect x="73" y="152" width="48" height="3" rx="1.5" fill="#d1e2ff" />
        <rect x="73" y="162" width="37" height="3" rx="1.5" fill="#d1e2ff" />
        <circle cx="129" cy="144" r="6" fill="#d1fae5" />
        <rect x="335" y="106" width="87" height="60" rx="7" fill="white" stroke="#d0e0ff" />
        <path d="M335 116h87" stroke="#d0e0ff" />
        {[0, 1, 2, 3].map((i) => (
          <g key={i}>
            <rect
              x={346 + i * 18}
              y="126"
              width="10"
              height="7"
              rx="2"
              fill={i === 2 ? '#73a2fa' : '#e1ebff'}
            />
            <rect x={346 + i * 18} y="142" width="10" height="7" rx="2" fill="#e1ebff" />
          </g>
        ))}
        <path d="m240 38 32-10" stroke="#a3bffa" strokeWidth="1.5" strokeDasharray="3 4" />
        <circle cx="278" cy="26" r="4" fill="#b4ccff" />
      </svg>
      <div className="illustration-label">
        <ShieldCheck size={14} />
        Một nền tảng. Mọi kết nối.
      </div>
    </div>
  )
}
