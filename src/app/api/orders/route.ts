import { readOrders } from "@/lib/orders";

export const runtime = "nodejs";

export async function GET() {
  try {
    return Response.json(await readOrders());
  } catch {
    return Response.json(
      { error: "Unable to access order data." },
      { status: 500 },
    );
  }
}
