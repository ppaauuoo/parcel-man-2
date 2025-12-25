// Test script for photo upload endpoint
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

// Create a small test base64 image (1x1 red pixel JPEG)
const createTestImage = () => {
  // This is a minimal valid JPEG data URL (1x1 red pixel)
  return 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAB//2Q==';
};

async function testPhotoUpload() {
  console.log('==========================================');
  console.log('🧪 Testing Photo Upload Endpoint');
  console.log('==========================================\n');

  // Login as staff
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

  // Test 1: Upload with valid data
  console.log('Test 1: Upload evidence photo for parcel 4...');
  const testImage = createTestImage();
  console.log(`📏 Test image size: ${testImage.length} characters`);
  
  const uploadResult = await makeRequest('POST', '/api/upload/base64-photo', {
    'Authorization': `Bearer ${token}`
  }, {
    image_data: testImage,
    parcel_id: 4,
    photo_type: 'evidence'
  });

  console.log(`📥 Response status: ${uploadResult.status}`);
  
  if (uploadResult.data.success) {
    console.log('✅ Upload successful!');
    console.log(`   Photo path: ${uploadResult.data.photo_path}`);
    console.log(`   Message: ${uploadResult.data.message}`);
  } else {
    console.log('❌ Upload failed:');
    console.log(`   Error: ${uploadResult.data.error}`);
    console.log(`   Message: ${uploadResult.data.message}`);
  }
  console.log('');

  // Test 2: Upload with missing fields
  console.log('Test 2: Upload with missing fields (should fail)...');
  const badResult = await makeRequest('POST', '/api/upload/base64-photo', {
    'Authorization': `Bearer ${token}`
  }, {
    image_data: testImage,
    // missing parcel_id and photo_type
  });

  console.log(`📥 Response status: ${badResult.status}`);
  if (badResult.status === 400) {
    console.log('✅ Correctly rejected (400)');
    console.log(`   Message: ${badResult.data.message}`);
  } else {
    console.log('❌ Unexpected status:', badResult.status);
  }
  console.log('');

  // Test 3: Upload with invalid base64
  console.log('Test 3: Upload with invalid format (should fail)...');
  const invalidResult = await makeRequest('POST', '/api/upload/base64-photo', {
    'Authorization': `Bearer ${token}`
  }, {
    image_data: 'not-a-valid-image',
    parcel_id: 4,
    photo_type: 'evidence'
  });

  console.log(`📥 Response status: ${invalidResult.status}`);
  if (invalidResult.status === 400) {
    console.log('✅ Correctly rejected (400)');
    console.log(`   Message: ${invalidResult.data.message}`);
  } else {
    console.log('❌ Unexpected status:', invalidResult.status);
  }
  console.log('');

  console.log('==========================================');
  console.log('✅ All tests completed!');
  console.log('==========================================');
}

// Run tests
testPhotoUpload().catch(console.error);
