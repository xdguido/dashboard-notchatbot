import { NextRequest, NextResponse } from "next/server";
import { fetchMutation, fetchQuery } from "convex/nextjs";

import { api } from "@/convex/_generated/api";
import crypto from "crypto";

const SHOPIFY_SECRET = process.env.SHOPIFY_WEBHOOK_SECRET || "";

function verifyShopifySignature(req: NextRequest, rawBody: Buffer): boolean {
  const hmacHeader = req.headers.get("x-shopify-hmac-sha256");
  if (!hmacHeader) return false;
  const digest = crypto
    .createHmac("sha256", SHOPIFY_SECRET)
    .update(rawBody)
    .digest("base64");
  return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(hmacHeader));
}

async function getRawBody(req: NextRequest): Promise<Buffer> {
  const arrayBuffer = await req.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

export async function POST(req: NextRequest) {
  const rawBody = await getRawBody(req);

  if (!verifyShopifySignature(req, rawBody)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const topic = req.headers.get("x-shopify-topic");
  let body: any = {};
  try {
    body = JSON.parse(rawBody.toString());
  } catch {
    // ignore parse error
  }

  switch (topic) {
    case "orders/create": {
      if (
        body &&
        body.id &&
        body.email &&
        body.total_price &&
        body.line_items &&
        body.created_at
      ) {
        // Concatenate product titles if multiple line items
        const product = Array.isArray(body.line_items)
          ? body.line_items.map((item: any) => item.title).join(", ")
          : "";
        await fetchMutation(api.orders.saveOrder, {
          id: String(body.id),
          email: String(body.email),
          total_price: String(body.total_price),
          product,
          date: String(body.created_at),
          status: "pending", // Set initial status for new orders
        });
      }
      break;
    }
    case "orders/edited": {
      if (
        body &&
        body.id &&
        body.email &&
        body.total_price &&
        body.line_items &&
        body.created_at
      ) {
        const orders = await fetchQuery(api.orders.listOrders, {});
        const order = orders.find((o: any) => o.id === String(body.id));
        if (order) {
          const product = Array.isArray(body.line_items)
            ? body.line_items.map((item: any) => item.title).join(", ")
            : "";
          await fetchMutation(api.orders.editOrder, {
            _id: order._id,
            id: String(body.id),
            email: String(body.email),
            total_price: String(body.total_price),
            product,
            date: String(body.created_at),
            status: order.status || "updated", // Keep existing status or set as updated
          });
        }
      }
      break;
    }
    case "orders/delete": {
      if (body && body.id) {
        const orders = await fetchQuery(api.orders.listOrders, {});
        const order = orders.find((o: any) => o.id === String(body.id));
        if (order) {
          await fetchMutation(api.orders.deleteOrder, { _id: order._id });
        }
      }
      break;
    }
    default:
      // unknown topic
      break;
  }

  return NextResponse.json({ ok: true });
}
