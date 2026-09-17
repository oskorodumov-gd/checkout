import { randomUUID } from "node:crypto";

import { catalogue } from "@/lib/catalogue";
import { appendOrder, type Order } from "@/lib/orders";
import { calculateDiscount } from "@/lib/pricing";

export const runtime = "nodejs";

type CheckoutItem = {
  productId: string;
  quantity: number;
};

function errorResponse(message: string) {
  return Response.json({ error: message }, { status: 400 });
}

function persistenceErrorResponse() {
  return Response.json(
    { error: "Unable to access order data." },
    { status: 500 },
  );
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return errorResponse("Request body must be valid JSON.");
  }

  if (!isObject(body)) {
    return errorResponse("Request body must be a JSON object.");
  }

  if (typeof body.userId !== "string" || body.userId.trim() === "") {
    return errorResponse("User ID must be a non-empty string.");
  }

  if (!Array.isArray(body.items) || body.items.length === 0) {
    return errorResponse("Items must be a non-empty array.");
  }

  const productsById = new Map(catalogue.map((product) => [product.id, product]));
  const seenProductIds = new Set<string>();
  const items: CheckoutItem[] = [];

  for (const item of body.items) {
    if (!isObject(item)) {
      return errorResponse("Every item must be an object.");
    }

    if (typeof item.productId !== "string" || !productsById.has(item.productId)) {
      return errorResponse("Every item must reference a known product.");
    }

    if (seenProductIds.has(item.productId)) {
      return errorResponse("Duplicate product IDs are not allowed.");
    }

    if (
      typeof item.quantity !== "number" ||
      !Number.isInteger(item.quantity) ||
      item.quantity <= 0
    ) {
      return errorResponse("Every quantity must be a positive integer.");
    }

    seenProductIds.add(item.productId);
    items.push({ productId: item.productId, quantity: item.quantity });
  }

  const orderItems = items.map((item) => {
    const product = productsById.get(item.productId)!;
    return {
      productId: item.productId,
      name: product.name,
      quantity: item.quantity,
      unitPrice: product.price,
    };
  });
  const subtotal = orderItems.reduce((sum, item) => {
    return sum + item.unitPrice * item.quantity;
  }, 0);
  const discount = calculateDiscount(subtotal);
  const total = subtotal - discount;
  const order: Order = {
    id: randomUUID(),
    userId: body.userId,
    items: orderItems,
    subtotal,
    discount,
    total,
    status: "completed",
    createdAt: new Date().toISOString(),
  };

  try {
    await appendOrder(order);
  } catch {
    return persistenceErrorResponse();
  }

  return Response.json({ id: order.id, total: order.total });
}
