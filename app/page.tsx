"use client";

import LiveOrderFeed from "@/components/live-orders";
import OrdersTable from "@/components/orders-table";
import RealTimeSalesChart from "@/components/sales-chart";
import { ShoppingBag } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen max-w-7xl mx-auto bg-background p-8">
      <h1 className="text-xl flex items-center font-semibold mb-8">
        Shopify Dashboard
        <ShoppingBag className="h-5 w-5 ml-2" />
      </h1>
      <div
        className="grid grid-cols-1 lg:grid-cols-3 gap-4 auto-rows-[minmax(200px,auto)]"
        style={{ gridTemplateRows: "repeat(2, minmax(200px, auto))" }}
      >
        {/* LiveOrderFeed: Tall on left */}
        <div className="lg:row-span-2">
          <LiveOrderFeed />
        </div>
        {/* RealTimeSalesChart: Top right */}
        <div className="lg:col-span-2">
          <RealTimeSalesChart />
        </div>
        {/* OrdersTable: Bottom right */}
        <div className="lg:col-span-2">
          <OrdersTable />
        </div>
      </div>
    </main>
  );
}
