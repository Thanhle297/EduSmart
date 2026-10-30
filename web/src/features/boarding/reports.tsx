import { useState } from 'react'
import {
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  FileBarChart2,
  Printer,
  Send,
  Soup,
  Wallet,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useDemo } from '../../app/demo-context'
import { MealsChart } from '../../components/shared/charts'
import {
  Badge,
  DemoNote,
  ExportButton,
  Metric,
  PageHeader,
  Panel,
  Progress,
  StatusBadge,
} from '../../components/shared/ui'
import { Button } from '../../components/ui/button'
import { Dialog } from '../../components/ui/dialog'
import { dateLabel, downloadCsv, money } from '../../lib/utils'
import { mealTotals } from '../../mocks/selectors'
import {
  boardingPerson,
  boardingVersion,
  boardingWeeklyMeals,
  getBoardingDuties,
  getBoardingGroups,
} from '../../mocks/boarding'
import { BoardingDatePicker } from './boarding-date-picker'

export function BoardingReportsPage() {
  const { state, mutate, busy } = useDemo()
  const [confirm, setConfirm] = useState(false)
  const totals = mealTotals(state)
  const duties = getBoardingDuties(state)
  const departments = [
    ...new Set(duties.map((duty) => boardingPerson(state, duty.teacherId).department)),
  ]
  const groups = getBoardingGroups(state)
  const version = boardingVersion(state.boardingDate)
  const inspections = state.inspections.filter((row) => row.date === state.boardingDate)
  const confirmed = duties.filter((d) => d.confirmed).length
  const pass = inspections.filter((i) => i.result === 'pass').length
  const exportReport = () =>
    downloadCsv(
      'bao-cao-ban-tru.csv',
      ['Chỉ tiêu', 'Giá trị', 'Phạm vi'],
      [
        ['Đăng ký', totals.registered, state.boardingDate],
        ['Dự kiến ăn', totals.expected, state.boardingDate],
        [
          'Thực nhận đã ghi nhận',
          totals.recorded ? totals.received : 'Chưa ghi nhận',
          state.boardingDate,
        ],
        ['Lớp chưa ghi nhận bàn giao', totals.pending, state.boardingDate],
        [
          'Dự kiến ngủ theo lịch học',
          groups.reduce((sum, group) => sum + group.expectedCount, 0),
          state.boardingDate,
        ],
        [
          'Học sinh sau điều phối phòng',
          groups.reduce((sum, group) => sum + group.count, 0),
          state.boardingDate,
        ],
        ['Số nhóm ngủ', groups.length, state.boardingDate],
        [
          'Học sinh báo nghỉ cá nhân',
          state.boardingAbsences
            .filter((row) => row.date === state.boardingDate)
            .reduce((sum, row) => sum + row.count, 0),
          state.boardingDate,
        ],
        [
          'Lượt học sinh chuyển phòng',
          state.boardingTransfers
            .filter((row) => row.date === state.boardingDate)
            .reduce((sum, row) => sum + row.count, 0),
          state.boardingDate,
        ],
        [
          'Lượt điều phối hỗ trợ',
          state.boardingSupports.filter((row) => row.date === state.boardingDate).length,
          state.boardingDate,
        ],
        ['Số phòng ghi trong nguồn', version?.sourceRoomTotal ?? 0, state.boardingDate],
        ['Điều chỉnh dự kiến (VND)', totals.refund, state.boardingDate],
        ['Ca trực đã xác nhận', confirmed, state.boardingDate],
        ...groups.map((group) => [
          `Nhóm ngủ ${group.room} · ${group.gender === 'boys' ? 'Nam' : 'Nữ'}`,
          group.count,
          state.boardingDate,
        ]),
        ...state.boardingTransfers
          .filter((row) => row.date === state.boardingDate)
          .map((row) => [
            `Chuyển ${row.classId}: ${groups.find((group) => group.id === row.fromGroupId)?.room} → ${groups.find((group) => group.id === row.toGroupId)?.room}`,
            row.count,
            `${row.date} ${row.time}`,
          ]),
        ...state.boardingSupports
          .filter((row) => row.date === state.boardingDate)
          .map((row) => [
            `Hỗ trợ: ${boardingPerson(state, row.personId).name} → ${groups.find((group) => group.id === row.toGroupId)?.room}`,
            `${row.start}–${row.end}`,
            row.date,
          ]),
      ],
    )
  return (
    <>
      <PageHeader
        eyebrow="BÁN TRÚ / BÁO CÁO"
        title="Báo cáo & thống kê bán trú"
        description="Tổng hợp suất ăn, hoạt động trực, kiểm tra và khoản điều chỉnh trong dữ liệu demo."
        actions={
          <>
            <ExportButton onClick={exportReport} />
            <Button variant="secondary" onClick={() => window.print()}>
              <Printer size={16} />
              In báo cáo
            </Button>
            <Button disabled={state.reportStatus !== 'draft'} onClick={() => setConfirm(true)}>
              <Send size={16} />
              {state.reportStatus === 'pending' ? 'Đã gửi duyệt' : 'Trình BGH phê duyệt'}
            </Button>
          </>
        }
      />
      <BoardingDatePicker />
      <div className="toolbar-panel">
        <span className="date-label">
          <CalendarDays size={17} />
          Kỳ báo cáo: {dateLabel(state.boardingDate)}
        </span>
        <Badge tone={state.mealsClosed ? 'green' : 'amber'}>
          {state.mealsClosed ? 'Số liệu đã chốt' : 'Số liệu tạm tính'}
        </Badge>
        <div className="toolbar-spacer" />
        <StatusBadge status={state.reportStatus} />
      </div>
      <div className="metrics-grid">
        <Metric
          label="Suất ăn đã phục vụ"
          value={totals.recorded ? totals.received : '—'}
          detail={`${totals.expected} suất dự kiến · ${totals.pending} lớp chưa nhập`}
          icon={Soup}
        />
        <Metric
          label="Xác nhận ca trực"
          value={`${Math.round((confirmed / Math.max(1, duties.length)) * 100)}%`}
          detail={`${confirmed}/${duties.length} ca trong ngày`}
          icon={CheckCircle2}
          tone="green"
        />
        <Metric
          label="Hạng mục kiểm tra đạt"
          value={inspections.length ? `${pass}/${inspections.length}` : '—'}
          detail="Theo biên bản đã ghi nhận"
          icon={ClipboardCheck}
          tone="teal"
        />
        <Metric
          label="Điều chỉnh dự kiến"
          value={money(totals.refund)}
          detail="Chưa có giao dịch hoàn tiền thật"
          icon={Wallet}
          tone="amber"
        />
      </div>
      <Panel title="Nhóm ngủ và điều phối trong ngày">
        <div className="boarding-group-counts">
          <span>
            Nhóm ngủ đang quản lý<strong>{groups.length}</strong>
          </span>
          <span>
            Theo lịch học
            <strong>{groups.reduce((sum, group) => sum + group.expectedCount, 0)}</strong>
          </span>
          <span>
            Sau báo nghỉ / điều phối
            <strong>{groups.reduce((sum, group) => sum + group.count, 0)}</strong>
          </span>
        </div>
        <p className="boarding-source-note">
          Báo nghỉ cá nhân:{' '}
          {state.boardingAbsences
            .filter((row) => row.date === state.boardingDate)
            .reduce((sum, row) => sum + row.count, 0)}{' '}
          học sinh. Chuyển phòng:{' '}
          {state.boardingTransfers
            .filter((row) => row.date === state.boardingDate)
            .reduce((sum, row) => sum + row.count, 0)}{' '}
          lượt học sinh; các lượt chuyển không được cộng thành học sinh đăng ký mới.
        </p>
        {version?.notes.map((note) => (
          <p className="boarding-source-note" key={note}>
            {note}
          </p>
        ))}
      </Panel>
      <div className="content-columns report-chart-columns">
        <Panel
          title="Theo dõi suất ăn trong tuần"
          description="Dự kiến theo lịch học từng ngày; thực nhận chỉ hiện khi đã nhập đủ các lớp có ăn."
        >
          <MealsChart data={boardingWeeklyMeals(state)} />
          <div className="chart-summary">
            <span>
              Đăng ký <strong>{totals.registered} suất</strong>
            </span>
            <span>
              Dự kiến <strong>{totals.expected} suất</strong>
            </span>
            <span>
              Thực nhận{' '}
              <strong>{totals.recorded ? `${totals.received} suất` : 'Chưa ghi nhận'}</strong>
            </span>
          </div>
        </Panel>
        <Panel title="Thực đơn & lịch sử phê duyệt" icon={FileBarChart2}>
          <div className="menu-history">
            {state.menus.map((menu) => (
              <Link to={`/boarding/menu-approvals/${menu.id}`} key={menu.id}>
                <span className="week-stamp">T{menu.name.match(/\d+/)?.[0] ?? 'MỚI'}</span>
                <div>
                  <strong>{menu.name}</strong>
                  <small>
                    {dateLabel(menu.startDate)} · v{menu.version}
                  </small>
                  <StatusBadge status={menu.status} />
                </div>
              </Link>
            ))}
          </div>
        </Panel>
      </div>
      <div className="content-columns">
        <Panel
          title="Tỷ lệ xác nhận ca trực theo tổ"
          description="Phạm vi: các ca trực của ngày đang báo cáo."
        >
          <div className="department-progress">
            {departments.map((department) => {
              const rows = duties.filter(
                (d) => boardingPerson(state, d.teacherId).department === department,
              )
              const count = rows.filter((d) => d.confirmed).length
              return (
                <div key={department}>
                  <div>
                    <strong>{department}</strong>
                    <span>
                      {count}/{rows.length} ca
                    </span>
                  </div>
                  <Progress
                    value={rows.length ? (count / rows.length) * 100 : 0}
                    tone={count === rows.length && rows.length > 0 ? 'green' : 'blue'}
                  />
                </div>
              )
            })}
          </div>
        </Panel>
        <Panel
          title="Tổng hợp giá trị suất ăn mẫu"
          description="Đơn giá minh họa: 35.000đ/suất. Không phải quyết toán tài chính."
        >
          <dl className="finance-list">
            <div>
              <dt>Theo số suất đăng ký</dt>
              <dd>{money(totals.registered * 35000)}</dd>
            </div>
            <div>
              <dt>Theo số suất dự kiến</dt>
              <dd>{money(totals.expected * 35000)}</dd>
            </div>
            <div>
              <dt>Theo số suất thực nhận</dt>
              <dd>{totals.recorded ? money(totals.received * 35000) : 'Chưa ghi nhận'}</dd>
            </div>
            <div className="finance-highlight">
              <dt>Điều chỉnh nghỉ hợp lệ</dt>
              <dd>{money(totals.refund)}</dd>
            </div>
          </dl>
          <DemoNote>
            Khoản chênh lệch giao nhận không tự động tính hoàn phí. Báo cáo hiện{' '}
            {state.mealsClosed ? 'đã chốt dữ liệu demo' : 'đang tạm tính'}.
          </DemoNote>
        </Panel>
      </div>
      <Dialog
        open={confirm}
        onOpenChange={setConfirm}
        title="Gửi báo cáo để xem xét?"
        description="Báo cáo demo được đánh dấu chờ duyệt; chưa gửi thông báo hoặc ký số thật."
      >
        <p className="dialog-paragraph">
          Kỳ {dateLabel(state.boardingDate)} ·{' '}
          {totals.recorded ? `${totals.received} suất đã ghi nhận` : 'Chưa ghi nhận bàn giao'} ·{' '}
          {state.mealsClosed ? 'Dữ liệu đã chốt' : 'Dữ liệu tạm tính, chưa chốt ngày'}.
        </p>
        <div className="dialog-actions">
          <Button variant="secondary" onClick={() => setConfirm(false)}>
            Hủy
          </Button>
          <Button
            disabled={busy}
            onClick={async () => {
              if (
                await mutate({ type: 'report.submit' }, 'Đã gửi báo cáo vào hàng chờ duyệt demo.')
              )
                setConfirm(false)
            }}
          >
            <Send size={16} />
            Xác nhận gửi
          </Button>
        </div>
      </Dialog>
    </>
  )
}
