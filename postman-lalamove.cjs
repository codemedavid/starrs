/**
 * Sample script modeled after the shared Postman collection.
 * 
 * Set environment variables before running:
 *   LALAMOVE_API_KEY
 *   LALAMOVE_API_SECRET
 *   LALAMOVE_MARKET (defaults to HK)
 *   LALAMOVE_SANDBOX (optional, defaults to "true")
 *   LALAMOVE_HOST (optional override for the hostname)
 *
 * Run with:
 *   node postman-lalamove.cjs
 */

const crypto = require('crypto');

const requireEnv = (key) => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing environment variable ${key}`);
  }
  return value;
};

const isSandbox = process.env.LALAMOVE_SANDBOX !== 'false';
const host = process.env.LALAMOVE_HOST || (isSandbox ? 'rest.sandbox.lalamove.com' : 'rest.lalamove.com');
const baseUrl = `https://${host}`;
const apiKey = requireEnv('LALAMOVE_API_KEY');
const apiSecret = requireEnv('LALAMOVE_API_SECRET');
const market = process.env.LALAMOVE_MARKET || 'HK';

const signPayload = (method, path, body) => {
  const timestamp = Date.now().toString();
  const message = `${timestamp}\r\n${method}\r\n${path}\r\n\r\n${body}`;
  const hmac = crypto.createHmac('sha256', apiSecret);
  hmac.update(message);
  return {
    timestamp,
    signature: hmac.digest('base64')
  };
};

const sendRequest = async (method, path, payload = null) => {
  const body = payload ? JSON.stringify(payload) : '';
  const { timestamp, signature } = signPayload(method, path, body);

  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `hmac ${apiKey}:${timestamp}:${signature}`,
      Market: market
    },
    body: body || undefined
  });

  const raw = await response.text();
  const data = raw ? JSON.parse(raw) : null;

  if (!response.ok) {
    const errorDetails = data ? JSON.stringify(data) : raw;
    throw new Error(`${method} ${path} failed (${response.status}): ${errorDetails}`);
  }

  return data;
};

const getQuotePayload = () => ({
  data: {
    serviceType: 'MOTORCYCLE',
    specialRequests: ['TOLL_FEE_10'],
    language: 'en_HK',
    stops: [
      {
        coordinates: {
          lat: '22.33547351186244',
          lng: '114.17615807116502'
        },
        address: 'Innocentre, 72 Tat Chee Ave, Kowloon Tong'
      },
      {
        coordinates: {
          lat: '22.29553167157697',
          lng: '114.16885175766998'
        },
        address: 'Canton Rd, Tsim Sha Tsui'
      }
    ],
    isRouteOptimized: false,
    item: {
      quantity: '12',
      weight: 'LESS_THAN_3_KG',
      categories: ['FOOD_DELIVERY', 'OFFICE_ITEM'],
      handlingInstructions: ['KEEP_UPRIGHT']
    }
  }
});

const placeOrderPayload = (quotationData) => {
  const stops = Array.isArray(quotationData?.stops) ? quotationData.stops : [];
  if (stops.length < 2) {
    throw new Error('Quotation did not return both pickup and dropoff stops');
  }

  return {
    data: {
      quotationId: quotationData.quotationId,
      sender: {
        stopId: stops[0].stopId,
        name: 'Michal',
        phone: '+85238485765'
      },
      recipients: [
        {
          stopId: stops[1].stopId,
          name: 'Katrina',
          phone: '+660923447535',
          remarks: 'YYYYYY'
        }
      ],
      isPODEnabled: true,
      partner: 'Lalamove Partner 1'
    }
  };
};

const logJson = (label, payload) => {
  console.log(`${label}:`);
  console.log(JSON.stringify(payload, null, 2));
};

const run = async () => {
  console.log('Requesting Lalamove quotation…');
  const quoteResponse = await sendRequest('POST', '/v3/quotations', getQuotePayload());
  logJson('Quotation response', quoteResponse);

  const quotationData = quoteResponse.data;
  if (!quotationData) {
    throw new Error('Quotation response missing data payload');
  }

  console.log('\nPlacing Lalamove order…');
  const orderResponse = await sendRequest('POST', '/v3/orders', placeOrderPayload(quotationData));
  logJson('Order response', orderResponse);

  const orderId = orderResponse?.data?.orderId;
  if (orderId) {
    console.log('\nFetching order details…');
    const orderDetails = await sendRequest('GET', `/v3/orders/${orderId}`);
    logJson('Order details', orderDetails);
  }
};

run().catch((err) => {
  console.error('\nLalamove script failed:', err.message);
  process.exit(1);
});
