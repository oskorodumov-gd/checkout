"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

type Product = {
  id: string;
  name: string;
  price: number;
};

type ApiError = {
  error: string;
};

export default function CheckoutPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [quantities, setQuantities] = useState<Record<string, string>>({});
  const [total, setTotal] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    async function loadProducts() {
      try {
        const response = await fetch("/api/products", { signal: controller.signal });
        if (!response.ok) {
          throw new Error("Unable to load products.");
        }
        const catalogue = (await response.json()) as Product[];
        setProducts(catalogue);
      } catch (loadError) {
        if (!(loadError instanceof DOMException && loadError.name === "AbortError")) {
          setError("Unable to load products.");
        }
      } finally {
        setLoading(false);
      }
    }

    void loadProducts();
    return () => controller.abort();
  }, []);

  async function submitCart(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setTotal(null);

    const items = products.flatMap((product) => {
      const quantity = Number(quantities[product.id] ?? 0);
      return Number.isInteger(quantity) && quantity > 0
        ? [{ productId: product.id, quantity }]
        : [];
    });

    if (items.length === 0) {
      setError("Choose at least one product.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: "guest", items }),
      });
      const result = (await response.json()) as { total: number } | ApiError;

      if (!response.ok) {
        setError("error" in result ? result.error : "Checkout failed.");
        return;
      }

      if (!("total" in result) || typeof result.total !== "number") {
        setError("Checkout returned an invalid response.");
        return;
      }

      setTotal(result.total);
    } catch {
      setError("Unable to complete checkout.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="container stack">
      <div>
        <Link href="/">Back home</Link>
        <h1>Checkout</h1>
      </div>

      {loading ? <p className="status">Loading products…</p> : null}

      {!loading && products.length > 0 ? (
        <form className="stack" onSubmit={submitCart}>
          {products.map((product) => (
            <label className="card product" key={product.id}>
              <span>
                <strong>{product.name}</strong>
                <p>${product.price.toFixed(2)}</p>
              </span>
              <span>
                Quantity{" "}
                <input
                  className="quantity"
                  type="number"
                  min="0"
                  step="1"
                  value={quantities[product.id] ?? "0"}
                  onChange={(event) =>
                    setQuantities((current) => ({
                      ...current,
                      [product.id]: event.target.value,
                    }))
                  }
                />
              </span>
            </label>
          ))}
          <button className="button" type="submit" disabled={submitting}>
            {submitting ? "Submitting…" : "Submit checkout"}
          </button>
        </form>
      ) : null}

      {total !== null ? <p className="total">Total: ${total.toFixed(2)}</p> : null}
      {error ? <p className="error">{error}</p> : null}
    </main>
  );
}

