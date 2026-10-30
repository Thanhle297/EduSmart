import { useEffect, useMemo, useRef, useState } from 'react'
import { AlertTriangle, Check, LoaderCircle, Sparkles } from 'lucide-react'
import { useDemo } from '../../app/demo-context'
import { Avatar, Badge } from '../../components/shared/ui'
import { Button } from '../../components/ui/button'
import { buildSubstitutionAiInput, suggestSubstitutes } from '../../lib/substitution-ai'
import {
  substitutionAiStatusSchema,
  type SubstitutionAiResult,
} from '../../lib/substitution-ai-contract'
import { canSubstitute, getTeacher } from '../../mocks/selectors'
import type { Substitution } from '../../mocks/types'

export function SubstitutionAssistant({
  request,
  selectedId,
  onSelect,
}: {
  request: Substitution
  selectedId: string
  onSelect: (teacherId: string) => void
}) {
  const { state } = useDemo()
  const [connection, setConnection] = useState<'checking' | 'ready' | 'offline'>('checking')
  const [preferences, setPreferences] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [analysis, setAnalysis] = useState<{ key: string; result: SubstitutionAiResult } | null>(null)
  const active = useRef<AbortController | null>(null)
  const input = useMemo(() => buildSubstitutionAiInput(state, request, preferences), [state, request, preferences])
  const key = JSON.stringify(input)
  const result = analysis?.key === key ? analysis.result : null

  useEffect(() => {
    const controller = new AbortController()
    fetch('/api/ai/substitutions/status', { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error('Connection unavailable')
        return substitutionAiStatusSchema.parse(await response.json())
      })
      .then((status) => setConnection(status.configured ? 'ready' : 'offline'))
      .catch(() => { if (!controller.signal.aborted) setConnection('offline') })
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
      const value = await suggestSubstitutes(input, controller.signal)
      if (!controller.signal.aborted) setAnalysis({ key, result: value })
    } catch (cause) {
      if (!controller.signal.aborted) {
        setError(cause instanceof Error ? cause.message : 'Không thể phân tích. Vui lòng thử lại.')
      }
    } finally {
      if (active.current === controller) {
        active.current = null
        setLoading(false)
      }
    }
  }

  return (
    <section className="substitution-assistant" aria-label="Trợ lý AI phân công dạy thay" aria-busy={loading}>
      <div className="substitution-ai-heading">
        <span className="substitution-ai-icon"><Sparkles size={19} /></span>
        <div>
          <h3>AI hỗ trợ phân công</h3>
          <p>So sánh chuyên môn, lịch trống và tải giảng dạy.</p>
        </div>
        <Badge tone={connection === 'ready' ? 'teal' : 'slate'}>
          {connection === 'ready' ? 'OpenAI' : connection === 'checking' ? 'Đang kết nối' : 'Chưa kết nối'}
        </Badge>
      </div>

      <div className="substitution-ai-criteria">
        <span><Check size={12} />Cùng môn học</span>
        <span><Check size={12} />Không trùng lịch</span>
        <span>{input.candidates.length} giáo viên khả dụng</span>
      </div>

      <label className="substitution-ai-preferences">
        <span>Ưu tiên thêm <small>(tùy chọn)</small></span>
        <textarea
          rows={2}
          maxLength={600}
          value={preferences}
          disabled={loading}
          onChange={(event) => setPreferences(event.target.value)}
          placeholder="Ví dụ: ưu tiên giáo viên đã dạy lớp, chia đều số tiết dạy thay trong tuần..."
        />
      </label>

      <Button
        type="button"
        size="sm"
        className="substitution-ai-analyze"
        disabled={loading || connection !== 'ready' || !input.candidates.length}
        onClick={analyze}
      >
        {loading ? <LoaderCircle size={15} className="substitution-ai-spinner" /> : <Sparkles size={15} />}
        {loading ? 'Đang phân tích giáo viên...' : result ? 'Phân tích lại' : 'Gợi ý giáo viên phù hợp'}
      </Button>

      <div aria-live="polite" role="status" className="substitution-ai-status">
        {connection === 'offline' && <p>Trợ lý AI chưa kết nối. Liên hệ quản trị viên để bật tính năng này.</p>}
        {!input.candidates.length && <p>Chưa có giáo viên cùng môn trống lịch cho tiết này. Cần rà soát phương án điều phối.</p>}
        {analysis && !result && <p>Lịch hoặc ưu tiên đã thay đổi. Phân tích lại để nhận đề xuất mới.</p>}
        {error && <p className="substitution-ai-error">{error}</p>}
      </div>

      {result && (
        <div className="substitution-ai-results">
          <p className="substitution-ai-summary">{result.summary}</p>
          {result.recommendations.map((recommendation, index) => {
            const teacher = getTeacher(state, recommendation.teacherId)
            const facts = input.candidates.find((row) => row.teacherId === recommendation.teacherId)
            if (!teacher || !facts) return null
            const available = canSubstitute(state, teacher, request.id)
            const chosen = selectedId === teacher.id
            const projected = facts.plannedPeriods + facts.allowance + facts.substitutePeriodsThisWeek + 1
            return (
              <article className={`substitution-ai-recommendation ${chosen ? 'chosen' : ''}`} key={teacher.id}>
                <div className="substitution-ai-teacher">
                  <Avatar name={teacher.name} tone={teacher.color} small />
                  <div><strong>{teacher.name}</strong><small>{teacher.department}</small></div>
                  <Badge tone={index === 0 ? 'blue' : 'slate'}>Gợi ý {index + 1}</Badge>
                </div>
                <p>{recommendation.reason}</p>
                <div className="substitution-ai-facts">
                  <span>Tải sau phân công <b className={projected > facts.quota ? 'red-text' : ''}>{projected}/{facts.quota} tiết</b></span>
                  <span>Dạy thay trong tuần <b>{facts.substitutePeriodsThisWeek} tiết</b></span>
                  <span>Lịch trong ngày <b>{facts.periodsOnDay} tiết</b></span>
                </div>
                {projected > facts.quota && (
                  <p className="substitution-ai-caution"><AlertTriangle size={13} />Dự kiến vượt định mức cấu hình {projected - facts.quota} tiết.</p>
                )}
                {recommendation.cautions.map((caution, i) => (
                  <p key={i} className="substitution-ai-caution"><AlertTriangle size={13} />{caution}</p>
                ))}
                <Button type="button" size="sm" variant={chosen ? 'soft' : 'secondary'} disabled={!available} onClick={() => onSelect(teacher.id)}>
                  {chosen && <Check size={13} />}{chosen ? 'Đang chọn' : 'Chọn giáo viên này'}
                </Button>
              </article>
            )
          })}
          {result.warnings.map((warning, i) => <p className="substitution-ai-caution" key={i}><AlertTriangle size={13} />{warning}</p>)}
          <small className="substitution-ai-model">Đề xuất tham khảo để Ban Giám hiệu xem xét. Tải và định mức dùng cấu hình hiện có trong demo.</small>
        </div>
      )}
    </section>
  )
}
