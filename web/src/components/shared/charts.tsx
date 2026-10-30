import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

export function MealsChart({
  data,
}: {
  data: { name: string; registered: number; expected: number; received: number | null }[]
}) {
  return (
    <div
      className="chart"
      role="img"
      aria-label={`Biểu đồ tuần: ${data.map((row) => `${row.name} đăng ký ${row.registered}, dự kiến ${row.expected}, thực nhận ${row.received ?? 'chưa ghi nhận'}`).join('; ')}.`}
    >
      <ResponsiveContainer width="100%" height={260} minWidth={0}>
        <LineChart data={data} margin={{ top: 20, right: 25, left: -15, bottom: 5 }}>
          <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#e8edf4" />
          <XAxis
            dataKey="name"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: '#64748b' }}
            dy={10}
          />
          <YAxis
            domain={[0, 'auto']}
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: '#64748b' }}
          />
          <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} />
          <Legend iconType="circle" wrapperStyle={{ fontSize: 11, paddingTop: 20 }} />
          <Line
            name="Đăng ký"
            type="monotone"
            dataKey="registered"
            stroke="#cbd5e1"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={false}
          />
          <Line
            name="Dự kiến"
            type="monotone"
            dataKey="expected"
            stroke="#14b8a6"
            strokeWidth={2}
            dot={{ r: 4 }}
          />
          <Line
            name="Thực nhận"
            type="monotone"
            dataKey="received"
            stroke="#2563eb"
            strokeWidth={3}
            dot={{ r: 5, fill: '#fff', strokeWidth: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
