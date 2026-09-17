# Checkout baseline

A deliberately small checkout application built with Next.js, the App Router, and TypeScript.

## Local development

Install dependencies and start the development server:

```sh
npm install
npm run dev
```

Open `http://localhost:3000` in a browser.

Run the test suite once in CI mode:

```sh
npm run test:ci
```

Create a production build:

```sh
npm run build
```

## Request lifecycle

The checkout page requests the fixed product catalogue from `GET /api/products`. A user chooses product quantities, and the page sends the non-empty cart to `POST /api/checkout` with the unauthenticated placeholder user ID `guest`.

The checkout route parses and validates the request, rejects duplicate or unknown product IDs, and resolves every item name and unit price from the server-side catalogue. It calculates the subtotal by summing each catalogue price multiplied by its requested quantity. The route then calls `calculateDiscount(subtotal)` and subtracts the returned discount from the subtotal. The baseline discount is zero.

For a valid request, the route creates a completed order with a generated ID and timestamp, appends it to `data/orders.json`, and returns the order ID and numeric total. The checkout page renders the total. `GET /api/orders` returns the persisted order array. Invalid requests return HTTP 400 with a human-readable JSON error, which the page displays. Persistence failures return HTTP 500 with a safe error message.

## Persistence limitation

Order persistence uses a JSON-file read-modify-write cycle intended only for this single-process training application. Concurrent writes are not guaranteed to be safe and can lose updates; a production system would require storage with concurrency controls.
