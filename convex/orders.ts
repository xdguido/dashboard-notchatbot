import { mutation, query } from "./_generated/server";

import { v } from "convex/values";

// List all orders
export const listOrders = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("orders").collect();
  },
});

// Save a new order
export const saveOrder = mutation({
  args: {
    id: v.string(),
    email: v.string(),
    total_price: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("orders", args);
  },
});

// Edit an existing order by Convex _id
export const editOrder = mutation({
  args: {
    _id: v.id("orders"),
    id: v.string(),
    email: v.string(),
    total_price: v.string(),
  },
  handler: async (ctx, args) => {
    const { _id, ...rest } = args;
    return await ctx.db.patch(_id, rest);
  },
});

// Delete an order by Convex _id
export const deleteOrder = mutation({
  args: {
    _id: v.id("orders"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.delete(args._id);
  },
});
