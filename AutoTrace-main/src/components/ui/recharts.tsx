
"use client";

import { 
  ResponsiveContainer, 
  BarChart as RechartsBarChart,
  LineChart as RechartsLineChart,
  Bar, 
  Line,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from "recharts";
import { ChartContainer, ChartTooltipContent } from "./chart";

interface ChartProps {
  data: any[];
  categories: string[];
  index: string;
  colors?: string[];
  valueFormatter?: (value: number) => string;
  startEndOnly?: boolean;
  showLegend?: boolean;
  showXAxis?: boolean;
  showYAxis?: boolean;
  showGrid?: boolean;
  className?: string;
  yAxisWidth?: number;
}

export function BarChart({
  data,
  categories,
  index,
  colors = ["blue"],
  valueFormatter = (value: number) => `${value}`,
  startEndOnly = false,
  showLegend = true,
  showXAxis = true,
  showYAxis = true,
  showGrid = true,
  className,
  yAxisWidth = 50,
}: ChartProps) {
  // Create config object for the chart
  const config = Object.fromEntries(
    categories.map((category, i) => [
      category,
      {
        label: category,
        color: colors[i % colors.length],
      },
    ])
  );

  return (
    <ChartContainer className={className} config={config}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsBarChart
          data={data}
          margin={{ top: 16, right: 16, bottom: 16, left: 16 }}
        >
          {showGrid && (
            <CartesianGrid
              strokeDasharray="3 3"
              horizontal={true}
              vertical={false}
              stroke="#eee"
            />
          )}
          {showXAxis && (
            <XAxis
              dataKey={index}
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={startEndOnly ? (value, index) => {
                if (index === 0 || index === data.length - 1) return value;
                return "";
              } : undefined}
            />
          )}
          {showYAxis && (
            <YAxis
              width={yAxisWidth}
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => {
                return valueFormatter ? valueFormatter(value) : value;
              }}
            />
          )}
          <Tooltip
            content={({ active, payload, label }) => (
              <ChartTooltipContent
                active={active}
                payload={payload}
                label={label}
                formatter={(value) => {
                  return valueFormatter ? valueFormatter(value as number) : value;
                }}
              />
            )}
          />
          {showLegend && <Legend />}
          {categories.map((category, i) => (
            <Bar
              key={category}
              dataKey={category}
              fill={`var(--color-${category}, ${colors[i % colors.length]})`}
              radius={[4, 4, 0, 0]}
            />
          ))}
        </RechartsBarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}

export function LineChart({
  data,
  categories,
  index,
  colors = ["blue"],
  valueFormatter = (value: number) => `${value}`,
  startEndOnly = false,
  showLegend = true,
  showXAxis = true,
  showYAxis = true,
  showGrid = true,
  className,
  yAxisWidth = 50,
}: ChartProps) {
  // Create config object for the chart
  const config = Object.fromEntries(
    categories.map((category, i) => [
      category,
      {
        label: category,
        color: colors[i % colors.length],
      },
    ])
  );

  return (
    <ChartContainer className={className} config={config}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsLineChart
          data={data}
          margin={{ top: 16, right: 16, bottom: 16, left: 16 }}
        >
          {showGrid && (
            <CartesianGrid
              strokeDasharray="3 3"
              horizontal={true}
              vertical={false}
              stroke="#eee"
            />
          )}
          {showXAxis && (
            <XAxis
              dataKey={index}
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={startEndOnly ? (value, index) => {
                if (index === 0 || index === data.length - 1) return value;
                return "";
              } : undefined}
            />
          )}
          {showYAxis && (
            <YAxis
              width={yAxisWidth}
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => {
                return valueFormatter ? valueFormatter(value) : value;
              }}
            />
          )}
          <Tooltip
            content={({ active, payload, label }) => (
              <ChartTooltipContent
                active={active}
                payload={payload}
                label={label}
                formatter={(value) => {
                  return valueFormatter ? valueFormatter(value as number) : value;
                }}
              />
            )}
          />
          {showLegend && <Legend />}
          {categories.map((category, i) => (
            <Line
              key={category}
              type="monotone"
              dataKey={category}
              stroke={`var(--color-${category}, ${colors[i % colors.length]})`}
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          ))}
        </RechartsLineChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
