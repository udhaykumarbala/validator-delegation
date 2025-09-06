const fetch = require('node-fetch');

// Test data with ALL fields populated
const testRequest = {
    // Validator Information
    moniker: "Test Validator " + Date.now(),
    identity: "KEYBASE123",
    website: "https://testvalidator.com",
    security_contact: "security@testvalidator.com",
    details: "This is a test validator with extensive experience in blockchain operations",
    
    // Technical Details
    commission_rate: "5",
    withdrawal_fee: "2000000",
    pubkey: "0x" + Math.random().toString(36).substring(2) + "a".repeat(80),
    signature: "0x" + "b".repeat(192),
    
    // Contact Information
    operator_name: "Test Operator",
    operator_email: "test@operator.com",
    operator_wallet: "0x" + "c".repeat(40),
    operator_telegram: "@testoperator",
    
    // Network
    network: "mock"
};

async function testRemoteFieldStorage() {
    const baseUrl = 'https://delegate.udhaykumarbala.dev';
    
    console.log('===== TESTING REMOTE FIELD STORAGE =====\n');
    console.log('Target URL:', baseUrl);
    console.log('\n1. Submitting request with all fields...');
    console.log('Fields being sent:');
    Object.keys(testRequest).forEach(key => {
        console.log(`  - ${key}: ${testRequest[key]}`);
    });
    
    try {
        // Submit the request
        const submitResponse = await fetch(`${baseUrl}/api/requests`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(testRequest)
        });
        
        const submitResult = await submitResponse.json();
        
        if (!submitResult.success) {
            console.error('\n❌ Failed to submit request:', submitResult.error);
            return;
        }
        
        const requestId = submitResult.data.id;
        console.log(`\n✅ Request submitted successfully with ID: ${requestId}`);
        
        // Retrieve the request
        console.log('\n2. Retrieving request from database...');
        const getResponse = await fetch(`${baseUrl}/api/requests/${requestId}`);
        const getResult = await getResponse.json();
        
        if (!getResult.success) {
            console.error('\n❌ Failed to retrieve request:', getResult.error);
            return;
        }
        
        const savedRequest = getResult.data.request;
        console.log('\n3. Comparing submitted vs retrieved fields:\n');
        
        let allFieldsMatch = true;
        const fieldStatus = [];
        const problemFields = [];
        
        // Check each field
        Object.keys(testRequest).forEach(key => {
            const submitted = testRequest[key];
            const retrieved = savedRequest[key];
            const match = submitted === String(retrieved);
            
            if (!match && retrieved !== null && retrieved !== undefined) {
                // Some fields might be stored differently (e.g., numbers)
                if (String(submitted) === String(retrieved)) {
                    fieldStatus.push(`✅ ${key}: MATCH (type conversion)`);
                } else {
                    fieldStatus.push(`❌ ${key}: MISMATCH - Sent: "${submitted}" | Got: "${retrieved}"`);
                    allFieldsMatch = false;
                    problemFields.push(key);
                }
            } else if (retrieved === null || retrieved === undefined) {
                fieldStatus.push(`❌ ${key}: MISSING - Not saved/retrieved`);
                allFieldsMatch = false;
                problemFields.push(key);
            } else {
                fieldStatus.push(`✅ ${key}: MATCH`);
            }
        });
        
        fieldStatus.forEach(status => console.log(status));
        
        // Check for extra fields in database
        console.log('\n4. Additional fields in database:');
        Object.keys(savedRequest).forEach(key => {
            if (!testRequest.hasOwnProperty(key)) {
                console.log(`  - ${key}: ${savedRequest[key]}`);
            }
        });
        
        console.log('\n===== TEST RESULTS =====');
        if (allFieldsMatch) {
            console.log('✅ SUCCESS: All fields are correctly stored and retrieved!');
        } else {
            console.log('❌ FAILURE: Some fields are not correctly stored or retrieved.');
            console.log('\nProblem fields:', problemFields.join(', '));
            
            // Specific check for the reported fields
            console.log('\n===== SPECIFIC FIELD CHECK =====');
            console.log('identity:', savedRequest.identity || 'NOT FOUND');
            console.log('security_contact:', savedRequest.security_contact || 'NOT FOUND');
            console.log('details:', savedRequest.details || 'NOT FOUND');
        }
        
        // Return the request ID for manual verification
        console.log('\n📋 You can verify this request in the admin panel:');
        console.log(`${baseUrl}/admin.html`);
        console.log(`Request ID: ${requestId}`);
        
    } catch (error) {
        console.error('\n❌ Error during test:', error.message);
    }
}

// Run the test
testRemoteFieldStorage();