"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { TrendPoint } from "@/types";
import { companyHealthScore, scoreBand } from "@/lib/scoring";
import { bandColor, formatPeriod } from "@/lib/utils";

interface TrendChartProps {
  points: TrendPoint[];
}

export function TrendChart({ points }: TrendChartProps) {
  const periods = Array.from(new Set(points.map((p) => p.period)));

  const data = periods.map((period) => {
    const periodPoints = points.filter((p) => p.period === period);
    const score = companyHealthScore(periodPoints.map((p) => p.score));
    return {
      period,
      label: formatPeriod(period).split(" ")[0].slice(0, 3),
      score,
      band: scoreBand(score),
    };
  });

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <XAxis
          dataKey="label"
          stroke="#8B949E"
          fontSize={11}
          tickLine={false}
          axisLine={{ stroke: "#30363D" }}
        />
        <YAxis
          domain={[0, 100]}
          stroke="#8B949E"
          fontSize={11}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          cursor={{ fill: "#1C2128" }}
          contentStyle={{
            backgroundColor: "#161B22",
            border: "1px solid #30363D",
            borderRadius: "6px",
            fontSize: "12px",
          }}
          labelFormatter={(_, payload) =>
            payload?.[0]?.payload ? formatPeriod(payload[0].payload.period) : ""
          }
          formatter={(value) => [`${value}`, "Score"]}
        />
        <Bar dataKey="score" radius={[4, 4, 0, 0]}>
          {data.map((entry, index) => (
            <Cell key={index} fill={bandColor(entry.band)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
