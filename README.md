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

The checkout route parses and validates the request, rejects duplicate or unknown product IDs, and resolves every unit price from the server-side catalogue. It calculates the subtotal by summing each catalogue price multiplied by its requested quantity. The route then calls `calculateDiscount(subtotal)` and subtracts the returned discount from the subtotal. The baseline discount is zero.

For a valid request, the route returns a JSON object containing only the numeric total and the checkout page renders it. Invalid requests return HTTP 400 with a human-readable JSON error, which the page displays.

