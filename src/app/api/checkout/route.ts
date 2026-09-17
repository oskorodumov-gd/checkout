import { catalogue } from "@/lib/catalogue";
import { calculateDiscount } from "@/lib/pricing";

type CheckoutItem = {
  productId: string;
  quantity: number;
};

function errorResponse(message: string) {
  return Response.json({ error: message }, { status: 400 });
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

  const subtotal = items.reduce((sum, item) => {
    const product = productsById.get(item.productId)!;
    return sum + product.price * item.quantity;
  }, 0);
  const total = subtotal - calculateDiscount(subtotal);

  return Response.json({ total });
}

