/**
 * Test script for OpenStreetMap Nominatim address autocomplete
 * This tests the API directly to verify it's working correctly
 */

const testAddressAutocomplete = async (query) => {
  console.log(`\n🔍 Testing address autocomplete for: "${query}"\n`);

  try {
    const params = new URLSearchParams({
      q: `${query}, Philippines`,
      countrycodes: 'ph',
      format: 'json',
      limit: '10',
      addressdetails: '1',
      extratags: '1',
      namedetails: '1',
      dedupe: '1'
    });

    const url = `https://nominatim.openstreetmap.org/search?${params.toString()}`;
    console.log(`📡 Request URL: ${url}\n`);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'WhitelabelDeliveryApp/1.0',
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    console.log(`✅ Success! Received ${data.length} suggestions\n`);

    if (data.length === 0) {
      console.log('⚠️  No suggestions found for this query.\n');
      return;
    }

    // Display first 3 suggestions
    console.log('📍 Top Suggestions:\n');
    data.slice(0, 3).forEach((item, index) => {
      console.log(`${index + 1}. ${item.display_name}`);
      console.log(`   Type: ${item.type || 'N/A'}`);
      console.log(`   Importance: ${item.importance || 'N/A'}`);
      if (item.address) {
        const addr = item.address;
        const addressParts = [
          addr.house_number && addr.road ? `${addr.house_number} ${addr.road}` : addr.road,
          addr.barangay || addr.village,
          addr.city || addr.town || addr.municipality,
          addr.province || addr.state
        ].filter(Boolean);
        console.log(`   Formatted: ${addressParts.join(', ')}`);
      }
      console.log(`   Coordinates: ${item.lat}, ${item.lon}\n`);
    });

    return data;
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.cause) {
      console.error('   Cause:', error.cause);
    }
    throw error;
  }
};

// Test cases
const testCases = [
  'Makati',
  'Quezon City',
  'Manila',
  'BGC',
  '123 Main Street'
];

(async () => {
  console.log('🧪 Testing OpenStreetMap Nominatim Address Autocomplete\n');
  console.log('='.repeat(60));

  for (const testCase of testCases) {
    try {
      await testAddressAutocomplete(testCase);
      // Rate limiting: wait 1 second between requests
      if (testCase !== testCases[testCases.length - 1]) {
        console.log('⏳ Waiting 1 second (rate limit)...\n');
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error) {
      console.error(`Failed to test "${testCase}":`, error.message);
    }
  }

  console.log('='.repeat(60));
  console.log('\n✅ All tests completed!\n');
})();

