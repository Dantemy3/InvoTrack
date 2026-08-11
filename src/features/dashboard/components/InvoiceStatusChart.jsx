import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

const COLORS = {
  paid: '#678c54',
  pending: '#d8941f',
  overdue: '#c24b30',
  draft: '#a3947a',
  cancelled: '#cfc0a6',
}

const LABELS = {
  paid: 'Pagadas',
  pending: 'Pendientes',
  overdue: 'Vencidas',
  draft: 'Borradores',
  cancelled: 'Canceladas',
}

// Gráfico de torta que muestra la distribución de facturas por estado (pagadas/pendientes/vencidas).
export default function InvoiceStatusChart({ stats, isLoading }) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader><Skeleton className="h-5 w-32" /></CardHeader>
        <CardContent><Skeleton className="h-48 w-full" /></CardContent>
      </Card>
    )
  }

  const data = [
    { name: 'paid', value: stats?.paid || 0 },
    { name: 'pending', value: stats?.pending || 0 },
    { name: 'overdue', value: stats?.overdue || 0 },
  ].filter((d) => d.value > 0)

  if (!data.length) {
    return (
      <Card>
        <CardHeader><CardTitle>Estado de facturas</CardTitle></CardHeader>
        <CardContent className="flex items-center justify-center h-48 text-gray-400 text-sm">
          Sin datos este mes
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader><CardTitle>Estado de facturas</CardTitle></CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={80}
              paddingAngle={3}
              dataKey="value"
            >
              {data.map((entry) => (
                <Cell key={entry.name} fill={COLORS[entry.name]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value, name) => [value, LABELS[name]]}
              contentStyle={{ borderRadius: '12px', border: '1px solid #e3d8c4', fontSize: '13px', background: '#fffdf9', color: '#241d15' }}
            />
            <Legend
              formatter={(value) => LABELS[value]}
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: '12px', color: '#6f614c' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
