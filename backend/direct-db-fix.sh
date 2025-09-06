#!/bin/bash

# Direct database fix - adds missing columns to existing database

echo "===== DIRECT DATABASE FIX ====="
echo "Adding missing columns to existing database..."
echo ""

# Run the ALTER TABLE commands directly
docker exec validator-postgres psql -U validator_user -d validator_db << EOF
-- Add missing columns if they don't exist
DO \$\$
BEGIN
    -- Check and add identity column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'delegation_requests' 
        AND column_name = 'identity'
    ) THEN
        ALTER TABLE delegation_requests ADD COLUMN identity VARCHAR(255);
        RAISE NOTICE 'Added identity column';
    ELSE
        RAISE NOTICE 'identity column already exists';
    END IF;

    -- Check and add security_contact column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'delegation_requests' 
        AND column_name = 'security_contact'
    ) THEN
        ALTER TABLE delegation_requests ADD COLUMN security_contact VARCHAR(255);
        RAISE NOTICE 'Added security_contact column';
    ELSE
        RAISE NOTICE 'security_contact column already exists';
    END IF;

    -- Check and add details column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'delegation_requests' 
        AND column_name = 'details'
    ) THEN
        ALTER TABLE delegation_requests ADD COLUMN details TEXT;
        RAISE NOTICE 'Added details column';
    ELSE
        RAISE NOTICE 'details column already exists';
    END IF;
END \$\$;

-- Show the columns to verify
\d delegation_requests
EOF

echo ""
echo "===== FIX COMPLETE ====="
echo "The columns should now be added to your database."
echo "Test by submitting a new request at: https://delegate.udhaykumarbala.dev/request.html"