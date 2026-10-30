import { useState, type FormEvent } from 'react'
import {
  ArrowLeftRight,
  BedDouble,
  CheckCircle2,
  Edit3,
  FileDown,
  Plus,
  ShieldCheck,
  Soup,
  Sparkles,
  UsersRound,
  X,
} from 'lucide-react'
import { useDemo } from '../../app/demo-context'
import {
  Alert,
  Badge,
  DemoNote,
  Field,
  Metric,
  PageHeader,
  Panel,
} from '../../components/shared/ui'
import { Button } from '../../components/ui/button'
import { Dialog } from '../../components/ui/dialog'
import { addDays, dateLabel, downloadCsv, normalize } from '../../lib/utils'
import { boardingKindLabel, boardingPerson, boardingPersonKey } from '../../mocks/boarding'
import {
  boardingClassPresent,
  boardingVersion,
  boardingWeekStart,
  getBoardingDuties,
  getBoardingGroups,
  getBoardingMeals,
} from '../../mocks/boarding'
import { mealShifts } from '../../mocks/boarding-dining-data'
import { boardingTeachingConflict, dutyConflict } from '../../mocks/selectors'
import type { BoardingPerson, Duty } from '../../mocks/types'
import { BoardingDatePicker } from './boarding-date-picker'
import { DutyReplacementPicker } from './duty-replacement-picker'

function DutyEditor({ duty, onClose }: { duty: Duty; onClose: () => void }) {
  const { state, mutate, busy } = useDemo()
  const [value, setValue] = useState({ ...duty })
  const version = boardingVersion(duty.date)
  const groups = getBoardingGroups(state, duty.date)
  const save = async (event: FormEvent) => {
    event.preventDefault()
    const next = {
      ...value,
      confirmed: false,
      ...(value.kind === 'meal'
        ? { groupId: `meal-${value.shift ?? 'custom'}-${value.area}` }
        : {}),
    }
    if (
      await mutate(
        { type: 'duty.save', duty: next },
        'Đã lưu phân công theo ngày; đang chờ xác nhận.',
      )
    )
      onClose()
  }
  return (
    <Dialog
      open
      onOpenChange={onClose}
      title="Phân công bán trú theo ngày"
      description={`${dateLabel(duty.date)} · Thay đổi được lưu riêng với phân công gốc.`}
    >
      <form onSubmit={save}>
        <div className="form-grid">
          <Field label="Nhân sự phụ trách *">
            <select
              required
              value={value.teacherId}
              onChange={(e) => setValue({ ...value, teacherId: e.target.value })}
            >
              <optgroup label="Nhân sự phân công bán trú">
                {state.boardingPeople.map((person) => (
                  <option key={person.id} value={person.id}>
                    {person.name}
                    {person.teacherId ? ` · ${boardingPerson(state, person.id).fullName}` : ''}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Giáo viên khác">
                {state.teachers
                  .filter(
                    (teacher) =>
                      !state.boardingPeople.some((person) => person.teacherId === teacher.id),
                  )
                  .map((teacher) => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.name}
                    </option>
                  ))}
              </optgroup>
            </select>
          </Field>
          <Field label="Nhiệm vụ">
            <select
              value={value.kind}
              disabled={Boolean(value.versionId)}
              onChange={(e) => setValue({ ...value, kind: e.target.value as Duty['kind'] })}
            >
              {Object.entries(boardingKindLabel)
                .filter(([key]) => key !== 'support')
                .map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
            </select>
          </Field>
          {value.kind === 'meal' && (
            <>
              <Field label="Lớp">
                <select
                  required
                  value={value.classIds?.[0] ?? ''}
                  disabled={Boolean(value.versionId)}
                  onChange={(e) => setValue({ ...value, classIds: [e.target.value] })}
                >
                  <option value="">Chọn lớp</option>
                  {version?.classes.map((cls) => (
                    <option key={cls.classId}>{cls.classId}</option>
                  ))}
                </select>
              </Field>
              <Field label="Ca ăn">
                <select
                  required
                  value={value.shift ?? ''}
                  onChange={(e) => {
                    const shift = Number(e.target.value) as 1 | 2 | 3
                    setValue({
                      ...value,
                      shift,
                      start: mealShifts[shift].start,
                      end: mealShifts[shift].end,
                    })
                  }}
                >
                  <option value="" disabled>
                    Chọn ca
                  </option>
                  {Object.entries(mealShifts).map(([key, time]) => (
                    <option key={key} value={key}>
                      Ca {key} · {time.start}–{time.end}
                    </option>
                  ))}
                </select>
              </Field>
            </>
          )}
          {value.kind === 'rest' && (
            <Field label="Phòng / nhóm ngủ">
              <select
                required
                value={value.groupId ?? ''}
                disabled={Boolean(value.versionId)}
                onChange={(e) => {
                  const group = groups.find((row) => row.id === e.target.value)
                  if (group)
                    setValue({
                      ...value,
                      groupId: group.id,
                      roomId: group.roomId,
                      area: group.room,
                      classIds: group.members.map((row) => row.classId),
                    })
                }}
              >
                <option value="">Chọn phòng</option>
                {groups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.room} · {group.gender === 'boys' ? 'Nam' : 'Nữ'}
                  </option>
                ))}
              </select>
            </Field>
          )}
          <Field label="Vị trí / phạm vi *">
            <input
              required
              value={value.area}
              readOnly={value.kind === 'rest'}
              onChange={(e) => setValue({ ...value, area: e.target.value })}
            />
          </Field>
          <Field label="Bắt đầu *">
            <input
              type="time"
              required
              value={value.start}
              onChange={(e) => setValue({ ...value, start: e.target.value })}
            />
          </Field>
          <Field label="Kết thúc *">
            <input
              type="time"
              required
              value={value.end}
              onChange={(e) => setValue({ ...value, end: e.target.value })}
            />
          </Field>
        </div>
        <Field label="Ghi chú thay đổi">
          <textarea
            rows={3}
            value={value.note ?? ''}
            onChange={(e) => setValue({ ...value, note: e.target.value })}
          />
        </Field>
        {!boardingPerson(state, value.teacherId).teacherId && (
          <DemoNote>
            Nhân sự này chưa liên kết với lịch giảng dạy. Có thể xác nhận liên kết tại mục Nhân sự.
          </DemoNote>
        )}
        <div className="dialog-actions">
          <Button type="button" variant="secondary" onClick={onClose}>
            Hủy
          </Button>
          <Button type="submit" disabled={busy}>
            Lưu phân công
          </Button>
        </div>
      </form>
    </Dialog>
  )
}

function TransferDialog({ onClose }: { onClose: () => void }) {
  const { state, mutate, busy } = useDemo()
  const groups = getBoardingGroups(state)
  const first = groups.find((row) => row.count > 0)
  const [fromId, setFromId] = useState(first?.id ?? '')
  const [time, setTime] = useState('12:15')
  const [toId, setToId] = useState('')
  const from = groups.find((row) => row.id === fromId)
  const members = from?.actualMembers.filter((row) => row.count > 0) ?? []
  const [classId, setClassId] = useState(members[0]?.classId ?? '')
  const [count, setCount] = useState(1)
  const [note, setNote] = useState('')
  return (
    <Dialog
      open
      onOpenChange={onClose}
      title="Chuyển học sinh giữa phòng ngủ"
      description={dateLabel(state.boardingDate)}
    >
      <form
        onSubmit={async (e) => {
          e.preventDefault()
          if (
            await mutate(
              {
                type: 'boarding.transfer',
                transfer: {
                  id: crypto.randomUUID(),
                  date: state.boardingDate,
                  fromGroupId: fromId,
                  toGroupId: toId,
                  time,
                  classId,
                  count,
                  note,
                },
              },
              'Đã ghi nhận chuyển học sinh; tổng sĩ số trong ngày được giữ nguyên.',
            )
          )
            onClose()
        }}
      >
        <div className="form-grid">
          <Field label="Phòng nguồn *">
            <select
              value={fromId}
              required
              onChange={(e) => {
                const next = groups.find((row) => row.id === e.target.value)
                setFromId(e.target.value)
                setToId('')
                setClassId(next?.actualMembers.find((row) => row.count > 0)?.classId ?? '')
                setCount(1)
              }}
            >
              {groups.map((group) => (
                <option key={group.id} value={group.id} disabled={!group.count}>
                  {group.room} · {group.gender === 'boys' ? 'Nam' : 'Nữ'} · {group.count} HS
                </option>
              ))}
            </select>
          </Field>
          <Field label="Phòng nhận *">
            <select value={toId} required onChange={(e) => setToId(e.target.value)}>
              <option value="">Chọn phòng nhận</option>
              {groups
                .filter((group) => group.id !== fromId && group.gender === from?.gender)
                .map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.room} · đang có {group.count} HS
                  </option>
                ))}
            </select>
          </Field>
          <Field label="Học sinh lớp *">
            <select
              required
              value={classId}
              onChange={(e) => {
                setClassId(e.target.value)
                setCount(1)
              }}
            >
              {members.map((member) => (
                <option key={member.classId} value={member.classId}>
                  {member.classId} · còn {member.count} HS tại phòng
                </option>
              ))}
            </select>
          </Field>
          <Field label="Số học sinh *">
            <input
              required
              type="number"
              min={1}
              max={members.find((row) => row.classId === classId)?.count ?? 0}
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
            />
          </Field>
        </div>
        <Field label="Giờ chuyển học sinh *">
          <input
            required
            type="time"
            max="13:24"
            min={groups.find((row) => row.id === toId)?.availableFrom}
            value={time}
            onChange={(e) => setTime(e.target.value)}
          />
        </Field>
        <Field label="Lý do điều phối *">
          <textarea required rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
        </Field>
        <DemoNote>
          Người điều phối chọn phòng và số học sinh thực tế. Chưa có định mức sức chứa phòng được
          xác nhận.
        </DemoNote>
        <div className="dialog-actions">
          <Button type="button" variant="secondary" onClick={onClose}>
            Hủy
          </Button>
          <Button type="submit" disabled={busy || !members.length}>
            Ghi nhận chuyển phòng
          </Button>
        </div>
      </form>
    </Dialog>
  )
}

function SupportDialog({ onClose }: { onClose: () => void }) {
  const { state, mutate, busy } = useDemo()
  const duties = getBoardingDuties(state).filter((row) =>
    ['rest', 'floor', 'medical'].includes(row.kind),
  )
  const groups = getBoardingGroups(state)
  const [dutyId, setDutyId] = useState(duties[0]?.id ?? '')
  const origin = duties.find((row) => row.id === dutyId)
  const [toId, setToId] = useState('')
  const [start, setStart] = useState(origin?.start ?? '12:10')
  const [end, setEnd] = useState(origin?.end ?? '13:25')
  const [note, setNote] = useState('')
  return (
    <Dialog
      open
      onOpenChange={onClose}
      title="Điều phối nhân sự hỗ trợ phòng"
      description={dateLabel(state.boardingDate)}
    >
      <form
        onSubmit={async (e) => {
          e.preventDefault()
          if (
            origin &&
            (await mutate(
              {
                type: 'boarding.support',
                support: {
                  id: crypto.randomUUID(),
                  date: state.boardingDate,
                  dutyId,
                  personId: origin.teacherId,
                  toGroupId: toId,
                  start,
                  end,
                  note,
                },
              },
              'Đã ghi nhận nhiệm vụ hỗ trợ trong khoảng giờ đã chọn.',
            ))
          )
            onClose()
        }}
      >
        <Field label="Nhân sự / nhiệm vụ nguồn *">
          <select
            required
            value={dutyId}
            onChange={(e) => {
              const row = duties.find((duty) => duty.id === e.target.value)
              setDutyId(e.target.value)
              setToId('')
              setStart(row?.start ?? '12:10')
              setEnd(row?.end ?? '13:25')
            }}
          >
            {duties.map((duty) => (
              <option key={duty.id} value={duty.id}>
                {boardingPerson(state, duty.teacherId).name} · {duty.area}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Phòng được hỗ trợ *">
          <select required value={toId} onChange={(e) => setToId(e.target.value)}>
            <option value="">Chọn phòng</option>
            {groups
              .filter((group) => group.id !== origin?.groupId)
              .map((group) => (
                <option key={group.id} value={group.id}>
                  {group.room} · {group.gender === 'boys' ? 'Nam' : 'Nữ'} · {group.count} HS
                </option>
              ))}
          </select>
        </Field>
        <div className="form-grid">
          <Field label="Từ giờ *">
            <input
              required
              type="time"
              min={origin?.start}
              max={origin?.end}
              value={start}
              onChange={(e) => setStart(e.target.value)}
            />
          </Field>
          <Field label="Đến giờ *">
            <input
              required
              type="time"
              min={start}
              max={origin?.end}
              value={end}
              onChange={(e) => setEnd(e.target.value)}
            />
          </Field>
        </div>
        <Field label="Nội dung hỗ trợ *">
          <textarea required rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
        </Field>
        <DemoNote>
          Giữ phân công gốc để đối chiếu. Khoảng hỗ trợ được tính thay cho phần giờ tương ứng của
          nhiệm vụ nguồn.
        </DemoNote>
        <div className="dialog-actions">
          <Button type="button" variant="secondary" onClick={onClose}>
            Hủy
          </Button>
          <Button type="submit" disabled={busy || !origin}>
            Ghi nhận hỗ trợ
          </Button>
        </div>
      </form>
    </Dialog>
  )
}

function PersonLinkDialog({ person, onClose }: { person: BoardingPerson; onClose: () => void }) {
  const { state, mutate, busy } = useDemo()
  const [teacherId, setTeacherId] = useState(person.teacherId ?? '')
  return (
    <Dialog open onOpenChange={onClose} title={`Liên kết lịch dạy · ${person.name}`}>
      <form
        onSubmit={async (e) => {
          e.preventDefault()
          if (
            await mutate(
              { type: 'boarding.person-link', personId: person.id, teacherId },
              'Đã cập nhật liên kết nhân sự và lịch dạy.',
            )
          )
            onClose()
        }}
      >
        <Field label="Giáo viên tương ứng">
          <select value={teacherId} onChange={(e) => setTeacherId(e.target.value)}>
            <option value="">Chưa liên kết / nhân sự ngoài giảng dạy</option>
            {state.teachers.map((teacher) => (
              <option key={teacher.id} value={teacher.id}>
                {teacher.name} · {teacher.department}
              </option>
            ))}
          </select>
        </Field>
        <DemoNote>
          Chỉ xác nhận khi biết đúng người. Tên nguồn trong phân công được giữ nguyên.
        </DemoNote>
        <div className="dialog-actions">
          <Button type="button" variant="secondary" onClick={onClose}>
            Hủy
          </Button>
          <Button type="submit" disabled={busy}>
            Lưu liên kết
          </Button>
        </div>
      </form>
    </Dialog>
  )
}

function AbsenceDialog({ onClose }: { onClose: () => void }) {
  const { state, mutate, busy } = useDemo()
  const groups = getBoardingGroups(state)
  const [groupId, setGroupId] = useState(groups.find((group) => group.count > 0)?.id ?? '')
  const group = groups.find((row) => row.id === groupId)
  const members = group?.actualMembers.filter((row) => row.count > 0) ?? []
  const [classId, setClassId] = useState(members[0]?.classId ?? '')
  const [count, setCount] = useState(1)
  const [note, setNote] = useState('')
  return (
    <Dialog
      open
      onOpenChange={onClose}
      title="Báo nghỉ học sinh trong ngày"
      description="Sĩ số dự kiến ăn và ngủ cùng giảm theo số học sinh báo nghỉ."
    >
      <form
        onSubmit={async (e) => {
          e.preventDefault()
          if (
            await mutate(
              {
                type: 'boarding.absence',
                absence: {
                  id: crypto.randomUUID(),
                  date: state.boardingDate,
                  groupId,
                  classId,
                  count,
                  note,
                },
              },
              'Đã ghi nhận báo nghỉ và cập nhật sĩ số dự kiến.',
            )
          )
            onClose()
        }}
      >
        <Field label="Nhóm ngủ của học sinh *">
          <select
            required
            value={groupId}
            onChange={(e) => {
              const next = groups.find((row) => row.id === e.target.value)
              setGroupId(e.target.value)
              setClassId(next?.actualMembers.find((row) => row.count > 0)?.classId ?? '')
              setCount(1)
            }}
          >
            {groups.map((row) => (
              <option key={row.id} value={row.id} disabled={!row.count}>
                {row.room} · {row.gender === 'boys' ? 'Nam' : 'Nữ'} · {row.count} HS
              </option>
            ))}
          </select>
        </Field>
        <div className="form-grid">
          <Field label="Lớp *">
            <select
              required
              value={classId}
              onChange={(e) => {
                setClassId(e.target.value)
                setCount(1)
              }}
            >
              {members.map((row) => (
                <option key={row.classId} value={row.classId}>
                  {row.classId} · còn {row.count} HS
                </option>
              ))}
            </select>
          </Field>
          <Field label="Số học sinh nghỉ *">
            <input
              type="number"
              required
              min={1}
              max={members.find((row) => row.classId === classId)?.count ?? 0}
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
            />
          </Field>
        </div>
        <Field label="Lý do / thông tin báo nghỉ *">
          <textarea required rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
        </Field>
        <DemoNote>
          Báo nghỉ là dữ liệu sĩ số; điều kiện hoàn phí chưa được xác định từ việc báo nghỉ này.
        </DemoNote>
        <div className="dialog-actions">
          <Button type="button" variant="secondary" onClick={onClose}>
            Hủy
          </Button>
          <Button type="submit" disabled={busy || !members.length}>
            Ghi nhận báo nghỉ
          </Button>
        </div>
      </form>
    </Dialog>
  )
}

function ExtraRoomDialog({ onClose }: { onClose: () => void }) {
  const { state, mutate, busy } = useDemo()
  const [room, setRoom] = useState('')
  const [gender, setGender] = useState<'boys' | 'girls'>('boys')
  const [start, setStart] = useState('12:10')
  const [personId, setPersonId] = useState('')
  const [note, setNote] = useState('')
  return (
    <Dialog
      open
      onOpenChange={onClose}
      title="Mở phòng ngủ bổ sung trong ngày"
      description="Dùng khi cần chia bớt học sinh; phòng mới bắt đầu với sĩ số 0."
    >
      <form
        onSubmit={async (e) => {
          e.preventDefault()
          const id = crypto.randomUUID()
          const aliases = room
            .split('/')
            .map((value) => value.trim())
            .filter(Boolean)
          const group = {
            id,
            roomId: `extra-${id}`,
            date: state.boardingDate,
            room: room.trim(),
            aliases,
            gender,
            members: [],
            personIds: personId ? [personId] : [],
            sourceCount: 0,
            note,
            availableFrom: start,
          }
          const duty: Duty | undefined = personId
            ? {
                id: crypto.randomUUID(),
                date: state.boardingDate,
                kind: 'rest',
                teacherId: personId,
                groupId: id,
                roomId: group.roomId,
                area: group.room,
                start,
                end: '13:25',
                confirmed: false,
                note,
              }
            : undefined
          if (
            await mutate(
              { type: 'boarding.group-add', group, duty },
              'Đã mở phòng bổ sung. Phân công người trực trước khi chuyển học sinh đến.',
            )
          )
            onClose()
        }}
      >
        <Field label="Tên phòng (các tên cùng phòng ngăn bằng /) *">
          <input
            required
            list="boarding-reserve-rooms"
            value={room}
            onChange={(e) => setRoom(e.target.value)}
          />
          <datalist id="boarding-reserve-rooms">
            <option value="Phòng Ngữ văn" />
            <option value="Phòng KH" />
          </datalist>
        </Field>
        <div className="form-grid">
          <Field label="Nhóm học sinh">
            <select value={gender} onChange={(e) => setGender(e.target.value as 'boys' | 'girls')}>
              <option value="boys">Nam</option>
              <option value="girls">Nữ</option>
            </select>
          </Field>
          <Field label="Phòng sẵn sàng từ *">
            <input
              type="time"
              required
              max="13:24"
              value={start}
              onChange={(e) => setStart(e.target.value)}
            />
          </Field>
        </div>
        <Field label="Nhân sự phụ trách">
          <select value={personId} onChange={(e) => setPersonId(e.target.value)}>
            <option value="">Chờ điều phối hỗ trợ / phân công sau</option>
            <optgroup label="Nhân sự bán trú">
              {state.boardingPeople.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.name}
                </option>
              ))}
            </optgroup>
            <optgroup label="Giáo viên khác">
              {state.teachers
                .filter(
                  (teacher) =>
                    !state.boardingPeople.some((person) => person.teacherId === teacher.id),
                )
                .map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.name}
                  </option>
                ))}
            </optgroup>
          </select>
        </Field>
        <Field label="Lý do mở phòng *">
          <textarea required rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
        </Field>
        <DemoNote>
          Phòng Ngữ văn có lớp 6A8 ăn ca 3 vào thứ Năm, thứ Sáu đến 12:15. Cần bố trí giờ phòng sẵn
          sàng và bàn giao phù hợp. Sức chứa phòng do người điều phối xác định.
        </DemoNote>
        <div className="dialog-actions">
          <Button type="button" variant="secondary" onClick={onClose}>
            Hủy
          </Button>
          <Button type="submit" disabled={busy}>
            Mở phòng trong ngày
          </Button>
        </div>
      </form>
    </Dialog>
  )
}

export function DutiesPage() {
  const { state, mutate, busy } = useDemo()
  const [tab, setTab] = useState('meal')
  const [search, setSearch] = useState('')
  const [shift, setShift] = useState<1 | 2 | 3>(1)
  const [gender, setGender] = useState('all')
  const [editing, setEditing] = useState<Duty | null>(null)
  const [replacing, setReplacing] = useState<Duty | null>(null)
  const [transferring, setTransferring] = useState(false)
  const [supporting, setSupporting] = useState(false)
  const [reportingAbsence, setReportingAbsence] = useState(false)
  const [openingRoom, setOpeningRoom] = useState(false)
  const [linking, setLinking] = useState<BoardingPerson | null>(null)
  const version = boardingVersion(state.boardingDate)
  const duties = getBoardingDuties(state)
  const groups = getBoardingGroups(state)
  const query = normalize(search)
  const matches = (...parts: string[]) => normalize(parts.join(' ')).includes(query)
  const mealDuties = duties.filter((row) => row.kind === 'meal')
  const classes = version?.classes ?? []
  const meals = getBoardingMeals(state)
  const expected = meals.reduce((sum, row) => sum + row.expected, 0)
  const transfers = state.boardingTransfers.filter((row) => row.date === state.boardingDate)
  const supports = state.boardingSupports.filter((row) => row.date === state.boardingDate)
  const absences = state.boardingAbsences.filter((row) => row.date === state.boardingDate)
  const events = state.events.filter(
    (row) => row.scope === 'boarding' && row.date === state.boardingDate,
  )
  const newDuty = (): Duty => ({
    id: crypto.randomUUID(),
    teacherId: state.boardingPeople[0]?.id ?? '',
    date: state.boardingDate,
    kind: 'rest',
    area: '',
    start: '12:10',
    end: '13:25',
    confirmed: false,
  })

  const actions = (duty: Duty) => {
    const person = boardingPerson(state, duty.teacherId)
    const supported = supports.filter((row) => row.dutyId === duty.id)
    return (
      <div className="boarding-person-duty" key={duty.id}>
        <div>
          <strong>
            {duty.kind === 'support' ? 'Hỗ trợ: ' : ''}
            {person.name}
          </strong>
          {duty.originalTeacherId &&
            boardingPersonKey(state, duty.originalTeacherId) !==
              boardingPersonKey(state, duty.teacherId) && (
              <small>Trông thay {boardingPerson(state, duty.originalTeacherId).name}</small>
            )}
          <small>
            {duty.start && duty.end ? `${duty.start}–${duty.end}` : 'Chưa xác định giờ trong nguồn'}
          </small>
        </div>
        <Badge tone={duty.confirmed ? 'green' : 'amber'}>
          {duty.confirmed ? 'Đã xác nhận' : 'Chờ xác nhận'}
        </Badge>
        <div className="boarding-duty-actions">
          {duty.kind !== 'support' && (
            <Button size="sm" variant="ghost" onClick={() => setEditing(duty)}>
              <Edit3 size={13} />
              Sửa
            </Button>
          )}
          {['meal', 'rest'].includes(duty.kind) && (
            <Button
              size="sm"
              variant="ghost"
              disabled={!duty.start || !person.teacherId || Boolean(supported.length)}
              title={
                !person.teacherId
                  ? 'Cần liên kết đúng nhân sự với lịch dạy tại mục Nhân sự'
                  : 'Gợi ý người trông thay'
              }
              onClick={() => setReplacing(duty)}
            >
              <Sparkles size={13} />
              Trông thay
            </Button>
          )}
          {!duty.confirmed && (
            <Button
              size="sm"
              variant="ghost"
              disabled={busy}
              onClick={() =>
                mutate(
                  { type: 'duty.confirm', id: duty.id },
                  'Đã xác nhận nhiệm vụ trực trong ngày.',
                )
              }
            >
              <CheckCircle2 size={13} />
              Xác nhận
            </Button>
          )}
        </div>
        {supported.map((support) => (
          <small className="boarding-support-note" key={support.id}>
            Hỗ trợ {groups.find((row) => row.id === support.toGroupId)?.room} · {support.start}–
            {support.end}
          </small>
        ))}
        {(dutyConflict(state, duty) || boardingTeachingConflict(state, duty)) && (
          <small className="red-text">Cần đối chiếu: có lịch dạy hoặc nhiệm vụ giao nhau.</small>
        )}
      </div>
    )
  }

  const exportDuties = () =>
    downloadCsv(
      `phan-cong-ban-tru-${state.boardingDate}.csv`,
      [
        'Ngày',
        'Phiên bản',
        'Nhiệm vụ',
        'Lớp',
        'Ca ăn',
        'Vị trí',
        'Sĩ số nhóm/lớp (không cộng theo người)',
        'Nhân sự gốc',
        'Nhân sự thực tế',
        'Bắt đầu',
        'Kết thúc',
        'Xác nhận',
        'Ghi chú',
      ],
      duties.map((duty) => [
        duty.date,
        duty.versionId ?? '',
        boardingKindLabel[duty.kind],
        (duty.kind === 'meal'
          ? duty.classIds
          : (groups
              .find((row) => row.id === duty.groupId)
              ?.actualMembers.filter((row) => row.count > 0)
              .map((row) => row.classId) ?? duty.classIds)
        )?.join('; ') ?? '',
        duty.shift ?? '',
        duty.area,
        duty.kind === 'meal'
          ? meals
              .filter((row) => duty.classIds?.includes(row.classId))
              .reduce((sum, row) => sum + row.expected, 0)
          : (groups.find((row) => row.id === duty.groupId)?.count ?? '—'),
        boardingPerson(state, duty.originalTeacherId ?? duty.teacherId).name,
        boardingPerson(state, duty.teacherId).name,
        duty.start,
        duty.end,
        duty.confirmed ? 'Đã xác nhận' : 'Chờ xác nhận',
        duty.note ?? '',
      ]),
    )

  return (
    <>
      <PageHeader
        eyebrow="BÁN TRÚ / PHÂN CÔNG"
        title="Phân công trông ăn & trông ngủ"
        description="Phân công theo lớp, ca ăn, nhóm ngủ và điều phối thực tế trong ngày."
        actions={
          <>
            <Button variant="secondary" onClick={exportDuties}>
              <FileDown size={16} />
              Xuất phân công
            </Button>
            <Button disabled={!duties.length} onClick={() => setEditing(newDuty())}>
              <Plus size={16} />
              Thêm người trực
            </Button>
          </>
        }
      />
      <BoardingDatePicker />
      <div className="boarding-week-strip">
        {Array.from({ length: 5 }, (_, i) => addDays(boardingWeekStart(state.boardingDate), i)).map(
          (date, i) => (
            <button
              key={date}
              disabled={busy || date < '2026-09-08'}
              className={date === state.boardingDate ? 'selected' : ''}
              onClick={() =>
                mutate({ type: 'boarding.date', date }, `Đang xem ${dateLabel(date)}.`)
              }
            >
              <strong>{['Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu'][i]}</strong>
              <span>{dateLabel(date).slice(0, 5)}</span>
            </button>
          ),
        )}
      </div>
      <div className="metrics-grid">
        <Metric
          label="Đăng ký bán trú"
          value={classes.reduce((sum, cls) => sum + cls.boys + cls.girls, 0)}
          detail={`${classes.length} lớp · theo phiên bản ${version?.id}`}
          icon={UsersRound}
        />
        <Metric
          label="Dự kiến ăn hôm nay"
          value={expected}
          detail="Đã trừ các lớp nghỉ theo lịch"
          icon={Soup}
          tone="teal"
        />
        <Metric
          label="Học sinh tại nhóm ngủ"
          value={groups.reduce((sum, group) => sum + group.count, 0)}
          detail={`${groups.length} nhóm · điều chuyển không tăng tổng sĩ số`}
          icon={BedDouble}
          tone="purple"
        />
        <Metric
          label="Nhiệm vụ đã xác nhận"
          value={`${duties.filter((row) => row.confirmed).length}/${duties.length}`}
          detail="Theo từng người được phân công"
          icon={CheckCircle2}
          tone="green"
        />
      </div>
      <div className="toolbar-panel">
        <div className="segmented boarding-tabs">
          {[
            ['meal', 'Trông ăn'],
            ['dining', 'Sơ đồ nhà ăn'],
            ['rest', 'Trông ngủ'],
            ['services', 'Tầng & y tế'],
            ['coordination', 'Điều phối & lịch sử'],
            ['people', 'Nhân sự'],
          ].map(([key, label]) => (
            <button
              className={tab === key ? 'selected' : ''}
              key={key}
              onClick={() => {
                setTab(key)
                setSearch('')
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      {['meal', 'rest', 'people'].includes(tab) && (
        <div className="toolbar-panel">
          <input
            className="boarding-search"
            aria-label="Tìm trong phân công"
            placeholder="Tìm lớp, phòng hoặc nhân sự..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {tab === 'rest' && (
            <select
              aria-label="Lọc nhóm nam nữ"
              value={gender}
              onChange={(e) => setGender(e.target.value)}
            >
              <option value="all">Tất cả nhóm</option>
              <option value="boys">Nhóm nam</option>
              <option value="girls">Nhóm nữ</option>
            </select>
          )}
        </div>
      )}
      {tab === 'meal' && (
        <Panel title={`Trông ăn theo lớp · ${dateLabel(state.boardingDate)}`}>
          <div className="table-scroll">
            <table className="boarding-table">
              <thead>
                <tr>
                  <th>Lớp</th>
                  <th>Đăng ký</th>
                  <th>Hôm nay</th>
                  <th>Ca / vị trí</th>
                  <th>Nhân sự phụ trách</th>
                </tr>
              </thead>
              <tbody>
                {classes
                  .filter((cls) => matches(cls.classId, boardingPerson(state, cls.personId).name))
                  .map((cls) => {
                    const rows = mealDuties.filter((duty) => duty.classIds?.includes(cls.classId))
                    const present = boardingClassPresent(version!, cls.classId, state.boardingDate)
                    return (
                      <tr key={cls.classId}>
                        <td>
                          <strong>{cls.classId}</strong>
                          <small>
                            Nam {cls.boys} · Nữ {cls.girls}
                          </small>
                        </td>
                        <td>{cls.boys + cls.girls}</td>
                        <td>
                          {present ? (
                            (meals.find((row) => row.classId === cls.classId)?.expected ?? 0)
                          ) : (
                            <Badge>Lớp nghỉ</Badge>
                          )}
                        </td>
                        <td>
                          {rows.length
                            ? rows.map((duty) => (
                                <div key={duty.id}>
                                  <strong>
                                    {duty.shift ? `Ca ${duty.shift}` : 'Chưa có ca trong nguồn'}
                                  </strong>
                                  <small>{duty.area}</small>
                                </div>
                              ))
                            : '—'}
                        </td>
                        <td>
                          {rows.map(actions)}
                          {!present && <span className="muted">Nghỉ ăn và ngủ theo lịch học</span>}
                        </td>
                      </tr>
                    )
                  })}
              </tbody>
            </table>
          </div>
        </Panel>
      )}
      {tab === 'dining' && (
        <Panel
          title="Sơ đồ vị trí lớp ngồi ăn"
          action={
            <select
              aria-label="Chọn ca trên sơ đồ"
              value={shift}
              onChange={(e) => setShift(Number(e.target.value) as 1 | 2 | 3)}
            >
              {Object.entries(mealShifts).map(([key, time]) => (
                <option key={key} value={key}>
                  Ca {key} · {time.start}
                </option>
              ))}
            </select>
          }
        >
          {state.boardingDate < '2026-10-26' ? (
            <Alert title="Chưa có sơ đồ vị trí cho phiên bản lịch sử" tone="amber">
              Sơ đồ người dùng cung cấp có hiệu lực từ 26/10/2026.
            </Alert>
          ) : (
            <>
              <div className="boarding-dining-scroll">
                <div className="boarding-dining-plan">
                  <div className="boarding-dining-doors">
                    <strong>CỬA BẾP NẤU</strong>
                    <strong>CỬA RA VÀO</strong>
                  </div>
                  <div className="boarding-dining-aisles">
                    {Array.from({ length: 11 }, (_, i) => {
                      const rows = mealDuties.filter(
                        (duty) => duty.shift === shift && duty.area === `Nhà ăn · Dãy ${i + 1}`,
                      )
                      const classIds = [...new Set(rows.flatMap((row) => row.classIds ?? []))]
                      return (
                        <article key={i}>
                          <h3>DÃY {i + 1}</h3>
                          {rows.length ? (
                            <div>
                              <strong>{classIds.join(' + ')}</strong>
                              <small>
                                {[
                                  ...new Set(
                                    rows.map((row) => boardingPerson(state, row.teacherId).name),
                                  ),
                                ].join(' · ')}
                              </small>
                              <small>
                                {meals
                                  .filter((row) => classIds.includes(row.classId))
                                  .reduce((sum, row) => sum + row.expected, 0)}{' '}
                                học sinh
                              </small>
                            </div>
                          ) : (
                            <span className="muted">Chưa bố trí</span>
                          )}
                        </article>
                      )
                    })}
                  </div>
                </div>
              </div>
              {[
                ...new Set(
                  mealDuties
                    .filter((duty) => duty.shift === shift && !/^Nhà ăn · Dãy \d+$/.test(duty.area))
                    .map((row) => row.area),
                ),
              ].map((area) => {
                const rows = mealDuties.filter((duty) => duty.shift === shift && duty.area === area)
                return (
                  <div className="boarding-outside-dining" key={area}>
                    <Badge tone="amber">Ngoài nhà ăn</Badge>
                    <strong>
                      {[...new Set(rows.flatMap((row) => row.classIds ?? []))].join(' + ')} · {area}
                    </strong>
                    <span>
                      {rows.map((row) => boardingPerson(state, row.teacherId).name).join(' · ')} ·
                      Ca {shift}
                    </span>
                  </div>
                )
              })}
              {!mealDuties.some((duty) => duty.shift === shift) && (
                <p className="boarding-empty">
                  Không có lớp được bố trí ăn ca {shift} trong ngày này.
                </p>
              )}
            </>
          )}
        </Panel>
      )}
      {tab === 'rest' && (
        <>
          <Alert title="Giữ nhiệm vụ trực khi phòng hết học sinh theo danh sách gốc" tone="blue">
            Phòng có thể nhận học sinh từ phòng khác hoặc nhân sự sang hỗ trợ. Bắt đầu trực muộn
            nhất 12:10, kết thúc 13:25; bàn giao học sinh lên phòng sớm còn chờ xác nhận.
          </Alert>
          <div className="boarding-group-grid">
            {groups
              .filter(
                (group) =>
                  (gender === 'all' || gender === group.gender) &&
                  matches(
                    group.room,
                    group.members.map((row) => row.classId).join(' '),
                    duties
                      .filter((duty) => duty.groupId === group.id)
                      .map((duty) => boardingPerson(state, duty.teacherId).name)
                      .join(' '),
                  ),
              )
              .map((group) => (
                <Panel
                  key={group.id}
                  title={group.room}
                  action={
                    <Badge tone={group.gender === 'boys' ? 'blue' : 'purple'}>
                      {group.gender === 'boys' ? 'Nam' : 'Nữ'}
                    </Badge>
                  }
                >
                  <div className="boarding-group-counts">
                    <span>
                      Danh sách gốc<strong>{group.baseCount}</strong>
                    </span>
                    <span>
                      Đi học hôm nay<strong>{group.expectedCount}</strong>
                    </span>
                    <span>
                      Sau điều phối<strong>{group.count}</strong>
                    </span>
                  </div>
                  <p className="boarding-group-members">
                    {group.actualMembers.map((member) => (
                      <span key={member.classId} className={!member.count ? 'muted' : ''}>
                        {member.classId}: <strong>{member.count}</strong>
                      </span>
                    ))}
                  </p>
                  {(group.incoming > 0 || group.outgoing > 0) && (
                    <p className="muted">
                      Nhận {group.incoming} · chuyển đi {group.outgoing}
                    </p>
                  )}
                  {group.absent > 0 && (
                    <p className="muted">Đã báo nghỉ {group.absent} học sinh trong ngày</p>
                  )}
                  {!group.count && <Badge tone="amber">Chờ nhận học sinh / điều phối hỗ trợ</Badge>}
                  {!duties.some(
                    (duty) => duty.groupId === group.id && ['rest', 'support'].includes(duty.kind),
                  ) && (
                    <p className="red-text">
                      Chưa có người trực. Cần phân công hoặc điều phối hỗ trợ trước khi nhận học
                      sinh.
                    </p>
                  )}
                  {duties
                    .filter((duty) => duty.groupId === group.id && duty.kind === 'rest')
                    .map(actions)}
                  {duties
                    .filter((duty) => duty.groupId === group.id && duty.kind === 'support')
                    .map(actions)}
                  {group.note && <p className="boarding-source-note">{group.note}</p>}
                </Panel>
              ))}
          </div>
        </>
      )}
      {tab === 'services' && (
        <div className="boarding-group-grid">
          {duties
            .filter((duty) => ['floor', 'medical'].includes(duty.kind))
            .map((duty) => (
              <Panel key={duty.id} title={duty.area} icon={ShieldCheck}>
                {actions(duty)}
                <p className="boarding-source-note">{duty.note}</p>
              </Panel>
            ))}
        </div>
      )}
      {tab === 'coordination' && (
        <>
          <div className="toolbar-panel">
            <Button disabled={!duties.length} onClick={() => setTransferring(true)}>
              <ArrowLeftRight size={16} />
              Chuyển học sinh
            </Button>
            <Button
              variant="secondary"
              disabled={!duties.length}
              onClick={() => setSupporting(true)}
            >
              <UsersRound size={16} />
              Điều phối hỗ trợ
            </Button>
            <Button
              variant="secondary"
              disabled={state.mealsClosed || !duties.length}
              onClick={() => setReportingAbsence(true)}
            >
              Báo nghỉ học sinh
            </Button>
            <Button
              variant="secondary"
              disabled={!duties.length}
              onClick={() => setOpeningRoom(true)}
            >
              <Plus size={16} />
              Mở phòng bổ sung
            </Button>
          </div>
          <Panel title="Học sinh báo nghỉ trong ngày">
            {absences.length ? (
              absences.map((absence) => (
                <div className="boarding-coordination-row" key={absence.id}>
                  <div>
                    <strong>
                      {absence.classId} · {absence.count} học sinh ·{' '}
                      {groups.find((row) => row.id === absence.groupId)?.room}
                    </strong>
                    <small>{absence.note}</small>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={busy || state.mealsClosed}
                    onClick={() =>
                      mutate(
                        { type: 'boarding.absence-delete', id: absence.id },
                        'Đã hoàn tác báo nghỉ học sinh.',
                      )
                    }
                  >
                    Hoàn tác
                  </Button>
                </div>
              ))
            ) : (
              <p className="boarding-empty">
                Chưa có báo nghỉ cá nhân; các lớp nghỉ theo thời khóa biểu đã được trừ tự động.
              </p>
            )}
          </Panel>
          <Panel title="Điều phối trong ngày">
            {!transfers.length && !supports.length && (
              <p className="boarding-empty">
                Chưa có điều phối. Các phòng giữ phân công gốc, kể cả phòng không còn học sinh theo
                lịch học.
              </p>
            )}
            {transfers.map((move) => (
              <div className="boarding-coordination-row" key={move.id}>
                <div>
                  <strong>
                    {move.time} · {move.classId} · {move.count} học sinh ·{' '}
                    {groups.find((row) => row.id === move.fromGroupId)?.room} →{' '}
                    {groups.find((row) => row.id === move.toGroupId)?.room}
                  </strong>
                  <small>{move.note}</small>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={busy}
                  onClick={() =>
                    mutate(
                      { type: 'boarding.transfer-delete', id: move.id },
                      'Đã hoàn tác chuyển học sinh.',
                    )
                  }
                >
                  <X size={14} />
                  Hoàn tác
                </Button>
              </div>
            ))}
            {supports.map((support) => (
              <div className="boarding-coordination-row" key={support.id}>
                <div>
                  <strong>
                    {boardingPerson(state, support.personId).name} →{' '}
                    {groups.find((row) => row.id === support.toGroupId)?.room} · {support.start}–
                    {support.end}
                  </strong>
                  <small>{support.note}</small>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={busy}
                  onClick={() =>
                    mutate(
                      { type: 'boarding.support-delete', id: support.id },
                      'Đã hoàn tác hỗ trợ phòng.',
                    )
                  }
                >
                  <X size={14} />
                  Hoàn tác
                </Button>
              </div>
            ))}
          </Panel>
          <Panel title="Lịch sử thay đổi trong ngày">
            {events.length ? (
              events.map((event) => (
                <div className="boarding-coordination-row" key={event.id}>
                  <div>
                    <strong>{event.title}</strong>
                    <small>{event.note}</small>
                  </div>
                  <small>{event.time}</small>
                </div>
              ))
            ) : (
              <p className="boarding-empty">Chưa có thay đổi phát sinh trong ngày.</p>
            )}
          </Panel>
        </>
      )}
      {tab === 'people' && (
        <Panel
          title="Nhân sự bán trú và liên kết lịch giảng dạy"
          description="Giữ tên từ nguồn phân công; chỉ ghép với giáo viên khi đã xác định đúng người."
        >
          <div className="table-scroll">
            <table className="boarding-table">
              <thead>
                <tr>
                  <th>Tên nguồn</th>
                  <th>Giáo viên tương ứng</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {state.boardingPeople
                  .filter((person) =>
                    matches(person.name, boardingPerson(state, person.id).fullName ?? ''),
                  )
                  .map((person) => (
                    <tr key={person.id}>
                      <td>
                        <strong>{person.name}</strong>
                      </td>
                      <td>{boardingPerson(state, person.id).fullName ?? '—'}</td>
                      <td>
                        <Badge
                          tone={
                            person.teacherId ? 'green' : person.role === 'staff' ? 'teal' : 'amber'
                          }
                        >
                          {person.teacherId
                            ? 'Đã liên kết lịch dạy'
                            : person.role === 'staff'
                              ? 'Nhân sự bán trú'
                              : 'Chưa xác định liên kết'}
                        </Badge>
                      </td>
                      <td>
                        <Button variant="secondary" size="sm" onClick={() => setLinking(person)}>
                          Liên kết / sửa
                        </Button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </Panel>
      )}
      {editing && <DutyEditor key={editing.id} duty={editing} onClose={() => setEditing(null)} />}
      {replacing && (
        <DutyReplacementPicker
          key={replacing.id}
          duty={replacing}
          onClose={() => setReplacing(null)}
        />
      )}
      {transferring && <TransferDialog onClose={() => setTransferring(false)} />}
      {supporting && <SupportDialog onClose={() => setSupporting(false)} />}
      {reportingAbsence && <AbsenceDialog onClose={() => setReportingAbsence(false)} />}
      {openingRoom && <ExtraRoomDialog onClose={() => setOpeningRoom(false)} />}
      {linking && <PersonLinkDialog person={linking} onClose={() => setLinking(null)} />}
    </>
  )
}
