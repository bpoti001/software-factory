# Foundry Executable Specification Blueprint (`foundry-reference-api`)

- **Spec Version**: `1.0.0`
- **Service Name**: `foundry-reference-api`
- **Default Port**: `4000`
- **Governing ADR**: `ADR-0001`, `ADR-0009`
- **Canonical Machine Spec**: [`specs/service.spec.json`](./service.spec.json)

---

## Bounded Context: `orders` (Entity: `Order`)

### Field Schema & Boundary Invariants
| Field | Type | Required | Constraints |
|---|---|---|---|
| `customerId` | `string` | `true` | - |
| `totalCents` | `number` | `true` | min: `1` |
| `status` | `string` | `true` | enum: `pending, paid, cancelled` |

### HTTP & Seam Contracts
| Method | Path | Deep Module Seam Action | Status Codes |
|---|---|---|---|
| `GET` | `/api/orders` | `listOrders` | `200` |
| `GET` | `/api/orders/:id` | `getOrderById` | `200, 404` |
| `POST` | `/api/orders` | `createOrder` | `201, 400, 413, 422` |

### Acceptance Scenarios (Executable SDD Specs)
- **SPEC-ORDERS-01**: *Given* a valid Order payload matching the orders field schema, *When* POST /api/orders is invoked, *Then* returns 201 Created with an immutable Order record and GET /api/orders/:id returns 200.
- **SPEC-ORDERS-02**: *Given* an empty or schema-violating Order payload, *When* POST /api/orders is invoked, *Then* rejects at the boundary with 422 Unprocessable Entity and structured validation errors.

---

## Bounded Context: `payments` (Entity: `Payment`)

### Field Schema & Boundary Invariants
| Field | Type | Required | Constraints |
|---|---|---|---|
| `amountCents` | `number` | `true` | min: `1` |
| `currency` | `string` | `true` | enum: `USD, EUR, GBP` |

### HTTP & Seam Contracts
| Method | Path | Deep Module Seam Action | Status Codes |
|---|---|---|---|
| `GET` | `/api/payments` | `listPayments` | `200` |
| `GET` | `/api/payments/:id` | `getPaymentById` | `200, 404` |
| `POST` | `/api/payments` | `createPayment` | `201, 400, 413, 422` |

### Acceptance Scenarios (Executable SDD Specs)
- **SPEC-PAYMENTS-01**: *Given* a valid Payment payload matching the payments field schema, *When* POST /api/payments is invoked, *Then* returns 201 Created with an immutable Payment record and GET /api/payments/:id returns 200.
- **SPEC-PAYMENTS-02**: *Given* an empty or schema-violating Payment payload, *When* POST /api/payments is invoked, *Then* rejects at the boundary with 422 Unprocessable Entity and structured validation errors.

---

## Bounded Context: `shipments` (Entity: `Shipment`)

### Field Schema & Boundary Invariants
| Field | Type | Required | Constraints |
|---|---|---|---|
| `name` | `string` | `true` | - |
| `status` | `string` | `false` | enum: `active, archived` |

### HTTP & Seam Contracts
| Method | Path | Deep Module Seam Action | Status Codes |
|---|---|---|---|
| `GET` | `/api/shipments` | `listShipments` | `200` |
| `GET` | `/api/shipments/:id` | `getShipmentById` | `200, 404` |
| `POST` | `/api/shipments` | `createShipment` | `201, 400, 413, 422` |

### Acceptance Scenarios (Executable SDD Specs)
- **SPEC-SHIPMENTS-01**: *Given* a valid Shipment payload matching the shipments field schema, *When* POST /api/shipments is invoked, *Then* returns 201 Created with an immutable Shipment record and GET /api/shipments/:id returns 200.
- **SPEC-SHIPMENTS-02**: *Given* an empty or schema-violating Shipment payload, *When* POST /api/shipments is invoked, *Then* rejects at the boundary with 422 Unprocessable Entity and structured validation errors.

