# Order Management Migration to Server-Side

This document describes the migration of order management from client-side to server-side implementation.

## Changes Made

### 1. Server-Side Infrastructure

#### Created Files:
- `src/lib/supabase-server.ts` - Server-side Supabase client with service role key
  - Bypasses RLS for admin operations
  - Includes IP extraction utility

#### API Routes Created:
- `app/api/orders/route.ts` - Main orders endpoint
  - `GET /api/orders` - Fetch orders with filters
  - `POST /api/orders` - Create new orders
  
- `app/api/orders/[id]/route.ts` - Single order operations
  - `GET /api/orders/[id]` - Fetch single order
  - `PATCH /api/orders/[id]` - Update order (status, Lalamove fields)
  
- `app/api/orders/bulk/route.ts` - Bulk operations
  - `PATCH /api/orders/bulk` - Bulk update order statuses
  
- `app/api/orders/stats/route.ts` - Statistics
  - `GET /api/orders/stats` - Get order statistics

### 2. Client-Side Updates

#### Updated Files:
- `src/hooks/useOrders.ts` - Refactored to use API routes
  - All CRUD operations now go through API endpoints
  - Real-time subscriptions still work via Supabase client
  - Improved error handling

### 3. Performance Optimizations

#### Database Migrations:
- `supabase/migrations/20250902000006_optimize_order_queries.sql`
  - Added composite indexes for common query patterns
  - Optimized for status + date filtering
  - Full-text search index for customer search
  - Partial index for recent orders

### 4. Testing

#### Test Files:
- `tests/api-orders.test.ts` - Comprehensive API tests (Jest)
- `scripts/test-api.js` - Simple test runner (no dependencies)
- `tests/README.md` - Testing documentation

## Benefits

1. **Security**: Server-side operations use service role key, bypassing RLS for admin operations
2. **Performance**: Optimized queries with proper indexes
3. **Validation**: Centralized input validation in API routes
4. **Rate Limiting**: Server-side rate limiting enforcement
5. **Error Handling**: Consistent error responses
6. **Testing**: Comprehensive test coverage

## API Endpoints

### GET /api/orders
Fetch orders with optional filters.

**Query Parameters:**
- `status` - Filter by order status
- `service_type` - Filter by service type (dine-in, pickup, delivery)
- `date_from` - Filter orders from date (ISO string)
- `date_to` - Filter orders to date (ISO string)
- `search` - Search by order number, customer name, or contact

**Response:**
```json
{
  "orders": [...]
}
```

### POST /api/orders
Create a new order.

**Request Body:**
```json
{
  "cartItems": [...],
  "customerName": "string",
  "contactNumber": "string",
  "serviceType": "dine-in" | "pickup" | "delivery",
  "paymentMethod": "string",
  "total": number,
  "options": {
    "address": "string",
    "landmark": "string",
    "pickupTime": "string",
    "partySize": number,
    "dineInTime": "string",
    "referenceNumber": "string",
    "notes": "string",
    "deliveryFee": number,
    "lalamoveQuotationId": "string",
    "deliveryLat": number,
    "deliveryLng": number
  }
}
```

**Response:**
```json
{
  "order": {...}
}
```

### GET /api/orders/[id]
Fetch a single order by ID.

**Response:**
```json
{
  "order": {...}
}
```

### PATCH /api/orders/[id]
Update an order.

**Request Body:**
```json
{
  "status": "pending" | "confirmed" | "preparing" | "ready" | "out_for_delivery" | "completed" | "cancelled",
  "lalamove_order_id": "string",
  "lalamove_status": "string",
  "lalamove_tracking_url": "string"
}
```

**Response:**
```json
{
  "order": {...}
}
```

### PATCH /api/orders/bulk
Bulk update order statuses.

**Request Body:**
```json
{
  "ids": ["uuid1", "uuid2", ...],
  "status": "pending" | "confirmed" | ...
}
```

**Response:**
```json
{
  "success": true,
  "updated": 2,
  "message": "Successfully updated 2 order(s)"
}
```

### GET /api/orders/stats
Get order statistics.

**Response:**
```json
{
  "stats": {
    "total_orders": 0,
    "pending_orders": 0,
    "today_orders": 0,
    "today_revenue": 0,
    "completed_orders": 0,
    "cancelled_orders": 0
  }
}
```

## Environment Variables

Add to your `.env.local`:

```env
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

**Important**: Never expose the service role key to the client. It should only be used in server-side code.

## Running Tests

### Simple Test Runner (No Dependencies)
```bash
npm run test:api
```

### Jest Tests (Requires Setup)
```bash
npm install --save-dev jest @types/jest ts-jest
npm test
```

## Migration Checklist

- [x] Create server-side Supabase client
- [x] Create API routes for all order operations
- [x] Update useOrders hook to use API routes
- [x] Add input validation and error handling
- [x] Optimize database queries with indexes
- [x] Create comprehensive tests
- [x] Update documentation

## Performance Improvements

1. **Indexes Added:**
   - Composite index on (status, created_at) for common admin queries
   - Index on (service_type, created_at) for service filtering
   - Full-text search index for customer search
   - Partial index for recent orders (last 90 days)

2. **Query Optimizations:**
   - Efficient filtering at database level
   - Reduced data transfer with selective fields
   - Proper use of indexes

3. **Caching Opportunities:**
   - Stats endpoint can be cached (5-10 seconds)
   - Order lists can use stale-while-revalidate pattern

## Next Steps

1. **Deploy Migration**: Run the new migration file
2. **Test in Production**: Verify all endpoints work correctly
3. **Monitor Performance**: Check query performance with new indexes
4. **Add Caching**: Consider adding Redis or similar for stats
5. **Rate Limiting**: Enhance rate limiting with Redis for distributed systems

## Troubleshooting

### API Returns 500 Errors
- Check that `SUPABASE_SERVICE_ROLE_KEY` is set in environment
- Verify Supabase connection is working
- Check server logs for detailed error messages

### Tests Fail
- Ensure API server is running (`npm run dev`)
- Check environment variables are set
- Verify Supabase credentials are correct

### Slow Queries
- Run `ANALYZE` on orders and order_items tables
- Check that indexes are being used (EXPLAIN queries)
- Consider adding more specific indexes based on query patterns

