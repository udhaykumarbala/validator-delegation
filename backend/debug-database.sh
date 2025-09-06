#!/bin/bash

echo "===== DATABASE DEBUG SCRIPT ====="
echo ""

# First, check if the container is running
echo "1. Checking Docker containers..."
docker ps | grep postgres

echo ""
echo "2. Checking current database columns..."
docker exec validator-postgres psql -U validator_user -d validator_db -c "SELECT column_name FROM information_schema.columns WHERE table_name = 'delegation_requests' ORDER BY ordinal_position;"

echo ""
echo "3. Checking specifically for our problem columns..."
docker exec validator-postgres psql -U validator_user -d validator_db -c "SELECT column_name FROM information_schema.columns WHERE table_name = 'delegation_requests' AND column_name IN ('identity', 'security_contact', 'details');"

echo ""
echo "4. Attempting to add columns with explicit ALTER commands..."
docker exec validator-postgres psql -U validator_user -d validator_db -c "ALTER TABLE delegation_requests ADD COLUMN identity VARCHAR(255);" 2>&1 || echo "identity column might already exist or error occurred"

docker exec validator-postgres psql -U validator_user -d validator_db -c "ALTER TABLE delegation_requests ADD COLUMN security_contact VARCHAR(255);" 2>&1 || echo "security_contact column might already exist or error occurred"

docker exec validator-postgres psql -U validator_user -d validator_db -c "ALTER TABLE delegation_requests ADD COLUMN details TEXT;" 2>&1 || echo "details column might already exist or error occurred"

echo ""
echo "5. Verifying columns after adding..."
docker exec validator-postgres psql -U validator_user -d validator_db -c "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'delegation_requests' AND column_name IN ('identity', 'security_contact', 'details', 'moniker', 'operator_name');"

echo ""
echo "6. Testing with a direct INSERT..."
TEST_ID="test-$(date +%s)"
docker exec validator-postgres psql -U validator_user -d validator_db -c "INSERT INTO delegation_requests (id, moniker, identity, security_contact, details, pubkey, signature, commission_rate, withdrawal_fee, operator_name, operator_email, operator_wallet) VALUES ('$TEST_ID', 'TestMoniker', 'TestIdentity', 'test@security.com', 'Test details here', 'pubkey123', 'sig123', 5, '1000000', 'Test Op', 'test@email.com', '0xtest');"

echo ""
echo "7. Retrieving the test record to verify fields..."
docker exec validator-postgres psql -U validator_user -d validator_db -c "SELECT id, moniker, identity, security_contact, details FROM delegation_requests WHERE id = '$TEST_ID';"

echo ""
echo "8. Cleaning up test record..."
docker exec validator-postgres psql -U validator_user -d validator_db -c "DELETE FROM delegation_requests WHERE id = '$TEST_ID';"

echo ""
echo "===== DEBUG COMPLETE ====="