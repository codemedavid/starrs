const https = require('https');
const crypto = require('crypto');

// Configuration
const API_KEY = process.env.LALAMOVE_API_KEY;
const SECRET = process.env.LALAMOVE_API_SECRET;
const MARKET = process.env.LALAMOVE_MARKET || 'PH';
const IS_SANDBOX = process.env.LALAMOVE_SANDBOX !== 'false';

if (!API_KEY || !SECRET) {
    console.error('Please set LALAMOVE_API_KEY and LALAMOVE_API_SECRET env vars');
    process.exit(1);
}

const HOST = IS_SANDBOX ? 'rest.sandbox.lalamove.com' : 'rest.lalamove.com';

// Helper to sign and request
async function makeRequest(method, path, bodyData) {
    const body = JSON.stringify(bodyData);
    const time = new Date().getTime().toString();

    // Signature path must include /v3
    const signaturePath = `/v3${path}`;
    const rawSignature = `${time}\r\n${method}\r\n${signaturePath}\r\n\r\n${body}`;
    const signature = crypto.createHmac('sha256', SECRET).update(rawSignature).digest('hex');

    const options = {
        hostname: HOST,
        path: `/v3${path}`, // URL path also needs /v3
        method: method,
        headers: {
            "Content-type": "application/json; charset=utf-8",
            "Authorization": `hmac ${API_KEY}:${time}:${signature}`,
            "Accept": "application/json",
            "Market": MARKET,
        },
    };

    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    resolve({ status: res.statusCode, data: json });
                } catch (e) {
                    resolve({ status: res.statusCode, data: data });
                }
            });
        });

        req.on('error', (e) => reject(e));
        req.write(body);
        req.end();
    });
}

async function runTests() {
    console.log('Running Lalamove Scenarios...');
    console.log(`Market: ${MARKET}, Sandbox: ${IS_SANDBOX}`);

    // Test Case 1: Quotation with valid PH addresses
    // Pickup: Manila City Hall
    // Delivery: Glorietta 4, Makati
    const quotationPayload = {
        data: {
            serviceType: "MOTORCYCLE",
            language: "en_PH",
            stops: [
                {
                    coordinates: {
                        lat: "14.599512",
                        lng: "120.984222",
                    },
                    address: "Manila City Hall, Manila, Philippines",
                },
                {
                    coordinates: {
                        lat: "14.554729",
                        lng: "121.024445",
                    },
                    address: "Glorietta 4, Makati, Philippines",
                },
            ],
            item: {
                quantity: "1",
                weight: "LESS_THAN_3_KG",
                categories: ["FOOD_DELIVERY"],
                handlingInstructions: ["KEEP_UPRIGHT"]
            }
        }
    };

    console.log('\nTesting Quotation...');
    try {
        const quoteRes = await makeRequest('POST', '/quotations', quotationPayload);
        console.log('Status:', quoteRes.status);
        if (quoteRes.status === 201) {
            console.log('✅ Quotation Successful');
            console.log('Quotation ID:', quoteRes.data.data.quotationId);
            console.log('Price:', quoteRes.data.data.priceBreakdown.total);
        } else {
            console.log('❌ Quotation Failed');
            console.log('Response:', JSON.stringify(quoteRes.data, null, 2));
        }
    } catch (e) {
        console.error('Request Error:', e);
    }
}

runTests();
