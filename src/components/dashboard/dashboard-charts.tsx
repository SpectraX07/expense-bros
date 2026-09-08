"use client";

import { format } from "date-fns";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatMoney } from "@/lib/money";
import type { DashboardStats } from "@/lib/dashboard";

const PAYER_COLORS = [
  "var(--chart-1)",
  "var(--chart-3)",
  "var(--chart-2)",
  "var(--chart-5)",
  "var(--chart-4)",
  "#7c3aed",
  "#db2777",
  "#0891b2",
];

type TooltipEntry = {
  name?: string;
  value?: number | string;
};

function MoneyTooltip({
  active,
  payload,
  label,
  currency,
}: {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string;
  currency: string;
}) {
  if (!active || !payload?.length) {
    return null;
  }

  const entry = payload[0];
  const title = entry.name || label || "Amount";

  return (
    <div className="rounded-lg border border-border bg-popover px-2.5 py-1.5 text-xs shadow-sm">
      <p className="text-muted-foreground">{title}</p>
      <p className="font-medium tabular-nums">
        {formatMoney(Number(entry.value ?? 0), currency)}
      </p>
    </div>
  );
}

function ChartEmpty({ message }: { message: string }) {
  return (
    <div className="flex h-72 items-center justify-center px-4 text-center text-sm text-muted-foreground">
      {message}
    </div>
  );
}

export function DashboardCharts({
  stats,
  currency,
}: {
  stats: DashboardStats;
  currency: string;
}) {
  const trend = stats.trend.map((row) => ({
    ...row,
    label: format(new Date(row.year, row.month - 1, 1), "MMM"),
  }));
  const payers = stats.byPayer.map((row, index) => ({
    ...row,
    color: PAYER_COLORS[index % PAYER_COLORS.length],
  }));

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>By category</CardTitle>
          <CardDescription>Spend grouped by category this month.</CardDescription>
        </CardHeader>
        <CardContent>
          {stats.byCategory.length === 0 ? (
            <ChartEmpty message="Add an expense to see the category split." />
          ) : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.byCategory}
                    dataKey="amount"
                    nameKey="name"
                    innerRadius={52}
                    outerRadius={80}
                    paddingAngle={2}
                  >
                    {stats.byCategory.map((entry) => (
                      <Cell key={`${entry.id ?? "none"}-${entry.name}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<MoneyTooltip currency={currency} />} />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    formatter={(value) => <span className="text-xs text-foreground">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Who paid</CardTitle>
          <CardDescription>Total amount each roommate covered.</CardDescription>
        </CardHeader>
        <CardContent>
          {payers.length === 0 ? (
            <ChartEmpty message="Nobody has paid anything this month yet." />
          ) : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={payers}
                  layout="vertical"
                  margin={{ left: 8, right: 12, top: 8, bottom: 8 }}
                >
                  <CartesianGrid horizontal={false} strokeDasharray="3 3" className="stroke-border" />
                  <XAxis type="number" hide />
                  <YAxis
                    type="category"
                    dataKey="fullName"
                    width={88}
                    tick={{ fontSize: 12 }}
                    className="fill-muted-foreground"
                  />
                  <Tooltip content={<MoneyTooltip currency={currency} />} />
                  <Bar dataKey="amount" name="Paid" radius={[0, 6, 6, 0]} maxBarSize={22}>
                    {payers.map((entry) => (
                      <Cell key={entry.userId} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Spend trend</CardTitle>
          <CardDescription>Last six months, including this one.</CardDescription>
        </CardHeader>
        <CardContent>
          {trend.every((row) => row.amount === 0) ? (
            <ChartEmpty message="Trend shows up after a few months of expenses." />
          ) : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trend} margin={{ left: 4, right: 8, top: 8, bottom: 0 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                  <YAxis
                    width={56}
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value: number) =>
                      new Intl.NumberFormat(undefined, {
                        notation: "compact",
                        maximumFractionDigits: 1,
                      }).format(value)
                    }
                  />
                  <Tooltip content={<MoneyTooltip currency={currency} />} />
                  <Bar dataKey="amount" name="Spent" fill="var(--chart-1)" radius={[6, 6, 0, 0]} maxBarSize={42} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
