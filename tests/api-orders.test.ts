/**
 * API Orders Tests
 * 
 * Run with: npx tsx tests/api-orders.test.ts
 * Or add to package.json: "test": "tsx tests/api-orders.test.ts"
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';

// Mock environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321';
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'test-key';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

describe('Orders API', () => {
  let testOrderId: string | null = null;

  beforeAll(() => {
    // Ensure we have required environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.warn('⚠️  Missing Supabase credentials. Tests may fail.');
    }
  });

  afterAll(async () => {
    // Cleanup: Delete test order if created
    if (testOrderId) {
      try {
        await fetch(`${API_BASE_URL}/api/orders/${testOrderId}`, {
          method: 'DELETE',
        });
      } catch (error) {
        // Ignore cleanup errors
      }
    }
  });

  describe('GET /api/orders', () => {
    it('should fetch orders successfully', async () => {
      const response = await fetch(`${API_BASE_URL}/api/orders`);
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty('orders');
      expect(Array.isArray(data.orders)).toBe(true);
    });

    it('should filter orders by status', async () => {
      const response = await fetch(`${API_BASE_URL}/api/orders?status=pending`);
      expect(response.status).toBe(200);
      
      const data = await response.json();
      if (data.orders.length > 0) {
        data.orders.forEach((order: any) => {
          expect(order.status).toBe('pending');
        });
      }
    });

    it('should filter orders by service type', async () => {
      const response = await fetch(`${API_BASE_URL}/api/orders?service_type=delivery`);
      expect(response.status).toBe(200);
      
      const data = await response.json();
      if (data.orders.length > 0) {
        data.orders.forEach((order: any) => {
          expect(order.service_type).toBe('delivery');
        });
      }
    });

    it('should search orders by query', async () => {
      const response = await fetch(`${API_BASE_URL}/api/orders?search=test`);
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty('orders');
    });
  });

  describe('POST /api/orders', () => {
    it('should create an order successfully', async () => {
      const orderData = {
        cartItems: [
          {
            id: 'test-item-1',
            name: 'Test Item',
            quantity: 1,
            totalPrice: 100,
            selectedVariation: null,
            selectedAddOns: null
          }
        ],
        customerName: 'Test Customer',
        contactNumber: '+639123456789',
        serviceType: 'pickup',
        paymentMethod: 'gcash',
        total: 100,
        options: {
          pickupTime: '15-20 minutes'
        }
      };

      const response = await fetch(`${API_BASE_URL}/api/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      expect(response.status).toBe(201);
      
      const data = await response.json();
      expect(data).toHaveProperty('order');
      expect(data.order.order_number).toBeDefined();
      expect(data.order.customer_name).toBe('Test Customer');
      expect(data.order.status).toBe('pending');
      
      testOrderId = data.order.id;
    });

    it('should reject order with missing required fields', async () => {
      const orderData = {
        cartItems: [],
        customerName: 'Test Customer',
        // Missing contactNumber, serviceType, paymentMethod, total
      };

      const response = await fetch(`${API_BASE_URL}/api/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      expect(response.status).toBe(400);
      
      const data = await response.json();
      expect(data).toHaveProperty('error');
    });

    it('should reject order with empty cart', async () => {
      const orderData = {
        cartItems: [],
        customerName: 'Test Customer',
        contactNumber: '+639123456789',
        serviceType: 'pickup',
        paymentMethod: 'gcash',
        total: 100,
      };

      const response = await fetch(`${API_BASE_URL}/api/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      expect(response.status).toBe(400);
      
      const data = await response.json();
      expect(data).toHaveProperty('error');
    });
  });

  describe('GET /api/orders/[id]', () => {
    it('should fetch a single order by ID', async () => {
      if (!testOrderId) {
        console.warn('Skipping test: No test order ID available');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/orders/${testOrderId}`);
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty('order');
      expect(data.order.id).toBe(testOrderId);
    });

    it('should return 404 for non-existent order', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await fetch(`${API_BASE_URL}/api/orders/${fakeId}`);
      expect(response.status).toBe(404);
    });
  });

  describe('PATCH /api/orders/[id]', () => {
    it('should update order status', async () => {
      if (!testOrderId) {
        console.warn('Skipping test: No test order ID available');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/orders/${testOrderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'confirmed' }),
      });

      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.order.status).toBe('confirmed');
    });

    it('should reject invalid status', async () => {
      if (!testOrderId) {
        console.warn('Skipping test: No test order ID available');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/orders/${testOrderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'invalid_status' }),
      });

      expect(response.status).toBe(400);
    });
  });

  describe('PATCH /api/orders/bulk', () => {
    it('should bulk update order statuses', async () => {
      if (!testOrderId) {
        console.warn('Skipping test: No test order ID available');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/orders/bulk`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ids: [testOrderId],
          status: 'preparing'
        }),
      });

      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.updated).toBeGreaterThanOrEqual(0);
    });

    it('should reject bulk update with invalid status', async () => {
      if (!testOrderId) {
        console.warn('Skipping test: No test order ID available');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/orders/bulk`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ids: [testOrderId],
          status: 'invalid_status'
        }),
      });

      expect(response.status).toBe(400);
    });

    it('should reject bulk update with empty IDs array', async () => {
      const response = await fetch(`${API_BASE_URL}/api/orders/bulk`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ids: [],
          status: 'pending'
        }),
      });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/orders/stats', () => {
    it('should fetch order statistics', async () => {
      const response = await fetch(`${API_BASE_URL}/api/orders/stats`);
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty('stats');
      expect(data.stats).toHaveProperty('total_orders');
      expect(data.stats).toHaveProperty('pending_orders');
      expect(data.stats).toHaveProperty('today_orders');
      expect(data.stats).toHaveProperty('today_revenue');
      expect(data.stats).toHaveProperty('completed_orders');
      expect(data.stats).toHaveProperty('cancelled_orders');
      
      // Verify types
      expect(typeof data.stats.total_orders).toBe('number');
      expect(typeof data.stats.pending_orders).toBe('number');
      expect(typeof data.stats.today_orders).toBe('number');
      expect(typeof data.stats.today_revenue).toBe('number');
    });
  });
});

// Simple test runner if not using Jest
if (typeof require !== 'undefined' && require.main === module) {
  console.log('⚠️  This test file requires Jest or a similar test runner.');
  console.log('   Install Jest: npm install --save-dev jest @types/jest ts-jest');
  console.log('   Or use: npx tsx tests/api-orders.test.ts');
}



