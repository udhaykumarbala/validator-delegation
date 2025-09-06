const fetch = require('node-fetch');

async function fullDiagnostic() {
    const baseUrl = 'https://delegate.udhaykumarbala.dev';
    
    console.log('===== FULL SYSTEM DIAGNOSTIC =====\n');
    
    // Test 1: Check what fields the API accepts
    console.log('1. Testing API field acceptance...');
    const testData = {
        moniker: "Diagnostic Test " + Date.now(),
        identity: "DIAGNOSTIC_ID",
        website: "https://diagnostic.test",
        security_contact: "diagnostic@test.com",
        details: "This is a diagnostic test with all fields",
        commission_rate: "5",
        withdrawal_fee: "1000000",
        pubkey: "0xdiag" + Math.random().toString(36).substring(2) + "test".repeat(20),
        signature: "0x" + "d".repeat(192),
        operator_name: "Diagnostic Operator",
        operator_email: "diag@test.com",
        operator_wallet: "0x" + "e".repeat(40),
        operator_telegram: "@diagnostic",
        network: "mock"
    };
    
    console.log('Sending fields:', Object.keys(testData).join(', '));
    
    try {
        // Submit the request
        const submitResponse = await fetch(`${baseUrl}/api/requests`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(testData)
        });
        
        const submitText = await submitResponse.text();
        let submitResult;
        
        try {
            submitResult = JSON.parse(submitText);
        } catch (e) {
            console.error('Failed to parse response:', submitText);
            return;
        }
        
        if (!submitResult.success) {
            console.error('❌ API rejected request:', submitResult.error);
            return;
        }
        
        const requestId = submitResult.data.id;
        console.log('✅ Request accepted with ID:', requestId);
        
        // Test 2: Retrieve and check what was saved
        console.log('\n2. Retrieving saved data...');
        const getResponse = await fetch(`${baseUrl}/api/requests/${requestId}`);
        const getResult = await getResponse.json();
        
        if (!getResult.success) {
            console.error('❌ Failed to retrieve:', getResult.error);
            return;
        }
        
        const saved = getResult.data.request;
        
        console.log('\n3. Field-by-field comparison:');
        console.log('─'.repeat(50));
        
        const criticalFields = ['identity', 'security_contact', 'details'];
        const fieldStatus = {};
        
        Object.keys(testData).forEach(field => {
            const sent = testData[field];
            const received = saved[field];
            const isCritical = criticalFields.includes(field);
            
            if (received === undefined || received === null) {
                fieldStatus[field] = 'MISSING';
                console.log(`${isCritical ? '❌' : '⚠️ '} ${field}:`);
                console.log(`   Sent: "${sent}"`);
                console.log(`   Got:  NOT IN RESPONSE`);
            } else if (String(sent) === String(received)) {
                fieldStatus[field] = 'OK';
                console.log(`✅ ${field}: OK`);
            } else {
                fieldStatus[field] = 'MISMATCH';
                console.log(`❌ ${field}:`);
                console.log(`   Sent: "${sent}"`);
                console.log(`   Got:  "${received}"`);
            }
        });
        
        console.log('\n4. Summary:');
        console.log('─'.repeat(50));
        const missing = Object.entries(fieldStatus).filter(([k,v]) => v === 'MISSING');
        const mismatched = Object.entries(fieldStatus).filter(([k,v]) => v === 'MISMATCH');
        
        if (missing.length > 0) {
            console.log('❌ Missing fields:', missing.map(([k]) => k).join(', '));
        }
        if (mismatched.length > 0) {
            console.log('❌ Mismatched fields:', mismatched.map(([k]) => k).join(', '));
        }
        
        if (missing.length === 0 && mismatched.length === 0) {
            console.log('✅ All fields are correctly saved and retrieved!');
        } else {
            console.log('\n5. Diagnosis:');
            console.log('─'.repeat(50));
            
            const criticalMissing = missing.filter(([k]) => criticalFields.includes(k));
            if (criticalMissing.length > 0) {
                console.log('🔴 CRITICAL: The following fields are not being saved:');
                criticalMissing.forEach(([field]) => {
                    console.log(`   - ${field}`);
                });
                console.log('\nThis indicates the database is missing these columns.');
                console.log('The PostgreSQL database needs to be updated with these columns.');
            }
        }
        
        console.log('\n6. Raw response data (first 500 chars):');
        console.log(JSON.stringify(saved, null, 2).substring(0, 500) + '...');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
    
    console.log('\n===== DIAGNOSTIC COMPLETE =====');
}

fullDiagnostic();