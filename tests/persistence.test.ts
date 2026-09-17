import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { POST } from "../src/app/api/checkout/route";
import { GET } from "../src/app/api/orders/route";
import type { Order } from "../src/lib/orders";

const safePersistenceError = { error: "Unable to access order data." };

function checkoutRequest(
  userId: string,
  items: Array<Record<string, unknown>>,
) {
  return new Request("http://localhost/api/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, items }),
  });
}

describe("order persistence", () => {
  let temporaryRoot: string;
  let ordersFilePath: string;

  beforeEach(async () => {
    temporaryRoot = await mkdtemp(join(tmpdir(), "checkout-orders-"));
    ordersFilePath = join(temporaryRoot, "data", "orders.json");
    vi.spyOn(process, "cwd").mockReturnValue(temporaryRoot);
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await rm(temporaryRoot, { recursive: true, force: true });
  });

  it("persists every required order field using catalogue data", async () => {
    await expect(readFile(ordersFilePath, "utf8")).rejects.toMatchObject({
      code: "ENOENT",
    });

    const response = await POST(
      checkoutRequest("synthetic-user", [
        { productId: "prod-001", quantity: 2, price: 0 },
        { productId: "prod-003", quantity: 1 },
      ]),
    );
    const result = (await response.json()) as { id: string; total: number };
    const persisted = JSON.parse(await readFile(ordersFilePath, "utf8")) as Order[];

    expect(response.status).toBe(200);
    expect(Object.keys(result).sort()).toEqual(["id", "total"]);
    expect(result.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
    expect(result.total).toBe(47.75);
    expect(persisted).toHaveLength(1);

    const order = persisted[0];
    expect(Object.keys(order).sort()).toEqual(
      [
        "id",
        "userId",
        "items",
        "subtotal",
        "discount",
        "total",
        "status",
        "createdAt",
      ].sort(),
    );
    expect(order).toMatchObject({
      id: result.id,
      userId: "synthetic-user",
      subtotal: 47.75,
      discount: 0,
      total: 47.75,
      status: "completed",
    });
    expect(order.items).toEqual([
      {
        productId: "prod-001",
        name: "Enamel Mug",
        quantity: 2,
        unitPrice: 12.5,
      },
      {
        productId: "prod-003",
        name: "Wool Beanie",
        quantity: 1,
        unitPrice: 22.75,
      },
    ]);
    expect(Object.keys(order.items[0]).sort()).toEqual(
      ["productId", "name", "quantity", "unitPrice"].sort(),
    );
    expect(new Date(order.createdAt).toISOString()).toBe(order.createdAt);
  });

  it("appends successful checkouts and returns all orders", async () => {
    const firstResponse = await POST(
      checkoutRequest("synthetic-one", [
        { productId: "prod-001", quantity: 1 },
      ]),
    );
    const secondResponse = await POST(
      checkoutRequest("synthetic-two", [
        { productId: "prod-002", quantity: 2 },
      ]),
    );

    expect(firstResponse.status).toBe(200);
    expect(secondResponse.status).toBe(200);

    const response = await GET();
    const orders = (await response.json()) as Order[];

    expect(response.status).toBe(200);
    expect(orders).toHaveLength(2);
    expect(orders.map((order) => order.userId)).toEqual([
      "synthetic-one",
      "synthetic-two",
    ]);
    expect(orders.map((order) => order.total)).toEqual([12.5, 36]);
  });

  it("initializes a missing orders file with an empty array", async () => {
    const response = await GET();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([]);
    expect(JSON.parse(await readFile(ordersFilePath, "utf8"))).toEqual([]);
  });

  it("returns safe errors for malformed JSON without changing the file", async () => {
    await mkdir(dirname(ordersFilePath), { recursive: true });
    await writeFile(ordersFilePath, "{ malformed", "utf8");
    const originalContents = await readFile(ordersFilePath, "utf8");

    const getResponse = await GET();
    expect(getResponse.status).toBe(500);
    expect(await getResponse.json()).toEqual(safePersistenceError);
    expect(await readFile(ordersFilePath, "utf8")).toBe(originalContents);

    const postResponse = await POST(
      checkoutRequest("synthetic-user", [
        { productId: "prod-001", quantity: 1 },
      ]),
    );
    expect(postResponse.status).toBe(500);
    expect(await postResponse.json()).toEqual(safePersistenceError);
    expect(await readFile(ordersFilePath, "utf8")).toBe(originalContents);
  });

  it("rejects a non-array JSON file without changing it", async () => {
    await mkdir(dirname(ordersFilePath), { recursive: true });
    await writeFile(ordersFilePath, '{"orders":[]}', "utf8");
    const originalContents = await readFile(ordersFilePath, "utf8");

    const response = await GET();

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual(safePersistenceError);
    expect(await readFile(ordersFilePath, "utf8")).toBe(originalContents);
  });
});
