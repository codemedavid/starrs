# API Tests

This directory contains tests for the order management API endpoints.

## Setup

1. Install test dependencies:
```bash
npm install --save-dev jest @types/jest ts-jest @jest/globals
```

2. Create `jest.config.js`:
```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
};
```

## Running Tests

```bash
npm test
```

Or run a specific test file:
```bash
npx jest tests/api-orders.test.ts
```

## Environment Variables

Make sure to set these environment variables before running tests:

- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key
- `API_BASE_URL` - Base URL for the API (default: http://localhost:3000)

## Test Coverage

The tests cover:

- ✅ GET /api/orders - Fetch orders with filters
- ✅ POST /api/orders - Create new orders
- ✅ GET /api/orders/[id] - Fetch single order
- ✅ PATCH /api/orders/[id] - Update order status
- ✅ PATCH /api/orders/bulk - Bulk update orders
- ✅ GET /api/orders/stats - Get order statistics

## Manual Testing

You can also test the endpoints manually using curl or Postman:

```bash
# Get all orders
curl http://localhost:3000/api/orders

# Get orders with filters
curl "http://localhost:3000/api/orders?status=pending&service_type=delivery"

# Create an order
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "cartItems": [{"id": "test-1", "name": "Test", "quantity": 1, "totalPrice": 100}],
    "customerName": "Test Customer",
    "contactNumber": "+639123456789",
    "serviceType": "pickup",
    "paymentMethod": "gcash",
    "total": 100
  }'

# Get order stats
curl http://localhost:3000/api/orders/stats
```



