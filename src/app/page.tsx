import Link from "next/link";

export default function HomePage() {
  return (
    <main className="container stack">
      <h1>Simple checkout</h1>
      <p>Choose products and submit a training checkout.</p>
      <Link href="/checkout">Go to checkout</Link>
    </main>
  );
}

