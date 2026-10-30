import { useEffect, useMemo, useRef, useState } from 'react'
import { AlertTriangle, Check, LoaderCircle, Sparkles } from 'lucide-react'
import { useDemo } from '../../app/demo-context'
import { Avatar, Badge } from '../../components/shared/ui'
import { Button } from '../../components/ui/button'
import { Dialog } from '../../components/ui/dialog'
import {
  buildBoardingSubstitutionAiInput,
  suggestBoardingSubstitutes,
} from '../../lib/boarding-substitution-ai'
import {
  substitutionAiStatusSchema,
  type SubstitutionAiResult,
} from '../../lib/substitution-ai-contract'
import { dateLabel } from '../../lib/utils'
import { canCoverDuty, getTeacher } from '../../mocks/selectors'
import type { Duty } from '../../mocks/types'
import { boardingPerson, getBoardingDuties } from '../../mocks/boarding'

export function DutyReplacementPicker({ duty, onClose }: { duty: Duty; onClose: () => void }) {
  const { state, mutate, busy } = useDemo()
  const [selected, setSelected] = useState('')
  const [preferences, setPreferences] = useState('')
  const [connection, setConnection] = useState<'checking' | 'ready' | 'offline'>('checking')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [analysis, setAnalysis] = useState<{ key: string; result: SubstitutionAiResult } | null>(
    null,
  )
  const active = useRef<AbortController | null>(null)
  const current = getBoardingDuties(state, duty.date).find((row) => row.id === duty.id)
  const stale =
    !current ||
    current.teacherId !== duty.teacherId ||
    current.date !== duty.date ||
    current.kind !== duty.kind ||
    current.area !== duty.area ||
    current.start !== duty.start ||
    current.end !== duty.end
  const input = useMemo(
    () => buildBoardingSubstitutionAiInput(state, current ?? duty, preferences),
    [state, current, duty, preferences],
  )
  const key = JSON.stringify(input)
  const result = !stale && analysis?.key === key ? analysis.result : null
  const available = (teacherId: string) => {
    const teacher = getTeacher(state, teacherId)
    return Boolean(!stale && current && teacher && canCoverDuty(state, teacher, current))
  }

  useEffect(() => {
    const controller = new AbortController()
    fetch('/api/ai/boarding-substitutions/status', { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error('Connection unavailable')
        return substitutionAiStatusSchema.parse(await response.json())
      })
      .then((status) => setConnection(status.configured ? 'ready' : 'offline'))
      .catch(() => {
        if (!controller.signal.aborted) setConnection('offline')
      })
    return () => controller.abort()
  }, [])

  useEffect(() => () => active.current?.abort(), [key])

  const analyze = async () => {
    active.current?.abort()
    const controller = new AbortController()
    active.current = controller
    setLoading(true)
    setError('')
    setAnalysis(null)
    try {
      const value = await suggestBoardingSubstitutes(input, controller.signal)
      if (!controller.signal.aborted) setAnalysis({ key, result: value })
    } catch (cause) {
      if (!controller.signal.aborted)
        setError(cause instanceof Error ? cause.message : 'Không thể phân tích. Vui lòng thử lại.')
    } finally {
      if (active.current === controller) {
        active.current = null
        setLoading(false)
      }
    }
  }

  return (
    <Dialog
      open
      onOpenChange={onClose}
      title="AI gợi ý trông thay bán trú"
      description={`${dateLabel(duty.date)} · ${duty.kind === 'meal' ? 'Trông ăn' : 'Trông ngủ'} · ${duty.start}–${duty.end} · ${duty.area}`}
      drawer
    >
      <p className="muted">
        Nhân sự cần thay: <strong>{boardingPerson(state, duty.teacherId).name}</strong>
      </p>
      {input.request.unlinkedPeople > 0 && (
        <p className="boarding-source-note">
          Còn {input.request.unlinkedPeople} tên trong phân công chưa liên kết với lịch dạy. Đề xuất
          dựa trên những liên kết đã xác định; cần đối chiếu các tên còn thiếu trước khi chốt người
          thay.
        </p>
      )}
      <section
        className="substitution-assistant"
        aria-label="Trợ lý AI trông thay bán trú"
        aria-busy={loading}
      >
        <div className="substitution-ai-heading">
          <span className="substitution-ai-icon">
            <Sparkles size={19} />
          </span>
          <div>
            <h3>AI hỗ trợ trông thay</h3>
            <p>Cân đối lịch trống, số ca trực và tải giảng dạy.</p>
          </div>
          <Badge tone={connection === 'ready' ? 'teal' : 'slate'}>
            {connection === 'ready'
              ? 'OpenAI'
              : connection === 'checking'
                ? 'Đang kết nối'
                : 'Chưa kết nối'}
          </Badge>
        </div>
        <div className="substitution-ai-criteria">
          <span>
            <Check size={12} />
            Không trùng lịch dạy, lịch trực
          </span>
          <span>
            <Check size={12} />
            Cân đối ca trong tuần
          </span>
          <span>{stale ? 0 : input.candidates.length} giáo viên khả dụng</span>
        </div>
        <label className="substitution-ai-preferences">
          <span>
            Ưu tiên thêm <small>(tùy chọn)</small>
          </span>
          <textarea
            rows={2}
            maxLength={600}
            value={preferences}
            disabled={loading || busy}
            onChange={(event) => setPreferences(event.target.value)}
            placeholder="Ví dụ: ưu tiên giáo viên ít ca trực, từng phụ trách khu vực này..."
          />
        </label>
        <Button
          type="button"
          size="sm"
          className="substitution-ai-analyze"
          disabled={loading || busy || stale || connection !== 'ready' || !input.candidates.length}
          onClick={analyze}
        >
          {loading ? (
            <LoaderCircle size={15} className="substitution-ai-spinner" />
          ) : (
            <Sparkles size={15} />
          )}
          {loading
            ? 'Đang phân tích giáo viên...'
            : result
              ? 'Phân tích lại'
              : 'Gợi ý người trông thay'}
        </Button>
        <div aria-live="polite" role="status" className="substitution-ai-status">
          {connection === 'offline' && (
            <p>Trợ lý AI chưa kết nối. Bạn vẫn có thể chọn giáo viên bên dưới.</p>
          )}
          {stale && <p>Ca trực đã thay đổi. Đóng và mở lại để phân công theo lịch mới.</p>}
          {!stale && !input.candidates.length && (
            <p>
              Chưa có giáo viên trống lịch trong khung giờ này. Cần rà soát phương án điều phối.
            </p>
          )}
          {analysis && !result && !stale && (
            <p>Lịch hoặc ưu tiên đã thay đổi. Phân tích lại để nhận đề xuất mới.</p>
          )}
          {error && <p className="substitution-ai-error">{error}</p>}
        </div>
        {result && (
          <div className="substitution-ai-results">
            <p className="substitution-ai-summary">{result.summary}</p>
            {result.recommendations.map((recommendation, index) => {
              const teacher = getTeacher(state, recommendation.teacherId)
              const facts = input.candidates.find(
                (row) => row.teacherId === recommendation.teacherId,
              )
              if (!teacher || !facts) return null
              const chosen = selected === teacher.id
              return (
                <article
                  key={teacher.id}
                  className={`substitution-ai-recommendation ${chosen ? 'chosen' : ''}`}
                >
                  <div className="substitution-ai-teacher">
                    <Avatar name={teacher.name} tone={teacher.color} small />
                    <div>
                      <strong>{teacher.name}</strong>
                      <small>{teacher.department}</small>
                    </div>
                    <Badge tone={index === 0 ? 'blue' : 'slate'}>Gợi ý {index + 1}</Badge>
                  </div>
                  <p>{recommendation.reason}</p>
                  <div className="substitution-ai-facts">
                    <span>
                      Ca tuần sau phân công <b>{facts.dutiesThisWeek + 1} ca</b>
                    </span>
                    <span>
                      Đang có trong tuần <b>{facts.dutyMinutesThisWeek} phút trực</b>
                    </span>
                    <span>
                      Lịch dạy trong ngày <b>{facts.teachingPeriodsOnDay} tiết</b>
                    </span>
                  </div>
                  {recommendation.cautions.map((caution, i) => (
                    <p key={i} className="substitution-ai-caution">
                      <AlertTriangle size={13} />
                      {caution}
                    </p>
                  ))}
                  <Button
                    type="button"
                    size="sm"
                    variant={chosen ? 'soft' : 'secondary'}
                    disabled={busy || !available(teacher.id)}
                    onClick={() => setSelected(teacher.id)}
                  >
                    {chosen && <Check size={13} />}
                    {chosen ? 'Đang chọn' : 'Chọn giáo viên này'}
                  </Button>
                </article>
              )
            })}
            {result.warnings.map((warning, i) => (
              <p className="substitution-ai-caution" key={i}>
                <AlertTriangle size={13} />
                {warning}
              </p>
            ))}
            <small className="substitution-ai-model">
              Đề xuất tham khảo theo lịch hiện có. Người được chọn cần xác nhận lại ca trực.
            </small>
          </div>
        )}
      </section>
      <h3 className="substitution-manual-heading">Giáo viên có thể trông thay</h3>
      <div className="teacher-candidates">
        {!stale &&
          input.candidates.map((candidate) => {
            const teacher = getTeacher(state, candidate.teacherId)
            if (!teacher) return null
            return (
              <label key={teacher.id} className={selected === teacher.id ? 'chosen' : ''}>
                <input
                  type="radio"
                  name="duty-replacement"
                  value={teacher.id}
                  disabled={busy}
                  checked={selected === teacher.id}
                  onChange={() => setSelected(teacher.id)}
                />
                <Avatar name={teacher.name} tone={teacher.color} />
                <span>
                  <strong>{teacher.name}</strong>
                  <small>
                    {teacher.department} · {candidate.dutiesThisWeek} ca/tuần ·{' '}
                    {candidate.dutyMinutesThisWeek} phút trực
                  </small>
                  <Badge tone="green">Trống lịch trong ca này</Badge>
                </span>
              </label>
            )
          })}
      </div>
      <div className="dialog-actions">
        <Button variant="secondary" onClick={onClose}>
          Hủy bỏ
        </Button>
        <Button
          disabled={busy || !available(selected)}
          onClick={async () => {
            if (
              await mutate(
                {
                  type: 'duty.replace',
                  id: duty.id,
                  absentId: duty.teacherId,
                  teacherId: selected,
                },
                'Đã phân công trông thay. Ca trực đang chờ người thay xác nhận.',
              )
            )
              onClose()
          }}
        >
          <Check size={16} />
          Lưu người trông thay
        </Button>
      </div>
    </Dialog>
  )
}
