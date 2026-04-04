-- Make amr.lotfy.othman@gmail.com an admin
DO $$
BEGIN
    UPDATE users SET role = 'admin' WHERE email = 'amr.lotfy.othman@gmail.com';
END $$;

-- Verify
SELECT email, role FROM users WHERE email = 'amr.lotfy.othman@gmail.com';
