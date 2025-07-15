"use client";

import * as React from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Bell, Clock, DollarSign, User, Volume2, VolumeX } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { api } from "@/convex/_generated/api";
import { cn } from "@/lib/utils";
import { useQuery } from "convex/react";

const statusColors: Record<string, string> = {
  Paid: "bg-green-100 text-green-800 border-green-200",
  Fulfilled: "bg-blue-100 text-blue-800 border-blue-200",
  Refunded: "bg-red-100 text-red-800 border-red-200",
  Processing: "bg-yellow-100 text-yellow-800 border-yellow-200",
};

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

export default function LiveOrderFeed() {
  // Fetch orders from Convex
  const orders = useQuery(api.orders.listOrders, {}) as Order[] | undefined;
  const [soundEnabled, setSoundEnabled] = React.useState(true);
  const [lastOrderCount, setLastOrderCount] = React.useState(0);
  const [newOrderIds, setNewOrderIds] = React.useState<Set<string>>(new Set());

  // Sort orders by creation time (newest first)
  const sortedOrders = React.useMemo(() => {
    if (!orders) return [];
    return [...orders]
      .sort((a, b) => b._creationTime - a._creationTime)
      .slice(0, 20);
  }, [orders]);

  // Handle new orders
  React.useEffect(() => {
    if (!orders) return;
    if (orders.length > lastOrderCount && lastOrderCount > 0) {
      const newOrders = orders.slice(lastOrderCount);
      const newIds = new Set(newOrders.map((order) => order.id));
      setNewOrderIds(newIds);
      // Play sound for new orders
      if (soundEnabled && newOrders.length > 0) {
        const audio = new Audio("/placeholder.svg?height=1&width=1");
        audio.volume = 0.3;
        audio.play().catch(() => {});
      }
      setTimeout(() => {
        setNewOrderIds(new Set());
      }, 5000);
    }
    setLastOrderCount(orders ? orders.length : 0);
  }, [orders?.length, lastOrderCount, soundEnabled, orders]);

  // Format time from _creationTime or date
  const formatTime = (order: Order) => {
    let date: Date;
    if (order.date) {
      date = new Date(order.date);
    } else {
      date = new Date(order._creationTime);
    }
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Bell className="h-5 w-5" />
            Live Order Feed
          </CardTitle>
          <CardDescription>
            Real-time order updates • {orders ? orders.length : 0} total orders
          </CardDescription>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSoundEnabled(!soundEnabled)}
          className="h-8 w-8 p-0"
        >
          {soundEnabled ? (
            <Volume2 className="h-4 w-4" />
          ) : (
            <VolumeX className="h-4 w-4" />
          )}
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[500px] px-6">
          <div className="space-y-3">
            {sortedOrders.map((order) => (
              <div
                key={order._id}
                className={cn(
                  "p-3 rounded-lg border transition-all duration-300",
                  newOrderIds.has(order.id)
                    ? "border-green-500 shadow-md"
                    : "bg-card hover:bg-muted/50",
                )}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-medium">
                        #{order.id.slice(-8)}
                      </span>
                      {newOrderIds.has(order.id) && (
                        <Badge
                          variant="secondary"
                          className="text-xs animate-pulse"
                        >
                          NEW
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <User className="h-3 w-3" />
                      <span>{order.email}</span>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-xs",
                      statusColors[order.status ?? ""] || "",
                    )}
                  >
                    {order.status}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-lg font-semibold text-green-600">
                    <DollarSign className="h-4 w-4" />
                    {order.total_price}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {formatTime(order)}
                  </div>
                </div>

                {order.product && (
                  <div className="mt-2 text-sm text-muted-foreground">
                    {order.product}
                  </div>
                )}
              </div>
            ))}

            {sortedOrders.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No orders yet</p>
                <p className="text-sm">
                  New orders will appear here in real-time
                </p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
