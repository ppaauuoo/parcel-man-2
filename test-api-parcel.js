// Test script to verify the new GET /parcels/:id endpoint
const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000/api';

// Demo credentials
const STAFF_CREDS = {
  username: 'staff01',
  password: 'staff123',
  role: 'staff'
};

const RESIDENT_CREDS = {
  username: 'resident101',
  password: 'resident123',
  role: 'resident'
};

async function login(credentials) {
  try {
    const response = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });
    const data = await response.json();
    return data.token;
  } catch (error) {
    console.error('Login error:', error.message);
    return null;
  }
}

async function testGetParcelById(token, parcelId, testName) {
  console.log(`\n🧪 Test: ${testName}`);
  console.log(`   Fetching parcel ID: ${parcelId}`);
  
  try {
    const response = await fetch(`${BASE_URL}/parcels/${parcelId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    console.log(`   Status: ${response.status}`);
    
    if (response.ok && data.success) {
      console.log(`   ✅ Success!`);
      console.log(`   📦 Parcel Details:`);
      console.log(`      - ID: ${data.parcel.id}`);
      console.log(`      - Tracking: ${data.parcel.tracking_number}`);
      console.log(`      - Carrier: ${data.parcel.carrier_name}`);
      console.log(`      - Status: ${data.parcel.status}`);
      console.log(`      - Room: ${data.parcel.room_number}`);
      console.log(`      - Resident: ${data.parcel.resident_name}`);
      return data.parcel;
    } else {
      console.log(`   ❌ Error: ${data.message || data.error}`);
      return null;
    }
  } catch (error) {
    console.log(`   ❌ Request failed: ${error.message}`);
    return null;
  }
}

async function runTests() {
  console.log('==========================================');
  console.log('🚀 Testing GET /api/parcels/:id Endpoint');
  console.log('==========================================');
  
  // Login as staff
  console.log('\n📝 Logging in as staff...');
  const staffToken = await login(STAFF_CREDS);
  if (!staffToken) {
    console.log('❌ Staff login failed - cannot continue tests');
    return;
  }
  console.log('✅ Staff login successful');
  
  // Login as resident
  console.log('\n📝 Logging in as resident...');
  const residentToken = await login(RESIDENT_CREDS);
  if (!residentToken) {
    console.log('❌ Resident login failed - cannot continue tests');
    return;
  }
  console.log('✅ Resident login successful');
  
  // Test 1: Staff fetches existing parcel (should succeed)
  await testGetParcelById(staffToken, 4, 'Staff fetches parcel ID 4 (should exist)');
  
  // Test 2: Staff fetches parcel ID 1 (should exist)
  await testGetParcelById(staffToken, 1, 'Staff fetches parcel ID 1 (should exist)');
  
  // Test 3: Staff fetches non-existent parcel (should fail with 404)
  await testGetParcelById(staffToken, 9999, 'Staff fetches non-existent parcel (should 404)');
  
  // Test 4: Resident fetches their own parcel (should succeed)
  await testGetParcelById(residentToken, 1, 'Resident fetches their own parcel (should succeed)');
  
  // Test 5: Resident fetches another resident's parcel (should fail with 403)
  await testGetParcelById(residentToken, 4, 'Resident fetches another\'s parcel (should 403)');
  
  console.log('\n==========================================');
  console.log('✅ All tests completed!');
  console.log('==========================================\n');
}

// Run tests
runTests().catch(console.error);
