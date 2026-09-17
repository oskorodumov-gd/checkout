# Application Development Requirements

## 1. Purpose

Build a deliberately small full-stack e-commerce checkout application from an empty repository. The project is a training baseline for practicing incremental development with AI coding agents. It is not a production checkout system.

## 2. Scope

The baseline application must provide:

- A home page with a heading and a link to the checkout page.
- A checkout page that submits a cart to the checkout API.
- A read API that exposes a fixed product catalogue.
- A write API that validates a cart and returns its calculated total.
- A pricing extension point containing a no-op discount function.
- A short README explaining the request lifecycle.
- One placeholder unit test runnable in continuous integration.

Course-support artifacts such as `PLAN.md`, `AGENTS.md`, skills, review notes, and architecture documents are outside the application scope and do not count as application features.

## 3. Technology and Project Configuration

| ID | Requirement |
| --- | --- |
| TECH-01 | The application must use Next.js with the App Router. |
| TECH-02 | The application must use TypeScript with strict type checking enabled. |
| TECH-03 | Application source code must be located under `src/`. |
| TECH-04 | The package manager must be npm. |
| TECH-05 | `package.json` must define scripts named exactly `dev`, `build`, and `test:ci`. |
| TECH-06 | A clean environment must be able to start the application with `npm install && npm run dev`. |
| TECH-07 | The baseline must not add Tailwind CSS, a component library, or a CSS-in-JS package. |

## 4. Product Catalogue

The product catalogue must be hard-coded on the server and contain exactly these three products:

```json
[
  { "id": "prod-001", "name": "Enamel Mug", "price": 12.5 },
  { "id": "prod-002", "name": "Canvas Tote", "price": 18.0 },
  { "id": "prod-003", "name": "Wool Beanie", "price": 22.75 }
]
```

| ID | Requirement |
| --- | --- |
| CAT-01 | `GET /api/products` must return HTTP 200 and the catalogue shown above as JSON. |
| CAT-02 | The catalogue must remain server-side; checkout totals must not use a price supplied by the client. |
| CAT-03 | The catalogue shape and product count must remain stable throughout the baseline. |
| CAT-04 | The baseline must not persist the catalogue in a database or data file. |

## 5. Checkout API

### 5.1 Request contract

`POST /api/checkout` must accept a JSON body with this shape:

```json
{
  "userId": "guest",
  "items": [
    { "productId": "prod-001", "quantity": 1 }
  ]
}
```

`userId` is an unauthenticated, client-supplied string. If the checkout UI does not collect a user ID, it must submit the placeholder value `"guest"`.

### 5.2 Validation

| ID | Requirement |
| --- | --- |
| VAL-01 | The request body must be valid JSON. |
| VAL-02 | `userId` must be a non-empty string. A whitespace-only value must be treated as empty. |
| VAL-03 | `items` must be a non-empty array. |
| VAL-04 | Every item must contain a `productId` that matches a product returned by `GET /api/products`. |
| VAL-05 | Every item must contain a `quantity` that is a positive integer. Zero, negative, fractional, missing, or otherwise non-integer quantities must be rejected. |
| VAL-06 | Malformed JSON and every invalid request must return HTTP 400. |
| VAL-07 | Every HTTP 400 response must have the JSON shape `{ "error": "<human-readable message>" }`. |

Additional request fields may be ignored, but they must never alter pricing behavior.

### 5.3 Calculation and response

| ID | Requirement |
| --- | --- |
| CHK-01 | The server must resolve unit prices from the server-side catalogue. |
| CHK-02 | The server must calculate `subtotal` as the sum of `unitPrice × quantity` for all items. |
| CHK-03 | The server must calculate `total` as `subtotal - calculateDiscount(subtotal)`. |
| CHK-04 | A valid request must return HTTP 200 with JSON in the exact baseline shape `{ "total": number }`. |
| CHK-05 | The baseline must use floating-point dollar values, such as `4.99`. It must not introduce integer minor units, a decimal library, or new rounding rules. |

The training course may add an `id` field to the success response in a later task. It is not part of this baseline unless a later requirement explicitly supersedes CHK-04.

## 6. Protected Pricing Module

Create `src/lib/pricing.ts` with exactly the following content:

```ts
export function calculateDiscount(_subtotal: number): number {
  return 0;
}
```

| ID | Requirement |
| --- | --- |
| PRICE-01 | Initial creation of the exact stub above is authorized by approval of the implementation plan. |
| PRICE-02 | After initial creation, no content in `src/lib/pricing.ts` may be changed without explicit human approval obtained before the edit. |
| PRICE-03 | The discount function must remain a no-op for the entire course unless an explicit later requirement and human approval both authorize a change. |
| PRICE-04 | The checkout route must call `calculateDiscount(subtotal)` even though the baseline function returns `0`. |

Formatting, refactoring, import reordering, comment changes, and automated rewrites all count as changes under PRICE-02.

## 7. User Interface

| ID | Requirement |
| --- | --- |
| UI-01 | The home page must display a heading and a navigable link to the checkout page. |
| UI-02 | The checkout page must allow a user to submit a non-empty cart to `POST /api/checkout`. |
| UI-03 | The checkout page must display a successful total or a human-readable error returned by the API. |
| UI-04 | The interface must use a system font, one accent color, a centered max-width container, consistent spacing, and rounded cards or buttons. |
| UI-05 | Styling must use either plain inline styles or one global CSS file. |
| UI-06 | The implementation must remain intentionally small; elaborate state management or abstractions are not required. |

## 8. Documentation and Testing

| ID | Requirement |
| --- | --- |
| DOC-01 | `README.md` must describe the request lifecycle from the checkout page through validation, catalogue lookup, subtotal calculation, discount invocation, and response rendering. |
| DOC-02 | `README.md` must include installation and local development commands. |
| TEST-01 | The project must contain at least one placeholder unit test. |
| TEST-02 | `npm run test:ci` must execute the test suite once in a non-interactive mode and return a non-zero exit code on failure. |
| TEST-03 | `npm run build` must complete successfully. |

## 9. Persistence, Security, and External Dependencies

| ID | Requirement |
| --- | --- |
| ARCH-01 | Baseline state must be in memory only. |
| ARCH-02 | The baseline must not add a database, persistence data file, authentication, external service, or Docker configuration. |
| ARCH-03 | The application must not contain real customer data or secrets. |
| ARCH-04 | Client-supplied identity is informational only; the application must not imply that `userId` is authenticated. |

## 10. Required Initial Files

The implementation must include, at minimum:

- App Router root layout and home page under `src/app/`.
- A checkout page under `src/app/checkout/`.
- `GET /api/products` route under `src/app/api/products/`.
- `POST /api/checkout` route under `src/app/api/checkout/`.
- `src/lib/pricing.ts` containing only the approved stub.
- One global stylesheet or equivalent inline styles.
- `README.md`.
- Test configuration and one placeholder unit test.
- Standard npm and TypeScript project configuration.

The exact supporting filenames may follow current Next.js conventions, provided all functional and configuration requirements above are met.

## 11. Baseline Acceptance Criteria

The baseline is accepted only when all of the following are true:

1. From a clean checkout, `npm install`, `npm run test:ci`, and `npm run build` succeed.
2. `npm run dev` starts the Next.js application.
3. The home page renders a heading and links to checkout.
4. `GET /api/products` returns exactly the three specified products.
5. A valid checkout request returns HTTP 200 with the correct server-calculated total.
6. The checkout calculation invokes the no-op discount extension point.
7. Malformed JSON returns HTTP 400 with a human-readable JSON error.
8. Empty items, an empty user ID, unknown product IDs, and missing, zero, negative, or fractional quantities each return HTTP 400.
9. A client-supplied price cannot affect the calculated total.
10. The UI can submit a cart and show either the returned total or an API error.
11. `src/lib/pricing.ts` matches the approved stub exactly and contains no additional code.
12. No authentication, external service, Docker configuration, database, or persistence data file has been added.

## 12. Change Control

- Later requirements supersede this baseline only when they explicitly state the change.
- Requirements not explicitly superseded remain in force.
- Any proposed change to `src/lib/pricing.ts` must pause before editing and obtain explicit human approval.
- The training-specific floating-point representation must remain unchanged unless a later requirement explicitly replaces it.
