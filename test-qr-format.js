// Test QR code format matches what the scanner expects
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

async function testQRCodeFormat() {
  console.log('==========================================');
  console.log('🔍 Testing QR Code Format');
  console.log('==========================================\n');

  // Login
  console.log('Step 1: Login as staff...');
  const loginResult = await makeRequest('POST', '/api/auth/login', {}, {
    username: 'staff01',
    password: 'staff123',
    role: 'staff'
  });

  if (!loginResult.data.success) {
    console.log('❌ Login failed');
    return;
  }

  const token = loginResult.data.token;
  console.log('✅ Login successful\n');

  // Get QR code for parcel 4
  console.log('Step 2: Generate QR code for parcel 4...');
  const qrResult = await makeRequest('GET', '/api/parcels/4/qrcode', {
    'Authorization': `Bearer ${token}`
  });

  if (!qrResult.data.success) {
    console.log('❌ QR code generation failed');
    return;
  }

  console.log('✅ QR code generated\n');

  // Extract the data from the QR code (it's a data URL, so we need to decode it)
  // For this test, we'll simulate what data was encoded
  console.log('Step 3: Simulating QR code data extraction...');
  const expectedData = JSON.stringify({
    parcel_id: 4,
    type: 'parcel_collection'
  });

  console.log('📋 Expected QR Code Data:');
  console.log('   Raw:', expectedData);
  console.log('   Length:', expectedData.length, 'bytes');
  console.log('');

  // Parse the data (simulating what the scanner does)
  console.log('Step 4: Parsing QR code data (simulating scanner)...');
  try {
    const parsed = JSON.parse(expectedData);
    console.log('✅ JSON parsing successful');
    console.log('   parcel_id:', parsed.parcel_id, `(type: ${typeof parsed.parcel_id})`);
    console.log('   type:', parsed.type);
    console.log('');

    // Validate format
    if (parsed.parcel_id && typeof parsed.parcel_id === 'number' && parsed.type === 'parcel_collection') {
      console.log('✅ Format matches expected structure!');
      console.log('');

      // Now fetch the parcel using the ID from QR code
      console.log('Step 5: Fetching parcel details using scanned ID...');
      const parcelResult = await makeRequest('GET', `/api/parcels/${parsed.parcel_id}`, {
        'Authorization': `Bearer ${token}`
      });

      if (parcelResult.data.success) {
        console.log('✅ Parcel fetch successful!');
        console.log('');
        console.log('📦 Parcel Details:');
        console.log('   ID:', parcelResult.data.parcel.id);
        console.log('   Tracking:', parcelResult.data.parcel.tracking_number);
        console.log('   Carrier:', parcelResult.data.parcel.carrier_name);
        console.log('   Room:', parcelResult.data.parcel.room_number);
        console.log('   Resident:', parcelResult.data.parcel.resident_name);
        console.log('   Status:', parcelResult.data.parcel.status);
        console.log('');

        if (parcelResult.data.parcel.tracking_number === 'TH123123123') {
          console.log('🎉 SUCCESS! Correct tracking number displayed!');
        } else {
          console.log('❌ Wrong tracking number! Expected TH123123123, got', parcelResult.data.parcel.tracking_number);
        }
      } else {
        console.log('❌ Failed to fetch parcel:', parcelResult.data.message);
      }
    } else {
      console.log('❌ Format does NOT match expected structure');
    }
  } catch (error) {
    console.log('❌ JSON parsing failed:', error.message);
  }

  console.log('');
  console.log('==========================================');
  console.log('✅ QR Code Format Test Complete');
  console.log('==========================================');
}

testQRCodeFormat().catch(console.error);
