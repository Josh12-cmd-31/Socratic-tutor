import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ScatterChart,
  Scatter,
  ZAxis,
  AreaChart,
  Area
} from 'recharts';
import { cn } from '@/lib/utils';

interface MathChartProps {
  type: 'function' | 'scatter' | 'distribution';
  data: any[];
  xAxisKey?: string;
  yAxisKey?: string;
  title?: string;
  xDomain?: [number, number];
  yDomain?: [number, number];
  showGrid?: boolean;
}

export function MathChart({ 
  type, 
  data, 
  xAxisKey = 'x', 
  yAxisKey = 'y', 
  title,
  xDomain,
  yDomain,
  showGrid = true 
}: MathChartProps) {
  const renderChart = () => {
    switch (type) {
      case 'function':
        return (
          <LineChart data={data}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />}
            <XAxis 
              dataKey={xAxisKey} 
              type="number" 
              domain={xDomain || ['auto', 'auto']} 
              stroke="#94a3b8" 
              fontSize={10}
            />
            <YAxis 
              stroke="#94a3b8" 
              fontSize={10} 
              domain={yDomain || ['auto', 'auto']}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'white', 
                borderRadius: '8px', 
                border: '1px solid #e2e8f0',
                fontSize: '12px'
              }} 
            />
            <ReferenceLine x={0} stroke="#cbd5e1" strokeWidth={1} />
            <ReferenceLine y={0} stroke="#cbd5e1" strokeWidth={1} />
            <Line 
              type="monotone" 
              dataKey={yAxisKey} 
              stroke="#4f46e5" 
              strokeWidth={3} 
              dot={false}
              animationDuration={800}
            />
          </LineChart>
        );
      case 'scatter':
        return (
          <ScatterChart>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />}
            <XAxis dataKey={xAxisKey} type="number" stroke="#94a3b8" fontSize={10} />
            <YAxis dataKey={yAxisKey} type="number" stroke="#94a3b8" fontSize={10} />
            <ZAxis type="number" range={[64, 64]} />
            <Tooltip />
            <Scatter name="Data" data={data} fill="#4f46e5" />
          </ScatterChart>
        );
      case 'distribution':
        return (
          <AreaChart data={data}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />}
            <XAxis dataKey={xAxisKey} stroke="#94a3b8" fontSize={10} />
            <YAxis stroke="#94a3b8" fontSize={10} />
            <Tooltip />
            <Area 
              type="monotone" 
              dataKey={yAxisKey} 
              stroke="#4f46e5" 
              fill="#4f46e5" 
              fillOpacity={0.1} 
              animationDuration={1000}
            />
          </AreaChart>
        );
      default:
        return null;
    }
  };

  return (
    <div className="w-full bg-white rounded-2xl border border-slate-100 p-6 my-6 shadow-sm">
      {title && (
        <div className="mb-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-center">
          {title}
        </div>
      )}
      <div className="h-48 md:h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {renderChart() as any}
        </ResponsiveContainer>
      </div>
      <div className="mt-4 flex items-center justify-center gap-4 text-[10px] font-mono text-slate-400">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-indigo-500" />
          Visual Graph
        </div>
        <div>Interactive Visualization</div>
      </div>
    </div>
  );
}
