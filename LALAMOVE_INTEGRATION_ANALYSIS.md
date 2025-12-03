# Lalamove Integration Analysis

## Executive Summary

The application integrates Lalamove delivery service for managing delivery orders. The integration follows a multi-layered architecture with client-side quotation fetching, server-side order creation, and automatic order creation when orders are confirmed. The system supports both sandbox and production environments, with proper HMAC authentication and error handling.

## Architecture Overview

### Components

1. **API Route Handler** (`app/api/lalamove/[action]/route.ts`)
   - Handles `/api/lalamove/quote` and `/api/lalamove/order` endpoints
   - Proxies requests to Lalamove API with HMAC-SHA256 authentication
   - Supports both sandbox and production environments
   - Handles quotation fetching and order creation
   - Validates quotation expiration and schedule times
   - Fetches quotation details to extract stop IDs if not provided

2. **Supabase Edge Function** (`supabase/functions/lalamove/index.ts`)
   - Alternative implementation for Lalamove API proxy
   - Uses Deno runtime
   - Similar functionality to Next.js API route
   - Can be used as alternative proxy endpoint

3. **Client Library** (`src/lib/lalamove.ts`)
   - Provides `fetchDeliveryQuotation()` for getting delivery quotes
   - Provides `createDeliveryOrder()` for creating delivery orders
   - Builds configuration from site settings via `buildLalamoveConfig()`
   - Handles proxy URL construction and authentication
   - Supports both Next.js API routes and Supabase Edge Functions

4. **Order Management Integration**
   - **Checkout Flow** (`src/components/Checkout.tsx`): Fetches delivery quotes during checkout
   - **Order Creation** (`src/hooks/useOrders.ts`): Creates Lalamove orders when delivery orders are placed
   - **Order Update** (`app/api/orders/[id]/route.ts`): Automatically creates Lalamove orders when order status changes to "confirmed"

## Data Flow

### 1. Checkout Process (Delivery Quote)

```
User selects delivery → Enters address → Checkout component
  ↓
useEffect triggers when address + coordinates available
  ↓
fetchDeliveryQuotation() → /api/lalamove/quote
  ↓
API route proxies to Lalamove API
  ↓
Quote returned with: quotationId, price, currency, expiresAt
  ↓
Stored in state: deliveryFee, deliveryQuoteId
  ↓
Included in order creation: lalamoveQuotationId
```

### 2. Order Creation (Immediate Lalamove Order)

```
User places order → createOrder() in useOrders hook
  ↓
Order created in database with lalamove_quotation_id
  ↓
If delivery order + quotation ID exists:
  ↓
createDeliveryOrder() → /api/lalamove/order
  ↓
Lalamove order created
  ↓
Order updated with: lalamove_order_id, lalamove_status, lalamove_tracking_url
```

### 3. Order Status Update (Automatic Lalamove Order Creation)

```
Admin updates order status to "confirmed"
  ↓
PATCH /api/orders/[id] route handler
  ↓
Checks conditions:
  - Status changing to "confirmed"
  - Service type is "delivery"
  - lalamove_quotation_id exists
  - lalamove_order_id does NOT exist
  ↓
Background async task (non-blocking):
  ↓
createLalamoveOrder() → /api/lalamove/order
  ↓
Order updated with Lalamove tracking info
```

## Database Schema

The `orders` table includes the following Lalamove-related fields:

```sql
- delivery_fee: numeric(10,2) - Delivery fee from quotation
- lalamove_quotation_id: text - Quotation ID from Lalamove
- lalamove_order_id: text - Order ID from Lalamove (null until order created)
- lalamove_status: text - Status from Lalamove API
- lalamove_tracking_url: text - Share link for tracking delivery
```

## Key Features

### 1. Dual Order Creation Paths

**Path A: Immediate Creation (Checkout)**
- When customer places delivery order, Lalamove order is created immediately
- Implemented in `useOrders.ts` hook
- Runs synchronously but doesn't block order creation if it fails

**Path B: Automatic Creation (Status Update)**
- When admin changes order status to "confirmed", Lalamove order is created automatically
- Implemented in `app/api/orders/[id]/route.ts` PATCH handler
- Runs asynchronously (non-blocking) to avoid delaying order status update
- Prevents duplicate creation by checking for existing `lalamove_order_id`

### 2. Phone Number Normalization

The system normalizes phone numbers for Lalamove API:
- Handles Philippine numbers (starts with 63, 0, or 9)
- Converts to international format (+63...)
- Implemented in multiple places:
  - `app/api/lalamove/[action]/route.ts` (lines 230-243)
  - `app/api/orders/[id]/route.ts` (lines 13-35, 103-116)
  - `src/hooks/useOrders.ts` (lines 59-81)

### 3. Quotation Validation

The order creation handler includes comprehensive quotation validation:
- **Expiration Check**: Validates that quotation hasn't expired (lines 263-278)
- **Schedule Time Check**: Validates scheduled quotations aren't in the past (lines 282-317)
- **Stop ID Extraction**: Fetches quotation to extract stop IDs if not provided (lines 249-339)
- **Error Handling**: Provides detailed error messages for validation failures

### 4. Error Handling

- Lalamove failures don't block order creation/updates
- Errors are logged but don't fail the main operation
- Graceful degradation if Lalamove is unavailable
- Detailed error logging for debugging

### 5. Configuration Management

Lalamove configuration is stored in `site_settings` table:
- `lalamove_market` - Market code (e.g., PH, HK, SG)
- `lalamove_service_type` - Service type (e.g., MOTORCYCLE)
- `lalamove_sandbox` - Sandbox mode flag
- `lalamove_api_key` - API key
- `lalamove_api_secret` - API secret
- `lalamove_store_name` - Store name
- `lalamove_store_phone` - Store phone
- `lalamove_store_address` - Store address
- `lalamove_store_latitude` - Store latitude
- `lalamove_store_longitude` - Store longitude

## API Endpoints

### `/api/lalamove/quote` (POST)
**Purpose**: Get delivery quotation from Lalamove

**Request Body**:
```json
{
  "deliveryAddress": "string",
  "deliveryLat": number,
  "deliveryLng": number,
  "market": "string",
  "serviceType": "string",
  "sandbox": boolean,
  "storeName": "string",
  "storePhone": "string",
  "storeAddress": "string",
  "storeLatitude": number,
  "storeLongitude": number
}
```

**Response**:
```json
{
  "quotationId": "string",
  "price": number,
  "currency": "string",
  "expiresAt": "string"
}
```

**Implementation Details**:
- Creates two stops: store location and delivery address
- Sets item as food delivery with weight < 3kg
- Includes handling instructions: KEEP_UPRIGHT
- Returns quotation ID, price, currency, and expiration time

### `/api/lalamove/order` (POST)
**Purpose**: Create delivery order in Lalamove

**Request Body**:
```json
{
  "quotationId": "string",
  "recipientName": "string",
  "recipientPhone": "string",
  "market": "string",
  "sandbox": boolean,
  "storeName": "string",
  "storePhone": "string",
  "storeAddress": "string",
  "storeLatitude": number,
  "storeLongitude": number,
  "serviceType": "string",
  "senderStopId": "string (optional)",
  "recipientStopId": "string (optional)",
  "recipientRemarks": "string (optional)",
  "metadata": {}
}
```

**Response**:
```json
{
  "orderId": "string",
  "status": "string",
  "shareLink": "string",
  "driverId": "string | null"
}
```

**Implementation Details**:
- Validates quotation expiration before creating order
- Fetches quotation to get stop IDs if not provided
- Normalizes phone numbers to E.164 format
- Enables proof of delivery (POD)
- Includes metadata for order tracking

## Authentication

The Lalamove API uses HMAC-SHA256 authentication:
- **Timestamp-based signature**: Uses current timestamp in milliseconds
- **Signature format**: `hmac {apiKey}:{timestamp}:{signature}`
- **Signature includes**: timestamp, HTTP method, path, and request body
- **Implementation**: `signPayload()` function in `app/api/lalamove/[action]/route.ts`
- **Message format**: `${timestamp}\r\n${method}\r\n${path}\r\n\r\n${body}`

## Market Support

The system supports multiple Lalamove markets with language mapping:
- **HK** (Hong Kong) → `en_HK`
- **SG** (Singapore) → `en_SG`
- **TH** (Thailand) → `th_TH`
- **PH** (Philippines) → `en_PH`
- **TW** (Taiwan) → `zh_TW`
- **MY** (Malaysia) → `ms_MY`
- **VN** (Vietnam) → `vi_VN`
- **Default** → `en_US`

## Issues and Observations

### 1. **Missing UI Display of Lalamove Tracking**
   - **Issue**: The `OrderManager` component doesn't display Lalamove tracking information in the order details modal
   - **Impact**: Admins cannot see Lalamove order ID, status, or tracking URL in the UI
   - **Recommendation**: Add a section in the order details modal to display:
     - Lalamove Order ID (if exists)
     - Lalamove Status
     - Tracking URL (as clickable link)

### 2. **Potential Duplicate Order Creation**
   - **Issue**: Lalamove orders can be created in two places:
     1. Immediately during checkout (`useOrders.ts`)
     2. Automatically when status changes to "confirmed" (`app/api/orders/[id]/route.ts`)
   - **Risk**: If immediate creation fails but order is saved, the automatic creation will trigger, potentially creating duplicate orders
   - **Mitigation**: The automatic creation checks for `!currentOrder?.lalamove_order_id`, which prevents duplicates
   - **Status**: ✅ Properly handled with duplicate prevention

### 3. **Quotation Expiration Handling**
   - **Status**: ✅ **FIXED** - The system now validates quotation expiration before order creation
   - **Implementation**: Lines 263-278 in `app/api/lalamove/[action]/route.ts`
   - **Features**:
     - Checks if quotation has expired
     - Validates scheduled quotation times
     - Provides clear error messages

### 4. **Stop ID Fetching Logic**
   - **Observation**: The order creation handler fetches quotation details to get stop IDs if not provided
   - **Location**: `app/api/lalamove/[action]/route.ts` (lines 249-339)
   - **Note**: This adds an extra API call but ensures stop IDs are available
   - **Status**: ✅ Properly implemented with fallback logic

### 5. **Error Visibility**
   - **Issue**: Lalamove errors are logged to console but may not be visible to admins
   - **Recommendation**: Consider adding error notifications or status indicators in the UI

### 6. **Metadata Usage**
   - **Observation**: The system passes order ID in metadata when creating Lalamove orders
   - **Purpose**: Allows linking Lalamove orders back to internal orders
   - **Status**: ✅ Properly implemented

### 7. **Phone Number Normalization Duplication**
   - **Issue**: Phone number normalization logic is duplicated across multiple files
   - **Impact**: Maintenance burden and potential inconsistencies
   - **Recommendation**: Extract to a shared utility function

### 8. **Two Proxy Implementations**
   - **Observation**: Both Next.js API route and Supabase Edge Function exist
   - **Status**: Next.js route is primary, Edge Function appears to be alternative/legacy
   - **Recommendation**: Document which one is active or consolidate

## Recommendations

### High Priority

1. **Add Lalamove Tracking Display in Order Manager**
   - Display Lalamove order ID, status, and tracking URL in order details modal
   - Add visual indicators for delivery status
   - Make tracking URL clickable
   - Show quotation expiration status

2. **Improve Error Handling UI**
   - Show Lalamove errors in admin dashboard
   - Add retry mechanism for failed Lalamove order creation
   - Display delivery status indicators
   - Add error notifications

3. **Consolidate Phone Number Normalization**
   - Extract phone normalization to shared utility
   - Ensure consistent behavior across all implementations
   - Add unit tests for edge cases

### Medium Priority

4. **Add Lalamove Status Sync**
   - Implement webhook or polling to sync Lalamove order status
   - Update order status based on Lalamove delivery status
   - Add status change notifications
   - Auto-update order status when delivery completes

5. **Add Delivery Fee Display**
   - Show delivery fee breakdown in order details
   - Display delivery fee in order list view
   - Show quotation expiration time

6. **Add Lalamove Order Cancellation**
   - Allow admins to cancel Lalamove orders
   - Handle cancellation in order management flow
   - Update order status when cancelled

7. **Document Proxy Implementation**
   - Clarify which proxy implementation is active
   - Document when to use Edge Function vs API route
   - Remove or deprecate unused implementation

### Low Priority

8. **Add Lalamove Analytics**
   - Track delivery success rates
   - Monitor delivery times
   - Analyze delivery costs
   - Track quotation expiration rates

9. **Add Delivery Time Estimates**
   - Display estimated delivery time from Lalamove
   - Show driver ETA if available
   - Update ETA in real-time

10. **Add Quotation Refresh**
    - Allow refreshing expired quotations
    - Show quotation expiration warnings
    - Auto-refresh quotations before expiration

## Code Quality Observations

### Strengths

1. **Separation of Concerns**: Clear separation between API proxy, client library, and business logic
2. **Error Resilience**: Lalamove failures don't break order creation
3. **Configuration Management**: Centralized configuration in site settings
4. **Type Safety**: Proper TypeScript types for Lalamove data structures
5. **Non-blocking Operations**: Automatic Lalamove order creation runs asynchronously
6. **Quotation Validation**: Comprehensive validation of quotations before use
7. **Duplicate Prevention**: Proper checks to prevent duplicate order creation
8. **Phone Normalization**: Consistent phone number formatting

### Areas for Improvement

1. **Error Visibility**: Errors are logged but not surfaced to users
2. **UI Integration**: Lalamove data is stored but not displayed in UI
3. **Code Duplication**: Phone normalization logic duplicated across files
4. **Testing**: No visible test coverage for Lalamove integration
5. **Documentation**: Limited inline documentation for complex flows
6. **Proxy Implementation**: Two implementations exist, unclear which is primary

## Testing Recommendations

1. **Unit Tests**
   - Test quotation fetching with various addresses
   - Test order creation with valid/invalid quotations
   - Test phone number normalization edge cases
   - Test quotation expiration validation
   - Test stop ID extraction logic

2. **Integration Tests**
   - Test complete checkout flow with delivery
   - Test automatic order creation on status update
   - Test error handling scenarios
   - Test duplicate prevention logic
   - Test quotation expiration handling

3. **E2E Tests**
   - Test delivery order placement end-to-end
   - Test order status update triggering Lalamove creation
   - Test tracking URL accessibility
   - Test quotation refresh flow

## Security Considerations

1. **API Keys**: Stored in environment variables and site settings (encrypted at rest)
2. **HMAC Authentication**: Properly implemented for Lalamove API
3. **CORS Headers**: Configured for API routes
4. **Input Validation**: Address and coordinates are validated before API calls
5. **Error Messages**: Don't expose sensitive information in error responses

## Environment Variables Required

```env
# Lalamove API Credentials
LALAMOVE_API_KEY=pk_xxx
LALAMOVE_API_SECRET=sk_xxx

# Proxy Configuration (optional)
NEXT_PUBLIC_LALAMOVE_FUNCTION_URL=/api/lalamove
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx (for proxy authentication)
NEXT_PUBLIC_APP_URL=http://localhost:3000 (for server-side requests)
```

## API Request Flow

### Quotation Request
```
Client → /api/lalamove/quote
  ↓
Next.js API Route → Lalamove API
  ↓
HMAC Signature Generation
  ↓
POST /v3/quotations
  ↓
Response: quotationId, price, currency, expiresAt
```

### Order Creation Request
```
Client → /api/lalamove/order
  ↓
Next.js API Route
  ↓
Validate Quotation (expiration, schedule)
  ↓
Fetch Quotation (if stop IDs missing)
  ↓
HMAC Signature Generation
  ↓
POST /v3/orders
  ↓
Response: orderId, status, shareLink, driverId
```

## Conclusion

The Lalamove integration is well-architected with proper error handling, quotation validation, and separation of concerns. The system includes comprehensive validation for quotation expiration and schedule times, preventing common issues. The dual order creation paths provide redundancy with proper duplicate prevention.

**Key Strengths**:
- ✅ Comprehensive quotation validation
- ✅ Duplicate prevention
- ✅ Error resilience
- ✅ Phone number normalization
- ✅ Non-blocking operations

**Main Gaps**:
- ❌ UI visibility of Lalamove tracking information
- ❌ Error visibility to admins
- ❌ Code duplication in phone normalization
- ❌ Limited test coverage

The integration is production-ready but would benefit from improved UI integration and error visibility.
