"use client";

import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { CalendarDays, DollarSign, Package } from "lucide-react";
import * as React from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
} from "@/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const chartConfig = {
  revenue: {
    label: "Revenue",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

interface ChartDataPoint {
  time: string;
  revenue: number;
  orderCount: number;
  displayTime: string;
}

// Convex Order type (matching schema)
type Order = {
  _id: string;
  id: string;
  email: string;
  total_price: string;
  status?: string;
  product?: string;
  date?: string;
  _creationTime: number;
};

export default function RealTimeSalesChart() {
  // Fetch orders from Convex
  const orders = useQuery(api.orders.listOrders, {}) as Order[] | undefined;
  const [viewType, setViewType] = React.useState<"hourly" | "daily">("hourly");
  const [lastUpdate, setLastUpdate] = React.useState(new Date());

  // Process orders into chart data
  const chartData = React.useMemo(() => {
    if (!orders) return [];
    const now = new Date();
    const intervals = viewType === "hourly" ? 24 : 7;
    const intervalMs =
      viewType === "hourly" ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000;

    const data: ChartDataPoint[] = [];

    for (let i = intervals - 1; i >= 0; i--) {
      const timeStart = new Date(now.getTime() - i * intervalMs);
      const timeEnd = new Date(now.getTime() - (i - 1) * intervalMs);

      const periodOrders = orders.filter((order) => {
        // Use order.date if present, else _creationTime
        let orderDate: Date;
        if (order.date) {
          orderDate = new Date(order.date);
        } else {
          orderDate = new Date(order._creationTime);
        }
        return orderDate >= timeStart && orderDate < timeEnd;
      });

      const revenue = periodOrders.reduce(
        (sum, order) => sum + Number.parseFloat(order.total_price),
        0,
      );

      data.push({
        time: timeStart.toISOString(),
        revenue: Math.round(revenue * 100) / 100,
        orderCount: periodOrders.length,
        displayTime:
          viewType === "hourly"
            ? timeStart.toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
              })
            : timeStart.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              }),
      });
    }

    return data;
  }, [orders, viewType]);

  React.useEffect(() => {
    setLastUpdate(new Date());
  }, [orders]);

  const totalRevenue = chartData.reduce((sum, point) => sum + point.revenue, 0);
  const totalOrders = chartData.reduce(
    (sum, point) => sum + point.orderCount,
    0,
  );
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as ChartDataPoint;
      return (
        <div className="rounded-lg border bg-background p-3 shadow-md">
          <div className="flex items-center gap-2 mb-2">
            <CalendarDays className="h-4 w-4" />
            <span className="font-medium">{data.displayTime}</span>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              <span>Revenue: ${data.revenue.toFixed(2)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-blue-600" />
              <span>Orders: {data.orderCount}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2">
            Real-Time Sales Chart
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs text-muted-foreground">LIVE</span>
            </div>
          </CardTitle>
          <CardDescription>
            {viewType === "hourly" ? "Last 24 hours" : "Last 7 days"} • Last
            updated: {lastUpdate.toLocaleTimeString()}
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={viewType}
            onValueChange={(value: "hourly" | "daily") => setViewType(value)}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="hourly">Hourly</SelectItem>
              <SelectItem value="daily">Daily</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <div className="px-6 pb-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Total Revenue</p>
            <p className="text-2xl font-bold text-green-600">
              ${totalRevenue.toFixed(2)}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Total Orders</p>
            <p className="text-2xl font-bold text-blue-600">{totalOrders}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Avg Order Value</p>
            <p className="text-2xl font-bold text-purple-600">
              ${avgOrderValue.toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      <CardContent className="px-2 pt-0 sm:px-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[300px] w-full"
        >
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
          >
            <defs>
              <linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="displayTime"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tick={{ fill: "var(--text-color)" }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => `$${value}`}
              tick={{ fill: "var(--text-color)" }}
            />
            <ChartTooltip content={<CustomTooltip />} />
            <Area
              dataKey="revenue"
              type="monotone"
              fill="url(#fillRevenue)"
              stroke="#22c55e"
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
