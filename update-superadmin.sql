-- Script untuk Update User menjadi Super Admin
-- Database: CryptoSharia

-- Update user superadmin@cryptosharia.com
UPDATE users 
SET 
  role = 'super_admin',
  email_verified = true,
  email_verified_at = NOW(),
  updated_at = NOW()
WHERE email = 'superadmin@cryptosharia.com';

-- Juga update admin@cryptosharia.com (kalau mau pakai ini)
UPDATE users 
SET 
  role = 'super_admin',
  email_verified = true,
  email_verified_at = NOW(),
  updated_at = NOW()
WHERE email = 'admin@cryptosharia.com';

-- Verify hasil update
SELECT 
  id, 
  name, 
  email, 
  role, 
  email_verified,
  email_verified_at,
  created_at
FROM users 
WHERE email IN ('superadmin@cryptosharia.com', 'admin@cryptosharia.com')
ORDER BY created_at DESC;
