'use client'

import { useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { ProgressChartData } from '@/types/progress'
import { format } from 'date-fns'

interface ProgressChartProps {
  data: ProgressChartData[]
}

export function ProgressChart({ data }: ProgressChartProps) {
  const chartData = useMemo(() => {
    return data.map(item => ({
      ...item,
      formattedDate: format(new Date(item.date), 'MMM dd, yyyy'),
      riskColor: item.risk_level === 'low' ? '#10b981' : 
                 item.risk_level === 'medium' ? '#f59e0b' : '#ef4444'
    }))
  }, [data])

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium">{data.formattedDate}</p>
          <p className="text-sm text-gray-600">Age: {data.age_months} months</p>
          <p className="text-sm">
            Score: <span className="font-medium">{data.score}/20</span>
          </p>
          <p className="text-sm">
            Risk Level: <span 
              className="font-medium capitalize"
              style={{ color: data.riskColor }}
            >
              {data.risk_level}
            </span>
          </p>
        </div>
      )
    }
    return null
  }

  const CustomDot = (props: any) => {
    const { cx, cy, payload } = props
    return (
      <circle
        cx={cx}
        cy={cy}
        r={4}
        fill={payload.riskColor}
        stroke="#fff"
        strokeWidth={2}
      />
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500">
        <div className="text-center">
          <p>No assessment data available</p>
          <p className="text-sm mt-1">Complete assessments to see progress trends</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="formattedDate"
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis 
            domain={[0, 20]}
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            label={{ value: 'M-CHAT-R Score', angle: -90, position: 'insideLeft' }}
          />
          
          {/* Reference lines for risk levels */}
          <ReferenceLine y={2} stroke="#10b981" strokeDasharray="2 2" opacity={0.5} />
          <ReferenceLine y={7} stroke="#f59e0b" strokeDasharray="2 2" opacity={0.5} />
          
          <Tooltip content={<CustomTooltip />} />
          
          <Line
            type="monotone"
            dataKey="score"
            stroke="#3b82f6"
            strokeWidth={3}
            dot={<CustomDot />}
            activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2, fill: '#fff' }}
          />
        </LineChart>
      </ResponsiveContainer>
      
      {/* Legend */}
      <div className="mt-4 flex items-center justify-center gap-6 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <span>Low Risk (0-2)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
          <span>Medium Risk (3-7)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
          <span>High Risk (8-20)</span>
        </div>
      </div>
    </div>
  )
}
