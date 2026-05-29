# VoiceKhata — API Contracts

**Version:** 1.0.0  
**Status:** FROZEN — do not rename fields, routes, or envelope keys  
**Stack:** Node.js · Express · MongoDB · Mongoose  
**Base URL:** `/api`

---

## Table of Contents

1. [Backend Standards](#1-backend-standards)
2. [Schema Documentation](#2-schema-documentation)
3. [API Contracts](#3-api-contracts)
4. [Validation Rules](#4-validation-rules)
5. [Query & Filter Rules](#5-query--filter-rules)
6. [Pagination Standards](#6-pagination-standards)
7. [Sorting Standards](#7-sorting-standards)
8. [Error Standards](#8-error-standards)

---

## 1. Backend Standards

### 1.1 Response Envelope — FROZEN

Every response from every endpoint must use one of the following three shapes. No exceptions.

**Success — single object**
```json
{
  "success": true,
  "data": {}
}
```

**Success — list**
```json
{
  "success": true,
  "data": {
    "items": [],
    "pagination": {
      "total": 0,
      "page": 1,
      "limit": 20,
      "totalPages": 1
    }
  }
}
```

**Error**
```json
{
  "success": false,
  "message": "Human-readable error description"
}
```

### 1.2 Global Field Rules — FROZEN

| Rule | Detail |
|---|---|
| **Money** | Always integer paise. `50000` = ₹500.00. Never floats. Never strings. |
| **Dates** | Always ISO 8601 UTC. `"2025-06-10T00:00:00.000Z"` |
| **IDs** | Always MongoDB ObjectId serialised as a string |
| **Casing** | camelCase everywhere — fields, query params, route segments |
| **Soft delete** | `isActive: false` — never hard delete documents |
| **Timestamps** | `createdAt` and `updatedAt` on every document via `{ timestamps: true }` |
| **Sorting default** | Newest first (`-createdAt`) on all list endpoints |
| **Populated refs** | `customerId` in entry responses is always populated `{ _id, name, phone }` |
| **Pagination** | Always present in list responses, even when results are fewer than `limit` |

---

## 2. Schema Documentation

### 2.1 User

**Collection:** `users`

| Field | Type | Required | Default | Notes |
|---|---|---|---|---|
| `_id` | ObjectId | auto | — | MongoDB primary key |
| `name` | String | yes | — | trimmed |
| `phone` | String | yes | — | unique · trimmed · regex `/^\+?[0-9]{10,15}$/` |
| `shopName` | String | no | `null` | trimmed |
| `language` | String | no | `"hi"` | enum: `en hi mr gu ta te bn pa` |
| `isActive` | Boolean | no | `true` | soft delete flag |
| `createdAt` | Date | auto | — | set by Mongoose timestamps |
| `updatedAt` | Date | auto | — | set by Mongoose timestamps |

**Indexes**

```
{ phone: 1 }  →  unique
```

---

### 2.2 Customer

**Collection:** `customers`

| Field | Type | Required | Default | Notes |
|---|---|---|---|---|
| `_id` | ObjectId | auto | — | MongoDB primary key |
| `userId` | ObjectId ref User | yes | — | owning merchant |
| `name` | String | yes | — | trimmed |
| `phone` | String | no | `null` | trimmed · regex `/^\+?[0-9]{10,15}$/` |
| `totalOwed` | Number | no | `0` | integer paise · min 0 |
| `riskScore` | Number | no | `0` | integer 0–100 |
| `isActive` | Boolean | no | `true` | soft delete flag |
| `createdAt` | Date | auto | — | |
| `updatedAt` | Date | auto | — | |

**Indexes**

```
{ userId: 1 }
{ userId: 1, phone: 1 }  →  unique · sparse  (allows null phone, no duplicate phone per merchant)
```

---

### 2.3 Entry

**Collection:** `entries`

| Field | Type | Required | Default | Notes |
|---|---|---|---|---|
| `_id` | ObjectId | auto | — | MongoDB primary key |
| `customerId` | ObjectId ref Customer | yes | — | |
| `userId` | ObjectId ref User | yes | — | |
| `amount` | Number | yes | — | integer paise · min 1 |
| `type` | String | yes | — | enum: `credit \| payment` |
| `status` | String | no | `"pending"` | enum: `pending \| paid \| overdue \| disputed` |
| `dueDate` | Date | no | `null` | ISO 8601 UTC |
| `note` | String | no | `null` | trimmed · max 500 chars |
| `voiceTranscript` | String | no | `null` | raw speech for audit trail |
| `proofUrl` | String | no | `null` | URL to uploaded receipt/image |
| `createdAt` | Date | auto | — | |
| `updatedAt` | Date | auto | — | |

**Enums**

```
type   →  credit | payment
status →  pending | paid | overdue | disputed
```

**Indexes**

```
{ customerId: 1, createdAt: -1 }
{ userId: 1 }
{ type: 1 }
{ status: 1 }
```

---

## 3. API Contracts

### 3.1 POST /api/customers

**Purpose:** Create a new customer under a merchant account.

#### Request Body

| Field | Type | Required | Validation |
|---|---|---|---|
| `userId` | string (ObjectId) | yes | valid Mongo ID |
| `name` | string | yes | non-empty · trimmed |
| `phone` | string | no | `/^\+?[0-9]{10,15}$/` |

#### Example Request

```http
POST /api/customers
Content-Type: application/json

{
  "userId": "664f1a2b3c4d5e6f7a8b9c0d",
  "name": "Rahul Verma",
  "phone": "9876543210"
}
```

#### Success Response — 201

```json
{
  "success": true,
  "data": {
    "_id": "664f1b3c4d5e6f7a8b9c0e1f",
    "userId": "664f1a2b3c4d5e6f7a8b9c0d",
    "name": "Rahul Verma",
    "phone": "9876543210",
    "totalOwed": 0,
    "riskScore": 0,
    "isActive": true,
    "createdAt": "2025-05-27T10:30:00.000Z",
    "updatedAt": "2025-05-27T10:30:00.000Z"
  }
}
```

#### Error Responses

| Status | Message | Cause |
|---|---|---|
| 400 | `"userId and name are required"` | missing required field |
| 400 | `"Enter a valid phone number"` | phone regex fail |
| 409 | `"Customer with this phone already exists"` | duplicate phone for this userId |
| 500 | `"Internal server error"` | unhandled exception |

---

### 3.2 GET /api/customers

**Purpose:** List all active customers for a merchant, sorted alphabetically by name.

#### Query Params

| Param | Type | Required | Default | Notes |
|---|---|---|---|---|
| `userId` | string (ObjectId) | yes | — | filters by merchant |

#### Example Request

```http
GET /api/customers?userId=664f1a2b3c4d5e6f7a8b9c0d
```

#### Success Response — 200

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "_id": "664f1b3c4d5e6f7a8b9c0e1f",
        "userId": "664f1a2b3c4d5e6f7a8b9c0d",
        "name": "Rahul Verma",
        "phone": "9876543210",
        "totalOwed": 50000,
        "riskScore": 20,
        "isActive": true,
        "createdAt": "2025-05-27T10:30:00.000Z",
        "updatedAt": "2025-05-27T11:00:00.000Z"
      }
    ],
    "pagination": {
      "total": 1,
      "page": 1,
      "limit": 20,
      "totalPages": 1
    }
  }
}
```

#### Error Responses

| Status | Message | Cause |
|---|---|---|
| 400 | `"userId query param is required"` | userId missing |
| 500 | `"Internal server error"` | unhandled exception |

---

### 3.3 POST /api/entries

**Purpose:** Create a new ledger entry (credit or payment). Atomically updates the customer's `totalOwed` balance.

#### Request Body

| Field | Type | Required | Validation |
|---|---|---|---|
| `customerId` | string (ObjectId) | yes | must exist in DB |
| `userId` | string (ObjectId) | yes | valid Mongo ID |
| `amount` | number | yes | integer · min 1 paise |
| `type` | string | yes | `credit \| payment` |
| `status` | string | no | `pending \| paid \| overdue \| disputed` — default `pending` |
| `dueDate` | string | no | ISO 8601 UTC |
| `note` | string | no | max 500 chars |
| `voiceTranscript` | string | no | raw speech text |
| `proofUrl` | string | no | URL string |

#### Example Request

```http
POST /api/entries
Content-Type: application/json

{
  "customerId": "664f1b3c4d5e6f7a8b9c0e1f",
  "userId": "664f1a2b3c4d5e6f7a8b9c0d",
  "amount": 50000,
  "type": "credit",
  "status": "pending",
  "dueDate": "2025-06-10T00:00:00.000Z",
  "note": "Grocery supplies – May batch",
  "voiceTranscript": "Rahul owes me five hundred rupees"
}
```

#### Success Response — 201

```json
{
  "success": true,
  "data": {
    "_id": "664f1c4d5e6f7a8b9c0f1e2a",
    "customerId": "664f1b3c4d5e6f7a8b9c0e1f",
    "userId": "664f1a2b3c4d5e6f7a8b9c0d",
    "amount": 50000,
    "type": "credit",
    "status": "pending",
    "dueDate": "2025-06-10T00:00:00.000Z",
    "note": "Grocery supplies – May batch",
    "voiceTranscript": "Rahul owes me five hundred rupees",
    "proofUrl": null,
    "createdAt": "2025-05-27T11:15:00.000Z",
    "updatedAt": "2025-05-27T11:15:00.000Z"
  }
}
```

#### Error Responses

| Status | Message | Cause |
|---|---|---|
| 400 | `"customerId, userId, amount and type are required"` | missing required field |
| 400 | `"type must be credit or payment"` | invalid enum |
| 400 | `"Amount must be at least 1 paise"` | amount < 1 |
| 400 | `"Note cannot exceed 500 characters"` | note too long |
| 404 | `"Customer not found"` | customerId not in DB |
| 500 | `"Internal server error"` | unhandled exception |

---

### 3.4 GET /api/entries

**Purpose:** List ledger entries with optional filtering, pagination, and sorting. `customerId` is always populated.

#### Query Params

| Param | Type | Required | Default | Notes |
|---|---|---|---|---|
| `userId` | string (ObjectId) | no | — | filter by merchant |
| `customerId` | string (ObjectId) | no | — | filter by customer |
| `type` | string | no | — | `credit \| payment` |
| `status` | string | no | — | `pending \| paid \| overdue \| disputed` |
| `page` | number | no | `1` | min 1 |
| `limit` | number | no | `20` | min 1 · max 100 |
| `sort` | string | no | `-createdAt` | prefix `-` for descending |

#### Allowed Sort Values

```
createdAt  -createdAt   (default)
amount     -amount
dueDate    -dueDate
```

#### Example Request

```http
GET /api/entries?userId=664f1a2b3c4d5e6f7a8b9c0d&type=credit&status=pending&page=1&limit=20&sort=-createdAt
```

#### Success Response — 200

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "_id": "664f1c4d5e6f7a8b9c0f1e2a",
        "customerId": {
          "_id": "664f1b3c4d5e6f7a8b9c0e1f",
          "name": "Rahul Verma",
          "phone": "9876543210"
        },
        "userId": "664f1a2b3c4d5e6f7a8b9c0d",
        "amount": 50000,
        "type": "credit",
        "status": "pending",
        "dueDate": "2025-06-10T00:00:00.000Z",
        "note": "Grocery supplies – May batch",
        "voiceTranscript": "Rahul owes me five hundred rupees",
        "proofUrl": null,
        "createdAt": "2025-05-27T11:15:00.000Z",
        "updatedAt": "2025-05-27T11:15:00.000Z"
      }
    ],
    "pagination": {
      "total": 84,
      "page": 1,
      "limit": 20,
      "totalPages": 5
    }
  }
}
```

#### Error Responses

| Status | Message | Cause |
|---|---|---|
| 400 | `"Invalid sort field"` | sort value not in allowlist |
| 400 | `"Invalid type filter"` | type not in enum |
| 400 | `"Invalid status filter"` | status not in enum |
| 500 | `"Internal server error"` | unhandled exception |

---

### 3.5 POST /api/voice/parse

**Purpose:** Parse a natural-language (Hindi/English/mixed) voice transcript into a structured transaction intent. Uses regex and rule-based parsing only — no live AI dependency.

#### Request Body

| Field | Type | Required | Validation |
|---|---|---|---|
| `text` | string | yes | non-empty · max 500 chars |

#### Example Request

```http
POST /api/voice/parse
Content-Type: application/json

{
  "text": "Shubham ne 500 liye kal dega"
}
```

#### Success Response — 200

```json
{
  "success": true,
  "data": {
    "customerName": "Shubham",
    "amount": 50000,
    "type": "credit",
    "dueDate": "2025-05-28T00:00:00.000Z",
    "note": "Shubham borrowed ₹500, will pay tomorrow",
    "confidence": 0.82,
    "rawText": "Shubham ne 500 liye kal dega"
  }
}
```

#### Output Field Reference

| Field | Type | Always present | Notes |
|---|---|---|---|
| `customerName` | string \| null | yes | extracted name or null if not found |
| `amount` | number \| null | yes | integer paise or null if not parseable |
| `type` | string \| null | yes | `credit \| payment \| null` |
| `dueDate` | string \| null | yes | ISO 8601 UTC or null |
| `note` | string | yes | clean human-readable summary |
| `confidence` | number | yes | float 0.0–1.0 |
| `rawText` | string | yes | original input unchanged |

#### Confidence Scoring Reference

| Score range | Meaning |
|---|---|
| 0.85 – 1.0 | All fields extracted cleanly |
| 0.60 – 0.84 | Most fields found, minor ambiguity |
| 0.40 – 0.59 | Partial extraction, review recommended |
| 0.00 – 0.39 | Low confidence, manual entry advised |

#### Low-confidence Response — 200

```json
{
  "success": true,
  "data": {
    "customerName": null,
    "amount": null,
    "type": null,
    "dueDate": null,
    "note": "Could not parse transaction from input",
    "confidence": 0.1,
    "rawText": "aaj kuch hua tha"
  }
}
```

#### Error Responses

| Status | Message | Cause |
|---|---|---|
| 400 | `"text is required"` | missing body field |
| 400 | `"text cannot exceed 500 characters"` | input too long |
| 500 | `"Internal server error"` | unhandled exception |

---

## 4. Validation Rules

### 4.1 Money

```
- type:    integer (number with no decimal)
- unit:    paise
- min:     1  (entries)
- min:     0  (customer totalOwed)
- never:   float, string, null for required money fields
- display: divide by 100 on the frontend only
```

### 4.2 Phone

```
regex:   /^\+?[0-9]{10,15}$/
trim:    always
unique:  per userId (customer) / globally (user)
```

### 4.3 Enums

```
Entry.type    →  credit | payment
Entry.status  →  pending | paid | overdue | disputed
User.language →  en | hi | mr | gu | ta | te | bn | pa
```

### 4.4 String Lengths

```
User.name        →  1–100 chars
Customer.name    →  1–100 chars
Entry.note       →  max 500 chars
Voice.text input →  max 500 chars
```

### 4.5 Dates

```
format:    ISO 8601 UTC  ("2025-06-10T00:00:00.000Z")
never:     epoch timestamps, local time strings, Date objects in responses
```

---

## 5. Query & Filter Rules

### 5.1 Supported Filters per Endpoint

| Param | Endpoint | Type | Notes |
|---|---|---|---|
| `userId` | GET /customers, GET /entries | ObjectId string | required for /customers |
| `customerId` | GET /entries | ObjectId string | optional |
| `type` | GET /entries | enum string | `credit \| payment` |
| `status` | GET /entries | enum string | `pending \| paid \| overdue \| disputed` |
| `page` | all list endpoints | integer | default 1 · min 1 |
| `limit` | all list endpoints | integer | default 20 · min 1 · max 100 |
| `sort` | GET /entries | string | see sorting standards |

### 5.2 Soft Delete

All list queries automatically append `{ isActive: true }` — deleted records are never returned without an explicit admin override.

---

## 6. Pagination Standards

```json
"pagination": {
  "total": 84,
  "page": 1,
  "limit": 20,
  "totalPages": 5
}
```

- `total` — total documents matching the filter (not the page)
- `page` — current page, 1-indexed
- `limit` — documents per page
- `totalPages` — `Math.ceil(total / limit)`
- Always present in list responses, even when `total === 0`
- Empty result example:

```json
"pagination": {
  "total": 0,
  "page": 1,
  "limit": 20,
  "totalPages": 0
}
```

---

## 7. Sorting Standards

### 7.1 Default Sort

All list endpoints default to newest first:

```
sort: -createdAt
```

### 7.2 Allowed Sort Fields for GET /api/entries

| Value | Direction |
|---|---|
| `createdAt` | ascending |
| `-createdAt` | descending (default) |
| `amount` | ascending |
| `-amount` | descending |
| `dueDate` | ascending |
| `-dueDate` | descending |

### 7.3 Sort Validation

Requests with a `sort` value outside the allowlist receive:

```json
{
  "success": false,
  "message": "Invalid sort field"
}
```

---

## 8. Error Standards

### 8.1 HTTP Status Code Map

| Code | When to use |
|---|---|
| 200 | Successful GET or PATCH |
| 201 | Successful POST (resource created) |
| 400 | Validation failure, missing fields, invalid enum |
| 404 | Resource not found (customer, entry) |
| 409 | Unique constraint conflict (duplicate phone) |
| 500 | Unhandled server/DB exception |

### 8.2 Error Shape — FROZEN

```json
{
  "success": false,
  "message": "Human-readable description of what went wrong"
}
```

### 8.3 Error Message Style Rules

```
- Sentence case, no period at end
- No internal code names or stack traces exposed
- Specific enough for the frontend to show the right UI state
- English only in v1
```

### 8.4 Standard Error Messages — FROZEN

| Scenario | Message |
|---|---|
| Required field missing | `"<fieldName> is required"` |
| Multiple required fields missing | `"<f1>, <f2> and <f3> are required"` |
| Invalid enum value | `"<field> must be <val1> or <val2>"` |
| Phone regex fail | `"Enter a valid phone number"` |
| Amount below minimum | `"Amount must be at least 1 paise"` |
| Note too long | `"Note cannot exceed 500 characters"` |
| Resource not found | `"<Resource> not found"` |
| Duplicate unique field | `"<Resource> with this <field> already exists"` |
| Invalid sort field | `"Invalid sort field"` |
| Unhandled exception | `"Internal server error"` |

---

*Document frozen on 2025-05-27. Increment major version before making any breaking changes to field names, response shapes, or route paths.*
