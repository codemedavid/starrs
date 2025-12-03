/*
  # Optimize Order Queries
  
  Add additional indexes to improve query performance for order management.
*/

-- Index for filtering by status and date (common admin query)
CREATE INDEX IF NOT EXISTS idx_orders_status_created_at ON orders(status, created_at DESC);

-- Index for service type filtering
CREATE INDEX IF NOT EXISTS idx_orders_service_type_created ON orders(service_type, created_at DESC);

-- Index for customer search (name and contact)
CREATE INDEX IF NOT EXISTS idx_orders_customer_search ON orders USING gin(
  to_tsvector('english', customer_name || ' ' || COALESCE(contact_number, '') || ' ' || COALESCE(order_number, ''))
);

-- Composite index for date range queries with status
CREATE INDEX IF NOT EXISTS idx_orders_date_status ON orders(created_at DESC, status) 
WHERE created_at >= NOW() - INTERVAL '90 days';

-- Index for order items lookup (already exists but ensure it's optimized)
CREATE INDEX IF NOT EXISTS idx_order_items_order_id_created ON order_items(order_id, created_at DESC);

-- Analyze tables to update statistics
ANALYZE orders;
ANALYZE order_items;



