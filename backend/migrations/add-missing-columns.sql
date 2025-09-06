-- Migration script to add missing columns to the delegation_requests table
-- Run this script on your deployed PostgreSQL database to fix the N/A fields issue

-- Check if columns exist before adding them
DO $$ 
BEGIN
    -- Add identity column if it doesn't exist
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

    -- Add security_contact column if it doesn't exist
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

    -- Add details column if it doesn't exist
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

    -- Add website column if it doesn't exist (in case it's also missing)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'delegation_requests' 
        AND column_name = 'website'
    ) THEN
        ALTER TABLE delegation_requests ADD COLUMN website VARCHAR(255);
        RAISE NOTICE 'Added website column';
    ELSE
        RAISE NOTICE 'website column already exists';
    END IF;
END $$;

-- Verify the columns were added
SELECT column_name, data_type, character_maximum_length
FROM information_schema.columns
WHERE table_name = 'delegation_requests'
AND column_name IN ('identity', 'security_contact', 'details', 'website')
ORDER BY column_name;