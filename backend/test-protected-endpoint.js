const fetch = require('node-fetch');

async function testProtectedEndpoint() {
    const baseUrl = 'http://localhost:3000';
    const correctPassword = 'secure-api-key-change-this'; // From .env file
    const wrongPassword = 'wrong-password';
    
    console.log('===== TESTING PROTECTED VALIDATORS ENDPOINT =====\n');
    
    // Test 1: No password
    console.log('1. Testing without password...');
    try {
        const response = await fetch(`${baseUrl}/api/validators/processed`);
        const result = await response.json();
        console.log(`   Status: ${response.status}`);
        console.log(`   Response: ${JSON.stringify(result, null, 2)}\n`);
    } catch (error) {
        console.error('   Error:', error.message, '\n');
    }
    
    // Test 2: Wrong password via query parameter
    console.log('2. Testing with wrong password (query param)...');
    try {
        const response = await fetch(`${baseUrl}/api/validators/processed?access_password=${wrongPassword}`);
        const result = await response.json();
        console.log(`   Status: ${response.status}`);
        console.log(`   Response: ${JSON.stringify(result, null, 2)}\n`);
    } catch (error) {
        console.error('   Error:', error.message, '\n');
    }
    
    // Test 3: Correct password via query parameter
    console.log('3. Testing with correct password (query param)...');
    try {
        const response = await fetch(`${baseUrl}/api/validators/processed?access_password=${correctPassword}`);
        const result = await response.json();
        console.log(`   Status: ${response.status}`);
        console.log(`   Success: ${result.success}`);
        console.log(`   Count: ${result.count}`);
        if (result.data && result.data.length > 0) {
            console.log(`   First validator:`, JSON.stringify(result.data[0], null, 2).substring(0, 500) + '...');
        } else {
            console.log(`   Data: ${JSON.stringify(result.data)}`);
        }
        console.log();
    } catch (error) {
        console.error('   Error:', error.message, '\n');
    }
    
    // Test 4: Correct password via header
    console.log('4. Testing with correct password (header)...');
    try {
        const response = await fetch(`${baseUrl}/api/validators/processed`, {
            headers: {
                'x-access-password': correctPassword
            }
        });
        const result = await response.json();
        console.log(`   Status: ${response.status}`);
        console.log(`   Success: ${result.success}`);
        console.log(`   Count: ${result.count}`);
        console.log();
    } catch (error) {
        console.error('   Error:', error.message, '\n');
    }
    
    console.log('===== TEST COMPLETE =====');
}

// Run the test
testProtectedEndpoint();