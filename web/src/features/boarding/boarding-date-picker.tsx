import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import { useDemo } from '../../app/demo-context'
import { Badge } from '../../components/shared/ui'
import { Button } from '../../components/ui/button'
import { DEMO_DATE } from '../../lib/config'
import { addDays, dateLabel } from '../../lib/utils'
import { boardingVersions } from '../../mocks/boarding-assignment-data'
import { boardingVersion } from '../../mocks/boarding'

export function BoardingDatePicker() {
  const { state, mutate, busy } = useDemo()
  const version = boardingVersion(state.boardingDate)
  const select = (date: string) => {
    if (date && date >= boardingVersions[0].effectiveFrom)
      void mutate({ type: 'boarding.date', date }, `Đang xem bán trú ngày ${dateLabel(date)}.`)
  }
  return (
    <div className="toolbar-panel boarding-date-toolbar">
      <Button
        variant="ghost"
        size="icon"
        disabled={busy || state.boardingDate <= boardingVersions[0].effectiveFrom}
        aria-label="Ngày trước"
        onClick={() => select(addDays(state.boardingDate, -1))}
      >
        <ChevronLeft size={17} />
      </Button>
      <label className="boarding-date-input">
        <CalendarDays size={17} />
        <input
          aria-label="Ngày bán trú"
          type="date"
          min={boardingVersions[0].effectiveFrom}
          value={state.boardingDate}
          disabled={busy}
          onChange={(e) => select(e.target.value)}
        />
      </label>
      <Button
        variant="ghost"
        size="icon"
        disabled={busy}
        aria-label="Ngày sau"
        onClick={() => select(addDays(state.boardingDate, 1))}
      >
        <ChevronRight size={17} />
      </Button>
      <Button variant="ghost" size="sm" disabled={busy} onClick={() => select(DEMO_DATE)}>
        Ngày demo
      </Button>
      <div className="toolbar-spacer" />
      <select
        aria-label="Phiên bản phân công bán trú"
        value={version?.id ?? ''}
        disabled={busy}
        onChange={(e) => {
          const next = boardingVersions.find((row) => row.id === e.target.value)
          if (next) select(next.effectiveFrom)
        }}
      >
        {[...boardingVersions].reverse().map((row) => (
          <option key={row.id} value={row.id}>
            {row.id} · từ {dateLabel(row.effectiveFrom)}
            {row.id === '0510' ? ' · Lịch chính' : ' · Lịch sử'}
          </option>
        ))}
      </select>
      <Badge tone={version?.id === '0510' ? 'teal' : 'amber'}>
        Hiệu lực {version ? dateLabel(version.effectiveFrom) : '—'}
      </Badge>
    </div>
  )
}
