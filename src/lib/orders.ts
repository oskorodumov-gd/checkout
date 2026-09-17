import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, unlink, writeFile } from "node:fs/promises";
import { basename, dirname, join } from "node:path";

export type OrderItem = {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
};

export type Order = {
  id: string;
  userId: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  total: number;
  status: "completed";
  createdAt: string;
};

function getOrdersFilePath() {
  return join(process.cwd(), "data", "orders.json");
}

function hasErrorCode(error: unknown, code: string) {
  return (
    error instanceof Error &&
    "code" in error &&
    (error as NodeJS.ErrnoException).code === code
  );
}

async function ensureOrdersFile(filePath: string) {
  await mkdir(dirname(filePath), { recursive: true });

  try {
    await writeFile(filePath, "[]\n", { encoding: "utf8", flag: "wx" });
  } catch (error) {
    if (!hasErrorCode(error, "EEXIST")) {
      throw error;
    }
  }
}

async function readOrdersFile(filePath: string): Promise<Order[]> {
  await ensureOrdersFile(filePath);
  const contents = await readFile(filePath, "utf8");

  let parsed: unknown;
  try {
    parsed = JSON.parse(contents);
  } catch {
    throw new Error("Order data is not valid JSON.");
  }

  if (!Array.isArray(parsed)) {
    throw new Error("Order data must be a JSON array.");
  }

  return parsed as Order[];
}

async function replaceOrdersFile(filePath: string, orders: Order[]) {
  const temporaryPath = join(
    dirname(filePath),
    `.${basename(filePath)}.${process.pid}.${randomUUID()}.tmp`,
  );

  try {
    await writeFile(temporaryPath, `${JSON.stringify(orders, null, 2)}\n`, {
      encoding: "utf8",
      flag: "wx",
    });
    await rename(temporaryPath, filePath);
  } catch (error) {
    await unlink(temporaryPath).catch(() => undefined);
    throw error;
  }
}

export async function readOrders(): Promise<Order[]> {
  return readOrdersFile(getOrdersFilePath());
}

export async function appendOrder(order: Order): Promise<void> {
  const filePath = getOrdersFilePath();
  const orders = await readOrdersFile(filePath);
  orders.push(order);
  await replaceOrdersFile(filePath, orders);
}
