#!/usr/bin/env node

/**
 * Simple API Test Runner
 * Tests the order management API endpoints without requiring Jest
 * 
 * Usage: node scripts/test-api.js
 */

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

let testOrderId = null;
let passedTests = 0;
let failedTests = 0;

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function test(name, fn) {
  try {
    await fn();
    log(`✓ ${name}`, 'green');
    passedTests++;
  } catch (error) {
    log(`✗ ${name}: ${error.message}`, 'red');
    failedTests++;
  }
}

async function fetchJSON(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  
  const data = await response.json().catch(() => ({}));
  return { response, data };
}

async function runTests() {
  log('\n🧪 Running API Tests\n', 'blue');

  // Test 1: GET /api/orders
  await test('GET /api/orders - should fetch orders', async () => {
    const { response, data } = await fetchJSON(`${API_BASE_URL}/api/orders`);
    if (response.status !== 200) {
      throw new Error(`Expected 200, got ${response.status}`);
    }
    if (!data.orders || !Array.isArray(data.orders)) {
      throw new Error('Response should contain orders array');
    }
  });

  // Test 2: GET /api/orders with filters
  await test('GET /api/orders?status=pending - should filter by status', async () => {
    const { response, data } = await fetchJSON(`${API_BASE_URL}/api/orders?status=pending`);
    if (response.status !== 200) {
      throw new Error(`Expected 200, got ${response.status}`);
    }
    if (!Array.isArray(data.orders)) {
      throw new Error('Response should contain orders array');
    }
  });

  // Test 3: POST /api/orders
  await test('POST /api/orders - should create an order', async () => {
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

    const { response, data } = await fetchJSON(`${API_BASE_URL}/api/orders`, {
      method: 'POST',
      body: JSON.stringify(orderData),
    });

    if (response.status !== 201) {
      throw new Error(`Expected 201, got ${response.status}: ${data.error || 'Unknown error'}`);
    }
    if (!data.order || !data.order.id) {
      throw new Error('Response should contain order with id');
    }
    testOrderId = data.order.id;
  });

  // Test 4: GET /api/orders/[id]
  await test('GET /api/orders/[id] - should fetch single order', async () => {
    if (!testOrderId) {
      throw new Error('No test order ID available');
    }
    const { response, data } = await fetchJSON(`${API_BASE_URL}/api/orders/${testOrderId}`);
    if (response.status !== 200) {
      throw new Error(`Expected 200, got ${response.status}`);
    }
    if (!data.order || data.order.id !== testOrderId) {
      throw new Error('Response should contain the correct order');
    }
  });

  // Test 5: PATCH /api/orders/[id]
  await test('PATCH /api/orders/[id] - should update order status', async () => {
    if (!testOrderId) {
      throw new Error('No test order ID available');
    }
    const { response, data } = await fetchJSON(`${API_BASE_URL}/api/orders/${testOrderId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'confirmed' }),
    });
    if (response.status !== 200) {
      throw new Error(`Expected 200, got ${response.status}: ${data.error || 'Unknown error'}`);
    }
    if (data.order.status !== 'confirmed') {
      throw new Error('Order status should be updated to confirmed');
    }
  });

  // Test 6: PATCH /api/orders/bulk
  await test('PATCH /api/orders/bulk - should bulk update orders', async () => {
    if (!testOrderId) {
      throw new Error('No test order ID available');
    }
    const { response, data } = await fetchJSON(`${API_BASE_URL}/api/orders/bulk`, {
      method: 'PATCH',
      body: JSON.stringify({
        ids: [testOrderId],
        status: 'preparing'
      }),
    });
    if (response.status !== 200) {
      throw new Error(`Expected 200, got ${response.status}: ${data.error || 'Unknown error'}`);
    }
    if (!data.success) {
      throw new Error('Bulk update should succeed');
    }
  });

  // Test 7: GET /api/orders/stats
  await test('GET /api/orders/stats - should fetch statistics', async () => {
    const { response, data } = await fetchJSON(`${API_BASE_URL}/api/orders/stats`);
    if (response.status !== 200) {
      throw new Error(`Expected 200, got ${response.status}`);
    }
    if (!data.stats) {
      throw new Error('Response should contain stats');
    }
    const requiredFields = ['total_orders', 'pending_orders', 'today_orders', 'today_revenue', 'completed_orders', 'cancelled_orders'];
    for (const field of requiredFields) {
      if (typeof data.stats[field] !== 'number') {
        throw new Error(`Stats should have ${field} as a number`);
      }
    }
  });

  // Test 8: Error handling - invalid status
  await test('PATCH /api/orders/[id] - should reject invalid status', async () => {
    if (!testOrderId) {
      throw new Error('No test order ID available');
    }
    const { response } = await fetchJSON(`${API_BASE_URL}/api/orders/${testOrderId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'invalid_status' }),
    });
    if (response.status !== 400) {
      throw new Error(`Expected 400 for invalid status, got ${response.status}`);
    }
  });

  // Summary
  log('\n📊 Test Summary\n', 'blue');
  log(`Passed: ${passedTests}`, 'green');
  if (failedTests > 0) {
    log(`Failed: ${failedTests}`, 'red');
  }
  log(`Total: ${passedTests + failedTests}\n`, 'blue');

  if (failedTests > 0) {
    process.exit(1);
  }
}

// Check if fetch is available (Node 18+)
if (typeof fetch === 'undefined') {
  log('⚠️  This script requires Node.js 18+ or a fetch polyfill', 'yellow');
  log('   Install node-fetch: npm install node-fetch', 'yellow');
  process.exit(1);
}

runTests().catch(error => {
  log(`\n❌ Test runner error: ${error.message}`, 'red');
  process.exit(1);
});



