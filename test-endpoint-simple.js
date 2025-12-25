// Simple test script for the new endpoint
const http = require('http');

function makeRequest(method, path, headers = {}, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function runTests() {
  console.log('========================================');
  console.log('Testing GET /api/parcels/:id endpoint');
  console.log('========================================\n');

  // Step 1: Login
  console.log('Step 1: Login as staff...');
  const loginResult = await makeRequest('POST', '/api/auth/login', {}, {
    username: 'staff01',
    password: 'staff123',
    role: 'staff'
  });

  if (!loginResult.data.success) {
    console.log('❌ Login failed:', loginResult.data);
    return;
  }

  const token = loginResult.data.token;
  console.log('✅ Login successful');
  console.log('   Token:', token.substring(0, 50) + '...\n');

  // Step 2: Test GET /api/parcels/4
  console.log('Step 2: GET /api/parcels/4 (should show TH123123123)...');
  const result4 = await makeRequest('GET', '/api/parcels/4', {
    'Authorization': `Bearer ${token}`
  });

  if (result4.data.success) {
    console.log('✅ Success! Parcel details:');
    console.log('   ID:', result4.data.parcel.id);
    console.log('   Tracking:', result4.data.parcel.tracking_number);
    console.log('   Carrier:', result4.data.parcel.carrier_name);
    console.log('   Room:', result4.data.parcel.room_number);
    console.log('   Resident:', result4.data.parcel.resident_name);
    console.log('   Status:', result4.data.parcel.status);
  } else {
    console.log('❌ Error:', result4.data);
  }
  console.log('');

  // Step 3: Test GET /api/parcels/1
  console.log('Step 3: GET /api/parcels/1...');
  const result1 = await makeRequest('GET', '/api/parcels/1', {
    'Authorization': `Bearer ${token}`
  });

  if (result1.data.success) {
    console.log('✅ Success! Tracking:', result1.data.parcel.tracking_number);
  } else {
    console.log('❌ Error:', result1.data);
  }
  console.log('');

  // Step 4: Test GET /api/parcels/9999 (should 404)
  console.log('Step 4: GET /api/parcels/9999 (should return 404)...');
  const result9999 = await makeRequest('GET', '/api/parcels/9999', {
    'Authorization': `Bearer ${token}`
  });

  console.log('   Status:', result9999.status);
  console.log('   Response:', result9999.data.message);
  console.log('');

  console.log('========================================');
  console.log('✅ All tests completed!');
  console.log('========================================');
}

runTests().catch(console.error);
